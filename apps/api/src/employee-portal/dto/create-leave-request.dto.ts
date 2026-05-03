import { IsISO8601, IsString, MaxLength } from 'class-validator'

export class CreateLeaveRequestDto {
  @IsISO8601()
  startAt!: string

  @IsISO8601()
  endAt!: string

  @IsString()
  @MaxLength(300)
  reason!: string
}
