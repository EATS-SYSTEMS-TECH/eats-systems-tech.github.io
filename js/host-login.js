import { initializeSiteAuth, signIn } from "./site-auth.js";
import { isLocalStaging } from "./firebase-config.js";

const status = document.querySelector("#login-status");
if (isLocalStaging) document.querySelector("[data-staging]").hidden = false;
let busy = false;

function report(error) {
  if (error?.message === "site-auth-unconfigured") status.textContent = "חסרה הגדרת Firebase Web לאתר.";
  else if (error?.code === "auth/popup-closed-by-user") status.textContent = "ההתחברות בוטלה.";
  else status.textContent = "ההתחברות נכשלה. נסו שוב.";
}

initializeSiteAuth((user) => {
  if (user) location.replace("/dashboard/");
  else status.textContent = "";
}).catch(report);

document.querySelectorAll("[data-provider]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (busy) return;
    busy = true;
    status.textContent = "מתחבר…";
    try {
      await initializeSiteAuth(() => {});
      await signIn(button.dataset.provider);
      location.replace("/dashboard/");
    } catch (error) { report(error); }
    finally { busy = false; }
  });
});
