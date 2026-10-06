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

type RequestScope = { organizationId: string; generation?: string };
const localRejectionCodes = new Set([
  "RECENT_REAUTH_REQUIRED",
  "RECENT_AUTH_REQUIRED",
  "RECENT_TOTP_REQUIRED",
  "SUPPORT_ACCESS_DENIED",
  "SELF_ACCESS_PROTECTED",
  "SCOPE_DENIED",
  "TARGET_TYPE_DENIED",
  "DEVICE_IDENTITY_UNVERIFIED",
  "INVALID_GATE_PROOF",
  "GATE_PROOF_EXPIRED",
  "INVALID_FACTORY_IDENTITY",
  "HOST_IDENTITY_MISMATCH",
]);

function requestScope(url?: string): RequestScope | undefined {
  const match = /^\/api\/v1\/organizations\/([^/?#]+)/.exec(url ?? "");
  if (!match || typeof document === "undefined") return undefined;
  const workspace = document.querySelector<HTMLElement>("#host-management");
  return {
    organizationId: match[1],
    generation: workspace?.dataset.requestGeneration,
  };
}

export async function apiRequest<T>(
  client: AxiosInstance,
  config: AxiosRequestConfig,
  scope = requestScope(config.url),
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
    const sessionExpired = apiError.status === 401;
    const productDenied =
      apiError.status === 403 &&
      config.url !== "/api/v1/platform/me" &&
      !localRejectionCodes.has(apiError.code ?? "");
    if (typeof window !== "undefined" && (sessionExpired || productDenied)) {
      window.dispatchEvent(
        new CustomEvent("platform:access-error", {
          detail: { status: apiError.status, code: apiError.code, scope },
        }),
      );
    }
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
  const scope = requestScope(config.url);
  const token = await user.getIdToken();
  return apiRequest<T>(
    client,
    {
      ...config,
      headers: { ...config.headers, Authorization: `Bearer ${token}` },
    },
    scope,
  );
}
