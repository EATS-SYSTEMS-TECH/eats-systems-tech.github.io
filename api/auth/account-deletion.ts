import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";
import type { AccountDeletionPreview, AccountDeletionResult } from "../types.js";

// What deleting the signed-in account cancels and closes. Read-only.
export function getAccountDeletion(user: FirebaseUser) {
  return authenticatedRequest<AccountDeletionPreview>(profileApi, user, {
    method: "GET",
    url: "/api/v1/platform/account/deletion",
  });
}

// Deletes the signed-in account. The server needs a sign-in within five
// minutes (and the authenticator when one is enrolled); a retry after
// re-authentication reuses the same idempotency key.
export function deleteAccount(
  user: FirebaseUser,
  confirmEmail: string,
  idempotencyKey: string,
) {
  return authenticatedRequest<AccountDeletionResult>(profileApi, user, {
    method: "POST",
    url: "/api/v1/platform/account/delete",
    data: { confirmEmail },
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
  });
}
