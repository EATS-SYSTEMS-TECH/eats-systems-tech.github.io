import {
  createManagerExampleData,
  managerExampleSystems,
} from "./manager-example-data.js";
import { encodeManagerCsv, parseManagerCsv } from "./manager-csv.js";

const clone = (value) => structuredClone(value);
const personRow = ({
  countryCode,
  localNumber,
  name,
  email,
  floorNumber,
  apartmentNumber,
  parkingNumber,
}) => [
  countryCode,
  localNumber,
  name,
  email,
  floorNumber,
  apartmentNumber,
  parkingNumber,
];
const personRecord = (value) =>
  Object.fromEntries(
    [
      "countryCode",
      "localNumber",
      "name",
      "email",
      "floorNumber",
      "apartmentNumber",
      "parkingNumber",
    ].map((key) => [key, value[key]]),
  );

// Implements the real workspace's connection contract in memory. There is no
// network/API/Auth/WebSocket/storage dependency and no real-connection fallback.
export class ManagerExampleConnection {
  constructor({ data, system, onState = () => {} }) {
    if (!managerExampleSystems.includes(system))
      throw new Error("EXAMPLE_SYSTEM_NOT_FOUND");
    this.data = data;
    this.system = system;
    this.onState = onState;
    this.closed = false;
    this.session = null;
    this.gateId = null;
    this.transfer = false;
    this.busy = false;
  }
  async open(gateId) {
    if (this.closed) throw new Error("CANCELLED");
    if (!this.system.systemIds.includes(gateId))
      throw new Error("EXAMPLE_GATE_NOT_FOUND");
    this.data.available(gateId);
    this.onState("waiting");
    await Promise.resolve();
    if (this.closed) throw new Error("CANCELLED");
    this.onState("connecting");
    this.gateId = gateId;
    this.session = { simulation: true };
    this.onState("active");
  }
  gate(expectedRevision) {
    if (this.closed || !this.session) throw new Error("DISCONNECTED");
    const gate = this.data.available(this.gateId);
    if (expectedRevision !== undefined && expectedRevision !== gate.revision)
      throw new Error("EXAMPLE_CONFLICT");
    return gate;
  }
  async command(command, payload = {}) {
    const gate = this.gate(payload.expectedRevision);
    let value;
    switch (command) {
      case "ADMIN_GET_OVERVIEW":
        value = {
          systemId: gate.id,
          systemName: gate.name,
          firmwareVersion: gate.firmware,
          flashVariantMb: gate.boardMb,
          users: gate.users.length,
          admins: gate.admins.length,
          events: gate.events.length,
          state: "OK",
          historyAvailable: true,
        };
        break;
      case "ADMIN_GET_GATE_CONFIG":
        value = { config: clone(gate.config), revision: gate.revision };
        break;
      case "ADMIN_SET_GATE_CONFIG": {
        const { expectedRevision, ...config } = payload;
        this.data.setConfig(gate.id, config, expectedRevision);
        value = { revision: gate.revision };
        break;
      }
      case "ADMIN_REMOTE_OPEN":
        if (payload.expectedGateCommand !== gate.config.command)
          throw new Error("EXAMPLE_CONFLICT");
        if (gate.override === "FORCE_NC")
          throw new Error("EXAMPLE_HELD_CLOSED");
        if (
          gate.config.command === "TOGGLE" &&
          !["ON", "OFF"].includes(payload.state)
        )
          throw new Error("INVALID_CONFIG");
        gate.relayOn = payload.state === "ON";
        this.data.log(gate.id, "Open");
        value = { accepted: true, simulation: true };
        break;
      case "ADMIN_LIST_USERS":
      case "ADMIN_LIST_ADMINS": {
        const collection = command === "ADMIN_LIST_USERS" ? "users" : "admins";
        const query = String(payload.query ?? "").toLowerCase();
        const rows = gate[collection].filter((person) =>
          Object.values(person).some((v) =>
            String(v).toLowerCase().includes(query),
          ),
        );
        const start = this.cursor(payload.page?.cursor);
        const limit = this.limit(payload.page?.limit);
        value = {
          items: rows.slice(start, start + limit).map(personRecord),
          revision: gate.revision,
          page: {
            nextCursor:
              start + limit < rows.length ? String(start + limit) : null,
          },
        };
        break;
      }
      case "ADMIN_UPSERT_USER":
      case "ADMIN_UPSERT_ADMIN": {
        const collection = command === "ADMIN_UPSERT_USER" ? "users" : "admins";
        const rows = parseManagerCsv(encodeManagerCsv([personRow(payload)]));
        this.data.importPeople(gate.id, collection, rows, "MERGE");
        gate.revision++;
        value = { revision: gate.revision };
        break;
      }
      case "ADMIN_DELETE_USER":
      case "ADMIN_DELETE_ADMIN": {
        const collection = command === "ADMIN_DELETE_USER" ? "users" : "admins";
        const index = gate[collection].findIndex(
          (p) =>
            p.countryCode === payload.countryCode &&
            p.localNumber === payload.localNumber,
        );
        if (
          collection === "admins" &&
          this.data.isDelegationAdmin(gate.id, payload)
        )
          throw new Error("EXAMPLE_DELEGATION_ADMIN");
        if (index >= 0) gate[collection].splice(index, 1);
        gate.revision++;
        this.data.log(gate.id, "Person removed");
        value = { revision: gate.revision };
        break;
      }
      case "ADMIN_LIST_EVENTS":
        value = {
          today: "2026-10-27",
          revision: gate.revision,
          items: gate.events.map((event) => [
            event.day,
            event.open ? 0 : 1,
            event.start,
            event.end,
            ...(event.once ? ["2026-10-27"] : []),
          ]),
        };
        break;
      case "ADMIN_SET_EVENTS":
        if (
          !Array.isArray(payload.items) ||
          payload.items.length > gate.maxEvents ||
          payload.items.some(
            (e) =>
              !Array.isArray(e) ||
              !Number.isInteger(e[0]) ||
              e[0] < 0 ||
              e[0] > 6 ||
              ![0, 1].includes(e[1]) ||
              !Number.isInteger(e[2]) ||
              !Number.isInteger(e[3]) ||
              e[2] < 0 ||
              e[3] > 1440 ||
              e[2] >= e[3] ||
              e[2] % 10 ||
              e[3] % 10,
          )
        )
          throw new Error("INVALID_EVENT");
        gate.events = payload.items.map((e, index) => ({
          id: `event-${index}`,
          day: e[0],
          open: e[1] === 0,
          start: e[2],
          end: e[3],
          once: e.length === 5,
        }));
        gate.revision++;
        this.data.log(gate.id, "Events changed");
        value = { revision: gate.revision };
        break;
      case "ADMIN_LIST_HISTORY": {
        const day = "20261027";
        const start = this.cursor(payload.page?.cursor),
          limit = this.limit(payload.page?.limit);
        const rows = gate.history.map((entry, index) => [
          index,
          Date.parse(`2026-10-27T${entry.time}+03:00`) / 1000,
          180,
          0,
          0,
          1,
          entry.source === "Guest" ? 3 : 9,
          entry.source === "Guest" ? 3 : 1,
          0,
          0,
          0,
          0,
          0,
          entry.actor,
          "",
        ]);
        value = payload.dayKey
          ? {
              items:
                payload.dayKey === day ? rows.slice(start, start + limit) : [],
              page: {
                nextCursor:
                  payload.dayKey === day && start + limit < rows.length
                    ? String(start + limit)
                    : null,
              },
            }
          : { days: [[day, rows.length]], page: { nextCursor: null } };
        break;
      }
      case "ADMIN_GET_AUTO_OPEN_CONFIG":
        value = { config: clone(gate.auto), revision: gate.revision };
        break;
      case "ADMIN_SET_AUTO_OPEN_CONFIG":
        if (payload.enabled && !gate.config.command.startsWith("PULSE"))
          throw new Error("INVALID_CONFIG");
        gate.auto.enabled = Boolean(payload.enabled);
        gate.revision++;
        this.data.log(gate.id, "Auto Open changed");
        value = { revision: gate.revision };
        break;
      case "ADMIN_RF_GET":
        value = {
          saved: gate.remote.saved,
          learning: gate.remote.learning,
          revision: gate.revision,
        };
        break;
      case "ADMIN_RF_LEARN_START":
        gate.remote.learning = true;
        gate.remote.detected = false;
        this.operationId = `example-rf-${gate.id}`;
        value = { operationId: this.operationId, state: "LEARNING" };
        break;
      case "ADMIN_RF_LEARN_STATUS":
      case "ADMIN_RF_LEARN_SAVE":
      case "ADMIN_RF_LEARN_CANCEL":
        if (
          !this.operationId ||
          payload.operationId !== this.operationId ||
          !gate.remote.learning
        )
          throw new Error("NO_RF_OPERATION");
        if (command.endsWith("STATUS")) gate.remote.detected = true;
        if (command.endsWith("SAVE")) {
          if (!gate.remote.detected) throw new Error("NO_RF_OPERATION");
          gate.remote.saved = true;
          gate.remote.learning = false;
          gate.revision++;
          this.data.log(gate.id, "Remote saved");
        }
        if (command.endsWith("CANCEL")) gate.remote.learning = false;
        value = {
          operationId: this.operationId,
          detected: gate.remote.detected,
          saved: gate.remote.saved,
          learning: gate.remote.learning,
        };
        break;
      case "ADMIN_GET_STORAGE_HEALTH":
        value = {
          credentialReplicasHealthy: true,
          littleFs: {
            mounted: true,
            writable: true,
            totalBytes: 2097152,
            usedBytes: 327680,
          },
          sd: { supported: gate.boardMb === 16, mounted: gate.boardMb === 16 },
          history: { available: true },
        };
        break;
      default:
        throw new Error("EXAMPLE_UNSUPPORTED_COMMAND");
    }
    return { data: clone(value) };
  }
  cursor(value) {
    if (value === null || value === undefined) return 0;
    if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)))
      throw new Error("INVALID_CURSOR");
    return Number(value);
  }
  limit(value = 20) {
    if (!Number.isInteger(value) || value < 1 || value > 50)
      throw new Error("INVALID_LIMIT");
    return value;
  }
  collection(value) {
    if (!["USERS", "ADMINS"].includes(value)) throw new Error("INVALID_IMPORT");
    return value.toLowerCase();
  }
  async exportCollection(collection, onProgress = () => {}) {
    const gate = this.gate();
    const rows = gate[this.collection(collection)].map(personRow);
    onProgress(new TextEncoder().encode(encodeManagerCsv(rows)).length);
    return clone(rows);
  }
  async importCollection(
    collection,
    mode,
    rows,
    expectedRevision,
    confirmCommit,
    onProgress = () => {},
  ) {
    const gate = this.gate(expectedRevision),
      key = this.collection(collection);
    const normalized = parseManagerCsv(encodeManagerCsv(rows));
    // Validate capacity/delegation without mutating the live simulation before consent.
    const preview = createManagerExampleData();
    const target = preview.gate(gate.id);
    target.users = clone(gate.users);
    target.admins = clone(gate.admins);
    try {
      preview.importPeople(gate.id, key, normalized, mode);
    } finally {
      preview.clear();
    }
    const snapshot = clone(normalized);
    onProgress(snapshot.length, snapshot.length);
    if (
      !(await confirmCommit({
        accepted: snapshot.length,
        rejected: 0,
        valid: true,
      }))
    )
      return { cancelled: true };
    this.gate(expectedRevision);
    this.data.importPeople(gate.id, key, snapshot, mode);
    gate.revision++;
    return {
      revision: gate.revision,
      accepted: snapshot.length,
      simulation: true,
    };
  }
  close() {
    this.closed = true;
    this.session = null;
    this.gateId = null;
    this.operationId = null;
  }
}
