import { IsOptional, IsString, Matches } from 'class-validator';
export class ListExpensesDto {
  @IsOptional() @IsString() @Matches(/^\d{4}-\d{2}$/) month?: string;
  @IsOptional() @IsString() category?: string;
}
