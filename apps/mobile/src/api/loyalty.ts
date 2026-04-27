import { apiFetch } from "./client";

export type LoyaltyCardType = "stamps" | "points" | "progressive";

export type LoyaltyConfigResponse = {
  enabled: boolean;
  cardType: LoyaltyCardType;
  programName: string;
  programDesc: string;
  stamps: number;
};

export type UpdateLoyaltyConfigPayload = {
  enabled: boolean;
  cardType: LoyaltyCardType;
  programName: string;
  programDesc?: string;
  stamps: number;
};

export type LoyaltyStatsResponse = {
  activeCards: number;
  usageRate: number;
  rewardsGranted: number;
  retentionRate: number;
};

export type LoyaltyClientItem = {
  id: string;
  name: string;
  progress: number;
  total: number;
};

export function getLoyaltyConfig() {
  return apiFetch<LoyaltyConfigResponse>("/api/pro/loyalty", {
    method: "GET",
  });
}

export function updateLoyaltyConfig(payload: UpdateLoyaltyConfigPayload) {
  return apiFetch<LoyaltyConfigResponse>("/api/pro/loyalty", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getLoyaltyStats() {
  return apiFetch<LoyaltyStatsResponse>("/api/pro/loyalty/stats", {
    method: "GET",
  });
}

export function getLoyaltyClients() {
  return apiFetch<LoyaltyClientItem[]>("/api/pro/loyalty/clients", {
    method: "GET",
  });
}