// Screens of the Host dashboard for visual and UX review: every view, sheet
// and dialog, per persona, in Hebrew and English, on a desktop (1440x900), a
// phone (390x844) and a small phone (320x568); the picker, Pay and Manager;
// and the product pill's place at the in-between widths (960, 1100, 1279).
// The real pages run against a mocked Firebase Auth and an in-memory Host API
// answered from this process (page routes, like the dashboard browser
// tests), so nothing leaves the machine.
//
//   node scripts/host-dashboard-screens.mjs [--out <folder>] [--keep]
//     [--persona a,b] [--lang he|en] [--width 1440|390|320] [--shot <part>]
//
// Each picture is <persona>-<screen>-<lang>-<width>.png. report.json next to
// them lists what the page itself can measure: sideways scroll, boxes past
// the screen edge, cut text, touch targets under 44px on the phone, Latin
// words on Hebrew screens, technical words outside "For your developer" and a
// product pill away from the centre of the window.
import { createServer } from "node:http";
import {
  readFile,
  stat,
  mkdir,
  rm,
  writeFile,
  readdir,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { tmpdir } from "node:os";
import { chromium } from "playwright-core";
import { rolePermissions } from "./host-test-shell.mjs";
import { demoGuestLink } from "../js/host-demo-link.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const { values: options } = parseArgs({
  options: {
    out: {
      type: "string",
      default: path.join(tmpdir(), "wifigate-host-screens"),
    },
    persona: { type: "string" },
    lang: { type: "string" },
    width: { type: "string" },
    shot: { type: "string" },
    keep: { type: "boolean", default: false },
  },
});
const pick = (value) => (value ? value.split(",") : undefined);
const only = {
  persona: pick(options.persona),
  lang: pick(options.lang),
  width: pick(options.width)?.map(Number),
  shot: options.shot,
};
const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 568 },
];
// Widths between the phone and the wide desktop, where only the place of the
// product pill is checked (and pictured).
const pillWidths = [960, 1100, 1279];
const languages = ["he", "en"];

// ---------------------------------------------------------------- fixtures
const day = (days = 0) =>
  new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const at = (days, time) => `${day(days)}T${time}:00.000Z`;
const words = {
  he: {
    org: "מלון חוף הים",
    otherOrg: "דירות העיר",
    invitingOrg: "מלון דן אילת",
    oldOrg: "צימר בגליל",
    room101: "חדר 101",
    room102: "חדר 102",
    pool: "שער הבריכה",
    parking: "חניון",
    lobby: "דלת הלובי",
    floors: "קומות 1-3",
    guests: ["נועה לוי", "יוסי כהן", "מיכל אברהם", "דוד מזרחי", "שירה פרץ"],
    person: "דנה לוי",
  },
  en: {
    org: "Seaside Hotel",
    otherOrg: "City Apartments",
    invitingOrg: "Harbour Inn",
    oldOrg: "Galilee Cabins",
    room101: "Room 101",
    room102: "Room 102",
    pool: "Pool gate",
    parking: "Parking",
    lobby: "Lobby door",
    floors: "Floors 1-3",
    guests: [
      "Noa Levi",
      "Sam Cohen",
      "Michelle Abraham",
      "David Mizrahi",
      "Shira Peretz",
    ],
    person: "Dana Levi",
  },
};

const organization = (id, name, role, extra = {}) => ({
  id,
  name,
  timezone: "Asia/Jerusalem",
  version: 1,
  membership: { role },
  workspace: {
    role,
    permissions: rolePermissions[role],
    service: { state: "legacy-active", available: true },
  },
  ...extra,
});
const stamp = "2026-10-01T10:00:00.000Z";
const gateIds = (id, type) =>
  type === "gate"
    ? [`${id}-g`]
    : type === "dual-control"
      ? [`${id}-a`, `${id}-b`]
      : [`${id}-a`, `${id}-b`, `${id}-c`];
const personal = (id, type, name, iconId, linkedOrganization = null) => ({
  id,
  type,
  targetId: `${id}-target`,
  systemIds: gateIds(id, type),
  name,
  iconId,
  status: "active",
  linkedOrganization,
  version: 2,
  createdAt: stamp,
  updatedAt: stamp,
});
const orgSystem = (id, type, name, iconId, source) => ({
  id,
  type,
  targetId: `${id}-target`,
  systemIds: gateIds(id, type),
  name,
  iconId,
  status: "active",
  version: 4,
  source,
  createdAt: stamp,
  updatedAt: stamp,
});
const reservation = (id, system, guest, from, to, extra = {}) => ({
  id,
  systemId: system.id,
  systemName: system.name,
  targetIds: [system.id],
  guest: { name: guest, phone: "+972501234567" },
  startsAt: from,
  endsAt: to,
  status: "confirmed",
  version: 1,
  timezone: "Asia/Jerusalem",
  note: "",
  ...extra,
});

