import { hostText } from "./host-locale.js";
import { node, hostDateTime, infoTip } from "./host-ui.js";
import { portalRequest } from "./api/index.js";
import { requestWithRecentIdentity } from "./host-recent-identity.js";
import { can, ownerOnly, servicePaused } from "./host-permissions.js";
import { openSystemDialog } from "./host-system-cards.js";
import { guestLinkCard } from "./host-link-card.js";
import { phoneDisplay, defaultCountry } from "./host-phone.js";
import {
  openSheet,
  openBookingSheet,
  issueGuestLink,
  revealGuestLink,
  changeBody,
  organizationPath,
} from "./host-booking-sheet.js";
import {
  zoneOf,
  guestName,
  systemLabel,
  stayText,
  statusBadge,
  closed,
  linkable,
  bookingMessage,
  intentKey,
  readReservation,
} from "./host-booking-model.js";

// One booking: who, which system, when, its state and its guest links.
// People who can book create a guest link here (a draft is confirmed
// first), edit it or cancel it; while the organization's service is paused
// those buttons stay, disabled, with an ⓘ. The owner deletes a closed
// booking's guest details. Everyone else reads it.
const detailRows = [
  ["phone", "Phone"],
  ["email", "Guest email"],
  ["floor", "Floor"],
  ["apartment", "Apartment"],
  ["parking", "Parking"],
  ["carNumber", "Car number"],
  ["comment", "Comment for the guest"],
];
const grantStates = {
  issued: "Active",
  superseded: "Replaced",
  expired: "Ended",
  cancelled: "Cancelled",
};

