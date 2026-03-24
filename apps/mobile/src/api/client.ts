import axios, { AxiosError, AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ||
  "http://192.168.1.20:3000";

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function getAuthToken(explicitToken?: string | null) {
  if (explicitToken) return explicitToken;
  return SecureStore.getItemAsync("accessToken");
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

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const resolvedToken = await getAuthToken(token);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
      ...(headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? Array.isArray((data as { message?: unknown }).message)
          ? (data as { message: unknown[] }).message.map(String).join(", ")
          : String((data as { message?: unknown }).message)
        : "Une erreur est survenue.";

    throw new Error(message);
  }

  return data as T;
}

export async function apiRequest<T = unknown>(
  config: AxiosRequestConfig & { token?: string | null }
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

    const message = Array.isArray(axiosError.response?.data?.message)
      ? axiosError.response?.data?.message.join(", ")
      : axiosError.response?.data?.message || "Une erreur est survenue.";

    throw new Error(message);
  }
}