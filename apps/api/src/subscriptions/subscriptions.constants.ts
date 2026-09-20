import { SubscriptionPlan } from '@prisma/client';

export const SUBSCRIPTION_CATALOG = {
  DISCOVERY: {
    plan: SubscriptionPlan.DISCOVERY,
    name: 'Découverte',
    price: 0,
    commissionPct: 12,
  },
  ESSENTIAL: {
    plan: SubscriptionPlan.ESSENTIAL,
    name: 'Essentiel',
    price: 12900,
    commissionPct: 0,
  },
  PREMIUM: {
    plan: SubscriptionPlan.PREMIUM,
    name: 'Premium',
    price: 24900,
    commissionPct: 0,
  },
} as const;

export const PAID_SUBSCRIPTION_PLANS = [
  SubscriptionPlan.ESSENTIAL,
  SubscriptionPlan.PREMIUM,
] as const;
