import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";
import { profileApiBaseUrl } from "../js/host-api-config.js";
import { siteIntegrityHeaders } from "../js/site-app-check.js";

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

export const profileApi = createClient(profileApiBaseUrl);

type RequestScope = { organizationId: string; generation?: string };
// 403 codes that refuse one action and leave the session and the product
// open. HOST_PLAN_REQUIRED refuses only the My systems area: an organization
// member without a Host plan keeps the rest of Host. SUBSCRIPTION_UNAVAILABLE
// refuses a change in one organization whose service is paused; the person
// keeps Host and every other organization. INVITER_ACCESS_DENIED refuses one
// request to join (its owner is no longer active). OWNER_REQUIRED refuses an
// API key change to an admin, and SLO_OWNER_UNAVAILABLE a responsible member
// who cannot own the service targets; the admin keeps the organization.
const localRejectionCodes = new Set([
  "HOST_PLAN_REQUIRED",
  "SUBSCRIPTION_UNAVAILABLE",
  "INVITER_ACCESS_DENIED",
  "OWNER_REQUIRED",
  "SLO_OWNER_UNAVAILABLE",
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
  "MANAGER_ACCESS_DENIED",
  "APP_CHECK_REQUIRED",
  "TOTP_REQUIRED",
]);

// On the signed-in person's own routes (My systems), an organization named in
// the request that no longer lets them link, or an authenticator to verify
// first, refuses only that action.
const personalRejectionCodes = new Set(["TENANT_ACCESS_DENIED", "TOTP_REQUIRED"]);
const personalPath = /^\/api\/v1\/me\//;
// Joining an organization: every refusal of one request to join stays in the
// join view, which says why. Only a Host ban (PORTAL_ACCESS_DENIED) ends it.
const joinPath = /^\/api\/v1\/auth\/invitations\/[^/?#]+\/accept$/;

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
    // Structured facts about a refusal, such as details.count of the
    // upcoming bookings that keep a system in its organization.
    const details = data?.error?.details;
    if (details && typeof details === "object" && !Array.isArray(details))
      apiError.details = details;
    const sessionExpired = apiError.status === 401;
    const productDenied =
      apiError.status === 403 &&
      !config.url?.startsWith("/api/v1/platform/") &&
      !localRejectionCodes.has(apiError.code ?? "") &&
      !(
        personalPath.test(config.url ?? "") &&
        personalRejectionCodes.has(apiError.code ?? "")
      ) &&
      !(
        joinPath.test(config.url ?? "") &&
        apiError.code !== "PORTAL_ACCESS_DENIED"
      );
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
  const integrity = await siteIntegrityHeaders();
  return apiRequest<T>(
    client,
    {
      ...config,
      headers: { ...config.headers, ...integrity, Authorization: `Bearer ${token}` },
    },
    scope,
  );
}
