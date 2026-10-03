import { AuthErrors } from "./host-constants.js";
import {
  initializeSiteAuth,
  signIn,
  completeAuthCallback,
  signInRedirect
} from "./site-auth.js";
import { isLocalStaging } from "./firebase-config.js";
import { createProfile } from "./api/index.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { authErrorMessage } from "./host-auth-errors.js";
const status = document.querySelector("#login-status");
const buttons = [...document.querySelectorAll("[data-provider]")];
if (isLocalStaging) {
  document.querySelector("[data-staging]").hidden = false;
}
let busy = true;
let providerName;
let loginAttempt;
let restoredUser;
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
  const promise = createProfile(user).then(
    () => location.replace("/dashboard/")
  );
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
  status.textContent = authErrorMessage(error);
  document.querySelector("#redirect-options").hidden = error.code !== AuthErrors.POPUP_BLOCKED;
}
async function start() {
  setBusy(true);
  try {
    await completeAuthCallback(requestMfaChallenge);
    await initializeSiteAuth((user) => {
      restoredUser = user;
      if (user && !busy) {
        setBusy(true);
        status.textContent = "Preparing your account...";
        void finishLogin(user).catch(report).finally(() => setBusy(false));
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
    document.querySelector("#retry-login").hidden = false;
  }
}
buttons.forEach(
  (button) => button.addEventListener("click", async () => {
    if (busy) {
      return;
    }
    providerName = button.dataset.provider;
    setBusy(true);
    status.textContent = "Signing in...";
    document.querySelector("#redirect-options").hidden = true;
    try {
      const credential = await signIn(providerName, requestMfaChallenge);
      await finishLogin(credential.user);
    } catch (error) {
      report(error);
    } finally {
      setBusy(false);
    }
  })
);
document.querySelector("#redirect-sign-in").addEventListener("click", async () => {
  setBusy(true);
  try {
    await signInRedirect(providerName);
  } catch (error) {
    report(error);
    setBusy(false);
  }
});
document.querySelector("#retry-login").addEventListener("click", () => location.reload());
void start();
