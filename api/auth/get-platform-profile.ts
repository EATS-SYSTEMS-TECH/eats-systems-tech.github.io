import { authenticatedRequest, profileApi, type FirebaseUser } from "../api.js";
import type { ApiError, PlatformProfile } from "../types.js";
import { getProfile } from "./get-profile.js";
import { createProfile } from "./create-profile.js";
import { parseIdentity, portalState } from "../../js/host-dashboard-model.js";

export async function getPlatformProfile(
  user: FirebaseUser,
): Promise<PlatformProfile> {
  try {
    return await authenticatedRequest<PlatformProfile>(profileApi, user, {
      method: "GET",
      url: "/api/v1/platform/me",
    });
  } catch (error) {
    // During a staged backend rollout, only a missing endpoint permits this
    // compatibility read. Authorization failures and outages must stay closed.
    if ((error as ApiError).status !== 404) throw error;
  }

  let profile;
  try {
    profile = await getProfile(user);
  } catch (error) {
    if ((error as ApiError).status !== 404) throw error;
    await createProfile(user);
    profile = await getProfile(user);
  }
  const identity = parseIdentity(profile);
  const state = portalState(identity);
  const allowed = state === "approved";
  const requiresMfa = state === "enrollment" || state === "verification";
  return {
    user: identity.user,
    mfa: { enrolled: identity.mfa.enrolled, verified: identity.mfa.verified },
    products: {
      host: {
        state: requiresMfa
          ? "mfa-required"
          : allowed
            ? "active"
            : state === "pending"
              ? "pending"
              : "blocked",
      },
      pay: { state: "unavailable" },
      manager: { state: "unavailable" },
    },
  };
}
