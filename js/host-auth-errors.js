import { AuthErrors, HttpStatus } from "./host-constants.js";
export function authErrorMessage(error) {
  const messages = {
    [AuthErrors.UNCONFIGURED]: "Firebase configuration is missing. Contact support.",
    [AuthErrors.INCOMPLETE_CONTRACT]: "Portal access could not be verified. Contact support or try again later.",
    [AuthErrors.POPUP_CANCELLED]: "Sign-in was cancelled. Try again when you are ready.",
    [AuthErrors.POPUP_BLOCKED]: "Your browser blocked the sign-in window. Allow popups or use the redirect option.",
    [AuthErrors.INVALID_CODE]: "That code is incorrect or expired. Enter a new authenticator code.",
    [AuthErrors.MISSING_CODE]: "Enter the code from your authenticator app.",
    [AuthErrors.RECENT_LOGIN_REQUIRED]: "Sign in again before setting up your authenticator.",
    [AuthErrors.UNVERIFIED_EMAIL]: "A verified email is required. Use the email approved by your admin.",
    [AuthErrors.OPERATION_NOT_ALLOWED]: "Authenticator setup is not available yet. Contact support.",
    [AuthErrors.INVALID_MFA_SESSION]: "Authenticator setup expired. Start setup again.",
    [AuthErrors.USER_MISMATCH]: "Use the provider account you are currently signed in with.",
    [AuthErrors.NETWORK_FAILED]: "Unable to connect. Check your connection and try again.",
    [AuthErrors.MFA_CANCELLED]: "Authenticator verification was cancelled.",
    [AuthErrors.MFA_UNSUPPORTED]: "This account has no supported authenticator factor. Contact support."
  };
  if (messages[error?.code || error?.message]) {
    return messages[error.code || error.message];
  }
  if (error?.status === HttpStatus.UNAUTHORIZED) {
    return "Your session expired. Sign out and sign in again.";
  }
  if (error?.status === HttpStatus.FORBIDDEN) {
    return "The server did not permit this action. Refresh your access or contact an admin.";
  }
  return "Unable to complete the request. Please try again.";
}
