import { Roles, AccessStates, PortalStates, AuthErrors } from "./host-constants.js";
export function parseIdentity(value) {
  const { user, role, access, mfa } = value || {};
  const validUser =
    Boolean(user) &&
    typeof user.uid === "string" &&
    Boolean(user.uid) &&
    typeof user.emailVerified === "boolean";
  const validRole = role === Roles.ADMIN || role === Roles.USER || role === null;
  const validAccess =
    access?.state === AccessStates.ACTIVE ||
    access?.state === AccessStates.PENDING ||
    access?.state === AccessStates.DENIED;
  const validMfa =
    typeof mfa?.required === "boolean" &&
    typeof mfa?.enrolled === "boolean" &&
    typeof mfa?.verified === "boolean";
  const validIdentity = validUser && validRole && validAccess && validMfa;
  if (!validIdentity) {
    throw new Error(AuthErrors.INCOMPLETE_CONTRACT);
  }
  return { user, role, access, mfa };
}
export function portalState(identity) {
  if (identity.access.state !== AccessStates.ACTIVE) {
    return identity.access.state;
  }
  const validEmail =
    typeof identity.user.email === "string" &&
    Boolean(identity.user.email.trim()) &&
    identity.user.emailVerified;
  const validRole = identity.role === Roles.ADMIN || identity.role === Roles.USER;
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
export function canEnroll(identity) {
  if (!identity) {
    return false;
  }
  const state = portalState(identity);
  return state === PortalStates.APPROVED || state === PortalStates.ENROLLMENT;
}
export function canApproveEmail(identity) {
  return (
    identity?.role === Roles.ADMIN &&
    portalState(identity) === PortalStates.APPROVED &&
    identity.mfa.enrolled &&
    identity.mfa.verified
  );
}
