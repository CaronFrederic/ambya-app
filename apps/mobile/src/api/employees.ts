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

export function getEmployees() {
  return apiFetch<ApiEmployee[]>("/api/pro/employees", {
    method: "GET",
    
  });
}

export function createEmployee( payload: CreateEmployeePayload) {
  return apiFetch<ApiEmployee>("/api/pro/employees", {
    method: "POST",
    
    body: JSON.stringify(payload),
  });
}

export function updateEmployee(
  
  id: string,
  payload: UpdateEmployeePayload
) {
  return apiFetch<ApiEmployee>(`/api/pro/employees/${id}`, {
    method: "PATCH",
    
    body: JSON.stringify(payload),
  });
}

export function deleteEmployee( id: string) {
  return apiFetch<ApiEmployee>(`/api/pro/employees/${id}`, {
    method: "DELETE",
    
  });
}

export function markEmployeeAbsent(
  
  id: string,
  payload: MarkAbsencePayload
) {
  return apiFetch(`/api/pro/employees/${id}/mark-absent`, {
    method: "PATCH",
    
    body: JSON.stringify(payload),
  });
}

export function markEmployeeActive( id: string) {
  return apiFetch<ApiEmployee>(`/api/pro/employees/${id}/mark-active`, {
    method: "PATCH",
    
  });
}