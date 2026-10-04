import { AuthErrors, HttpStatus } from "./host-constants.js";
export function authErrorMessage(error) {
  const messages = {
    [AuthErrors.UNCONFIGURED]: "Firebase configuration is missing. Contact support.",
    [AuthErrors.INCOMPLETE_CONTRACT]: "Portal access could not be verified. Try again later.",
    [AuthErrors.POPUP_CANCELLED]: "Sign-in was cancelled.",
    [AuthErrors.POPUP_BLOCKED]: "Your browser blocked the sign-in window.",
    [AuthErrors.INVALID_CODE]: "That code is incorrect or expired.",
    [AuthErrors.MISSING_CODE]: "Enter the code from your authenticator app.",
    [AuthErrors.RECENT_LOGIN_REQUIRED]: "Sign in again before setting up your authenticator.",
    [AuthErrors.UNVERIFIED_EMAIL]: "Use the verified email approved by your admin.",
    [AuthErrors.OPERATION_NOT_ALLOWED]: "Authenticator setup is not available yet.",
    [AuthErrors.INVALID_MFA_SESSION]: "Authenticator setup expired. Start setup again.",
    [AuthErrors.USER_MISMATCH]: "Use the account you are signed in with.",
    [AuthErrors.NETWORK_FAILED]: "Unable to connect. Check your connection.",
    [AuthErrors.MFA_CANCELLED]: "Authenticator verification was cancelled.",
    [AuthErrors.MFA_UNSUPPORTED]: "No supported authenticator on this account."
  };
  if (messages[error?.code || error?.message]) {
    return messages[error.code || error.message];
  }
  if (error?.status === HttpStatus.UNAUTHORIZED) {
    return "Your session expired. Sign in again.";
  }
  if (error?.status === HttpStatus.FORBIDDEN) {
    return "Access was not permitted. Contact your admin.";
  }
  return "Something went wrong. Please try again.";
}
