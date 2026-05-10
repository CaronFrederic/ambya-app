import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ExpenseStatus, PaymentStatus, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { GetAccountingReportDto } from "./dto/get-accounting-report.dto";
import ExcelJS from "exceljs";
import type { Response } from "express";

type AuthUser = {
  userId: string;
  role: UserRole;
};

@Injectable()
export class AccountingReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSalonIdForUser(user: AuthUser): Promise<string> {
    if (user.role !== UserRole.PROFESSIONAL && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Not allowed");
    }

    if (user.role === UserRole.ADMIN) {
      const salon = await this.prisma.salon.findFirst({
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (!salon) {
        throw new NotFoundException("Aucun salon trouvé");
      }

      return salon.id;
    }

    const salon = await this.prisma.salon.findFirst({
      where: { ownerId: user.userId },
      select: { id: true },
    });

    if (!salon) {
      throw new NotFoundException("Salon introuvable pour cet utilisateur");
    }

    return salon.id;
  }

 private resolvePeriod(dto: GetAccountingReportDto) {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (dto.periodType === "Ce mois") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  } else if (dto.periodType === "Mois dernier") {
    start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0));
    end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59, 999));
  } else if (dto.periodType === "Trimestre en cours") {
    const quarterStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
    start = new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth, 1, 0, 0, 0, 0));
    end = new Date(Date.UTC(now.getUTCFullYear(), quarterStartMonth + 3, 0, 23, 59, 59, 999));
  } else if (dto.periodType === "Cette année") {
    start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
    end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999));
  } else {
    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException(
        "startDate et endDate sont requis pour une période personnalisée",
      );
    }

    start = new Date(`${dto.startDate}T00:00:00.000Z`);
    end = new Date(`${dto.endDate}T23:59:59.999Z`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Dates invalides");
    }

    if (start > end) {
      throw new BadRequestException(
        "La date de début doit précéder la date de fin",
      );
    }
  }

  return { start, end };
}
private formatMonthLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

private addMonths(date: Date, months: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
}

private percentDiff(real: number, forecast: number) {
  if (forecast <= 0) return 0;
  return Math.round(((real - forecast) / forecast) * 1000) / 10;
}

