import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { api, apiFetch } from "./client";

const API_URL = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

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
  if (!API_URL) throw new Error("Missing EXPO_PUBLIC_API_URL");

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `Register failed (${res.status})`);
  }

  return res.json();
}

export async function patchMeProfile(accessToken: string, payload: unknown) {
  if (!API_URL) throw new Error("Missing EXPO_PUBLIC_API_URL");

  const res = await fetch(`${API_URL}/me/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || `PATCH /me/profile failed (${res.status})`);
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