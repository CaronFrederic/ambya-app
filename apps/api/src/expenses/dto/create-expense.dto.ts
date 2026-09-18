import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ExpensePaymentMethod } from '@prisma/client';

export const EXPENSE_CATEGORIES = [
  'Produits & consommables',
  'Marchandises revendues',
  'Charges de personnel',
  'Honoraires & prestataires externes',
  'Loyer & charges du local',
  'Location d’espace ou d’équipement',
  'Eau & électricité',
  'Téléphone & internet',
  'Abonnements & licences',
  'Transport & déplacements',
  'Entretien & réparations',
  'Blanchisserie',
  'Publicité & communication',
  'Formation & certification',
  'Assurance',
  'Frais bancaires & commissions',
  'Impôts & taxes',
  'Autres',
] as const;

export class CreateExpenseDto {
  @IsString()
  @IsIn(EXPENSE_CATEGORIES)
  category!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsDateString()
  expenseDate!: string;

  @IsOptional()
  @IsString()
  receiptNumber?: string;

  @IsEnum(ExpensePaymentMethod)
  paymentMethod!: ExpensePaymentMethod;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsBoolean()
  isInvestment?: boolean;

  @IsOptional()
  @IsBoolean()
  isDurableEquipment?: boolean;
}
