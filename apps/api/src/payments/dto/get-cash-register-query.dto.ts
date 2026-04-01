import { IsIn, IsOptional, Matches } from 'class-validator';

export class GetCashRegisterQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format',
  })
  date?: string;

  @IsOptional()
  @IsIn(['all', 'mobile-money', 'card', 'cash'])
  method?: 'all' | 'mobile-money' | 'card' | 'cash';
}