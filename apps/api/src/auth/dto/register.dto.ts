import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ClientProfileDto {
  @IsString()
  nickname!: string;

  @IsString()
  gender!: string;

  @IsString()
  ageRange!: string;

  @IsString()
  city!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsObject()
  questionnaire?: Record<string, any>;
}

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClientProfileDto)
  profile?: ClientProfileDto;
}