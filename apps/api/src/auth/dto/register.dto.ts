import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'

enum UserRole {
  CLIENT = 'CLIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  EMPLOYEE = 'EMPLOYEE',
  ADMIN = 'ADMIN',
}

export class RegisterDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  // Optionnel : utile si tu veux créer pro/employee dès le register.
  // Sinon supprime ce champ et laisse le défaut CLIENT.
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole
}
