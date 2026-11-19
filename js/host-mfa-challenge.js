import { AuthProviders, AuthErrors } from "./host-constants.js";
import { resolveTotp } from "./site-auth.js?v=20261119remember1";
import { authErrorMessage } from "./host-auth-errors.js?v=20261119ux28";
// The sign-in page passes its own wording in `text`; the dashboards use the
// English/Hebrew defaults.
export function requestMfaChallenge(resolver, text = {}, { timeoutMs = 120000 } = {}) {
  const dialog = document.querySelector("#mfa-challenge");
  const form = dialog.querySelector("form");
  const factors = resolver.hints.filter((factor) => factor.factorId === AuthProviders.TOTP);
  if (!factors.length) {
    throw new Error(AuthErrors.MFA_UNSUPPORTED);
  }
  const select = form.elements.namedItem("factor");
  select.replaceChildren(
    ...factors.map((factor, index) => {
      const option = document.createElement("option");
      option.value = factor.uid;
      option.textContent =
        factor.displayName ||
        (text.authenticatorN ?? "Authenticator {n}").replace("{n}", index + 1);
      return option;
    })
  );
  const code = form.elements.namedItem("code");
  const status = dialog.querySelector("[role=status]");
  const submit = form.querySelector("button[type=submit]");
  const submitLabel = submit.textContent;
  const he = document.documentElement.lang === "he";
  const restartLabel = text.restart ?? (he ? "התחלת אימות חדש" : "Start new verification");
  const inputWindow = Math.max(1000, Math.min(120000, Number(timeoutMs) || 120000));
  const startedAt = Date.now(), monotonicStart = performance.now();
  let timerElement = dialog.querySelector(".mfa-challenge-countdown");
  if (!timerElement) {
    timerElement = document.createElement("p");
    timerElement.className = "mfa-challenge-countdown";
    timerElement.setAttribute("role", "timer");
    timerElement.setAttribute("aria-live", "off");
    status.before(timerElement);
  }
  const timerValue = document.createElement("bdi");
  timerValue.dir = "ltr";
  timerElement.replaceChildren(document.createTextNode(he ? "זמן להזנת הקוד: " : "Enter the code within: "), timerValue);
  code.disabled = false;
  status.textContent = "";
  delete status.dataset.tone;
  delete status.dataset.errorCode;
  code.value = "";
  dialog.showModal();
  code.focus();
  return new Promise((resolve, reject) => {
    let verifying = false, expired = false;
    const expiredCodes = new Set(["auth/totp-challenge-timeout", "auth/code-expired", "auth/session-expired", "auth/invalid-multi-factor-session"]);
    const remaining = () => Math.max(0, inputWindow - Math.max(0, Date.now()-startedAt, performance.now()-monotonicStart));
    function expire() {
      expired = true;
      code.value = "";
      code.disabled = true;
      submit.textContent = restartLabel;
      timerValue.textContent = "00:00";
      status.dataset.tone = "error";
      status.textContent = verifying
        ? (he ? "ממתינים לתוצאת האימות שנשלח…" : "Waiting for the submitted verification result…")
        : (he ? "פג תוקף ניסיון האימות. התחילו אימות חדש כדי לקבל זמן חדש להזנת הקוד." : "This verification attempt expired. Start a new verification to enter the code with a fresh time window.");
    }
    function tick() {
      if (expired) return;
      const seconds = Math.ceil(remaining()/1000);
      timerValue.textContent = String(Math.floor(seconds/60)).padStart(2,"0") + ":" + String(seconds%60).padStart(2,"0");
      if (!seconds) expire();
    }
    tick();
    const countdown = setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    // A pasted "123 456" or "123-456" becomes the six digits the field expects.
    function digitsOnly() {
      const digits = code.value.replace(/\D/g, "").slice(0, 6);
      if (digits !== code.value) code.value = digits;
    }
    function pasteCode(event) {
      const value = event.clipboardData?.getData("text");
      if (!value) return;
      // Normalize before the browser's maxlength can truncate a spaced code.
      event.preventDefault();
      code.value = value.replace(/\D/g, "").slice(0, 6);
      code.dispatchEvent(new Event("input", { bubbles: true }));
    }
    function clean() {
      clearInterval(countdown);
      document.removeEventListener("visibilitychange", tick);
      form.removeEventListener("submit", verify);
      code.removeEventListener("input", digitsOnly);
      code.removeEventListener("paste", pasteCode);
      dialog.removeEventListener("cancel", cancel);
      dialog.querySelector("[data-cancel]").removeEventListener("click", cancel);
      dialog.close();
      code.value = "";
      code.disabled = false;
      submit.textContent = submitLabel;
      submit.disabled = false;
    }
    function cancel(event) {
      event.preventDefault();
      if (verifying) {
        return;
      }
      clean();
      reject(new Error(AuthErrors.MFA_CANCELLED));
    }
    async function verify(event) {
      event.preventDefault();
      if (verifying) {
        return;
      }
      if (expired) {
        clean();
        reject(Object.assign(new Error("mfa-restart-required"), {code:"mfa-restart-required"}));
        return;
      }
      if (!remaining()) { expire(); return; }
      verifying = true;
      submit.disabled = true;
      status.dataset.tone = "info";
      status.textContent =
        text.verifying ??
        (document.documentElement.lang === "he" ? "מאמתים..." : "Verifying...");
      try {
        const result = await resolveTotp(
          resolver,
          select.value,
          code.value.trim()
        );
        clean();
        resolve(result);
      } catch (error) {
        // Diagnostics contain enum/type only, never the entered OTP, resolver or token.
        const diagnostic = /^auth\/[a-z-]{1,70}$/.test(error?.code || "") ? error.code :
          ["TypeError","ReferenceError","RangeError"].includes(error?.name) ? error.name : "MFA_ERROR";
        console.warn("WIFIGATE MFA verification refused",diagnostic);
        status.dataset.errorCode=diagnostic;
        status.dataset.tone = "error";
        code.value = "";
        if (expired || expiredCodes.has(error?.code)) {
          verifying = false;
          expire();
        } else {
          status.textContent = (text.errorMessage ?? authErrorMessage)(error);
          code.focus();
        }
      } finally {
        verifying = false;
        submit.disabled = false;
      }
    }
    form.addEventListener("submit", verify);
    code.addEventListener("input", digitsOnly);
    code.addEventListener("paste", pasteCode);
    dialog.addEventListener("cancel", cancel);
    dialog.querySelector("[data-cancel]").addEventListener("click", cancel);
  });
}
