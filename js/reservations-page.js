// /reservations/ — WIFIGATE Reservations for every signed-in WIFIGATE account
// (Google or Apple). No product plan is needed and nothing is charged: the
// team gets back to the customer to confirm. The backend checks the account,
// App Check and every limit again.
import {
  listMyReservations,
  createReservation,
  cancelReservation,
  reservationPhoto,
} from "./api/index.js";
import {
  initializeSiteAuth,
  signIn,
  signInRedirect,
  completeAuthCallback,
  signOut,
} from "./site-auth.js";
import { AuthErrors, AuthProviders } from "./host-constants.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { authErrorMessage } from "./host-auth-errors.js";
import { pageLanguage } from "./platform-model.js";
import { renderPlatformLanguage } from "./platform-language.js";
import {
  productLines,
  statusOrder,
  reservationsText,
  statusKey,
  productName,
  countryName,
  formatDate,
} from "./reservations-copy.js";
import { countryCodes } from "./reservations-countries.js";

const $ = (selector) => document.querySelector(selector);
const language = pageLanguage();
const t = reservationsText(language);
const maxQuantity = 50;
const maxPhotos = 3;
const maxPhotoBytes = 500 * 1024;

const element = (tag, attributes = {}, ...children) => {
  const node = document.createElement(tag);

  for (const [name, value] of Object.entries(attributes)) {
    if (value === undefined || value === null || value === false) continue;
    if (name === "className") node.className = value;
    else if (name === "text") node.textContent = value;
    else if (name.startsWith("on")) node.addEventListener(name.slice(2), value);
    else node.setAttribute(name, value === true ? "" : value);
  }

  node.append(...children.filter((child) => child !== null && child !== undefined));

  return node;
};

let currentUser;
let generation = 0;
let busy = false;
let draftKey;
let photos = [];
let reservations = [];
const quantities = Object.fromEntries(productLines.map(({ id }) => [id, 0]));

document.documentElement.lang = language;
document.documentElement.dir = language === "he" ? "rtl" : "ltr";
document.title = `${t("pageTitle")} | WIFIGATE Reservations`;

for (const node of document.querySelectorAll("[data-text]"))
  node.textContent = t(node.dataset.text);

renderPlatformLanguage($("#platform-language"), language, t("language"));
if (language === "he") {
  document.querySelector('a[href="/privacy-policy/"]').href = "/he/privacy-policy/";
  document.querySelector(".platform-header .brand").href = "/he/";
}

if (language === "he") {
  const translations = {
    title: "אימות באמצעות אפליקציית האימות",
    factor: "אפליקציית אימות",
    code: "קוד מאפליקציית האימות",
    verify: "אימות",
    cancel: "ביטול",
  };

  for (const node of document.querySelectorAll("[data-mfa-copy]"))
    node.textContent = translations[node.dataset.mfaCopy] ?? node.textContent;
}

function errorText(error) {
  switch (error?.code) {
    case "OPEN_RESERVATIONS_LIMIT":
      return t("errorLimit");
    case "INVALID_PHOTO":
      return t("errorPhoto");
    case "PAYLOAD_TOO_LARGE":
      return t("errorTooLarge");
    case "EMAIL_VERIFICATION_REQUIRED":
    case "IDENTITY_PROVIDER_REQUIRED":
      return t("errorVerify");
    case "APP_CHECK_REQUIRED":
    case "APP_CHECK_UNCONFIGURED":
      return t("errorIntegrity");
    case "HOST_API_UNAVAILABLE":
      return t("errorNetwork");
    case "VERSION_CONFLICT":
    case "RESERVATION_NOT_CANCELLABLE":
      return t("errorConflict");
    default:
      return error?.status === 401 ? t("errorSession") : t("errorGeneric");
  }
}

function setStatus(node, message, tone = "info") {
  node.textContent = message;
  node.dataset.tone = tone;
  node.hidden = !message;
}

// ---------- Product cards (also shown before sign-in) ----------

