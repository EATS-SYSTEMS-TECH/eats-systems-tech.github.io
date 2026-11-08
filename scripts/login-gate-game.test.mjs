import test from "node:test";
import assert from "node:assert/strict";
import { createGateCheckStore, looksHuman } from "../js/login-gate-game.js";

function path(count, durationMs, point) {
  return Array.from({ length: count }, (_, index) => {
    const t = index / (count - 1);
    return { ...point(t), t: t * durationMs };
  });
}

test("a curved drag at changing speed passes", () => {
  const samples = path(24, 900, (t) => ({
    x: 300 * t * t * (3 - 2 * t),
    y: -80 * t + Math.sin(Math.PI * t) * 18,
  }));
  assert.equal(looksHuman(samples), true);
});

test("a straight drag at constant speed is rejected", () => {
  assert.equal(looksHuman(path(24, 900, (t) => ({ x: 300 * t, y: -80 * t }))), false);
});

test("too fast, too slow or too few samples is rejected", () => {
  const curve = (t) => ({ x: 300 * t * t, y: Math.sin(Math.PI * t) * 18 });
  assert.equal(looksHuman(path(24, 400, curve)), false);
  assert.equal(looksHuman(path(24, 61_000, curve)), false);
  assert.equal(looksHuman(path(6, 900, curve)), false);
});

// A fake browser: localStorage plus a cookie jar that honours Max-Age.
function fakeBrowser(clock) {
  const items = new Map(), jar = new Map();
  return {
    items, jar,
    storage: { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => items.set(key, value), removeItem: (key) => items.delete(key) },
    cookies: () => [...jar].filter(([, entry]) => entry.until > clock.now).map(([name, entry]) => `${name}=${entry.value}`).join("; "),
    setCookie: (text) => {
      const [pair, ...attributes] = text.split("; ");
      const name = pair.slice(0, pair.indexOf("=")), value = pair.slice(pair.indexOf("=") + 1);
      const age = Number(attributes.find((part) => part.startsWith("Max-Age="))?.slice(8));
      jar.set(name, { value, until: clock.now + age * 1000, attributes });
    },
  };
}

test("a lockout survives a reload and only ends after the full 60 seconds", () => {
  const clock = { now: 1_000_000 };
  const browser = fakeBrowser(clock);
  const options = { storage: browser.storage, cookies: browser.cookies, setCookie: browser.setCookie, clock: () => clock.now };
  createGateCheckStore(options).write({ failures: 5, lockedUntil: clock.now + 60_000 });
  const cookie = browser.jar.get("wifigate-gate-check-v1");
  assert.ok(cookie.attributes.includes("SameSite=Strict") && cookie.attributes.includes("Secure") && cookie.attributes.includes("Path=/"));
  clock.now += 58_000;
  // A new page load reads the same lockout back.
  assert.deepEqual(createGateCheckStore(options).read(), { failures: 5, lockedUntil: 1_060_000 });
  clock.now += 2_000;
  assert.deepEqual(createGateCheckStore(options).read(), { failures: 0, lockedUntil: 0 });
});

test("clearing one store does not lift the lockout and misses survive a reload", () => {
  const clock = { now: 5_000_000 };
  const browser = fakeBrowser(clock);
  const options = { storage: browser.storage, cookies: browser.cookies, setCookie: browser.setCookie, clock: () => clock.now };
  const store = createGateCheckStore(options);
  store.write({ failures: 3, lockedUntil: 0 });
  assert.deepEqual(createGateCheckStore(options).read(), { failures: 3, lockedUntil: 0 });
  store.write({ failures: 5, lockedUntil: clock.now + 60_000 });
  browser.items.clear();
  assert.equal(createGateCheckStore(options).read().lockedUntil, 5_060_000, "the cookie alone keeps the lock");
  store.write({ failures: 5, lockedUntil: clock.now + 60_000 });
  browser.jar.clear();
  assert.equal(createGateCheckStore(options).read().lockedUntil, 5_060_000, "localStorage alone keeps the lock");
  store.write({ failures: 0, lockedUntil: 0 });
  assert.deepEqual(createGateCheckStore(options).read(), { failures: 0, lockedUntil: 0 });
});

test("a forged, clock-skewed or malformed stored lockout is capped or ignored", () => {
  const clock = { now: 9_000_000 };
  const browser = fakeBrowser(clock);
  const options = { storage: browser.storage, cookies: browser.cookies, setCookie: browser.setCookie, clock: () => clock.now };
  browser.storage.setItem("wifigate-gate-check-v1", JSON.stringify({ failures: 5, lockedUntil: clock.now + 86_400_000, expires: clock.now + 86_400_000 }));
  assert.equal(createGateCheckStore(options).read().lockedUntil, clock.now + 60_000, "a lockout longer than 60 seconds is capped at 60 seconds, not dropped");
  browser.storage.setItem("wifigate-gate-check-v1", "{not json");
  assert.deepEqual(createGateCheckStore(options).read(), { failures: 0, lockedUntil: 0 });
  assert.deepEqual(createGateCheckStore({ clock: () => clock.now }).read(), { failures: 0, lockedUntil: 0 }, "no storage at all");
});