// One persona's world in one language.
function world(persona, lang) {
  const w = words[lang];
  const email = "dana@seaside.example";
  const seaside = (role) => organization("seaside", w.org, role);
  const orgSystems = [
    orgSystem("room-101", "gate", w.room101, "bed-outline", {
      kind: "personal",
      ownerEmail: email,
    }),
    orgSystem("room-102", "gate", w.room102, "bed-outline", {
      kind: "organization",
    }),
    orgSystem("lobby", "gate", w.lobby, "door-small", { kind: "organization" }),
    orgSystem("floors", "group", w.floors, "hosting", {
      kind: "organization",
    }),
  ];
  const [room101, room102, lobby, floors] = orgSystems;
  const g = w.guests;
  const reservations = [
    reservation("b1", room101, g[0], at(-1, "12:00"), at(2, "08:00"), {
      externalReference: "A-1042",
    }),
    reservation("b2", room102, g[1], at(0, "12:00"), at(1, "08:00"), {
      status: "draft",
    }),
    reservation("b3", lobby, g[2], at(1, "12:00"), at(4, "08:00")),
    reservation("b4", floors, g[3], at(3, "12:00"), at(6, "08:00"), {
      status: "changed",
    }),
    reservation("b5", room101, g[4], at(5, "12:00"), at(7, "08:00"), {
      status: "cancelled",
    }),
    reservation("b6", room102, g[0], at(-6, "12:00"), at(-4, "08:00")),
  ];
  const team = [
    { id: "m1", email, role: "owner", status: "active" },
    { id: "m2", email: "avi@seaside.example", role: "admin", status: "active" },
    {
      id: "m3",
      email: "front.desk@seaside.example",
      role: "staff",
      status: "active",
    },
    {
      id: "m4",
      email: "accounts@seaside.example",
      role: "viewer",
      status: "blocked",
    },
  ];
  const org = {
    systems: { seaside: orgSystems },
    reservations: { seaside: reservations },
    members: { seaside: team },
    invitations: {
      seaside: [
        {
          id: "inv-1",
          email: "night.shift@seaside.example",
          role: "staff",
          status: "pending",
          version: 1,
          expiresAt: at(6, "09:00"),
        },
      ],
    },
    grants: {
      b1: [
        {
          id: "grant-b1",
          reservationId: "b1",
          reservationVersion: 1,
          status: "issued",
          createdAt: at(-1, "09:00"),
          effectiveStartsAt: at(-1, "11:00"),
          effectiveEndsAt: at(2, "09:00"),
        },
      ],
    },
    apiKeys: {
      seaside: [
        {
          id: "key-1",
          name: lang === "he" ? "אתר ההזמנות" : "Booking website",
          prefix: "wfg_live_4f2a",
          status: "active",
          version: 1,
          scopes: ["reservations:write"],
          targetTypes: ["gate"],
          createdAt: stamp,
        },
      ],
    },
    mappings: {
      "seaside/cloudbeds": [
        {
          id: "map-1",
          provider: "cloudbeds",
          providerRoomId: "212",
          systemId: "room-101",
          status: "active",
          version: 1,
        },
      ],
    },
    policy: {
      seaside: {
        id: "organization",
        enabled: true,
        earlyAccessMinutes: 60,
        lateExpiryMinutes: 60,
        channel: "none",
        version: 2,
      },
    },
  };
  const invite = (role) => ({
    id: "join-1",
    clientId: "harbour",
    organizationName: w.invitingOrg,
    role,
    product: "host",
    version: 1,
    expiresAt: at(5, "10:00"),
  });
  const base = {
    lang,
    email,
    displayName: w.person,
    mfa: { enrolled: true, verified: true },
    host: { state: "active", role: null, organizations: 0 },
    pay: { state: "no-plan" },
    manager: { state: "no-plan" },
    organizations: [],
    mySystems: [],
    incoming: [],
    failures: {},
    systems: {},
    reservations: {},
    members: {},
    invitations: {},
    grants: {},
    apiKeys: {},
    mappings: {},
    policy: {},
    created: 0,
  };
  switch (persona) {
    case "operator":
      return {
        ...base,
        email: "ops@wifigate.example",
        displayName: lang === "he" ? "רון המפעיל" : "Ron Operator",
        host: { state: "active", role: "admin", organizations: 0 },
        pay: { state: "active" },
        manager: { state: "active" },
      };
    case "planholder":
      return {
        ...base,
        host: { state: "active", role: "user", organizations: 0 },
        mySystems: [
          personal("home-gate", "gate", w.room101, "bed-outline", {
            id: "galilee",
            name: w.oldOrg,
          }),
          personal("pool", "dual-control", w.pool, "barrier-gate-small"),
        ],
        failures: {
          "POST /api/v1/me/systems/home-gate/unlink": {
            status: 409,
            code: "SYSTEM_HAS_BOOKINGS",
            details: { count: 3 },
          },
        },
      };
    case "planowner":
      return {
        ...base,
        ...org,
        host: { state: "active", role: "user", organizations: 1 },
        organizations: [seaside("owner")],
        incoming: [invite("staff")],
        mySystems: [
          personal("room-101", "gate", w.room101, "bed-outline", {
            id: "seaside",
            name: w.org,
          }),
          personal("pool", "dual-control", w.pool, "barrier-gate-small"),
          personal("parking", "group", w.parking, "garage"),
        ],
        failures: {
          "POST /api/v1/me/systems/room-101/unlink": {
            status: 409,
            code: "SYSTEM_HAS_BOOKINGS",
            details: { count: 2 },
          },
          "POST /api/v1/organizations/seaside/systems/lobby/remove": {
            status: 409,
            code: "SYSTEM_HAS_BOOKINGS",
            details: { count: 1 },
          },
        },
      };
    case "orgadmin":
    case "orgstaff":
    case "orgviewer": {
      const role = persona.slice(3);
      return {
        ...base,
        ...org,
        email: `${role}@seaside.example`,
        displayName: lang === "he" ? "אבי שושן" : "Avi Shoshan",
        mfa: { enrolled: role === "admin", verified: role === "admin" },
        host: { state: "active", role: null, organizations: 1 },
        organizations: [seaside(role)],
        failures: {
          "POST /api/v1/organizations/seaside/systems/lobby/remove": {
            status: 409,
            code: "SYSTEM_HAS_BOOKINGS",
            details: { count: 1 },
          },
        },
      };
    }
    case "pending":
      return {
        ...base,
        email: "new.manager@example.com",
        displayName: lang === "he" ? "מאיה ברק" : "Maya Barak",
        mfa: { enrolled: false, verified: false },
        host: { state: "pending" },
        incoming: [invite("admin")],
      };
    default:
      throw new Error(`Unknown persona ${persona}`);
  }
}

// ---------------------------------------------------------------- Host API
const overlaps = (a, b) =>
  Date.parse(a.startsAt) < Date.parse(b.endsAt) &&
  Date.parse(a.endsAt) > Date.parse(b.startsAt);
const paged = (items, query, size = 100) => {
  const offset = Number(query.get("cursor") ?? 0);
  const limit = Math.min(size, Number(query.get("limit") ?? size));
  return {
    items: items.slice(offset, offset + limit),
    nextCursor: offset + limit < items.length ? String(offset + limit) : null,
  };
};

function profile(state) {
  return {
    user: {
      uid: "screens-user",
      email: state.email,
      displayName: state.displayName,
      emailVerified: true,
    },
    mfa: state.mfa,
    products: { host: state.host, pay: state.pay, manager: state.manager },
  };
}

