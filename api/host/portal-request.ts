import { authenticatedRequest, profileApi, type FirebaseUser, type JsonObject } from "../api.js";

export function portalRequest(user: FirebaseUser, path: string, method = "GET", data?: JsonObject, idempotencyKey?: string) {
  if (!/^\/api\/v1\/organizations(?:\/|\?|$)/.test(path) || path.includes("..")) throw new Error("invalid-request");
  return authenticatedRequest<JsonObject>(profileApi, user, {
    method, url: path,
    ...(data === undefined ? {} : { data }),
    headers: { ...(data === undefined ? {} : { "Content-Type": "application/json" }), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
  });
}
