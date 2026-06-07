import { ProEmployeesService } from './pro-employees.service'

describe('ProEmployeesService leave requests', () => {
  it('reads the canonical leave request source while preserving the Pro contract', async () => {
    const prisma = {
      leaveRequest: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'leave-1',
            employeeId: 'employee-1',
            employee: { id: 'employee-1', displayName: 'Marie' },
            subject: null,
            reason: 'Vacances',
            startAt: new Date('2026-06-10T08:00:00.000Z'),
            endAt: new Date('2026-06-12T18:00:00.000Z'),
            createdAt: new Date('2026-06-01T10:00:00.000Z'),
            status: 'APPROVED',
          },
        ]),
      },
    }

    const service = new ProEmployeesService(prisma as any)
    const result = await service.findLeaveRequests({ salonId: 'salon-1' })

    expect(prisma.leaveRequest.findMany).toHaveBeenCalledWith({
      where: { employee: { salonId: 'salon-1' } },
      include: {
        employee: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(result).toEqual([
      expect.objectContaining({
        id: 'leave-1',
        subject: 'Vacances',
        status: 'ACCEPTED',
      }),
    ])
  })

  it('approves a canonical leave request and links the resulting absence', async () => {
    const request = {
      id: 'leave-1',
      employeeId: 'employee-1',
      employee: { id: 'employee-1', displayName: 'Marie' },
      subject: 'Vacances',
      reason: 'Repos annuel',
      startAt: new Date('2026-06-10T08:00:00.000Z'),
      endAt: new Date('2026-06-12T18:00:00.000Z'),
      createdAt: new Date('2026-06-01T10:00:00.000Z'),
      status: 'PENDING',
    }
    const prisma = {
      leaveRequest: {
        findFirst: jest.fn().mockResolvedValue(request),
        update: jest.fn().mockResolvedValue({
          ...request,
          status: 'APPROVED',
        }),
      },
      employee: {
        update: jest.fn().mockResolvedValue({}),
      },
      employeeAbsence: {
        create: jest.fn().mockResolvedValue({}),
      },
    }

    const service = new ProEmployeesService(prisma as any)
    const result = await service.respondLeaveRequest(
      { salonId: 'salon-1', userId: 'pro-1' },
      'leave-1',
      'ACCEPTED',
    )

    expect(prisma.leaveRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'leave-1' },
        data: expect.objectContaining({
          status: 'APPROVED',
          reviewedById: 'pro-1',
        }),
      }),
    )
    expect(prisma.employeeAbsence.create).toHaveBeenCalledWith({
      data: {
        salonId: 'salon-1',
        employeeId: 'employee-1',
        leaveRequestId: 'leave-1',
        reason: 'Repos annuel',
        startDate: request.startAt,
        endDate: request.endAt,
        source: 'LEAVE_REQUEST',
        createdById: 'pro-1',
      },
    })
    expect(result.status).toBe('ACCEPTED')
  })
})