// The Host API: [status, body].
function answer(state, method, url, body) {
  const call = `${method} ${url.pathname}`;
  const query = url.searchParams;
  const failure = state.failures[call];
  if (failure)
    return [
      failure.status,
      {
        error: {
          code: failure.code,
          message: failure.code,
          ...(failure.details ? { details: failure.details } : {}),
        },
      },
    ];
  const p = url.pathname;
  if (p === "/api/v1/platform/me") return [200, profile(state)];
  if (p === "/api/v1/auth/invitations")
    return [200, { items: state.incoming, nextCursor: null }];
  let match = /^\/api\/v1\/auth\/invitations\/([^/]+)\/accept$/.exec(p);
  if (match) return [200, { member: { role: state.incoming[0]?.role } }];
  if (p === "/api/v1/organizations")
    return [200, { organizations: state.organizations, nextCursor: null }];
  if (p === "/api/v1/me/systems") {
    if (state.host.role !== "admin" && state.host.role !== "user")
      return [403, { error: { code: "HOST_PLAN_REQUIRED" } }];
    return [200, { items: state.mySystems, nextCursor: null }];
  }
  match = /^\/api\/v1\/me\/systems\/([^/]+)\/(link|unlink|remove)$/.exec(p);
  if (match) {
    const system = state.mySystems.find((item) => item.id === match[1]);
    if (match[2] === "remove")
      state.mySystems = state.mySystems.filter((item) => item !== system);
    else {
      const target = state.organizations.find(
        (item) => item.id === body?.organizationId,
      );
      system.linkedOrganization =
        match[2] === "link" ? { id: target.id, name: target.name } : null;
      system.version++;
    }
    return [match[2] === "link" ? 201 : 200, { system }];
  }
  // Platform (Host admin).
  if (p === "/api/v1/admin/overview")
    return [200, { admins: 2, activeAdmins: 2, users: 14, organizations: 6 }];
  if (p === "/api/v1/admin/people") {
    const people = [
      {
        uid: "screens-user",
        email: state.email,
        name: state.displayName,
        role: "admin",
        status: "active",
        mfaEnrolled: true,
        lastSignInAt: at(0, "07:30"),
        memberships: [],
      },
      {
        uid: "u2",
        email: "dana@seaside.example",
        name: words[state.lang].person,
        role: "user",
        status: "active",
        mfaEnrolled: false,
        lastSignInAt: at(-2, "18:10"),
        memberships: [
          {
            id: "m1",
            clientId: "seaside",
            organizationName: words[state.lang].org,
            email: "dana@seaside.example",
            version: 1,
            products: { host: { role: "owner", status: "active" } },
          },
        ],
      },
      {
        uid: "u3",
        email: "guy@city.example",
        name: "",
        role: "user",
        status: "blocked",
        mfaEnrolled: null,
        lastSignInAt: null,
        memberships: [],
      },
    ];
    return [
      200,
      {
        items: people.filter((person) => person.role === query.get("role")),
        nextCursor: null,
      },
    ];
  }
  if (p === "/api/v1/admin/organizations" && method === "GET")
    return [
      200,
      {
        items: [
          {
            id: "seaside",
            name: words[state.lang].org,
            status: "active",
            owners: ["dana@seaside.example"],
            memberCount: 4,
            gateCount: 6,
            products: ["host"],
          },
          {
            id: "city",
            name: words[state.lang].otherOrg,
            status: "active",
            owners: ["owner@city.example"],
            memberCount: 2,
            gateCount: 0,
            products: ["host"],
          },
        ],
        nextCursor: null,
      },
    ];
  match = /^\/api\/v1\/organizations\/([^/]+)(\/.*)?$/.exec(p);
  if (!match) return [200, { items: [], nextCursor: null }];
  const [, orgId, rest = ""] = match;
  const org = state.organizations.find((item) => item.id === orgId);
  const systems = (state.systems[orgId] ??= []);
  const reservations = (state.reservations[orgId] ??= []);
  if (rest === "" && method === "PUT") {
    Object.assign(org, body, { version: org.version + 1 });
    return [200, { organization: org }];
  }
  if (rest === "/systems") return [200, { items: systems, nextCursor: null }];
  if (rest === "/systems/icons")
    return [
      200,
      {
        icons: {
          gate: [
            "bed-outline",
            "door-small",
            "garage-small",
            "swing-gate-small",
          ],
          "dual-control": ["barrier-gate-small", "cantilever-gate-small"],
          group: ["hosting", "home", "residence", "gym"],
        },
      },
    ];
  match = /^\/systems\/([^/]+)(\/remove)?$/.exec(rest);
  if (match) {
    const system = systems.find((item) => item.id === match[1]);
    if (match[2]) system.status = "disabled";
    else if (body?.iconId) system.iconId = body.iconId;
    system.version++;
    return [200, { system }];
  }
  if (rest === "/reservations/time-zone/resolve")
    return [200, { instant: new Date(`${body.localTime}:00Z`).toISOString() }];
  if (rest === "/reservations" && method === "GET") {
    const window = { startsAt: query.get("from"), endsAt: query.get("to") };
    const search = query.get("q")?.toLowerCase();
    const items = reservations
      .filter(
        (record) =>
          (!window.startsAt || !window.endsAt || overlaps(record, window)) &&
          (!query.get("systemId") ||
            record.systemId === query.get("systemId")) &&
          (!query.get("status") || record.status === query.get("status")) &&
          (!search ||
            [record.guest?.name, record.guest?.phone, record.externalReference]
              .filter(Boolean)
              .some((value) => value.toLowerCase().includes(search))),
      )
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
    return [200, paged(items, query)];
  }
  if (rest === "/reservations" && method === "POST") {
    const system = systems.find((item) => item.id === body.systemId);
    const record = {
      id: `new-${++state.created}`,
      version: 1,
      ...body,
      systemName: system?.name ?? null,
      targetIds: [body.systemId],
      timezone: org.timezone,
    };
    reservations.push(record);
    return [201, { reservation: record }];
  }
  match = /^\/reservations\/([^/]+)$/.exec(rest);
  if (match && method === "PUT") {
    const record = reservations.find((item) => item.id === match[1]);
    const { version, ...changes } = body;
    Object.assign(record, changes, { version: version + 1 });
    return [200, { reservation: record }];
  }
  match = /^\/reservations\/([^/]+)\/access-grants$/.exec(rest);
  if (match) {
    const grants = (state.grants[match[1]] ??= []);
    if (method === "GET") return [200, { items: grants, nextCursor: null }];
    const grant = {
      id: `grant-${match[1]}-${body.reservationVersion}`,
      reservationId: match[1],
      reservationVersion: body.reservationVersion,
      status: "issued",
      createdAt: new Date().toISOString(),
      effectiveStartsAt: new Date().toISOString(),
      effectiveEndsAt: new Date(Date.now() + 86400000).toISOString(),
    };
    grants.push(grant);
    return [201, { grant }];
  }
  match = /^\/access-grants\/([^/]+)\/reveal$/.exec(rest);
  if (match)
    return [
      200,
      {
        grantId: match[1],
        links: [
          {
            targetId: "target",
            url: "https://wifigate.io/wifigate-api/?ep=v1.Gx7pQ2rT9wLm4KdZs8VbN3yFh6JcUe1A",
          },
        ],
        offlineRevocation: "expires_at_effective_end",
      },
    ];
  if (rest === "/automation/policy") {
    const policy = state.policy[orgId] ?? {
      id: "organization",
      enabled: false,
      earlyAccessMinutes: 0,
      lateExpiryMinutes: 0,
      channel: "none",
      version: 0,
    };
    return [200, { policy }];
  }
  match = /^\/integrations\/providers\/([^/]+)\/mappings$/.exec(rest);
  if (match)
    return [
      200,
      { items: state.mappings[`${orgId}/${match[1]}`] ?? [], nextCursor: null },
    ];
  if (rest === "/api-keys")
    return [200, { items: state.apiKeys[orgId] ?? [], nextCursor: null }];
  if (rest === "/members")
    return [200, { items: state.members[orgId] ?? [], nextCursor: null }];
  if (rest === "/member-invitations")
    return [200, { items: state.invitations[orgId] ?? [], nextCursor: null }];
  if (rest === "/operations/preferences")
    return [
      200,
      {
        preferences: {
          locale: state.lang,
          alerts: {
            inApp: true,
            email: false,
            sms: false,
            minimumSeverity: "info",
          },
          savedFilters: [],
          version: 1,
        },
      },
    ];
  if (rest === "/billing/subscription")
    return [
      200,
      {
        subscription: {
          status: "active",
          effectiveStatus: "legacy-active",
          version: 1,
        },
      },
    ];
  return [200, { items: [], nextCursor: null }];
}

