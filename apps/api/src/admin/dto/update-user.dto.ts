import { EmployeeSpecialty } from '@prisma/client'
import { IsArray, IsBoolean, IsEmail, IsEnum, IsObject, IsOptional, IsString } from 'class-validator'

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean

  @IsOptional()
  @IsString()
  nickname?: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsString()
  displayName?: string

  @IsOptional()
  @IsString()
  gender?: string

  @IsOptional()
  @IsString()
  ageRange?: string

  @IsOptional()
  @IsString()
  city?: string

  @IsOptional()
  @IsString()
  country?: string

  @IsOptional()
  @IsString()
  allergies?: string

  @IsOptional()
  @IsString()
  comments?: string

  @IsOptional()
  @IsObject()
  questionnaire?: Record<string, any>

  @IsOptional()
  @IsBoolean()
  employeeIsActive?: boolean

  @IsOptional()
  @IsArray()
  @IsEnum(EmployeeSpecialty, { each: true })
  specialties?: EmployeeSpecialty[]
}
