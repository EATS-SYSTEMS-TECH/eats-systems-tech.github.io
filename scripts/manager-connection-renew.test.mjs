import test from "node:test";
import assert from "node:assert/strict";
import { ManagerConnection } from "../js/manager-connection.js";

// F13: a challenge that arrives while a renewal is running is answered right
// after it with the newest nonce, instead of being dropped.
test("a challenge during a renewal is answered afterwards with the newest nonce", async () => {
  const connection = Object.create(ManagerConnection.prototype);
  connection.closed = false;
  const answered = [];
  let release;
  connection.authorize = async nonce => {
    answered.push(nonce);
    if (answered.length === 1) await new Promise(resolve => { release = resolve; });
  };
  const first = connection.renew("a".repeat(64));
  await connection.renew("b".repeat(64));
  await connection.renew("c".repeat(64));
  assert.deepEqual(answered, ["a".repeat(64)], "one renewal at a time");
  release();
  await first;
  assert.deepEqual(answered, ["a".repeat(64), "c".repeat(64)], "then the newest pending nonce only");
  assert.equal(connection.renewing, false);
  assert.equal(connection.pendingNonce, null);
});

test("a closed connection answers no challenge", async () => {
  const connection = Object.create(ManagerConnection.prototype);
  connection.closed = true;
  let calls = 0;
  connection.authorize = async () => { calls++; };
  await connection.renew("a".repeat(64));
  assert.equal(calls, 0);
});
