import { portalRequest } from "./api/index.js";
import { reauthenticate } from "./site-auth.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";

const recentIdentityErrors = new Set([
  "RECENT_REAUTH_REQUIRED",
  "RECENT_AUTH_REQUIRED",
  "RECENT_TOTP_REQUIRED",
]);
let activeActions = 0;
export const recentIdentityActionInProgress = () => activeActions > 0;

export async function requestWithRecentIdentity({
  user,
  path,
  body,
  intent,
  isCurrent,
  onVerifying,
}) {
  const assertCurrent = () => {
    if (!isCurrent())
      throw new DOMException("The Host workspace changed", "AbortError");
  };
  assertCurrent();
  activeActions++;
  try {
    try {
      return await portalRequest(user, path, "POST", body, intent);
    } catch (error) {
      if (!recentIdentityErrors.has(error?.code)) throw error;
      assertCurrent();
      onVerifying();
      await reauthenticate(user, requestMfaChallenge);
      assertCurrent();
      await user.getIdToken(true);
      assertCurrent();
      return await portalRequest(user, path, "POST", body, intent);
    }
  } finally {
    activeActions--;
  }
}
