import { IsBooleanString, IsOptional, IsString } from 'class-validator'

export class HomeQueryDto {
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
  @IsBooleanString()
  nearMe?: string

  @IsOptional()
  @IsString()
  latitude?: string

  @IsOptional()
  @IsString()
  longitude?: string
}
