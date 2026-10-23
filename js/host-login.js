import { AuthErrors, HttpStatus } from "./host-constants.js";
import {
  initializeSiteAuth,
  signIn,
  signOut,
  completeAuthCallback,
  signInRedirect,
} from "./site-auth.js?v=20261022day1";
import { isLocalStaging } from "./firebase-config.js";
import { getPlatformProfile } from "./api/index.js?v=20261022ac1";
import {
  parsePlatformIdentity,
  loginDestination,
  loginPath,
  signInRefusal,
  signInRefusals,
} from "./platform-model.js";
import { watchSession } from "./platform-session.js?v=20261022day1";
import { requestMfaChallenge } from "./host-mfa-challenge.js?v=20261024mfa1";
import { requestHumanCheck } from "./login-gate-game.js";
const status = document.querySelector("#login-status");
const progress = document.querySelector("#login-progress");
const buttons = [...document.querySelectorAll("[data-provider]")];
if (isLocalStaging) {
  document.querySelector("[data-staging]").hidden = false;
}
let busy = true;
let providerName;
let loginAttempt;
let restoredUser;
let leaving = false;
let session;
let humanChecked = false;
let humanCheckOpen = false;
// Set while the page shows why an account was refused, so a sign-out does not
// clear the message.
let refused = false;
// Each sign-in page is built in one language (scripts/login-pages.mjs) and
// carries its runtime wording in #login-copy.
const language = document.documentElement.lang;
const copy = JSON.parse(document.querySelector("#login-copy").textContent);
const query = new URLSearchParams(location.search);
const requestedPath = query.get("next");
const SUPPORT_EMAIL = "support@wifigate.io";
const ERROR_COPY = {
  // Sign-in refusals (platform-model.js signInRefusal); a dashboard that
  // refuses a session sends the reason back as ?reason=.
  "no-account": "errorNoAccount",
  "unverified-email": "errorUnverifiedEmail",
  [AuthErrors.POPUP_CANCELLED]: "errorCancelled",
  [AuthErrors.POPUP_BLOCKED]: "errorPopupBlocked",
  [AuthErrors.INVALID_CODE]: "errorInvalidCode",
  "auth/invalid-multi-factor-session": "errorSessionExpired",
  "auth/session-expired": "errorSessionExpired",
  [AuthErrors.MISSING_CODE]: "errorMissingCode",
  [AuthErrors.NETWORK_FAILED]: "errorNetwork",
  [AuthErrors.MFA_CANCELLED]: "errorMfaCancelled",
  [AuthErrors.MFA_UNSUPPORTED]: "errorMfaUnsupported",
  [AuthErrors.UNVERIFIED_EMAIL]: "errorUnverifiedEmail",
  [AuthErrors.UNCONFIGURED]: "errorUnconfigured",
  [AuthErrors.INCOMPLETE_CONTRACT]: "accessUnavailable",
  HOST_API_UNAVAILABLE: "errorServer",
};
function errorMessage(error) {
  const key = ERROR_COPY[error?.code || error?.message];
  if (key) return copy[key];
  if (error?.status === HttpStatus.UNAUTHORIZED) return copy.errorSessionExpired;
  if (error?.status === HttpStatus.FORBIDDEN) return copy.errorForbidden;
  return copy.errorGeneric;
}
const mfaChallenge = (resolver) =>
  requestMfaChallenge(resolver, {
    authenticatorN: copy.authenticatorN,
    verifying: copy.verifying,
    errorMessage,
  });