// context: {container, trigger, user, organization, systems, record,
// onChanged(), onClosed()}.
export function openBookingDetails(context) {
  const { user, organization, record } = context;
  const zone = zoneOf(organization);
  const base = organizationPath(organization);
  const systemsById = new Map(context.systems.map((item) => [item.id, item]));
  const systemName = systemLabel(record, systemsById);
  const writable =
    can(organization, "reservations:write") &&
    !closed(record) &&
    !record.redacted;
  const canBook = writable && Boolean(record.changeSystemId);
  // An older booking that holds several systems cannot be edited or get a
  // link, but it can still be cancelled on a system it holds.
  const canCancel =
    canBook || (writable && Boolean(record.heldTargets?.length));
  const canLink = canBook && can(organization, "invitations:write");
  const paused = servicePaused(organization);
  const isCurrent = () => sheet.alive() && (context.isCurrent?.() ?? true);
  const sheet = openSheet({
    container: context.container,
    trigger: context.trigger,
    title: guestName(record),
    onClosed: context.onClosed,
  });
  sheet.dialog.dataset.bookingId = record.id;
  const facts = node("div", undefined, { class: "booking-facts" });
  const systemLine = node("p", undefined, { class: "booking-facts__system" });
  systemLine.append(node("bdi", systemName));
  let badge = statusBadge(record.status);
  facts.append(
    systemLine,
    node("p", stayText(record, zone), { class: "booking-facts__stay" }),
    badge,
  );
  sheet.body.append(facts);
  if (!record.redacted) {
    const list = node("dl", undefined, { class: "booking-details" });
    const rows = [
      ...detailRows.map(([field, label]) => [
        label,
        record.guest[field],
        field,
      ]),
      ["Booking reference", record.externalReference],
      ["Note for your team", record.note],
    ];
    for (const [label, value, field] of rows) {
      if (!value) continue;
      const term = node("dt", hostText(label));
      const detail = node("dd");
      // A phone reads the way people write it in the organization's
      // country ("050-123-4567"), not as stored.
      detail.append(
        node(
          "bdi",
          field === "phone" ? phoneDisplay(value, defaultCountry(zone)) : value,
          field === "phone" || field === "email" ? { dir: "ltr" } : {},
        ),
      );
      list.append(term, detail);
    }
    if (list.childElementCount) sheet.body.append(list);
  }
  const linkHolder = node("div", undefined, { class: "booking-links" });
  const history = node("div", undefined, { class: "booking-links__history" });
  linkHolder.append(history);
  sheet.body.append(linkHolder);

  let busy = false;
  const fail = (error) => {
    if (!sheet.alive()) return;
    sheet.status.textContent = bookingMessage(error);
    if (error?.code === "TOTP_REQUIRED")
      window.dispatchEvent(new CustomEvent("host:totp-required"));
  };
  async function run(button, operation) {
    if (busy || !sheet.alive()) return;
    busy = true;
    // Buttons that were already disabled (a paused service, an unticked
    // approval) stay that way.
    const enabled = [...sheet.dialog.querySelectorAll("button")].filter(
      (element) =>
        !element.classList.contains("booking-sheet__close") &&
        !element.disabled,
    );
    for (const element of enabled) element.disabled = true;
    sheet.status.textContent = hostText("Working…");
    try {
      await operation();
      if (sheet.alive() && sheet.status.textContent === hostText("Working…"))
        sheet.status.textContent = "";
    } catch (error) {
      fail(error);
    } finally {
      busy = false;
      if (sheet.alive())
        for (const element of enabled) element.disabled = false;
    }
  }
  // Once the booking has an active link, the main button shows that link
  // again: the only "Show link" in the sheet. While the link's card is on
  // screen (Copy, WhatsApp, QR), the button goes.
  let create;
  let activeGrant;
  const linked = () => {
    if (create) create.textContent = hostText("Show link");
  };
  const showCard = (url) => {
    linkHolder.querySelector("[data-guest-link]")?.remove();
    const card = guestLinkCard({ url, phone: record.guest.phone, systemName });
    linkHolder.prepend(card);
    linked();
    if (create) create.hidden = true;
    sheet.announce(hostText("The guest link is ready."));
    card.querySelector("[data-copy-link]")?.focus();
  };
  const showStatus = (value) => {
    const next = statusBadge(value.status);
    badge.replaceWith(next);
    badge = next;
  };
  // The booking as it is now: a draft is confirmed before its link.
  let current = record;
  async function confirmFirst() {
    if (current.status !== "draft") return current;
    const path = `${base}/reservations/${encodeURIComponent(current.id)}`;
    const body = changeBody(current, { status: "confirmed" });
    const intent = intentKey(path, body);
    const result = await portalRequest(user, path, "PUT", body, intent.key);
    intent.done();
    context.onChanged?.();
    current = readReservation(result?.reservation) ?? {
      ...current,
      status: "confirmed",
      version: current.version + 1,
    };
    return current;
  }

  if (canLink) {
    create = node("button", hostText("Create guest link"), {
      type: "button",
      "data-booking-link": "",
    });
    create.addEventListener("click", () =>
      run(create, async () => {
        if (activeGrant) {
          const url = await revealGuestLink({
            user,
            organization,
            grantId: activeGrant,
          });
          if (sheet.alive()) showCard(url);
          return;
        }
        const reservation = await confirmFirst();
        if (!sheet.alive()) return;
        showStatus(reservation);
        const url = await issueGuestLink({ user, organization, reservation });
        context.onChanged?.();
        if (sheet.alive()) {
          sheet.status.textContent = "";
          showCard(url);
          void loadLinks();
        }
      }),
    );
    sheet.actions.append(create);
  }
  if (canCancel) {
    if (canBook) {
      const edit = node("button", hostText("Edit"), {
        type: "button",
        class: "button-secondary",
        "data-booking-edit": "",
      });
      edit.addEventListener("click", () => {
        sheet.close();
        openBookingSheet({
          ...context,
          record: current,
          trigger: context.trigger,
        });
      });
      sheet.actions.append(edit);
    }
    const cancel = node("button", hostText("Cancel booking"), {
      type: "button",
      class: "button-danger",
      "data-booking-cancel": "",
    });
    cancel.addEventListener("click", () =>
      openSystemDialog({
        container: sheet.dialog,
        trigger: cancel,
        danger: true,
        title: hostText("Cancel this booking?"),
        text: hostText(
          "A guest who already opened the link can still enter until the stay ends.",
        ),
        submitLabel: hostText("Cancel booking"),
        submit: async ({ status }) => {
          const path = `${base}/reservations/${encodeURIComponent(current.id)}`;
          const body = changeBody(current, { status: "cancelled" });
          const intent = intentKey(path, body);
          try {
            await portalRequest(user, path, "PUT", body, intent.key);
            intent.done();
            context.onChanged?.();
            sheet.close();
            return true;
          } catch (error) {
            status.textContent = bookingMessage(error);
            return false;
          }
        },
      }),
    );
    sheet.actions.append(cancel);
    // A paused service: the same buttons, disabled, and why.
    if (paused) {
      for (const button of sheet.actions.querySelectorAll("button"))
        button.disabled = true;
      sheet.actions.append(
        infoTip(
          hostText("Service is unavailable for this organization right now."),
        ),
      );
    }
  } else {
    const close = node("button", hostText("Close"), {
      type: "button",
      class: "button-secondary",
    });
    close.addEventListener("click", () => sheet.close());
    sheet.actions.append(close);
  }

  // Guest links made for this booking: an active one can be shown again.
  let links = 0;
  async function loadLinks() {
    if (!canLink || !linkable(current)) return;
    const request = ++links;
    let result;
    try {
      result = await portalRequest(
        user,
        `${base}/reservations/${encodeURIComponent(record.id)}/access-grants?limit=50`,
      );
    } catch {
      return;
    }
    if (!sheet.alive() || request !== links) return;
    const items = (Array.isArray(result?.items) ? result.items : []).filter(
      (grant) => typeof grant?.id === "string",
    );
    if (!items.length) {
      history.replaceChildren();
      return;
    }
    const list = node("ul", undefined, { class: "booking-links__list" });
    activeGrant = undefined;
    for (const grant of items) {
      const row = node("li", undefined, {
        ...(grant.status === "issued" ? { "data-grant-id": grant.id } : {}),
      });
      row.append(
        node(
          "span",
          hostText("Guest link · {p0}", {
            p0: hostDateTime(grant.createdAt ?? grant.effectiveStartsAt, zone),
          }),
        ),
        node("span", hostText(grantStates[grant.status] ?? "Ended"), {
          class: `booking-status booking-status--${grant.status === "issued" ? "confirmed" : "completed"}`,
        }),
      );
      if (grant.status === "issued") {
        activeGrant ??= grant.id;
        linked();
      }
      list.append(row);
    }
    history.replaceChildren(node("h3", hostText("Guest links")), list);
  }
  void loadLinks();

  // The owner deletes a closed booking's guest details for good.
  if (closed(record) && !record.redacted && ownerOnly(organization)) {
    const privacy = node("section", undefined, {
      class: "booking-privacy",
      "aria-label": "Guest privacy",
    });
    const approval = node("input", undefined, { type: "checkbox" });
    const label = node(
      "label",
      hostText("Delete this guest's details for good"),
    );
    label.prepend(approval);
    const erase = node("button", hostText("Delete guest details"), {
      type: "button",
      class: "button-danger",
      disabled: "",
    });
    approval.addEventListener("change", () => {
      erase.disabled = busy || !approval.checked;
    });
    // A sensitive action: the server asks for a fresh sign-in with the
    // authenticator, which happens here and then the same request runs.
    erase.addEventListener("click", () =>
      run(erase, async () => {
        const path = `${base}/reservations/${encodeURIComponent(record.id)}/privacy/redact`;
        const body = {
          version: record.version,
          confirm: "delete_guest_details",
        };
        const intent = intentKey(path, body);
        await requestWithRecentIdentity({
          user,
          path,
          body,
          intent: intent.key,
          isCurrent,
          onVerifying: () => {
            sheet.status.textContent = hostText(
              "Confirm your identity with your authenticator…",
            );
          },
        });
        intent.done();
        context.onChanged?.();
        sheet.close();
      }),
    );
    privacy.append(label, erase);
    sheet.body.append(privacy);
  }
  return sheet;
}
