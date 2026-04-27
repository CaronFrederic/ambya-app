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

export function getServices() {
  return apiFetch<ApiService[]>("/api/pro/services", {
    method: "GET",
    
  });
}

export function createService( payload: CreateServicePayload) {
  return apiFetch<ApiService>("/api/pro/services", {
    method: "POST",
    
    body: JSON.stringify(payload),
  });
}

export function updateService(
  
  id: string,
  payload: UpdateServicePayload
) {
  return apiFetch<ApiService>(`/api/pro/services/${id}`, {
    method: "PATCH",
    
    body: JSON.stringify(payload),
  });
}

export function activateService( id: string) {
  return apiFetch<ApiService>(`/api/pro/services/${id}/activate`, {
    method: "PATCH",
    
  });
}

export function deactivateService( id: string) {
  return apiFetch<ApiService>(`/api/pro/services/${id}/deactivate`, {
    method: "PATCH",
    
  });
}

export function deleteService( id: string) {
  return apiFetch<ApiService>(`/api/pro/services/${id}`, {
    method: "DELETE",
    
  });
}