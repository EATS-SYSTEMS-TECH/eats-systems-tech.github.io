import { initializeSiteAuth, signIn } from "./site-auth.js";
import { isLocalStaging } from "./firebase-config.js";
import { createProfile } from "./api/index.js";

const status = document.querySelector("#login-status");
if (isLocalStaging) document.querySelector("[data-staging]").hidden = false;
let busy = false;
let loginAttempt;

async function finishLogin(user) {
  if (loginAttempt?.uid === user.uid) return loginAttempt.promise;
  const promise = createProfile(user).then(() => location.replace("/dashboard/"));
  loginAttempt = { uid: user.uid, promise };
  try { await promise; }
  catch (error) {
    if (loginAttempt?.promise === promise) loginAttempt = undefined;
    throw error;
  }
}

function report(error) {
  if (error?.message === "site-auth-unconfigured") status.textContent = "חסרה הגדרת Firebase Web לאתר.";
  else if (error?.code === "auth/popup-closed-by-user") status.textContent = "ההתחברות בוטלה.";
  else if (error?.name === "ApiError" || error?.message === "Could not save profile") status.textContent = error.message;
  else status.textContent = "ההתחברות נכשלה. נסו שוב.";
}

initializeSiteAuth((user) => {
  if (user && !busy) {
    busy = true;
    void finishLogin(user).catch(report).finally(() => { busy = false; });
  } else if (!user) status.textContent = "";
}).catch(report);

document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    status.textContent = "מתחבר…";
    try {
      await initializeSiteAuth(() => {});
      const credential = await signIn(button.dataset.provider);
      await finishLogin(credential.user);
    } catch (error) { report(error); }
    finally { busy = false; }
  });
});
