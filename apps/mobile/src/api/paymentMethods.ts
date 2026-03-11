import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export type PaymentMethod = {
  id: string;
  type: "CARD" | "MOMO" | "CASH";
  provider?: string | null;
  label?: string | null;
  phone?: string | null;
  last4?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
};

export type CreatePaymentMethodPayload = {
  type: "CARD" | "MOMO" | "CASH";
  provider?: string;
  label?: string;
  phone?: string;
  last4?: string;
  isDefault?: boolean;
};

export function usePaymentMethods(enabled = true) {
  return useQuery({
    queryKey: ["me", "payment-methods"],
    enabled,
    queryFn: async () => {
      const res = await api.get<PaymentMethod[]>("/me/payment-methods");
      return res.data;
    },
  });
}

export async function createPaymentMethod(payload: CreatePaymentMethodPayload) {
  const res = await api.post<PaymentMethod>("/me/payment-methods", payload);
  return res.data;
}
