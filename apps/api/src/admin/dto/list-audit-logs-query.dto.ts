import { IsOptional, IsString } from 'class-validator'

export class ListAuditLogsQueryDto {
  @IsOptional()
  @IsString()
  actionType?: string

  @IsOptional()
  @IsString()
  entityType?: string

  @IsOptional()
  @IsString()
  actorUserId?: string

  @IsOptional()
  @IsString()
  dateFrom?: string

  @IsOptional()
  @IsString()
  dateTo?: string
}
