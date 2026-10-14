// The Host API as the dashboard browser tests see it: one in-memory state
// per page (organizations, their systems and bookings, guest links,
// Connect, Activity and Settings records), answered through the axios
// adapter of js/api/index.js. Every request is recorded with its method,
// path, query, body and Idempotency-Key. Loaded in the page itself, never
// in Node. Like the Host API, a guest link needs a window (the booking
// widened by the organization's early entry and late exit) that ends in
// the future and spans at most 31 days.
import { profileApi } from "/js/api/index.js";

const reply = (config, data, status = 200) => ({
  status,
  statusText: "OK",
  headers: {},
  config,
  data,
});
const refuse = (config, { status = 409, code, details }) => {
  throw Object.assign(new Error(code), {
    isAxiosError: true,
    config,
    response: {
      status,
      statusText: code,
      headers: {},
      config,
      data: { error: { code, message: code, ...(details ? { details } : {}) } },
    },
  });
};
const overlaps = (a, b) =>
  Date.parse(a.startsAt) < Date.parse(b.endsAt) &&
  Date.parse(a.endsAt) > Date.parse(b.startsAt);
const booked = (record) =>
  record.systemId ? [record.systemId] : (record.targetIds ?? []);
const policyOf = (state, orgId) =>
  state.policy[orgId] ?? {
    id: "organization",
    enabled: false,
    earlyAccessMinutes: 0,
    lateExpiryMinutes: 0,
    channel: "none",
    version: 0,
  };
// One page of a list and the cursor of the next (an offset).
const paged = (items, query, size) => {
  const offset = Number(query.get("cursor") ?? 0);
  return {
    items: items.slice(offset, offset + size),
    nextCursor: offset + size < items.length ? String(offset + size) : null,
  };
};

