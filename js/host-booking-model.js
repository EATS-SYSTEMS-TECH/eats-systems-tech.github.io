import { hostText, hostLocale } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { authErrorMessage } from "./host-auth-errors.js";
import { node } from "./host-ui.js";

// Bookings as the Calendar, Bookings and the booking sheets read them: one
// system per booking, times in the organization's time zone. Older bookings
// (made before systems replaced rooms) have no systemId; they still show,
// with "—" for the system.
export const statuses = Object.freeze([
  "draft",
  "confirmed",
  "changed",
  "cancelled",
  "completed",
]);
const statusLabels = {
  draft: "Draft",
  confirmed: "Confirmed",
  changed: "Changed",
  cancelled: "Cancelled",
  completed: "Completed",
};
export const statusLabel = (status) =>
  hostText(statusLabels[status] ?? "Unknown status");
// The state of a booking as a small coloured label (its text says it too).
export const statusBadge = (status) =>
  node("span", statusLabel(status), {
    class: `booking-status booking-status--${status}`,
  });
// A closed booking can no longer change.
export const closed = (record) =>
  record.status === "cancelled" || record.status === "completed";
// A booking that can get a guest link once it is confirmed.
export const linkable = (record) =>
  ["draft", "confirmed", "changed"].includes(record.status);
export const noSystem = "—";

// The organization's time zone, or UTC when it is missing or unknown here.
export function zoneOf(organization) {
  const zone =
    typeof organization?.timezone === "string" && organization.timezone
      ? organization.timezone
      : "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return zone;
  } catch {
    return "UTC";
  }
}

function partsAt(value, timeZone) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .map((item) => [item.type, item.value]),
  );
}
// "YYYY-MM-DD" of an instant in a time zone.
export function dateAt(value, timeZone) {
  const parts = partsAt(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}
// "YYYY-MM-DDTHH:mm" of an instant in a time zone (a datetime-local value).
export function localAt(value, timeZone) {
  const parts = partsAt(value, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
export const todayIn = (timeZone) => dateAt(Date.now(), timeZone);
export const addDays = (date, days) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
export const isLocalTime = (value) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value ?? "");

// A local wall time in a time zone as an instant, computed in the browser.
// Lists use it for day boundaries; a booking's own times go through the
// server (resolveLocal), which also answers clock-change questions.
export function zonedInstant(local, timeZone) {
  const [date, time = "00:00"] = local.split("T");
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const offset = (instant) => {
    const parts = partsAt(instant, timeZone);
    return (
      Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
      ) -
      Math.floor(instant / 60000) * 60000
    );
  };
  let guess = wall - offset(wall);
  guess = wall - offset(guess);
  return new Date(guess).toISOString();
}

// The first instant of a local date. Where the clocks skip midnight
// (Santiago, Cairo, Beirut), the day starts at the first minute that
// exists, so the edges of a calendar range always resolve.
export function dayStart(date, timeZone) {
  const starts = (instant) => dateAt(instant, timeZone) >= date;
  const guess = Date.parse(zonedInstant(`${date}T00:00`, timeZone));
  if (starts(guess) && !starts(guess - 60000))
    return new Date(guess).toISOString();
  // The start lies within a few hours of the guess: halve to the minute.
  let low = guess - 6 * 3600000;
  let high = guess + 6 * 3600000;
  while (high - low > 60000) {
    const middle = low + Math.floor((high - low) / 120000) * 60000;
    if (starts(middle)) high = middle;
    else low = middle;
  }
  return new Date(high).toISOString();
}

// POST …/reservations/time-zone/resolve: a local time in the organization's
// time zone as an instant. Refuses with INVALID_LOCAL_TIME (the clocks skip
// it) or AMBIGUOUS_LOCAL_TIME (it happens twice) unless told which one.
export async function resolveLocal(
  user,
  organization,
  localTime,
  disambiguation = "reject",
) {
  const result = await portalRequest(
    user,
    `/api/v1/organizations/${encodeURIComponent(organization.id)}/reservations/time-zone/resolve`,
    "POST",
    { localTime, disambiguation },
  );
  return result.instant;
}

const text = (value) => (typeof value === "string" ? value : "");
const guestFields = [
  "name",
  "phone",
  "email",
  "floor",
  "apartment",
  "parking",
  "carNumber",
  "comment",
];

// A booking from the API, or null when it cannot be shown at all.
export function readReservation(raw) {
  if (!raw || typeof raw.id !== "string" || !raw.id) return null;
  const start = Date.parse(raw.startsAt);
  const end = Date.parse(raw.endsAt);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const guest = raw.guest && typeof raw.guest === "object" ? raw.guest : {};
  const systemId =
    typeof raw.systemId === "string" && raw.systemId ? raw.systemId : null;
  // The systems the booking holds: its own, or the targets of an older
  // booking. An older booking with exactly one target can still be changed:
  // the change names that target as its system.
  const targets = Array.isArray(raw.targetIds)
    ? [
        ...new Set(
          raw.targetIds.filter((id) => typeof id === "string" && id.length),
        ),
      ]
    : [];
  const target =
    Array.isArray(raw.targetIds) &&
    raw.targetIds.length === 1 &&
    typeof raw.targetIds[0] === "string"
      ? raw.targetIds[0]
      : null;
  return {
    id: raw.id,
    version: Number.isInteger(raw.version) ? raw.version : 1,
    status: statuses.includes(raw.status) ? raw.status : text(raw.status),
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(end).toISOString(),
    systemId,
    systemName: text(raw.systemName) || null,
    changeSystemId: systemId ?? target,
    heldTargets: systemId ? [systemId] : targets,
    guest: Object.fromEntries(
      guestFields.map((name) => [name, text(guest[name])]),
    ),
    redacted: Boolean(raw.guestRedactedAt),
    externalReference: text(raw.externalReference),
    note: text(raw.note),
  };
}

export const guestName = (record) =>
  record.redacted || !record.guest.name
    ? hostText("Guest details removed")
    : record.guest.name;

// The system a booking belongs to: its own, or the one target of an older
// booking ("" when an older booking has none or several).
export const bookingSystemId = (record) =>
  record.systemId ?? record.changeSystemId ?? "";

// The booking's system name: the live system, else the name kept on the
// booking, else "—". An older booking with one target shows that system
// while it is active.
export function systemLabel(record, systemsById) {
  if (!record.systemId)
    return systemsById.get(record.changeSystemId)?.name ?? noSystem;
  return (
    systemsById.get(record.systemId)?.name ?? record.systemName ?? noSystem
  );
}

const stayFormat = (timeZone) =>
  new Intl.DateTimeFormat(hostLocale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  });
