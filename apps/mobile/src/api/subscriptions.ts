import { apiFetch } from "./client";

export type SubscriptionPlan = "DISCOVERY" | "ESSENTIAL" | "PREMIUM";
export type SubscriptionStatus =
  | "ACTIVE"
  | "PENDING_PAYMENT"
  | "EXPIRED"
  | "CANCELLED";

export type SubscriptionPaymentMethod =
  | "AIRTEL_MONEY"
  | "MOOV_MONEY"
  | "CARD"
  | "MANUAL_MOBILE_MONEY";

export type SubscriptionPaymentStatus =
  | "PENDING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export type CurrentSubscription = {
  id: string;
  plan: SubscriptionPlan;
  planName: string;
  price: number;
  commissionPct: number;
  status: SubscriptionStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  pendingPlan: SubscriptionPlan | null;
  autoRenew: boolean;
};

export type SubscriptionPayment = {
  id: string;
  plan: SubscriptionPlan;
  amount: number;
  currency: string;
  method: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  provider: string | null;
  providerRef: string | null;
  paidAt: string | null;
  createdAt: string;
};

export type SubscriptionResponse = {
  salonId: string;
  salonName: string;
  subscription: CurrentSubscription;
  payments: SubscriptionPayment[];
};

export function getCurrentSubscription(token: string) {
  return apiFetch<SubscriptionResponse>("/api/pro/subscriptions/current", {
    method: "GET",
    token,
  });
}

export function subscribeToPlan(
  token: string,
  plan: Exclude<SubscriptionPlan, "DISCOVERY">,
  paymentMethod: SubscriptionPaymentMethod
) {
  return apiFetch<{
    payment: SubscriptionPayment;
    subscription: CurrentSubscription;
    message?: string;
  }>("/api/pro/subscriptions/subscribe", {
    method: "POST",
    token,
    body: JSON.stringify({ plan, paymentMethod }),
  });
}

export function cancelSubscription(token: string) {
  return apiFetch<CurrentSubscription>("/api/pro/subscriptions/cancel", {
    method: "POST",
    token,
  });
}

export function confirmSubscriptionPaymentForBeta(
  token: string,
  paymentId: string
) {
  return apiFetch<SubscriptionResponse>(
    `/api/pro/subscriptions/payments/${paymentId}/confirm-beta`,
    {
      method: "POST",
      token,
    }
  );
}
