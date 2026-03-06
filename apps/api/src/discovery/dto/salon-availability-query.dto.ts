import { IsDateString, IsOptional, IsString } from 'class-validator'

export class SalonAvailabilityQueryDto {
  @IsDateString()
  date!: string

  @IsOptional()
  @IsString()
  serviceIds?: string
}
