import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";

import type { PortalProfile } from "../types.js";
export type { PortalProfile } from "../types.js";

export function getProfile(user: FirebaseUser): Promise<PortalProfile> {
  return authenticatedRequest<PortalProfile>(profileApi, user, {
    method: "GET",
    // No Cache-Control request header: it is not CORS-safelisted and the
    // Host does not allow it; the Host answers with Cache-Control: no-store.
    url: "/api/v1/users/me",
  });
}
