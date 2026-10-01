import { authenticatedRequest, hostApi, type FirebaseUser, type JsonObject } from "../api.js";

export function hostGet(
  user: FirebaseUser,
  path: string,
  { signal }: { signal?: AbortSignal } = {},
) {
  if (!/^\/v1\/[a-z0-9/\-]+$/.test(path)) throw new Error("invalid-request");
  return authenticatedRequest<JsonObject>(hostApi, user, {
    method: "GET",
    url: path,
    signal,
    headers: { "Cache-Control": "no-store" },
  });
}
