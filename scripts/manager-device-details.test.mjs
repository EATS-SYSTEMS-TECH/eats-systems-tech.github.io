import test from "node:test";
import assert from "node:assert/strict";
import {
  formatManagerBytes, managerMaximumUsers, managerRfDetails, managerSdDetails,
  managerOpeningFields,
} from "../js/manager-device-details.js";

test("capacity scales from bytes without losing zero or treating invalid data as capacity", () => {
  for (const language of ["en", "he"]) {
    assert.equal(formatManagerBytes(0, language), "0 B");
    assert.equal(formatManagerBytes(512, language), "512 B");
    assert.equal(formatManagerBytes(1024, language), "1 KB");
    assert.equal(formatManagerBytes(1.5 * 1024 ** 2, language), "1.5 MB");
    assert.equal(formatManagerBytes(32 * 1024 ** 3, language), "32 GB");
  }
  for (const bad of [null, undefined, -1, Infinity, NaN, "1024", {}, 0.5])
    assert.equal(formatManagerBytes(bad), null);
});

test("user capacity comes from negotiated capabilities rather than a flash-size guess", () => {
  assert.equal(managerMaximumUsers({ data: { limits: { maxUsers: 5000 } } }), 5000);
  assert.equal(managerMaximumUsers({ limits: { maxUsers: 1000 } }), 1000);
  assert.equal(managerMaximumUsers({ flashVariantMb: 16 }), null);
  assert.equal(managerMaximumUsers({ limits: { maxUsers: -1 } }), null);
});

test("RF displays the saved 64-bit hex code without inventing state from learning fields", () => {
  assert.deepEqual(managerRfDetails({ rfCode: { present: true, codeHex: "FFFFFFFFFFFFFFFE" } }),
    { present: true, code: "0xFFFFFFFFFFFFFFFE" });
  assert.deepEqual(managerRfDetails({ rfCode: { present: false, codeHex: "AABB" } }),
    { present: false, code: null });
  assert.deepEqual(managerRfDetails({ saved: true, learning: true }), { present: null, code: null });
  for (const codeHex of ["", "0", "0000", "<script>", "ABCDEFABCDEFABCDEF", 123])
    assert.equal(managerRfDetails({ rfCode: { present: true, codeHex } }).code, null);
});

test("SD facts remain distinct from LittleFS and history-file usage; mount failure never means wrong format", () => {
  const legacy = managerSdDetails({ sd: { supported: true, mounted: true },
    littleFs: { totalBytes: 2097152 }, history: { bytes: 1000000, freeBytes: 1000000000 } });
  assert.equal(legacy.capacity, null);
  assert.equal(legacy.format, "unknown");
  const current = managerSdDetails({ sd: { supported: true, mounted: true,
    formatCompatible: true, capacityBytes: 32 * 1024 ** 3, totalBytes: 31 * 1024 ** 3,
    usedBytes: 128 * 1024 ** 2, freeBytes: 30 * 1024 ** 3 } });
  assert.equal(current.capacity, "32 GB");
  assert.equal(current.total, "31 GB");
  assert.equal(current.used, "128 MB");
  assert.equal(current.format, "compatible");
  assert.equal(managerSdDetails({ sd: { supported: true, mounted: false } }).format, "unknown");
  assert.equal(managerSdDetails({ sd: { supported: true, mounted: false,
    formatCompatible: false } }).format, "unknown");
  assert.equal(managerSdDetails({ sd: { supported: false, mounted: true,
    formatCompatible: true, capacityBytes: 1000 } }).capacity, null);
});

test("each opening method shows only the pulse settings it actually uses", () => {
  assert.deepEqual(managerOpeningFields("TOGGLE"), []);
  assert.deepEqual(managerOpeningFields("PUSH_BUTTON"), []);
  assert.deepEqual(managerOpeningFields("PULSE"), ["pulseWidth1Millis"]);
  assert.equal(managerOpeningFields("PULSE_AFTER_PULSE").length, 3);
  assert.equal(managerOpeningFields("PULSE_AFTER_PULSE_AFTER_PULSE").length, 5);
  assert.deepEqual(managerOpeningFields("new-unknown-mode"), []);
});
