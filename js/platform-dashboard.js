import { getPlatformProfile } from "./api/index.js";
import {
  initializeSiteAuth,
  reauthenticate,
  beginTotpEnrollment,
  finishTotpEnrollment,
} from "./site-auth.js";
import {
  parsePlatformIdentity,
  productIds,
  pageLanguage,
  loginPath,
} from "./platform-model.js";
import { platformText } from "./platform-copy.js";
import { watchSession } from "./platform-session.js";
import { renderProductSwitcher } from "./product-switcher.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { authErrorMessage } from "./host-auth-errors.js";
import qrcode from "./vendor/qrcode-generator.js";

const $ = (selector) => document.querySelector(selector);
const language = pageLanguage();
const copy = platformText(language);
const selectedProduct = document.body.dataset.product;
let currentUser;
let identity;
let session;
let generation = 0;
let enrollmentSecret;
let actionBusy = false;

document.documentElement.lang = language;
document.documentElement.dir = language === "he" ? "rtl" : "ltr";
document.title = `${copy.title} | WIFIGATE`;
$("#product-grid").setAttribute("aria-label", copy.products);
for (const node of document.querySelectorAll("[data-copy]"))
  node.textContent = copy[node.dataset.copy];
if (language === "he") {
  const translations = {
    scan: "סרקו את קוד ה־QR באפליקציית האימות, או הזינו את מפתח ההגדרה ידנית.",
    key: "מפתח הגדרה",
    code: "קוד אימות",
    finish: "אימות וסיום ההגדרה",
    cancel: "ביטול",
    recovery: "איבדתם את אמצעי האימות? פנו למנהל הפלטפורמה לאימות זהות ושחזור.",
    title: "אימות באמצעות אפליקציית האימות",
    factor: "אפליקציית אימות",
    verify: "אימות",
  };
  for (const node of document.querySelectorAll("[data-mfa-copy]"))
    node.textContent = translations[node.dataset.mfaCopy];
}

function clearSecret() {
  enrollmentSecret = undefined;
  $("#totp-secret").value = "";
  $("#totp-qr").removeAttribute("src");
  $("#enrollment-form").reset();
  $("#totp-setup").hidden = true;
}

function clearPrivate() {
  ++generation;
  identity = undefined;
  clearSecret();
  $("#product-grid").replaceChildren();
  $("#product-grid").hidden = true;
  $("#product-workspace").hidden = true;
  $("#product-switcher").replaceChildren();
  $("#platform-security").hidden = true;
  $("#platform-account").textContent = "";
}

function productLink(id) {
  return `/dashboard/${id}/${language === "he" ? "?lang=he" : ""}`;
}

