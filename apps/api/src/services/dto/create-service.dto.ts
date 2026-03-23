import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsInt()
  @Min(1)
  price!: number;

  @IsInt()
  @Min(1)
  durationMin!: number;
}