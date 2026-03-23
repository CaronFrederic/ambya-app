import { ForbiddenException, Injectable } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureSalon(user: any) {
    if (!user?.salonId) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    }
    return user.salonId as string;
  }

  async getSummary(user: any) {
    const salonId = this.ensureSalon(user);

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [todayAppointments, monthPayments, monthExpenses, newClients] =
      await Promise.all([
        this.prisma.appointment.count({
          where: {
            salonId,
            startAt: {
              gte: todayStart,
              lt: tomorrowStart,
            },
            status: {
              notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.REJECTED],
            },
          },
        }),
        this.prisma.paymentIntent.aggregate({
          where: {
            salonId,
            status: 'SUCCEEDED',
            transactionDate: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
          _sum: {
            payableAmount: true,
          },
        }),
        this.prisma.expense.aggregate({
          where: {
            salonId,
            deletedAt: null,
            status: 'CONFIRMED',
            expenseDate: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        this.prisma.salonClient.count({
          where: {
            salonId,
            firstVisitAt: {
              gte: monthStart,
              lt: nextMonthStart,
            },
          },
        }),
      ]);

    return {
      todayAppointments,
      monthRevenue: monthPayments._sum.payableAmount ?? 0,
      monthExpenses: monthExpenses._sum.amount ?? 0,
      newClients,
      occupancyRate: 0,
    };
  }

  async getRecentTransactions(user: any) {
    const salonId = this.ensureSalon(user);

    return this.prisma.paymentIntent.findMany({
      where: {
        salonId,
      },
      orderBy: {
        transactionDate: 'desc',
      },
      take: 10,
      include: {
        appointment: {
          include: {
            client: true,
            service: true,
          },
        },
      },
    });
  }
}