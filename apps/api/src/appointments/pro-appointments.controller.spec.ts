import { ProAppointmentsController } from './pro-appointments.controller'

describe('ProAppointmentsController', () => {
  it('delegates history requests to the retained pro namespace service methods', () => {
    const service = {
      getProHistory: jest.fn().mockResolvedValue([]),
    }

    const controller = new ProAppointmentsController(service as any)
    const user = { userId: 'pro-1', role: 'PROFESSIONAL' } as any

    controller.getHistory(user, 'COMPLETED')

    expect(service.getProHistory).toHaveBeenCalledWith(user, 'COMPLETED')
  })

  it('delegates confirmation requests through the dedicated pro controller', () => {
    const service = {
      confirmAppointment: jest.fn().mockResolvedValue({ id: 'appt-1', status: 'CONFIRMED' }),
    }

    const controller = new ProAppointmentsController(service as any)
    const user = { userId: 'pro-1', role: 'PROFESSIONAL' } as any

    controller.confirm(user, 'appt-1')

    expect(service.confirmAppointment).toHaveBeenCalledWith(user, 'appt-1')
  })
})
