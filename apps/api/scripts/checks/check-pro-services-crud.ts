import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

async function main() {
  try {
    const auth = await loginPro();

    const createResponse = await fetch(`${API_URL}/api/pro/services`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Service CRUD ${Date.now()}`,
        description: "Service de test automatique",
        category: "Autre",
        price: 9000,
        durationMin: 45,
      }),
    });

    const created = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(
        `Service create failed (${createResponse.status}) - ${JSON.stringify(created)}`
      );
    }

    const serviceId = created.id as string;
    if (!serviceId) {
      throw new Error("Service create response missing id");
    }

    const updateResponse = await fetch(`${API_URL}/api/pro/services/${serviceId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: "Service de test modifié",
        price: 11000,
        durationMin: 60,
      }),
    });

    const updated = await updateResponse.json();

    if (!updateResponse.ok) {
      throw new Error(
        `Service update failed (${updateResponse.status}) - ${JSON.stringify(updated)}`
      );
    }

    const deactivateResponse = await fetch(
      `${API_URL}/api/pro/services/${serviceId}/deactivate`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const deactivated = await deactivateResponse.json();

    if (!deactivateResponse.ok) {
      throw new Error(
        `Service deactivate failed (${deactivateResponse.status}) - ${JSON.stringify(deactivated)}`
      );
    }

    const activateResponse = await fetch(
      `${API_URL}/api/pro/services/${serviceId}/activate`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const activated = await activateResponse.json();

    if (!activateResponse.ok) {
      throw new Error(
        `Service activate failed (${activateResponse.status}) - ${JSON.stringify(activated)}`
      );
    }

    const deleteResponse = await fetch(`${API_URL}/api/pro/services/${serviceId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const deleted = await deleteResponse.json();

    if (!deleteResponse.ok) {
      throw new Error(
        `Service delete failed (${deleteResponse.status}) - ${JSON.stringify(deleted)}`
      );
    }

    console.log("✅ PRO SERVICES CRUD CHECK PASSED");
    console.log({
      createdId: serviceId,
      updatedPrice: updated.price ?? null,
      activatedStatus: activated.status ?? null,
      deletedStatus: deleted.status ?? null,
    });
  } catch (error) {
    console.error("❌ PRO SERVICES CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();