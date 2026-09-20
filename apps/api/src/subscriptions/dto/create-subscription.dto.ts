import { IsEnum } from 'class-validator';
import { SubscriptionPaymentMethod, SubscriptionPlan } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;

  @IsEnum(SubscriptionPaymentMethod)
  paymentMethod!: SubscriptionPaymentMethod;
}
