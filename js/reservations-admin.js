// WIFIGATE Reservations in WIFIGATE Admin: the dedicated reservations
// page (/dashboard/reservations/), apart
// from the For Business products. The backend requires the global WIFIGATE
// Admin with TOTP on every request.
import {
  adminListReservations,
  adminGetReservation,
  adminChangeReservationStatus,
  reservationPhoto,
} from "./api/index.js";
import {
  reservationsText,
  statusKey,
  productName,
  countryName,
  formatDate,
} from "./reservations-copy.js";

const statuses = ["new", "contacted", "confirmed", "shipped", "delivered", "cancelled"];

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

function errorText(t, error) {
  if (error?.code === "PLATFORM_ADMIN_REQUIRED" || error?.code === "TOTP_REQUIRED")
    return t("adminDenied");
  if (["VERSION_CONFLICT", "INVALID_STATUS_TRANSITION", "RESERVATION_ERASED"].includes(error?.code))
    return t("errorConflict");
  if (error?.code === "HOST_API_UNAVAILABLE") return t("errorNetwork");
  if (error?.status === 401) return t("errorSession");
  return t("errorGeneric");
}

// Field labels come from the customer form; the admin view drops "(optional)".
const bare = (label) => label.replace(/\s*\((?:לא חובה|optional)\)$/, "");


const itemsText = (t, items) =>
  items.map(({ productLine, quantity }) => `${productName(productLine)} ${t("unitSuffix", { n: quantity })}`).join(" · ");

