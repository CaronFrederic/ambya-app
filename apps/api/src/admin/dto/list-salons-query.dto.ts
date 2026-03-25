import { IsOptional, IsString } from 'class-validator'

export class ListSalonsQueryDto {
  @IsOptional()
  @IsString()
  q?: string

  @IsOptional()
  @IsString()
  isActive?: string
}
