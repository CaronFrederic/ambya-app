const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type SalonSlot = {
  start: string;
  end: string;
  enabled: boolean;
};

export type SubscriptionPlan = "FREE" | "PRO" | "BUSINESS";
export type SubscriptionStatus = "ACTIVE" | "CANCELLED";

export type SalonSettingsResponse = {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  categories: string[];

  coverImageUrl: string | null;
  galleryImageUrls: string[];

  instagramHandle: string;
  showInstagramFeed: boolean;
  tiktokHandle: string;
  showTikTokFeed: boolean;
  facebookUrl: string;
  websiteUrl: string;

  scheduleType: "standard" | "custom";
  standardSlots: SalonSlot[];
  customSlots: Record<string, SalonSlot[]>;

  paymentSettings: {
    payMobileMoney: boolean;
    payCard: boolean;
    payCash: boolean;
    orangeMoney: string;
    moovMoney: string;
    airtelMoney: string;
    bankName: string;
    iban: string;
    bankOwner: string;
    cancelPolicyHours: number;
    subscriptionPlan: SubscriptionPlan;
    subscriptionStatus: SubscriptionStatus;
    subscriptionStartedAt: string | null;
    subscriptionCancelledAt: string | null;
  };

  depositEnabled: boolean;
  depositPercentage: number;
};

export type UpdateSalonSettingsPayload = {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  categories?: string[];

  coverImageUrl?: string | null;
  galleryImageUrls?: string[];

  instagramHandle?: string;
  showInstagramFeed?: boolean;
  tiktokHandle?: string;
  showTikTokFeed?: boolean;
  facebookUrl?: string;
  websiteUrl?: string;

  scheduleType: "standard" | "custom";
  standardSlots: SalonSlot[];
  customSlots: Record<string, SalonSlot[]>;

  paymentSettings: {
    payMobileMoney: boolean;
    payCard: boolean;
    payCash: boolean;
    orangeMoney?: string;
    moovMoney?: string;
    airtelMoney?: string;
    bankName?: string;
    iban?: string;
    bankOwner?: string;
    cancelPolicyHours?: number;
    subscriptionPlan?: SubscriptionPlan;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionStartedAt?: string | null;
    subscriptionCancelledAt?: string | null;
  };

  depositEnabled: boolean;
  depositPercentage: number;
};

export type SalonPhotoUploadInput = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type SalonPhotoUploadResponse = {
  url: string;
};

async function apiFetch<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "API error");
  }

  return response.json();
}

export function getSalonSettings(token: string) {
  return apiFetch<SalonSettingsResponse>("/api/pro/salon-settings", token);
}

export function updateSalonSettings(
  token: string,
  payload: UpdateSalonSettingsPayload
) {
  return apiFetch<SalonSettingsResponse>("/api/pro/salon-settings", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

function guessMimeType(fileName?: string | null) {
  const name = (fileName ?? "").toLowerCase();

  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";

  return "image/jpeg";
}

export async function uploadSalonPhoto(
  token: string,
  image: SalonPhotoUploadInput
): Promise<SalonPhotoUploadResponse> {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL n'est pas configurée.");
  }

  const formData = new FormData();

  const fallbackName = `salon-${Date.now()}.jpg`;
  const fileName = image.fileName?.trim() || fallbackName;
  const mimeType = image.mimeType?.trim() || guessMimeType(fileName);

  formData.append(
    "file",
    {
      uri: image.uri,
      name: fileName,
      type: mimeType,
    } as any
  );

  const response = await fetch(
    `${API_URL}/api/pro/salon-settings/photos/upload`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Impossible d'envoyer la photo.");
  }

  return response.json();
}
