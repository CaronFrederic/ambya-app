import type { SubscriptionPlan } from "../api/subscriptions";

export type SubscriptionEntitlements = {
  employees: boolean;
  expenses: boolean;
  managementRegister: boolean;
};

export function getSubscriptionEntitlements(
  plan: SubscriptionPlan
): SubscriptionEntitlements {
  return {
    employees: plan === "ESSENTIAL" || plan === "PREMIUM",
    expenses: plan === "ESSENTIAL" || plan === "PREMIUM",
    managementRegister: plan === "PREMIUM",
  };
}
