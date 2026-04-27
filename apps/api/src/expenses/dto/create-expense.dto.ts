import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsDateString()
  expenseDate!: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;
}