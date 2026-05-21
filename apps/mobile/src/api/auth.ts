import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { api, apiFetch, buildApiUrl } from "./client";

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    role: string;
    email?: string | null;
    phone?: string | null;
    isActive?: boolean;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    preferredLoginMethod?: string | null;
  };
};

export type VerifyOtpPayload = {
  code: string;
};

export type VerifyOtpResponse = {
  success: boolean;
  message: string;
  user: {
    id: string;
    email?: string | null;
    phone?: string | null;
    role: string;
    isActive: boolean;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    preferredLoginMethod?: string | null;
  };
};

export type ResendOtpResponse = {
  success: boolean;
  message: string;
  verificationChannel: "sms" | "email";
  otpDebugCode?: string | null;
  expiresAt?: string;
};

type RegisterDto = {
  email?: string;
  phone?: string;
  password: string;
};

type RegisterResponse = {
  accessToken: string;
  user: {
    id: string;
    role: "CLIENT" | "PROFESSIONAL" | "EMPLOYEE" | "ADMIN" | "SALON_MANAGER";
  };
};

async function readApiError(res: Response, fallback: string) {
  const raw = await res.text().catch(() => "");

  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as {
      message?: string | string[];
      error?: string;
    };
    const message = Array.isArray(parsed.message)
      ? parsed.message.join("\n")
      : parsed.message;

    const readable = message || parsed.error || fallback;
    return toFriendlyAuthError(readable);
  } catch {
    return toFriendlyAuthError(raw || fallback);
  }
}

function toFriendlyAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("email deja utilise") || normalized.includes("email déjà utilisé")) {
    return "Cet email est déjà utilisé.";
  }

  if (
    normalized.includes("telephone deja utilise") ||
    normalized.includes("téléphone déjà utilisé") ||
    normalized.includes("telephone déjà utilisé")
  ) {
    return "Ce numéro de téléphone est déjà utilisé.";
  }

  if (normalized.includes("must be an email") || normalized.includes("email must be an email")) {
    return "Vérifie le format de ton email.";
  }

  if (normalized.includes("password must be longer than or equal to 6")) {
    return "Choisis un mot de passe de 6 caractères minimum.";
  }

  return message;
}

export async function login(payload: LoginPayload) {
  const res = await api.post<LoginResponse>("/auth/login", payload);
  return res.data;
}

export function verifyOtp(payload: VerifyOtpPayload) {
  return apiFetch<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function resendOtp() {
  return apiFetch<ResendOtpResponse>("/auth/resend-otp", {
    method: "POST",
  });
}

export async function registerClient(
  dto: RegisterDto,
): Promise<RegisterResponse> {
  const res = await fetch(buildApiUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const msg = await readApiError(
      res,
      "Impossible de créer le compte pour le moment.",
    );
    throw new Error(msg);
  }

  return res.json();
}

export async function patchMeProfile(accessToken: string, payload: unknown) {
  const res = await fetch(buildApiUrl("/me/profile"), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await readApiError(
      res,
      "Impossible de mettre à jour le profil pour le moment.",
    );
    throw new Error(msg);
  }

  return res.json();
}

export async function persistAuth(accessToken: string, role: string) {
  await SecureStore.setItemAsync("accessToken", accessToken);
  await SecureStore.setItemAsync("userRole", role);
}

export async function clearAuth() {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("userRole");
}

export async function logout(refreshAuth?: () => Promise<void>) {
  await clearAuth();

  if (refreshAuth) {
    await refreshAuth();
  }

  router.replace("/(auth)/login");
}
