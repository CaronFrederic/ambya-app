import { apiFetch } from "./client";
import * as SecureStore from "expo-secure-store";
export type AppointmentHistoryStatus =
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "CONFIRMED"
  | "PENDING";

export type AppointmentHistoryItem = {
  id: string;
  startAt: string;
  endAt: string;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  servicesLabel: string;
  employeeName: string | null;
  amount: number;
  status: AppointmentHistoryStatus;
};

export type GetAppointmentHistoryParams = {
  status?: "all" | "completed" | "cancelled" | "no-show";
};

function buildQuery(params?: GetAppointmentHistoryParams) {
  if (!params || !params.status || params.status === "all") return "";

  const search = new URLSearchParams();

  if (params.status === "completed") search.set("status", "COMPLETED");
  if (params.status === "cancelled") search.set("status", "CANCELLED");
  if (params.status === "no-show") search.set("status", "NO_SHOW");

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getAppointmentHistory(
  token: string,
  params?: GetAppointmentHistoryParams
) {
  return apiFetch<AppointmentHistoryItem[]>(
    `/api/pro/appointments/history${buildQuery(params)}`,
    {
      method: "GET",
      token,
    }
  );
  
}
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") || "";

export async function getAppointmentHistoryExportUrl(
  status?: "all" | "completed" | "cancelled" | "no-show"
) {
  const token = await SecureStore.getItemAsync("accessToken");

  if (!token) {
    throw new Error("Utilisateur non authentifié.");
  }

  const search = new URLSearchParams();

  if (status && status !== "all") {
    search.set("status", status);
  }

  search.set("token", token);

  return `${API_BASE_URL}/api/pro/appointments/history/export?${search.toString()}`;
}