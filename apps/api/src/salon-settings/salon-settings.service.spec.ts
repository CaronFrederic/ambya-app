import { SalonSettingsService } from './salon-settings.service'

describe('SalonSettingsService', () => {
  it('reads categories and opening hours from the salon source of truth', async () => {
    const service = new SalonSettingsService({} as any)

    jest.spyOn(service as any, 'getManagedSalon').mockResolvedValue({
      id: 'salon-1',
      name: 'Ambya',
      description: null,
      address: null,
      phone: null,
      email: null,
      categories: ['Massage'],
      coverImageUrl: null,
      galleryImageUrls: [],
      instagramHandle: null,
      showInstagramFeed: false,
      tiktokHandle: null,
      showTikTokFeed: false,
      facebookUrl: null,
      websiteUrl: null,
      paymentSettings: {},
      depositEnabled: false,
      depositPercentage: 30,
      openingHours: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '18:00',
          isOpen: true,
        },
      ],
    })

    const result = await service.getSettings({
      userId: 'pro-1',
      role: 'PROFESSIONAL',
    } as any)

    expect(result.categories).toEqual(['Massage'])
    expect(result.customSlots.Lundi).toEqual([
      { start: '09:00', end: '18:00', enabled: true },
    ])
  })

  it('writes categories and opening hours through the unified salon models', async () => {
    const tx = {
      salon: {
        update: jest.fn().mockResolvedValue({ id: 'salon-1' }),
      },
      salonOpeningHour: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        createMany: jest.fn().mockResolvedValue({ count: 7 }),
      },
    }

    const prisma = {
      $transaction: jest.fn(async (callback: (value: unknown) => unknown) => callback(tx)),
    }

    const service = new SalonSettingsService(prisma as any)
    jest.spyOn(service as any, 'getManagedSalon').mockResolvedValue({ id: 'salon-1' })

    await service.upsertSettings(
      { userId: 'pro-1', role: 'PROFESSIONAL' } as any,
      {
        name: 'Ambya',
        categories: ['Massage'],
        scheduleType: 'standard',
        standardSlots: [{ start: '09:00', end: '18:00', enabled: true }],
        customSlots: {
          Lundi: [],
          Mardi: [],
          Mercredi: [],
          Jeudi: [],
          Vendredi: [],
          Samedi: [],
          Dimanche: [],
        },
        paymentSettings: {
          payMobileMoney: true,
          payCard: false,
          payCash: true,
        },
        depositEnabled: false,
        depositPercentage: 30,
      } as any,
    )

    expect(tx.salon.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categories: ['Massage'],
        }),
      }),
    )
    expect(tx.salonOpeningHour.deleteMany).toHaveBeenCalledWith({
      where: { salonId: 'salon-1' },
    })
    expect(tx.salonOpeningHour.createMany).toHaveBeenCalled()
  })
})
