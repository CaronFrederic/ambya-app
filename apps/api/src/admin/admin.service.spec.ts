import { AdminService } from './admin.service'

describe('AdminService', () => {
  let service: AdminService

  beforeEach(() => {
    service = new AdminService({} as any, {} as any)
  })

  it('maps an appointment even when client relation is missing', () => {
    const result = (service as any).mapAppointment({
      id: 'appt-1',
      status: 'PENDING',
      startAt: new Date('2026-03-25T10:00:00.000Z'),
      endAt: new Date('2026-03-25T11:00:00.000Z'),
      note: null,
      salon: { id: 'salon-1', name: 'Salon test' },
      service: { id: 'service-1', name: 'Coupe', category: 'HAIR' },
      clientId: 'client-1',
      client: undefined,
      employee: null,
      paymentIntents: [],
    })

    expect(result.client).toEqual({
      id: 'client-1',
      name: 'Client',
      email: null,
      phone: null,
    })
  })

  it('prefers nickname over email when building a client display name', () => {
    const result = (service as any).getClientDisplayName({
      email: 'client@example.com',
      phone: '+241000000',
      clientProfile: { nickname: 'Nina' },
    })

    expect(result).toBe('Nina')
  })

  it('normalizes opening hours and clears open/close when a day is closed', () => {
    const result = (service as any).normalizeOpeningHours([
      { day: 'Lundi', open: '09:00', close: '18:00', closed: false },
      { day: 'Dimanche', open: '10:00', close: '13:00', closed: true },
      { foo: 'bar' },
    ])

    expect(result).toEqual([
      { day: 'Lundi', open: '09:00', close: '18:00', closed: false },
      { day: 'Dimanche', open: null, close: null, closed: true },
    ])
  })

  it('rejects non-admin users in the admin guard layer', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn(),
      },
    }

    service = new AdminService(prisma as any, {} as any)

    await expect(
      (service as any).assertAdmin({
        userId: 'client-1',
        role: 'CLIENT',
      }),
    ).rejects.toThrow('Admin account required')
  })

  it('logs admin appointment mutations through the manual audit strategy', async () => {
    const prisma = {
      appointment: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    }
    const audit = {
      logCrudMutation: jest.fn().mockResolvedValue(undefined),
    }

    service = new AdminService(prisma as any, audit as any)
    jest.spyOn(service as any, 'assertAdmin').mockResolvedValue({
      id: 'admin-1',
    })
    jest
      .spyOn(service as any, 'findAppointmentOrThrow')
      .mockResolvedValueOnce({
        id: 'appt-1',
        salon: { id: 'salon-1', name: 'Salon test' },
        service: { id: 'service-1', name: 'Coupe', category: 'HAIR', price: 5000, durationMin: 30 },
        client: { id: 'client-1', email: null, phone: null, clientProfile: null },
        employee: null,
        paymentIntents: [],
        status: 'PENDING',
        startAt: new Date('2026-05-04T09:00:00.000Z'),
        endAt: new Date('2026-05-04T09:30:00.000Z'),
        note: null,
      })
      .mockResolvedValueOnce({
        id: 'appt-1',
        salon: { id: 'salon-1', name: 'Salon test' },
        service: { id: 'service-1', name: 'Coupe', category: 'HAIR', price: 5000, durationMin: 30 },
        client: { id: 'client-1', email: null, phone: null, clientProfile: null },
        employee: null,
        paymentIntents: [],
        status: 'CONFIRMED',
        startAt: new Date('2026-05-04T09:00:00.000Z'),
        endAt: new Date('2026-05-04T09:30:00.000Z'),
        note: null,
      })

    await service.updateAppointment(
      { userId: 'admin-1', role: 'ADMIN' } as any,
      'appt-1',
      { status: 'CONFIRMED' } as any,
    )

    expect(audit.logCrudMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'update',
        entityType: 'appointment',
        entityId: 'appt-1',
      }),
    )
  })
})
