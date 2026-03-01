import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { PaymentStatus } from '@prisma/client'

export class UpdateIntentStatusDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus

  @IsOptional()
  @IsString()
  @MaxLength(100)
  providerRef?: string

  @IsOptional()
  providerData?: any
}
