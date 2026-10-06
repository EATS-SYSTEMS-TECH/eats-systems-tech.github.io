import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";
import type { PlatformProfile } from "../types.js";

export function getPlatformProfile(
  user: FirebaseUser,
): Promise<PlatformProfile> {
  return authenticatedRequest<PlatformProfile>(profileApi, user, {
    method: "GET",
    url: "/api/v1/platform/me",
  });
}
