import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PaymentType, Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto'

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
  }

  async create(userId: string, dto: CreatePaymentMethodDto) {
    if (dto.type === PaymentType.MOMO && !dto.phone) {
      throw new BadRequestException('phone is required for MOMO')
    }

    const makeDefault = dto.isDefault ?? false

    return this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.paymentMethod.updateMany({
          where: { userId, isActive: true, isDefault: true },
          data: { isDefault: false },
        })
      }

      const existingCount = await tx.paymentMethod.count({
        where: { userId, isActive: true },
      })

      const isDefault = makeDefault || existingCount === 0

      return tx.paymentMethod.create({
        data: {
          userId,
          type: dto.type,
          provider: dto.provider ?? null,
          providerRef: null,
          providerData: Prisma.DbNull,
          label: dto.label ?? null,
          phone: dto.phone ?? null,
          last4: dto.last4 ?? null,
          isDefault,
          isActive: true,
        },
      })
    })
  }

  async setDefault(userId: string, paymentMethodId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pm = await tx.paymentMethod.findUnique({
        where: { id: paymentMethodId },
        select: { id: true, userId: true, isActive: true },
      })

      if (!pm || !pm.isActive) throw new NotFoundException('Payment method not found')
      if (pm.userId !== userId) throw new ForbiddenException('Not allowed')

      await tx.paymentMethod.updateMany({
        where: { userId, isActive: true, isDefault: true },
        data: { isDefault: false },
      })

      return tx.paymentMethod.update({
        where: { id: paymentMethodId },
        data: { isDefault: true },
      })
    })
  }

  async remove(userId: string, paymentMethodId: string) {
    return this.prisma.$transaction(async (tx) => {
      const pm = await tx.paymentMethod.findUnique({
        where: { id: paymentMethodId },
        select: { id: true, userId: true, isDefault: true, isActive: true },
      })

      if (!pm || !pm.isActive) throw new NotFoundException('Payment method not found')
      if (pm.userId !== userId) throw new ForbiddenException('Not allowed')

      await tx.paymentMethod.update({
        where: { id: paymentMethodId },
        data: { isActive: false, isDefault: false },
      })

      // si on supprime le default, on promeut un autre en default
      if (pm.isDefault) {
        const next = await tx.paymentMethod.findFirst({
          where: { userId, isActive: true },
          orderBy: { createdAt: 'desc' },
          select: { id: true },
        })

        if (next) {
          await tx.paymentMethod.update({
            where: { id: next.id },
            data: { isDefault: true },
          })
        }
      }

      return { success: true }
    })
  }
}
