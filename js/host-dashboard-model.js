import { Roles, AccessStates, PortalStates } from "./host-constants.js";

// The Host dashboard identity, from GET /api/v1/platform/me alone. Access
// decisions never read GET /api/v1/users/me: that route stays a backend
// contract (getProfile in the API client) and has no dashboard parser.
//   role:    the Host plan role, or null for an organization member.
//   hasPlan: whether My systems exists for this person.
//   access:  active (the workspace), pending (only the join-organization
//            view) or denied (back to the product picker).
export function hostIdentity(platform) {
  const host = platform.products.host;
  const role =
    host.role === Roles.ADMIN || host.role === Roles.USER ? host.role : null;
  return {
    user: platform.user,
    role,
    hasPlan: role !== null,
    access: {
      state:
        host.state === "active"
          ? AccessStates.ACTIVE
          : host.state === "pending"
            ? AccessStates.PENDING
            : AccessStates.DENIED,
    },
    mfa: {
      required: role === Roles.ADMIN,
      enrolled: platform.mfa.enrolled,
      verified: platform.mfa.verified,
    },
  };
}

// Where the dashboard goes for this identity. An organization member without a
// plan (role null) is approved like a plan holder; only a missing or
// unverified email, or an unfinished required authenticator, keeps them out.
export function portalState(identity) {
  if (identity.access.state !== AccessStates.ACTIVE) {
    return identity.access.state;
  }
  const validEmail =
    typeof identity.user.email === "string" &&
    Boolean(identity.user.email.trim()) &&
    identity.user.emailVerified;
  const validRole =
    identity.role === Roles.ADMIN ||
    identity.role === Roles.USER ||
    identity.role === null;
  if (!validEmail || !validRole) {
    return PortalStates.DENIED;
  }
  const requiresMfa = identity.role === Roles.ADMIN || identity.mfa.required;
  if (requiresMfa && !identity.mfa.enrolled) {
    return PortalStates.ENROLLMENT;
  }
  if (requiresMfa && !identity.mfa.verified) {
    return PortalStates.VERIFICATION;
  }
  return PortalStates.APPROVED;
}

// Whether two reads of the same session would show a different dashboard.
export function sameHostAccess(before, after) {
  return (
    before.user.uid === after.user.uid &&
    before.role === after.role &&
    before.access.state === after.access.state &&
    before.mfa.required === after.mfa.required &&
    before.mfa.enrolled === after.mfa.enrolled &&
    before.mfa.verified === after.mfa.verified
  );
}
