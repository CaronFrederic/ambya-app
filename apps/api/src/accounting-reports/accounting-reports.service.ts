import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AppointmentStatus,
  ExpenseStatus,
  PaymentStatus,
  UserRole,
} from "@prisma/client";
import ExcelJS from "exceljs";
import type { Response } from "express";
import PDFDocument = require("pdfkit");

import { PrismaService } from "../prisma/prisma.service";
import { GetAccountingReportDto } from "./dto/get-accounting-report.dto";

type AuthUser = {
  userId: string;
  role: UserRole;
};

type PeriodRange = {
  start: Date;
  end: Date;
};

type RegisterLine = {
  id: string;
  date: string;
  label: string;
  category: string;
  amount: number;
  receiptNumber?: string | null;
  paymentMethod?: string | null;
  entryDate?: string | null;
};

type RegisterReport = Awaited<
  ReturnType<AccountingReportsService["generate"]>
>;

const DISCLAIMER =
  "Ce registre est un outil de suivi de gestion. Il ne constitue pas un document comptable et ne remplace pas votre comptable.";

@Injectable()
export class AccountingReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSalonForUser(user: AuthUser) {
    if (
      user.role !== UserRole.PROFESSIONAL &&
      user.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException("Accès non autorisé.");
    }

    const salon =
      user.role === UserRole.ADMIN
        ? await this.prisma.salon.findFirst({
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
              name: true,
              city: true,
            },
          })
        : await this.prisma.salon.findFirst({
            where: {
              ownerId: user.userId,
            },
            select: {
              id: true,
              name: true,
              city: true,
            },
          });

    if (!salon) {
      throw new NotFoundException(
        "Salon introuvable pour cet utilisateur."
      );
    }

    return salon;
  }

  private resolvePeriod(dto: GetAccountingReportDto): PeriodRange {
    const now = new Date();

    if (dto.periodType === "Ce mois") {
      return {
        start: new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            1,
            0,
            0,
            0,
            0
          )
        ),
        end: now,
      };
    }

    if (dto.periodType === "Trimestre") {
      const quarterStartMonth =
        Math.floor(now.getUTCMonth() / 3) * 3;

      return {
        start: new Date(
          Date.UTC(
            now.getUTCFullYear(),
            quarterStartMonth,
            1,
            0,
            0,
            0,
            0
          )
        ),
        end: now,
      };
    }

    if (dto.periodType === "Année") {
      return {
        start: new Date(
          Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0)
        ),
        end: now,
      };
    }

    if (!dto.startDate || !dto.endDate) {
      throw new BadRequestException(
        "startDate et endDate sont requis pour la période Choisir."
      );
    }

    const start = new Date(`${dto.startDate}T00:00:00.000Z`);
    const requestedEnd = new Date(
      `${dto.endDate}T23:59:59.999Z`
    );

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(requestedEnd.getTime())
    ) {
      throw new BadRequestException("Dates invalides.");
    }

    if (start > requestedEnd) {
      throw new BadRequestException(
        "La date de début doit précéder la date de fin."
      );
    }

    const end =
      requestedEnd.getTime() > now.getTime() ? now : requestedEnd;

    return {
      start,
      end,
    };
  }

  private formatYmd(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString("fr-FR", {
      timeZone: "UTC",
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString("fr-FR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private formatPeriodLabel(start: Date, end: Date): string {
    return `Du ${this.formatDate(start)} au ${this.formatDate(end)}`;
  }

  private addUtcMonths(date: Date, months: number): Date {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth() + months,
        1,
        0,
        0,
        0,
        0
      )
    );
  }

  private getPreviousMonthRanges(
    referenceStart: Date
  ): PeriodRange[] {
    const referenceMonth = new Date(
      Date.UTC(
        referenceStart.getUTCFullYear(),
        referenceStart.getUTCMonth(),
        1
      )
    );

    return [3, 2, 1].map((monthsBack) => {
      const start = this.addUtcMonths(
        referenceMonth,
        -monthsBack
      );
      const end = new Date(
        Date.UTC(
          start.getUTCFullYear(),
          start.getUTCMonth() + 1,
          0,
          23,
          59,
          59,
          999
        )
      );

      return {
        start,
        end,
      };
    });
  }

  private percentDiff(
    real: number,
    estimated: number
  ): number | null {
    if (estimated === 0) {
      return real === 0 ? null : null;
    }

    return (
      Math.round(
        ((real - estimated) / estimated) * 1000
      ) / 10
    );
  }

  private getPaymentAmount(payment: {
    amount: number;
    payableAmount: number | null;
  }): number {
    return payment.payableAmount &&
      payment.payableAmount > 0
      ? payment.payableAmount
      : payment.amount;
  }

  private async getPeriodData(
    salonId: string,
    range: PeriodRange
  ) {
    const [appointments, productSales, expenses] = await Promise.all([
      this.prisma.appointment.findMany({
        where: {
          salonId,
          status: AppointmentStatus.COMPLETED,
          startAt: {
            gte: range.start,
            lte: range.end,
          },
        },
        select: {
          id: true,
          startAt: true,
          service: {
            select: {
              name: true,
            },
          },
          paymentIntents: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              status: true,
              amount: true,
              payableAmount: true,
              type: true,
              transactionDate: true,
              createdAt: true,
            },
          },
        },
        orderBy: { startAt: "asc" },
      }),
      this.prisma.manualProductSale.findMany({
        where: {
          salonId,
          saleDate: {
            gte: range.start,
            lte: range.end,
          },
        },
        select: {
          id: true,
          amount: true,
          saleDate: true,
          createdAt: true,
        },
        orderBy: { saleDate: "asc" },
      }),
      this.prisma.expense.findMany({
        where: {
          salonId,
          status: ExpenseStatus.CONFIRMED,
          deletedAt: null,
          expenseDate: {
            gte: range.start,
            lte: range.end,
          },
        },
        select: {
          id: true,
          category: true,
          description: true,
          amount: true,
          expenseDate: true,
          createdAt: true,
          receiptNumber: true,
          paymentMethod: true,
          isInvestment: true,
        },
        orderBy: { expenseDate: "asc" },
      }),
    ]);

    // Une prestation n'entre dans les recettes que si le rendez-vous est
    // honoré (COMPLETED) et possède au moins un paiement encore SUCCEEDED.
    // Un PaymentIntent passé à REFUNDED n'est donc jamais comptabilisé.
    // Si plusieurs tentatives ont réussi, on retient la plus récente afin
    // d'éviter de compter deux fois le même rendez-vous.
    const paidAppointments = appointments.flatMap((appointment) => {
      const payment = appointment.paymentIntents.find(
        (intent) => intent.status === PaymentStatus.SUCCEEDED
      );

      return payment
        ? [
            {
              appointmentId: appointment.id,
              startAt: appointment.startAt,
              serviceName: appointment.service.name,
              payment,
            },
          ]
        : [];
    });

    const operatingExpenses = expenses.filter(
      (expense) => !expense.isInvestment
    );
    const investments = expenses.filter(
      (expense) => expense.isInvestment
    );

    const serviceRevenue = paidAppointments.reduce(
      (sum, item) => sum + this.getPaymentAmount(item.payment),
      0
    );

    const productRevenue = productSales.reduce(
      (sum, sale) => sum + sale.amount,
      0
    );

    const totalRevenue = serviceRevenue + productRevenue;

    const totalExpenses = operatingExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const totalInvestments = investments.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return {
      paidAppointments,
      productSales,
      operatingExpenses,
      investments,
      serviceRevenue,
      productRevenue,
      totalRevenue,
      totalExpenses,
      totalInvestments,
      result: totalRevenue - totalExpenses,
    };
  }

  private buildExpenseCategories(
    expenses: Array<{
      category: string;
      amount: number;
    }>
  ) {
    const totals = new Map<string, number>();

    for (const expense of expenses) {
      const category = expense.category || "Autres";

      totals.set(
        category,
        (totals.get(category) ?? 0) + expense.amount
      );
    }

    return Array.from(totals.entries())
      .map(([category, amount]) => ({
        category,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  private buildRevenueLines(
    paidAppointments: Array<{
      appointmentId: string;
      startAt: Date;
      serviceName: string;
      payment: {
        amount: number;
        payableAmount: number | null;
        type: unknown;
      };
    }>,
    productSales: Array<{
      id: string;
      amount: number;
      saleDate: Date;
      createdAt: Date;
    }>
  ): RegisterLine[] {
    const serviceLines: RegisterLine[] = paidAppointments.map((item) => ({
      id: item.appointmentId,
      date: this.formatYmd(item.startAt),
      label: item.serviceName || "Prestation",
      category: "Prestations",
      amount: this.getPaymentAmount(item.payment),
      paymentMethod: String(item.payment.type ?? ""),
    }));

    const productLines: RegisterLine[] = productSales.map((sale) => ({
      id: sale.id,
      date: this.formatYmd(sale.saleDate),
      label: "Vente de produits",
      category: "Ventes de produits",
      amount: sale.amount,
      entryDate: sale.createdAt.toISOString(),
    }));

    return [...serviceLines, ...productLines].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }

  private buildExpenseLines(
    expenses: Array<{
      id: string;
      category: string;
      description: string | null;
      amount: number;
      expenseDate: Date;
      createdAt: Date;
      receiptNumber: string | null;
      paymentMethod: unknown;
    }>
  ): RegisterLine[] {
    return expenses.map((expense) => ({
      id: expense.id,
      date: this.formatYmd(expense.expenseDate),
      label: expense.description || expense.category,
      category: expense.category,
      amount: expense.amount,
      receiptNumber: expense.receiptNumber,
      paymentMethod: expense.paymentMethod
        ? String(expense.paymentMethod)
        : null,
      entryDate: expense.createdAt.toISOString(),
    }));
  }

  async generate(
    user: AuthUser,
    dto: GetAccountingReportDto
  ) {
    const salon = await this.getSalonForUser(user);
    const range = this.resolvePeriod(dto);
    const data = await this.getPeriodData(
      salon.id,
      range
    );

    const previousRanges = this.getPreviousMonthRanges(
      range.start
    );

    const previousData = await Promise.all(
      previousRanges.map((previousRange) =>
        this.getPeriodData(salon.id, previousRange)
      )
    );

    const estimatedRevenue = Math.round(
      previousData.reduce(
        (sum, item) => sum + item.totalRevenue,
        0
      ) / previousData.length
    );

    const estimatedExpenses = Math.round(
      previousData.reduce(
        (sum, item) => sum + item.totalExpenses,
        0
      ) / previousData.length
    );

    const estimatedResult = Math.round(
      previousData.reduce(
        (sum, item) => sum + item.result,
        0
      ) / previousData.length
    );

    const expensesByCategory =
      this.buildExpenseCategories(
        data.operatingExpenses
      );

    const generatedAt = new Date();

    return {
      periodType: dto.periodType,
      period: {
        start: this.formatYmd(range.start),
        end: this.formatYmd(range.end),
        label: this.formatPeriodLabel(
          range.start,
          range.end
        ),
        isCurrentPeriod:
          range.end.getTime() >=
          generatedAt.getTime() - 60_000,
      },
      establishment: {
        name: salon.name,
        city: salon.city ?? null,
      },
      generatedAt: generatedAt.toISOString(),
      revenue: {
        services: data.serviceRevenue,
        products: data.productRevenue,
        total: data.totalRevenue,
        lineCount:
          data.paidAppointments.length + data.productSales.length,
        serviceLineCount: data.paidAppointments.length,
        productLineCount: data.productSales.length,
        productSales: data.productSales.map((sale) => ({
          id: sale.id,
          amount: sale.amount,
          saleDate: this.formatYmd(sale.saleDate),
          createdAt: sale.createdAt.toISOString(),
        })),
        lines: this.buildRevenueLines(
          data.paidAppointments,
          data.productSales
        ),
      },
      expenses: {
        byCategory: expensesByCategory,
        total: data.totalExpenses,
        lineCount: data.operatingExpenses.length,
        lines: this.buildExpenseLines(
          data.operatingExpenses
        ),
      },
      result: data.result,
      investments: {
        total: data.totalInvestments,
        lineCount: data.investments.length,
        lines: this.buildExpenseLines(
          data.investments
        ),
      },
      comparison: {
        basisLabel: `Estimé sur vos trois derniers mois (${previousRanges
          .map((previousRange) =>
            previousRange.start.toLocaleDateString(
              "fr-FR",
              {
                month: "short",
                timeZone: "UTC",
              }
            )
          )
          .join(" à ")}).`,
        revenue: {
          real: data.totalRevenue,
          estimated: estimatedRevenue,
          diffPercent: this.percentDiff(
            data.totalRevenue,
            estimatedRevenue
          ),
        },
        expenses: {
          real: data.totalExpenses,
          estimated: estimatedExpenses,
          diffPercent: this.percentDiff(
            data.totalExpenses,
            estimatedExpenses
          ),
        },
        result: {
          real: data.result,
          estimated: estimatedResult,
          diffPercent: this.percentDiff(
            data.result,
            estimatedResult
          ),
        },
      },
    };
  }

  private parseManualSaleDate(value: string): Date {
    const date = new Date(`${value}T12:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Date de vente invalide.");
    }

    const today = new Date().toISOString().slice(0, 10);

    if (value > today) {
      throw new BadRequestException(
        "La date de vente ne peut pas être dans le futur."
      );
    }

    return date;
  }

  async createManualProductSale(
    user: AuthUser,
    dto: { amount: number; saleDate: string }
  ) {
    const salon = await this.getSalonForUser(user);

    return this.prisma.manualProductSale.create({
      data: {
        salonId: salon.id,
        amount: dto.amount,
        saleDate: this.parseManualSaleDate(dto.saleDate),
        createdById: user.userId,
      },
    });
  }

  async updateManualProductSale(
    user: AuthUser,
    saleId: string,
    dto: { amount: number; saleDate: string }
  ) {
    const salon = await this.getSalonForUser(user);
    const existing = await this.prisma.manualProductSale.findFirst({
      where: { id: saleId, salonId: salon.id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Vente de produits introuvable.");
    }

    return this.prisma.manualProductSale.update({
      where: { id: saleId },
      data: {
        amount: dto.amount,
        saleDate: this.parseManualSaleDate(dto.saleDate),
      },
    });
  }

  async deleteManualProductSale(
    user: AuthUser,
    saleId: string
  ) {
    const salon = await this.getSalonForUser(user);
    const existing = await this.prisma.manualProductSale.findFirst({
      where: { id: saleId, salonId: salon.id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Vente de produits introuvable.");
    }

    await this.prisma.manualProductSale.delete({
      where: { id: saleId },
    });

    return { success: true };
  }

  private sanitizeFilename(value: string): string {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private buildFilename(
    report: RegisterReport,
    extension: "pdf" | "xlsx"
  ): string {
    const salonName =
      this.sanitizeFilename(
        report.establishment.name
      ) || "Etablissement";

    const period = report.period.start.slice(0, 7);

    return `AMBYA_Registre_${salonName}_${period}.${extension}`;
  }

  async exportExcel(
    user: AuthUser,
    dto: GetAccountingReportDto,
    response: Response
  ) {
    const report = await this.generate(user, dto);
    const workbook = new ExcelJS.Workbook();

    workbook.creator = "AMBYA";
    workbook.created = new Date(report.generatedAt);

    const summary = workbook.addWorksheet(
      "Récapitulatif"
    );

    summary.columns = [
      {
        header: "Rubrique",
        key: "label",
        width: 38,
      },
      {
        header: "Montant TTC (FCFA)",
        key: "amount",
        width: 24,
      },
    ];

    summary.addRow({
      label: "Registre de gestion",
      amount: null,
    });
    summary.addRow({
      label: "Établissement",
      amount: report.establishment.name,
    });
    summary.addRow({
      label: "Période",
      amount: report.period.label,
    });
    summary.addRow({
      label: "Généré le",
      amount: this.formatDateTime(
        new Date(report.generatedAt)
      ),
    });
    summary.addRow({});

    summary.addRow({
      label: "RECETTES",
      amount: null,
    });
    summary.addRow({
      label: "Prestations",
      amount: report.revenue.services,
    });
    summary.addRow({
      label: "Ventes de produits",
      amount: report.revenue.products,
    });
    summary.addRow({
      label: "Total recettes",
      amount: report.revenue.total,
    });

    summary.addRow({});
    summary.addRow({
      label: "DÉPENSES",
      amount: null,
    });

    for (const expense of report.expenses.byCategory) {
      summary.addRow({
        label: expense.category,
        amount: expense.amount,
      });
    }

    summary.addRow({
      label: "Total dépenses",
      amount: report.expenses.total,
    });
    summary.addRow({
      label: "RÉSULTAT DE LA PÉRIODE",
      amount: report.result,
    });
    summary.addRow({});
    summary.addRow({
      label: "Investissements — hors résultat",
      amount: report.investments.total,
    });
    summary.addRow({});
    summary.addRow({
      label: "Réalisé — recettes",
      amount: report.comparison.revenue.real,
    });
    summary.addRow({
      label: "Estimé — recettes",
      amount: report.comparison.revenue.estimated,
    });
    summary.addRow({
      label: "Réalisé — dépenses",
      amount: report.comparison.expenses.real,
    });
    summary.addRow({
      label: "Estimé — dépenses",
      amount: report.comparison.expenses.estimated,
    });
    summary.addRow({
      label: "Réalisé — résultat",
      amount: report.comparison.result.real,
    });
    summary.addRow({
      label: "Estimé — résultat",
      amount: report.comparison.result.estimated,
    });
    summary.addRow({});
    summary.addRow({
      label: DISCLAIMER,
      amount: null,
    });

    summary.getRow(1).font = {
      bold: true,
      size: 16,
      color: {
        argb: "FF6B2737",
      },
    };

    summary.eachRow((row) => {
      const amountCell = row.getCell(2);

      if (typeof amountCell.value === "number") {
        amountCell.numFmt = '#,##0 "FCFA"';
      }
    });

    const detail = workbook.addWorksheet("Détail");

    detail.columns = [
      {
        header: "Type",
        key: "type",
        width: 18,
      },
      {
        header: "Date",
        key: "date",
        width: 14,
      },
      {
        header: "Libellé",
        key: "label",
        width: 36,
      },
      {
        header: "Catégorie",
        key: "category",
        width: 32,
      },
      {
        header: "Montant TTC (FCFA)",
        key: "amount",
        width: 22,
      },
      {
        header: "Mode de paiement",
        key: "paymentMethod",
        width: 22,
      },
      {
        header: "N° reçu",
        key: "receiptNumber",
        width: 20,
      },
      {
        header: "Date de saisie",
        key: "entryDate",
        width: 20,
      },
    ];

    const appendLine = (
      type: string,
      line: RegisterLine
    ) => {
      detail.addRow({
        type,
        date: new Date(`${line.date}T00:00:00.000Z`),
        label: line.label,
        category: line.category,
        amount: line.amount,
        paymentMethod: line.paymentMethod ?? "",
        receiptNumber: line.receiptNumber ?? "",
        entryDate: line.entryDate
          ? new Date(line.entryDate)
          : "",
      });
    };

    report.revenue.lines.forEach((line) =>
      appendLine("Recette", line)
    );
    report.expenses.lines.forEach((line) =>
      appendLine("Dépense", line)
    );
    report.investments.lines.forEach((line) =>
      appendLine("Investissement", line)
    );

    detail.getRow(1).font = {
      bold: true,
    };
    detail.getColumn("date").numFmt = "dd/mm/yyyy";
    detail.getColumn("amount").numFmt =
      '#,##0 "FCFA"';
    detail.getColumn("entryDate").numFmt =
      "dd/mm/yyyy hh:mm";

    const filename = this.buildFilename(
      report,
      "xlsx"
    );

    response.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    await workbook.xlsx.write(response);
    response.end();
  }

  async exportPdf(
    user: AuthUser,
    dto: GetAccountingReportDto,
    response: Response
  ) {
    const report = await this.generate(user, dto);
    const filename = this.buildFilename(
      report,
      "pdf"
    );

    response.setHeader(
      "Content-Type",
      "application/pdf"
    );
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    const document = new PDFDocument({
      size: "A4",
      margin: 46,
      info: {
        Title: "AMBYA — Registre de gestion",
        Author: "AMBYA",
      },
    });

    document.pipe(response);

    const brand = "#6B2737";
    const gold = "#D4AF6A";
    const text = "#2A1B20";
    const muted = "#8A7A7E";

    const money = (value: number) =>
      `${new Intl.NumberFormat("fr-FR").format(
        value
      )} FCFA`;

    const row = (
      label: string,
      value: number,
      bold = false
    ) => {
      document
        .font(bold ? "Helvetica-Bold" : "Helvetica")
        .fillColor(text)
        .fontSize(10.5)
        .text(label, {
          continued: true,
        })
        .text(money(value), {
          align: "right",
        });
    };

    const section = (title: string) => {
      document
        .moveDown(0.8)
        .font("Helvetica-Bold")
        .fillColor(muted)
        .fontSize(10)
        .text(title.toUpperCase(), {
          characterSpacing: 1.2,
        })
        .moveDown(0.5);
    };

    document
      .font("Helvetica-Bold")
      .fillColor(gold)
      .fontSize(11)
      .text("A M B Y A", {
        align: "center",
        characterSpacing: 4,
      });

    document
      .moveDown(0.4)
      .fillColor(brand)
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("Registre de gestion", {
        align: "center",
      });

    document
      .moveDown(0.3)
      .font("Helvetica")
      .fillColor(muted)
      .fontSize(10)
      .text(
        `${report.establishment.name}${
          report.establishment.city
            ? ` · ${report.establishment.city}`
            : ""
        }`,
        {
          align: "center",
        }
      )
      .text(report.period.label, {
        align: "center",
      })
      .text(
        `Document généré le ${this.formatDateTime(
          new Date(report.generatedAt)
        )}`,
        {
          align: "center",
        }
      );

    document
      .moveDown(0.8)
      .strokeColor(gold)
      .lineWidth(1)
      .moveTo(46, document.y)
      .lineTo(549, document.y)
      .stroke();

    section("Recettes");
    row("Prestations", report.revenue.services);
    row(
      "Ventes de produits",
      report.revenue.products
    );
    row("Total", report.revenue.total, true);

    document
      .font("Helvetica-Oblique")
      .fillColor(muted)
      .fontSize(9)
      .text(
        "Encaissements de la période · montants TTC"
      );

    section("Dépenses");

    if (report.expenses.byCategory.length === 0) {
      document
        .font("Helvetica")
        .fillColor(muted)
        .fontSize(10.5)
        .text("Aucune dépense enregistrée");
    } else {
      report.expenses.byCategory.forEach(
        (expense) =>
          row(expense.category, expense.amount)
      );
    }

    row("Total", report.expenses.total, true);

    document
      .moveDown(0.8)
      .roundedRect(46, document.y, 503, 54, 8)
      .fill(brand);

    const resultY = document.y - 42;

    document
      .fillColor(gold)
      .font("Helvetica-Bold")
      .fontSize(11)
      .text("RÉSULTAT DE LA PÉRIODE", 62, resultY, {
        continued: true,
      })
      .fillColor("#FFFFFF")
      .fontSize(17)
      .text(money(report.result), {
        align: "right",
      });

    document.y = resultY + 58;

    section("En dehors du résultat");
    row(
      "Investissements",
      report.investments.total,
      true
    );

    section("Comparaison avec vos mois précédents");
    row(
      "Recettes — réalisé",
      report.comparison.revenue.real
    );
    row(
      "Recettes — estimé",
      report.comparison.revenue.estimated
    );
    row(
      "Dépenses — réalisé",
      report.comparison.expenses.real
    );
    row(
      "Dépenses — estimé",
      report.comparison.expenses.estimated
    );
    row(
      "Résultat — réalisé",
      report.comparison.result.real
    );
    row(
      "Résultat — estimé",
      report.comparison.result.estimated
    );

    document
      .moveDown(0.4)
      .font("Helvetica-Oblique")
      .fillColor(muted)
      .fontSize(9)
      .text(report.comparison.basisLabel);

    section("Détail ligne par ligne");

    const writeDetail = (
      title: string,
      lines: RegisterLine[]
    ) => {
      document
        .font("Helvetica-Bold")
        .fillColor(brand)
        .fontSize(10)
        .text(title);

      if (lines.length === 0) {
        document
          .font("Helvetica")
          .fillColor(muted)
          .text("Aucune ligne.");
        return;
      }

      for (const line of lines) {
        document
          .font("Helvetica")
          .fillColor(text)
          .fontSize(8.5)
          .text(
            `${line.date} · ${line.label} · ${line.category} · ${money(
              line.amount
            )}${
              line.receiptNumber
                ? ` · Reçu ${line.receiptNumber}`
                : ""
            }`
          );
      }

      document.moveDown(0.4);
    };

    writeDetail(
      "Recettes",
      report.revenue.lines
    );
    writeDetail(
      "Dépenses",
      report.expenses.lines
    );
    writeDetail(
      "Investissements",
      report.investments.lines
    );

    document
      .moveDown(1)
      .strokeColor("#D8C6CE")
      .dash(3, {
        space: 3,
      })
      .moveTo(46, document.y)
      .lineTo(549, document.y)
      .stroke()
      .undash();

    document
      .moveDown(0.8)
      .font("Helvetica-Oblique")
      .fillColor(muted)
      .fontSize(9)
      .text(
        `Montants TTC. ${DISCLAIMER}`
      )
      .moveDown(0.4)
      .text(
        "Les justificatifs ne sont pas joints. Conservez vos reçus papier."
      );

    document.end();
  }
}
