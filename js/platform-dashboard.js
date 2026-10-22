import {
  getPlatformProfile,
  getAccountDeletion,
  deleteAccount,
} from "./api/index.js";
import {
  initializeSiteAuth,
  reauthenticate,
  beginTotpEnrollment,
  finishTotpEnrollment,
  signOut,
} from "./site-auth.js";
import {
  parsePlatformIdentity,
  productIds,
  pageLanguage,
  loginPath,
  signInRefusal,
  canOpenProduct,
} from "./platform-model.js";
import { platformText } from "./platform-copy.js";
import { watchSession } from "./platform-session.js";
import {
  renderProductSwitcher,
  productIconPaths,
  productLink,
} from "./product-switcher.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { authErrorMessage } from "./host-auth-errors.js";
import qrcode from "./vendor/qrcode-generator.js";
import { createManagerDashboard } from "./manager-dashboard.js";
import { createManagerProfile } from "./manager-profile.js";
import { renderPlatformLanguage } from "./platform-language.js";

const $ = (selector) => document.querySelector(selector);
const language = pageLanguage();
const copy = platformText(language);
const selectedProduct = document.body.dataset.product;
const managerProfile = createManagerProfile({
  root: $("#manager-profile"),
  language,
  product: selectedProduct,
});
let currentUser;
let managerDashboard;
let identity;
let session;
let generation = 0;
let enrollmentSecret;
let actionBusy = false;
let accountDeleted = false;
let deletionKey;

document.documentElement.lang = language;
document.documentElement.dir = language === "he" ? "rtl" : "ltr";
document.title = `${copy.title} | WIFIGATE`;
$("#product-grid").setAttribute("aria-label", copy.products);
for (const node of document.querySelectorAll("[data-copy]"))
  node.textContent = copy[node.dataset.copy];
// Labels a screen reader speaks (and image text) follow the language too.
for (const node of document.querySelectorAll("[data-copy-label]"))
  node.setAttribute("aria-label", copy[node.dataset.copyLabel]);
for (const node of document.querySelectorAll("[data-copy-alt]"))
  node.setAttribute("alt", copy[node.dataset.copyAlt]);
for (const node of document.querySelectorAll("[data-profile-en]"))
  node.textContent =
    language === "he" ? node.dataset.profileHe : node.dataset.profileEn;
if (!selectedProduct) {
  const title = language === "he" ? "הפרופיל שלי" : "My profile";
  $("#platform-title").textContent = title;
  document.title = `${title} | WIFIGATE`;
  $(".platform-eyebrow").textContent = "MY WIFIGATE";
  $("[data-copy=intro]").textContent =
    language === "he"
      ? "פרטים אישיים, אבטחה, מנויים ותשלומים — במקום אחד."
      : "Your personal details, security, subscriptions and payments in one place.";
}
renderPlatformLanguage(
  $("#platform-language"),
  language,
  copy.interfaceLanguage,
);
const dashboardHome = selectedProduct
  ? productLink(selectedProduct, language)
  : language === "he"
    ? "/dashboard/?lang=he"
    : "/dashboard/";
$(".platform-header .brand").href = dashboardHome;
$(".platform-header .brand").setAttribute(
  "aria-label",
  language === "he" ? "דף הבית של הדשבורד" : "Dashboard home",
);
if (language === "he") {
  const home = $("#account-deleted-home");
  if (home) home.href = "/he/";
}
if (language === "he") {
  const translations = {
    scan: "סרקו את קוד ה־QR באפליקציית האימות, או הזינו את מפתח ההגדרה ידנית.",
    key: "מפתח הגדרה",
    code: "קוד אימות",
    finish: "אימות וסיום ההגדרה",
    cancel: "ביטול",
    recovery: "איבדתם את אמצעי האימות? פנו למנהל הפלטפורמה לאימות זהות ושחזור.",
    title: "אימות באמצעות אפליקציית האימות",
    description: "הזינו את הקוד העדכני מאפליקציית המאמת כדי להמשיך בבטחה.",
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
  managerProfile?.clear();
  managerDashboard?.close();
  managerDashboard = undefined;
  ++generation;
  identity = undefined;
  clearSecret();
  setActionBusy(false);
  $("#enrollment-status").textContent = "";
  $("#product-grid").replaceChildren();
  $("#product-grid").hidden = true;
  $("#product-workspace").hidden = true;
  $("#product-switcher").replaceChildren();
  $("#platform-security").hidden = true;
  $("#platform-account").textContent = "";
  const avatar = $("#platform-avatar");
  if (avatar) avatar.textContent = "";
  const panel = $("#platform-account-panel");
  if (panel) panel.hidden = true;
  const management = $(".profile-account-management");
  if (management) management.hidden = true;
  $("#profile-details")?.replaceChildren();
  if ($("#profile-subscriptions")) $("#profile-subscriptions").hidden = true;
  $("#profile-subscription-total")?.replaceChildren();
  for (const selector of ["#account-name", "#account-email", "#account-avatar"])
    $(selector)?.replaceChildren();
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
    "#start-enrollment, #verify-session, #product-grid .platform-button, #enrollment-form button, #cancel-enrollment",
  ))
    button.disabled = busy;
}

