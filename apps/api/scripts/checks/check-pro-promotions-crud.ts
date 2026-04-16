import fetch from "node-fetch";
import { loginPro } from "./check-auth-pro";

const PORT = process.env.PORT || "3001";
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

function toYmd(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function fetchServices(accessToken: string) {
  const response = await fetch(`${API_URL}/api/pro/services`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Services fetch failed (${response.status}) - ${JSON.stringify(data)}`
    );
  }

  return data as Array<{ id: string; isActive: boolean; status: string }>;
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

    const created = await createResponse.json();

    if (!createResponse.ok) {
      throw new Error(
        `Promotion create failed (${createResponse.status}) - ${JSON.stringify(created)}`
      );
    }

    const promotionId = created.id as string;
    if (!promotionId) {
      throw new Error("Promotion create response missing id");
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

    const updated = await updateResponse.json();

    if (!updateResponse.ok) {
      throw new Error(
        `Promotion update failed (${updateResponse.status}) - ${JSON.stringify(updated)}`
      );
    }

    const deleteResponse = await fetch(`${API_URL}/api/pro/promotions/${promotionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const deletedText = await deleteResponse.text();

    if (!deleteResponse.ok) {
      throw new Error(
        `Promotion delete failed (${deleteResponse.status}) - ${deletedText}`
      );
    }

    console.log("✅ PRO PROMOTIONS CRUD CHECK PASSED");
    console.log({
      createdId: promotionId,
      updatedTitle: updated.title ?? null,
      updatedValue: updated.value ?? null,
    });
  } catch (error) {
    console.error("❌ PRO PROMOTIONS CRUD CHECK FAILED");
    console.error(error);
    process.exit(1);
  }
}

main();