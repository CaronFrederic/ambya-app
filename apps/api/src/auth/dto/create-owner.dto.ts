import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateOwnerDto {
  @IsString()
  salonName!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}