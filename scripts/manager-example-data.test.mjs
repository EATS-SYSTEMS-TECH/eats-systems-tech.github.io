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
