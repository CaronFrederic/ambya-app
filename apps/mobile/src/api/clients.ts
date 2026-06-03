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

export type ClientListItem = {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  blocked?: boolean;
};

export function getClientDetails(token: string, id: string) {
  return apiFetch<ClientDetails>(`/pro/clients/${id}`, {
    method: "GET",
    token,
  });
}

export function updateClientDepositExempt(
  token: string,
  id: string,
  depositExempt: boolean
) {
  return apiFetch<ClientDetails>(`/pro/clients/${id}/deposit-exempt`, {
    method: "PATCH",
    token,
    body: JSON.stringify({ isDepositExempt: depositExempt }),
  });
}

export function updateClientNotes(token: string, id: string, notes: string) {
  return apiFetch<ClientDetails>(`/pro/clients/${id}/notes`, {
    method: "PUT",
    token,
    body: JSON.stringify({ content: notes }),
  });
}

export function blockClient(token: string, id: string) {
  return apiFetch<ClientDetails>(`/pro/clients/${id}/block`, {
    method: "POST",
    token,
  });
}

export async function getSalonClients(token: string, search?: string) {
  const query = search?.trim()
    ? `?search=${encodeURIComponent(search.trim())}`
    : "";

  const rows = await apiFetch<any[]>(`/pro/clients${query}`, {
    method: "GET",
    token,
  });

  return rows.map((row) => {
    const client = row.client ?? {};

    const fullName =
      client.fullName ||
      [client.firstName, client.lastName].filter(Boolean).join(" ") ||
      client.name ||
      client.email ||
      client.phone ||
      "Client sans nom";

    return {
      id: row.id,
      fullName,
      phone: client.phone ?? null,
      email: client.email ?? null,
      blocked: row.isBlocked ?? false,
    };
  }) as ClientListItem[];
}