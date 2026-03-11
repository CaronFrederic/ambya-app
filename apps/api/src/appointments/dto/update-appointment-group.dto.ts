import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateAppointmentGroupDto {
  @IsOptional()
  @IsISO8601()
  startAt?: string

  @IsOptional()
  @IsString()
  employeeId?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string
}
