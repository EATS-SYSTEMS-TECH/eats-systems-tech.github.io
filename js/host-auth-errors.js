import { AuthErrors, HttpStatus } from "./host-constants.js";
export function authErrorMessage(
  error,
  language = globalThis.document?.documentElement.lang,
) {
  if (language === "he") {
    const messages = {
      "auth/popup-closed-by-user": "ההתחברות בוטלה.",
      "auth/popup-blocked": "הדפדפן חסם את חלון ההתחברות.",
      "auth/invalid-verification-code": "הקוד שגוי או שפג תוקפו.",
      "auth/missing-verification-code": "יש להזין את הקוד מאפליקציית האימות.",
      "auth/requires-recent-login":
        "יש להתחבר שוב לפני הגדרת אפליקציית האימות.",
      "auth/operation-not-allowed": "הגדרת אפליקציית האימות עדיין אינה זמינה.",
      "auth/invalid-multi-factor-session": "פג תוקף ההגדרה. יש להתחיל מחדש.",
      "auth/network-request-failed": "לא ניתן להתחבר. יש לבדוק את החיבור לרשת.",
      "mfa-cancelled": "אימות החשבון בוטל.",
      "portal-contract-incomplete":
        "לא ניתן לבדוק את הגישה כרגע. נא לנסות שוב.",
      HOST_API_UNAVAILABLE: "לא ניתן להתחבר לשרת WIFIGATE. נא לנסות שוב.",
      RECENT_REAUTH_REQUIRED: "יש להתחבר שוב כדי להשלים פעולה זו.",
      RECENT_AUTH_REQUIRED: "יש להתחבר שוב כדי להשלים פעולה זו.",
      RECENT_TOTP_REQUIRED: "יש להתחבר שוב ולאמת את החשבון באפליקציית האימות.",
    };
    if (messages[error?.code || error?.message])
      return messages[error.code || error.message];
    if (error?.status === 401) return "פג תוקף ההתחברות. יש להתחבר שוב.";
    if (error?.status === 403)
      return "הגישה אינה מורשית. יש לפנות למנהל המערכת.";
    return "משהו השתבש. נא לנסות שוב.";
  }
  const messages = {
    RECENT_REAUTH_REQUIRED: "Sign in again to complete this sensitive action.",
    RECENT_AUTH_REQUIRED: "Sign in again to complete this sensitive action.",
    RECENT_TOTP_REQUIRED:
      "Sign in again and verify your authenticator to complete this action.",
    HOST_API_UNAVAILABLE:
      "Cannot reach the WIFIGATE Host server. Please try again later or contact support.",
    SELF_ACCESS_PROTECTED: "You cannot change your own portal access.",
    LAST_ADMIN_PROTECTED: "The last active administrator must remain active.",
    IDEMPOTENCY_CONFLICT:
      "This request has already been used for a different change. Review the action and retry.",
    [AuthErrors.UNCONFIGURED]:
      "Firebase configuration is missing. Contact support.",
    [AuthErrors.INCOMPLETE_CONTRACT]:
      "Portal access could not be verified. Try again later.",
    [AuthErrors.POPUP_CANCELLED]: "Sign-in was cancelled.",
    [AuthErrors.POPUP_BLOCKED]: "Your browser blocked the sign-in window.",
    [AuthErrors.INVALID_CODE]: "That code is incorrect or expired.",
    [AuthErrors.MISSING_CODE]: "Enter the code from your authenticator app.",
    [AuthErrors.RECENT_LOGIN_REQUIRED]:
      "Sign in again before setting up your authenticator.",
    [AuthErrors.UNVERIFIED_EMAIL]:
      "Use the verified email approved by your admin.",
    [AuthErrors.OPERATION_NOT_ALLOWED]:
      "Authenticator setup is not available yet.",
    [AuthErrors.INVALID_MFA_SESSION]:
      "Authenticator setup expired. Start setup again.",
    [AuthErrors.USER_MISMATCH]: "Use the account you are signed in with.",
    [AuthErrors.NETWORK_FAILED]: "Unable to connect. Check your connection.",
    [AuthErrors.MFA_CANCELLED]: "Authenticator verification was cancelled.",
    [AuthErrors.MFA_UNSUPPORTED]: "No supported authenticator on this account.",
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
