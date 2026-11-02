import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { measureAccessibilitySheet } from "./accessibility-style-measurement.mjs";

// The frozen facts contain hashes of actual browser-computed presentation,
// without retaining any previous implementation source. Never rewrite in tests.
test("independent accessibility sheet preserves all frozen responsive presentation cases", async () => {
  const frozen = JSON.parse(await readFile(new URL("./fixtures/accessibility-style-contract.json", import.meta.url), "utf8"));
  assert.equal(frozen.referenceSourceSha256, "a34ff56c2e4af41f392cf9153231daa218ff1b98bfe2953391f0f36b56d29cca");
  const current = await measureAccessibilitySheet(await readFile(new URL("../css/accessibility.css", import.meta.url), "utf8"));
  assert.equal(current.length, 192);
  assert.deepEqual(current, frozen.cases);
});
