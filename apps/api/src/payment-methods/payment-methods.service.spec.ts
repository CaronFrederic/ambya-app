import { PaymentMethodsService } from './payment-methods.service'

describe('PaymentMethodsService', () => {
  it('lists payment methods without selecting sensitive provider fields', async () => {
    const prisma = {
      paymentMethod: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pm-1',
            type: 'CARD',
            provider: 'STRIPE',
            label: 'Visa',
            phone: null,
            last4: '4242',
            isDefault: true,
            isActive: true,
            createdAt: new Date('2026-05-03T08:00:00.000Z'),
            updatedAt: new Date('2026-05-03T08:00:00.000Z'),
          },
        ]),
      },
    }

    const service = new PaymentMethodsService(prisma as any)
    const result = await service.list('user-1')

    expect(prisma.paymentMethod.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', isActive: true },
      select: {
        id: true,
        type: true,
        provider: true,
        label: true,
        phone: true,
        last4: true,
        isDefault: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    expect(result[0]).not.toHaveProperty('providerRef')
    expect(result[0]).not.toHaveProperty('providerData')
  })
})
