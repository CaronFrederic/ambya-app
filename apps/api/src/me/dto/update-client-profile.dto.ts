import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateClientProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nickname?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ageRange?: string

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string

  @IsOptional()
  @IsString()
  @MaxLength(60)
  country?: string

  @IsOptional()
  @IsString()
  @MaxLength(10)
  allergies?: string // "yes" | "no"

  @IsOptional()
  @IsString()
  @MaxLength(500)
  comments?: string

  // update partiel : { hair: {...} } ou questionnaire complet
  @IsOptional()
  @IsObject()
  questionnaire?: Record<string, any>
}
