import { AppointmentStatus } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class ListAppointmentsQueryDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus

  @IsOptional()
  @IsString()
  salonId?: string

  @IsOptional()
  @IsString()
  q?: string
}
