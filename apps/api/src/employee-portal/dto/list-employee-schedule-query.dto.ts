import { IsIn, IsOptional } from 'class-validator'

export class ListEmployeeScheduleQueryDto {
  @IsOptional()
  @IsIn(['all', 'upcoming', 'completed'])
  status?: 'all' | 'upcoming' | 'completed'
}
