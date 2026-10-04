import {
  authenticatedRequest,
  profileApi,
  type FirebaseUser,
  type JsonObject,
} from "../api.js";

export function approveEmail(
  user: FirebaseUser,
  email: string,
  idempotencyKey: string,
) {
  return authenticatedRequest<JsonObject>(profileApi, user, {
    method: "POST",
    url: "/api/v1/admin/portal-access",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    data: { email: email.trim().toLowerCase() },
  });
}
