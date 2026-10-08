import { AuthProviders, AuthErrors } from "./host-constants.js";
import { resolveTotp } from "./site-auth.js";
import { authErrorMessage } from "./host-auth-errors.js";
// The sign-in page passes its own wording in `text`; the dashboards use the
// English/Hebrew defaults.
export function requestMfaChallenge(resolver, text = {}) {
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
  status.textContent = "";
  code.value = "";
  dialog.showModal();
  code.focus();
  return new Promise((resolve, reject) => {
    let verifying = false;
    function clean() {
      form.removeEventListener("submit", verify);
      dialog.removeEventListener("cancel", cancel);
      dialog.querySelector("[data-cancel]").removeEventListener("click", cancel);
      dialog.close();
      code.value = "";
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
      verifying = true;
      submit.disabled = true;
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
        status.textContent = (text.errorMessage ?? authErrorMessage)(error);
        code.value = "";
        code.focus();
      } finally {
        verifying = false;
        submit.disabled = false;
      }
    }
    form.addEventListener("submit", verify);
    dialog.addEventListener("cancel", cancel);
    dialog.querySelector("[data-cancel]").addEventListener("click", cancel);
  });
}
