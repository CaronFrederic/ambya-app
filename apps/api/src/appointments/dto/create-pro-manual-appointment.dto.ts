import {
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateProManualAppointmentDto {
  @IsOptional()
  @IsString()
  salonClientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  clientName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  clientPhone?: string;

  @IsString()
  serviceId!: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsISO8601()
  startAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}