function renderProducts(editable) {
  const grid = $("#reservation-products");

  grid.replaceChildren(
    ...productLines.map((line) => {
      const quantity = element("output", {
        className: "reservation-quantity__value",
        "aria-live": "polite",
        text: String(quantities[line.id]),
      });
      const change = (delta) => {
        quantities[line.id] = Math.min(
          maxQuantity,
          Math.max(0, quantities[line.id] + delta),
        );
        quantity.textContent = String(quantities[line.id]);
        card.dataset.selected = String(quantities[line.id] > 0);
        less.disabled = quantities[line.id] === 0;
        more.disabled = quantities[line.id] === maxQuantity;
        renderSummary();
      };
      const less = element("button", {
        type: "button",
        className: "reservation-quantity__button",
        "aria-label": `${t("less")}: ${line.name}`,
        text: "−",
        onclick: () => change(-1),
      });
      const more = element("button", {
        type: "button",
        className: "reservation-quantity__button",
        "aria-label": `${t("more")}: ${line.name}`,
        text: "+",
        onclick: () => change(1),
      });
      less.disabled = quantities[line.id] === 0;
      const card = element(
        "article",
        { className: "reservation-product", "data-selected": String(quantities[line.id] > 0) },
        element("img", {
          src: line.image,
          alt: "",
          width: line.width,
          height: line.height,
          loading: "lazy",
          decoding: "async",
        }),
        element(
          "div",
          { className: "reservation-product__body" },
          element("h3", { dir: "ltr", text: line.name }),
          element("p", { text: line[language === "he" ? "he" : "en"] }),
          editable
            ? element(
                "div",
                {
                  className: "reservation-quantity",
                  role: "group",
                  "aria-label": `${t("quantity")}: ${line.name}`,
                },
                element("span", { text: t("quantity") }),
                element("div", { className: "reservation-quantity__control" }, less, quantity, more),
              )
            : null,
        ),
      );

      return card;
    }),
  );
}

// ---------- Sign-in ----------

async function startSignIn(provider) {
  const status = $("#sign-in-status");
  const buttons = document.querySelectorAll("[data-provider]");

  for (const button of buttons) button.disabled = true;
  setStatus(status, t("signingIn"));

  try {
    await signIn(provider, (resolver) => requestMfaChallenge(resolver));
    setStatus(status, "");
  } catch (error) {
    if (error?.code === AuthErrors.POPUP_BLOCKED) {
      await signInRedirect(provider);
      return;
    }

    setStatus(
      status,
      error?.code === AuthErrors.POPUP_CANCELLED ? "" : authErrorMessage(error, language),
      "error",
    );
  } finally {
    for (const button of buttons) button.disabled = false;
  }
}

for (const button of document.querySelectorAll("[data-provider]")) {
  button.textContent = t(button.dataset.provider === AuthProviders.APPLE ? "apple" : "google");
  button.addEventListener("click", () => void startSignIn(button.dataset.provider));
}

$("#reservations-sign-out").addEventListener("click", () => void signOut());

// ---------- The form ----------

function buildForm() {
  const country = $("#reservation-country");
  const names = [...countryCodes]
    .map((code) => ({ code, name: countryName(code, language) }))
    .sort((a, b) => a.name.localeCompare(b.name, language));

  country.replaceChildren(
    ...names.map(({ code, name }) =>
      element("option", { value: code, text: name, selected: code === "IL" }),
    ),
  );

  $("#reservation-photos-input").addEventListener("change", (event) => {
    void addPhotos([...event.target.files]);
    event.target.value = "";
  });

  $("#reservation-form").addEventListener("submit", (event) => {
    event.preventDefault();
    void submit();
  });

  for (const field of $("#reservation-form").querySelectorAll("input, textarea, select"))
    field.addEventListener("input", () => field.removeAttribute("aria-invalid"));
}

function renderSummary() {
  const chosen = productLines.filter(({ id }) => quantities[id] > 0);
  const total = chosen.reduce((sum, { id }) => sum + quantities[id], 0);
  const list = $("#reservation-summary-items");

  list.replaceChildren(
    ...chosen.map(({ id, name }) =>
      element(
        "li",
        {},
        element("span", { dir: "ltr", text: name }),
        element("strong", { dir: "ltr", text: t("unitSuffix", { n: quantities[id] }) }),
      ),
    ),
  );
  $("#reservation-summary-total").textContent = t("total", { n: total });
  $("#reservation-summary").dataset.empty = String(!total);
}

