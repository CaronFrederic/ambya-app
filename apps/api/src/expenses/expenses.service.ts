import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, EXPENSE_CATEGORIES } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureSalon(user: any) {
    if (!user?.sub) throw new ForbiddenException('Utilisateur non authentifié');
    const salon = await this.prisma.salon.findFirst({ where: { ownerId: user.sub }, select: { id: true } });
    if (!salon) throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    return salon.id;
  }

  private monthBounds(month: string) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    if (Number.isNaN(start.getTime())) throw new BadRequestException('Mois invalide');
    const end = new Date(start); end.setUTCMonth(end.getUTCMonth() + 1);
    return { start, end };
  }

  private async materializeRecurringExpenses(salonId: string, month: string) {
    const { start, end } = this.monthBounds(month);
    const now = new Date();
    if (start > now) return;

    const templates = await this.prisma.expense.findMany({
      where: {
        salonId, deletedAt: null, status: ExpenseStatus.CONFIRMED,
        isRecurring: true, recurringSourceId: null, expenseDate: { lt: end },
      },
    });

    for (const template of templates) {
      const templateMonth = `${template.expenseDate.getUTCFullYear()}-${String(template.expenseDate.getUTCMonth()+1).padStart(2,'0')}`;
      if (templateMonth === month) continue;
      const day = Math.min(template.expenseDate.getUTCDate(), new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth()+1, 0)).getUTCDate());
      const occurrenceDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), day));
      await this.prisma.expense.upsert({
        where: { recurringSourceId_expenseDate: { recurringSourceId: template.id, expenseDate: occurrenceDate } },
        update: {},
        create: {
          salonId, category: template.category, description: template.description,
          amount: template.amount, expenseDate: occurrenceDate,
          receiptNumber: null, paymentMethod: template.paymentMethod,
          isRecurring: true, isInvestment: template.isInvestment,
          recurringSourceId: template.id, status: ExpenseStatus.CONFIRMED,
          createdById: template.createdById,
        },
      });
    }
  }

  async findAll(user: any, query: ListExpensesDto) {
    const salonId = await this.ensureSalon(user);
    const where: any = { salonId, deletedAt: null };
    if (query.category) where.category = query.category;
    if (query.month) {
      await this.materializeRecurringExpenses(salonId, query.month);
      const { start, end } = this.monthBounds(query.month);
      where.expenseDate = { gte: start, lt: end };
    }
    return this.prisma.expense.findMany({ where, orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }] });
  }

  async create(user: any, dto: CreateExpenseDto) {
    const salonId = await this.ensureSalon(user);
    if (!EXPENSE_CATEGORIES.includes(dto.category as any)) throw new BadRequestException('Catégorie invalide');
    if (dto.category === 'Autres' && !dto.description?.trim()) throw new BadRequestException('La description est obligatoire pour la catégorie Autres');
    const expenseDate = new Date(dto.expenseDate);
    if (expenseDate.getTime() > Date.now()) throw new BadRequestException('Une dépense ne peut pas être datée dans le futur');

    return this.prisma.expense.create({
      data: {
        salonId, category: dto.category, description: dto.description?.trim() || null,
        amount: dto.amount, expenseDate, receiptNumber: dto.receiptNumber?.trim() || null,
        paymentMethod: dto.paymentMethod, isRecurring: dto.isRecurring ?? false,
        isInvestment: dto.isInvestment ?? false, status: ExpenseStatus.CONFIRMED,
        createdById: user.sub,
      },
    });
  }

  async update(user: any, id: string, dto: UpdateExpenseDto) {
    const salonId = await this.ensureSalon(user);
    const expense = await this.prisma.expense.findFirst({ where: { id, salonId, deletedAt: null } });
    if (!expense) throw new NotFoundException('Dépense introuvable');
    const nextCategory = dto.category ?? expense.category;
    const nextDescription = dto.description ?? expense.description;
    if (nextCategory === 'Autres' && !nextDescription?.trim()) throw new BadRequestException('La description est obligatoire pour la catégorie Autres');
    if (dto.expenseDate && new Date(dto.expenseDate).getTime() > Date.now()) throw new BadRequestException('Une dépense ne peut pas être datée dans le futur');

    return this.prisma.expense.update({
      where: { id },
      data: {
        category: dto.category, description: dto.description?.trim(), amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        receiptNumber: dto.receiptNumber === undefined ? undefined : dto.receiptNumber.trim() || null,
        paymentMethod: dto.paymentMethod, isRecurring: dto.isRecurring, isInvestment: dto.isInvestment,
      },
    });
  }

  async remove(user: any, id: string) {
    const salonId = await this.ensureSalon(user);
    const expense = await this.prisma.expense.findFirst({ where: { id, salonId, deletedAt: null } });
    if (!expense) throw new NotFoundException('Dépense introuvable');
    return this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date(), status: ExpenseStatus.CANCELLED, isRecurring: false } });
  }
}
