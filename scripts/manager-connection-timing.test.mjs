import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { managerRequestedTiming, managerDemandTiming } from "../js/manager-connection-timing.js";

const vector = JSON.parse(await readFile(new URL("./fixtures/manager_timing_v2_vectors.json", import.meta.url), "utf8"));
const start = Date.parse("2026-10-28T12:00:00Z");
const timing = version => ({ ...vector.timing[`v${version}`], softWaitMs: version === 2 ? 120000 : 60000 });

test("Manager explicitly opts into v2 only after the API advertises and prefers it", () => {
  for (const profile of [undefined, {}, { timingPolicy: { supportedVersions: [1], preferredVersion: 1 } }, { timingPolicy: { supportedVersions: [1, 2] } }, { timingPolicy: { preferredVersion: 2 } }]) assert.equal(managerRequestedTiming(profile), 1);
  assert.equal(managerRequestedTiming({ timingPolicy: { supportedVersions: [1, 2], preferredVersion: 2 } }), 2);
});
test("legacy demand remains 90 seconds and a confirmed v2 demand lasts at most 180 seconds", () => {
  assert.equal(managerDemandTiming({}, 1, start).expiresAt, start + 90000);
  assert.equal(managerDemandTiming(timing(1), 2, start).expiresAt, start + vector.timing.v1.demandLifetimeMs);
  assert.equal(managerDemandTiming(timing(2), 2, start).expiresAt, start + vector.timing.v2.demandLifetimeMs);
  assert.equal(managerDemandTiming(timing(2), 2, start).softWaitMs, 120000);
  assert.equal(vector.timing.grantMaximumMs, 60000, "idle negotiation does not alter grant authority");
  assert.equal(vector.timing.renewChallengeIntervalMs, 30000);
});
test("server expiry may shorten an idle wait but cannot extend the negotiated local maximum", () => {
  assert.equal(managerDemandTiming({ ...timing(2), expiresAt: new Date(start + 40000).toISOString() }, 2, start).expiresAt, start + 40000);
  assert.equal(managerDemandTiming({ ...timing(2), expiresAt: new Date(start + 900000).toISOString() }, 2, start).expiresAt, start + 180000);
  assert.equal(managerDemandTiming({ expiresAt: new Date(start - 1).toISOString() }, 1, start).expiresAt, start - 1);
});
test("unoffered, partial, unknown or contradictory timing metadata fails closed", () => {
  for (const [response, request] of [[timing(2), 1], [{ timingVersion: 3 }, 2], [{ timingVersion: 2 }, 2], [{ ...timing(2), demandLifetimeMs: 360000 }, 2], [{ demandLifetimeMs: 180000 }, 2], [{ ...timing(2), pollIntervalMs: 120000 }, 2], [{ ...timing(1), softWaitMs: 120000 }, 1], [{ expiresAt: "not-a-date" }, 1]]) assert.throws(() => managerDemandTiming(response, request, start), /INVALID_CONNECTION_TIMING/);
});