// ---------------------------------------------------------------- browser
const firebaseAuth = (state) => `
  const user = { uid: "screens-user", email: ${JSON.stringify(state.email)},
    displayName: ${JSON.stringify(state.displayName)}, emailVerified: true,
    providerData: [{ providerId: "google.com" }],
    getIdToken: async () => "screens-token",
    getIdTokenResult: async () => ({ claims: { firebase: { sign_in_provider: "google.com" } } }) };
  export const getAuth = () => ({});
  export const connectAuthEmulator = () => {};
  export const browserSessionPersistence = {};
  export const setPersistence = async () => {};
  export const onAuthStateChanged = (_, callback) => { setTimeout(() => callback(user), 0); return () => {}; };
  export const GoogleAuthProvider = function () { this.setCustomParameters = () => {}; };
  export const OAuthProvider = function () { this.addScope = () => {}; };
  export const signInWithPopup = async () => ({ user });
  export const getRedirectResult = async () => null;
  export const signInWithRedirect = async () => {};
  export const signOut = async () => {};
  export const reauthenticateWithPopup = async () => ({ user });
  export const getMultiFactorResolver = () => ({ hints: [], resolveSignIn: async () => ({ user }) });
  export const multiFactor = () => ({ getSession: async () => ({}), enroll: async () => {} });
  export const TotpMultiFactorGenerator = {};
`;

const types = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".html": "text/html; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};

async function startServer() {
  const server = createServer(async (request, response) => {
    try {
      let file = path.resolve(
        root,
        "." + decodeURIComponent(new URL(request.url, "http://x").pathname),
      );
      if (!file.startsWith(path.resolve(root)))
        return response.writeHead(403).end();
      if ((await stat(file)).isDirectory())
        file = path.join(file, "index.html");
      response.setHeader(
        "Content-Type",
        types[path.extname(file)] ?? "application/octet-stream",
      );
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

async function openContext(browser, origin, state, viewport) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    timezoneId: "Asia/Jerusalem",
    locale: state.lang === "he" ? "he-IL" : "en-US",
  });
  // The cookie choice is already made, so no banner covers the screens.
  await context.addInitScript(() => {
    try {
      localStorage.setItem(
        "wifigate-cookie-consent-v1",
        JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }),
      );
    } catch {
      /* Storage can be off; the banner then shows. */
    }
  });
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin === origin) return route.continue();
    if (
      url.hostname === "www.gstatic.com" &&
      url.pathname.endsWith("firebase-app.js")
    )
      return route.fulfill({
        contentType: "application/javascript",
        body: "export const initializeApp = value => value;",
      });
    if (
      url.hostname === "www.gstatic.com" &&
      url.pathname.endsWith("firebase-auth.js")
    )
      return route.fulfill({
        contentType: "application/javascript",
        body: firebaseAuth(state),
      });
    if (url.pathname.startsWith("/api/v1/")) {
      const cors = {
        "access-control-allow-origin": origin,
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
      };
      if (request.method() === "OPTIONS")
        return route.fulfill({ status: 204, headers: cors });
      let body;
      try {
        body = request.postDataJSON();
      } catch {
        body = undefined;
      }
      const [status, json] = answer(state, request.method(), url, body);
      state.log?.push(`${request.method()} ${url.pathname} ${status}`);
      return route.fulfill({ status, json, headers: cors });
    }
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    // A refused request (409 and the like) is part of the screen under test;
    // the browser's own line about it is not a page error.
    if (
      message.type() === "error" &&
      !message.text().startsWith("Failed to load resource")
    )
      errors.push(`console: ${message.text()}`);
  });
  return { context, page, errors };
}

