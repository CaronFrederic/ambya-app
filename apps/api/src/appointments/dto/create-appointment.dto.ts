import { IsISO8601, IsOptional, IsString } from 'class-validator'

export class CreateAppointmentDto {
  @IsString()
  salonId!: string

  @IsString()
  serviceId!: string

  @IsISO8601()
  startAt!: string

  @IsOptional()
  @IsString()
  employeeId?: string

  @IsOptional()
  @IsString()
  note?: string
}
