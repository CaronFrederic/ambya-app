import { ForbiddenException, Injectable } from '@nestjs/common';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type DashboardUser = {
  userId: string;
  role: 'CLIENT' | 'PROFESSIONAL' | 'SALON_MANAGER' | 'EMPLOYEE' | 'ADMIN';
};

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private getMonthBounds(baseDate = new Date()) {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private getDayBounds(baseDate = new Date()) {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  private async getManagedSalonIds(user: DashboardUser): Promise<string[]> {
    if (user.role === 'CLIENT') {
      throw new ForbiddenException('Not allowed');
    }

    if (user.role === 'ADMIN') {
      const salons = await this.prisma.salon.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      return salons.map((s) => s.id);
    }

    if (user.role === 'PROFESSIONAL' || user.role === 'SALON_MANAGER') {
      const salons = await this.prisma.salon.findMany({
        where: {
          ownerId: user.userId,
          isActive: true,
        },
        select: { id: true },
      });
      return salons.map((s) => s.id);
    }

    if (user.role === 'EMPLOYEE') {
      const employeeLinks = await this.prisma.employee.findMany({
        where: {
          userId: user.userId,
          isActive: true,
        },
        select: { salonId: true },
      });

      return [...new Set(employeeLinks.map((e) => e.salonId))];
    }

    throw new ForbiddenException('Not allowed');
  }

  async getProfessionalDashboardSummary(user: DashboardUser) {
    const salonIds = await this.getManagedSalonIds(user);

    if (salonIds.length === 0) {
      return {
        todayAppointments: 0,
        monthlyRevenue: 0,
        occupancyRate: 0,
        newClients: 0,
        monthlyExpenses: 0,
      };
    }

    const now = new Date();
    const { start: monthStart, end: monthEnd } = this.getMonthBounds(now);
    const { start: dayStart, end: dayEnd } = this.getDayBounds(now);

    const todayAppointments = await this.prisma.appointment.count({
      where: {
        salonId: { in: salonIds },
        startAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.COMPLETED,
          ],
        },
      },
    });

    const monthlyPayments = await this.prisma.paymentIntent.findMany({
      where: {
        salonId: { in: salonIds },
        status: PaymentStatus.SUCCEEDED,
        createdAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        amount: true,
        payableAmount: true,
      },
    });

    const monthlyRevenue = monthlyPayments.reduce((sum, item) => {
      const value = item.payableAmount && item.payableAmount > 0 ? item.payableAmount : item.amount;
      return sum + value;
    }, 0);

    const monthlyExpensesAgg = await this.prisma.expense.aggregate({
      where: {
        salonId: { in: salonIds },
        expenseDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const monthlyExpenses = monthlyExpensesAgg._sum.amount ?? 0;

    const monthAppointments = await this.prisma.appointment.findMany({
      where: {
        salonId: { in: salonIds },
        startAt: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      select: {
        id: true,
        clientId: true,
        salonId: true,
        status: true,
        startAt: true,
      },
    });

    const productiveStatuses = new Set<AppointmentStatus>([
      AppointmentStatus.CONFIRMED,
      AppointmentStatus.COMPLETED,
    ]);

   const relevantStatuses: AppointmentStatus[] = [
  AppointmentStatus.PENDING,
  AppointmentStatus.CONFIRMED,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.NO_SHOW,
];

const totalRelevant = monthAppointments.filter((a) =>
  relevantStatuses.includes(a.status),
).length;

    const productiveCount = monthAppointments.filter((a) =>
      productiveStatuses.has(a.status),
    ).length;

    const occupancyRate =
      totalRelevant > 0 ? Math.round((productiveCount / totalRelevant) * 100) : 0;

    const uniqueMonthClients = [...new Set(monthAppointments.map((a) => a.clientId))];

    let newClients = 0;

    if (uniqueMonthClients.length > 0) {
      const firstAppointments = await Promise.all(
        uniqueMonthClients.map(async (clientId) => {
          const first = await this.prisma.appointment.findFirst({
            where: {
              salonId: { in: salonIds },
              clientId,
            },
            orderBy: {
              startAt: 'asc',
            },
            select: {
              clientId: true,
              startAt: true,
            },
          });

          return first;
        }),
      );

      newClients = firstAppointments.filter((item) => {
        if (!item) return false;
        return item.startAt >= monthStart && item.startAt <= monthEnd;
      }).length;
    }

    return {
      todayAppointments,
      monthlyRevenue,
      occupancyRate,
      newClients,
      monthlyExpenses,
    };
  }
}