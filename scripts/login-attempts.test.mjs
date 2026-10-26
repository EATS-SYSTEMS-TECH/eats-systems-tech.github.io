import assert from "node:assert/strict";
import test from "node:test";
import { createLoginAttemptHint } from "../js/login-attempts.js";

test("browser hints survive reload and expire exactly without being an enforcement mechanism", () => {
  let value;
  let now = 1000;
  const storage = { getItem: () => value, setItem: (_key, text) => { value = text; }, removeItem: () => { value = null; } };
  const options = { storage, clock: () => now };
  const first = createLoginAttemptHint(options);
  assert.equal(first.current().failed, 0);
  first.set({ failed: 3, limit: 5, resetAt: new Date(now + 900000).toISOString(), lockedUntil: null });
  assert.equal(createLoginAttemptHint(options).current().failed, 3);
  first.set({ failed: 5, limit: 5, resetAt: new Date(now + 900000).toISOString(), lockedUntil: new Date(now + 900000).toISOString() });
  assert.equal(createLoginAttemptHint(options).current().failed, 5);
  now += 900000;
  assert.equal(first.current().failed, 0);
  value = "malformed";
  assert.equal(createLoginAttemptHint(options).current().failed, 0);
  const unavailable = createLoginAttemptHint({ storage: { getItem() { throw new Error(); }, setItem() { throw new Error(); } }, clock: () => now });
  assert.equal(unavailable.current().failed, 0);
  assert.doesNotThrow(() => unavailable.set({ failed: 1, limit: 5, resetAt: new Date(now + 900000).toISOString(), lockedUntil: null }));
});
