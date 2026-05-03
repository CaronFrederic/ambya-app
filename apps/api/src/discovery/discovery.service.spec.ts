import { DiscoveryService } from './discovery.service'
import { ServiceCategory } from '@prisma/client'

describe('DiscoveryService', () => {
  let service: DiscoveryService

  beforeEach(() => {
    service = new DiscoveryService({} as any)
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
})
