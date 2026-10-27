import test from "node:test";
import assert from "node:assert/strict";
import { ManagerExampleConnection } from "../js/manager-example-connection.js";
import {
  createManagerExampleData,
  managerExampleSystems,
} from "../js/manager-example-data.js";

async function fixture(
  system = managerExampleSystems[0],
  data = createManagerExampleData(),
) {
  const states = [];
  const connection = new ManagerExampleConnection({
    data,
    system,
    onState: (s) => states.push(s),
  });
  await connection.open(system.systemIds[0]);
  return { data, connection, states };
}

test("simulation rejects customer identities, wrong gates and commands without a network fallback", async () => {
  assert.throws(
    () =>
      new ManagerExampleConnection({
        data: createManagerExampleData(),
        system: { ...managerExampleSystems[0] },
      }),
    /EXAMPLE_SYSTEM_NOT_FOUND/,
  );
  const { connection, states } = await fixture();
  assert.deepEqual(states, ["waiting", "connecting", "active"]);
  await assert.rejects(connection.open("72488"), /EXAMPLE_GATE_NOT_FOUND/);
  await assert.rejects(
    connection.command("ADMIN_FACTORY_RESET"),
    /EXAMPLE_UNSUPPORTED_COMMAND/,
  );
  connection.close();
  assert.equal(connection.session, null);
  await assert.rejects(
    connection.command("ADMIN_GET_OVERVIEW"),
    /DISCONNECTED/,
  );
});

test("shared physical gates retain simulated changes across gate/group workspaces and reset per dashboard", async () => {
  const { data, connection } = await fixture();
  const snapshot = (await connection.command("ADMIN_GET_GATE_CONFIG")).data;
  await connection.command("ADMIN_SET_GATE_CONFIG", {
    ...snapshot.config,
    command: "TOGGLE",
    expectedRevision: snapshot.revision,
  });
  await assert.rejects(
    connection.command("ADMIN_SET_GATE_CONFIG", {
      ...snapshot.config,
      expectedRevision: snapshot.revision,
    }),
    /EXAMPLE_CONFLICT/,
  );
  connection.close();
  const group = await fixture(managerExampleSystems[2], data);
  assert.equal(
    (await group.connection.command("ADMIN_GET_GATE_CONFIG")).data.config
      .command,
    "TOGGLE",
  );
  assert.equal(
    (await group.connection.command("ADMIN_GET_AUTO_OPEN_CONFIG")).data.config
      .enabled,
    false,
  );
  assert.equal(
    (await fixture()).data.gate("DEMO-24980").config.command,
    "PULSE_AFTER_PULSE",
  );
});

test("people use real paging, edit/delete and protected delegation semantics", async () => {
  const { data, connection } = await fixture();
  const first = (
    await connection.command("ADMIN_LIST_USERS", { page: { limit: 20 } })
  ).data;
  assert.equal(first.items.length, 20);
  assert.equal(first.page.nextCursor, "20");
  const last = (
    await connection.command("ADMIN_LIST_USERS", {
      page: { limit: 20, cursor: first.page.nextCursor },
    })
  ).data;
  assert.equal(last.items.length, 10);
  await assert.rejects(
    connection.command("ADMIN_LIST_USERS", {
      page: { cursor: "customer-token" },
    }),
    /INVALID_CURSOR/,
  );
  const person = { ...first.items[0], name: "Updated demo" };
  await connection.command("ADMIN_UPSERT_USER", {
    ...person,
    expectedRevision: first.revision,
  });
  assert.equal(data.gate("DEMO-24980").users[0].name, "Updated demo");
  const revision = data.gate("DEMO-24980").revision;
  await connection.command("ADMIN_DELETE_USER", {
    ...person,
    expectedRevision: revision,
  });
  assert.equal(data.gate("DEMO-24980").users.length, 29);
  const admin = data.gate("DEMO-24980").admins[0];
  await assert.rejects(
    connection.command("ADMIN_DELETE_ADMIN", {
      ...admin,
      expectedRevision: revision + 1,
    }),
    /EXAMPLE_DELEGATION_ADMIN/,
  );
});

test("imports validate before consent, do not mutate on cancel, and reject late commits after close", async () => {
  const { data, connection } = await fixture();
  const rows = [
    ["972", "509999999", "Added sample", "added@example.test", 0, 0, 0],
  ];
  const gate = data.gate("DEMO-24980");
  const revision = gate.revision;
  assert.deepEqual(
    await connection.importCollection(
      "USERS",
      "MERGE",
      rows,
      revision,
      async () => false,
    ),
    { cancelled: true },
  );
  assert.equal(gate.users.length, 30);
  assert.equal(gate.revision, revision);
  await connection.importCollection(
    "USERS",
    "MERGE",
    rows,
    revision,
    async (validation) => {
      assert.equal(validation.accepted, 1);
      assert.equal(gate.users.length, 30);
      return true;
    },
  );
  assert.equal(gate.users.length, 31);
  assert.equal((await connection.exportCollection("USERS")).length, 31);
  await assert.rejects(
    connection.importCollection(
      "USERS",
      "MERGE",
      rows,
      gate.revision,
      async () => {
        connection.close();
        return true;
      },
    ),
    /DISCONNECTED/,
  );
  assert.equal(gate.users.length, 31);
});

