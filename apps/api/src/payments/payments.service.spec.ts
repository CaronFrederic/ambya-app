import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { PaymentStatus, UserRole } from '@prisma/client'
import { PaymentsService } from './payments.service'

describe('PaymentsService', () => {
  it('prevents a client from marking a payment intent as succeeded', async () => {
    const prisma = {
      paymentIntent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pi-1',
          userId: 'client-1',
          status: PaymentStatus.PENDING,
          salon: null,
        }),
      },
    }

    const service = new PaymentsService(prisma as any)

    await expect(
      service.updateStatus(
        { userId: 'client-1', role: UserRole.CLIENT },
        'pi-1',
        { status: PaymentStatus.SUCCEEDED } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('allows a professional owner to cancel a salon payment intent', async () => {
    const tx = {
      paymentIntent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pi-1',
          userId: 'client-1',
          status: PaymentStatus.CREATED,
          appointmentId: null,
          salonId: 'salon-1',
          amount: 10000,
          payableAmount: 10000,
          discountAmount: 0,
          appliedDiscountTier: null,
          salon: {
            ownerId: 'pro-1',
            employees: [],
          },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'pi-1',
          status: PaymentStatus.CANCELLED,
        }),
      },
    }

    const prisma = {
      paymentIntent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pi-1',
          userId: 'client-1',
          status: PaymentStatus.CREATED,
          salon: {
            ownerId: 'pro-1',
            employees: [],
          },
        }),
      },
      $transaction: jest.fn(async (callback: (value: unknown) => unknown) => callback(tx)),
    }

    const service = new PaymentsService(prisma as any)
    const result = await service.updateStatus(
      { userId: 'pro-1', role: UserRole.PROFESSIONAL },
      'pi-1',
      { status: PaymentStatus.CANCELLED } as any,
    )

    expect(result).toEqual({
      id: 'pi-1',
      status: PaymentStatus.CANCELLED,
    })
    expect(tx.paymentIntent.update).toHaveBeenCalledWith({
      where: { id: 'pi-1' },
      data: {
        status: PaymentStatus.CANCELLED,
        providerRef: undefined,
        providerData: undefined,
      },
    })
  })

  it('refuses employee updates when the employee does not belong to the salon', async () => {
    const prisma = {
      paymentIntent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pi-1',
          userId: 'client-1',
          status: PaymentStatus.CREATED,
          salon: {
            ownerId: 'pro-1',
            employees: [],
          },
        }),
      },
    }

    const service = new PaymentsService(prisma as any)

    await expect(
      service.updateStatus(
        { userId: 'employee-1', role: UserRole.EMPLOYEE },
        'pi-1',
        { status: PaymentStatus.CANCELLED } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('rejects invalid status transitions even for an admin', async () => {
    const prisma = {
      paymentIntent: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pi-1',
          userId: 'client-1',
          status: PaymentStatus.CREATED,
          salon: null,
        }),
      },
    }

    const service = new PaymentsService(prisma as any)

    await expect(
      service.updateStatus(
        { userId: 'admin-1', role: UserRole.ADMIN },
        'pi-1',
        { status: PaymentStatus.REFUNDED } as any,
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
