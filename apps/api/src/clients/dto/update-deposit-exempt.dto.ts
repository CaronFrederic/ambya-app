import { IsBoolean } from 'class-validator';

export class UpdateDepositExemptDto {
  @IsBoolean()
  isDepositExempt!: boolean;
}