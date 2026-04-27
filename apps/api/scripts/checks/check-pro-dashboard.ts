import "dotenv/config";
import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

async function main() {
  const auth = await loginPro();

  const res = await fetch(`${API_URL}/api/pro/dashboard/summary`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
    },
  });

  const raw = await res.text();
  let data: any = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    throw new Error(`Dashboard summary failed (${res.status}) - ${raw}`);
  }

  const requiredNumericFields = [
    "todayAppointments",
    "monthRevenue",
    "monthExpenses",
    "newClients",
    "occupancyRate",
  ];

  for (const field of requiredNumericFields) {
    if (typeof data?.[field] !== "number") {
      throw new Error(`Dashboard field "${field}" is missing or invalid`);
    }
  }

  console.log("✅ PRO DASHBOARD CHECK PASSED");
  console.log(data);
}

main().catch((error) => {
  console.error("❌ PRO DASHBOARD CHECK FAILED");
  console.error(error);
  process.exit(1);
});