import { IsDateString, IsOptional, IsString } from 'class-validator';

export class MarkAbsenceDto {
  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}