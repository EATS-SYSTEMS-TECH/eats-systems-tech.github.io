import test from "node:test";
import assert from "node:assert/strict";
import {
  createManagerExampleData,
  managerExampleSystems,
} from "../js/manager-example-data.js";

test("sample gates have independent per-dashboard data and deduplicate overlapping systems", () => {
  const a = createManagerExampleData(),
    b = createManagerExampleData();
  assert.equal(a.uniqueGates(managerExampleSystems).length, 4);
  assert.equal(a.gate("DEMO-24980").users.length, 30);
  assert.equal(a.gate("DEMO-24980").admins.length, 1);
  assert.equal(a.gate("DEMO-24980").maxUsers, 5000);
  assert.equal(a.gate("DEMO-24981").maxUsers, 1000);
  a.gate("DEMO-24980").users.pop();
  assert.equal(b.gate("DEMO-24980").users.length, 30);
  assert.throws(
    () =>
      a.uniqueGates([{ id: "customer-system", systemIds: ["customer-gate"] }]),
    /EXAMPLE_SYSTEM_NOT_FOUND/,
  );
  assert.throws(() => a.gate("customer-gate"), /EXAMPLE_GATE_NOT_FOUND/);
  a.clear();
  assert.throws(() => a.gate("DEMO-24980"), /EXAMPLE_GATE_NOT_FOUND/);
});
test("sample imports enforce each board's capacity and preserve the delegation administrator", () => {
  const data = createManagerExampleData();
  const rows = Array.from({ length: 1001 }, (_, i) => [
    "972",
    String(550000000 + i),
    "Sample",
    "sample@example.test",
    0,
    0,
    0,
  ]);
  assert.throws(
    () => data.importPeople("DEMO-24981", "users", rows, "REPLACE"),
    /EXAMPLE_CAPACITY/,
  );
  assert.equal(data.gate("DEMO-24981").users.length, 438);
  assert.equal(data.importPeople("DEMO-24980", "users", rows, "REPLACE"), 1001);
  assert.throws(
    () =>
      data.importPeople("DEMO-24980", "admins", rows.slice(0, 1), "REPLACE"),
    /EXAMPLE_DELEGATION_ADMIN/,
  );
  assert.equal(data.gate("DEMO-24980").admins.length, 1);
  data.gate("DEMO-24980").online = false;
  assert.throws(
    () => data.importPeople("DEMO-24980", "users", rows, "MERGE"),
    /EXAMPLE_OFFLINE/,
  );
});
test("sample configuration respects revisions, idle state and Auto Open compatibility", () => {
  const data = createManagerExampleData(),
    gate = data.gate("DEMO-24980");
  const config = { ...gate.config, command: "TOGGLE" };
  gate.busy = true;
  assert.throws(
    () => data.setConfig(gate.id, config, gate.revision),
    /EXAMPLE_BUSY/,
  );
  gate.busy = false;
  assert.throws(() => data.setConfig(gate.id, config, 1), /EXAMPLE_CONFLICT/);
  data.setConfig(gate.id, config, 9);
  assert.equal(gate.revision, 10);
  assert.equal(gate.auto.enabled, false);
  assert.equal(gate.history[0].action, "Gate configuration changed");
});

test("CSV replacement preserves enrollment and permissions for retained phones and removes omitted identities", () => {
  const data = createManagerExampleData(), gate = data.gate("DEMO-24980");
  const resident = gate.users[0];
  resident.allowAutoOpen = false;
  resident.allowGuests = false;
  resident.guestGeneration = 7;
  data.importPeople(gate.id, "users", [
    [resident.countryCode, resident.localNumber, "Updated retained resident", "updated@example.test", 5, 8, 10],
    ["972", "509999999", "New resident", "new@example.test", 0, 0, 0],
  ], "REPLACE");
  assert.equal(gate.users.length, 2);
  const kept = gate.users.find((p) => p.localNumber === resident.localNumber);
  assert.equal(kept.name, "Updated retained resident");
  assert.equal(kept.enrolled, true);
  assert.equal(kept.autoKey, true);
  assert.equal(kept.allowAutoOpen, false);
  assert.equal(kept.allowGuests, false);
  assert.equal(kept.guestGeneration, 7);
  assert.equal(gate.users.find((p) => p.name === "New resident").autoKey, undefined);
});
