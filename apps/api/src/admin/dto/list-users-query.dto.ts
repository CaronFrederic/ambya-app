import { UserRole } from '@prisma/client'
import { IsEnum, IsOptional, IsString } from 'class-validator'

export class ListUsersQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @IsString()
  isActive?: string
}
