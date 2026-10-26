import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";
import type { PlatformProfile } from "../types.js";

export type LoginAttempts = {
  failed: number;
  limit: 5;
  resetAt: string | null;
  lockedUntil: string | null;
};

export function portalLogin(user: FirebaseUser): Promise<{ identity: PlatformProfile; attempts: LoginAttempts }> {
  return authenticatedRequest(profileApi, user, { method: "POST", url: "/api/v1/platform/login" });
}
