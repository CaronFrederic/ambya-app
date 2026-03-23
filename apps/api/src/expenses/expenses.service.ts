import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureSalon(user: any) {
    if (!user?.salonId) {
      throw new ForbiddenException('Salon introuvable pour cet utilisateur');
    }
    return user.salonId as string;
  }

  async findAll(user: any, query: ListExpensesDto) {
    const salonId = this.ensureSalon(user);

    const where: any = {
      salonId,
      deletedAt: null,
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.month) {
      const start = new Date(`${query.month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setUTCMonth(end.getUTCMonth() + 1);

      where.expenseDate = {
        gte: start,
        lt: end,
      };
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: {
        expenseDate: 'desc',
      },
    });
  }

  async create(user: any, dto: CreateExpenseDto) {
    const salonId = this.ensureSalon(user);

    return this.prisma.expense.create({
      data: {
        salonId,
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        expenseDate: new Date(dto.expenseDate),
        receiptUrl: dto.receiptUrl,
        status: ExpenseStatus.CONFIRMED,
        createdById: user.sub,
      },
    });
  }

  async update(user: any, id: string, dto: UpdateExpenseDto) {
    const salonId = this.ensureSalon(user);

    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        salonId,
        deletedAt: null,
      },
    });

    if (!expense) {
      throw new NotFoundException('Dépense introuvable');
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        category: dto.category,
        description: dto.description,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        receiptUrl: dto.receiptUrl,
      },
    });
  }

  async remove(user: any, id: string) {
    const salonId = this.ensureSalon(user);

    const expense = await this.prisma.expense.findFirst({
      where: {
        id,
        salonId,
        deletedAt: null,
      },
    });

    if (!expense) {
      throw new NotFoundException('Dépense introuvable');
    }

    return this.prisma.expense.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: ExpenseStatus.CANCELLED,
      },
    });
  }
}