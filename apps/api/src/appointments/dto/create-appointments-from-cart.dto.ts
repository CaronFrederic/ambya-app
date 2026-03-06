import { Type } from 'class-transformer'
import { ArrayMinSize, IsArray, IsISO8601, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator'

class CartItemDto {
  @IsString()
  serviceId!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number
}

export class CreateAppointmentsFromCartDto {
  @IsString()
  salonId!: string

  @IsISO8601()
  startAt!: string

  @IsOptional()
  @IsString()
  employeeId?: string

  @IsOptional()
  @IsString()
  note?: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[]
}
