import { hostText, hostLocale } from "./host-locale.js";
import { node, labelTip } from "./host-ui.js";
import { portalRequest } from "./api/index.js";
import { phoneField } from "./host-phone.js";
import { guestLinkCard } from "./host-link-card.js";
import { can } from "./host-permissions.js";
import {
  zoneOf,
  todayIn,
  addDays,
  localAt,
  isLocalTime,
  zonedInstant,
  resolveLocal,
  readReservation,
  bookingMessage,
  intentKey,
  noSystem,
  finalRefusals,
  closed,
} from "./host-booking-model.js";

// The booking sheet: one step from a guest's name to a guest link. It opens
// from "+ Booking", an empty calendar cell or a system card's "Create guest
// link", with the system and day already chosen. "Create guest link" makes a
// confirmed booking, issues its access and reveals the link in one go, and
// the sheet turns into the link card. "Save without link" keeps a draft.
const maxLinkMs = 31 * 86400000;
const optionalFields = [
  ["email", "Guest email", 254, "email"],
  ["floor", "Floor", 50],
  ["apartment", "Apartment", 80],
  ["parking", "Parking", 80],
  ["carNumber", "Car number", 50],
  ["comment", "Comment for the guest", 100],
];
const problems = {
  system: "Choose a system.",
  name: "Enter the guest's name.",
  phone: "Enter a valid phone number.",
  time: "Choose when the guest arrives and leaves.",
  order: "The guest must leave after they arrive.",
  length: "A guest link can cover up to 31 days.",
  window:
    "A guest link can cover up to 31 days, with early entry and late exit. Shorten the stay.",
  ended: "This stay has already ended. Choose a later time to leave.",
};

export const organizationPath = (organization) =>
  `/api/v1/organizations/${encodeURIComponent(organization.id)}`;

// A side sheet (full screen on a phone): a heading, a scrolling body, one
// status line and the buttons, which never scroll away.
let sheets = 0;
export function openSheet({ container, trigger, title, onClosed }) {
  for (const open of document.querySelectorAll("dialog.booking-sheet[open]"))
    open.close();
  const id = `booking-sheet-${++sheets}`;
  const dialog = node("dialog", undefined, {
    class: "booking-sheet",
    "aria-labelledby": `${id}-title`,
  });
  const frame = node("div", undefined, { class: "booking-sheet__frame" });
  const header = node("div", undefined, { class: "booking-sheet__header" });
  // The heading keeps the page's direction; a guest's name in it is
  // isolated, so a Latin name on a Hebrew page still starts at the start.
  const heading = node("h2", undefined, {
    id: `${id}-title`,
    tabindex: "-1",
  });
  heading.append(node("bdi", title));
  const close = node("button", "×", {
    type: "button",
    class: "booking-sheet__close button-secondary",
    "aria-label": "Close",
  });
  header.append(heading, close);
  const body = node("div", undefined, { class: "booking-sheet__body" });
  const status = node("p", "", {
    class: "booking-sheet__status",
    role: "status",
    "aria-live": "polite",
  });
  const actions = node("div", undefined, { class: "booking-sheet__actions" });
  const announcer = node("p", "", {
    class: "visually-hidden",
    "aria-live": "polite",
  });
  frame.append(header, body, status, actions, announcer);
  dialog.append(frame);
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    dialog.remove();
    if (trigger?.isConnected) trigger.focus();
    onClosed?.();
  });
  (container ?? document.body).append(dialog);
  dialog.showModal();
  heading.focus();
  return {
    dialog,
    heading,
    body,
    status,
    actions,
    alive: () => dialog.isConnected && dialog.open,
    close: () => dialog.open && dialog.close(),
    // Said once to a screen reader, never shown.
    announce: (text) => {
      announcer.textContent = text;
    },
  };
}

// Issues a confirmed booking's guest access and reveals its link: two
// writes, each with its own Idempotency-Key kept until it succeeds.
export async function issueGuestLink({ user, organization, reservation }) {
  const path = `${organizationPath(organization)}/reservations/${encodeURIComponent(reservation.id)}/access-grants`;
  const body = { reservationVersion: reservation.version };
  const intent = intentKey(path, body);
  const { grant } = await portalRequest(user, path, "POST", body, intent.key);
  intent.done();
  return revealGuestLink({ user, organization, grantId: grant.id });
}

