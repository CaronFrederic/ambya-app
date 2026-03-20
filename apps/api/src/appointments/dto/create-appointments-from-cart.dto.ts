import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator'

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

  @IsOptional()
  @IsString()
  @IsIn(['CARD', 'MOMO', 'CASH'])
  paymentMethod?: 'CARD' | 'MOMO' | 'CASH'

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items!: CartItemDto[]
}
