import { apiFetch } from "./client";

export type ProAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW"
  | "REJECTED";

export type ProAppointmentCalendarItem = {
  id: string;
  startAt: string;
  endAt: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  employeeName: string | null;
  status: ProAppointmentStatus;
};

export type ProPendingAppointmentItem = {
  id: string;
  startAt: string;
  endAt: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  status: "PENDING";
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

export function confirmAppointment(token: string, appointmentId: string) {
  return apiFetch<{ success: true }>(
    `/api/pro/appointments/${appointmentId}/confirm`,
    {
      method: "PATCH",
      token,
    }
  );
}

export function rejectAppointment(token: string, appointmentId: string) {
  return apiFetch<{ success: true }>(
    `/api/pro/appointments/${appointmentId}/reject`,
    {
      method: "PATCH",
      token,
    }
  );
}