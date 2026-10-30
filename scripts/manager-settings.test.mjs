import test from "node:test";
import assert from "node:assert/strict";
import { managerDefaultTimings, managerOpeningMethods, managerTimingFields, managerSettingsPayload } from "../js/manager-settings.js";

const saved = Object.freeze({
  command: "PULSE_AFTER_PULSE_AFTER_PULSE",
  pulseWidth1Millis: 1000,
  timeBetweenPulses1Seconds: 5,
  pulseWidth2Millis: 2000,
  timeBetweenPulses2Seconds: 10,
  pulseWidth3Millis: 3000,
});
const fields = ["pulseWidth1Millis", "timeBetweenPulses1Seconds", "pulseWidth2Millis", "timeBetweenPulses2Seconds", "pulseWidth3Millis"];

test("Manager opening methods expose exactly the timing steps used by each method", () => {
  assert.deepEqual(managerOpeningMethods, ["PULSE", "PULSE_AFTER_PULSE", "PULSE_AFTER_PULSE_AFTER_PULSE", "TOGGLE", "PUSH_BUTTON"]);
  assert.equal(Object.isFrozen(managerOpeningMethods), true);
  for (const [index, count] of [1, 3, 5, 0, 0].entries())
    assert.deepEqual(managerTimingFields(managerOpeningMethods[index]), fields.slice(0, count));
  const first = managerTimingFields("PULSE");
  first.push("unexpected");
  assert.deepEqual(managerTimingFields("PULSE"), [fields[0]]);
});

test("Manager settings preserve saved inactive timings instead of changed hidden draft values", () => {
  const altered = Object.fromEntries(fields.map((key) => [key, "not-a-number"]));
  for (const command of ["TOGGLE", "PUSH_BUTTON"])
    assert.deepEqual(managerSettingsPayload(saved, { ...altered, command }, 42), { ...saved, command, expectedRevision: 42 });
  assert.deepEqual(managerSettingsPayload(saved, {
    ...altered, command: "PULSE", pulseWidth1Millis: "1500",
  }, 7), { ...saved, command: "PULSE", pulseWidth1Millis: 1500, expectedRevision: 7 });
  assert.deepEqual(managerSettingsPayload(saved, {
    ...altered, command: "PULSE_AFTER_PULSE", pulseWidth1Millis: "500", timeBetweenPulses1Seconds: "1", pulseWidth2Millis: "60000",
  }, 8), { ...saved, command: "PULSE_AFTER_PULSE", pulseWidth1Millis: 500, timeBetweenPulses1Seconds: 1, pulseWidth2Millis: 60000, expectedRevision: 8 });
  assert.equal(saved.command, "PULSE_AFTER_PULSE_AFTER_PULSE");
});

test("Manager settings validate every pulse and gap boundary against the firmware contract", () => {
  for (const key of fields) {
    const isGap = key.startsWith("timeBetween"), min = isGap ? 1 : 500, max = isGap ? 300 : 60000;
    for (const value of [min, max, String(min), String(max)]) {
      const payload = managerSettingsPayload(saved, { ...saved, [key]: value }, 1);
      assert.equal(payload[key], Number(value));
    }
    for (const value of [min - 1, max + 1, min + 0.5, NaN, Infinity, "", "bad"])
      assert.throws(() => managerSettingsPayload(saved, { ...saved, [key]: value }, 1), /INVALID_CONFIG/, `${key} rejected ${value}`);
  }
  for (const command of ["UNKNOWN", "", 3, null, undefined])
    assert.throws(() => managerSettingsPayload(saved, { ...saved, command }, 1), /INVALID_CONFIG/);
});

test("default pulse durations are five seconds in protocol milliseconds",()=>{assert.equal(managerDefaultTimings.pulseWidth1Millis,5000);assert.equal(managerDefaultTimings.pulseWidth2Millis,5000);assert.equal(managerDefaultTimings.pulseWidth3Millis,5000);assert.equal(Object.isFrozen(managerDefaultTimings),true);});
