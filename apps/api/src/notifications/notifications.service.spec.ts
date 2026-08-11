import { NotFoundException } from '@nestjs/common';
import { AppointmentStatus, PaymentStatus, UserRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';

function buildService(prisma: any) {
  return new NotificationsService(prisma);
}

function appointmentFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 'appointment-1',
    status: AppointmentStatus.PENDING,
    startAt: new Date('2026-06-29T15:30:00.000Z'),
    updatedAt: new Date('2026-06-29T12:00:00.000Z'),
    salon: {
      id: 'salon-1',
      name: 'Ambya Beta Studio',
      ownerId: 'owner-1',
      timezone: 'Africa/Libreville',
    },
    employee: {
      id: 'employee-1',
      displayName: 'Naomi Beta',
      userId: 'employee-user-1',
    },
    client: {
      id: 'client-user-1',
      email: 'client.beta@ambya.com',
      phone: '+24170000010',
      clientProfile: { nickname: 'Client Beta' },
    },
    paymentIntents: [
      {
        status: PaymentStatus.CREATED,
        updatedAt: new Date('2026-06-29T12:00:00.000Z'),
      },
    ],
    ...overrides,
  };
}

describe('NotificationsService', () => {
  it('notifies the salon owner and the assigned employee after a confirmed creation', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 2 });
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(appointmentFixture()),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentCreated({ appointmentId: 'appointment-1' });

    expect(createMany).toHaveBeenCalledWith({
      skipDuplicates: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: 'owner-1',
          salonId: 'salon-1',
          appointmentId: 'appointment-1',
          title: 'Nouveau rendez-vous',
          targetRoute:
            '/(professional)/agenda?appointmentId=appointment-1&date=2026-06-29',
        }),
        expect.objectContaining({
          userId: 'employee-user-1',
          salonId: 'salon-1',
          appointmentId: 'appointment-1',
          targetRoute:
            '/(employee)/appointment-detail?id=appointment-1&kind=appointment',
        }),
      ]),
    });
  });

  it('does not notify unassigned employees and only notifies the salon owner when no employee is assigned', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(
          appointmentFixture({
            employee: null,
          }),
        ),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentCreated({ appointmentId: 'appointment-1' });

    const payload = createMany.mock.calls[0][0].data;
    expect(payload).toHaveLength(1);
    expect(payload[0]).toEqual(
      expect.objectContaining({
        userId: 'owner-1',
        metadata: expect.objectContaining({ role: UserRole.PROFESSIONAL }),
      }),
    );
  });

  it('does not create a misleading notification when the payment failed', async () => {
    const createMany = jest.fn();
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(
          appointmentFixture({
            paymentIntents: [{ status: PaymentStatus.FAILED }],
          }),
        ),
      },
      notification: { createMany },
    });

    const result = await service.notifyAppointmentCreated({
      appointmentId: 'appointment-1',
    });

    expect(result).toEqual({ createdCount: 0 });
    expect(createMany).not.toHaveBeenCalled();
  });

  it('does not create notifications for failed or missing reservations', async () => {
    const createMany = jest.fn();
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentCreated({ appointmentId: 'missing' });

    expect(createMany).not.toHaveBeenCalled();
  });

  it('uses deterministic dedupe keys and skipDuplicates to make replay safe', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 2 });
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(appointmentFixture()),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentCreated({ appointmentId: 'appointment-1' });
    await service.notifyAppointmentCreated({ appointmentId: 'appointment-1' });

    const firstPayload = createMany.mock.calls[0][0];
    const secondPayload = createMany.mock.calls[1][0];
    expect(firstPayload.skipDuplicates).toBe(true);
    expect(secondPayload.skipDuplicates).toBe(true);
    expect(firstPayload.data.map((item: any) => item.dedupeKey)).toEqual(
      secondPayload.data.map((item: any) => item.dedupeKey),
    );
  });

  it('notifies the client when a pro or employee confirms the appointment', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(
          appointmentFixture({
            status: AppointmentStatus.CONFIRMED,
          }),
        ),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentConfirmed({ appointmentId: 'appointment-1' });

    expect(createMany).toHaveBeenCalledWith({
      skipDuplicates: true,
      data: [
        expect.objectContaining({
          userId: 'client-user-1',
          type: 'APPOINTMENT_CONFIRMED',
          title: 'Rendez-vous confirme',
          targetRoute: '/(tabs)/appointments',
        }),
      ],
    });
  });

  it('notifies only the assigned employee when an employee is added after creation', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 1 });
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(appointmentFixture()),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentEmployeeAssigned({
      appointmentId: 'appointment-1',
    });

    const payload = createMany.mock.calls[0][0].data;
    expect(payload).toHaveLength(1);
    expect(payload[0]).toEqual(
      expect.objectContaining({
        userId: 'employee-user-1',
        type: 'APPOINTMENT_EMPLOYEE_ASSIGNED',
      }),
    );
  });

  it('does not notify employees when no employee is assigned after creation', async () => {
    const createMany = jest.fn();
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(
          appointmentFixture({
            employee: null,
          }),
        ),
      },
      notification: { createMany },
    });

    const result = await service.notifyAppointmentEmployeeAssigned({
      appointmentId: 'appointment-1',
    });

    expect(result).toEqual({ createdCount: 0 });
    expect(createMany).not.toHaveBeenCalled();
  });

  it('notifies all appointment parties when an appointment is cancelled', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 3 });
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(
          appointmentFixture({
            status: AppointmentStatus.CANCELLED,
          }),
        ),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentCancelled({ appointmentId: 'appointment-1' });

    expect(createMany.mock.calls[0][0].data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: 'owner-1' }),
        expect.objectContaining({ userId: 'employee-user-1' }),
        expect.objectContaining({ userId: 'client-user-1' }),
      ]),
    );
  });

  it('notifies all appointment parties only after a succeeded payment', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 3 });
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(
          appointmentFixture({
            status: AppointmentStatus.CONFIRMED,
            paymentIntents: [
              {
                status: PaymentStatus.SUCCEEDED,
                updatedAt: new Date('2026-06-29T12:10:00.000Z'),
              },
            ],
          }),
        ),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentPaid({ appointmentId: 'appointment-1' });

    expect(createMany.mock.calls[0][0].data).toHaveLength(3);
    expect(createMany.mock.calls[0][0].data[0]).toEqual(
      expect.objectContaining({ type: 'APPOINTMENT_PAID' }),
    );
  });

  it('does not create payment notifications for failed payments', async () => {
    const createMany = jest.fn();
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(
          appointmentFixture({
            paymentIntents: [
              {
                status: PaymentStatus.FAILED,
                updatedAt: new Date('2026-06-29T12:10:00.000Z'),
              },
            ],
          }),
        ),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentPaid({ appointmentId: 'appointment-1' });

    expect(createMany).not.toHaveBeenCalled();
  });

  it('uses the appointment update timestamp to dedupe reschedule replays', async () => {
    const createMany = jest.fn().mockResolvedValue({ count: 3 });
    const service = buildService({
      appointment: {
        findUnique: jest.fn().mockResolvedValue(
          appointmentFixture({
            updatedAt: new Date('2026-06-29T12:30:00.000Z'),
          }),
        ),
      },
      notification: { createMany },
    });

    await service.notifyAppointmentRescheduled({
      appointmentId: 'appointment-1',
    });
    await service.notifyAppointmentRescheduled({
      appointmentId: 'appointment-1',
    });

    expect(createMany.mock.calls[0][0].data.map((item: any) => item.dedupeKey)).toEqual(
      createMany.mock.calls[1][0].data.map((item: any) => item.dedupeKey),
    );
  });

  it('lists and counts only the connected user notifications', async () => {
    const service = buildService({
      notification: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'notification-1',
            type: 'APPOINTMENT_CREATED',
            title: 'Nouveau rendez-vous',
            message: 'Message',
            targetRoute: '/(employee)/appointment-detail?id=appointment-1&kind=appointment',
            metadata: null,
            readAt: null,
            createdAt: new Date('2026-06-29T15:00:00.000Z'),
            appointmentId: 'appointment-1',
            salonId: 'salon-1',
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
      },
    });

    const result = await service.listForUser({
      userId: 'employee-user-1',
      role: UserRole.EMPLOYEE,
    } as any);

    expect(result.unreadCount).toBe(1);
    expect(result.items[0].targetRoute).toBe(
      '/(employee)/appointment-detail?id=appointment-1&kind=appointment',
    );
    expect((service as any).prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'employee-user-1' },
      }),
    );
  });

  it('prevents another user from marking a notification as read', async () => {
    const service = buildService({
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(
      service.markAsRead(
        { userId: 'other-user', role: UserRole.EMPLOYEE } as any,
        'notification-1',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
