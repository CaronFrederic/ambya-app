import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class UpdateSalonServiceDto {
  @IsString()
  id!: string

  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(600)
  durationMin?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

class UpdateSalonOpeningHourDto {
  @IsString()
  day!: string

  @IsOptional()
  @IsString()
  open?: string | null

  @IsOptional()
  @IsString()
  close?: string | null

  @IsBoolean()
  closed!: boolean
}

export class UpdateSalonDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSalonServiceDto)
  services?: UpdateSalonServiceDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSalonOpeningHourDto)
  openingHours?: UpdateSalonOpeningHourDto[]
}