// ---------------------------------------------------------------- audits
// What the page can measure about itself. Run after each screen settles.
function audit({ lang, phone }) {
  const visible = (element) => {
    if (
      element.closest("[hidden], [inert]") &&
      !element.closest("dialog[open]")
    )
      return false;
    // Inside a closed <details>, only its summary shows.
    const closed = element.closest("details:not([open])");
    if (closed && element.closest("summary")?.parentElement !== closed)
      return false;
    const style = getComputedStyle(element);
    if (style.visibility === "hidden" || style.display === "none") return false;
    const box = element.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  };
  const describe = (element) => {
    const id = element.id ? `#${element.id}` : "";
    const cls = [...element.classList]
      .slice(0, 2)
      .map((c) => `.${c}`)
      .join("");
    const text = (element.innerText ?? element.textContent ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 50);
    return `${element.tagName.toLowerCase()}${id}${cls} "${text}"`;
  };
  const scope = document.querySelector("dialog[open]") ?? document.body;
  const issues = [];
  if (document.documentElement.scrollWidth > innerWidth + 1)
    issues.push(
      `sideways scroll: ${document.documentElement.scrollWidth} > ${innerWidth}`,
    );
  const scrollsSideways = (element) => {
    for (
      let parent = element.parentElement;
      parent;
      parent = parent.parentElement
    ) {
      const overflow = getComputedStyle(parent).overflowX;
      if (overflow !== "visible") return true;
    }
    return false;
  };
  const past = [];
  for (const element of scope.querySelectorAll("*")) {
    if (!visible(element) || scrollsSideways(element)) continue;
    const box = element.getBoundingClientRect();
    if (box.right > innerWidth + 1 || box.left < -1)
      past.push(describe(element));
  }
  if (past.length)
    issues.push(`past the edge: ${past.slice(0, 6).join(" | ")}`);
  const cut = [];
  for (const element of scope.querySelectorAll("*")) {
    if (!visible(element) || element.closest(".visually-hidden")) continue;
    const style = getComputedStyle(element);
    const own = [...element.childNodes].some(
      (child) => child.nodeType === 3 && child.textContent.trim(),
    );
    if (!own) continue;
    if (
      ["hidden", "clip"].includes(style.overflowX) &&
      style.textOverflow !== "ellipsis" &&
      element.scrollWidth > element.clientWidth + 1
    )
      cut.push(describe(element));
    if (
      ["hidden", "clip"].includes(style.overflowY) &&
      style.webkitLineClamp === "none" &&
      element.scrollHeight > element.clientHeight + 2
    )
      cut.push(`${describe(element)} (height)`);
  }
  if (cut.length) issues.push(`cut text: ${cut.slice(0, 6).join(" | ")}`);
  if (phone) {
    const small = [];
    for (const element of scope.querySelectorAll(
      "button, summary, a[href], select, input:not([type=hidden]), [role=tab]",
    )) {
      if (!visible(element)) continue;
      if (element.closest(".portal-legal, .workspace-skip-link")) continue;
      const box = element.getBoundingClientRect();
      let { width, height } = box;
      const hit = getComputedStyle(element, "::after");
      if (hit.content !== "none" && hit.position === "absolute") {
        const inset = ["top", "right", "bottom", "left"].map((side) =>
          Math.min(0, parseFloat(hit[side]) || 0),
        );
        height -= inset[0] + inset[2];
        width -= inset[1] + inset[3];
      }
      if (["checkbox", "radio"].includes(element.type)) {
        const label = element.closest("label");
        if (label) ({ width, height } = label.getBoundingClientRect());
      }
      if (Math.min(width, height) < 43.5)
        small.push(
          `${describe(element)} ${Math.round(width)}x${Math.round(height)}`,
        );
    }
    if (small.length)
      issues.push(`small targets: ${small.slice(0, 8).join(" | ")}`);
  }
  // Text the person reads (not code for a developer, not their own data).
  // Code and ids for a developer (and the WIFIGATE operator's support
  // diagnostics) sit behind "For your developer"; they are not checked.
  const developer =
    ".try-it__developer, .connect-developer, .operations-developer, [aria-label='Approved support diagnostics']";
  const texts = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const element = node.parentElement;
    if (!element || !node.textContent.trim()) continue;
    if (element.closest("script, style, noscript, " + developer)) continue;
    if (!visible(element)) continue;
    texts.push(node.textContent.trim().replace(/\s+/g, " "));
  }
  for (const element of scope.querySelectorAll(
    "[aria-label], [title], [placeholder]",
  )) {
    if (!visible(element) || element.closest(developer)) continue;
    for (const attribute of ["aria-label", "title", "placeholder"])
      if (element.getAttribute(attribute))
        texts.push(element.getAttribute(attribute));
  }
  // Names and the person's own data; API words, key prefixes and zone ids
  // are allowed only inside the developer areas (not checked above).
  const allowed =
    /WIFIGATE|Host|Pay|Manager|Dual Control|English|WhatsApp|SMS|Google|Apple|Example WIFIGATE[^]*?212|🥂|🍾|[\w.+-]+@[\w.-]+|https?:\/\/\S+|wifigate\.io\S*|\bQR\b|\bCSV\b|\bGMT\b|\bA-\d+|\+\d[\d ]+/g;
  if (lang === "he") {
    const latin = [
      ...new Set(
        texts.filter((text) => /[A-Za-z]{2,}/.test(text.replace(allowed, ""))),
      ),
    ];
    if (latin.length)
      issues.push(
        `latin on a Hebrew screen: ${latin.slice(0, 12).join(" | ")}`,
      );
  }
  const technicalWords =
    /\b(id|ids|uuid|json|webhook|endpoint|payload|token|idempotency|fingerprint|telemetry|p95|latency|cursor|http|totp|oauth|schema|sha|hash|null|undefined|NaN|ms|slo|sla)\b/i;
  const codes = /\b[A-Z]+_[A-Z_]+\b|\b[a-z]+[._][a-z_.]+\b|\b[0-9a-f]{16,}\b/;
  const tech = [
    ...new Set(
      texts.filter((text) => {
        const plain = text.replace(allowed, "");
        return technicalWords.test(plain) || codes.test(plain);
      }),
    ),
  ];
  if (tech.length)
    issues.push(`technical words: ${tech.slice(0, 10).join(" | ")}`);
  // Host, Pay and Manager keep the product pill at the centre of the window.
  const pill = document.querySelector("#product-switcher");
  if (pill && visible(pill)) {
    const box = pill.getBoundingClientRect();
    const off = (box.left + box.right) / 2 - innerWidth / 2;
    if (Math.abs(off) > 2)
      issues.push(`pill off centre by ${Math.round(off)}px`);
  }
  return issues;
}

// ---------------------------------------------------------------- screens
const settle = async (page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
};
const ready = (page) =>
  page.waitForFunction(
    () => document.body.classList.contains("host-ready"),
    null,
    {
      timeout: 15000,
    },
  );
const viewLoaded = (page, view) =>
  page
    .locator(`[data-workspace-view="${view}"][data-loaded="true"]`)
    .waitFor({ timeout: 15000 });
const hostUrl = (lang, query = "") => {
  const params = new URLSearchParams(query);
  if (lang === "he") params.set("lang", "he");
  const text = params.toString();
  return `/dashboard/host/${text ? `?${text}` : ""}`;
};
async function openView(page, lang, view, extra = {}) {
  await page.goto(page.origin + hostUrl(lang, { view, ...extra }));
  await ready(page);
  await viewLoaded(page, view);
  await settle(page);
}
const exampleCard = (page, id) =>
  page.locator(`[data-examples] [data-system-id="${id}"]`).first();
const dialogOpen = (page, selector = "dialog[open]") =>
  page.locator(selector).last().waitFor({ timeout: 10000 });

