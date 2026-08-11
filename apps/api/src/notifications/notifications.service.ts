import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AppointmentStatus,
  NotificationType,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { JwtUser } from '../auth/decorators/current-user.decorator';

type DbClient = PrismaService | Prisma.TransactionClient;

type AppointmentNotificationInput = {
  appointmentId: string;
};

type AppointmentContext = {
  id: string;
  status: AppointmentStatus;
  startAt: Date;
  updatedAt: Date;
  salon: {
    id: string;
    name: string;
    ownerId: string;
    timezone: string | null;
  };
  employee: {
    id: string;
    displayName: string;
    userId: string | null;
  } | null;
  client: {
    id: string;
    email: string | null;
    phone: string | null;
    clientProfile: { nickname: string } | null;
  };
  paymentIntents: Array<{ status: PaymentStatus; updatedAt: Date }>;
};

type Recipient = {
  role: UserRole;
  userId: string | null;
  employeeId?: string | null;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(user: JwtUser) {
    const items = await this.prisma.notification.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        targetRoute: true,
        metadata: true,
        readAt: true,
        createdAt: true,
        appointmentId: true,
        salonId: true,
      },
    });

    return {
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        readAt: item.readAt?.toISOString() ?? null,
      })),
      unreadCount: await this.countUnread(user.userId),
    };
  }

  async summaryForUser(user: JwtUser) {
    return {
      unreadCount: await this.countUnread(user.userId),
    };
  }

  async markAsRead(user: JwtUser, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.userId },
      select: { id: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        targetRoute: true,
        metadata: true,
        readAt: true,
        createdAt: true,
        appointmentId: true,
        salonId: true,
      },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      readAt: updated.readAt?.toISOString() ?? null,
      unreadCount: await this.countUnread(user.userId),
    };
  }

  notifyAppointmentCreated(
    input: AppointmentNotificationInput,
    prisma: DbClient = this.prisma,
  ) {
    return this.notifyAppointmentEvent({
      input,
      prisma,
      type: NotificationType.APPOINTMENT_CREATED,
      title: 'Nouveau rendez-vous',
      eventKey: 'created',
      recipients: (appointment) => [
        this.salonOwnerRecipient(appointment),
        this.employeeRecipient(appointment),
      ],
      message: (appointment, role) => {
        const details = this.formatAppointmentDetails(appointment);
        if (role === UserRole.EMPLOYEE) {
          return `Un nouveau rendez-vous avec ${details.clientName} vous a ete attribue le ${details.date} a ${details.time} chez ${appointment.salon.name}.`;
        }
        return `Un nouveau rendez-vous a ete reserve par ${details.clientName} le ${details.date} a ${details.time}, avec ${details.employeeName}.`;
      },
    });
  }

  notifyAppointmentConfirmed(
    input: AppointmentNotificationInput,
    prisma: DbClient = this.prisma,
  ) {
    return this.notifyAppointmentEvent({
      input,
      prisma,
      type: NotificationType.APPOINTMENT_CONFIRMED,
      title: 'Rendez-vous confirme',
      recipients: (appointment) => [this.clientRecipient(appointment)],
      message: (appointment) => {
        const details = this.formatAppointmentDetails(appointment);
        return `Votre rendez-vous chez ${appointment.salon.name} est confirme pour le ${details.date} a ${details.time}.`;
      },
    });
  }

  notifyAppointmentEmployeeAssigned(
    input: AppointmentNotificationInput,
    prisma: DbClient = this.prisma,
  ) {
    return this.notifyAppointmentEvent({
      input,
      prisma,
      type: NotificationType.APPOINTMENT_EMPLOYEE_ASSIGNED,
      title: 'Rendez-vous attribue',
      recipients: (appointment) => [this.employeeRecipient(appointment)],
      message: (appointment) => {
        const details = this.formatAppointmentDetails(appointment);
        return `Un rendez-vous avec ${details.clientName} vous a ete attribue le ${details.date} a ${details.time} chez ${appointment.salon.name}.`;
      },
    });
  }

  notifyAppointmentUpdated(
    input: AppointmentNotificationInput,
    prisma: DbClient = this.prisma,
  ) {
    return this.notifyAppointmentEvent({
      input,
      prisma,
      type: NotificationType.APPOINTMENT_UPDATED,
      title: 'Rendez-vous modifie',
      recipients: (appointment) => this.allAppointmentRecipients(appointment),
      message: (appointment, role) => {
        const details = this.formatAppointmentDetails(appointment);
        if (role === UserRole.CLIENT) {
          return `Votre rendez-vous chez ${appointment.salon.name} a ete modifie. Nouvelle information: ${details.date} a ${details.time}.`;
        }
        return `Le rendez-vous de ${details.clientName} a ete modifie pour le ${details.date} a ${details.time}.`;
      },
    });
  }

  notifyAppointmentRescheduled(
    input: AppointmentNotificationInput,
    prisma: DbClient = this.prisma,
  ) {
    return this.notifyAppointmentEvent({
      input,
      prisma,
      type: NotificationType.APPOINTMENT_RESCHEDULED,
      title: 'Rendez-vous reprogramme',
      recipients: (appointment) => this.allAppointmentRecipients(appointment),
      message: (appointment, role) => {
        const details = this.formatAppointmentDetails(appointment);
        if (role === UserRole.CLIENT) {
          return `Votre rendez-vous chez ${appointment.salon.name} est reprogramme au ${details.date} a ${details.time}.`;
        }
        return `Le rendez-vous de ${details.clientName} est reprogramme au ${details.date} a ${details.time}.`;
      },
    });
  }

  notifyAppointmentCancelled(
    input: AppointmentNotificationInput,
    prisma: DbClient = this.prisma,
  ) {
    return this.notifyAppointmentEvent({
      input,
      prisma,
      type: NotificationType.APPOINTMENT_CANCELLED,
      title: 'Rendez-vous annule',
      recipients: (appointment) => this.allAppointmentRecipients(appointment),
      message: (appointment, role) => {
        const details = this.formatAppointmentDetails(appointment);
        if (role === UserRole.CLIENT) {
          return `Votre rendez-vous chez ${appointment.salon.name} du ${details.date} a ${details.time} a ete annule.`;
        }
        return `Le rendez-vous de ${details.clientName} du ${details.date} a ${details.time} a ete annule.`;
      },
    });
  }

  notifyAppointmentPaid(
    input: AppointmentNotificationInput,
    prisma: DbClient = this.prisma,
  ) {
    return this.notifyAppointmentEvent({
      input,
      prisma,
      type: NotificationType.APPOINTMENT_PAID,
      title: 'Paiement enregistre',
      recipients: (appointment) => this.allAppointmentRecipients(appointment),
      eventKey: (appointment) =>
        appointment.paymentIntents[0]?.updatedAt?.getTime().toString() ??
        appointment.updatedAt.getTime().toString(),
      message: (appointment, role) => {
        const details = this.formatAppointmentDetails(appointment);
        if (role === UserRole.CLIENT) {
          return `Le paiement de votre rendez-vous chez ${appointment.salon.name} a ete enregistre.`;
        }
        return `Le paiement du rendez-vous de ${details.clientName} a ete enregistre.`;
      },
    });
  }

  private async notifyAppointmentEvent(options: {
    input: AppointmentNotificationInput;
    prisma: DbClient;
    type: NotificationType;
    title: string;
    eventKey?: string | ((appointment: AppointmentContext) => string);
    recipients: (appointment: AppointmentContext) => Array<Recipient | null>;
    message: (appointment: AppointmentContext, role: UserRole) => string;
  }) {
    const appointment = await this.loadAppointmentContext(
      options.input.appointmentId,
      options.prisma,
    );

    if (!appointment || !this.shouldAnnounceAppointment(appointment, options.type)) {
      return { createdCount: 0 };
    }

    const eventKey =
      typeof options.eventKey === 'function'
        ? options.eventKey(appointment)
        : options.eventKey ?? appointment.updatedAt.getTime().toString();

    const data = options
      .recipients(appointment)
      .filter((recipient): recipient is Recipient => Boolean(recipient?.userId))
      .map((recipient) => ({
        userId: recipient.userId!,
        salonId: appointment.salon.id,
        appointmentId: appointment.id,
        type: options.type,
        title: options.title,
        message: options.message(appointment, recipient.role),
        targetRoute: this.buildTargetRoute(
          recipient.role,
          appointment.id,
          appointment.startAt,
          appointment.salon.timezone || 'Africa/Libreville',
        ),
        metadata: {
          role: recipient.role,
          appointmentId: appointment.id,
          salonId: appointment.salon.id,
          employeeId: recipient.employeeId ?? appointment.employee?.id ?? null,
        },
        dedupeKey: this.buildDedupeKey(
          options.type,
          appointment.id,
          eventKey,
          recipient.role,
          recipient.userId!,
        ),
      }));

    if (!data.length) {
      return { createdCount: 0 };
    }

    return options.prisma.notification.createMany({
      data,
      skipDuplicates: true,
    });
  }

  private loadAppointmentContext(appointmentId: string, prisma: DbClient) {
    return prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        status: true,
        startAt: true,
        updatedAt: true,
        salon: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            timezone: true,
          },
        },
        employee: {
          select: {
            id: true,
            displayName: true,
            userId: true,
          },
        },
        client: {
          select: {
            id: true,
            email: true,
            phone: true,
            clientProfile: {
              select: { nickname: true },
            },
          },
        },
        paymentIntents: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { status: true, updatedAt: true },
        },
      },
    });
  }

  private async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  private shouldAnnounceAppointment(
    appointment: {
      status: AppointmentStatus;
      paymentIntents: Array<{ status: PaymentStatus }>;
    },
    type: NotificationType,
  ) {
    if (type === NotificationType.APPOINTMENT_CANCELLED) {
      return appointment.status === AppointmentStatus.CANCELLED;
    }

    if (
      appointment.status !== AppointmentStatus.PENDING &&
      appointment.status !== AppointmentStatus.CONFIRMED
    ) {
      return false;
    }

    const payment = appointment.paymentIntents[0];
    if (!payment) return true;

    if (type === NotificationType.APPOINTMENT_PAID) {
      return payment.status === PaymentStatus.SUCCEEDED;
    }

    return (
      payment.status === PaymentStatus.CREATED ||
      payment.status === PaymentStatus.SUCCEEDED
    );
  }

  private allAppointmentRecipients(appointment: AppointmentContext) {
    return [
      this.salonOwnerRecipient(appointment),
      this.employeeRecipient(appointment),
      this.clientRecipient(appointment),
    ];
  }

  private salonOwnerRecipient(appointment: AppointmentContext): Recipient {
    return {
      role: UserRole.PROFESSIONAL,
      userId: appointment.salon.ownerId,
    };
  }

  private employeeRecipient(appointment: AppointmentContext): Recipient | null {
    if (!appointment.employee?.userId) return null;
    return {
      role: UserRole.EMPLOYEE,
      userId: appointment.employee.userId,
      employeeId: appointment.employee.id,
    };
  }

  private clientRecipient(appointment: AppointmentContext): Recipient {
    return {
      role: UserRole.CLIENT,
      userId: appointment.client.id,
    };
  }

  private formatAppointmentDetails(appointment: AppointmentContext) {
    const timeZone = appointment.salon.timezone || 'Africa/Libreville';
    return {
      clientName: this.formatClientName(appointment.client),
      employeeName: appointment.employee?.displayName ?? 'assignation a venir',
      date: appointment.startAt.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone,
      }),
      time: appointment.startAt.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
      }),
    };
  }

  private formatClientName(client: {
    email: string | null;
    phone: string | null;
    clientProfile: { nickname: string } | null;
  }) {
    return (
      client.clientProfile?.nickname?.trim() ||
      client.email?.split('@')[0] ||
      client.phone ||
      'un client'
    );
  }

  private buildTargetRoute(
    role: UserRole,
    appointmentId: string,
    startAt: Date,
    timeZone: string,
  ) {
    if (role === UserRole.EMPLOYEE) {
      return `/(employee)/appointment-detail?id=${appointmentId}&kind=appointment`;
    }

    if (role === UserRole.CLIENT) {
      return '/(tabs)/appointments';
    }

    const date = startAt.toLocaleDateString('fr-CA', { timeZone }).slice(0, 10);

    return `/(professional)/agenda?appointmentId=${appointmentId}&date=${date}`;
  }

  private buildDedupeKey(
    type: NotificationType,
    appointmentId: string,
    eventKey: string,
    role: UserRole,
    recipientUserId: string,
  ) {
    return `${type}:${appointmentId}:${eventKey}:${role}:${recipientUserId}`;
  }
}
