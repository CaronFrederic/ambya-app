import { IsOptional, IsString } from 'class-validator';

export class ListExpensesDto {
  @IsOptional()
  @IsString()
  month?: string; // ex: 2026-03

  @IsOptional()
  @IsString()
  category?: string;
}