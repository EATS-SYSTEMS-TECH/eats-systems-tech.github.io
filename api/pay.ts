import { authenticatedRequest, apiRequest, profileApi, type FirebaseUser } from "./api.js";

/** Pay is deliberately a preparation workspace: no charge or gate operation. */
export function payRequest<T = Record<string, unknown>>(
  user: FirebaseUser,
  path: string,
  method: "GET" | "POST" | "PATCH" = "GET",
  data?: unknown,
  key?: string,
): Promise<T> {
  const read = method === "GET" && (/^\/api\/v1\/pay\/(?:me|systems)(?:\?[A-Za-z0-9_=&%-]+)?$/.test(path) || /^\/api\/v1\/pay\/systems\/[a-f0-9]{64}$/.test(path));
  const change = method === "PATCH" && /^\/api\/v1\/pay\/systems\/[a-f0-9]{64}\/config$/.test(path);
  const removeOrAssign = method === "POST" && /^\/api\/v1\/pay\/systems\/[a-f0-9]{64}\/(?:remove|organization)$/.test(path);
  if ((!read && !change && !removeOrAssign) || (method === "GET" && data !== undefined)) throw new Error("invalid-request");
  return authenticatedRequest<T>(profileApi, user, {
    url: path, method, ...(data === undefined ? {} : { data }),
    ...(key ? { headers: { "Idempotency-Key": key } } : {}),
  });
}

export function getPayPoint<T = Record<string, unknown>>(id: string): Promise<T> {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("invalid-point");
  return apiRequest<T>(profileApi, { url: `/api/v1/pay/points/${id}`, method: "GET" });
}
