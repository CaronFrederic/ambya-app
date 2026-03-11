import { IsOptional, IsString, MaxLength } from 'class-validator'

export class SearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsString()
  preferredCity?: string

  @IsOptional()
  @IsString()
  preferredCountry?: string
}
