import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";
import type { PlatformProfile } from "../types.js";

// The one access read for every dashboard: product states, the Host plan role
// and the authenticator state. Failures stay closed; there is no other
// endpoint to fall back to.
export function getPlatformProfile(
  user: FirebaseUser,
): Promise<PlatformProfile> {
  return authenticatedRequest<PlatformProfile>(profileApi, user, {
    method: "GET",
    url: "/api/v1/platform/me",
  });
}