async function compress(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  let side = 1600;

  try {
    for (;;) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.72, 0.6]) {
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", quality),
        );

        if (blob && blob.size <= maxPhotoBytes) return blob;
      }

      side = Math.round(side * 0.75);
      if (side < 400) throw new Error("photo-too-large");
    }
  } finally {
    bitmap.close?.();
  }
}

async function addPhotos(files) {
  const status = $("#reservation-photos-status");
  setStatus(status, "");

  for (const file of files) {
    if (photos.length >= maxPhotos) {
      setStatus(status, t("errorPhotoCount"), "error");
      break;
    }

    if (!file.type.startsWith("image/")) {
      setStatus(status, t("errorPhotoType"), "error");
      continue;
    }

    try {
      const blob = await compress(file);
      photos.push({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setStatus(status, t("errorPhotoRead", { name: file.name }), "error");
    }
  }

  renderPhotos();
}

function renderPhotos() {
  $("#reservation-photo-list").replaceChildren(
    ...photos.map((photo, index) =>
      element(
        "li",
        { className: "reservation-photo" },
        element("img", { src: photo.url, alt: "" }),
        element("button", {
          type: "button",
          className: "reservation-photo__remove",
          "aria-label": t("removePhoto", { n: index + 1 }),
          text: "×",
          onclick: () => {
            URL.revokeObjectURL(photo.url);
            photos.splice(index, 1);
            renderPhotos();
          },
        }),
      ),
    ),
  );
  $("#reservation-photos-add").hidden = photos.length >= maxPhotos;
}

const base64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

// E.164: "00" becomes "+", and an Israeli number written locally (05…, 0X…)
// gets +972 when the country is Israel. Anything else needs its own +code.
export function normalizePhone(value, country) {
  let phone = value.replace(/[\s\-().]/g, "");
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`;
  if (!phone.startsWith("+") && country === "IL" && /^0\d{8,9}$/.test(phone))
    phone = `+972${phone.slice(1)}`;
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}

function fail(field, message) {
  field.setAttribute("aria-invalid", "true");
  field.focus();
  setStatus($("#reservation-status"), message, "error");
  return null;
}

async function collect() {
  const form = $("#reservation-form");
  const value = (name) => form.elements.namedItem(name).value.trim();
  const items = productLines
    .filter(({ id }) => quantities[id] > 0)
    .map(({ id }) => ({ productLine: id, quantity: quantities[id] }));

  if (!items.length) {
    $("#reservation-products").scrollIntoView({ behavior: "smooth", block: "center" });
    setStatus($("#reservation-status"), t("errorChooseProduct"), "error");
    return null;
  }

  const country = value("country");
  const phone = normalizePhone(value("phone"), country);

  if (value("fullName").length < 2) return fail(form.elements.namedItem("fullName"), t("errorName"));
  if (!phone) return fail(form.elements.namedItem("phone"), t("errorPhone"));
  if (!value("city")) return fail(form.elements.namedItem("city"), t("errorCity"));
  if (!value("street")) return fail(form.elements.namedItem("street"), t("errorStreet"));

  return {
    items,
    contact: {
      fullName: value("fullName"),
      phone,
      company: value("company") || null,
    },
    address: {
      country,
      city: value("city"),
      street: value("street"),
      postalCode: value("postalCode") || null,
    },
    notes: form.elements.namedItem("notes").value.trim() || null,
    language,
    photos: await Promise.all(
      photos.map(async ({ blob }) => ({ contentType: "image/jpeg", data: await base64(blob) })),
    ),
  };
}

async function submit() {
  if (busy || !currentUser) return;

  const status = $("#reservation-status");
  const button = $("#reservation-submit");
  const user = currentUser;
  const requestGeneration = generation;

  setStatus(status, "");
  const input = await collect();
  if (!input) return;

  busy = true;
  button.disabled = true;
  button.textContent = t("sending");
  // One key per draft: a retry after a lost response finds the same reservation.
  draftKey ??= crypto.randomUUID().replaceAll("-", "");

  try {
    const { reservation } = await createReservation(user, input, draftKey);
    if (requestGeneration !== generation) return;

    draftKey = undefined;
    showSent(reservation);
    void loadMine();
  } catch (error) {
    if (requestGeneration !== generation) return;
    setStatus(status, errorText(error), "error");
  } finally {
    busy = false;
    button.disabled = false;
    button.textContent = t("submit");
  }
}

function resetForm() {
  $("#reservation-form").reset();
  $("#reservation-country").value = "IL";
  for (const id of Object.keys(quantities)) quantities[id] = 0;
  for (const photo of photos) URL.revokeObjectURL(photo.url);
  photos = [];
  renderPhotos();
  renderProducts(true);
  renderSummary();
  prefill();
}

function showSent(reservation) {
  $("#reservation-form").hidden = true;
  const sent = $("#reservation-sent");
  sent.hidden = false;
  $("#reservation-sent-text").textContent = t("sentText", { id: reservation.id });
  sent.focus();
}

$("#reservation-new-another").addEventListener("click", () => {
  resetForm();
  $("#reservation-sent").hidden = true;
  $("#reservation-form").hidden = false;
  $("#reservation-products").scrollIntoView({ behavior: "smooth", block: "start" });
});

$("#reservation-view-mine").addEventListener("click", () => selectTab("mine"));

function prefill() {
  const form = $("#reservation-form");
  form.elements.namedItem("email").value = currentUser?.email ?? "";
  if (!form.elements.namedItem("fullName").value)
    form.elements.namedItem("fullName").value = currentUser?.displayName ?? "";
}

// ---------- My reservations ----------

function selectTab(name) {
  for (const tab of document.querySelectorAll("[data-tab]")) {
    const selected = tab.dataset.tab === name;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    $(`#${tab.getAttribute("aria-controls")}`).hidden = !selected;
  }

  if (name === "mine") void loadMine();
}

for (const tab of document.querySelectorAll("[data-tab]")) {
  tab.addEventListener("click", () => selectTab(tab.dataset.tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const next = tab.dataset.tab === "new" ? "mine" : "new";
    selectTab(next);
    document.querySelector(`[data-tab="${next}"]`).focus();
  });
}

function timeline(reservation) {
  const reached = new Map(reservation.history.map((entry) => [entry.status, entry]));
  const steps = reservation.status === "cancelled"
    ? [...statusOrder.filter((status) => reached.has(status)), "cancelled"]
    : statusOrder;

  return element(
    "ol",
    { className: "reservation-timeline", "aria-label": t("history") },
    ...steps.map((status) => {
      const entry = reached.get(status);
      return element(
        "li",
        {
          "data-state": status === reservation.status ? "current" : entry ? "done" : "todo",
          "data-status": status,
        },
        element("span", { className: "reservation-timeline__dot", "aria-hidden": "true" }),
        element("strong", { text: t(statusKey(status)) }),
        entry ? element("small", { text: formatDate(entry.at, language) }) : null,
      );
    }),
  );
}

function reservationCard(reservation) {
  const status = element("p", { className: "reservation-card__status", role: "status" });
  const card = element(
    "article",
    { className: "reservation-card portal-panel", "data-status": reservation.status },
    element(
      "header",
      { className: "reservation-card__head" },
      element(
        "div",
        {},
        element("h3", { text: t("reservation", { id: "" }).trim() }, " ", element("bdi", { dir: "ltr", text: reservation.id })),
        element("p", { text: t("created", { date: formatDate(reservation.createdAt, language) }) }),
      ),
      element("span", { className: "reservation-pill", "data-status": reservation.status, text: t(statusKey(reservation.status)) }),
    ),
    element(
      "ul",
      { className: "reservation-card__items" },
      ...reservation.items.map(({ productLine, quantity }) =>
        element("li", {}, element("span", { dir: "ltr", text: productName(productLine) }), element("strong", { dir: "ltr", text: t("unitSuffix", { n: quantity }) })),
      ),
    ),
    element("p", {
      className: "reservation-card__address",
      text: [reservation.address.street, reservation.address.city, countryName(reservation.address.country, language)]
        .filter(Boolean)
        .join(", "),
    }),
    timeline(reservation),
  );

  if (reservation.customerNote)
    card.append(
      element("div", { className: "reservation-card__note" }, element("strong", { text: t("messageFromUs") }), element("p", { dir: "auto", text: reservation.customerNote })),
    );

  if (reservation.trackingNumber)
    card.append(
      element("p", { className: "reservation-card__tracking" }, `${t("trackingNumber")}: `, element("bdi", { dir: "ltr", text: reservation.trackingNumber })),
    );

  if (reservation.photoCount) {
    const gallery = element("ul", { className: "reservation-card__photos" });
    card.append(gallery);
    void (async () => {
      for (let index = 0; index < reservation.photoCount; index++) {
        try {
          const blob = await reservationPhoto(currentUser, reservation.id, index);
          gallery.append(element("li", {}, element("img", { src: URL.createObjectURL(blob), alt: "" })));
        } catch {
          // A photo that fails to load is skipped; the reservation still shows.
        }
      }
    })();
  }

  if (reservation.cancellable) {
    const actions = element("div", { className: "reservation-card__actions" });
    const ask = element("button", {
      type: "button",
      className: "platform-button reservation-secondary",
      text: t("cancel"),
      onclick: () => {
        actions.replaceChildren(
          element("span", { text: t("cancelConfirm") }),
          element("button", {
            type: "button",
            className: "platform-button reservation-danger",
            text: t("cancelYes"),
            onclick: async (event) => {
              event.target.disabled = true;
              try {
                await cancelReservation(currentUser, reservation.id, reservation.version);
                await loadMine(t("cancelled"));
              } catch (error) {
                setStatus(status, errorText(error), "error");
                if (["VERSION_CONFLICT", "RESERVATION_NOT_CANCELLABLE"].includes(error?.code)) await loadMine(errorText(error));
                else actions.replaceChildren(ask);
              }
            },
          }),
          element("button", {
            type: "button",
            className: "platform-button reservation-secondary",
            text: t("cancelNo"),
            onclick: () => actions.replaceChildren(ask),
          }),
        );
      },
    });
    actions.append(ask);
    card.append(actions);
  }

  card.append(status);
  return card;
}

async function loadMine(message = "") {
  if (!currentUser) return;

  const user = currentUser;
  const requestGeneration = generation;
  const list = $("#reservations-mine-list");
  const status = $("#reservations-mine-status");
  const retry = $("#reservations-mine-retry");

  retry.hidden = true;
  setStatus(status, reservations.length ? message : t("loading"));

  try {
    ({ items: reservations } = await listMyReservations(user));
    if (requestGeneration !== generation) return;

    list.replaceChildren(...reservations.map(reservationCard));
    $("#reservations-mine-count").textContent = reservations.length ? String(reservations.length) : "";
    setStatus(status, reservations.length ? message : t("emptyMine"));
  } catch (error) {
    if (requestGeneration !== generation) return;
    setStatus(status, errorText(error), "error");
    retry.hidden = false;
  }
}

$("#reservations-mine-retry").addEventListener("click", () => void loadMine());

// ---------- Session ----------

function showSignedOut() {
  ++generation;
  currentUser = undefined;
  reservations = [];
  draftKey = undefined;
  document.body.dataset.session = "signed-out";
  $("#reservations-account").hidden = true;
  $("#reservations-workspace").hidden = true;
  $("#reservations-sign-in").hidden = false;
  $("#reservations-mine-list").replaceChildren();
  // Before sign-in the products are shown as a catalog under the sign-in card.
  $(".reservations-catalog").append($("#reservation-products"));
  $(".reservations-catalog").hidden = false;
  renderProducts(false);
}

function showSignedIn(user) {
  ++generation;
  currentUser = user;
  document.body.dataset.session = "signed-in";
  $("#reservations-sign-in").hidden = true;
  $("#reservations-account").hidden = false;
  $("#reservations-account-email").textContent = user.email ?? "";
  $("#reservations-workspace").hidden = false;
  $("#reservation-products-slot").append($("#reservation-products"));
  $(".reservations-catalog").hidden = true;
  renderProducts(true);
  renderSummary();
  prefill();
  void loadMine();
}

buildForm();
renderPhotos();
renderProducts(false);

try {
  await completeAuthCallback((resolver) => requestMfaChallenge(resolver));
} catch (error) {
  setStatus($("#sign-in-status"), authErrorMessage(error, language), "error");
}

try {
  await initializeSiteAuth((user) => (user ? showSignedIn(user) : showSignedOut()));
} catch (error) {
  showSignedOut();
  setStatus($("#sign-in-status"), authErrorMessage(error, language), "error");
}

document.body.dataset.ready = "true";
