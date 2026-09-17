import { IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Min, ValidateIf } from 'class-validator';

export const EXPENSE_CATEGORIES = [
  'Produits & consommables', 'Marchandises revendues', 'Charges de personnel',
  'Honoraires & prestataires externes', 'Loyer & charges du local',
  "Location d’espace ou d’équipement", 'Eau & électricité', 'Téléphone & internet',
  'Abonnements & licences', 'Transport & déplacements', 'Entretien & réparations',
  'Blanchisserie', 'Publicité & communication', 'Formation & certification',
  'Assurance', 'Frais bancaires & commissions', 'Impôts & taxes', 'Autres',
] as const;

export const EXPENSE_PAYMENT_METHODS = ['CASH', 'MOBILE_MONEY', 'CARD', 'BANK_TRANSFER'] as const;

export class CreateExpenseDto {
  @IsString()
  @IsIn(EXPENSE_CATEGORIES)
  category!: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.category === 'Autres')
  description?: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsDateString()
  expenseDate!: string;

  @IsIn(EXPENSE_PAYMENT_METHODS)
  paymentMethod!: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK_TRANSFER';

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  isInvestment?: boolean;
}
