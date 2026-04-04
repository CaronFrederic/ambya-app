import { apiFetch } from "./client";

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
    `/pro/appointments/history${buildQuery(params)}`,
    {
      method: "GET",
      token,
    }
  );
}