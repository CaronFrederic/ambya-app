import { apiFetch } from "./client";

export type PromotionType = "percentage" | "fixed";
export type PromotionStatus = "active" | "expired";

export type PromotionItem = {
  id: string;
  name: string;
  type: PromotionType;
  value: number;
  services: string;
  start: string;
  end: string;
  status: PromotionStatus;
};

export type PromotionStats = {
  appointmentsViaPromos: number;
  revenueGenerated: number;
  conversionRate: number;
  activeCount: number;
};

export type CreatePromotionPayload = {
  title: string;
  description?: string;
  type: PromotionType;
  value: number;
  startDate: string;
  endDate: string;
  appliesToAllServices?: boolean;
  serviceIds?: string[];
};

export type UpdatePromotionPayload = Partial<CreatePromotionPayload>;

export function getPromotions() {
  return apiFetch<PromotionItem[]>("/api/pro/promotions", {
    method: "GET",
  });
}

export function getPromotionStats() {
  return apiFetch<PromotionStats>("/api/pro/promotions/stats", {
    method: "GET",
  });
}

export function createPromotion(payload: CreatePromotionPayload) {
  return apiFetch<PromotionItem>("/api/pro/promotions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePromotion(id: string, payload: UpdatePromotionPayload) {
  return apiFetch<PromotionItem>(`/api/pro/promotions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deletePromotion(id: string) {
  return apiFetch<{ success: true }>(`/api/pro/promotions/${id}`, {
    method: "DELETE",
  });
}