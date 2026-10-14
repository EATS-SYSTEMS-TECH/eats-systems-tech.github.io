// Demo guest links and the example requests behind them. A demo link has the
// shape of a real guest link (https://wifigate.io/wifigate-api/?ep=…), but
// its token starts with v1.demo_ and carries only which example and the stay
// window, never a name, phone or email. The landing page shows a preview for
// it and never opens the app. Everything here is pure: no network, no
// storage, no secrets (API and Host keys are placeholders).
export const demoTokenPrefix = "v1.demo_";
export const guestLinkBase = "https://wifigate.io/wifigate-api/?ep=";
export const exampleKinds = Object.freeze(["room", "dual", "group"]);
export const apiOrigin = "https://api.wifigate.io";
export const apiKeyPlaceholder = "<YOUR_API_KEY>";
export const hostKeyPlaceholder = "<HOST_KEY_FROM_THE_WIFIGATE_APP>";
// Ofcom's drama range: a UK number that belongs to no one.
export const defaultGuestPhone = "+44 7700 900212";
export const maxStayMs = 31 * 24 * 60 * 60 * 1000;

export function base64Url(text) {
  let binary = "";
  for (const byte of new TextEncoder().encode(text))
    binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

export function fromBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]*$/.test(value))
    throw new TypeError("Not base64url");
  const padded = value.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  );
}

const instant = (value) => {
  const time = value instanceof Date ? value.getTime() : Date.parse(value);
  if (!Number.isFinite(time)) throw new RangeError("Invalid time");
  return time;
};
export const isoTime = (value) => new Date(instant(value)).toISOString();

// The demo link for one example and one stay (times in epoch milliseconds,
// like the real guest payload's ss/se).
export function demoGuestLink({ kind, startsAt, endsAt }) {
  if (!exampleKinds.includes(kind)) throw new TypeError("Unknown example");
  const ss = instant(startsAt);
  const se = instant(endsAt);
  if (se <= ss) throw new RangeError("The stay must end after it starts");
  return (
    guestLinkBase +
    demoTokenPrefix +
    base64Url(JSON.stringify({ k: kind, ss, se }))
  );
}

// The example and stay inside an ep value, or null when it is not a well
// formed demo token. Unknown fields are refused, so nothing personal can ride
// along.
export function readDemoToken(ep) {
  if (typeof ep !== "string" || !ep.startsWith(demoTokenPrefix)) return null;
  try {
    const value = JSON.parse(fromBase64Url(ep.slice(demoTokenPrefix.length)));
    const keys = Object.keys(value ?? {})
      .sort()
      .join(",");
    if (
      keys !== "k,se,ss" ||
      !exampleKinds.includes(value.k) ||
      !Number.isSafeInteger(value.ss) ||
      !Number.isSafeInteger(value.se) ||
      value.se <= value.ss
    )
      return null;
    return { k: value.k, ss: value.ss, se: value.se };
  } catch {
    return null;
  }
}

// Today 15:00 → tomorrow 12:00 in the browser's time zone.
export function defaultStay(now = new Date()) {
  const day = (offset, hour) =>
    new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + offset,
      hour,
      0,
      0,
      0,
    );
  return { startsAt: day(0, 15), endsAt: day(1, 12) };
}

const two = (value) => String(value).padStart(2, "0");
// A Date as the value of an <input type="datetime-local"> (local time).
export function localInputValue(date) {
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}
// An <input type="datetime-local"> value as a local Date, or null.
export function fromLocalInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value ?? "")) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

// A phone number as typed ("+44 7700 900212", "0044-7700-900212") in E.164,
// or null.
export function e164(value) {
  const compact = String(value ?? "")
    .trim()
    .replace(/[\s().-]/g, "")
    .replace(/^00/, "+");
  return /^\+[1-9]\d{6,14}$/.test(compact) ? compact : null;
}

// What is wrong with a guest form, as a short code, or null when it is valid.
export function stayProblem({ name, phone, startsAt, endsAt }) {
  if (!String(name ?? "").trim()) return "name";
  if (!e164(phone)) return "phone";
  if (!(startsAt instanceof Date) || !(endsAt instanceof Date)) return "time";
  if (endsAt.getTime() <= startsAt.getTime()) return "order";
  if (endsAt.getTime() - startsAt.getTime() > maxStayMs) return "length";
  return null;
}

const guestBody = (guest) => ({
  name: String(guest.name).trim(),
  phone: e164(guest.phone) ?? String(guest.phone),
});

