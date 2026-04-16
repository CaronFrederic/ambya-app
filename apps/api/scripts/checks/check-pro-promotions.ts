import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

async function main() {
  try {
    const auth = await loginPro();

    const response = await fetch(`${API_URL}/api/pro/promotions`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Promotions fetch failed (${response.status}) - ${JSON.stringify(data)}`
      );
    }

    if (!Array.isArray(data)) {
      throw new Error("Promotions response is not an array");
    }

    console.log("✅ PRO PROMOTIONS CHECK PASSED");
    console.log(`Promotions count: ${data.length}`);
  } catch (error) {
    console.error("❌ PRO PROMOTIONS CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();
