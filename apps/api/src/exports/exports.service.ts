import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExportsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureSalon(user: any) {
    if (!user?.salonId) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    }
    return user.salonId as string;
  }

  async exportExpenses(user: any, month?: string) {
    const salonId = this.ensureSalon(user);

    const where: any = {
      salonId,
      deletedAt: null,
    };

    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);

      where.expenseDate = {
        gte: start,
        lt: end,
      };
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      orderBy: {
        expenseDate: 'desc',
      },
    });

    return {
      format: 'json-preview',
      type: 'expenses',
      count: expenses.length,
      rows: expenses,
    };
  }

  async exportAppointments(user: any, month?: string) {
    const salonId = this.ensureSalon(user);

    const where: any = {
      salonId,
    };

    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);

      where.startAt = {
        gte: start,
        lt: end,
      };
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        client: true,
        employee: true,
        service: true,
      },
      orderBy: {
        startAt: 'desc',
      },
    });

    return {
      format: 'json-preview',
      type: 'appointments',
      count: appointments.length,
      rows: appointments,
    };
  }
}