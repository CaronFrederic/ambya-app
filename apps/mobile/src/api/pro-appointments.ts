import { apiFetch } from "./client";

export type ProAppointmentStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

export type ProAppointmentCalendarItem = {
  id: string;
  startAt: string;
  endAt: string;
  status: ProAppointmentStatus;
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

export type ProManualAppointmentClientOption = {
  salonClientId: string;
  clientId: string;
  name: string;
  phone: string | null;
  email: string | null;
  blocked: boolean;
};

export type ProManualAppointmentServiceOption = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  category: string | null;
};

export type ProManualAppointmentEmployeeOption = {
  id: string;
  displayName: string;
  status: string;
  isActive: boolean;
};

export type ProManualAppointmentOptions = {
  clients: ProManualAppointmentClientOption[];
  services: ProManualAppointmentServiceOption[];
  employees: ProManualAppointmentEmployeeOption[];
};

export type CreateProManualAppointmentPayload = {
  salonClientId?: string;
  clientName?: string;
  clientPhone?: string;
  serviceId: string;
  employeeId?: string;
  startAt: string;
  note?: string;
};

export function getCalendarAppointments(date: string) {
  return apiFetch<ProAppointmentCalendarItem[]>(
    `/api/pro/appointments/calendar?date=${encodeURIComponent(date)}`,
    {
      method: "GET",
    }
  );
}

export function getPendingAppointments(date?: string) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";

  return apiFetch<ProPendingAppointmentItem[]>(
    `/api/pro/appointments/pending${query}`,
    {
      method: "GET",
    }
  );
}

export function getPendingAppointmentCount() {
  return apiFetch<{ count: number }>("/api/pro/appointments/pending/count", {
    method: "GET",
  });
}

export function getManualAppointmentOptions() {
  return apiFetch<ProManualAppointmentOptions>(
    "/api/pro/appointments/manual-options",
    {
      method: "GET",
    }
  );
}

export function createManualAppointment(
  payload: CreateProManualAppointmentPayload
) {
  return apiFetch<ProAppointmentCalendarItem>(
    "/api/pro/appointments/manual",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export function getAppointmentHistory(
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
    }
  );
}

export function confirmAppointment(appointmentId: string) {
  return apiFetch<{ id: string; status: string }>(
    `/api/pro/appointments/${appointmentId}/confirm`,
    {
      method: "PATCH",
    }
  );
}

export function rejectAppointment(appointmentId: string) {
  return apiFetch<{ id: string; status: string }>(
    `/api/pro/appointments/${appointmentId}/reject`,
    {
      method: "PATCH",
    }
  );
}