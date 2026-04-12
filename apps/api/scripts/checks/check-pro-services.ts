import "dotenv/config";
import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

async function main() {
  const auth = await loginPro();

  const res = await fetch(`${API_URL}/api/pro/services`, {
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
    throw new Error(`Services list failed (${res.status}) - ${raw}`);
  }

  if (!Array.isArray(data)) {
    throw new Error("Services response is not an array");
  }

  if (data.length === 0) {
    throw new Error("Services response is empty");
  }

  const first = data[0];
  const requiredFields = ["id", "salonId", "name", "price", "durationMin", "status"];

  for (const field of requiredFields) {
    if (!(field in first)) {
      throw new Error(`Service field "${field}" is missing`);
    }
  }

  if (typeof first.price !== "number") {
    throw new Error("Service price is not numeric");
  }

  console.log("✅ PRO SERVICES CHECK PASSED");
  console.log(`Services count: ${data.length}`);
}

main().catch((error) => {
  console.error("❌ PRO SERVICES CHECK FAILED");
  console.error(error);
  process.exit(1);
});