import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator'

export class UpdateEmployeeProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName?: string

  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string
}
