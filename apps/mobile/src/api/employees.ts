import { apiFetch } from "./client";

export type ApiEmployee = {
  id: string;
  salonId: string;
  userId: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  roleLabel: string | null;
  photoUrl: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  status: "ACTIVE" | "ABSENT" | "ON_LEAVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
};

export type CreateEmployeePayload = {
  displayName: string;
  firstName?: string;
  lastName?: string;
  roleLabel?: string;
  photoUrl?: string;
  phone?: string;
  email?: string;
};

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

export type MarkAbsencePayload = {
  startDate: string;
  endDate?: string;
  reason?: string;
};

export function getEmployees(token: string) {
  return apiFetch<ApiEmployee[]>("/api/pro/employees", {
    method: "GET",
    token,
  });
}

export function createEmployee(token: string, payload: CreateEmployeePayload) {
  return apiFetch<ApiEmployee>("/api/pro/employees", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateEmployee(
  token: string,
  id: string,
  payload: UpdateEmployeePayload
) {
  return apiFetch<ApiEmployee>(`/api/pro/employees/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteEmployee(token: string, id: string) {
  return apiFetch<ApiEmployee>(`/api/pro/employees/${id}`, {
    method: "DELETE",
    token,
  });
}

export function markEmployeeAbsent(
  token: string,
  id: string,
  payload: MarkAbsencePayload
) {
  return apiFetch(`/api/pro/employees/${id}/mark-absent`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function markEmployeeActive(token: string, id: string) {
  return apiFetch<ApiEmployee>(`/api/pro/employees/${id}/mark-active`, {
    method: "PATCH",
    token,
  });
}