test("imports preserve protected administrator and enforce per-board capacity atomically", async () => {
  const { data, connection } = await fixture(managerExampleSystems[1]);
  const gate = data.gate("DEMO-24981"),
    revision = gate.revision;
  const rows = Array.from({ length: 1001 }, (_, i) => [
    "972",
    String(550000000 + i),
    "Demo",
    "demo@example.test",
    0,
    0,
    0,
  ]);
  let confirmations = 0;
  await assert.rejects(
    connection.importCollection(
      "USERS",
      "REPLACE",
      rows,
      revision,
      async () => {
        confirmations++;
        return true;
      },
    ),
    /EXAMPLE_CAPACITY/,
  );
  assert.equal(confirmations, 0);
  assert.equal(gate.users.length, 438);
  await assert.rejects(
    connection.importCollection(
      "ADMINS",
      "REPLACE",
      rows.slice(0, 1),
      revision,
      async () => true,
    ),
    /EXAMPLE_DELEGATION_ADMIN/,
  );
  assert.equal(gate.admins.length, 2);
  assert.equal(gate.revision, revision);
});

test("events, Auto Open, RF learning and history respond through the actual workspace contract", async () => {
  const { connection, data } = await fixture();
  const events = (await connection.command("ADMIN_LIST_EVENTS")).data;
  await connection.command("ADMIN_SET_EVENTS", {
    ...events,
    items: events.items.slice(1),
    expectedRevision: events.revision,
  });
  assert.equal(
    (await connection.command("ADMIN_LIST_EVENTS")).data.items.length,
    11,
  );
  const auto = (await connection.command("ADMIN_GET_AUTO_OPEN_CONFIG")).data;
  await connection.command("ADMIN_SET_AUTO_OPEN_CONFIG", {
    ...auto.config,
    enabled: false,
    expectedRevision: auto.revision,
  });
  assert.equal(data.gate("DEMO-24980").auto.enabled, false);
  const remote = (await connection.command("ADMIN_RF_GET")).data;
  const learning = (await connection.command("ADMIN_RF_LEARN_START")).data;
  await assert.rejects(
    connection.command("ADMIN_RF_LEARN_SAVE", {
      operationId: learning.operationId,
      expectedRevision: remote.revision,
    }),
    /NO_RF_OPERATION/,
  );
  await connection.command("ADMIN_RF_LEARN_STATUS", {
    operationId: learning.operationId,
  });
  await connection.command("ADMIN_RF_LEARN_SAVE", {
    operationId: learning.operationId,
    expectedRevision: remote.revision,
  });
  assert.equal(data.gate("DEMO-24980").remote.learning, false);
  const days = (await connection.command("ADMIN_LIST_HISTORY", {})).data;
  const history = (
    await connection.command("ADMIN_LIST_HISTORY", { dayKey: days.days[0][0] })
  ).data;
  assert.ok(history.items.length >= 3);
  assert.equal(history.items[2].length, 15);
  assert.equal(
    (await connection.command("ADMIN_GET_STORAGE_HEALTH")).data.sd.mounted,
    true,
  );
});

test("reordering administrator CSV rows never changes the protected delegation identity", async () => {
  const { connection, data } = await fixture();
  const gate = data.gate("DEMO-24980"),
    backing = gate.admins[0];
  const added = [
    "972",
    "509999999",
    "Other admin",
    "other@example.test",
    0,
    0,
    0,
  ];
  const backingRow = [
    backing.countryCode,
    backing.localNumber,
    backing.name,
    backing.email,
    0,
    0,
    0,
  ];
  await connection.importCollection(
    "ADMINS",
    "REPLACE",
    [added, backingRow],
    gate.revision,
    async () => true,
  );
  await assert.rejects(
    connection.command("ADMIN_DELETE_ADMIN", {
      ...backing,
      expectedRevision: gate.revision,
    }),
    /EXAMPLE_DELEGATION_ADMIN/,
  );
  await connection.command("ADMIN_DELETE_ADMIN", {
    countryCode: added[0],
    localNumber: added[1],
    expectedRevision: gate.revision,
  });
  assert.equal(gate.admins.length, 1);
  assert.equal(gate.admins[0].localNumber, backing.localNumber);
});
