import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { AppointmentStatus, LoyaltyTier, LoyaltyReason, PaymentStatus} from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto'
import { UpdateIntentStatusDto } from './dto/update-intent-status.dto'
import { Role } from '../common/enums/role.enum';
import { Prisma } from '@prisma/client';
import { GetCashRegisterQueryDto } from './dto/get-cash-register-query.dto';
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
        providerData: undefined,
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
    user: { userId: string; role: 'CLIENT' | 'PROFESSIONAL' | 'SALON_MANAGER' | 'EMPLOYEE' | 'ADMIN' },
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

   private inferMethodFromProvider(provider?: string | null): 'mobile-money' | 'card' | 'cash' {
    const value = (provider ?? '').trim().toUpperCase();

    if (
      value.includes('MTN') ||
      value.includes('ORANGE') ||
      value.includes('MOOV') ||
      value.includes('AIRTEL') ||
      value.includes('MOMO')
    ) {
      return 'mobile-money';
    }

    if (
      value.includes('CARD') ||
      value.includes('VISA') ||
      value.includes('MASTERCARD') ||
      value.includes('STRIPE')
    ) {
      return 'card';
    }

    return 'cash';
  }

  private getDayBounds(date: string) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);
    return { start, end };
  }

  private getUserSalonFilter(user: { userId: string; role: string }) {
    if (user.role === 'PROFESSIONAL' || user.role === 'SALON_MANAGER') {
      return {
        salon: {
          ownerId: user.userId,
        },
      };
    }

    if (user.role === 'EMPLOYEE') {
      return {
        salon: {
          employees: {
            some: {
              userId: user.userId,
            },
          },
        },
      };
    }

    throw new ForbiddenException('Not allowed');
  }

  async getCashRegister(
    user: { userId: string; role: 'CLIENT' | 'PROFESSIONAL' | 'SALON_MANAGER' | 'EMPLOYEE' | 'ADMIN' },
    date?: string,
    method?: string,
  ) {
    if (!['PROFESSIONAL', 'ADMIN'].includes(user.role)) {
      throw new ForbiddenException('Not allowed');
    }

    const salonIds =
      user.role === 'ADMIN'
        ? (
            await this.prisma.salon.findMany({
              select: { id: true },
            })
          ).map((salon) => salon.id)
        : (
            await this.prisma.salon.findMany({
              where: { ownerId: user.userId },
              select: { id: true },
            })
          ).map((salon) => salon.id);

    if (!salonIds.length) {
      return {
        date: date ?? new Date().toISOString().slice(0, 10),
        totals: { total: 0, mobileMoney: 0, card: 0, cash: 0 },
        transactions: [],
        breakdown: [
          { name: 'Part salon', value: 65, color: '#6B2737' },
          { name: 'Commission AMBYA', value: 15, color: '#D4AF6A' },
          { name: 'Frais transaction', value: 5, color: '#8B8B8B' },
        ],
        meta: { count: 0, paidCount: 0, pendingCount: 0, paidTotal: 0 },
      };
    }

    const targetDate = date ? new Date(date) : new Date();
    if (Number.isNaN(targetDate.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const where: Prisma.PaymentIntentWhereInput = {
      salonId: { in: salonIds },
      transactionDate: {
        gte: start,
        lte: end,
      },
    };

    if (method === 'mobile-money') where.type = 'MOMO';
    if (method === 'card') where.type = 'CARD';
    if (method === 'cash') where.type = 'CASH';

    const intents = await this.prisma.paymentIntent.findMany({
      where,
      include: {
        appointment: {
          include: {
            client: {
              include: {
                clientProfile: true,
              },
            },
            service: true,
            employee: true,
          },
        },
      },
      orderBy: { transactionDate: 'desc' },
    });

    const transactions = intents.map((intent) => {
      const appointment = intent.appointment;
      const client =
        appointment?.client?.clientProfile?.nickname ||
        appointment?.client?.email ||
        appointment?.client?.phone ||
        'Client';

      const methodMapped =
        intent.type === 'MOMO'
          ? 'mobile-money'
          : intent.type === 'CARD'
          ? 'card'
          : 'cash';

      return {
        id: intent.id,
        date: intent.transactionDate.toISOString(),
        client,
        clientId: appointment?.clientId ?? null,
        services: appointment?.service?.name ?? 'Service',
        employee: appointment?.employee?.displayName ?? 'Non assigné',
        amount: intent.payableAmount || intent.amount,
        method: methodMapped as 'mobile-money' | 'card' | 'cash',
        status: intent.status === 'SUCCEEDED' ? 'paid' : 'pending',
        provider: intent.provider ?? null,
      };
    });

    const paidTransactions = transactions.filter((tx) => tx.status === 'paid');

    const totals = paidTransactions.reduce(
      (acc, tx) => {
        acc.total += tx.amount;
        if (tx.method === 'mobile-money') acc.mobileMoney += tx.amount;
        if (tx.method === 'card') acc.card += tx.amount;
        if (tx.method === 'cash') acc.cash += tx.amount;
        return acc;
      },
      { total: 0, mobileMoney: 0, card: 0, cash: 0 },
    );

    return {
      date: date ?? targetDate.toISOString().slice(0, 10),
      totals,
      transactions,
      breakdown: [
        { name: 'Part salon', value: 65, color: '#6B2737' },
        { name: 'Commission AMBYA', value: 15, color: '#D4AF6A' },
        { name: 'Frais transaction', value: 5, color: '#8B8B8B' },
      ],
      meta: {
        count: transactions.length,
        paidCount: transactions.filter((tx) => tx.status === 'paid').length,
        pendingCount: transactions.filter((tx) => tx.status === 'pending').length,
        paidTotal: totals.total,
      },
    };
  }

  

}
