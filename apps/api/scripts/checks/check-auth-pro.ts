import "dotenv/config";
import fetch from "node-fetch";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

export type ProAuthResult = {
  accessToken: string;
  user: {
    id: string;
    role: string;
    email?: string | null;
    phone?: string | null;
  };
};

export async function loginPro(): Promise<ProAuthResult> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: "pro@ambya.com",
      password: "password123",
    }),
  });

  const raw = await res.text();
  let data: any = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!res.ok) {
    throw new Error(
      `Login pro failed (${res.status}) - ${
        typeof data === "object" && data?.message
          ? Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message
          : raw || "Unknown error"
      }`
    );
  }

  if (!data?.accessToken) {
    throw new Error("Login pro succeeded but accessToken is missing");
  }

  if (!data?.user?.id) {
    throw new Error("Login pro succeeded but user.id is missing");
  }

  if (data?.user?.role !== "PROFESSIONAL") {
    throw new Error(`Expected PROFESSIONAL role, got: ${data?.user?.role}`);
  }

  return data as ProAuthResult;
}

async function main() {
  const auth = await loginPro();
  console.log("✅ PRO AUTH CHECK PASSED");
  console.log(`User: ${auth.user.email ?? auth.user.phone ?? auth.user.id}`);
}

main().catch((error) => {
  console.error("❌ PRO AUTH CHECK FAILED");
  console.error(error);
  process.exit(1);
});