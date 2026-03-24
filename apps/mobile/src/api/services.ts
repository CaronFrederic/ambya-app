import { apiFetch } from "./client";

export type ApiServiceStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type ApiService = {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  durationMin: number;
  isActive: boolean;
  status: ApiServiceStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateServicePayload = {
  name: string;
  description?: string;
  category?: string;
  price: number;
  durationMin: number;
};

export type UpdateServicePayload = Partial<CreateServicePayload>;

export function getServices(token: string) {
  return apiFetch<ApiService[]>("/api/pro/services", {
    method: "GET",
    token,
  });
}

export function createService(token: string, payload: CreateServicePayload) {
  return apiFetch<ApiService>("/api/pro/services", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateService(
  token: string,
  id: string,
  payload: UpdateServicePayload
) {
  return apiFetch<ApiService>(`/api/pro/services/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function activateService(token: string, id: string) {
  return apiFetch<ApiService>(`/api/pro/services/${id}/activate`, {
    method: "PATCH",
    token,
  });
}

export function deactivateService(token: string, id: string) {
  return apiFetch<ApiService>(`/api/pro/services/${id}/deactivate`, {
    method: "PATCH",
    token,
  });
}

export function deleteService(token: string, id: string) {
  return apiFetch<ApiService>(`/api/pro/services/${id}`, {
    method: "DELETE",
    token,
  });
}