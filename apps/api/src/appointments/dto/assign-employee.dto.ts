import { IsOptional, IsString } from 'class-validator'

export class AssignEmployeeDto {
  @IsOptional()
  @IsString()
  employeeId?: string
}
