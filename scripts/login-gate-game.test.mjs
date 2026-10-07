import test from "node:test";
import assert from "node:assert/strict";
import { looksHuman } from "../js/login-gate-game.js";

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
