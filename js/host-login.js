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
    if (busy || humanCheckOpen) {
      return;
    }
    if (!humanChecked) {
      humanCheckOpen = true;
      try {
        humanChecked = await requestHumanCheck(language);
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
    setBusy(true);
    showProgress(copy.signingIn);
    try {
      // The page has only the two provider buttons: a signed-in user whose
      // access check failed retries it, and a blocked window moves to the
      // full-page flow on its own.
      if (restoredUser) {
        await finishLogin(restoredUser);
      } else {
        const credential = await signIn(providerName, requestMfaChallenge);
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
