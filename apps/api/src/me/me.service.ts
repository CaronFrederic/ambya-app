import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { UpdateClientProfileDto } from './dto/update-client-profile.dto'

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        clientProfile: true,
        paymentMethods: {
          where: { isActive: true },
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        loyaltyAccount: {
          include: {
            transactions: {
              orderBy: { createdAt: 'desc' },
              take: 30,
            },
          },
        },
      },
    })

    if (!user) throw new NotFoundException('User not found')

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      profile: user.clientProfile,
      paymentMethods: user.paymentMethods,
      loyalty: user.loyaltyAccount,
    }
  }

  async getLoyalty(userId: string) {
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        tier: true,
        currentPoints: true,
        lifetimePoints: true,
        pendingDiscountAmount: true,
        pendingDiscountTier: true,
        pendingDiscountIssuedAt: true,
        pendingDiscountConsumedAt: true,
        pendingDiscountConsumedIntentId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!account) {
      return { account: null, pendingDiscount: null, transactions: [] }
    }

    const transactions = await this.prisma.loyaltyTransaction.findMany({
      where: { loyaltyAccountId: account.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        deltaPoints: true,
        reason: true,
        meta: true,
        createdAt: true,
      },
    })

    const pendingDiscount =
      (account.pendingDiscountAmount ?? 0) > 0
        ? {
            amount: account.pendingDiscountAmount,
            tier: account.pendingDiscountTier,
            issuedAt: account.pendingDiscountIssuedAt,
          }
        : null

    return { account, pendingDiscount, transactions }
  }

  async getSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    if (!user) {
      return { user: null, profile: null, loyalty: null, defaultPaymentMethod: null }
    }

    const [profile, loyaltyAccount, defaultPaymentMethod] = await Promise.all([
      this.prisma.clientProfile.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          nickname: true,
          gender: true,
          ageRange: true,
          city: true,
          country: true,
          allergies: true,
          comments: true,

          // ✅ important for init front
          questionnaire: true,

          createdAt: true,
          updatedAt: true,
        },
      }),

      this.prisma.loyaltyAccount.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          tier: true,
          currentPoints: true,
          lifetimePoints: true,
          pendingDiscountAmount: true,
          pendingDiscountTier: true,
          pendingDiscountIssuedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),

      this.prisma.paymentMethod.findFirst({
        where: { userId, isActive: true, isDefault: true },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          type: true,
          provider: true,
          label: true,
          phone: true,
          last4: true,
          isDefault: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ])

    const loyalty =
      !loyaltyAccount
        ? null
        : {
            tier: loyaltyAccount.tier,
            currentPoints: loyaltyAccount.currentPoints,
            lifetimePoints: loyaltyAccount.lifetimePoints,
            pendingDiscount:
              (loyaltyAccount.pendingDiscountAmount ?? 0) > 0
                ? {
                    amount: loyaltyAccount.pendingDiscountAmount,
                    tier: loyaltyAccount.pendingDiscountTier,
                    issuedAt: loyaltyAccount.pendingDiscountIssuedAt,
                  }
                : null,
          }

    return {
      user,
      profile,
      loyalty,
      defaultPaymentMethod,
    }
  }

  async updateClientProfile(userId: string, dto: UpdateClientProfileDto) {
    const existing = await this.prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true, questionnaire: true },
    })

    if (!existing) {
      throw new BadRequestException('Client profile not found')
    }

    // Merge questionnaire si dto.questionnaire est fourni
    const mergedQuestionnaire =
      dto.questionnaire === undefined
        ? undefined
        : this.mergeJson(existing.questionnaire, dto.questionnaire)

    const updated = await this.prisma.clientProfile.update({
      where: { userId },
      data: {
        nickname: dto.nickname ?? undefined,
        gender: dto.gender ?? undefined,
        ageRange: dto.ageRange ?? undefined,
        city: dto.city ?? undefined,
        country: dto.country ?? undefined,
        allergies: dto.allergies ?? undefined,
        comments: dto.comments ?? undefined,
        questionnaire:
          dto.questionnaire === undefined
            ? undefined
            : mergedQuestionnaire === null
              ? Prisma.DbNull
              : mergedQuestionnaire,
      },
    })

    return { profile: updated }
  }

  // merge simple (objet profond) : le dto gagne sur l'existant
  private mergeJson(base: unknown, patch: Record<string, any>) {
    const b = (base && typeof base === 'object') ? (base as Record<string, any>) : {}
    return deepMerge(b, patch)

    function deepMerge(target: Record<string, any>, source: Record<string, any>) {
      const out: Record<string, any> = { ...target }
      for (const [k, v] of Object.entries(source)) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          out[k] = deepMerge(out[k] ?? {}, v)
        } else {
          // arrays & primitives overwrite
          out[k] = v
        }
      }
      return out
    }
  }
}
