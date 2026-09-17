import * as SecureStore from "expo-secure-store";

import { apiFetch } from "./client";

export type PeriodType = "Ce mois" | "Trimestre" | "Année" | "Choisir";
export type ExportFormat = "pdf" | "excel";

export type ManagementRegisterLine = {
  id: string;
  date: string;
  label: string;
  category: string;
  amount: number;
  receiptNumber?: string | null;
  paymentMethod?: string | null;
  entryDate?: string | null;
};

export type ComparisonIndicator = {
  real: number;
  estimated: number;
  diffPercent: number | null;
};

export type AccountingReportResponse = {
  periodType: PeriodType;
  period: {
    start: string;
    end: string;
    label: string;
    isCurrentPeriod: boolean;
  };
  establishment: {
    name: string;
    city: string | null;
  };
  generatedAt: string;
  revenue: {
    services: number;
    products: number;
    total: number;
    lineCount: number;
    lines: ManagementRegisterLine[];
  };
  expenses: {
    byCategory: Array<{
      category: string;
      amount: number;
    }>;
    total: number;
    lineCount: number;
    lines: ManagementRegisterLine[];
  };
  result: number;
  investments: {
    total: number;
    lineCount: number;
    lines: ManagementRegisterLine[];
  };
  comparison: {
    basisLabel: string;
    revenue: ComparisonIndicator;
    expenses: ComparisonIndicator;
    result: ComparisonIndicator;
  };
};

export type GetAccountingReportParams = {
  periodType: PeriodType;
  startDate?: string;
  endDate?: string;
};

function buildQuery(params: GetAccountingReportParams): string {
  const search = new URLSearchParams();

  search.set("periodType", params.periodType);

  if (params.startDate) {
    search.set("startDate", params.startDate);
  }

  if (params.endDate) {
    search.set("endDate", params.endDate);
  }

  return search.toString();
}

export function getAccountingReport(
  params: GetAccountingReportParams
): Promise<AccountingReportResponse> {
  return apiFetch<AccountingReportResponse>(
    `/pro/accounting-reports?${buildQuery(params)}`,
    {
      method: "GET",
    }
  );
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";

export async function getAccountingReportExportUrl(
  params: GetAccountingReportParams,
  format: ExportFormat
): Promise<string> {
  const token = await SecureStore.getItemAsync("accessToken");

  if (!token) {
    throw new Error("Utilisateur non authentifié.");
  }

  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_URL n'est pas configurée.");
  }

  const search = new URLSearchParams();

  search.set("periodType", params.periodType);
  search.set("format", format);
  search.set("token", token);

  if (params.startDate) {
    search.set("startDate", params.startDate);
  }

  if (params.endDate) {
    search.set("endDate", params.endDate);
  }

  return `${API_BASE_URL}/api/pro/accounting-reports/export?${search.toString()}`;
}