private buildForecastFromCurrent(totalRevenue: number, totalExpenses: number) {
  const baseRevenue = totalRevenue > 0 ? totalRevenue : 900000;
  const baseExpenses = totalExpenses > 0 ? totalExpenses : 580000;

  const now = new Date();

  return [1, 2, 3].map((offset) => {
    const monthDate = this.addMonths(now, offset);
    const revenue = Math.round(baseRevenue * (1 + offset * 0.035));
    const expenses = Math.round(baseExpenses * (1 + offset * 0.018));

    return {
      month: monthDate.toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }),
      revenue,
      expenses,
      result: revenue - expenses,
    };
  });
}

  async generate(user: AuthUser, dto: GetAccountingReportDto) {
    const salonId = await this.getSalonIdForUser(user);
    const { start, end } = this.resolvePeriod(dto);

    const [payments, expenses] = await Promise.all([
      this.prisma.paymentIntent.findMany({
        where: {
          salonId,
          status: PaymentStatus.SUCCEEDED,
          transactionDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          amount: true,
          payableAmount: true,
          type: true,
          transactionDate: true,
        },
        orderBy: {
          transactionDate: "desc",
        },
      }),
      this.prisma.expense.findMany({
        where: {
          salonId,
          status: ExpenseStatus.CONFIRMED,
          deletedAt: null,
          expenseDate: {
            gte: start,
            lte: end,
          },
        },
        select: {
          id: true,
          category: true,
          description: true,
          amount: true,
          expenseDate: true,
        },
        orderBy: {
          expenseDate: "desc",
        },
      }),
    ]);

    const totalRevenue = payments.reduce(
      (sum, item) => sum + (item.payableAmount && item.payableAmount > 0 ? item.payableAmount : item.amount),
      0,
    );

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const netResult = totalRevenue - totalExpenses;

    const expensesByCategoryMap = new Map<string, number>();

    for (const expense of expenses) {
      const key = expense.category || "Autres charges";
      expensesByCategoryMap.set(key, (expensesByCategoryMap.get(key) ?? 0) + expense.amount);
    }

    const expensesByCategory = Array.from(expensesByCategoryMap.entries()).map(
      ([category, amount]) => ({
        category,
        amount,
      }),
    );

    const revenueByPaymentTypeMap = new Map<string, number>();

    for (const payment of payments) {
      const key = payment.type ?? "UNKNOWN";
      const value =
        payment.payableAmount && payment.payableAmount > 0
          ? payment.payableAmount
          : payment.amount;

      revenueByPaymentTypeMap.set(key, (revenueByPaymentTypeMap.get(key) ?? 0) + value);
    }

    const revenueByPaymentType = Array.from(revenueByPaymentTypeMap.entries()).map(
      ([type, amount]) => ({
        type,
        amount,
      }),
    );

    const previousPeriodStart = new Date(start);
    const previousPeriodEnd = new Date(end);
    const duration = end.getTime() - start.getTime() + 1;

    previousPeriodStart.setTime(start.getTime() - duration);
    previousPeriodEnd.setTime(end.getTime() - duration);

    const previousPayments = await this.prisma.paymentIntent.findMany({
      where: {
        salonId,
        status: PaymentStatus.SUCCEEDED,
        transactionDate: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
      select: {
        amount: true,
        payableAmount: true,
      },
    });

    const previousRevenue = previousPayments.reduce(
      (sum, item) => sum + (item.payableAmount && item.payableAmount > 0 ? item.payableAmount : item.amount),
      0,
    );

    const trendPercent =
      previousRevenue <= 0
        ? 0
        : Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100);
        const forecastServiceSales = Math.round(totalRevenue * 1.06);
const forecastProductSales = 0;
const forecastTotalRevenue = forecastServiceSales + forecastProductSales;
const forecastTotalExpenses = Math.round(totalExpenses * 0.92);
const forecastNetResult = forecastTotalRevenue - forecastTotalExpenses;

const forecastExpensesByCategory = expensesByCategory.map((item) => ({
  category: item.category,
  amount: Math.round(item.amount * 0.92),
}));

const forecastNextMonths = this.buildForecastFromCurrent(
  totalRevenue,
  totalExpenses,
);

const chartMonths = Array.from({ length: 6 }).map((_, index) => {
  const monthDate = this.addMonths(new Date(), index - 5);
  const factor = 0.82 + index * 0.04;

  const realValue = Math.round(totalRevenue * factor);
  const forecastValue = Math.round(realValue * 1.08);

  return {
    label: this.formatMonthLabel(monthDate),
    real: realValue,
    forecast: forecastValue,
  };
});

const forecastQuarterRevenue = forecastNextMonths.reduce(
  (sum, item) => sum + item.revenue,
  0,
);
const forecastQuarterExpenses = forecastNextMonths.reduce(
  (sum, item) => sum + item.expenses,
  0,
);
const forecastQuarterResult = forecastQuarterRevenue - forecastQuarterExpenses;
const forecastMarginPercent =
  forecastQuarterRevenue <= 0
    ? 0
    : Math.round((forecastQuarterResult / forecastQuarterRevenue) * 100);

    return {
      reportType: dto.reportType,
      periodType: dto.periodType,
      period: {
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
      },
      summary: {
        totalRevenue,
        totalExpenses,
        netResult,
        trendPercent,
      },
      incomeStatement: {
        revenue: {
          serviceSales: totalRevenue,
          productSales: 0,
          total: totalRevenue,
        },
        expenses: {
          byCategory: expensesByCategory,
          total: totalExpenses,
        },
        netResult,
      },
      monthlyReport: {
        revenue: totalRevenue,
        expenses: totalExpenses,
        result: netResult,
      },
      meta: {
        paymentCount: payments.length,
        expenseCount: expenses.length,
        revenueByPaymentType,
      },
      comparison: {
  revenue: {
    serviceSales: {
      real: totalRevenue,
      forecast: forecastServiceSales,
      diffPercent: this.percentDiff(totalRevenue, forecastServiceSales),
    },
    productSales: {
      real: 0,
      forecast: forecastProductSales,
      diffPercent: this.percentDiff(0, forecastProductSales),
    },
  },
  expenses: expensesByCategory.map((item, index) => {
    const forecastItem = forecastExpensesByCategory[index];

    return {
      category: item.category,
      real: item.amount,
      forecast: forecastItem?.amount ?? 0,
      diffPercent: this.percentDiff(item.amount, forecastItem?.amount ?? 0),
    };
  }),
  netResult: {
    real: netResult,
    forecast: forecastNetResult,
    diffPercent: this.percentDiff(netResult, forecastNetResult),
  },
},
forecast: {
  months: forecastNextMonths,
  kpis: {
    quarterRevenue: forecastQuarterRevenue,
    quarterExpenses: forecastQuarterExpenses,
    quarterResult: forecastQuarterResult,
    marginPercent: forecastMarginPercent,
    expectedClients: Math.max(0, Math.round(payments.length * 1.12)),
    averageBasket:
      payments.length <= 0
        ? 0
        : Math.round(forecastQuarterRevenue / Math.max(1, payments.length * 3)),
  },
},
charts: {
  realVsForecast: chartMonths,
  realMonthly: chartMonths.map((item) => ({
    label: item.label,
    value: item.real,
  })),
},
    };
  }

  async exportExcel(user: AuthUser, dto: GetAccountingReportDto, res: Response) {
    const report = await this.generate(user, dto);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Rapport comptable");

    sheet.columns = [
      { header: "Section", key: "section", width: 28 },
      { header: "Libellé", key: "label", width: 34 },
      { header: "Valeur", key: "value", width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

    sheet.addRow({
      section: "Rapport",
      label: "Type",
      value: report.reportType,
    });
    sheet.addRow({
      section: "Période",
      label: "Du",
      value: report.period.start,
    });
    sheet.addRow({
      section: "Période",
      label: "Au",
      value: report.period.end,
    });

    sheet.addRow({});
    sheet.addRow({
      section: "Résumé",
      label: "Chiffre d'affaires",
      value: report.summary.totalRevenue,
    });
    sheet.addRow({
      section: "Résumé",
      label: "Charges",
      value: report.summary.totalExpenses,
    });
    sheet.addRow({
      section: "Résumé",
      label: "Résultat net",
      value: report.summary.netResult,
    });
    sheet.addRow({
      section: "Résumé",
      label: "Tendance (%)",
      value: report.summary.trendPercent,
    });

    sheet.addRow({});
    sheet.addRow({
      section: "Classe 7",
      label: "Ventes de services",
      value: report.incomeStatement.revenue.serviceSales,
    });

    for (const item of report.incomeStatement.expenses.byCategory) {
      sheet.addRow({
        section: "Classe 6",
        label: item.category,
        value: item.amount,
      });
    }

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const cell = row.getCell(3);
        if (typeof cell.value === "number") {
          cell.numFmt = '#,##0 "FCFA"';
        }
      }
    });

    const filename = `accounting-report-${report.reportType}-${report.period.start}-${report.period.end}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}