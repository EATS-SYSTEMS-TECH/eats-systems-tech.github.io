import assert from "node:assert/strict";
import { test } from "node:test";
import {
  demoGuestLink,
  readDemoToken,
  base64Url,
  fromBase64Url,
  defaultStay,
  localInputValue,
  fromLocalInput,
  e164,
  stayProblem,
  guestInvitationRequest,
  guestInvitationResponse,
  reservationWebhookRequest,
  guestDeliveryRequest,
  effectiveWindow,
  requestText,
  curlText,
  javascriptText,
  responseText,
} from "../js/host-demo-link.js";
import { exampleSystems, exampleById } from "../js/host-example-systems.js";

const startsAt = new Date("2026-10-14T12:00:00.000Z");
const endsAt = new Date("2026-10-15T09:00:00.000Z");
const guest = { name: "Christopher Martin", phone: "+44 7700 900212" };

test("a demo link carries only the example and the stay", () => {
  const link = demoGuestLink({ kind: "room", startsAt, endsAt });
  assert.ok(link.startsWith("https://wifigate.io/wifigate-api/?ep=v1.demo_"));
  const ep = new URL(link).searchParams.get("ep");
  assert.deepEqual(readDemoToken(ep), {
    k: "room",
    ss: startsAt.getTime(),
    se: endsAt.getTime(),
  });
  assert.deepEqual(Object.keys(JSON.parse(fromBase64Url(ep.slice(8)))), [
    "k",
    "ss",
    "se",
  ]);
  assert.doesNotMatch(fromBase64Url(ep.slice(8)), /Christopher|7700|@/);
  assert.match(ep, /^v1\.demo_[A-Za-z0-9_-]+$/, "URL-safe without padding");
  assert.throws(() => demoGuestLink({ kind: "real", startsAt, endsAt }));
  assert.throws(() =>
    demoGuestLink({ kind: "room", startsAt: endsAt, endsAt: startsAt }),
  );
});

test("a demo token with anything personal or malformed is refused", () => {
  const token = (value) => "v1.demo_" + base64Url(JSON.stringify(value));
  const ss = startsAt.getTime();
  const se = endsAt.getTime();
  assert.equal(readDemoToken(token({ k: "room", ss, se, gn: "Guest" })), null);
  assert.equal(
    readDemoToken(token({ k: "room", ss, se, p: "+447700900212" })),
    null,
  );
  assert.equal(readDemoToken(token({ k: "gate", ss, se })), null);
  assert.equal(readDemoToken(token({ k: "room", ss: se, se: ss })), null);
  assert.equal(readDemoToken(token({ k: "room", ss: "1", se })), null);
  assert.equal(readDemoToken("v1.demo_not-json"), null);
  assert.equal(readDemoToken("v1.demo_%%%"), null);
  assert.equal(readDemoToken("v1.real_token"), null);
  assert.equal(readDemoToken(undefined), null);
  assert.equal(fromBase64Url(base64Url("נועה 🥂")), "נועה 🥂");
});

test("the default stay is today 15:00 to tomorrow 12:00 in local time", () => {
  const { startsAt: arrive, endsAt: leave } = defaultStay(
    new Date(2026, 11, 31, 22, 45),
  );
  assert.equal(localInputValue(arrive), "2026-12-31T15:00");
  assert.equal(localInputValue(leave), "2027-01-01T12:00");
  assert.equal(fromLocalInput("2026-12-31T15:00").getTime(), arrive.getTime());
  assert.equal(fromLocalInput("31/12/2026"), null);
});

test("guest form checks: phone to E.164, order and length", () => {
  assert.equal(e164("+44 7700 900212"), "+447700900212");
  assert.equal(e164("0044-7700-900212"), "+447700900212");
  assert.equal(e164("(+972) 50-000-0212"), "+972500000212");
  assert.equal(e164("07700 900212"), null);
  assert.equal(e164("abc"), null);
  const valid = { ...guest, startsAt, endsAt };
  assert.equal(stayProblem(valid), null);
  assert.equal(stayProblem({ ...valid, name: "  " }), "name");
  assert.equal(stayProblem({ ...valid, phone: "123" }), "phone");
  assert.equal(stayProblem({ ...valid, endsAt: null }), "time");
  assert.equal(stayProblem({ ...valid, endsAt: startsAt }), "order");
  assert.equal(
    stayProblem({
      ...valid,
      endsAt: new Date(startsAt.getTime() + 32 * 86400000),
    }),
    "length",
  );
});

