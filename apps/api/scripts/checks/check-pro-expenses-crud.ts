import fetch, { type Response } from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function json(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function listExpenses(token: string, query = "") {
  const res = await fetch(`${API_URL}/api/pro/expenses${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await json(res);
  if (!res.ok) {
    throw new Error(`Expenses list failed (${res.status}) - ${JSON.stringify(data)}`);
  }
  if (!Array.isArray(data)) {
    throw new Error("Expenses response is not an array");
  }
  return data;
}

async function main() {
  try {
    const auth = await loginPro();
    const suffix = uniqueSuffix();
    const now = new Date();
    const month = now.toISOString().slice(0, 7);

    const createRes = await fetch(`${API_URL}/api/pro/expenses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: `Test CRUD ${suffix}`,
        description: "Dépense créée automatiquement",
        amount: 12345,
        expenseDate: now.toISOString(),
      }),
    });

    const created = await json(createRes);
    if (!createRes.ok) {
      throw new Error(`Expense create failed (${createRes.status}) - ${JSON.stringify(created)}`);
    }

    const expenseId = created?.id;
    if (!expenseId) {
      throw new Error("Expense create response missing id");
    }

    const expensesAfterCreate = await listExpenses(auth.accessToken);
    const createdInList = expensesAfterCreate.find((e: any) => e.id === expenseId);
    if (!createdInList) {
      throw new Error("Created expense not found in list");
    }

    const updateRes = await fetch(`${API_URL}/api/pro/expenses/${expenseId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: "Dépense modifiée automatiquement",
        amount: 15000,
      }),
    });

    const updated = await json(updateRes);
    if (!updateRes.ok) {
      throw new Error(`Expense update failed (${updateRes.status}) - ${JSON.stringify(updated)}`);
    }

    if (updated.amount !== 15000) {
      throw new Error("Expense amount was not updated");
    }

    const filteredByCategory = await listExpenses(
      auth.accessToken,
      `?category=${encodeURIComponent(`Test CRUD ${suffix}`)}`
    );
    if (!filteredByCategory.some((e: any) => e.id === expenseId)) {
      throw new Error("Expense category filter did not return created expense");
    }

    const filteredByMonth = await listExpenses(
      auth.accessToken,
      `?month=${encodeURIComponent(month)}`
    );
    if (!filteredByMonth.some((e: any) => e.id === expenseId)) {
      throw new Error("Expense month filter did not return created expense");
    }

    const invalidCreateRes = await fetch(`${API_URL}/api/pro/expenses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: "Invalide",
        amount: 0,
        expenseDate: "not-a-date",
      }),
    });

    const invalidCreateData = await json(invalidCreateRes);
    if (invalidCreateRes.ok) {
      throw new Error("Invalid expense creation should have failed");
    }

    const deleteRes = await fetch(`${API_URL}/api/pro/expenses/${expenseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const deleted = await json(deleteRes);
    if (!deleteRes.ok) {
      throw new Error(`Expense delete failed (${deleteRes.status}) - ${JSON.stringify(deleted)}`);
    }

    if (deleted.status !== "CANCELLED" || !deleted.deletedAt) {
      throw new Error("Expense delete did not soft delete properly");
    }

    const expensesAfterDelete = await listExpenses(auth.accessToken);
    const deletedStillListed = expensesAfterDelete.find((e: any) => e.id === expenseId);
    if (deletedStillListed) {
      throw new Error("Deleted expense should no longer appear in active list");
    }

    console.log("✅ PRO EXPENSES CRUD CHECK PASSED");
    console.log({
      createdId: expenseId,
      updatedAmount: updated.amount,
      deletedStatus: deleted.status,
      deletedAt: deleted.deletedAt,
      invalidCreateError: invalidCreateData?.message ?? null,
    });
  } catch (error) {
    console.error("❌ PRO EXPENSES CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();