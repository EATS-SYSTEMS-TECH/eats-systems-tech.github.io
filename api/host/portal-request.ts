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


export function portalExport(user: FirebaseUser, path: string) {
  const pathname = path.split("?", 1)[0];
  if (!/^\/api\/v1\/organizations\/[a-zA-Z0-9_-]+\/operations\/(?:usage|timeline)\/export$/.test(pathname) || /[\\\s#]/.test(path)) throw new Error("invalid-request");
  return authenticatedRequest<string>(profileApi, user, { method: "GET", url: path, responseType: "text", headers: { Accept: "text/csv" } });
}
