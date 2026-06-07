import { AppointmentsService } from './appointments.service'

describe('AppointmentsService', () => {
  let service: AppointmentsService

  beforeEach(() => {
    service = new AppointmentsService({} as any)
  })

  it('rejects past reservation times', () => {
    expect(() =>
      (service as any).assertStartInFuture(
        new Date(Date.now() - 60_000),
      ),
    ).toThrow('Selected time must be in the future')
  })

  it('accepts future reservation times', () => {
    expect(() =>
      (service as any).assertStartInFuture(
        new Date(Date.now() + 60_000),
      ),
    ).not.toThrow()
  })

  it('checks leave conflicts against the canonical leaveRequest model', async () => {
    const appointment = { findFirst: jest.fn().mockResolvedValue(null) }
    const employeeBlockedSlot = { findFirst: jest.fn().mockResolvedValue(null) }
    const leaveRequest = { findFirst: jest.fn().mockResolvedValue({ id: 'leave-1' }) }

    const result = await (service as any).hasEmployeeSchedulingConflict(
      {
        appointment,
        employeeBlockedSlot,
        leaveRequest,
      },
      'salon-1',
      'employee-1',
      new Date('2026-05-21T10:00:00.000Z'),
      new Date('2026-05-21T10:30:00.000Z'),
    )

    expect(result).toBe(true)
    expect(leaveRequest.findFirst).toHaveBeenCalledWith({
      where: {
        employeeId: 'employee-1',
        status: 'APPROVED',
        startAt: { lt: new Date('2026-05-21T10:30:00.000Z') },
        endAt: { gt: new Date('2026-05-21T10:00:00.000Z') },
      },
      select: { id: true },
    })
  })
})
