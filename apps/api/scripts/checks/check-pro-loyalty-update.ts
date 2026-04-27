import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

async function main() {
  try {
    const auth = await loginPro();

    const payload = {
      enabled: true,
      cardType: "stamps",
      programName: "Carte CRUD Test",
      programDesc: "Programme fidélité mis à jour par test automatique",
      stamps: 12,
    };

    const updateResponse = await fetch(`${API_URL}/api/pro/loyalty`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const updateData = await updateResponse.json();

    if (!updateResponse.ok) {
      throw new Error(
        `Loyalty update failed (${updateResponse.status}) - ${JSON.stringify(updateData)}`
      );
    }

    const getResponse = await fetch(`${API_URL}/api/pro/loyalty`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const getData = await getResponse.json();

    if (!getResponse.ok) {
      throw new Error(
        `Loyalty refetch failed (${getResponse.status}) - ${JSON.stringify(getData)}`
      );
    }

    if (getData.programName !== payload.programName) {
      throw new Error(
        `Expected programName=${payload.programName}, got ${getData.programName}`
      );
    }

    if (getData.cardType !== payload.cardType) {
      throw new Error(
        `Expected cardType=${payload.cardType}, got ${getData.cardType}`
      );
    }

    if (Number(getData.stamps) !== payload.stamps) {
      throw new Error(
        `Expected stamps=${payload.stamps}, got ${getData.stamps}`
      );
    }

    console.log("✅ PRO LOYALTY UPDATE CHECK PASSED");
    console.log({
      enabled: getData.enabled,
      cardType: getData.cardType,
      programName: getData.programName,
      stamps: getData.stamps,
    });
  } catch (error) {
    console.error("❌ PRO LOYALTY UPDATE CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();