import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'
import { PaymentType } from '@prisma/client'

export class CreatePaymentMethodDto {
  @IsEnum(PaymentType)
  type!: PaymentType

  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string // "MTN", "Orange", "Airtel", "Visa"...

  @IsOptional()
  @IsString()
  @MaxLength(80)
  label?: string // "Mon MTN Perso"

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string // requis si type=MOMO

  @IsOptional()
  @IsString()
  @MaxLength(4)
  last4?: string // optionnel si type=CARD

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean
}