function productIcon(id) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shape.setAttribute("d", productIconPaths[id]);
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
    // The product name keeps its Latin order inside Hebrew; the heading
    // itself aligns with the rest of the tile.
    const title = document.createElement("h2");
    const name = document.createElement("bdi");
    name.dir = "ltr";
    name.textContent = `WIFIGATE ${id[0].toUpperCase() + id.slice(1)}`;
    title.append(name);
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = copy[id];
    // Host opens while an invitation is pending: the join-organization view
    // is where it is accepted.
    const invited = ["host", "manager"].includes(id) && state === "pending";
    const status = document.createElement("span");
    status.className = "product-state";
    status.textContent = invited ? copy[`${id}Pending`] : copy[state];
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
            pending: invited ? copy[`${id}PendingDetail`] : copy.pendingDetail,
            blocked: copy.blockedDetail,
            unavailable: copy.unavailableDetail,
          }[state] ?? "");
    if (canOpenProduct(identity, id))
      actions.append(link(copy.open, productLink(id, language)));
    if (state === "no-plan") {
      const informationUrl =
        id === "host" ? "/automation/" : `/contact-us/?product=${id}`;
      const prefix = language === "he" ? "/he" : "";
      actions.append(
        link(copy.learn, prefix + informationUrl, true),
        link(copy.contact, "https://wifigate.io/#get-in-touch", true),
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
    const role = document.createElement("p");
    role.className = "profile-product-role";
    const accessRole = identity.products[id].role;
    if (accessRole) {
      role.textContent = `${productName(id)} ${accessRole === "organization-admin" ? "organization admin" : accessRole}`;
      role.dir = "ltr";
    }
    tile.append(icon, title, description, status, role, guidance, actions);
    return tile;
  });
  $("#product-grid").replaceChildren(...tiles);
  $("#product-grid").hidden = false;
  renderSubscriptionPreview();
  if ($("#profile-subscriptions")) $("#profile-subscriptions").hidden = false;
  $("#platform-retry").hidden = false;
  $("#platform-retry").textContent = copy.refresh;
  if (
    identity.user.emailVerified &&
    (!identity.mfa.enrolled ||
      productIds.some((id) => identity.products[id].state === "mfa-required"))
  )
    showSecurity();
  const panel = $("#platform-account-panel");
  if (panel) panel.hidden = false;
  const management = $(".profile-account-management");
  if (management) management.hidden = false;
}

