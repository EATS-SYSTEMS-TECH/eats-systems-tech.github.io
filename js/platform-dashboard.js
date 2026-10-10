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
const languageMenu = $("#platform-language");
if (languageMenu) {
  languageMenu.value = language;
  languageMenu.setAttribute("aria-label", copy.interfaceLanguage);
  languageMenu.addEventListener("change", () => {
    const url = new URL(location.href);
    if (languageMenu.value === "he") url.searchParams.set("lang", "he");
    else url.searchParams.delete("lang");
    location.assign(url.href);
  });
}
if (language === "he") $(".platform-header .brand").href = "/he/";
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
  updateSecurityStep(
    enrollmentSecret ? "pair" : identity.mfa.enrolled ? "continue" : "identity",
  );
}

function updateSecurityStep(step) {
  $("#platform-security").dataset.step = step;
  for (const item of document.querySelectorAll("[data-security-step]")) {
    if (item.dataset.securityStep === step)
      item.setAttribute("aria-current", "step");
    else item.removeAttribute("aria-current");
  }
}

function setActionBusy(busy) {
  actionBusy = busy;
  $("#platform-security").setAttribute("aria-busy", String(busy));
  for (const button of document.querySelectorAll(
    "#start-enrollment, #verify-session, #product-grid .platform-button",
  ))
    button.disabled = busy;
}

function productIcon(id) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shape.setAttribute(
    "d",
    {
      host: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M8 14h3m-3 4h6",
      pay: "M3 8h18M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M7 15h4",
      manager: "M14 7a5 5 0 1 1-5 5L3 18v3h3v-3h3l3-3M17 6h.01",
    }[id],
  );
  icon.append(shape);
  const frame = document.createElement("div");
  frame.className = "product-icon";
  frame.append(icon);
  return frame;
}

function renderProducts() {
  const tiles = productIds.map((id) => {
    const state = identity.products[id].state;
    const tile = document.createElement("article");
    tile.className = "product-tile";
    tile.dataset.product = id;
    tile.dataset.state = state;
    const icon = productIcon(id);
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
    const guidance = document.createElement("p");
    guidance.className = "product-guidance";
    guidance.textContent =
      state === "mfa-required"
        ? identity.mfa.enrolled
          ? copy.verifyDetail
          : copy.setupDetail
        : ({
            active: copy.readyDetail,
            "no-plan": copy.planDetail,
            pending: copy.pendingDetail,
            blocked: copy.blockedDetail,
            unavailable: copy.unavailableDetail,
          }[state] ?? "");
    if (state === "active") actions.append(link(copy.open, productLink(id)));
    if (state === "no-plan") {
      const informationUrl =
        id === "host" ? "/automation/" : `/contact-us/?product=${id}`;
      const prefix = language === "he" ? "/he" : "";
      actions.append(
        link(copy.learn, prefix + informationUrl, true),
        link(copy.contact, prefix + "/contact-us/", true),
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
          void securityAction(identity.mfa.enrolled ? "verify" : "enroll");
        }),
      );
    }
    tile.append(icon, title, description, status, guidance, actions);
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
  if (enrollmentSecret) {
    $("#enrollment-form input").focus();
    return;
  }
  const user = currentUser;
  const requestGeneration = generation;
  setActionBusy(true);
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
      updateSecurityStep("pair");
      $("#enrollment-status").textContent = copy.setupCode;
      $("#enrollment-form input").focus();
    }
  } catch (error) {
    if (requestGeneration === generation)
      $("#enrollment-status").textContent = authErrorMessage(error, language);
    return;
  } finally {
    setActionBusy(false);
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
