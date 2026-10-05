import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { hostApiBaseUrl, profileApiBaseUrl } from "../js/host-api-config.js";

import type { FirebaseUser, ApiErrorResponse, ApiError } from "./types.js";
export type { FirebaseUser, JsonValue, JsonObject } from "./types.js";

function createClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    timeout: 15_000,
    withCredentials: false,
    headers: { Accept: "application/json" },
  });
}

export const hostApi = createClient(hostApiBaseUrl);
export const profileApi = createClient(profileApiBaseUrl);

export async function apiRequest<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
): Promise<T> {
  try {
    const response = await client.request<T>(config);
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError<ApiErrorResponse>(error)) {
      throw error;
    }
    const data = error.response?.data;

    const apiError = new Error(
      data?.error?.message || error.message || "Request failed",
    ) as ApiError;

    apiError.name = "ApiError";
    apiError.status = error.response?.status;
    apiError.code = error.response
      ? data?.error?.code || data?.code
      : ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"].includes(error.code ?? "")
        ? "HOST_API_UNAVAILABLE"
        : undefined;
    throw apiError;
  }
}

export async function authenticatedRequest<T>(
  client: AxiosInstance,
  user: FirebaseUser,
  config: AxiosRequestConfig,
): Promise<T> {
  if (!user || typeof user.getIdToken !== "function") {
    throw new Error("invalid-request");
  }
  const token = await user.getIdToken();
  return apiRequest<T>(client, {
    ...config,
    headers: { ...config.headers, Authorization: `Bearer ${token}` },
  });
}
