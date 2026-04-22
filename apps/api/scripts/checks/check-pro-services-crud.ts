import fetch, { type Response } from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

async function json(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function listServices(token: string) {
  const res = await fetch(`${API_URL}/api/pro/services`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await json(res);
  if (!res.ok) {
    throw new Error(`Services list failed (${res.status}) - ${JSON.stringify(data)}`);
  }
  if (!Array.isArray(data)) {
    throw new Error("Services response is not an array");
  }
  return data;
}

async function main() {
  try {
    const auth = await loginPro();
    const suffix = uniqueSuffix();

    const createRes = await fetch(`${API_URL}/api/pro/services`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Service CRUD ${suffix}`,
        description: "Service de test automatique",
        category: "Autre",
        price: 9000,
        durationMin: 45,
      }),
    });

    const created = await json(createRes);
    if (!createRes.ok) {
      throw new Error(`Service create failed (${createRes.status}) - ${JSON.stringify(created)}`);
    }

    const serviceId = created?.id;
    if (!serviceId) {
      throw new Error("Service create response missing id");
    }

    const servicesAfterCreate = await listServices(auth.accessToken);
    const createdInList = servicesAfterCreate.find((s: any) => s.id === serviceId);
    if (!createdInList) {
      throw new Error("Created service not found in list");
    }

    const invalidCreateRes = await fetch(`${API_URL}/api/pro/services`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `Service invalid ${suffix}`,
        price: 0,
        durationMin: 0,
      }),
    });

    const invalidCreateData = await json(invalidCreateRes);
    if (invalidCreateRes.ok) {
      throw new Error("Invalid service creation should have failed");
    }

    const updateRes = await fetch(`${API_URL}/api/pro/services/${serviceId}`, {
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

    const updated = await json(updateRes);
    if (!updateRes.ok) {
      throw new Error(`Service update failed (${updateRes.status}) - ${JSON.stringify(updated)}`);
    }

    if (updated.price !== 11000 || updated.durationMin !== 60) {
      throw new Error("Service update values are incorrect");
    }

    const deactivateRes = await fetch(`${API_URL}/api/pro/services/${serviceId}/deactivate`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const deactivated = await json(deactivateRes);
    if (!deactivateRes.ok) {
      throw new Error(`Service deactivate failed (${deactivateRes.status}) - ${JSON.stringify(deactivated)}`);
    }

    if (deactivated.status !== "INACTIVE" || deactivated.isActive !== false) {
      throw new Error("Service deactivate did not set inactive status");
    }

    const activateRes = await fetch(`${API_URL}/api/pro/services/${serviceId}/activate`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const activated = await json(activateRes);
    if (!activateRes.ok) {
      throw new Error(`Service activate failed (${activateRes.status}) - ${JSON.stringify(activated)}`);
    }

    if (activated.status !== "ACTIVE" || activated.isActive !== true) {
      throw new Error("Service activate did not restore active status");
    }

    const deleteRes = await fetch(`${API_URL}/api/pro/services/${serviceId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const deleted = await json(deleteRes);
    if (!deleteRes.ok) {
      throw new Error(`Service delete failed (${deleteRes.status}) - ${JSON.stringify(deleted)}`);
    }

    if (deleted.status !== "ARCHIVED" || deleted.isActive !== false || !deleted.deletedAt) {
      throw new Error("Service remove did not archive properly");
    }

    const servicesAfterDelete = await listServices(auth.accessToken);
    const archivedStillListed = servicesAfterDelete.find((s: any) => s.id === serviceId);
    if (archivedStillListed) {
      throw new Error("Archived service should no longer appear in list");
    }

    console.log("✅ PRO SERVICES CRUD CHECK PASSED");
    console.log({
      createdId: serviceId,
      updatedPrice: updated.price,
      activatedStatus: activated.status,
      deletedStatus: deleted.status,
      invalidCreateError: invalidCreateData?.message ?? null,
    });
  } catch (error) {
    console.error("❌ PRO SERVICES CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();