// Try it, one track, run once, with the developer section opened or not.
async function tryIt(page, lang, track, developer, view = "my-systems") {
  await openView(page, lang, view);
  await exampleCard(page, "example-room-212")
    .locator('[data-action="try"]')
    .click();
  await dialogOpen(page, "dialog.try-it[open]");
  const dialog = page.locator("dialog.try-it[open]");
  await dialog.locator(`[data-track="${track}"]`).click();
  const run = {
    manual: /Create guest link|יצירת קישור לאורח/,
    booking: /Send the booking to WIFIGATE|שליחת ההזמנה/,
    payment: /Simulate successful payment|הדמיית תשלום מוצלח|תשלום מוצלח/,
  }[track];
  const button = dialog.getByRole("button", { name: run }).first();
  if (await button.count()) {
    const handle = await button.elementHandle();
    await button.click();
    await page.waitForFunction(
      (element) => !element.isConnected || !element.disabled,
      handle,
      { timeout: 15000 },
    );
    await dialog
      .locator(".link-card:not([hidden])")
      .waitFor({ timeout: 15000 });
  }
  if (developer) {
    await dialog.locator(".try-it__developer > summary").click();
    await dialog
      .locator(".try-it__developer :is(pre, code):visible")
      .last()
      .scrollIntoViewIfNeeded();
  }
  await settle(page);
}

const workspace = (view, extra) => ({
  name: [view, extra?.tab, extra?.section].filter(Boolean).join("-"),
  run: (page, lang) => openView(page, lang, view, extra),
});
const dialogShot = (name, run) => ({ name, run, dialog: true });

const shots = {
  operator: [
    workspace("my-systems"),
    workspace("settings", { tab: "account" }),
    workspace("settings", { tab: "support" }),
    workspace("invitations"),
    ...["admins", "users", "organizations"].map((tab) => ({
      name: `platform-${tab}`,
      run: async (page, lang) => {
        await page.goto(
          page.origin +
            `/dashboard/host/overview/?tab=${tab}${lang === "he" ? "&lang=he" : ""}`,
        );
        await ready(page);
        await page.locator("#admin-overview:not([hidden])").waitFor();
        await page.waitForTimeout(800);
        await settle(page);
      },
    })),
    {
      name: "account-menu",
      dialog: true,
      run: async (page, lang) => {
        await openView(page, lang, "my-systems");
        await page.locator("#account-button").click();
        await page.locator("#account-menu:not([hidden])").waitFor();
        await settle(page);
      },
    },
    {
      name: "product-switcher",
      dialog: true,
      run: async (page, lang) => {
        await openView(page, lang, "my-systems");
        await page.locator("#product-switcher button").first().click();
        await page.waitForTimeout(300);
        await settle(page);
      },
    },
  ],
  planholder: [
    workspace("my-systems"),
    workspace("settings", { tab: "account" }),
    dialogShot("unlink-dialog", async (page, lang) => {
      await openView(page, lang, "my-systems");
      await page
        .locator(
          '[data-workspace-view="my-systems"] [data-system-id="home-gate"] [data-action="unlink"]',
        )
        .click();
      await dialogOpen(page);
      await settle(page);
    }),
    dialogShot("unlink-refused", async (page, lang) => {
      await openView(page, lang, "my-systems");
      await page
        .locator(
          '[data-workspace-view="my-systems"] [data-system-id="home-gate"] [data-action="unlink"]',
        )
        .click();
      await dialogOpen(page);
      await page.locator("dialog[open] button[type=submit]").click();
      await page.waitForTimeout(600);
      await settle(page);
    }),
    dialogShot("remove-dialog", async (page, lang) => {
      await openView(page, lang, "my-systems");
      await page
        .locator(
          '[data-workspace-view="my-systems"] [data-system-id="pool"] [data-action="remove"]',
        )
        .click();
      await dialogOpen(page);
      await settle(page);
    }),
    dialogShot("menu", async (page, lang) => {
      await openView(page, lang, "my-systems");
      const toggle = page.locator(".workspace-menu-toggle");
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(400);
      }
      await settle(page);
    }),
  ],
  planowner: [
    workspace("my-systems"),
    workspace("systems"),
    workspace("calendar"),
    workspace("bookings"),
    workspace("activity"),
    workspace("activity", { section: "review" }),
    {
      name: "activity-review-open",
      run: async (page, lang) => {
        await openView(page, lang, "activity", { section: "review" });
        for (const summary of await page
          .locator('[data-operations-screen="review"] details > summary')
          .all())
          await summary.click();
        await page.waitForTimeout(600);
        await settle(page);
      },
    },
    workspace("activity", { section: "health" }),
    workspace("connect"),
    {
      name: "connect-open",
      run: async (page, lang) => {
        await openView(page, lang, "connect");
        for (const summary of await page
          .locator('[data-workspace-view="connect"] details > summary')
          .all())
          await summary.click();
        await page.waitForTimeout(300);
        await settle(page);
      },
    },
    workspace("settings", { tab: "organization" }),
    workspace("settings", { tab: "team" }),
    workspace("settings", { tab: "billing" }),
    workspace("settings", { tab: "support" }),
    workspace("settings", { tab: "account" }),
    workspace("invitations"),
    dialogShot("link-dialog", async (page, lang) => {
      await openView(page, lang, "my-systems");
      await page
        .locator(
          '[data-workspace-view="my-systems"] [data-system-id="pool"] [data-action="link"]',
        )
        .click();
      await dialogOpen(page);
      await settle(page);
    }),
    dialogShot("unlink-refused", async (page, lang) => {
      await openView(page, lang, "my-systems");
      await page
        .locator(
          '[data-workspace-view="my-systems"] [data-system-id="room-101"] [data-action="unlink"]',
        )
        .click();
      await dialogOpen(page);
      await page.locator("dialog[open] button[type=submit]").click();
      await page.waitForTimeout(600);
      await settle(page);
    }),
    dialogShot("remove-dialog", async (page, lang) => {
      await openView(page, lang, "my-systems");
      await page
        .locator(
          '[data-workspace-view="my-systems"] [data-system-id="parking"] [data-action="remove"]',
        )
        .click();
      await dialogOpen(page);
      await settle(page);
    }),
    dialogShot("org-remove-refused", async (page, lang) => {
      await openView(page, lang, "systems");
      await page
        .locator(
          '[data-workspace-view="systems"] [data-system-id="lobby"] [data-action="remove"]',
        )
        .click();
      await dialogOpen(page);
      await page.locator("dialog[open] button[type=submit]").click();
      await page.waitForTimeout(600);
      await settle(page);
    }),
    {
      name: "org-remove-refused-bookings",
      run: async (page, lang) => {
        await openView(page, lang, "systems");
        await page
          .locator(
            '[data-workspace-view="systems"] [data-system-id="lobby"] [data-action="remove"]',
          )
          .click();
        await dialogOpen(page);
        await page.locator("dialog[open] button[type=submit]").click();
        await page.locator("dialog[open] [data-open-bookings]").click();
        await viewLoaded(page, "bookings");
        await page.locator(".bookings-filter:not([hidden])").waitFor();
        await page.waitForTimeout(400);
        await settle(page);
      },
    },
    dialogShot("change-icon", async (page, lang) => {
      await openView(page, lang, "systems");
      await page
        .locator(
          '[data-workspace-view="systems"] [data-system-id="room-102"] [data-action="icon"]',
        )
        .click();
      await dialogOpen(page);
      await page.waitForTimeout(400);
      await settle(page);
    }),
    dialogShot("booking-new", async (page, lang) => {
      await openView(page, lang, "calendar");
      await page
        .getByRole("button", { name: /^(New booking|הזמנה חדשה)$/ })
        .first()
        .click();
      await dialogOpen(page, "dialog.booking-sheet[open]");
      await settle(page);
    }),
    dialogShot("booking-link-card", async (page, lang) => {
      await openView(page, lang, "systems");
      await page
        .locator(
          '[data-workspace-view="systems"] [data-system-id="room-102"] [data-action="guest-link"]',
        )
        .click();
      await dialogOpen(page, "dialog.booking-sheet[open]");
      const sheet = page.locator("dialog.booking-sheet[open]");
      await sheet.locator('input[name="name"]').fill(words[lang].guests[1]);
      await sheet.locator('input[type="tel"]').first().fill("050-123-4567");
      await sheet
        .locator('button[type="submit"], [form$="-form"]')
        .last()
        .click();
      await sheet.locator(".link-card").waitFor({ timeout: 15000 });
      await sheet.locator(".link-card").scrollIntoViewIfNeeded();
      await settle(page);
    }),
    dialogShot("booking-details", async (page, lang) => {
      await openView(page, lang, "bookings");
      await page.locator('.booking-row[data-booking-id="b1"]').first().click();
      await dialogOpen(page, "dialog.booking-sheet[open]");
      await page.waitForTimeout(500);
      const show = page.locator(
        "dialog.booking-sheet[open] [data-booking-link]:not([hidden])",
      );
      if (await show.count()) {
        await show.first().click();
        await page
          .locator("dialog.booking-sheet[open] .link-card")
          .waitFor({ timeout: 10000 });
        await page
          .locator("dialog.booking-sheet[open] .link-card")
          .scrollIntoViewIfNeeded();
      }
      await settle(page);
    }),
    dialogShot("try-manual", (page, lang) =>
      tryIt(page, lang, "manual", false),
    ),
    dialogShot("try-manual-developer", (page, lang) =>
      tryIt(page, lang, "manual", true),
    ),
    dialogShot("try-booking", (page, lang) =>
      tryIt(page, lang, "booking", false),
    ),
    dialogShot("try-booking-developer", (page, lang) =>
      tryIt(page, lang, "booking", true),
    ),
    dialogShot("try-payment", (page, lang) =>
      tryIt(page, lang, "payment", false),
    ),
    dialogShot("try-payment-developer", (page, lang) =>
      tryIt(page, lang, "payment", true),
    ),
    dialogShot("example-link-dialog", async (page, lang) => {
      await openView(page, lang, "my-systems");
      await exampleCard(page, "example-dual-212")
        .locator('[data-action="link"]')
        .click();
      await dialogOpen(page);
      await settle(page);
    }),
    dialogShot("org-selector", async (page, lang) => {
      await openView(page, lang, "systems");
      const toggle = page.locator(".workspace-menu-toggle");
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(400);
      }
      await settle(page);
    }),
  ],
  orgadmin: [
    workspace("systems"),
    workspace("calendar"),
    workspace("bookings"),
    workspace("activity"),
    workspace("connect"),
    workspace("settings", { tab: "organization" }),
    workspace("settings", { tab: "account" }),
    dialogShot("org-remove-dialog", async (page, lang) => {
      await openView(page, lang, "systems");
      await page
        .locator(
          '[data-workspace-view="systems"] [data-system-id="room-102"] [data-action="remove"]',
        )
        .click();
      await dialogOpen(page);
      await settle(page);
    }),
    dialogShot("try-booking", (page, lang) =>
      tryIt(page, lang, "booking", false, "systems"),
    ),
  ],
  orgstaff: [
    workspace("systems"),
    workspace("calendar"),
    workspace("bookings"),
    workspace("activity"),
    workspace("activity", { section: "review" }),
    workspace("activity", { section: "health" }),
    workspace("settings", { tab: "organization" }),
    workspace("settings", { tab: "account" }),
    dialogShot("booking-details", async (page, lang) => {
      await openView(page, lang, "bookings");
      await page.locator('.booking-row[data-booking-id="b1"]').first().click();
      await dialogOpen(page, "dialog.booking-sheet[open]");
      await page.waitForTimeout(400);
      await settle(page);
    }),
    dialogShot("menu", async (page, lang) => {
      await openView(page, lang, "systems");
      const toggle = page.locator(".workspace-menu-toggle");
      if (await toggle.isVisible()) {
        await toggle.click();
        await page.waitForTimeout(400);
      }
      await settle(page);
    }),
  ],
  orgviewer: [
    workspace("systems"),
    workspace("calendar"),
    workspace("bookings"),
    workspace("settings", { tab: "organization" }),
    workspace("settings", { tab: "account" }),
    dialogShot("booking-details", async (page, lang) => {
      await openView(page, lang, "bookings");
      await page.locator('.booking-row[data-booking-id="b1"]').first().click();
      await dialogOpen(page, "dialog.booking-sheet[open]");
      await page.waitForTimeout(400);
      await settle(page);
    }),
  ],
  pending: [
    {
      name: "join",
      run: async (page, lang) => {
        await page.goto(page.origin + hostUrl(lang));
        await ready(page);
        await viewLoaded(page, "invitations");
        await settle(page);
      },
    },
  ],
};

