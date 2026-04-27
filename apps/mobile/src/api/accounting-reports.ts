import { apiFetch } from "./client";
import * as SecureStore from "expo-secure-store";

export type ReportType = "compte-resultat" | "rapport-mensuel";
export type PeriodType = "Ce mois" | "Mois dernier" | "Cette année" | "Personnalisé";

export type AccountingReportResponse = {
  reportType: ReportType;
  periodType: PeriodType;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netResult: number;
    trendPercent: number;
  };
  incomeStatement: {
    revenue: {
      serviceSales: number;
      productSales: number;
      total: number;
    };
    expenses: {
      byCategory: {
        category: string;
        amount: number;
      }[];
      total: number;
    };
    netResult: number;
  };
  monthlyReport: {
    revenue: number;
    expenses: number;
    result: number;
  };
  meta: {
    paymentCount: number;
    expenseCount: number;
    revenueByPaymentType: {
      type: string;
      amount: number;
    }[];
  };
};

export type GetAccountingReportParams = {
  reportType: ReportType;
  periodType: PeriodType;
  startDate?: string;
  endDate?: string;
};

function buildQuery(params: GetAccountingReportParams) {
  const search = new URLSearchParams();

  search.set("reportType", params.reportType);
  search.set("periodType", params.periodType);

  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);

  return search.toString();
}

export function getAccountingReport(params: GetAccountingReportParams) {
  return apiFetch<AccountingReportResponse>(
    `/api/pro/accounting-reports?${buildQuery(params)}`,
    {
      method: "GET",
    },
  );
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";

export async function getAccountingReportExportUrl(
  params: GetAccountingReportParams,
) {
  const token = await SecureStore.getItemAsync("accessToken");

  if (!token) {
    throw new Error("Utilisateur non authentifié.");
  }

  const search = new URLSearchParams();

  search.set("reportType", params.reportType);
  search.set("periodType", params.periodType);
  search.set("format", "excel");

  if (params.startDate) search.set("startDate", params.startDate);
  if (params.endDate) search.set("endDate", params.endDate);

  search.set("token", token);

  return `${API_BASE_URL}/api/pro/accounting-reports/export?${search.toString()}`;
}