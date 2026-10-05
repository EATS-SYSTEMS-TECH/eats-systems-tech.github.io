import { authenticatedRequest, profileApi, type FirebaseUser, type JsonObject } from "../api.js";

export function portalRequest(user: FirebaseUser, path: string, method = "GET", data?: JsonObject, idempotencyKey?: string) {
  const pathname = path.split("?", 1)[0];
  if (!/^\/api\/v1\/organizations(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(pathname)
    || /[\\\s#]/.test(path)) throw new Error("invalid-request");
  return authenticatedRequest<JsonObject>(profileApi, user, {
    method, url: path,
    ...(data === undefined ? {} : { data }),
    headers: { ...(data === undefined ? {} : { "Content-Type": "application/json" }), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) },
  });
}
