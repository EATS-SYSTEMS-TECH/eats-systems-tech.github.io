import { AuthErrors } from "./host-constants.js";
import {
  initializeSiteAuth,
  signIn,
  completeAuthCallback,
  signInRedirect,
} from "./site-auth.js";
import { isLocalStaging } from "./firebase-config.js";
import { getPlatformProfile } from "./api/index.js";
import {
  parsePlatformIdentity,
  loginDestination,
  loginPath,
} from "./platform-model.js";
import { platformText } from "./platform-copy.js";
import { watchSession } from "./platform-session.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { authErrorMessage } from "./host-auth-errors.js";
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
const language = location.pathname.startsWith("/he/") ? "he" : "en";
const copy = platformText(language);
const requestedPath = new URLSearchParams(location.search).get("next");
document.querySelector(".app-login__language a").href = loginPath(
  requestedPath,
  language === "he" ? "en" : "he",
);
function showProgress(text) {
  progress.hidden = false;
  status.textContent = text;
}
function hideProgress() {
  if (!leaving) {
    progress.hidden = true;
  }
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
  const promise = getPlatformProfile(user).then((value) => {
    const identity = parsePlatformIdentity(value, user.uid);
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
  status.textContent =
    error.status >= 500 || error.code === "HOST_API_UNAVAILABLE"
      ? copy.accessUnavailable
      : authErrorMessage(error, language);
  document.querySelector("#retry-login").hidden = !restoredUser;
  document.querySelector("#redirect-options").hidden =
    error.code !== AuthErrors.POPUP_BLOCKED;
}
async function start() {
  setBusy(true);
  try {
    await completeAuthCallback(requestMfaChallenge);
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
      } else if (!user && !busy) {
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
    if (busy) {
      return;
    }
    providerName = button.dataset.provider;
    setBusy(true);
    showProgress(copy.signingIn);
    document.querySelector("#redirect-options").hidden = true;
    try {
      const credential = await signIn(providerName, requestMfaChallenge);
      restoredUser = credential.user;
      await finishLogin(credential.user);
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  }),
);
document
  .querySelector("#redirect-sign-in")
  .addEventListener("click", async () => {
    setBusy(true);
    showProgress(copy.signingIn);
    try {
      await signInRedirect(providerName);
    } catch (error) {
      report(error);
      setBusy(false);
    }
  });
document.querySelector("#retry-login").addEventListener("click", async () => {
  if (busy || !restoredUser) return;
  setBusy(true);
  try {
    await finishLogin(restoredUser);
  } catch (error) {
    report(error);
  } finally {
    setBusy(false);
  }
});
void start();