async function refresh() {
  if (!currentUser || actionBusy || enrollmentSecret || deletion?.open) return;
  clearPrivate();
  const requestGeneration = generation;
  const user = currentUser;
  $("#platform-status").textContent = copy.checking;
  $("#platform-retry").hidden = true;
  try {
    const result = await getPlatformProfile(user);
    if (requestGeneration !== generation) return;
    identity = parsePlatformIdentity(result, user.uid);
    const refusal = signInRefusal(identity);
    if (refusal) {
      void session?.endSession(refusal);
      return;
    }
    showIdentity();
    $("#platform-status").textContent = identity.user.emailVerified
      ? ""
      : copy.unverified;
    renderProductSwitcher(
      $("#product-switcher"),
      identity,
      selectedProduct || "",
      language,
    );
    if (selectedProduct) {
      if (!canOpenProduct(identity, selectedProduct)) {
        location.replace(
          language === "he" ? "/dashboard/?lang=he" : "/dashboard/",
        );
        return;
      }
      $("#product-title").textContent =
        `WIFIGATE ${selectedProduct[0].toUpperCase() + selectedProduct.slice(1)}`;
      $("#platform-title").textContent = $("#product-title").textContent;
      $("#product-workspace").hidden = false;
      if (selectedProduct === "manager") {
        managerDashboard = createManagerDashboard({
          root: $("#manager-root"),
          user,
          language,
          onProfile: (profile) => managerProfile?.update(profile, user),
          ensureRecent: async () => {
            const token = await user.getIdTokenResult();
            if (Date.now() / 1000 - Number(token.claims.auth_time ?? 0) > 240) {
              await reauthenticate(user, requestMfaChallenge);
              await user.getIdToken(true);
            }
          },
        });
      }
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
    if (requestGeneration === generation) setActionBusy(false);
  }
  if (!enrollmentSecret) await refresh();
}

function initial(text) {
  return (Array.from(text.trim())[0] || "W").toLocaleUpperCase(language);
}

function showIdentity() {
  const product = identity.products[selectedProduct];
  managerProfile?.update(
    { role: product?.role, roles: product?.roles },
    identity.user,
  );
  const name = identity.user.displayName || identity.user.email || "WIFIGATE";
  $("#platform-account").textContent = name;
  const avatar = $("#platform-avatar");
  if (avatar) avatar.textContent = initial(name);
  if (!$("#platform-account-panel")) return;
  $("#account-avatar").textContent = initial(name);
  $("#account-name").textContent = name;
  $("#account-email").textContent = identity.user.email || "";
  renderProfileDetails();
}

function renderProfileDetails() {
  const details = $("#profile-details");
  if (!details) return;
  details.replaceChildren();
  const accountDate = (value) => {
    const timestamp = typeof value === "string" ? Date.parse(value) : NaN;
    return Number.isFinite(timestamp)
      ? new Intl.DateTimeFormat(language === "he" ? "he-IL" : "en-GB", {
          dateStyle: "long",
        }).format(timestamp)
      : language === "he"
        ? "לא זמין כרגע"
        : "Not available";
  };
  for (const [label, value] of [
    [
      language === "he" ? "כתובת אימייל" : "Email address",
      identity.user.email || "—",
    ],
    [
      language === "he" ? "אימות אימייל" : "Email verification",
      identity.user.emailVerified
        ? language === "he"
          ? "מאומת"
          : "Verified"
        : language === "he"
          ? "ממתין לאימות"
          : "Not verified",
    ],
    [
      language === "he" ? "תאריך הצטרפות" : "Joined on",
      accountDate(currentUser?.metadata?.creationTime),
    ],
    [
      language === "he" ? "התחברות אחרונה" : "Last sign-in",
      accountDate(currentUser?.metadata?.lastSignInTime),
    ],
    [
      language === "he" ? "אפליקציית אימות" : "Authenticator",
      identity.mfa.enrolled
        ? language === "he"
          ? "מוגדרת"
          : "Set up"
        : language === "he"
          ? "טרם הוגדרה"
          : "Not set up",
    ],
    [
      language === "he"
        ? "אימות ההתחברות הנוכחית"
        : "Current sign-in verification",
      identity.mfa.verified
        ? language === "he"
          ? "אומת באפליקציית האימות"
          : "Verified with authenticator"
        : language === "he"
          ? "טרם אומת באפליקציית האימות"
          : "Not verified with authenticator",
    ],
  ]) {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    description.dir = "auto";
    row.append(term, description);
    details.append(row);
  }
}

function renderSubscriptionPreview() {
  if (!$("#profile-subscriptions")) return;
  const zero = new Intl.NumberFormat(language === "he" ? "he-IL" : "en-GB", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(0);
  // Explicit preview data: product access is not evidence of a paid subscription.
  for (const id of productIds) {
    const card = $(`#product-grid [data-product="${id}"]`);
    if (!card) continue;
    card.dataset.subscription = id;
    const list = document.createElement("dl");
    list.className = "profile-product-billing";
    for (const [label, value, key] of [
      [
        language === "he" ? "מנוי" : "Subscription",
        language === "he" ? "כבוי" : "Inactive",
        "status",
      ],
      [language === "he" ? "תשלום חודשי" : "Monthly payment", zero, "monthly"],
    ]) {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      term.textContent = label;
      const description = document.createElement("dd");
      description.textContent = value;
      description.dir = "auto";
      description.dataset.subscriptionValue = key;
      row.append(term, description);
      list.append(row);
    }
    card.insertBefore(list, card.querySelector(".product-guidance"));
  }
  $("#profile-subscription-total").textContent = zero;
}

// Account deletion: a preview of what is cancelled and closed, the account
// email typed as confirmation, and a recent sign-in (plus the authenticator
// when one is enrolled) on the server. One idempotency key per attempt, so a
// retry after re-authentication or an incomplete deletion reuses it.
const deletion = $("#account-delete");
const productName = (id) => `WIFIGATE ${id[0].toUpperCase() + id.slice(1)}`;

function deletionStatus(text, tone) {
  const status = deletion.querySelector("[role=status]");
  status.textContent = text;
  if (tone) status.dataset.tone = tone;
  else delete status.dataset.tone;
}

function deletionList(title, items) {
  const block = document.createElement("div");
  block.className = "account-delete__group";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const list = document.createElement("ul");
  list.append(
    ...items.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }),
  );
  block.append(heading, list);
  return block;
}

