import "dotenv/config";
import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

async function main() {
  const auth = await loginPro();

  const res = await fetch(`${API_URL}/api/pro/employees`, {
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
    throw new Error(`Employees list failed (${res.status}) - ${raw}`);
  }

  if (!Array.isArray(data)) {
    throw new Error("Employees response is not an array");
  }

  if (data.length === 0) {
    throw new Error("Employees response is empty");
  }

  const first = data[0];

  const requiredFields = ["id", "salonId", "displayName", "status", "isActive"];
  for (const field of requiredFields) {
    if (!(field in first)) {
      throw new Error(`Employee field "${field}" is missing`);
    }
  }

  console.log("✅ PRO EMPLOYEES CHECK PASSED");
  console.log(`Employees count: ${data.length}`);
}

main().catch((error) => {
  console.error("❌ PRO EMPLOYEES CHECK FAILED");
  console.error(error);
  process.exit(1);
});