test("the example requests have the API's shape and never a secret", () => {
  const request = guestInvitationRequest({ guest, startsAt, endsAt });
  assert.equal(request.url, "https://api.wifigate.io/v1/guest-invitations");
  assert.equal(request.headers.Authorization, "Bearer <YOUR_API_KEY>");
  assert.match(request.headers["Idempotency-Key"], /^[A-Za-z0-9_-]{16,128}$/);
  assert.deepEqual(request.body, {
    encryptedKeyValue: "<HOST_KEY_FROM_THE_WIFIGATE_APP>",
    guest: { name: "Christopher Martin", phone: "+447700900212" },
    access: { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() },
    externalReference: "WGA-SIM-212",
    delivery: { channel: "none" },
  });
  const webhook = reservationWebhookRequest({
    guest,
    startsAt,
    endsAt,
    timestamp: 1760000000,
  });
  assert.equal(webhook.url, "https://api.wifigate.io/v1/webhooks/reservations");
  assert.equal(webhook.body.schema, "wifigate-reservation-event-v1");
  assert.equal(webhook.body.type, "reservation.created");
  assert.equal(webhook.headers["X-Wifigate-Timestamp"], "1760000000");
  assert.match(webhook.headers["Idempotency-Key"], /^[A-Za-z0-9_-]{16,128}$/);
  for (const text of [
    requestText(request),
    curlText(request),
    javascriptText(request),
    requestText(webhook),
    curlText(webhook),
    javascriptText(webhook),
  ])
    assert.doesNotMatch(text, /wfg_live_k_|wgk_live|sk_live/);
  assert.match(javascriptText(webhook), /createHmac\("sha256", secret\)/);
  assert.match(
    curlText({ ...request, body: { name: "O'Brien" } }),
    /O'\\''Brien/,
  );
});

test("the example answer mirrors POST /v1/guest-invitations 201", () => {
  for (const example of exampleSystems) {
    const answer = guestInvitationResponse({ example, startsAt, endsAt });
    assert.deepEqual(Object.keys(answer), [
      "requestId",
      "invitationId",
      "status",
      "targetType",
      "targetId",
      "startsAt",
      "endsAt",
      "physicalGateCount",
      "inviteUrl",
      "effectiveStartsAt",
      "effectiveEndsAt",
      "delivery",
    ]);
    assert.equal(answer.status, "issued");
    assert.equal(answer.targetType, example.type);
    assert.equal(answer.physicalGateCount, example.gates);
    assert.equal(
      readDemoToken(new URL(answer.inviteUrl).searchParams.get("ep")).k,
      example.kind,
    );
    assert.deepEqual(answer.delivery, {
      channel: "none",
      status: "not_requested",
    });
  }
  assert.deepEqual(effectiveWindow(startsAt, endsAt), {
    effectiveStartsAt: "2026-10-14T12:00:00.000Z",
    effectiveEndsAt: "2026-10-15T09:00:59.999Z",
  });
  const delivery = guestDeliveryRequest({
    example: exampleById("example-group-212"),
    guest,
    startsAt,
    endsAt,
  });
  assert.equal(delivery.body.schema, "wifigate-guest-delivery-v1");
  assert.equal(delivery.body.links.length, 1);
  assert.match(
    responseText(202, { accepted: true }),
    /^HTTP\/1\.1 202 Accepted\n/,
  );
});

test("the three examples are frozen and named the same in every language", () => {
  assert.deepEqual(
    exampleSystems.map((system) => [system.name, system.type, system.gates]),
    [
      ["Example WIFIGATE Room 212 🥂🍾", "gate", 1],
      ["Example WIFIGATE Dual Control 212 🥂🍾", "dual-control", 2],
      ["Example WIFIGATE Group 212 🥂🍾", "group", 4],
    ],
  );
  assert.ok(Object.isFrozen(exampleSystems));
  assert.ok(exampleSystems.every(Object.isFrozen));
  assert.throws(() => {
    "use strict";
    exampleSystems[0].name = "Changed";
  });
});
