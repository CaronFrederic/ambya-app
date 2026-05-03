import axios, { AxiosError, AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { isLikelyNetworkError, setOfflineStatus } from "../offline/store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
  "http://192.168.1.20:3001";

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function getAuthToken(explicitToken?: string | null) {
  if (explicitToken) return explicitToken;
  return SecureStore.getItemAsync("accessToken");
}

async function clearStoredAuth() {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("userRole");
}

export function normalizeApiPath(path: string) {
  const trimmedPath = path.trim();

  if (/^https?:\/\//i.test(trimmedPath)) {
    return trimmedPath;
  }

  const withLeadingSlash = trimmedPath.startsWith("/")
    ? trimmedPath
    : `/${trimmedPath}`;

  if (withLeadingSlash === "/api") {
    return withLeadingSlash;
  }

  return withLeadingSlash.startsWith("/api/")
    ? withLeadingSlash
    : `/api${withLeadingSlash}`;
}

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${normalizeApiPath(path)}`;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  config.headers = config.headers ?? {};
  if (config.url) {
    config.url = normalizeApiPath(config.url);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    setOfflineStatus(false);
    return response;
  },
  async (error) => {
    if (isLikelyNetworkError(error)) {
      setOfflineStatus(true);
    }

    if (error?.response?.status === 401) {
      await clearStoredAuth();
    }

    return Promise.reject(error);
  },
);

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const resolvedToken = await getAuthToken(token);

  try {
    const response = await fetch(buildApiUrl(path), {
      ...rest,
      headers: {
        "Content-Type": "application/json",
        ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
        ...(headers ?? {}),
      },
    });

    setOfflineStatus(false);

    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        await clearStoredAuth();
        throw new Error("SESSION_EXPIRED");
      }

      const message =
        typeof data === "object" && data && "message" in data
          ? Array.isArray((data as { message?: unknown }).message)
            ? (data as { message: unknown[] }).message.map(String).join(", ")
            : String((data as { message?: unknown }).message)
          : `Erreur HTTP ${response.status}`;

      throw new Error(message);
    }

    return data as T;
  } catch (error) {
    if (isLikelyNetworkError(error)) {
      setOfflineStatus(true);
    }

    throw error;
  }
}

export async function apiRequest<T = unknown>(
  config: AxiosRequestConfig & { token?: string | null },
): Promise<T> {
  try {
    const resolvedToken = await getAuthToken(config.token);

    const response = await api.request<T>({
      ...config,
      headers: {
        "Content-Type": "application/json",
        ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
        ...(config.headers ?? {}),
      },
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<{
      message?: string | string[];
    }>;

    if (isLikelyNetworkError(error)) {
      setOfflineStatus(true);
    }

    if (axiosError.response?.status === 401) {
      await clearStoredAuth();
      throw new Error("SESSION_EXPIRED");
    }

    const message = Array.isArray(axiosError.response?.data?.message)
      ? axiosError.response?.data?.message.join(", ")
      : axiosError.response?.data?.message ||
        axiosError.message ||
        "Une erreur est survenue.";

    throw new Error(message);
  }
}
