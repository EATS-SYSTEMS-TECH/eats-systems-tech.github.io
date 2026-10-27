import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";
import type { AccountDeletionPreview, AccountDeletionResult } from "../types.js";

export function previewPlatformAccountDeletion(user: FirebaseUser, email: string) {
  return authenticatedRequest<AccountDeletionPreview & { targetUid: string | null }>(profileApi, user, {
    method: "POST", url: "/api/v1/platform/directory/account/deletion", data: { email },
  });
}

export function deletePlatformAccount(user: FirebaseUser, input: {email: string; confirmEmail: string; targetUid: string | null}, key: string) {
  return authenticatedRequest<AccountDeletionResult>(profileApi, user, {
    method: "POST", url: "/api/v1/platform/directory/account/delete", data: input,
    headers: { "Idempotency-Key": key },
  });
}
