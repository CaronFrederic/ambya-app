import { BadRequestException } from '@nestjs/common'
import { ServiceCategory } from '@prisma/client'
import { EmployeePortalService } from './employee-portal.service'

describe('EmployeePortalService', () => {
  let service: EmployeePortalService

  beforeEach(() => {
    service = new EmployeePortalService({} as any)
  })

  it('maps the employee tab correctly for upcoming and completed appointments', () => {
    expect((service as any).matchesEmployeeTab('PENDING', 'upcoming')).toBe(true)
    expect((service as any).matchesEmployeeTab('CONFIRMED', 'upcoming')).toBe(true)
    expect((service as any).matchesEmployeeTab('COMPLETED', 'upcoming')).toBe(false)
    expect((service as any).matchesEmployeeTab('COMPLETED', 'completed')).toBe(true)
  })

  it('builds role labels from employee specialties', () => {
    expect(
      (service as any).getEmployeeRoleLabel([{ specialty: 'MASSAGE_THERAPIST' }]),
    ).toBe('Masseur/Masseuse')

    expect(
      (service as any).getEmployeeRoleLabel([
        { specialty: 'HAIR_STYLIST' },
        { specialty: 'BARBER' },
      ]),
    ).toBe('Coiffeur/Coiffeuse, Barbier')
  })

  it('builds useful body insights for wellbeing appointments', () => {
    const result = (service as any).buildClientInsights(
      ServiceCategory.BODY,
      {
        body: {
          bodySkin: 'normal',
          tensionZones: ['back', 'lower_back'],
          wellbeingConcerns: ['detox'],
          massageSensitiveZones: ['neck'],
        },
      },
      'sensitive_products',
      'Cliente sensible aux pressions fortes',
    )

    expect(result).toEqual([
      {
        title: 'Profil bien-etre',
        items: [
          'Type de peau (corps): Normale',
          'Zones de tension: Dos, Lombaires',
          'Preoccupations: Detox',
          'Zones sensibles massage: Nuque',
        ],
      },
      {
        title: 'Informations importantes',
        items: [
          'Allergies: Sensitive Products',
          'Commentaires: Cliente sensible aux pressions fortes',
        ],
      },
    ])
  })

  it('removes technical booking group tags from appointment notes', () => {
    const result = (service as any).sanitizeAppointmentNote(
      '[BOOKING_GROUP:cart-123] Massage detente',
    )

    expect(result).toBe('Massage detente')
  })

  it('creates a leave request for the current employee and trims the reason', async () => {
    const createdAt = new Date('2026-05-03T08:00:00.000Z')
    const prisma = {
      leaveRequest: {
        create: jest.fn().mockResolvedValue({
          id: 'leave-1',
          employeeId: 'employee-1',
          startAt: new Date('2026-05-10T00:00:00.000Z'),
          endAt: new Date('2026-05-12T23:59:59.000Z'),
          reason: 'Conges annuels',
          status: 'PENDING',
          managerNote: null,
          reviewedAt: null,
          createdAt,
        }),
      },
    }

    service = new EmployeePortalService(prisma as any)
    jest.spyOn(service as any, 'getEmployeeContext').mockResolvedValue({
      id: 'employee-1',
    })

    const result = await service.createLeaveRequest(
      { userId: 'user-1' } as any,
      {
        startAt: '2026-05-10T00:00:00.000Z',
        endAt: '2026-05-12T23:59:59.000Z',
        reason: '  Conges annuels  ',
      },
    )

    expect(prisma.leaveRequest.create).toHaveBeenCalledWith({
      data: {
        employeeId: 'employee-1',
        startAt: new Date('2026-05-10T00:00:00.000Z'),
        endAt: new Date('2026-05-12T23:59:59.000Z'),
        reason: 'Conges annuels',
      },
    })
    expect(result.item.reason).toBe('Conges annuels')
  })

  it('rejects leave requests where endAt is before startAt', async () => {
    service = new EmployeePortalService({ leaveRequest: {} } as any)
    jest.spyOn(service as any, 'getEmployeeContext').mockResolvedValue({
      id: 'employee-1',
    })

    await expect(
      service.createLeaveRequest(
        { userId: 'user-1' } as any,
        {
          startAt: '2026-05-12T00:00:00.000Z',
          endAt: '2026-05-10T23:59:59.000Z',
          reason: 'Conges annuels',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('rejects updates for leave requests that are no longer pending', async () => {
    const prisma = {
      leaveRequest: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'leave-1',
          employeeId: 'employee-1',
          status: 'APPROVED',
        }),
      },
    }

    service = new EmployeePortalService(prisma as any)
    jest.spyOn(service as any, 'getEmployeeContext').mockResolvedValue({
      id: 'employee-1',
    })

    await expect(
      service.updateLeaveRequest(
        { userId: 'user-1' } as any,
        'leave-1',
        {
          startAt: '2026-05-10T00:00:00.000Z',
          endAt: '2026-05-12T23:59:59.000Z',
          reason: 'Conges annuels',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