// "1 system" or "{n} systems": how many My systems a deletion removes.
const systemCount = (count) =>
  count === 1
    ? copy.deleteMySystemsOne
    : copy.deleteMySystemsMany.replace("{n}", count);
const countOf = (value) =>
  Number.isSafeInteger(value) && value > 0 ? value : 0;

function deletionMessage(error) {
  return (
    {
      PLATFORM_ADMIN_DELETION_FORBIDDEN: copy.deleteAdmin,
      ACCOUNT_DELETION_REVIEW_REQUIRED: copy.deleteReview,
      ACCOUNT_DELETION_INCOMPLETE: copy.deleteIncomplete,
      CONFIRMATION_REQUIRED: copy.deleteConfirmMismatch,
    }[error?.code] ??
    (error?.code?.startsWith?.("auth/")
      ? authErrorMessage(error, language)
      : copy.deleteFailed)
  );
}

function setDeletionBusy(busy) {
  setActionBusy(busy);
  for (const control of deletion.querySelectorAll("button, input"))
    control.disabled = busy;
}

async function openDeletion() {
  if (!deletion || actionBusy || !currentUser || !identity) return;
  const user = currentUser;
  const requestGeneration = generation;
  deletionKey = crypto.randomUUID();
  deletion.querySelector("form").reset();
  $("#account-delete-plan").replaceChildren();
  deletion.querySelector(".account-delete__confirm").disabled = true;
  deletionStatus(copy.deleteChecking);
  deletion.showModal();
  try {
    const plan = await getAccountDeletion(user);
    if (requestGeneration !== generation || !deletion.open) return;
    const groups = [];
    if (plan.subscriptions.length)
      groups.push(
        deletionList(
          copy.deleteCancels,
          plan.subscriptions.map(
            (entry) => `${entry.organization} · ${productName(entry.product)}`,
          ),
        ),
      );
    if (plan.closingOrganizations.length)
      groups.push(
        deletionList(
          copy.deleteCloses,
          plan.closingOrganizations.map((entry) =>
            entry.otherMembers
              ? `${entry.organization} · ${copy.deleteMembers.replace("{n}", entry.otherMembers)}`
              : entry.organization,
          ),
        ),
      );
    // A Host plan holder's own systems go with the account; a system linked
    // to an organization stays in it.
    const mySystems = countOf(plan.mySystems);
    if (mySystems)
      groups.push(
        deletionList(copy.deleteMySystems, [
          systemCount(mySystems),
          copy.deleteMySystemsLinked,
        ]),
      );
    if (!groups.length) {
      const none = document.createElement("p");
      none.textContent = copy.deleteNone;
      groups.push(none);
    }
    $("#account-delete-plan").replaceChildren(...groups);
    deletionStatus("");
    deletion.querySelector(".account-delete__confirm").disabled = false;
    deletion.querySelector("input[name=confirmEmail]").focus();
  } catch (error) {
    if (requestGeneration === generation)
      deletionStatus(deletionMessage(error), "error");
  }
}

