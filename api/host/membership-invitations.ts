import { authenticatedRequest, profileApi, type FirebaseUser, type JsonObject } from "../api.js";
const validId = (value: string) => /^[A-Za-z0-9_-]{1,100}$/.test(value);
export function pendingMembershipInvitations(user: FirebaseUser, { cursor, limit = 50 }: { cursor?: string; limit?: number } = {}) {
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100 || (cursor !== undefined && !validId(cursor))) throw new Error("invalid-request");
  return authenticatedRequest<JsonObject>(profileApi, user, { method: "GET", url: `/api/v1/auth/invitations?${new URLSearchParams({ limit: String(limit), ...(cursor ? { cursor } : {}) })}` });
}
export function acceptMembershipInvitation(user: FirebaseUser, id: string, version: number, key: string) {
  if (!validId(id) || !Number.isSafeInteger(version) || version < 1 || !/^[A-Za-z0-9_-]{16,128}$/.test(key)) throw new Error("invalid-request");
  return authenticatedRequest<JsonObject>(profileApi, user, { method: "POST", url: `/api/v1/auth/invitations/${id}/accept`, data: { version }, headers: { "Content-Type": "application/json", "Idempotency-Key": key } });
}