export async function revealGuestLink({ user, organization, grantId }) {
  const path = `${organizationPath(organization)}/access-grants/${encodeURIComponent(grantId)}/reveal`;
  const intent = intentKey(path, {});
  const result = await portalRequest(user, path, "POST", {}, intent.key);
  intent.done();
  const link = Array.isArray(result?.links)
    ? result.links.find((item) => typeof item?.url === "string")
    : undefined;
  if (!link)
    throw Object.assign(new Error("No guest link"), {
      code: "SYSTEM_UNAVAILABLE",
    });
  return link.url;
}

// The guest as the API takes it: name and phone, and only the optional
// details that hold something.
export function guestBody(values) {
  const guest = { name: values.name.trim(), phone: values.phone };
  for (const [name] of optionalFields) {
    const value = String(values[name] ?? "").trim();
    if (value) guest[name] = value;
  }
  return guest;
}

// The body of a change to a stored booking (PUT): everything it holds, with
// `changes` on top. An older booking that holds several systems names none
// to change it with, so it only closes (cancelled or completed), on one of
// the systems it holds.
export function changeBody(record, changes = {}) {
  const closing = closed({ status: changes.status ?? record.status });
  return {
    systemId:
      record.changeSystemId ??
      (closing ? (record.heldTargets?.[0] ?? null) : null),
    guest: guestBody(record.guest),
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    status: record.status,
    note: record.note,
    ...(record.externalReference
      ? { externalReference: record.externalReference }
      : {}),
    ...changes,
    version: record.version,
  };
}

const zoneName = (timeZone) => {
  try {
    return (
      new Intl.DateTimeFormat(hostLocale, {
        timeZone,
        timeZoneName: "longGeneric",
      })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value ?? timeZone
    );
  } catch {
    return timeZone;
  }
};

function textInput(form, label, name, value = "", { max = 120, type } = {}) {
  const wrapper = node("label", hostText(label));
  const input = node("input", undefined, {
    name,
    type: type ?? "text",
    maxlength: String(max),
    autocomplete: "off",
    dir: type === "email" ? "ltr" : "auto",
  });
  input.value = value;
  wrapper.append(input);
  form.append(wrapper);
  return input;
}