function finishDeletion(result) {
  accountDeleted = true;
  session?.stop();
  deletion.close();
  clearPrivate();
  currentUser = undefined;
  for (const node of document.querySelectorAll(
    ".platform-heading, #platform-status, #platform-retry, .platform-header .account-menu",
  ))
    node.hidden = true;
  const cancelled = result.cancelledSubscriptions.map(
    (entry) => `${entry.organization} · ${productName(entry.product)}`,
  );
  const list = $("#account-deleted-list");
  list.querySelector("ul").replaceChildren(
    ...cancelled.map((text) => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }),
  );
  list.hidden = !cancelled.length;
  const removed = countOf(result.removedMySystems);
  const systems = $("#account-deleted-systems");
  const line = document.createElement("li");
  line.textContent = systemCount(removed);
  systems.querySelector("ul").replaceChildren(...(removed ? [line] : []));
  systems.hidden = !removed;
  $("#account-deleted").hidden = false;
  $("#account-deleted-home").focus();
  // The Firebase user no longer exists; clear this tab's stored session.
  void signOut().catch(() => {});
}

async function confirmDeletion(event) {
  event.preventDefault();
  if (actionBusy || !currentUser || !identity) return;
  const typed = deletion
    .querySelector("input[name=confirmEmail]")
    .value.trim()
    .toLowerCase();
  if (!typed || typed !== (identity.user.email ?? "").toLowerCase()) {
    deletionStatus(copy.deleteConfirmMismatch, "error");
    deletion.querySelector("input[name=confirmEmail]").focus();
    return;
  }
  const user = currentUser;
  setDeletionBusy(true);
  deletionStatus(copy.deleting);
  try {
    let result;
    try {
      result = await deleteAccount(user, typed, deletionKey);
    } catch (error) {
      if (
        ![
          "RECENT_REAUTH_REQUIRED",
          "RECENT_AUTH_REQUIRED",
          "RECENT_TOTP_REQUIRED",
        ].includes(error?.code)
      )
        throw error;
      deletionStatus(copy.confirm);
      await reauthenticate(user, requestMfaChallenge);
      await user.getIdToken(true);
      deletionStatus(copy.deleting);
      result = await deleteAccount(user, typed, deletionKey);
    }
    setDeletionBusy(false);
    finishDeletion(result);
  } catch (error) {
    setDeletionBusy(false);
    deletionStatus(deletionMessage(error), "error");
  }
}

if (deletion) {
  $("#delete-account").addEventListener("click", () => void openDeletion());
  deletion.querySelector("form").addEventListener("submit", confirmDeletion);
  deletion.querySelector("[data-cancel]").addEventListener("click", () => {
    if (!actionBusy) deletion.close();
  });
  deletion.addEventListener("cancel", (event) => {
    if (actionBusy) event.preventDefault();
  });
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
  const code = event.currentTarget.elements.namedItem("code").value.trim();
  setActionBusy(true);
  $("#enrollment-status").textContent = copy.verifySetup;
  let completed = false;
  try {
    await finishTotpEnrollment(currentUser, enrollmentSecret, code);
    if (requestGeneration !== generation) return;
    completed = true;
    clearSecret();
  } catch (error) {
    if (requestGeneration === generation)
      $("#enrollment-status").textContent = authErrorMessage(error, language);
  } finally {
    if (requestGeneration === generation) setActionBusy(false);
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
    if (accountDeleted) return;
    currentUser = undefined;
    clearPrivate();
    session?.stop();
    if (session?.ended) return;
    location.replace(
      loginPath(location.pathname + location.search + location.hash, language),
    );
    return;
  }
  if (currentUser?.uid !== user.uid) clearPrivate();
  currentUser = user;
  session?.stop();
  session = watchSession({ clear: clearPrivate });
  $("#platform-sign-out").disabled = false;
  void refresh();
}).catch((error) => {
  $("#platform-status").textContent = authErrorMessage(error, language);
});
