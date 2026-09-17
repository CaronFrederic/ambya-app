import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS } from './create-expense.dto';

export class UpdateExpenseDto {
  @IsOptional() @IsString() @IsIn(EXPENSE_CATEGORIES) category?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) amount?: number;
  @IsOptional() @IsDateString() expenseDate?: string;
  @IsOptional() @IsIn(EXPENSE_PAYMENT_METHODS) paymentMethod?: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER';
  @IsOptional() @IsString() receiptNumber?: string;
  @IsOptional() @IsBoolean() isRecurring?: boolean;
  @IsOptional() @IsBoolean() isInvestment?: boolean;
}