// "Tue, 14 Oct, 15:00 – Wed, 15 Oct, 12:00" in the organization's time zone.
export function stayText(record, timeZone) {
  const format = stayFormat(timeZone);
  return `${format.format(new Date(record.startsAt))} – ${format.format(new Date(record.endsAt))}`;
}
export const timeText = (value, timeZone) =>
  new Intl.DateTimeFormat(hostLocale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(value));
export const dayText = (date) =>
  new Intl.DateTimeFormat(hostLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));

const messages = {
  RESERVATION_OVERLAP: "This system is already booked for these times.",
  GATE_DELEGATION_REQUIRED:
    "Open the WIFIGATE app near this gate and add it again.",
  VERSION_CONFLICT: "This booking changed. Close it and open it again.",
  IDEMPOTENCY_CONFLICT: "This booking changed. Close it and open it again.",
  INVALID_TRANSITION: "This booking can't change any more.",
  INVALID_LOCAL_TIME:
    "That time doesn't exist that day because the clocks change. Choose another time.",
  AMBIGUOUS_LOCAL_TIME: "That time happens twice that night. Choose which one.",
  SYSTEM_UNAVAILABLE: "This system isn't available right now.",
  DEVICE_IDENTITY_UNVERIFIED:
    "One of this system's gates isn't verified by WIFIGATE. Contact support.",
  GUEST_DATA_REDACTED:
    "This booking's guest details were deleted, so it can't be saved again.",
  RESERVATION_NOT_CONFIRMED: "Confirm the booking first.",
  ACCESS_EXPIRED: "This stay has ended, so it can't get a guest link.",
  INVALID_REQUEST: "Check the guest's phone number and the times.",
  BOOKING_CAPACITY_EXCEEDED:
    "This system has too many upcoming bookings. Contact support.",
  RATE_LIMITED: "Too many requests. Wait a moment and try again.",
  SUBSCRIPTION_UNAVAILABLE:
    "Service is unavailable for this organization right now.",
  TENANT_ACCESS_DENIED: "Your access to this organization changed.",
  OWNER_REQUIRED: "Only the owner can do this.",
  TOTP_REQUIRED: "Verify your authenticator first, then try again.",
  RESOURCE_NOT_FOUND: "This booking is no longer here.",
  HOST_API_UNAVAILABLE: "Can't reach WIFIGATE right now. Try again.",
};
// Refusals that the same request can never get past: the sheet offers no
// "Try again" for them.
export const finalRefusals = new Set([
  "ACCESS_EXPIRED",
  "RESERVATION_NOT_CONFIRMED",
  "INVALID_TRANSITION",
  "INVALID_REQUEST",
  "VERSION_CONFLICT",
  "IDEMPOTENCY_CONFLICT",
  "RESOURCE_NOT_FOUND",
  "TENANT_ACCESS_DENIED",
  "OWNER_REQUIRED",
  "DEVICE_IDENTITY_UNVERIFIED",
  "GUEST_DATA_REDACTED",
]);
export function bookingMessage(error) {
  if (messages[error?.code]) return hostText(messages[error.code]);
  if (
    String(error?.code ?? "").startsWith("auth/") ||
    /^RECENT_/.test(error?.code ?? "")
  )
    return authErrorMessage(error);
  return hostText("That didn't work. Try again.");
}

// One Idempotency-Key per intent (path and body), kept until it succeeds, so
// retrying the same booking or link is never applied twice.
const intents = new Map();
export function intentKey(path, body) {
  const signature = JSON.stringify([path, body]);
  if (!intents.has(signature)) intents.set(signature, crypto.randomUUID());
  return {
    key: intents.get(signature),
    done: () => intents.delete(signature),
  };
}
