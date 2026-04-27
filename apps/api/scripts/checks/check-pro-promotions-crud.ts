import fetch, { type Response } from "node-fetch";
import { loginPro } from "./check-auth-pro";

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function json(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

async function fetchServices(accessToken: string) {
  const response = await fetch(`${API_URL}/api/pro/services`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await json(response);

  if (!response.ok) {
    throw new Error(`Services fetch failed (${response.status}) - ${JSON.stringify(data)}`);
  }

  return data as Array<{ id: string; isActive: boolean; status: string }>;
}

async function fetchPromotions(accessToken: string) {
  const response = await fetch(`${API_URL}/api/pro/promotions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await json(response);

  if (!response.ok) {
    throw new Error(`Promotions fetch failed (${response.status}) - ${JSON.stringify(data)}`);
  }

  if (!Array.isArray(data)) {
    throw new Error("Promotions response is not an array");
  }

  return data;
}

async function main() {
  try {
    const auth = await loginPro();
    const services = await fetchServices(auth.accessToken);
    const activeService = services.find((service) => service.isActive);

    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const createPayload = {
      title: `Promo CRUD ${Date.now()}`,
      description: "Promotion créée automatiquement",
      type: "percentage",
      value: 12,
      startDate: toYmd(today),
      endDate: toYmd(nextWeek),
      appliesToAllServices: !activeService,
      serviceIds: activeService ? [activeService.id] : [],
    };

    const createResponse = await fetch(`${API_URL}/api/pro/promotions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createPayload),
    });

    const created = await json(createResponse);

    if (!createResponse.ok) {
      throw new Error(`Promotion create failed (${createResponse.status}) - ${JSON.stringify(created)}`);
    }

    const promotionId = created?.id as string;
    if (!promotionId) {
      throw new Error("Promotion create response missing id");
    }

    const promotionsAfterCreate = await fetchPromotions(auth.accessToken);
    const createdInList = promotionsAfterCreate.find((p: any) => p.id === promotionId);
    if (!createdInList) {
      throw new Error("Created promotion not found in list");
    }

    const invalidResponse = await fetch(`${API_URL}/api/pro/promotions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Promo invalide",
        type: "percentage",
        value: 150,
        startDate: toYmd(today),
        endDate: toYmd(nextWeek),
        appliesToAllServices: true,
      }),
    });

    const invalidData = await json(invalidResponse);
    if (invalidResponse.ok) {
      throw new Error("Invalid promotion should have failed");
    }

    const updateResponse = await fetch(`${API_URL}/api/pro/promotions/${promotionId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Promo CRUD modifiée",
        type: "percentage",
        value: 18,
        startDate: toYmd(today),
        endDate: toYmd(nextWeek),
        appliesToAllServices: true,
        serviceIds: [],
      }),
    });

    const updated = await json(updateResponse);

    if (!updateResponse.ok) {
      throw new Error(`Promotion update failed (${updateResponse.status}) - ${JSON.stringify(updated)}`);
    }

    if (updated.value !== 18) {
      throw new Error("Promotion value was not updated");
    }

    const promotionsAfterUpdate = await fetchPromotions(auth.accessToken);
    const updatedInList = promotionsAfterUpdate.find((p: any) => p.id === promotionId);
    if (!updatedInList) {
      throw new Error("Updated promotion not found in list");
    }

    const deleteResponse = await fetch(`${API_URL}/api/pro/promotions/${promotionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const deleted = await json(deleteResponse);

    if (!deleteResponse.ok) {
      throw new Error(`Promotion delete failed (${deleteResponse.status}) - ${JSON.stringify(deleted)}`);
    }

    const promotionsAfterDelete = await fetchPromotions(auth.accessToken);
    const deletedStillListed = promotionsAfterDelete.find((p: any) => p.id === promotionId);
    if (deletedStillListed) {
      throw new Error("Deleted promotion should no longer appear in list");
    }

    console.log("✅ PRO PROMOTIONS CRUD CHECK PASSED");
    console.log({
      createdId: promotionId,
      updatedTitle: updated.name ?? null,
      updatedValue: updated.value ?? null,
      invalidPromotionError: invalidData?.message ?? null,
    });
  } catch (error) {
    console.error("❌ PRO PROMOTIONS CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();