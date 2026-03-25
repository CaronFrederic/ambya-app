import { AppointmentStatus } from '@prisma/client'
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator'

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus

  @IsOptional()
  @IsString()
  employeeId?: string | null

  @IsOptional()
  @IsDateString()
  startAt?: string

  @IsOptional()
  @IsDateString()
  endAt?: string

  @IsOptional()
  @IsString()
  note?: string | null
}