function actionButton(label, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "platform-button";
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

function link(label, href, secondary = false) {
  const anchor = document.createElement("a");
  anchor.textContent = label;
  anchor.href = href;
  if (secondary) anchor.className = "secondary";
  return anchor;
}

function showSecurity() {
  if (!identity) return;
  $("#platform-security").hidden = false;
  const required = productIds.some(
    (id) => identity.products[id].state === "mfa-required",
  );
  $("#security-description").textContent = required
    ? copy.requiredSecurity
    : copy.optionalSecurity;
  $("#start-enrollment").hidden = identity.mfa.enrolled;
  $("#verify-session").hidden = !identity.mfa.enrolled || identity.mfa.verified;
}

function renderProducts() {
  const tiles = productIds.map((id) => {
    const state = identity.products[id].state;
    const tile = document.createElement("article");
    tile.className = "product-tile";
    tile.dataset.product = id;
    tile.dataset.state = state;
    const title = document.createElement("h2");
    title.textContent = `WIFIGATE ${id[0].toUpperCase() + id.slice(1)}`;
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = copy[id];
    const status = document.createElement("span");
    status.className = "product-state";
    status.textContent = copy[state];
    const actions = document.createElement("div");
    actions.className = "product-actions";
    if (state === "active") actions.append(link(copy.open, productLink(id)));
    if (state === "no-plan") {
      const informationUrl =
        id === "host" ? "/automation/" : `/contact-us/?product=${id}`;
      actions.append(
        link(copy.learn, informationUrl, true),
        link(copy.contact, "/contact-us/", true),
      );
    }
    if (state === "unavailable")
      actions.append(actionButton(copy.retry, () => void refresh()));
    if (state === "mfa-required") {
      actions.append(
        actionButton(identity.mfa.enrolled ? copy.verify : copy.enroll, () => {
          showSecurity();
          $("#platform-security").scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          $(
            identity.mfa.enrolled ? "#verify-session" : "#start-enrollment",
          ).focus();
        }),
      );
    }
    tile.append(title, description, status, actions);
    return tile;
  });
  $("#product-grid").replaceChildren(...tiles);
  $("#product-grid").hidden = false;
  $("#platform-retry").hidden = false;
  $("#platform-retry").textContent = copy.refresh;
  if (
    identity.user.emailVerified &&
    (!identity.mfa.enrolled ||
      productIds.some((id) => identity.products[id].state === "mfa-required"))
  )
    showSecurity();
}

async function refresh() {
  if (!currentUser || actionBusy || enrollmentSecret) return;
  clearPrivate();
  const requestGeneration = generation;
  const user = currentUser;
  $("#platform-status").textContent = copy.checking;
  $("#platform-retry").hidden = true;
  try {
    const result = await getPlatformProfile(user);
    if (requestGeneration !== generation) return;
    identity = parsePlatformIdentity(result, user.uid);
    $("#platform-account").textContent =
      identity.user.displayName || identity.user.email || "WIFIGATE";
    $("#platform-status").textContent = identity.user.emailVerified
      ? ""
      : copy.unverified;
    if (selectedProduct) {
      if (identity.products[selectedProduct]?.state !== "active") {
        location.replace(
          language === "he" ? "/dashboard/?lang=he" : "/dashboard/",
        );
        return;
      }
      $("#product-title").textContent =
        `WIFIGATE ${selectedProduct[0].toUpperCase() + selectedProduct.slice(1)}`;
      $("#platform-title").textContent = $("#product-title").textContent;
      renderProductSwitcher(
        $("#product-switcher"),
        identity,
        selectedProduct,
        language,
      );
      $("#product-workspace").hidden = false;
    } else renderProducts();
  } catch (error) {
    if (requestGeneration !== generation) return;
    $("#platform-status").textContent =
      error.status === 401
        ? authErrorMessage(error, language)
        : copy.accessUnavailable;
    $("#platform-retry").hidden = false;
    $("#platform-retry").textContent = copy.retry;
  }
}

async function securityAction(action) {
  if (actionBusy || !currentUser || !identity) return;
  const user = currentUser;
  const requestGeneration = generation;
  actionBusy = true;
  $("#start-enrollment").disabled = true;
  $("#verify-session").disabled = true;
  $("#enrollment-status").textContent = copy.confirm;
  try {
    await reauthenticate(user, requestMfaChallenge);
    await user.getIdToken(true);
    if (requestGeneration !== generation) return;
    const fresh = parsePlatformIdentity(
      await getPlatformProfile(user),
      user.uid,
    );
    if (requestGeneration !== generation) return;
    identity = fresh;
    if (
      action === "enroll" &&
      fresh.user.emailVerified &&
      !fresh.mfa.enrolled
    ) {
      const secret = await beginTotpEnrollment(user);
      if (requestGeneration !== generation) return;
      enrollmentSecret = secret;
      const qr = qrcode(0, "M");
      qr.addData(secret.generateQrCodeUrl(user.email, "WIFIGATE"));
      qr.make();
      $("#totp-qr").src = qr.createDataURL(5, 20);
      $("#totp-secret").value = secret.secretKey;
      $("#totp-setup").hidden = false;
      $("#start-enrollment").hidden = true;
      $("#enrollment-status").textContent = copy.setupCode;
      $("#enrollment-form input").focus();
    }
  } catch (error) {
    if (requestGeneration === generation)
      $("#enrollment-status").textContent = authErrorMessage(error, language);
    return;
  } finally {
    actionBusy = false;
    $("#start-enrollment").disabled = false;
    $("#verify-session").disabled = false;
  }
  if (!enrollmentSecret) await refresh();
}

$("#start-enrollment").addEventListener(
  "click",
  () => void securityAction("enroll"),
);
$("#verify-session").addEventListener(
  "click",
  () => void securityAction("verify"),
);
$("#cancel-enrollment").addEventListener("click", () => {
  if (actionBusy) return;
  clearSecret();
  void refresh();
});
$("#enrollment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (actionBusy || !enrollmentSecret) return;
  const requestGeneration = generation;
  const button = event.currentTarget.querySelector("button");
  const code = event.currentTarget.elements.namedItem("code").value.trim();
  actionBusy = true;
  button.disabled = true;
  $("#enrollment-status").textContent = copy.verifySetup;
  let completed = false;
  try {
    await finishTotpEnrollment(currentUser, enrollmentSecret, code);
    completed = true;
    clearSecret();
  } catch (error) {
    if (requestGeneration === generation)
      $("#enrollment-status").textContent = authErrorMessage(error, language);
  } finally {
    actionBusy = false;
    button.disabled = false;
  }
  if (completed && requestGeneration === generation) {
    await refresh();
    $("#enrollment-status").textContent = copy.setupDone;
  }
});
$("#platform-retry").addEventListener("click", () => void refresh());
$("#platform-sign-out").addEventListener(
  "click",
  () => void session?.endSession(),
);
window.addEventListener("platform:refresh", () => void refresh());
window.addEventListener("focus", () => void refresh());
window.addEventListener("pagehide", clearPrivate);
window.addEventListener("pageshow", (event) => {
  if (event.persisted) void refresh();
});

initializeSiteAuth((user) => {
  if (!user) {
    currentUser = undefined;
    clearPrivate();
    session?.stop();
    if (session?.ended) return;
    location.replace(
      loginPath(location.pathname + location.search + location.hash, language),
    );
    return;
  }
  currentUser = user;
  session?.stop();
  session = watchSession({ clear: clearPrivate });
  $("#platform-sign-out").disabled = false;
  void refresh();
}).catch((error) => {
  $("#platform-status").textContent = authErrorMessage(error, language);
});
