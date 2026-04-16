import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

async function main() {
  try {
    const auth = await loginPro();

    const createResponse = await fetch(`${API_URL}/api/pro/expenses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        category: "Test CRUD",
        description: "Dépense créée automatiquement",
        amount: 12345,
        expenseDate: new Date().toISOString(),
      }),
    });

    const created = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(
        `Expense create failed (${createResponse.status}) - ${JSON.stringify(created)}`
      );
    }

    const expenseId = created.id as string;
    if (!expenseId) {
      throw new Error("Expense create response missing id");
    }

    const deleteResponse = await fetch(`${API_URL}/api/pro/expenses/${expenseId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const deleted = await deleteResponse.json();

    if (!deleteResponse.ok) {
      throw new Error(
        `Expense delete failed (${deleteResponse.status}) - ${JSON.stringify(deleted)}`
      );
    }

    console.log("✅ PRO EXPENSES CRUD CHECK PASSED");
    console.log({
      createdId: expenseId,
      deletedStatus: deleted.status ?? null,
      deletedAt: deleted.deletedAt ?? null,
    });
  } catch (error) {
    console.error("❌ PRO EXPENSES CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();