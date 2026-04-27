import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

async function main() {
  try {
    const auth = await loginPro();

    const response = await fetch(
      `${API_URL}/api/pro/appointments/history/export?status=completed`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Export failed (${response.status}) - ${text}`);
    }

    const contentType = response.headers.get("content-type") || "";
    const disposition = response.headers.get("content-disposition") || "";
    const buffer = await response.arrayBuffer();

    if (
      !contentType.includes(
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
    ) {
      throw new Error(`Unexpected content-type: ${contentType}`);
    }

    if (!disposition.includes(".xlsx")) {
      throw new Error(`Unexpected content-disposition: ${disposition}`);
    }

    if (!buffer || buffer.byteLength === 0) {
      throw new Error("Exported file is empty");
    }

    console.log("✅ PRO BOOKING HISTORY EXPORT CHECK PASSED");
    console.log(`Export size: ${buffer.byteLength} bytes`);
  } catch (error) {
    console.error("❌ PRO BOOKING HISTORY EXPORT CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();