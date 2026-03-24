import { apiFetch } from "./client";

export type ClientBookingHistoryItem = {
  id: string;
  date: string;
  service: string;
  employee: string;
  amount: number;
  status: "COMPLETED" | "CANCELLED";
};

export type ClientPreferredService = {
  name: string;
  count: number;
};

export type ClientPreferredEmployee = {
  id: string;
  name: string;
  count: number;
};

export type ClientDetails = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  createdAt: string | null;

  depositExempt: boolean;
  depositRate: number;
  depositsPaidCount: number;
  depositsPaidAmount: number;

  notes: string | null;
  blocked: boolean;

  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenueGenerated: number;
  averageBasket: number;
  lastVisitLabel: string | null;
  loyaltyRateLabel: string | null;
  noShowRateLabel: string | null;

  allergyAlert: string | null;
  allergyNote: string | null;

  preferredServices?: ClientPreferredService[];
  preferredEmployees?: ClientPreferredEmployee[];
  bookingHistory?: ClientBookingHistoryItem[];
};

export function getClientDetails(token: string, id: string) {
  return apiFetch<ClientDetails>(`/api/pro/clients/${id}`, {
    method: "GET",
    token,
  });
}

export function updateClientDepositExempt(
  token: string,
  id: string,
  depositExempt: boolean
) {
  return apiFetch<ClientDetails>(`/api/pro/clients/${id}/deposit-exempt`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ depositExempt }),
  });
}

export function updateClientNotes(token: string, id: string, notes: string) {
  return apiFetch<ClientDetails>(`/api/pro/clients/${id}/notes`, {
    method: "PUT",
    token,
    body: JSON.stringify({ notes }),
  });
}

export function blockClient(token: string, id: string) {
  return apiFetch<ClientDetails>(`/api/pro/clients/${id}/block`, {
    method: "POST",
    token,
  });
}