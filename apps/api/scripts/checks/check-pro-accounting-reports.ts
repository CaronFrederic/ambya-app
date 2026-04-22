import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

async function main() {
  try {
    const auth = await loginPro();

    const params = new URLSearchParams({
      reportType: "compte-resultat",
      periodType: "Ce mois",
    });

    const response = await fetch(
      `${API_URL}/api/pro/accounting-reports?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Accounting report failed (${response.status}) - ${JSON.stringify(data)}`
      );
    }

    if (!data || typeof data !== "object") {
      throw new Error("Accounting report response is invalid");
    }

    if (
      typeof data?.summary?.totalRevenue !== "number" ||
      typeof data?.summary?.totalExpenses !== "number" ||
      typeof data?.summary?.netResult !== "number"
    ) {
      throw new Error("Accounting report summary is invalid");
    }

    console.log("✅ PRO ACCOUNTING REPORTS CHECK PASSED");
    console.log(data);
  } catch (error) {
    console.error("❌ PRO ACCOUNTING REPORTS CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();