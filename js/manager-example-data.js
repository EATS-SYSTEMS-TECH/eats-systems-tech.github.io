// Isolated, per-dashboard sample data. Never passed to the API or relay.
export const managerExampleSystems = Object.freeze([
  Object.freeze({
    id: "example-manager-gate",
    type: "gate",
    systemIds: Object.freeze(["DEMO-24980"]),
    name: "Example WIFIGATE Gate",
    iconId: "barrier-gate-small",
    example: true,
  }),
  Object.freeze({
    id: "example-manager-dual",
    type: "dual-control",
    systemIds: Object.freeze(["DEMO-24981", "DEMO-24982"]),
    name: "Example WIFIGATE Dual Control",
    iconId: "garage-small",
    example: true,
  }),
  Object.freeze({
    id: "example-manager-group",
    type: "group",
    systemIds: Object.freeze([
      "DEMO-24980",
      "DEMO-24981",
      "DEMO-24982",
      "DEMO-24983",
    ]),
    name: "Example WIFIGATE Group",
    example: true,
  }),
]);
export const managerExampleOrganization = Object.freeze({
  id: "example-manager-organization",
  name: "Example WIFIGATE Organization",
});
export const openingMethods = Object.freeze([
  "PULSE",
  "PULSE_AFTER_PULSE",
  "PULSE_AFTER_PULSE_AFTER_PULSE",
  "TOGGLE",
  "PUSH_BUTTON",
]);
export const localOnlyFeatures = Object.freeze([
  "Factory reset",
  "Owner QR / secret",
  "Initial Manager delegation",
  "First network setup / forget network",
  "Phone enrollment",
  "Auto Open enrollment / range",
]);
const clone = (value) => structuredClone(value);
const people = (count, admin = false) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${admin ? "admin" : "resident"}-${i + 1}`,
    countryCode: "972",
    localNumber: `${admin ? "51000" : "50000"}${String(i + 1).padStart(4, "0")}`,
    name: `${admin ? "Demo admin" : "Demo resident"} ${String(i + 1).padStart(2, "0")}`,
    email: `${admin ? "admin" : "resident"}${i + 1}@example.test`,
    floorNumber: i % 8,
    apartmentNumber: i + 1,
    parkingNumber: i + 1,
    enrolled: i < 25,
    autoKey: i < 23,
    allowGuests: i % 3 !== 0,
    allowAutoOpen: true,
    guestGeneration: 1,
  }));
function gate(id, index) {
  return {
    id,
    name: ["Parking gate", "Entry gate", "Exit gate", "Service gate"][index],
    boardMb: index === 1 ? 8 : 16,
    maxUsers: index === 1 ? 1000 : 5000,
    maxAdmins: 20,
    maxEvents: 50,
    maxPageItems: 50,
    users: people(
      index === 0 ? 30 : index === 1 ? 438 : index === 2 ? 120 : 58,
    ),
    admins: people(index === 0 ? 1 : 2, true),
    firmware: "W.10.26.47",
    online: true,
    busy: false,
    lastContact: "2026-10-12T11:22:00Z",
    clock: "2026-10-12T11:22:00Z",
    timezone: "Asia/Jerusalem",
    uptime: "3d 6h",
    gateType: "Parking barrier",
    relayOn: false,
    freeHeap: 164000,
    sensor: true,
    override: "NORMAL",
    revision: 9,
    config: {
      command: "PULSE_AFTER_PULSE",
      pulseWidth1Millis: 800,
      timeBetweenPulses1Seconds: 2,
      pulseWidth2Millis: 800,
      timeBetweenPulses2Seconds: 1,
      pulseWidth3Millis: 800,
    },
    auto: {
      enabled: true,
      pulseWidth1Millis: 1000,
      timeBetweenPulses1Seconds: 1,
      pulseWidth2Millis: 1000,
      cooldownSeconds: 10,
    },
    events: Array.from({ length: 12 }, (_, n) => ({
      id: `event-${n}`,
      day: n % 7,
      start: (n < 7 ? 7 : 17) * 60,
      end: (n < 7 ? 9 : 19) * 60,
      open: n % 2 === 0,
      once: false,
    })),
    guests: [
      {
        id: "guest-1",
        name: "Demo technician",
        inviter: "Demo admin 01",
        opens: 2,
        revoked: false,
      },
    ],
    history: [
      {
        time: "14:20:05",
        actor: "Demo admin 01",
        action: "Open ×2",
        source: "Manager",
        result: "Demo",
      },
      {
        time: "14:02:11",
        actor: "Demo resident 02",
        action: "Open",
        source: "App",
        result: "Demo",
      },
      {
        time: "13:58:40",
        actor: "Demo technician",
        action: "Guest open",
        source: "Guest",
        result: "Demo",
      },
    ],
    remote: { saved: true, learning: false, detected: false },
    networks: [
      { ssid: "Example-Office", rssi: -58, priority: 1 },
      { ssid: "Example-Backup", rssi: -67, priority: 2 },
    ],
    ota: {
      stage: "idle",
      progress: 0,
      previous: "W.10.26.47",
      target: "W.10.26.48",
      result: "",
    },
  };
}
export function createManagerExampleData() {
  const assignments = new Set(managerExampleSystems.map((system) => system.id));
  const gates = new Map(
    ["DEMO-24980", "DEMO-24981", "DEMO-24982", "DEMO-24983"].map((id, i) => [
      id,
      gate(id, i),
    ]),
  );
  const members = [
    { email: "organization-admin@example.test", status: "active" },
    { email: "maintenance@example.test", status: "active" },
  ];
  function requireGate(id) {
    const value = gates.get(id);
    if (!value) throw new Error("EXAMPLE_GATE_NOT_FOUND");
    return value;
  }
  function log(id, action) {
    const value = requireGate(id);
    value.history.unshift({
      time: "14:22:00",
      actor: "Demo operator",
      action,
      source: "Manager demo",
      result: "Demo",
    });
  }
  function available(id) {
    const value = requireGate(id);
    if (!value.online) throw new Error("EXAMPLE_OFFLINE");
    if (value.busy) throw new Error("EXAMPLE_BUSY");
    return value;
  }
  return {
    systems: managerExampleSystems,
    assignments,
    organization: managerExampleOrganization,
    members,
    gate: requireGate,
    log,
    available,
    uniqueGates(systems) {
      const ids = new Set();
      for (const system of systems) {
        const known = managerExampleSystems.find((s) => s.id === system.id);
        if (!known) throw new Error("EXAMPLE_SYSTEM_NOT_FOUND");
        for (const id of known.systemIds) ids.add(id);
      }
      return [...ids];
    },
    importPeople(id, collection, rows, mode) {
      const value = available(id);
      if (
        !["users", "admins"].includes(collection) ||
        !["MERGE", "REPLACE"].includes(mode)
      )
        throw new Error("INVALID_IMPORT");
      const combined = new Map(
        (mode === "MERGE" ? value[collection] : []).map((p) => [
          p.countryCode + p.localNumber,
          p,
        ]),
      );
      for (const [
        countryCode,
        localNumber,
        name,
        email,
        floorNumber,
        apartmentNumber,
        parkingNumber,
      ] of rows) {
        const key = countryCode + localNumber;
        combined.set(key, {
          ...combined.get(key),
          id: `${collection}-${key}`,
          countryCode,
          localNumber,
          name,
          email,
          floorNumber,
          apartmentNumber,
          parkingNumber,
        });
      }
      if (
        combined.size >
        (collection === "admins" ? value.maxAdmins : value.maxUsers)
      )
        throw new Error("EXAMPLE_CAPACITY");
      if (
        collection === "admins" &&
        !combined.has(value.admins[0].countryCode + value.admins[0].localNumber)
      )
        throw new Error("EXAMPLE_DELEGATION_ADMIN");
      value[collection] = [...combined.values()];
      log(id, `${mode} ${collection}: ${rows.length}`);
      return combined.size;
    },
    setConfig(id, config, expectedRevision) {
      const value = available(id);
      if (expectedRevision !== value.revision)
        throw new Error("EXAMPLE_CONFLICT");
      if (!openingMethods.includes(config.command))
        throw new Error("INVALID_CONFIG");
      for (const key of [
        "pulseWidth1Millis",
        "pulseWidth2Millis",
        "pulseWidth3Millis",
      ])
        if (
          !Number.isInteger(config[key]) ||
          config[key] < 1 ||
          config[key] > 60000
        )
          throw new Error("INVALID_CONFIG");
      for (const key of [
        "timeBetweenPulses1Seconds",
        "timeBetweenPulses2Seconds",
      ])
        if (
          !Number.isInteger(config[key]) ||
          config[key] < 0 ||
          config[key] > 60
        )
          throw new Error("INVALID_CONFIG");
      value.config = clone(config);
      if (
        ![
          "PULSE",
          "PULSE_AFTER_PULSE",
          "PULSE_AFTER_PULSE_AFTER_PULSE",
        ].includes(config.command)
      )
        value.auto.enabled = false;
      value.revision++;
      log(id, "Gate configuration changed");
    },
    clear() {
      gates.clear();
      assignments.clear();
      members.length = 0;
    },
  };
}
