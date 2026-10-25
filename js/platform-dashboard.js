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
import { infoTip } from "./host-ui.js";
import { renderPlatformLanguage } from "./platform-language.js";
import { monthlyEstimate, monthlyTotal, revenueTotal, formatMoney } from "./profile-financials.js";

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
      ? "פרטים אישיים, אבטחה, מנויים ותשלומים במקום אחד."
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
    const profileCard = Boolean($("#profile-subscriptions"));
    const productLabel = id[0].toUpperCase() + id.slice(1);
    if (profileCard) {
      const brand = document.createElement("span");
      brand.className = "profile-product-brand";
      brand.textContent = "WIFIGATE";
      const product = document.createElement("span");
      product.className = "profile-product-name";
      product.textContent = productLabel;
      name.append(brand, " ", product);
    } else name.textContent = `WIFIGATE ${productLabel}`;
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
    const open = canOpenProduct(identity, id)
      ? link(copy.open, productLink(id, language))
      : Object.assign(document.createElement("button"), {
          type: "button",
          className: "product-open",
          textContent: copy.open,
          disabled: true,
          title: guidance.textContent,
        });
    const informationUrl = id === "host" ? "/automation/" : `/contact-us/?product=${id}`;
    const prefix = language === "he" ? "/he" : "";
    actions.append(
      open,
      link(copy.learn, prefix + informationUrl, true),
      link(language === "he" ? "צור קשר" : copy.contact, "https://wifigate.io/#get-in-touch", true),
    );
    const recovery = document.createElement("div");
    recovery.className = "product-recovery";
    if (state === "unavailable")
      recovery.append(actionButton(copy.retry, () => void refresh()));
    if (state === "mfa-required") {
      recovery.append(
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
    if (profileCard) {
      const header = document.createElement("header");
      header.className = "profile-product-header";
      const productIdentity = document.createElement("div");
      productIdentity.className = "profile-product-identity";
      productIdentity.append(icon, title);
      header.append(productIdentity, status);
      tile.append(header, description, role, guidance, recovery, actions);
    } else tile.append(icon, title, description, status, role, guidance, recovery, actions);
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
          onProfile: (profile) => managerProfile?.update({ ...profile, platformRole: "platformRole" in profile ? profile.platformRole : identity.platformRole }, user),
          ensureRecent: async () => {
            const token = await user.getIdTokenResult();
            const age = Date.now() / 1000 - Number(token.claims.auth_time ?? 0);
            if (!Number.isFinite(age) || age < 0 || age > 86400) {
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
    { role: product?.role, roles: product?.roles, platformRole: identity.platformRole },
    { ...identity.user, photoURL: currentUser?.photoURL },
  );
  const name = identity.user.displayName || identity.user.email || "WIFIGATE";
  $("#platform-account").textContent = name;
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

function pricingExplanation(product, category) {
  const text = {
    he: {
      host: {
        gates: "שערים פיזיים בבעלותך שאינם נכללים בזוג מזוהה, כולל רכיבי קבוצות. 1–14 שערים: $6 לשער לחודש; 15–49: $5; 50 ומעלה: $4. המדרגה נקבעת לפי כל השערים הפיזיים בחשבון וחלה על כולם.",
        dualControls: "Dual Control כולל שני שערים פיזיים: $12 לזוג במדרגת 1–14 שערים, $10 במדרגת 15–49, או $8 במדרגת 50 ומעלה. זוגות שבתוך קבוצות נכללים כאן; שער שמופיע בכמה מקומות מחושב פעם אחת.",
        organizations: "אין תוספת חודשית עבור ארגונים ב־WIFIGATE Host. העלות נקבעת לפי השערים הפיזיים הייחודיים בחשבון.",
      },
      manager: {
        gates: "$2.90 לחודש לכל שער פיזי בבעלותך שנכלל ב־Manager, כולל רכיבי קבוצות שאינם משויכים לזוג מזוהה. לחשבון לקוח פעיל חל מינימום של שער אחד ($2.90); המינימום מופיע בשורה זו גם כשאין שער פעיל.",
        dualControls: "Dual Control מלא כולל שני שערים פיזיים: $5.80 לחודש לזוג. זוגות שבתוך קבוצות נכללים כאן. מחושבים רק השערים הייחודיים שנכללים בשירות; חפיפה או זוג פעיל חלקית אינם יוצרים חיוב כפול.",
        organizations: "שלושת הארגונים הפעילים הראשונים בבעלות החשבון כלולים. כל ארגון פעיל נוסף מוסיף $1 לחודש. מנהלי ארגון ללא חשבון לקוח משלם אינם משלמים על הארגון.",
      },
    },
    en: {
      host: {
        gates: "Owned physical gates outside recognized pairs, including group components. 1–14 gates: $6 per gate/month; 15–49: $5; 50+: $4. The tier uses all unique physical gates in the account and applies to every gate.",
        dualControls: "A Dual Control contains two physical gates: $12 per pair in the 1–14 gate tier, $10 in the 15–49 tier, or $8 in the 50+ tier. Pairs inside groups are included here; overlapping physical gates are counted once.",
        organizations: "WIFIGATE Host has no monthly organization surcharge. Cost depends on the account's unique physical gates.",
      },
      manager: {
        gates: "$2.90 per owned physical gate/month included in Manager, including group components outside recognized pairs. An active customer account has a one-gate minimum ($2.90), shown on this row even with no enabled gates.",
        dualControls: "A complete Dual Control contains two physical gates: $5.80 per pair/month. Pairs inside groups are included here. Only unique enabled physical gates are priced; overlapping or partially enabled pairs never double-charge a gate.",
        organizations: "The first three active account-owned organizations are included. Each additional active organization adds $1/month. Organization administrators without a paying customer account incur no organization fee.",
      },
    },
  };
  const detail = text[language === "he" ? "he" : "en"][product][category];
  const explanation = language === "he"
    ? detail.replace(/\$\d+(?:\.\d+)?|\d+–\d+/g, value => `\u2066${value}\u2069`)
    : detail;
  return explanation + (language === "he"
    ? " אומדן לחודש מלא בדולר, לפני מס; ללא גבייה כאן."
    : " Full-month estimate in USD before tax; no payment is collected here.");
}

function renderSubscriptionPreview() {
  if (!$("#profile-subscriptions")) return;
  // Server estimates use owned, deduplicated physical gates; Pay is revenue only.
  for (const id of productIds) {
    const card = $(`#product-grid [data-product="${id}"]`);
    if (!card) continue;
    card.dataset.subscription = id;
    const estimate = monthlyEstimate(identity.products[id]);
    if (id !== "pay") {
      const totals = document.createElement("section");
      totals.className = "profile-product-totals";
      const heading = document.createElement("h3");
      heading.textContent = language === "he" ? "סה״כ" : "Totals";
      totals.append(heading);
      const counts = document.createElement("table");
      counts.setAttribute("aria-label", language === "he" ? "כמויות ועלויות חודשיות משוערות" : "Quantities and estimated monthly costs");
      const head = counts.createTHead().insertRow();
      const infoHeading = document.createElement("th");
      infoHeading.scope = "col";
      infoHeading.className = "profile-cost-info";
      const infoTitle = document.createElement("span");
      infoTitle.className = "visually-hidden";
      infoTitle.textContent = language === "he" ? "מידע על התעריף" : "Pricing information";
      infoHeading.append(infoTitle);
      head.append(infoHeading);
      for (const label of language === "he" ? ["סוג", "כמות", "עלות חודשית"] : ["Type", "Quantity", "Monthly cost"]) {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.textContent = label;
        head.append(cell);
      }
      const body = counts.createTBody();
      for (const [key, he, en] of [
        ["gates", "שערים", "Gates"],
        ["dualControls", "Dual Controls", "Dual Controls"],
        ["organizations", "ארגונים", "Organizations"],
      ]) {
        const row = body.insertRow();
        const term = document.createElement("th");
        term.scope = "row";
        term.textContent = language === "he" ? he : en;
        const infoCell = document.createElement("td");
        infoCell.className = "profile-cost-info";
        const tip = infoTip(pricingExplanation(id, key));
        tip.dataset.costInfo = key;
        const infoButton = tip.querySelector("button");
        infoButton.setAttribute("aria-label", language === "he" ? `תעריף ${he}` : `${en} pricing`);
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 16 16");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");
        for (const [tag, attrs] of [["circle", {cx:8,cy:8,r:6}], ["path", {d:"M8 7.2v3.4M8 5.2h.01"}]]) {
          const part = document.createElementNS("http://www.w3.org/2000/svg", tag);
          for (const [attribute, value] of Object.entries(attrs)) part.setAttribute(attribute, value);
          svg.append(part);
        }
        infoButton.replaceChildren(svg);
        infoCell.append(tip);
        const value = document.createElement("td");
        value.dataset.personalCount = key;
        const quantity = estimate?.lines[key]?.quantity;
        value.textContent = Number.isSafeInteger(quantity) && quantity >= 0
          ? new Intl.NumberFormat(language === "he" ? "he-IL" : "en-GB").format(quantity)
          : "—";
        if (value.textContent === "—") value.setAttribute("aria-label", language === "he" ? "לא זמין כרגע" : "Not available");
        const cost = document.createElement("td");
        cost.dataset.personalCost = key;
        cost.dir = "auto";
        const amount = estimate ? estimate.lines[key].amountCents + (key === "gates" ? estimate.lines.groups.amountCents : 0) : undefined;
        cost.textContent = formatMoney(amount, estimate?.currency, language);
        row.append(infoCell, term, value, cost);
      }
      totals.append(counts);
      card.insertBefore(totals, card.querySelector(".product-guidance"));
      const note = document.createElement("p");
      note.className = "profile-cost-basis";
      note.textContent = language === "he"
        ? "רכיבים בבעלותך · אומדן לחודש מלא לפני מס."
        : "Owned components · full-month estimate before tax.";
      card.insertBefore(note, card.querySelector(".product-guidance"));
    }
    const list = document.createElement("dl");
    list.className = "profile-product-billing";
    for (const [label, value, key] of [
      [id === "pay" ? (language === "he" ? "סה״כ הכנסות" : "Total revenue") : (language === "he" ? "תשלום חודשי" : "Monthly payment"),
       id === "pay" ? revenueTotal(identity.products[id], language) : formatMoney(estimate?.monthlyCents, estimate?.currency, language),
       id === "pay" ? "revenue" : "monthly"],
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
    if (id === "pay" && revenueTotal(identity.products[id], language) === "—") {
      const note = document.createElement("p");
      note.className = "profile-cost-basis";
      note.textContent = language === "he" ? "נתוני הכנסות מאומתים עדיין אינם זמינים." : "Verified revenue data is not available yet.";
      card.insertBefore(note, card.querySelector(".product-guidance"));
    }
  }
  $("#profile-subscription-total").textContent = monthlyTotal(identity.products, language);
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