// context: {container, trigger, user, organization, systems (active, from
// readSystem), systemId?, date? (YYYY-MM-DD), record? (a stored booking to
// change), onChanged(), onClosed()}.
export function openBookingSheet(context) {
  const { user, organization, systems, record, onChanged } = context;
  const zone = zoneOf(organization);
  const base = organizationPath(organization);
  const canLink = !record && can(organization, "invitations:write");
  const sheet = openSheet({
    container: context.container,
    trigger: context.trigger,
    title: hostText(record ? "Edit booking" : "New booking"),
    onClosed: context.onClosed,
  });
  const form = node("form", undefined, {
    class: "booking-form",
    novalidate: "",
  });
  form.id = `${sheet.heading.id}-form`;
  // System: the active systems; a stored booking keeps its own system even
  // when it is no longer active.
  const systemWrapper = node("label", hostText("System"));
  const system = node("select", undefined, { name: "systemId" });
  const choices = systems.map((item) => [item.id, item.name]);
  if (
    record?.changeSystemId &&
    !systems.some((item) => item.id === record.changeSystemId)
  )
    choices.push([record.changeSystemId, record.systemName ?? noSystem]);
  const wanted = record ? record.changeSystemId : context.systemId;
  if (!wanted || !choices.some(([id]) => id === wanted))
    system.append(node("option", hostText("Choose a system"), { value: "" }));
  for (const [id, name] of choices)
    system.append(node("option", name, { value: id }));
  system.value =
    wanted && choices.some(([id]) => id === wanted)
      ? wanted
      : choices.length === 1 && !record
        ? choices[0][0]
        : "";
  systemWrapper.append(system);
  form.append(systemWrapper);
  const name = textInput(form, "Guest name", "name", record?.guest.name ?? "");
  const phone = phoneField({
    phone: record?.guest.phone ?? "",
    timeZone: zone,
  });
  form.append(phone.element);
  const day = context.date ?? todayIn(zone);
  const times = node("div", undefined, { class: "booking-form__times" });
  const timeInput = (label, fieldName, value) => {
    const wrapper = node("label", hostText(label));
    const input = node("input", undefined, {
      name: fieldName,
      type: "datetime-local",
      required: "",
    });
    input.value = value;
    wrapper.append(input);
    times.append(wrapper);
    return input;
  };
  const arrive = timeInput(
    "Arrives",
    "startsAt",
    record ? localAt(record.startsAt, zone) : `${day}T15:00`,
  );
  const leave = timeInput(
    "Leaves",
    "endsAt",
    record ? localAt(record.endsAt, zone) : `${addDays(day, 1)}T12:00`,
  );
  // The time zone's ⓘ sits on the Arrives label's line.
  labelTip(arrive, hostText("Times are in {p0}.", { p0: zoneName(zone) }));
  form.append(times);
  // The clock-change question: only on the one night a time happens twice.
  const clock = node("fieldset", undefined, {
    class: "choice-list booking-form__clock",
    hidden: "",
  });
  clock.append(node("legend", hostText("The clocks change that night")));
  for (const [value, label] of [
    ["earlier", "The first time (before the clocks change)"],
    ["later", "The second time (after the clocks change)"],
  ]) {
    const choice = node("label", undefined, { class: "choice" });
    const radio = node("input", undefined, {
      type: "radio",
      name: "disambiguation",
      value,
    });
    choice.append(
      radio,
      node("span", hostText(label), { class: "choice__name" }),
    );
    clock.append(choice);
  }
  form.append(clock);
  const more = node("details", undefined, { class: "booking-form__more" });
  more.append(node("summary", hostText("More details")));
  const extra = {};
  for (const [field, label, max, type] of optionalFields)
    extra[field] = textInput(more, label, field, record?.guest[field] ?? "", {
      max,
      type,
    });
  const reference = textInput(
    more,
    "Booking reference",
    "externalReference",
    record?.externalReference ?? "",
    { max: 128 },
  );
  const note = textInput(
    more,
    "Note for your team",
    "note",
    record?.note ?? "",
    {
      max: 1000,
    },
  );
  form.append(more);
  sheet.body.append(form);

  const primary = node(
    "button",
    hostText(
      record ? "Save changes" : canLink ? "Create guest link" : "Save booking",
    ),
    { type: "submit", form: form.id, "data-booking-primary": "" },
  );
  const secondary = canLink
    ? node("button", hostText("Save without link"), {
        type: "button",
        class: "button-secondary",
        "data-booking-draft": "",
      })
    : node("button", hostText("Cancel"), {
        type: "button",
        class: "button-secondary",
      });
  sheet.actions.append(primary, secondary);
  if (!canLink) secondary.addEventListener("click", () => sheet.close());

  const fields = () => [
    system,
    name,
    phone.input,
    phone.country,
    arrive,
    leave,
    ...form.querySelectorAll('input[name="disambiguation"]'),
    ...Object.values(extra),
    reference,
    note,
  ];
  const lock = (locked) => {
    for (const element of fields()) element.disabled = locked;
  };
  function problem(withLink) {
    if (!system.value) return ["system", system];
    if (!name.value.trim()) return ["name", name];
    if (!phone.value()) return ["phone", phone.input];
    if (!isLocalTime(arrive.value)) return ["time", arrive];
    if (!isLocalTime(leave.value)) return ["time", leave];
    const span =
      Date.parse(`${leave.value}:00Z`) - Date.parse(`${arrive.value}:00Z`);
    if (span <= 0) return ["order", leave];
    if (withLink && span > maxLinkMs) return ["length", leave];
    if (withLink && Date.parse(zonedInstant(leave.value, zone)) <= Date.now())
      return ["ended", leave];
    return null;
  }
  // The organization's early entry and late exit widen a guest link's
  // window (31 days at most, ending in the future). Read once, when the
  // first link is asked for; without it the server still decides.
  let policy;
  const linkPolicy = () =>
    (policy ??= portalRequest(user, `${base}/automation/policy`).then(
      (result) => ({
        early: Number(result?.policy?.earlyAccessMinutes) || 0,
        late: Number(result?.policy?.lateExpiryMinutes) || 0,
      }),
      () => ({ early: 0, late: 0 }),
    ));
  async function windowProblem(startsAt, endsAt) {
    const { early, late } = await linkPolicy();
    const from = Date.parse(startsAt) - early * 60000;
    const to = Date.parse(endsAt) + late * 60000;
    if (to <= Date.now()) return "ended";
    if (to - from > maxLinkMs) return early || late ? "window" : "length";
    return null;
  }
  const disambiguation = () =>
    form.querySelector('input[name="disambiguation"]:checked')?.value ??
    "reject";
  async function instants() {
    const choice = disambiguation();
    const kept = (value, stored) =>
      record && choice === "reject" && value === localAt(stored, zone);
    return Promise.all([
      kept(arrive.value, record?.startsAt)
        ? record.startsAt
        : resolveLocal(user, organization, arrive.value, choice),
      kept(leave.value, record?.endsAt)
        ? record.endsAt
        : resolveLocal(user, organization, leave.value, choice),
    ]);
  }
  const input = (status, startsAt, endsAt) => ({
    systemId: system.value,
    guest: guestBody({
      name: name.value,
      phone: phone.value(),
      ...Object.fromEntries(
        Object.entries(extra).map(([field, element]) => [field, element.value]),
      ),
    }),
    startsAt,
    endsAt,
    status,
    note: note.value.trim(),
    ...(reference.value.trim()
      ? { externalReference: reference.value.trim() }
      : {}),
  });
  const systemName = () => system.selectedOptions[0]?.textContent || noSystem;

  let busy = false;
  let created;
  function refused(error) {
    sheet.status.textContent = bookingMessage(error);
    if (error?.code === "AMBIGUOUS_LOCAL_TIME") {
      clock.hidden = false;
      clock.querySelector("input")?.focus();
    }
    if (error?.code === "TOTP_REQUIRED")
      window.dispatchEvent(new CustomEvent("host:totp-required"));
  }
  function showLink(url) {
    sheet.heading.replaceChildren(node("bdi", name.value.trim()));
    const summary = node("p", undefined, { class: "booking-sheet__summary" });
    summary.append(node("bdi", systemName()));
    const card = guestLinkCard({
      url,
      phone: phone.value(),
      systemName: systemName(),
    });
    sheet.body.replaceChildren(summary, card);
    sheet.status.textContent = "";
    const done = node("button", hostText("Done"), { type: "button" });
    done.addEventListener("click", () => sheet.close());
    sheet.actions.replaceChildren(done);
    sheet.announce(hostText("The guest link is ready."));
    card.querySelector("[data-copy-link]")?.focus();
  }
  async function submit(withLink) {
    if (busy || !sheet.alive()) return;
    if (!created) {
      const found = problem(withLink);
      if (found) {
        sheet.status.textContent = hostText(problems[found[0]]);
        if (found[1].closest("details")) more.open = true;
        found[1].focus();
        return;
      }
    }
    busy = true;
    lock(true);
    primary.disabled = secondary.disabled = true;
    sheet.status.textContent = hostText(
      withLink ? "Creating the guest link…" : "Working…",
    );
    try {
      if (!created) {
        const [startsAt, endsAt] = await instants();
        if (!sheet.alive()) return;
        const refusal = withLink && (await windowProblem(startsAt, endsAt));
        if (!sheet.alive()) return;
        if (refusal) {
          sheet.status.textContent = hostText(problems[refusal]);
          leave.focus();
          return;
        }
        const path = record
          ? `${base}/reservations/${encodeURIComponent(record.id)}`
          : `${base}/reservations`;
        const body = record
          ? {
              ...input(record.status, startsAt, endsAt),
              version: record.version,
            }
          : input(withLink ? "confirmed" : "draft", startsAt, endsAt);
        const intent = intentKey(path, body);
        const result = await portalRequest(
          user,
          path,
          record ? "PUT" : "POST",
          body,
          intent.key,
        );
        intent.done();
        onChanged?.();
        if (!withLink) {
          sheet.close();
          return;
        }
        created = readReservation(result?.reservation);
        if (!created) throw new Error("No booking returned");
      }
      if (!sheet.alive()) return;
      const url = await issueGuestLink({
        user,
        organization,
        reservation: created,
      });
      onChanged?.();
      if (sheet.alive()) showLink(url);
    } catch (error) {
      if (!sheet.alive()) return;
      refused(error);
      // The booking exists: only the link is left to try again, unless
      // trying again can never work (the stay ended, the booking changed).
      if (created) {
        secondary.textContent = hostText("Close");
        if (finalRefusals.has(error?.code)) {
          primary.hidden = true;
          sheet.status.textContent = `${bookingMessage(error)} ${hostText(
            "The booking is saved without a link.",
          )}`;
        } else primary.textContent = hostText("Try again");
      }
    } finally {
      busy = false;
      if (sheet.alive()) {
        lock(Boolean(created));
        primary.disabled = secondary.disabled = false;
      }
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void submit(canLink);
  });
  if (canLink)
    secondary.addEventListener("click", () => {
      if (created) sheet.close();
      else void submit(false);
    });
  // A changed time asks the clock question again only if it is needed.
  for (const element of [arrive, leave])
    element.addEventListener("change", () => {
      clock.hidden = true;
      for (const radio of clock.querySelectorAll("input"))
        radio.checked = false;
    });
  (system.value ? name : system).focus();
  return sheet;
}
