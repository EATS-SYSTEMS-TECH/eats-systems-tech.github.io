import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { hostApiBaseUrl, profileApiBaseUrl } from "../js/host-api-config.js";

export type FirebaseUser = {
  getIdToken(): Promise<string>;
};

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

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
    if (!axios.isAxiosError(error)) throw error;
    const data = error.response?.data;

    const apiError = new Error(
      data?.error?.message || error.message || "Request failed",
    ) as Error & {
      status?: number;
    };

    apiError.name = "ApiError";
    apiError.status = error.response?.status;
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
