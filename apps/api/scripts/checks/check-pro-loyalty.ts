import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

async function main() {
  try {
    const auth = await loginPro();

    const response = await fetch(`${API_URL}/api/pro/loyalty`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Loyalty fetch failed (${response.status}) - ${JSON.stringify(data)}`
      );
    }

    if (!data || typeof data !== "object") {
      throw new Error("Loyalty response is invalid");
    }

    console.log("✅ PRO LOYALTY CHECK PASSED");
    console.log({
      enabled: data.enabled,
      cardName: data.cardName ?? null,
    });
  } catch (error) {
    console.error("❌ PRO LOYALTY CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();