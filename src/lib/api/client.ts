import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { ACCESS_TOKEN_COOKIE } from "@/lib/auth/cookies";

export type ApiMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiRequestOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: HeadersInit;
  token?: string;
  cache?: RequestCache;
  params?: Record<string, string | number | boolean | undefined>;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function normalizeBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) {
    return "http://localhost:3000/api/v1";
  }

  const normalized = configured.endsWith("/") ? configured.slice(0, -1) : configured;

  if (normalized.endsWith("/api")) {
    return `${normalized}/v1`;
  }

  return normalized;
}

export const API_BASE_URL = normalizeBaseUrl();

function toRecord(headers?: HeadersInit) {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

function extractMessage(payload: unknown, status: number): string {
  if (typeof payload === "string" && payload.trim().length > 0) {
    return payload.trim();
  }

  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.map(String).join(", ");
    }
  }

  return `Request failed with status ${status}`;
}

function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<unknown>;
    const status = axiosError.response?.status ?? 500;
    const payload = axiosError.response?.data ?? null;

    return new ApiError(extractMessage(payload, status), status, payload);
  }

  return new ApiError("Error inesperado", 500, null);
}

async function resolveToken(token?: string) {
  if (token) {
    return token;
  }

  if (typeof window !== "undefined") {
    return undefined;
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

const clientApi = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

let interceptorBound = false;

function ensureClientInterceptors() {
  if (interceptorBound) {
    return;
  }

  clientApi.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
      const normalized = normalizeError(error);

      if (
        typeof window !== "undefined" &&
        (normalized.status === 401 || normalized.status === 403) &&
        !window.location.pathname.startsWith("/login")
      ) {
        window.location.assign("/login");
      }

      return Promise.reject(normalized);
    },
  );

  interceptorBound = true;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers, token, params } = options;
  const resolvedToken = await resolveToken(token);

  const requestConfig: AxiosRequestConfig = {
    baseURL: API_BASE_URL,
    url: path,
    method,
    data: body,
    params,
    headers: {
      Accept: "application/json",
      ...toRecord(headers),
      ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
    },
  };

  try {
    const response = await axios.request<T>(requestConfig);
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function apiRequestFromClient<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers, params } = options;
  ensureClientInterceptors();

  try {
    const response = await clientApi.request<T>({
      url: path,
      method,
      data: body,
      params,
      headers: {
        ...toRecord(headers),
      },
    });

    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}
