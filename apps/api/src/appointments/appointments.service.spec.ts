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
})
