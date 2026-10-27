import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import * as model from "../js/manager-events-model.js";

// Firmware/mobile shared vector, copied from tests/vectors/events_v1_vectors.json.
const vector = JSON.parse(await readFile(new URL("./fixtures/manager-events-v1-vectors.json", import.meta.url), "utf8"));
const fullTable = () => [8, 7, 7, 7, 7, 7, 7].flatMap((count, day) =>
  Array.from({ length: count }, (_, k) => [day, k % 2, k * 60, k * 60 + 30]));

test("Manager schedule agrees with firmware/mobile validation and one-time wire vectors", () => {
  assert.equal(model.DEFAULT_MAX_EVENTS, vector.maxEvents);
  assert.equal(model.EVENT_MINUTE_STEP, vector.minuteStep);
  assert.equal(model.MINUTES_PER_DAY, vector.minutesPerDay);
  for (const { item, valid } of vector.items) assert.equal(model.isItemValid(item), valid, JSON.stringify(item));
  for (const sample of vector.replaceAll) {
    const items = [...(sample.items === "full" ? fullTable() : sample.items), ...(sample.plus ?? [])];
    const result = model.replaceAll(items, sample.today);
    assert.equal(result.result, sample.result, sample.name);
    if (sample.after) assert.deepEqual(result.table, sample.after, sample.name);
  }
  for (const sample of vector.wire) {
    assert.deepEqual(model.toWireRows(sample.table, sample.today), sample.wire, sample.name);
    assert.deepEqual(model.absoluteRows(sample.wire, sample.today), sample.table, sample.name);
  }
});

test("day copy preserves existing events, only adds changed weekly blocks, and rejects conflicts atomically", () => {
  const before = [[0, 0, 60, 120], [1, 1, 300, 360], [3, 0, 700, 800]];
  const next = model.applyDayEdit(before, 0, [{ blocks: [{ action: "OPEN", start: 120, end: 180 }] }], [1, 3]);
  assert.deepEqual(model.replaceAll(next, 20753).table, [
    [0, 0, 120, 180], [1, 0, 120, 180], [1, 1, 300, 360], [3, 0, 120, 180], [3, 0, 700, 800],
  ]);
  const overlap = model.applyDayEdit([[0, 0, 60, 120], [1, 1, 80, 100]], 0, [{ blocks: [{ action: "OPEN", start: 80, end: 140 }] }], [1]);
  assert.equal(model.replaceAll(overlap, 20753).result, "Overlap");
});

test("pointer geometry stays snapped, bounded, and clear of weekly/one-time locked blocks", () => {
  const blocks = [{ action: "OPEN", start: 60, end: 120 }, { action: "CLOSE", start: 300, end: 360 }];
  assert.deepEqual(model.moveBlock(blocks, 0, 290)[0], { action: "OPEN", start: 240, end: 300 });
  assert.equal(model.resizeBlock(blocks, 0, "end", 1000)[0].end, 300);
  assert.equal(model.setBlockTimes(blocks, 0, 65, 120), "invalid");
  assert.equal(model.setBlockTimes(blocks, 0, 60, 310), "overlap");
  assert.equal(model.insertBlock([], "OPEN", 200, [{ action: "CLOSE", start: 100, end: 300 }]), "onLocked");
  assert.equal(model.upcomingDates(0, 0).length, 0);
  assert.ok(model.upcomingDates(0, 20753).every((date) => date <= 20753 + 90 && model.weekdayOfEpochDay(date) === 0));
});