// POST /v1/guest-invitations, exactly as a partner sends it. Secrets stay
// placeholders.
export function guestInvitationRequest({
  guest,
  startsAt,
  endsAt,
  reference = "WGA-SIM-212",
}) {
  return {
    method: "POST",
    url: `${apiOrigin}/v1/guest-invitations`,
    headers: {
      Authorization: `Bearer ${apiKeyPlaceholder}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `${reference}-request-1`,
    },
    body: {
      encryptedKeyValue: hostKeyPlaceholder,
      guest: guestBody(guest),
      access: { startsAt: isoTime(startsAt), endsAt: isoTime(endsAt) },
      externalReference: reference,
      delivery: { channel: "none" },
    },
  };
}

// The guest pass window the app reads: whole seconds, and an end on a whole
// minute covers that minute.
export function effectiveWindow(startsAt, endsAt) {
  const start = Math.floor(instant(startsAt) / 1000) * 1000;
  const end = Math.floor(instant(endsAt) / 1000) * 1000;
  return {
    effectiveStartsAt: new Date(start).toISOString(),
    effectiveEndsAt: new Date(
      end % 60000 === 0 ? end + 59999 : end,
    ).toISOString(),
  };
}

// The 201 answer of POST /v1/guest-invitations for an example.
export function guestInvitationResponse({ example, startsAt, endsAt }) {
  return {
    requestId: `demo-request-${example.kind}-212`,
    invitationId: `demo-invitation-${example.kind}-212`,
    status: "issued",
    targetType: example.type,
    targetId: example.id,
    startsAt: isoTime(startsAt),
    endsAt: isoTime(endsAt),
    physicalGateCount: example.gates,
    inviteUrl: demoGuestLink({ kind: example.kind, startsAt, endsAt }),
    ...effectiveWindow(startsAt, endsAt),
    delivery: { channel: "none", status: "not_requested" },
  };
}

// A booking system's signed reservation.created webhook.
export function reservationWebhookRequest({
  guest,
  startsAt,
  endsAt,
  timestamp = Math.floor(Date.now() / 1000),
}) {
  return {
    method: "POST",
    url: `${apiOrigin}/v1/webhooks/reservations`,
    headers: {
      Authorization: `Bearer ${apiKeyPlaceholder}`,
      "Content-Type": "application/json",
      "Idempotency-Key": "sandbox-pms-A-212-revision-1",
      "X-Wifigate-Timestamp": String(timestamp),
      "X-Wifigate-Signature":
        'v1=<HMAC-SHA256 of "<timestamp>.<body>" with your API key secret>',
    },
    body: {
      schema: "wifigate-reservation-event-v1",
      type: "reservation.created",
      eventId: "evt-A-212-1",
      provider: "sandbox-pms",
      providerReservationId: "A-212",
      revision: 1,
      providerRoomId: "212",
      guest: guestBody(guest),
      access: { startsAt: isoTime(startsAt), endsAt: isoTime(endsAt) },
    },
  };
}

export const reservationWebhookResponse = () => ({
  eventId: "demo-event-A-212",
  requestId: "demo-request-A-212",
  accepted: true,
});

// The signed message WIFIGATE sends back to the booking system with the link.
export function guestDeliveryRequest({ example, guest, startsAt, endsAt }) {
  return {
    method: "POST",
    url: "<YOUR_SYSTEM_DELIVERY_URL>",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "demo-delivery-A-212",
      "X-Wifigate-Timestamp": "<timestamp>",
      "X-Wifigate-Signature": "v1=<signature>",
    },
    body: {
      schema: "wifigate-guest-delivery-v1",
      requestId: "demo-delivery-A-212",
      reservationId: "demo-reservation-A-212",
      links: [
        {
          targetId: example.id,
          url: demoGuestLink({ kind: example.kind, startsAt, endsAt }),
          ...effectiveWindow(startsAt, endsAt),
        },
      ],
      guest: guestBody(guest),
    },
  };
}

const quoteShell = (text) => `'${String(text).replaceAll("'", "'\\''")}'`;

export function requestText(request) {
  return [
    `${request.method} ${request.url}`,
    ...Object.entries(request.headers).map(
      ([key, value]) => `${key}: ${value}`,
    ),
    "",
    JSON.stringify(request.body, null, 2),
  ].join("\n");
}

export function curlText(request) {
  return [
    `curl -X ${request.method} ${quoteShell(request.url)}`,
    ...Object.entries(request.headers).map(
      ([key, value]) => `  -H ${quoteShell(`${key}: ${value}`)}`,
    ),
    `  --data ${quoteShell(JSON.stringify(request.body))}`,
  ].join(" \\\n");
}

// Server-side JavaScript (Node 18+) for a request. A signed webhook shows how
// the signature is made from the API key's secret part.
export function javascriptText(request) {
  const body = JSON.stringify(request.body, null, 2);
  const signed = "X-Wifigate-Signature" in request.headers;
  const headerLines = Object.keys(request.headers).map((key) => {
    const value =
      key === "Authorization"
        ? "`Bearer ${apiKey}`"
        : key === "X-Wifigate-Timestamp"
          ? "timestamp"
          : key === "X-Wifigate-Signature"
            ? "`v1=${signature}`"
            : JSON.stringify(request.headers[key]);
    return `    ${JSON.stringify(key)}: ${value},`;
  });
  return [
    ...(signed ? ['import { createHmac } from "node:crypto";', ""] : []),
    "const apiKey = process.env.WIFIGATE_API_KEY;",
    `const body = JSON.stringify(${body});`,
    ...(signed
      ? [
          "const timestamp = String(Math.floor(Date.now() / 1000));",
          'const secret = Buffer.from(apiKey.split(".")[1], "base64url");',
          'const signature = createHmac("sha256", secret)',
          "  .update(`${timestamp}.`)",
          "  .update(body)",
          '  .digest("hex");',
        ]
      : []),
    `const response = await fetch(${JSON.stringify(request.url)}, {`,
    `  method: ${JSON.stringify(request.method)},`,
    "  headers: {",
    ...headerLines,
    "  },",
    "  body,",
    "});",
    "const answer = await response.json();",
  ].join("\n");
}

export function responseText(status, body) {
  const reason = { 201: "Created", 202: "Accepted" }[status] ?? "";
  return `HTTP/1.1 ${status} ${reason}\nContent-Type: application/json\n\n${JSON.stringify(body, null, 2)}`;
}