// The product picker per Host state, and the demo landing page.
const pickerStates = {
  "plan-holder": { state: "active", role: "user", organizations: 1 },
  "org-member": { state: "active", role: null, organizations: 1 },
  pending: { state: "pending" },
  "no-plan": { state: "no-plan" },
  "mfa-required": { state: "mfa-required", role: "admin" },
  blocked: { state: "blocked" },
  unavailable: { state: "unavailable" },
};

async function main() {
  const out = path.resolve(options.out);
  if (!options.keep) {
    await mkdir(out, { recursive: true });
    for (const file of await readdir(out))
      if (file.endsWith(".png") || file === "report.json")
        await rm(path.join(out, file));
  }
  await mkdir(out, { recursive: true });
  const server = await startServer();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  const report = {};
  const take = async (
    page,
    errors,
    file,
    run,
    { dialog = false, lang, width },
  ) => {
    const before = errors.length;
    try {
      await run(page, lang);
    } catch (error) {
      errors.push(`step failed: ${error.message.split("\n")[0]}`);
    }
    const issues = await page
      .evaluate(audit, { lang, phone: width < 600 })
      .catch((error) => [`audit failed: ${error.message}`]);
    issues.push(...errors.slice(before));
    // A full page starts at its top, with no focus ring left from a step.
    if (!dialog)
      await page
        .evaluate(() => {
          document.activeElement?.blur?.();
          scrollTo(0, 0);
        })
        .catch(() => {});
    await page.screenshot({
      path: path.join(out, file),
      fullPage: !dialog,
    });
    report[file] = issues;
    console.log(
      `${issues.length ? "!" : " "} ${file}${issues.length ? `  (${issues.length})` : ""}`,
    );
  };
  try {
    for (const [persona, list] of Object.entries(shots)) {
      if (only.persona && !only.persona.includes(persona)) continue;
      for (const lang of languages) {
        if (only.lang && !only.lang.includes(lang)) continue;
        for (const viewport of viewports) {
          if (only.width && !only.width.includes(viewport.width)) continue;
          for (const shot of list) {
            if (only.shot && !shot.name.includes(only.shot)) continue;
            // A fresh world per screen: a refusal or a change never leaks
            // into the next picture.
            const state = world(persona, lang);
            const { context, page, errors } = await openContext(
              browser,
              origin,
              state,
              viewport,
            );
            page.origin = origin;
            await take(
              page,
              errors,
              `${persona}-${shot.name}-${lang}-${viewport.width}.png`,
              shot.run,
              { dialog: shot.dialog, lang, width: viewport.width },
            );
            await context.close();
          }
        }
      }
    }
    if (!only.persona || only.persona.includes("picker"))
      for (const lang of languages) {
        if (only.lang && !only.lang.includes(lang)) continue;
        for (const viewport of viewports) {
          if (only.width && !only.width.includes(viewport.width)) continue;
          for (const [name, host] of Object.entries(pickerStates)) {
            if (only.shot && !name.includes(only.shot)) continue;
            const state = {
              ...world("planholder", lang),
              host,
              mfa:
                name === "mfa-required"
                  ? { enrolled: false, verified: false }
                  : { enrolled: true, verified: true },
              pay: { state: "active" },
              manager: { state: "no-plan" },
            };
            const { context, page, errors } = await openContext(
              browser,
              origin,
              state,
              viewport,
            );
            await take(
              page,
              errors,
              `picker-${name}-${lang}-${viewport.width}.png`,
              async () => {
                await page.goto(
                  origin + `/dashboard/${lang === "he" ? "?lang=he" : ""}`,
                );
                await page
                  .locator("#product-grid:not([hidden]) > *")
                  .first()
                  .waitFor({ timeout: 15000 });
                await settle(page);
              },
              { lang, width: viewport.width },
            );
            await context.close();
          }
        }
      }
    if (!only.persona || only.persona.includes("products"))
      for (const lang of languages) {
        if (only.lang && !only.lang.includes(lang)) continue;
        for (const viewport of viewports) {
          if (only.width && !only.width.includes(viewport.width)) continue;
          for (const product of ["pay", "manager"]) {
            if (only.shot && !product.includes(only.shot)) continue;
            const state = {
              ...world("planowner", lang),
              pay: { state: "active" },
              manager: { state: "active" },
            };
            const { context, page, errors } = await openContext(
              browser,
              origin,
              state,
              viewport,
            );
            await take(
              page,
              errors,
              `products-${product}-${lang}-${viewport.width}.png`,
              async () => {
                await page.goto(
                  origin +
                    `/dashboard/${product}/${lang === "he" ? "?lang=he" : ""}`,
                );
                await page
                  .locator("#product-switcher button")
                  .first()
                  .waitFor({ timeout: 15000 });
                await settle(page);
              },
              { lang, width: viewport.width },
            );
            await context.close();
          }
        }
      }
    // The pill between the phone and the wide desktop: Host (beside its
    // sidebar), Pay and Manager.
    if (!only.persona || only.persona.includes("pill"))
      for (const lang of languages) {
        if (only.lang && !only.lang.includes(lang)) continue;
        for (const width of pillWidths) {
          if (only.width && !only.width.includes(width)) continue;
          for (const product of ["host", "pay", "manager"]) {
            if (only.shot && !product.includes(only.shot)) continue;
            const state = {
              ...world("planowner", lang),
              pay: { state: "active" },
              manager: { state: "active" },
            };
            const { context, page, errors } = await openContext(
              browser,
              origin,
              state,
              { width, height: 800 },
            );
            page.origin = origin;
            await take(
              page,
              errors,
              `pill-${product}-${lang}-${width}.png`,
              async () => {
                if (product === "host")
                  await openView(page, lang, "my-systems");
                else {
                  await page.goto(
                    origin +
                      `/dashboard/${product}/${lang === "he" ? "?lang=he" : ""}`,
                  );
                  await page
                    .locator("#product-switcher button")
                    .first()
                    .waitFor({ timeout: 15000 });
                  await settle(page);
                }
              },
              { dialog: true, lang, width },
            );
            await context.close();
          }
        }
      }
    if (!only.persona || only.persona.includes("demo"))
      for (const lang of languages) {
        if (only.lang && !only.lang.includes(lang)) continue;
        for (const viewport of viewports) {
          if (only.width && !only.width.includes(viewport.width)) continue;
          for (const kind of ["room", "dual", "group"]) {
            if (only.shot && !kind.includes(only.shot)) continue;
            const start = new Date(`${day(1)}T12:00:00.000Z`);
            const link = demoGuestLink({
              kind,
              startsAt: start,
              endsAt: new Date(start.getTime() + 2 * 86400000),
            });
            const ep = new URL(link).searchParams.get("ep");
            const state = world("planholder", lang);
            const { context, page, errors } = await openContext(
              browser,
              origin,
              state,
              viewport,
            );
            await take(
              page,
              errors,
              `demo-${kind}-${lang}-${viewport.width}.png`,
              async () => {
                await page.goto(
                  origin +
                    `${lang === "he" ? "/he" : ""}/wifigate-api/?ep=${encodeURIComponent(ep)}`,
                );
                await page.waitForTimeout(800);
                await settle(page);
              },
              { lang, width: viewport.width },
            );
            await context.close();
          }
        }
      }
  } finally {
    await writeFile(
      path.join(out, "report.json"),
      JSON.stringify(report, null, 1) + "\n",
    );
    await browser.close();
    server.closeAllConnections();
    server.close();
  }
  const flagged = Object.values(report).filter(
    (issues) => issues.length,
  ).length;
  console.log(
    `\n${Object.keys(report).length} screens in ${out}; ${flagged} with notes (report.json).`,
  );
}

await main();
