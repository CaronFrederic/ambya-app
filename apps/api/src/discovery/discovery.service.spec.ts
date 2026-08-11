import { DiscoveryService } from './discovery.service'
import { ServiceCategory } from '@prisma/client'

describe('DiscoveryService', () => {
  let service: DiscoveryService

  beforeEach(() => {
    service = new DiscoveryService({} as any)
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('computes an explicit average rating when reviews exist', () => {
    const rating = (service as any).computeAverageRating([
      { rating: 5 },
      { rating: 4 },
      { rating: 4 },
    ])

    expect(rating).toBe(4.3)
  })

  it('returns 0 when no explicit review exists', () => {
    const rating = (service as any).computeAverageRating([])

    expect(rating).toBe(0)
  })

  it('returns empty social links when none are configured', () => {
    const result = (service as any).normalizeSocialLinks(null)

    expect(result).toEqual({})
  })

  it('keeps only explicit social links when some are configured', () => {
    const result = (service as any).normalizeSocialLinks({
      instagram: 'https://instagram.com/test-salon',
      website: 'https://test-salon.app',
    })

    expect(result).toEqual({
      instagram: 'https://instagram.com/test-salon',
      facebook: undefined,
      tiktok: undefined,
      website: 'https://test-salon.app',
    })
  })

  it('maps barber services to the coiffure discovery category', () => {
    const category = (service as any).toCategoryFromEnum(ServiceCategory.BARBER)

    expect(category).toBe('Coiffure')
  })

  it('exposes the salon cover image on client offers', async () => {
    const prisma = {
      salon: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'salon-1',
            name: 'Ambya Beta Studio',
            address: 'Libreville',
            city: 'Libreville',
            country: 'Gabon',
            coverImageUrl: 'https://cdn.ambya.test/salon-1.jpg',
            latitude: null,
            longitude: null,
            services: [
              {
                id: 'service-1',
                name: 'Manucure Soin',
                category: ServiceCategory.NAILS,
                durationMin: 45,
                price: 10000,
              },
            ],
            appointments: [],
            _count: { reviews: 0 },
            reviews: [],
          },
          {
            id: 'salon-2',
            name: 'Salon sans photo',
            address: 'Libreville',
            city: 'Libreville',
            country: 'Gabon',
            coverImageUrl: '',
            latitude: null,
            longitude: null,
            services: [
              {
                id: 'service-2',
                name: 'Soin visage',
                category: ServiceCategory.FACE,
                durationMin: 30,
                price: 8000,
              },
            ],
            appointments: [],
            _count: { reviews: 0 },
            reviews: [],
          },
        ]),
      },
      service: {
        findMany: jest.fn().mockResolvedValue([
          { category: ServiceCategory.NAILS },
          { category: ServiceCategory.FACE },
        ]),
      },
    }

    service = new DiscoveryService(prisma as any)

    const result = await service.home({} as any)

    expect(result.offers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          salonId: 'salon-1',
          salonCoverImageUrl: 'https://cdn.ambya.test/salon-1.jpg',
          originalPrice: 10000,
          discountedPrice: 10000,
        }),
        expect.objectContaining({
          salonId: 'salon-2',
          salonCoverImageUrl: null,
        }),
      ]),
    )
  })

  it('separates genuinely rated salons from available salons without reviews', async () => {
    const prisma = {
      salon: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'rated-salon',
            name: 'Salon Note',
            address: 'Libreville',
            city: 'Libreville',
            country: 'Gabon',
            coverImageUrl: null,
            latitude: null,
            longitude: null,
            services: [
              {
                id: 'service-1',
                name: 'Soin visage',
                category: ServiceCategory.FACE,
                durationMin: 40,
                price: 12000,
              },
            ],
            appointments: [],
            _count: { reviews: 2 },
            reviews: [{ rating: 5 }, { rating: 4 }],
          },
          {
            id: 'new-salon',
            name: 'Salon Nouveau',
            address: 'Libreville',
            city: 'Libreville',
            country: 'Gabon',
            coverImageUrl: null,
            latitude: null,
            longitude: null,
            services: [
              {
                id: 'service-2',
                name: 'Manucure',
                category: ServiceCategory.NAILS,
                durationMin: 45,
                price: 10000,
              },
            ],
            appointments: [],
            _count: { reviews: 0 },
            reviews: [],
          },
        ]),
      },
      service: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ category: ServiceCategory.FACE }, { category: ServiceCategory.NAILS }]),
      },
    }

    service = new DiscoveryService(prisma as any)

    const result = await service.home({} as any)

    expect(result.topRatedSalons).toEqual([
      expect.objectContaining({
        id: 'rated-salon',
        rating: 4.5,
        reviewCount: 2,
      }),
    ])
    expect(result.otherSalons).toEqual([
      expect.objectContaining({
        id: 'new-salon',
        rating: 0,
        reviewCount: 0,
      }),
    ])
  })

  it('orders top rated salons by rating, then review count, and excludes duplicates', async () => {
    const makeSalon = (
      id: string,
      name: string,
      reviews: Array<{ rating: number }>,
    ) => ({
      id,
      name,
      address: 'Libreville',
      city: 'Libreville',
      country: 'Gabon',
      coverImageUrl: null,
      latitude: null,
      longitude: null,
      services: [
        {
          id: `${id}-service`,
          name: 'Service',
          category: ServiceCategory.HAIR,
          durationMin: 30,
          price: 5000,
        },
      ],
      appointments: [],
      _count: { reviews: reviews.length },
      reviews,
    })

    const prisma = {
      salon: {
        findMany: jest.fn().mockResolvedValue([
          makeSalon('lower-rating', 'Salon B', [{ rating: 4 }]),
          makeSalon('more-reviews', 'Salon A', [
            { rating: 5 },
            { rating: 5 },
            { rating: 5 },
          ]),
          makeSalon('fewer-reviews', 'Salon C', [{ rating: 5 }]),
          makeSalon('unrated', 'Salon D', []),
        ]),
      },
      service: {
        findMany: jest.fn().mockResolvedValue([{ category: ServiceCategory.HAIR }]),
      },
    }

    service = new DiscoveryService(prisma as any)

    const result = await service.home({} as any)

    expect(result.topRatedSalons.map((salon) => salon.id)).toEqual([
      'more-reviews',
      'fewer-reviews',
      'lower-rating',
    ])
    expect(result.otherSalons.map((salon) => salon.id)).toEqual(['unrated'])
    expect(
      new Set([
        ...result.topRatedSalons.map((salon) => salon.id),
        ...result.otherSalons.map((salon) => salon.id),
      ]).size,
    ).toBe(4)
  })

  it('keeps all active salons outside top rated when no real review exists', async () => {
    const prisma = {
      salon: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'new-salon',
            name: 'Salon Nouveau',
            address: 'Libreville',
            city: 'Libreville',
            country: 'Gabon',
            coverImageUrl: null,
            latitude: null,
            longitude: null,
            services: [
              {
                id: 'service-1',
                name: 'Soin',
                category: ServiceCategory.FACE,
                durationMin: 30,
                price: 10000,
              },
            ],
            appointments: [],
            _count: { reviews: 0 },
            reviews: [],
          },
        ]),
      },
      service: {
        findMany: jest.fn().mockResolvedValue([{ category: ServiceCategory.FACE }]),
      },
    }

    service = new DiscoveryService(prisma as any)

    const result = await service.home({} as any)

    expect(result.topRatedSalons).toEqual([])
    expect(result.otherSalons).toEqual([
      expect.objectContaining({ id: 'new-salon', reviewCount: 0 }),
    ])
  })

  it('accepts a multi-employee team for sequential multi-service coverage', () => {
    const result = (service as any).canAnyTeamCoverServicesAtSlot(
      [
        { id: 'hair-1', specialties: [{ specialty: 'HAIR_STYLIST' }] },
        { id: 'massage-1', specialties: [{ specialty: 'MASSAGE_THERAPIST' }] },
      ],
      new Date('2026-03-26T10:00:00.000Z'),
      [
        { durationMin: 60, category: ServiceCategory.HAIR },
        { durationMin: 60, category: ServiceCategory.BODY },
      ],
      new Map(),
    )

    expect(result).toBe(true)
  })

  it('uses salon opening hours as the availability source of truth', async () => {
    const prisma = {
      salon: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'salon-1',
          openingHours: [
            {
              dayOfWeek: 1,
              isOpen: false,
              startTime: '09:00',
              endTime: '18:00',
            },
          ],
          employees: [],
        }),
      },
    }

    service = new DiscoveryService(prisma as any)

    const result = await service.salonAvailability('salon-1', {
      date: '2026-05-04',
      serviceIds: '',
    } as any)

    expect(result.slots).toEqual([])
    expect(result.professionals).toEqual([])
  })

  it('does not expose availability slots that already started according to salon time', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-28T14:36:00.000Z'))

    const prisma = {
      salon: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'salon-1',
          openingHours: [
            {
              day: 'Dimanche',
              open: '13:00',
              close: '16:00',
              closed: false,
            },
          ],
          employees: [
            {
              id: 'employee-1',
              displayName: 'Anne Marie',
              specialties: [],
            },
          ],
        }),
      },
      appointment: { findMany: jest.fn().mockResolvedValue([]) },
      employeeBlockedSlot: { findMany: jest.fn().mockResolvedValue([]) },
      leaveRequest: { findMany: jest.fn().mockResolvedValue([]) },
    }

    service = new DiscoveryService(prisma as any)

    const result = await service.salonAvailability('salon-1', {
      date: '2026-06-28',
      serviceIds: '',
    } as any)

    expect(result.slots.map((slot) => slot.time)).toEqual([])
  })
})
