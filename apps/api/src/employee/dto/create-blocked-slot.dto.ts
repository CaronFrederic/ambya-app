import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateBlockedSlotDto {
  @IsISO8601()
  startAt!: string

  @IsString()
  serviceId!: string

  @IsString()
  @MaxLength(120)
  clientName!: string

  @IsString()
  @MaxLength(30)
  clientPhone!: string

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string
}
