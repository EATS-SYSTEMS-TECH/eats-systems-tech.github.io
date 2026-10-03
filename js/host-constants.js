export const Roles = Object.freeze({ ADMIN: "admin", USER: "user" });
export const AccessStates = Object.freeze({ ACTIVE: "active", PENDING: "pending", DENIED: "denied" });
export const PortalStates = Object.freeze({ ...AccessStates, APPROVED: "approved", ENROLLMENT: "enrollment", VERIFICATION: "verification" });
export const AuthProviders = Object.freeze({ GOOGLE: "google", APPLE: "apple", GOOGLE_ID: "google.com", APPLE_ID: "apple.com", TOTP: "totp" });
export const AuthErrors = Object.freeze({
  UNCONFIGURED: "site-auth-unconfigured",
  INVALID_PROVIDER: "site-auth-invalid-provider",
  INCOMPLETE_CONTRACT: "portal-contract-incomplete",
  MFA_REQUIRED: "auth/multi-factor-auth-required",
  UNVERIFIED_EMAIL: "auth/unverified-email",
  POPUP_BLOCKED: "auth/popup-blocked",
  POPUP_CANCELLED: "auth/popup-closed-by-user",
  INVALID_CODE: "auth/invalid-verification-code",
  MISSING_CODE: "auth/missing-verification-code",
  RECENT_LOGIN_REQUIRED: "auth/requires-recent-login",
  OPERATION_NOT_ALLOWED: "auth/operation-not-allowed",
  INVALID_MFA_SESSION: "auth/invalid-multi-factor-session",
  USER_MISMATCH: "auth/user-mismatch",
  NETWORK_FAILED: "auth/network-request-failed",
  MFA_CANCELLED: "mfa-cancelled",
  MFA_UNSUPPORTED: "mfa-unsupported",
  ACCESS_PENDING: "PORTAL_ACCESS_PENDING"
});
export const HttpStatus = Object.freeze({ UNAUTHORIZED: 401, FORBIDDEN: 403 });
