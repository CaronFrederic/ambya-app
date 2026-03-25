import { AdminScope } from '@prisma/client'
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateAdminDto {
  @IsEmail()
  email!: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsString()
  @MinLength(8)
  password!: string

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
}
