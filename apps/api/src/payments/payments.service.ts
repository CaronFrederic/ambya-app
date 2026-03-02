import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { AppointmentStatus, LoyaltyTier, LoyaltyReason, PaymentStatus, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { UpdateIntentStatusDto } from './dto/update-intent-status.dto'

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // règle bêta simple : commission fixe en %
  private readonly platformFeePct = 10 // 10%

  listMyIntents(userId: string) {
    return this.prisma.paymentIntent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  async createIntent(userId: string, dto: CreatePaymentIntentDto) {
    // validations légères
    if (dto.amount <= 0) throw new BadRequestException('amount must be > 0')
    const currency = dto.currency.trim().toUpperCase()

    const loyalty = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
      select: { pendingDiscountAmount: true, pendingDiscountTier: true },
    })

    const pendingDiscountAmount = loyalty?.pendingDiscountAmount ?? 0
    const discountAmount = Math.min(dto.amount, Math.max(0, pendingDiscountAmount))
    const payableAmount = Math.max(0, dto.amount - discountAmount)
    const appliedDiscountTier = discountAmount > 0 ? loyalty?.pendingDiscountTier ?? null : null

    // si on lie à un paymentMethod, on vérifie qu’il appartient à l’utilisateur
    let pm: { provider: string | null } | null = null
    if (dto.paymentMethodId) {
      const found = await this.prisma.paymentMethod.findUnique({
        where: { id: dto.paymentMethodId },
        select: { userId: true, isActive: true, provider: true },
      })
      if (!found || !found.isActive) throw new BadRequestException('Invalid paymentMethodId')
      if (found.userId !== userId) throw new ForbiddenException('Not allowed')
      pm = { provider: found.provider }
    }

    // commission calculation (simple)
    const platformFeeAmount = Math.floor((payableAmount * this.platformFeePct) / 100)
    const providerFeeAmount = 0
    const netAmount = Math.max(0, payableAmount - platformFeeAmount - providerFeeAmount)

    // provider (priorité: dto.provider sinon provider du PM)
    const provider = (dto.provider ?? pm?.provider ?? null) as string | null

    return this.prisma.paymentIntent.create({
      data: {
        userId,
        salonId: dto.salonId ?? null,
        appointmentId: dto.appointmentId ?? null,
        amount: dto.amount,
        currency,
        status: PaymentStatus.CREATED,
        provider,
        providerRef: null,
        providerData: Prisma.DbNull,
        platformFeeAmount,
        providerFeeAmount,
        netAmount,
        discountAmount,
        payableAmount,
        appliedDiscountTier,
      },
    })
  }

  async updateStatus(
    user: { userId: string; role: 'CLIENT' | 'PROFESSIONAL' | 'EMPLOYEE' | 'ADMIN' },
    id: string,
    dto: UpdateIntentStatusDto,
  ) {
    const intent = await this.prisma.paymentIntent.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    })

    if (!intent) throw new NotFoundException('Payment intent not found')
    if (intent.userId !== user.userId) throw new ForbiddenException('Not allowed')

    // ✅ Option A: role-based permissions (cash safe)
    const isClient = user.role === 'CLIENT'
    const isStaff = user.role === 'PROFESSIONAL' || user.role === 'EMPLOYEE'
    const isAdmin = user.role === 'ADMIN'

    if (dto.status === PaymentStatus.SUCCEEDED && isClient) {
      throw new ForbiddenException('CLIENT cannot mark payment as SUCCEEDED')
    }
    if (dto.status === PaymentStatus.REFUNDED && !(isStaff || isAdmin)) {
      throw new ForbiddenException('Only staff/admin can refund')
    }

    // transitions
    const from = intent.status
    const to = dto.status

    const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
      CREATED: [PaymentStatus.PENDING, PaymentStatus.CANCELLED],
      PENDING: [PaymentStatus.SUCCEEDED, PaymentStatus.FAILED, PaymentStatus.CANCELLED],
      SUCCEEDED: [PaymentStatus.REFUNDED],
      FAILED: [],
      CANCELLED: [],
      REFUNDED: [],
    }

    if (!allowedTransitions[from].includes(to)) {
      throw new BadRequestException(`Invalid transition: ${from} -> ${to}`)
    }

    return this.prisma.$transaction(async (tx) => {
      // reload full intent inside tx (needs appointmentId + amounts)
      const full = await tx.paymentIntent.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          status: true,
          appointmentId: true,
          salonId: true,
          amount: true,
          payableAmount: true,
          discountAmount: true,
          appliedDiscountTier: true,
        },
      })
      if (!full) throw new NotFoundException('Payment intent not found')
      if (full.userId !== user.userId) throw new ForbiddenException('Not allowed')

      const updatedIntent = await tx.paymentIntent.update({
        where: { id },
        data: {
          status: dto.status,
          providerRef: dto.providerRef ?? undefined,
          providerData: dto.providerData === undefined ? undefined : dto.providerData,
        },
      })

      // --- Cascade effects only when SUCCEEDED ---
      if (dto.status === PaymentStatus.SUCCEEDED) {
        // 1) Confirm appointment if linked
        if (full.appointmentId) {
          await tx.appointment.update({
            where: { id: full.appointmentId },
            data: { status: AppointmentStatus.CONFIRMED },
          })
        }

        // 2) Loyalty: award points based on payableAmount (cash ok)
        const payable =
          full.payableAmount && full.payableAmount > 0 ? full.payableAmount : full.amount
        const earnedPoints = Math.floor(payable / 100) // beta rule: 1 point / 100 XAF

        const loyalty = await tx.loyaltyAccount.upsert({
          where: { userId: user.userId },
          create: {
            userId: user.userId,
            tier: 'BRONZE',
            currentPoints: 0,
            lifetimePoints: 0,
            pendingDiscountAmount: 0,
          },
          update: {},
          select: {
            id: true,
            tier: true,
            currentPoints: true,
            lifetimePoints: true,
            pendingDiscountAmount: true,
          },
        })

        if (earnedPoints > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              loyaltyAccountId: loyalty.id,
              deltaPoints: earnedPoints,
              reason: LoyaltyReason.BOOKING,
              meta: { paymentIntentId: id, payableAmount: payable },
            },
          })
        }

        const newCurrent = loyalty.currentPoints + earnedPoints
        const newLifetime = loyalty.lifetimePoints + earnedPoints

        // 3) Tier thresholds (beta)
        const tierFromPoints = (pts: number): LoyaltyTier => {
          if (pts >= 5000) return 'PLATINUM'
          if (pts >= 2000) return 'GOLD'
          if (pts >= 500) return 'SILVER'
          return 'BRONZE'
        }

        const newTier = tierFromPoints(newLifetime)
        const tierUp = newTier !== loyalty.tier

        // 4) Consume pending discount ONLY if this intent used a discount
        if ((full.discountAmount ?? 0) > 0) {
          await tx.loyaltyAccount.update({
            where: { userId: user.userId },
            data: {
              pendingDiscountAmount: 0,
              pendingDiscountTier: null,
              pendingDiscountConsumedAt: new Date(),
              pendingDiscountConsumedIntentId: id,
            },
          })
        }

        // 5) Issue new pending fixed discount on tier-up (only if none pending)
        const discountForTier = (tier: LoyaltyTier): number => {
          if (tier === 'SILVER') return 1000
          if (tier === 'GOLD') return 3000
          if (tier === 'PLATINUM') return 5000
          return 0
        }

        const nextDiscount = tierUp ? discountForTier(newTier) : 0

        // read pending after possible consumption
        const after = await tx.loyaltyAccount.findUnique({
          where: { userId: user.userId },
          select: { pendingDiscountAmount: true },
        })

        await tx.loyaltyAccount.update({
          where: { userId: user.userId },
          data: {
            currentPoints: newCurrent,
            lifetimePoints: newLifetime,
            tier: newTier,
            ...(tierUp &&
            (after?.pendingDiscountAmount ?? 0) === 0 &&
            nextDiscount > 0
              ? {
                  pendingDiscountAmount: nextDiscount,
                  pendingDiscountTier: newTier,
                  pendingDiscountIssuedAt: new Date(),
                }
              : {}),
          },
        })
      }

      return updatedIntent
    })
  }
}
