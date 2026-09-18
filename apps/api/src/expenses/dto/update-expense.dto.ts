import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExpensePaymentMethod } from '@prisma/client';

import { EXPENSE_CATEGORIES } from './create-expense.dto';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @IsIn(EXPENSE_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsEnum(ExpensePaymentMethod)
  paymentMethod?: ExpensePaymentMethod;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  isInvestment?: boolean;

  @IsOptional()
  @IsBoolean()
  isDurableEquipment?: boolean;
}
