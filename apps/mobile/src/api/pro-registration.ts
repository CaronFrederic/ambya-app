import { fetch as expoFetch } from "expo/fetch";
import { File } from "expo-file-system";

import { apiFetch } from "./client";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type CountryCode = "+241";
export type LoginMethod = "phone" | "email";
export type PaymentMethod = "mobile-money" | "bank";
export type ServiceType = "individual" | "group";

export type TimeSlotPayload = {
  start: string;
  end: string;
};

export type DaySchedulePayload = {
  isOpen: boolean;
  slots: TimeSlotPayload[];
};

export type GroupSettingsPayload = {
  maxCapacity: number;
  minCapacity?: number;
  alertThreshold?: number;
  cancellationPolicy: string;
  waitingList: boolean;
};

export type ProServicePayload = {
  name: string;
  category: string;
  description?: string;
  duration: string;
  price: number;
  type?: ServiceType;
  groupSettings?: GroupSettingsPayload;
};

export type ProfessionalRegistrationPhoto = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export type ProfessionalRegistrationPhotoUploadResponse = {
  url: string;
};

export type RegisterProfessionalPayload = {
  establishmentName?: string;
  establishmentType?: string;
  customType?: string;
  categories?: string[];

  countryCode?: CountryCode;
  phone?: string;
  email?: string;

  address?: string;
  city?: string;
  district?: string;
  customDistrict?: string;

  photos: string[];

  schedule?: Record<string, DaySchedulePayload>;
  teamSize?: number;
  workstations?: number;

  services?: ProServicePayload[];

  loginMethod?: LoginMethod;
  password: string;
  confirmPassword?: string;

  paymentMethod?: PaymentMethod;
  mobileMoneyOperator?: "airtel" | "moov";
  mobileMoneyNumber?: string;

  depositEnabled?: boolean;
  depositPercentage?: number;

  acceptTerms?: boolean;
  acceptNotifications?: boolean;
  acceptNewsletter?: boolean;

  // compat ancien flux
  salonName?: string;
};

export type RegisterProfessionalResponse = {
  accessToken: string;
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    role: string;
    isActive: boolean;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    preferredLoginMethod?: string | null;
    createdAt?: string;
  };
  salon: {
    id: string;
    name: string;
    address?: string | null;
    city?: string | null;
    ownerId?: string;
    establishmentType?: string | null;
    district?: string | null;
    categories?: string[];
    teamSize?: number | null;
    workstations?: number | null;
    paymentMethod?: string | null;
    mobileMoneyOperator?: string | null;
    mobileMoneyNumber?: string | null;
    depositEnabled?: boolean;
    depositPercentage?: number | null;
    onboardingCompleted?: boolean;
    coverImageUrl?: string | null;
    galleryImageUrls?: string[];
  };
  verificationRequired: boolean;
  verificationChannel: "sms" | "email" | "none";
  otpDebugCode?: string | null;
};

function guessMimeType(fileName?: string | null) {
  const name = (fileName ?? "").toLowerCase();

  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".heic")) return "image/heic";
  if (name.endsWith(".heif")) return "image/heif";

  return "image/jpeg";
}

export async function uploadProfessionalRegistrationPhoto(
  image: ProfessionalRegistrationPhoto,
): Promise<ProfessionalRegistrationPhotoUploadResponse> {
  if (!API_URL) {
    throw new Error("EXPO_PUBLIC_API_URL n'est pas configurée.");
  }

  const formData = new FormData();

  // SDK 57 utilise l'implémentation WinterCG de fetch/FormData.
  // L'ancien objet React Native { uri, name, type } n'est plus accepté
  // comme FormDataPart. expo-file-system fournit un vrai File/Blob compatible.
  const file = new File(image.uri);

  if (!file.exists) {
    throw new Error("La photo sélectionnée n'est plus accessible sur l'appareil.");
  }

  formData.append("file", file);

  const response = await expoFetch(`${API_URL}/api/auth/register-owner/photos`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Impossible d'envoyer une photo d'inscription.");
  }

  return response.json();
}

export async function registerProfessional(
  payload: RegisterProfessionalPayload,
) {
  return apiFetch<RegisterProfessionalResponse>("/auth/register-owner", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}