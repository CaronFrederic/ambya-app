import "dotenv/config";
import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

async function checkEndpoint(
  label: string,
  path: string,
  token: string,
  expectArray = true
) {
  const res = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
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
    throw new Error(`${label} failed (${res.status}) - ${raw}`);
  }

  if (expectArray && !Array.isArray(data)) {
    throw new Error(`${label} response is not an array`);
  }

  return data;
}

async function main() {
  const auth = await loginPro();
  const date = todayYmd();

  const calendar = await checkEndpoint(
    "Calendar",
    `/api/pro/appointments/calendar?date=${encodeURIComponent(date)}`,
    auth.accessToken
  );

  const pending = await checkEndpoint(
    "Pending",
    `/api/pro/appointments/pending?date=${encodeURIComponent(date)}`,
    auth.accessToken
  );

  if (Array.isArray(calendar) && calendar.length > 0) {
    const first = calendar[0];
    const requiredFields = ["id", "startAt", "endAt", "status", "clientName", "serviceName"];
    for (const field of requiredFields) {
      if (!(field in first)) {
        throw new Error(`Calendar field "${field}" is missing`);
      }
    }
  }

  if (Array.isArray(pending) && pending.length > 0) {
    const first = pending[0];
    const requiredFields = ["id", "startAt", "endAt", "status", "clientName", "serviceName"];
    for (const field of requiredFields) {
      if (!(field in first)) {
        throw new Error(`Pending field "${field}" is missing`);
      }
    }
  }

  console.log("✅ PRO AGENDA CHECK PASSED");
  console.log(`Calendar count: ${calendar.length}`);
  console.log(`Pending count: ${pending.length}`);
}

main().catch((error) => {
  console.error("❌ PRO AGENDA CHECK FAILED");
  console.error(error);
  process.exit(1);
});