setupLanguagePicker();
function setupLanguagePicker() {
  const button = document.querySelector(".app-login__language");
  const picker = document.querySelector("#language-picker");
  // A language keeps the deep-link return path; the URL alone sets it.
  picker.querySelectorAll("a[hreflang]").forEach((option) => {
    option.href = loginPath(requestedPath, option.hreflang);
  });
  button.addEventListener("click", () => {
    picker.showModal();
    picker.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "center" });
  });
  picker.querySelector("[data-close]").addEventListener("click", () => picker.close());
  // The dialog box itself has no padding: a click on the dialog element is a
  // click on the backdrop.
  picker.addEventListener("click", (event) => {
    if (event.target === picker) picker.close();
  });
}
function showProgress(text) {
  progress.hidden = false;
  status.textContent = text;
}
function hideProgress() {
  if (!leaving) {
    progress.hidden = true;
  }
}
// The no-account message carries {email}: the support address as a mail link.
function showMessage(text) {
  const [before, after] = text.split("{email}");
  if (after === undefined) {
    status.textContent = text;
    return;
  }
  const link = document.createElement("a");
  link.href = `mailto:${SUPPORT_EMAIL}`;
  link.dir = "ltr";
  link.textContent = SUPPORT_EMAIL;
  status.replaceChildren(before, link, after);
}
if (signInRefusals.includes(query.get("reason"))) {
  refused = true;
  showMessage(copy[ERROR_COPY[query.get("reason")]]);
}
function setBusy(value) {
  busy = value;
  buttons.forEach((button) => {
    button.disabled = value;
  });
}
async function finishLogin(user) {
  if (loginAttempt?.uid === user.uid) {
    return loginAttempt.promise;
  }
  showProgress(copy.checking);
  const promise = getPlatformProfile(user).then(async (value) => {
    const identity = parsePlatformIdentity(value, user.uid);
    const refusal = signInRefusal(identity);
    if (refusal) {
      // No WIFIGATE product is open to this account: it does not stay signed
      // in, and the page says why.
      refused = true;
      await signOut();
      throw Object.assign(new Error(refusal), { code: refusal });
    }
    leaving = true;
    showProgress(copy.opening);
    location.replace(loginDestination(identity, requestedPath, language));
  });
  loginAttempt = { uid: user.uid, promise };
  try {
    await promise;
  } catch (error) {
    if (loginAttempt?.promise === promise) {
      loginAttempt = undefined;
    }
    throw error;
  }
}
function report(error) {
  hideProgress();
  showMessage(
    error.status >= 500 || error.code === "HOST_API_UNAVAILABLE"
      ? copy.accessUnavailable
      : errorMessage(error),
  );
}
async function start() {
  setBusy(true);
  try {
    await completeAuthCallback(mfaChallenge);
    await initializeSiteAuth((user) => {
      restoredUser = user;
      if (user && !session) {
        session = watchSession({
          clear: () => {
            leaving = true;
            restoredUser = undefined;
            loginAttempt = undefined;
          },
        });
      }
      if (!user) {
        const ended = session?.ended;
        session?.stop();
        session = undefined;
        loginAttempt = undefined;
        if (ended) return;
      }
      if (user && !busy) {
        setBusy(true);
        void finishLogin(user)
          .catch(report)
          .finally(() => setBusy(false));
      } else if (!user && !busy && !refused) {
        status.textContent = "";
      }
    });
    setBusy(false);
    if (restoredUser && !loginAttempt) {
      setBusy(true);
      await finishLogin(restoredUser);
      setBusy(false);
    }
  } catch (error) {
    report(error);
    setBusy(false);
  }
}
buttons.forEach((button) =>
  button.addEventListener("click", async () => {
    if (busy || humanCheckOpen) {
      return;
    }
    if (!humanChecked) {
      humanCheckOpen = true;
      try {
        humanChecked = await requestHumanCheck(copy);
      } finally {
        humanCheckOpen = false;
      }
      if (humanChecked) {
        status.textContent = copy.humanReady;
        button.classList.add("app-login__provider--ready");
        button.focus();
      }
      return;
    }
    buttons.forEach((item) =>
      item.classList.remove("app-login__provider--ready"),
    );
    providerName = button.dataset.provider;
    refused = false;
    setBusy(true);
    showProgress(copy.signingIn);
    try {
      // The page has only the two provider buttons: a signed-in user whose
      // access check failed retries it, and a blocked window moves to the
      // full-page flow on its own.
      if (restoredUser) {
        await finishLogin(restoredUser);
      } else {
        const credential = await signIn(providerName, mfaChallenge);
        restoredUser = credential.user;
        await finishLogin(credential.user);
      }
    } catch (error) {
      if (error.code === AuthErrors.POPUP_BLOCKED) {
        try {
          await signInRedirect(providerName);
          return;
        } catch (redirectError) {
          report(redirectError);
        }
      } else {
        report(error);
      }
    } finally {
      setBusy(false);
    }
  }),
);
void start();
