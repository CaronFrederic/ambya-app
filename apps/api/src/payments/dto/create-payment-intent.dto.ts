import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator'

export class CreatePaymentIntentDto {
  @IsInt()
  @Min(1)
  amount!: number // smallest unit (XAF -> 1 franc, EUR -> cents si besoin)

  @IsString()
  @MaxLength(10)
  currency!: string // "XAF", "EUR", "USD"

  @IsOptional()
  @IsString()
  @MaxLength(50)
  provider?: string // "MTN", "ORANGE", "STRIPE"...

  @IsOptional()
  @IsString()
  paymentMethodId?: string

  @IsOptional()
  @IsString()
  salonId?: string

  @IsOptional()
  @IsString()
  appointmentId?: string
}
