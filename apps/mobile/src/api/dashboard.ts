import { apiFetch } from "./client";

export type DashboardSummary = {
  todayAppointments: number;
  monthRevenue: number;
  monthExpenses: number;
  newClients: number;
  occupancyRate: number;
};

export type RecentTransaction = {
  id: string;
  amount?: number;
  payableAmount?: number;
  transactionDate?: string;
};

export function getDashboardSummary(token: string) {
  return apiFetch<DashboardSummary>("/api/pro/dashboard/summary", {
    method: "GET",
    token,
  });
}

export function getRecentTransactions(token: string) {
  return apiFetch<RecentTransaction[]>("/api/pro/dashboard/recent-transactions", {
    method: "GET",
    token,
  });
}