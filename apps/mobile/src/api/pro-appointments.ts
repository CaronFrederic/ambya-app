import { apiFetch } from "./client";

export type ProAppointmentCalendarItem = {
  id: string;
  startAt: string;
  endAt: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  employeeName: string | null;
};

export type ProPendingAppointmentItem = {
  id: string;
  startAt: string;
  endAt: string;
  status: "PENDING";
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  employeeName: string | null;
};

export type ProAppointmentHistoryItem = {
  id: string;
  startAt: string;
  endAt: string;
  status: "COMPLETED" | "CANCELLED" | "NO_SHOW" | "CONFIRMED" | "PENDING";
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  employeeName: string | null;
  amount: number;
};

export function getCalendarAppointments(token: string, date: string) {
  return apiFetch<ProAppointmentCalendarItem[]>(
    `/api/pro/appointments/calendar?date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      token,
    }
  );
}

export function getPendingAppointments(token: string, date: string) {
  return apiFetch<ProPendingAppointmentItem[]>(
    `/api/pro/appointments/pending?date=${encodeURIComponent(date)}`,
    {
      method: "GET",
      token,
    }
  );
}

export function getAppointmentHistory(
  token: string,
  status?: "all" | "completed" | "cancelled" | "no-show"
) {
  const search = new URLSearchParams();

  if (status && status !== "all") {
    if (status === "completed") search.set("status", "COMPLETED");
    if (status === "cancelled") search.set("status", "CANCELLED");
    if (status === "no-show") search.set("status", "NO_SHOW");
  }

  const qs = search.toString();

  return apiFetch<ProAppointmentHistoryItem[]>(
    `/api/pro/appointments/history${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      token,
    }
  );
}

export function confirmAppointment(token: string, appointmentId: string) {
  return apiFetch<{ id: string; status: string }>(
    `/api/pro/appointments/${appointmentId}/confirm`,
    {
      method: "PATCH",
      token,
    }
  );
}

export function rejectAppointment(token: string, appointmentId: string) {
  return apiFetch<{ id: string; status: string }>(
    `/api/pro/appointments/${appointmentId}/reject`,
    {
      method: "PATCH",
      token,
    }
  );
}