export function installHostApi(state) {
  state.requests = [];
  state.failures ??= {};
  state.delays ??= {};
  state.systems ??= {};
  state.reservations ??= {};
  state.grants ??= {};
  state.members ??= {};
  state.invitations ??= {};
  state.mappings ??= {};
  state.events ??= {};
  state.apiKeys ??= {};
  state.policy ??= {};
  state.preferences ??= {};
  state.created = 0;
  window.release = {};
  window.accessErrors = [];
  window.addEventListener("platform:access-error", (event) =>
    window.accessErrors.push(event.detail.code),
  );
  profileApi.defaults.adapter = async (config) => {
    const url = new URL(config.url, location.origin);
    const method = config.method.toUpperCase();
    const body = config.data ? JSON.parse(config.data) : undefined;
    const call = `${method} ${url.pathname}`;
    state.requests.push({
      call,
      query: Object.fromEntries(url.searchParams),
      body,
      key: config.headers.get("idempotency-key") ?? null,
    });
    // A delay holds the next such request once, until release[call]().
    if (state.delays[call]) {
      delete state.delays[call];
      await new Promise((resolve) => {
        window.release[call] = resolve;
      });
    }
    const failure = state.failures[call];
    if (failure && (failure.times === undefined || failure.times-- > 0))
      return refuse(config, failure);
    if (url.pathname === "/api/v1/organizations")
      return reply(config, {
        organizations: state.organizations,
        nextCursor: null,
      });
    if (url.pathname === "/api/v1/me/systems")
      return reply(config, { items: state.mySystems ?? [], nextCursor: null });
    const scoped = /^\/api\/v1\/organizations\/([^/]+)(\/.*)?$/.exec(
      url.pathname,
    );
    if (!scoped) return reply(config, { items: [], nextCursor: null });
    const [, orgId, rest = ""] = scoped;
    const organization = state.organizations.find((item) => item.id === orgId);
    const systems = (state.systems[orgId] ??= []);
    const reservations = (state.reservations[orgId] ??= []);
    if (rest === "" && method === "PUT") {
      Object.assign(organization, body, { version: organization.version + 1 });
      return reply(config, { organization });
    }
    if (rest === "/systems")
      return reply(config, { items: systems, nextCursor: null });
    if (rest === "/reservations/time-zone/resolve") {
      if (
        state.ambiguous === body.localTime &&
        body.disambiguation === "reject"
      )
        return refuse(config, { code: "AMBIGUOUS_LOCAL_TIME" });
      return reply(config, {
        instant: new Date(`${body.localTime}:00Z`).toISOString(),
      });
    }
    if (rest === "/reservations" && method === "GET") {
      const query = url.searchParams;
      const window = { startsAt: query.get("from"), endsAt: query.get("to") };
      const search = query.get("q")?.toLowerCase();
      let items = reservations.filter(
        (record) =>
          overlaps(record, window) &&
          (!query.get("systemId") ||
            booked(record).includes(query.get("systemId"))) &&
          (!query.get("status") || record.status === query.get("status")) &&
          (!search ||
            [record.guest?.name, record.guest?.phone, record.externalReference]
              .filter(Boolean)
              .some((value) => value.toLowerCase().includes(search))),
      );
      items.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
      return reply(
        config,
        paged(
          items,
          query,
          Math.min(state.pageSize ?? 100, Number(query.get("limit") ?? 100)),
        ),
      );
    }
    if (rest === "/reservations" && method === "POST") {
      const clash = reservations.find(
        (record) =>
          record.status !== "cancelled" &&
          booked(record).includes(body.systemId) &&
          overlaps(record, body),
      );
      if (clash) return refuse(config, { code: "RESERVATION_OVERLAP" });
      const system = systems.find((item) => item.id === body.systemId);
      const reservation = {
        id: `booking-${++state.created}`,
        version: 1,
        ...body,
        systemName: system?.name ?? null,
        targetIds: [body.systemId],
        timezone: organization.timezone,
      };
      reservations.push(reservation);
      return reply(config, { reservation }, 201);
    }
    let match = /^\/reservations\/([^/]+)$/.exec(rest);
    if (match && method === "PUT") {
      const record = reservations.find((item) => item.id === match[1]);
      // Like the API's strict schema, every change names a system; closing
      // a booking names one of the systems it holds.
      if (typeof body.systemId !== "string" || !body.systemId)
        return refuse(config, { status: 400, code: "INVALID_REQUEST" });
      if (
        ["cancelled", "completed"].includes(body.status) &&
        booked(record).length &&
        !booked(record).includes(body.systemId)
      )
        return refuse(config, { code: "SYSTEM_UNAVAILABLE" });
      if (record.version !== body.version)
        return refuse(config, { code: "VERSION_CONFLICT" });
      const { version, ...changes } = body;
      Object.assign(record, changes, { version: version + 1 });
      return reply(config, { reservation: record });
    }
    match = /^\/reservations\/([^/]+)\/access-grants$/.exec(rest);
    if (match) {
      const grants = (state.grants[match[1]] ??= []);
      if (method === "GET")
        return reply(config, { items: grants, nextCursor: null });
      const record = reservations.find((item) => item.id === match[1]);
      if (!["confirmed", "changed"].includes(record.status))
        return refuse(config, { code: "RESERVATION_NOT_CONFIRMED" });
      const policy = policyOf(state, orgId);
      const from =
        Date.parse(record.startsAt) - policy.earlyAccessMinutes * 60000;
      const to = Date.parse(record.endsAt) + policy.lateExpiryMinutes * 60000;
      if (to <= Date.now()) return refuse(config, { code: "ACCESS_EXPIRED" });
      if (to - from > 31 * 86400000)
        return refuse(config, { status: 400, code: "INVALID_REQUEST" });
      const grant = {
        id: `grant-${match[1]}-${body.reservationVersion}`,
        reservationId: match[1],
        reservationVersion: body.reservationVersion,
        status: "issued",
        createdAt: "2026-10-14T09:00:00.000Z",
        effectiveStartsAt: "2026-10-14T09:00:00.000Z",
        effectiveEndsAt: "2026-10-15T09:00:00.000Z",
      };
      if (!grants.some((item) => item.id === grant.id)) grants.push(grant);
      return reply(config, { grant }, 201);
    }
    match = /^\/access-grants\/([^/]+)\/reveal$/.exec(rest);
    if (match)
      return reply(config, {
        grantId: match[1],
        links: [
          {
            targetId: "target",
            url:
              state.revealUrl ??
              `https://wifigate.io/wifigate-api/?ep=v1.fixture_${match[1]}`,
          },
        ],
        offlineRevocation: "expires_at_effective_end",
      });
    match = /^\/reservations\/([^/]+)\/privacy\/redact$/.exec(rest);
    if (match) {
      const record = reservations.find((item) => item.id === match[1]);
      Object.assign(record, {
        guest: { name: "", phone: "" },
        guestRedactedAt: "2026-10-14T09:00:00.000Z",
        version: record.version + 1,
      });
      return reply(config, { reservation: record });
    }
    if (rest === "/automation/policy") {
      if (method === "PUT") {
        const { version = 0, ...values } = body;
        state.policy[orgId] = {
          id: "organization",
          ...values,
          version: version + 1,
        };
      }
      return reply(config, { policy: policyOf(state, orgId) });
    }
    match = /^\/integrations\/providers\/([^/]+)\/mappings$/.exec(rest);
    if (match) {
      const list = (state.mappings[`${orgId}/${match[1]}`] ??= []);
      if (method === "POST") {
        const old = list.find(
          (item) => item.providerRoomId === body.providerRoomId,
        );
        const mapping = {
          id: `${match[1]}-${body.providerRoomId}`,
          provider: match[1],
          providerRoomId: body.providerRoomId,
          systemId: body.systemId,
          status: "active",
          version: (old?.version ?? 0) + 1,
        };
        if (old) Object.assign(old, mapping);
        else list.push(mapping);
        return reply(config, { mapping }, old ? 200 : 201);
      }
      return reply(config, { items: list, nextCursor: null });
    }
    if (rest === "/integrations/events")
      return reply(
        config,
        paged(
          state.events[orgId] ?? [],
          url.searchParams,
          state.eventsPageSize ?? 50,
        ),
      );
    match = /^\/integrations\/events\/([^/]+)\/replay$/.exec(rest);
    if (match) {
      const event = (state.events[orgId] ?? []).find(
        (item) => item.id === match[1],
      );
      Object.assign(event, { status: "received" });
      return reply(config, { event }, 202);
    }
    if (rest === "/api-keys") {
      const keys = (state.apiKeys[orgId] ??= []);
      if (method === "POST") {
        const key = {
          id: `key-${keys.length + 1}`,
          name: body.name,
          prefix: "wfg_test",
          status: "active",
          version: 1,
          scopes: body.scopes,
          targetTypes: body.targetTypes,
        };
        keys.push(key);
        return reply(config, { apiKey: key }, 201);
      }
      return reply(config, { items: keys, nextCursor: null });
    }
    match = /^\/api-keys\/([^/]+)\/reveal$/.exec(rest);
    if (match) return reply(config, { value: "wfg_test_private_value" });
    if (rest === "/members") {
      const members = (state.members[orgId] ??= []);
      if (method === "POST") {
        const member = members.find((item) => item.email === body.email);
        Object.assign(member, body);
        return reply(config, { membership: member });
      }
      return reply(config, { items: members, nextCursor: null });
    }
    if (rest === "/member-invitations") {
      const invitations = (state.invitations[orgId] ??= []);
      if (method === "POST") {
        const invitation = {
          id: `invitation-${invitations.length + 1}`,
          email: body.email,
          role: body.role,
          status: "pending",
          version: 1,
          expiresAt: "2026-10-21T09:00:00.000Z",
        };
        invitations.push(invitation);
        return reply(config, { invitation }, 201);
      }
      return reply(config, { items: invitations, nextCursor: null });
    }
    if (rest === "/operations/preferences") {
      if (method === "PUT") {
        const { version = 0, ...values } = body;
        state.preferences[orgId] = { ...values, version: version + 1 };
      }
      return reply(config, {
        preferences: state.preferences[orgId] ?? {
          locale: "en",
          alerts: {
            inApp: true,
            email: false,
            sms: false,
            minimumSeverity: "info",
          },
          savedFilters: [],
        },
      });
    }
    if (rest === "/operations/reliability")
      return reply(config, {
        api: {
          observedRequests: 1,
          serverFailures: 0,
          availabilityPercent: 100,
          p95LatencyMs: 10,
        },
        automation: { observedJobs: 0, dueJobs: 0, oldestDueMs: 0 },
        delivery: { acceptedReceipts: 0 },
      });
    if (rest === "/billing/subscription")
      return reply(config, {
        subscription: {
          status: "active",
          effectiveStatus: "legacy-active",
          version: 1,
        },
      });
    return reply(config, { items: [], nextCursor: null });
  };
}

// Builds the workspace for state.identity in this page.
export async function startWorkspace(state, { locale = false } = {}) {
  if (locale) {
    const { initializeHostLocale } = await import("/js/host-locale.js");
    initializeHostLocale();
  }
  installHostApi(state);
  window.fixture = state;
  await import("/js/host-dashboard-navigation.js");
  const { loadHostManagement } = await import("/js/host-management.js");
  window.workspaceReady = loadHostManagement(
    {
      uid: state.uid ?? "fixture-user",
      getIdToken: async () => "isolated-token",
    },
    {
      user: {
        uid: state.uid ?? "fixture-user",
        email: state.email ?? "fixture@example.test",
        displayName: "Fixture Person",
        emailVerified: true,
      },
      role: state.plan === undefined ? "user" : state.plan,
      access: { state: "active" },
      mfa: { required: false, enrolled: true, verified: true },
    },
  );
  return window.workspaceReady;
}
