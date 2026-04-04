import { apiFetch } from "./client";

export type CashMethod = "all" | "mobile-money" | "card" | "cash";
export type CashTxStatus = "paid" | "pending";

export type CashRegisterTransaction = {
  id: string;
  date: string;
  client: string;
  clientId: string | null;
  services: string;
  employee: string;
  amount: number;
  method: Exclude<CashMethod, "all">;
  status: CashTxStatus;
  provider?: string | null;
};

export type CashRegisterResponse = {
  date: string;
  totals: {
    total: number;
    mobileMoney: number;
    card: number;
    cash: number;
  };
  transactions: CashRegisterTransaction[];
  breakdown: {
    name: string;
    value: number;
    color: string;
  }[];
  meta: {
    count: number;
    paidCount: number;
    pendingCount: number;
    paidTotal: number;
  };
};

export function getCashRegister(
  token: string,
  params: { date: string; method?: CashMethod }
) {
  const search = new URLSearchParams();
  search.set("date", params.date);
  if (params.method) search.set("method", params.method);

  return apiFetch<CashRegisterResponse>(`/payments/cash-register?${search.toString()}`, {
    method: "GET",
    token,
  });
}