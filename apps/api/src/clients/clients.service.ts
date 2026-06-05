import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListClientsDto } from './dto/list-clients.dto';
import { UpdateClientNoteDto } from './dto/update-client-note.dto';
import { UpdateDepositExemptDto } from './dto/update-deposit-exempt.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSalon(user: any) {
    if (user?.salonId) {
      return user.salonId as string;
    }

    const userId = user?.userId ?? user?.sub;

    if (!userId) {
      throw new ForbiddenException('Utilisateur invalide');
    }

    const salon = await this.prisma.salon.findFirst({
      where: {
        ownerId: userId,
      },
      select: {
        id: true,
      },
    });

    if (!salon) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    }

    return salon.id;
  }

  private getClientFullName(client: any) {
    return (
      client?.clientProfile?.nickname ||
      client?.email ||
      client?.phone ||
      'Client sans nom'
    );
  }

  private formatLastVisit(date?: Date | null) {
    if (!date) return null;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private buildPreferredServices(appointments: any[]) {
    const map = new Map<string, number>();

    for (const appointment of appointments) {
      const serviceName = appointment.service?.name ?? 'Service inconnu';
      map.set(serviceName, (map.get(serviceName) ?? 0) + 1);
    }

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private buildPreferredEmployees(appointments: any[]) {
    const map = new Map<string, { id: string; name: string; count: number }>();

    for (const appointment of appointments) {
      const employee = appointment.employee;
      if (!employee) continue;

      const id = employee.id;
      const name =
        employee.displayName ||
        [employee.firstName, employee.lastName].filter(Boolean).join(' ') ||
        employee.email ||
        'Employé';

      const current = map.get(id);

      map.set(id, {
        id,
        name,
        count: (current?.count ?? 0) + 1,
      });
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private formatClientDetails(salonClient: any) {
    const appointments = salonClient.appointments ?? [];

    const completedAppointments = appointments.filter(
      (appointment: any) => appointment.status === AppointmentStatus.COMPLETED,
    );

    const cancelledAppointments = appointments.filter(
      (appointment: any) =>
        appointment.status === AppointmentStatus.CANCELLED ||
        appointment.status === AppointmentStatus.NO_SHOW ||
        appointment.status === AppointmentStatus.REJECTED,
    );

    const revenueGenerated = completedAppointments.reduce(
      (sum: number, appointment: any) =>
        sum + (appointment.totalAmount ?? appointment.service?.price ?? 0),
      0,
    );

    const totalBookings = appointments.length;
    const completedBookings = completedAppointments.length;
    const cancelledBookings = cancelledAppointments.length;

    const averageBasket =
      completedBookings > 0
        ? Math.round(revenueGenerated / completedBookings)
        : 0;

    const lastCompleted = completedAppointments[0] ?? null;
    const notes = salonClient.notes?.[0]?.content ?? null;

    return {
      id: salonClient.id,
      fullName: this.getClientFullName(salonClient.client),
      phone: salonClient.client?.phone ?? null,
      email: salonClient.client?.email ?? null,
      createdAt: salonClient.createdAt ?? null,

      depositExempt: Boolean(salonClient.isDepositExempt),
      depositRate: salonClient.salon?.depositPercentage ?? 30,
      depositsPaidCount: 0,
      depositsPaidAmount: 0,

      notes,
      blocked: Boolean(salonClient.isBlocked),

      totalBookings,
      completedBookings,
      cancelledBookings,
      revenueGenerated,
      averageBasket,
      lastVisitLabel: this.formatLastVisit(lastCompleted?.startAt ?? null),

      loyaltyRateLabel:
        totalBookings > 0
          ? `${Math.round((completedBookings / totalBookings) * 100)}%`
          : null,

      noShowRateLabel:
        totalBookings > 0
          ? `${Math.round((cancelledBookings / totalBookings) * 100)}%`
          : null,

      allergyAlert: salonClient.client?.clientProfile?.allergies
        ? 'Allergies / sensibilités signalées'
        : null,

      allergyNote: salonClient.client?.clientProfile?.allergies ?? null,

      preferredServices: this.buildPreferredServices(appointments),
      preferredEmployees: this.buildPreferredEmployees(appointments),

      bookingHistory: appointments.slice(0, 10).map((appointment: any) => ({
        id: appointment.id,
        date: appointment.startAt,
        service: appointment.service?.name ?? 'Service inconnu',
        employee: appointment.employee?.displayName ?? 'Non assigné',
        amount: appointment.totalAmount ?? appointment.service?.price ?? 0,
        status:
          appointment.status === AppointmentStatus.COMPLETED
            ? 'COMPLETED'
            : 'CANCELLED',
      })),
    };
  }

  async findAll(user: any, query: ListClientsDto) {
    const salonId = await this.ensureSalon(user);

    return this.prisma.salonClient.findMany({
      where: {
        salonId,
        ...(query.search
          ? {
              client: {
                OR: [
                  {
                    email: {
                      contains: query.search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    phone: {
                      contains: query.search,
                    },
                  },
                  {
                    clientProfile: {
                      is: {
                        nickname: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },
                    },
                  },
                ],
              },
            }
          : {}),
      },
      include: {
        client: {
          include: {
            clientProfile: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findOne(user: any, id: string) {
    const salonId = await this.ensureSalon(user);

    const salonClient = await this.prisma.salonClient.findFirst({
      where: {
        id,
        salonId,
      },
      include: {
        salon: true,
        client: {
          include: {
            clientProfile: true,
          },
        },
        notes: {
          orderBy: {
            updatedAt: 'desc',
          },
          take: 1,
        },
        appointments: {
          include: {
            employee: true,
            service: true,
          },
          orderBy: {
            startAt: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!salonClient) {
      throw new NotFoundException('Client introuvable');
    }

    return this.formatClientDetails(salonClient);
  }

  async updateDepositExempt(
    user: any,
    id: string,
    dto: UpdateDepositExemptDto,
  ) {
    const salonId = await this.ensureSalon(user);

    const salonClient = await this.prisma.salonClient.findFirst({
      where: {
        id,
        salonId,
      },
    });

    if (!salonClient) {
      throw new NotFoundException('Client introuvable');
    }

    await this.prisma.salonClient.update({
      where: {
        id,
      },
      data: {
        isDepositExempt: dto.isDepositExempt,
      },
    });

    return this.findOne(user, id);
  }

  async upsertNote(user: any, id: string, dto: UpdateClientNoteDto) {
    const salonId = await this.ensureSalon(user);
    const userId = user?.userId ?? user?.sub;

    const salonClient = await this.prisma.salonClient.findFirst({
      where: {
        id,
        salonId,
      },
    });

    if (!salonClient) {
      throw new NotFoundException('Client introuvable');
    }

    const content = dto.content?.trim() ?? '';

    const existing = await this.prisma.clientNote.findFirst({
      where: {
        salonId,
        salonClientId: id,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (existing) {
      await this.prisma.clientNote.update({
        where: {
          id: existing.id,
        },
        data: {
          content,
          updatedById: userId,
        },
      });
    } else {
      await this.prisma.clientNote.create({
        data: {
          salonId,
          salonClientId: id,
          content,
          createdById: userId,
          updatedById: userId,
        },
      });
    }

    return this.findOne(user, id);
  }

  async blockClient(user: any, id: string) {
    const salonId = await this.ensureSalon(user);

    const salonClient = await this.prisma.salonClient.findFirst({
      where: {
        id,
        salonId,
      },
    });

    if (!salonClient) {
      throw new NotFoundException('Client introuvable');
    }

    await this.prisma.salonClient.update({
      where: {
        id,
      },
      data: {
        isBlocked: true,
      },
    });

    return this.findOne(user, id);
  }
}