// The reservations page itself.
export function createReservationsAdmin({ root, user, language }) {
  const t = reservationsText(language);
  let closed = false;
  let generation = 0;
  let selected = "all";
  let next = null;
  const photoUrls = new Set();

  const status = element("p", { className: "reservation-status", role: "status", "aria-live": "polite" });
  const filters = element("nav", { className: "reservations-filters", "aria-label": t("newStatus") });
  const list = element("div", { className: "reservations-list" });
  const truncated = element("p", { className: "reservation-hint", text: t("truncated"), hidden: true });
  const more = element("button", {
    type: "button",
    className: "platform-button reservation-secondary",
    text: t("loadMore"),
    hidden: true,
    onclick: () => void load(true),
  });
  const refresh = element("button", {
    type: "button",
    className: "platform-button reservation-secondary",
    text: t("refresh"),
    onclick: () => void load(),
  });

  root.hidden = false;
  root.className = "portal-panel reservations-admin";
  root.replaceChildren(
    element(
      "div",
      { className: "reservations-admin__heading" },
      element("div", {}, element("h2", { text: t("adminTitle") }), element("p", { text: t("adminNote") })),
      refresh,
    ),
    filters,
    status,
    list,
    truncated,
    more,
  );

  function renderFilters(counts = {}) {
    const total = statuses.reduce((sum, value) => sum + (counts[value] ?? 0), 0);

    filters.replaceChildren(
      ...["all", ...statuses].map((value) =>
        element(
          "button",
          {
            type: "button",
            "aria-pressed": String(value === selected),
            onclick: () => {
              selected = value;
              void load();
            },
          },
          value === "all" ? t("all") : t(statusKey(value)),
          element("b", { text: String(value === "all" ? total : (counts[value] ?? 0)) }),
        ),
      ),
    );
  }

  function photoGallery(reservation) {
    const gallery = element("div", { className: "reservation-card__photos reservations-admin-photos" });

    void (async () => {
      for (let index = 0; index < reservation.photoCount; index++) {
        try {
          const blob = await reservationPhoto(user, reservation.id, index, true);
          if (closed) return;
          const url = URL.createObjectURL(blob);
          photoUrls.add(url);
          gallery.append(
            element(
              "a",
              { href: url, target: "_blank", rel: "noopener", "aria-label": t("openPhoto", { n: index + 1 }) },
              element("img", { src: url, alt: "" }),
            ),
          );
        } catch {
          // A photo that fails to load is left out.
        }
      }
    })();

    return gallery;
  }

  function detail(row, reservation) {
    const definition = (pairs) =>
      element(
        "dl",
        {},
        ...pairs
          .filter(([, value]) => value)
          .flatMap(([term, value, dir]) => [
            element("dt", { text: bare(term) }),
            element("dd", {}, element("bdi", { dir: dir ?? "auto", text: value })),
          ]),
      );
    const form = element("form", { className: "reservations-admin-form" });
    const statusSelect = element(
      "select",
      { name: "status" },
      element("option", { value: reservation.status, text: t("keepStatus", { status: t(statusKey(reservation.status)) }) }),
      ...reservation.nextStatuses.map((value) => element("option", { value, text: t(statusKey(value)) })),
    );
    const customerNote = element("textarea", { name: "customerNote", rows: "2", maxlength: "500" });
    customerNote.value = reservation.customerNote ?? "";
    const adminNote = element("textarea", { name: "adminNote", rows: "2", maxlength: "1000" });
    adminNote.value = reservation.adminNote ?? "";
    const tracking = element("input", { name: "trackingNumber", dir: "ltr", maxlength: "64" });
    tracking.value = reservation.trackingNumber ?? "";
    const save = element("button", { type: "submit", className: "platform-button", text: t("save") });
    const formStatus = element("p", { className: "reservation-status", role: "status", "aria-live": "polite" });

    form.append(
      element("label", {}, t("newStatus"), statusSelect),
      element("label", {}, t("customerNote"), customerNote, element("small", { text: t("customerNoteHint") })),
      element("label", {}, t("adminNoteLabel"), adminNote, element("small", { text: t("adminNoteHint") })),
      element("label", {}, t("trackingNumber"), tracking),
      save,
      formStatus,
    );

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      save.disabled = true;
      save.textContent = t("saving");
      formStatus.textContent = "";
      delete formStatus.dataset.tone;

      try {
        const { reservation: updated } = await adminChangeReservationStatus(user, reservation.id, {
          version: reservation.version,
          status: statusSelect.value,
          customerNote: customerNote.value.trim() || null,
          adminNote: adminNote.value.trim() || null,
          trackingNumber: tracking.value.trim() || null,
        });
        if (closed) return;
        renderDetail(row, updated);
        row.querySelector(".reservation-pill").dataset.status = updated.status;
        row.querySelector(".reservation-pill").textContent = t(statusKey(updated.status));
        row.querySelector(".reservations-admin-form .reservation-status").textContent = t("saved");
      } catch (error) {
        if (closed) return;
        formStatus.textContent = errorText(t, error);
        formStatus.dataset.tone = "error";
        save.disabled = false;
        save.textContent = t("save");

        if (error?.code === "VERSION_CONFLICT") void open(row, reservation.id, true);
      }
    });

    const address = reservation.address;

    return element(
      "div",
      { className: "reservations-admin-detail" },
      reservation.erased ? element("p", { className: "reservations-admin-erased", text: t("erased") }) : null,
      element(
        "div",
        {},
        element("h4", { text: t("customer") }),
        definition([
          [t("fullName"), reservation.contact.fullName],
          [t("email"), reservation.email, "ltr"],
          [t("phone"), reservation.contact.phone, "ltr"],
          [t("company"), reservation.contact.company],
          [t("country"), countryName(address.country, language)],
          [t("city"), address.city],
          [t("street"), address.street],
          [t("postalCode"), address.postalCode, "ltr"],
        ]),
      ),
      element(
        "div",
        {},
        element("h4", { text: t("items") }),
        definition(reservation.items.map(({ productLine, quantity }) => [productName(productLine), t("unitSuffix", { n: quantity }), "ltr"])),
        reservation.notes ? element("h4", { text: bare(t("notes")) }) : null,
        reservation.notes ? element("p", { dir: "auto", text: reservation.notes }) : null,
        reservation.photoCount ? photoGallery(reservation) : null,
      ),
      element(
        "div",
        {},
        element("h4", { text: t("history") }),
        element(
          "ol",
          {},
          ...reservation.history.map((entry) =>
            element(
              "li",
              {},
              `${t(statusKey(entry.status))} · ${formatDate(entry.at, language)} · `,
              entry.actorEmail ? element("bdi", { dir: "ltr", text: entry.actorEmail }) : t(`by_${entry.by}`),
            ),
          ),
        ),
      ),
      reservation.erased && !reservation.nextStatuses.length ? null : form,
    );
  }

  function renderDetail(row, reservation) {
    row.querySelector(".reservations-admin-detail")?.remove();
    row.append(detail(row, reservation));
  }

  async function open(row, id, force = false) {
    if (row.dataset.loaded === "true" && !force) return;
    const placeholder = element("p", { className: "reservation-status reservations-admin-detail", text: t("loading") });
    row.querySelector(".reservations-admin-detail")?.remove();
    row.append(placeholder);

    try {
      const { reservation } = await adminGetReservation(user, id);
      if (closed) return;
      row.dataset.loaded = "true";
      renderDetail(row, reservation);
    } catch (error) {
      if (closed) return;
      placeholder.textContent = errorText(t, error);
      placeholder.dataset.tone = "error";
    }
  }

  function rowFor(item) {
    const row = element(
      "details",
      { className: "reservations-admin-row" },
      element(
        "summary",
        {},
        element("span", {}, element("bdi", { dir: "ltr", text: item.id }), element("small", { text: formatDate(item.createdAt, language) })),
        element(
          "span",
          {},
          element("bdi", { dir: "auto", text: item.fullName ?? "—" }),
          element("small", { dir: "ltr", text: item.email ?? "" }),
        ),
        element(
          "span",
          { className: "reservations-admin-hide-small" },
          element("bdi", { dir: "ltr", text: itemsText(t, item.items) }),
          element("small", { text: [item.city, item.country && countryName(item.country, language)].filter(Boolean).join(", ") }),
        ),
        element("span", { className: "reservation-pill", "data-status": item.status, text: t(statusKey(item.status)) }),
      ),
    );

    row.addEventListener("toggle", () => {
      if (row.open) void open(row, item.id);
    });

    return row;
  }

  async function load(append = false) {
    const request = ++generation;
    more.hidden = true;
    refresh.disabled = true;
    status.textContent = append ? "" : t("loading");
    delete status.dataset.tone;

    if (!append) {
      for (const url of photoUrls) URL.revokeObjectURL(url);
      photoUrls.clear();
    }

    try {
      const page = await adminListReservations(user, {
        status: selected,
        after: append ? (next ?? undefined) : undefined,
      });
      if (closed || request !== generation) return;

      renderFilters(page.counts);
      next = page.nextCursor;
      const rows = page.items.map(rowFor);
      if (append) list.append(...rows);
      else list.replaceChildren(...rows);
      status.textContent = list.childElementCount ? "" : t("adminEmpty");
      truncated.hidden = !page.truncated;
      more.hidden = !next;
    } catch (error) {
      if (closed || request !== generation) return;
      status.textContent = errorText(t, error);
      status.dataset.tone = "error";
    } finally {
      if (request === generation) refresh.disabled = false;
    }
  }

  renderFilters();
  void load();

  return {
    close() {
      closed = true;
      ++generation;
      for (const url of photoUrls) URL.revokeObjectURL(url);
      root.replaceChildren();
      root.hidden = true;
    },
  };
}
