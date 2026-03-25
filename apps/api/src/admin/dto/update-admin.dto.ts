import { AdminScope } from '@prisma/client'
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator'

export class UpdateAdminDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsEnum(AdminScope)
  scope?: AdminScope

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
