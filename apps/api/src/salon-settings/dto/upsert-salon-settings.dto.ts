import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class SlotDto {
  @IsString()
  start!: string

  @IsString()
  end!: string

  @IsBoolean()
  enabled!: boolean
}

class PaymentSettingsDto {
  @IsBoolean()
  payMobileMoney!: boolean

  @IsBoolean()
  payCard!: boolean

  @IsBoolean()
  payCash!: boolean

  @IsOptional()
  @IsString()
  orangeMoney?: string

  @IsOptional()
  @IsString()
  moovMoney?: string

  @IsOptional()
  @IsString()
  airtelMoney?: string

  @IsOptional()
  @IsString()
  bankName?: string

  @IsOptional()
  @IsString()
  iban?: string

  @IsOptional()
  @IsString()
  bankOwner?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(168)
  cancelPolicyHours?: number
}

export class UpsertSalonSettingsDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[]

  @IsOptional()
  @IsString()
  coverImageUrl?: string | null

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  galleryImageUrls?: string[]

  @IsOptional()
  @IsString()
  instagramHandle?: string

  @IsOptional()
  @IsBoolean()
  showInstagramFeed?: boolean

  @IsOptional()
  @IsString()
  tiktokHandle?: string

  @IsOptional()
  @IsBoolean()
  showTikTokFeed?: boolean

  @IsOptional()
  @IsString()
  facebookUrl?: string

  @IsOptional()
  @IsUrl({}, { message: 'websiteUrl must be a valid URL' })
  websiteUrl?: string

  @IsIn(['standard', 'custom'])
  scheduleType!: 'standard' | 'custom'

  @ValidateNested({ each: true })
  @Type(() => SlotDto)
  standardSlots!: SlotDto[]

  @IsObject()
  customSlots!: Record<string, SlotDto[]>

  @ValidateNested()
  @Type(() => PaymentSettingsDto)
  paymentSettings!: PaymentSettingsDto

  @IsBoolean()
  depositEnabled!: boolean

  @IsInt()
  @Min(10)
  @Max(50)
  depositPercentage!: number
}