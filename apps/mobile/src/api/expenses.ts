import { apiFetch } from "./client";

export type ApiExpense = {
  id: string;
  salonId: string;
  category: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  receiptUrl: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateExpensePayload = {
  category: string;
  description?: string;
  amount: number;
  expenseDate: string;
  receiptUrl?: string;
};

export type UpdateExpensePayload = Partial<CreateExpensePayload>;

export type ListExpensesParams = {
  month?: string;
  category?: string;
};

function buildQuery(params?: ListExpensesParams) {
  if (!params) return "";
  const search = new URLSearchParams();

  if (params.month) search.set("month", params.month);
  if (params.category) search.set("category", params.category);

  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function getExpenses(token: string, params?: ListExpensesParams) {
  return apiFetch<ApiExpense[]>(`/api/pro/expenses${buildQuery(params)}`, {
    method: "GET",
    token,
  });
}

export function createExpense(token: string, payload: CreateExpensePayload) {
  return apiFetch<ApiExpense>("/api/pro/expenses", {
    method: "POST",
    token,
    body: JSON.stringify(payload),
  });
}

export function updateExpense(
  token: string,
  id: string,
  payload: UpdateExpensePayload
) {
  return apiFetch<ApiExpense>(`/api/pro/expenses/${id}`, {
    method: "PATCH",
    token,
    body: JSON.stringify(payload),
  });
}

export function deleteExpense(token: string, id: string) {
  return apiFetch<ApiExpense>(`/api/pro/expenses/${id}`, {
    method: "DELETE",
    token,
  });
}