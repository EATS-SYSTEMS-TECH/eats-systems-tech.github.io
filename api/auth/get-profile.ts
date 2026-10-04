import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";

import type { PortalProfile } from "../types.js";
export type { PortalProfile } from "../types.js";

export function getProfile(user: FirebaseUser): Promise<PortalProfile> {
  return authenticatedRequest<PortalProfile>(profileApi, user, {
    method: "GET",
    url: "/api/v1/users/me",
    headers: { "Cache-Control": "no-store" },
  });
}
