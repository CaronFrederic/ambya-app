import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtUser } from '../auth/decorators/current-user.decorator';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ListExpensesDto } from './dto/list-expenses.dto';

@UseGuards(JwtAuthGuard)
@Controller('pro/expenses')
export class ExpensesController {
  constructor(
    private readonly expensesService: ExpensesService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  private assertAccess(user: JwtUser) {
    return this.subscriptionsService.assertFeatureAccess(user, 'EXPENSES');
  }

  @Get()
  async findAll(@CurrentUser() user: JwtUser, @Query() query: ListExpensesDto) {
    await this.assertAccess(user);
    return this.expensesService.findAll(user, query);
  }

  @Post()
  async create(@CurrentUser() user: JwtUser, @Body() dto: CreateExpenseDto) {
    await this.assertAccess(user);
    return this.expensesService.create(user, dto);
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    await this.assertAccess(user);
    return this.expensesService.update(user, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    await this.assertAccess(user);
    return this.expensesService.remove(user, id);
  }
}
