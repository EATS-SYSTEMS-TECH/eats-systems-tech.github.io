import { installAppCheckFixture } from "./app-check-browser-fixture.mjs";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { hostShell, rolePermissions } from "./host-test-shell.mjs";
import { readDemoToken } from "../js/host-demo-link.js";

// My systems, Organization systems, the examples and Try it, against a
// mocked Host API: what each role sees, link / unlink / remove with their
// refusals, and a simulator that never makes a request.
const root = fileURLToPath(new URL("../", import.meta.url));
const shell = hostShell("/systems-fixture.js");

const organization = (id, name, role, available = true) => ({
  id,
  name,
  timezone: "UTC",
  version: 1,
  membership: { role },
  workspace: {
    role,
    permissions: rolePermissions[role],
    service: available
      ? { state: "legacy-active", available: true }
      : { state: "suspended", available: false },
  },
});
const personal = (id, type, name, systemIds, linkedOrganization = null) => ({
  id,
  type,
  targetId: `${id}-target`,
  systemIds,
  name,
  iconId:
    type === "gate"
      ? "door-small"
      : type === "dual-control"
        ? "barrier-gate-small"
        : "home",
  status: "active",
  linkedOrganization,
  version: 2,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
});
const orgSystem = (id, name, source, status = "active") => ({
  id,
  type: "gate",
  targetId: `${id}-target`,
  systemIds: [`${id}-gate`],
  name,
  iconId: "door-small",
  status,
  version: 5,
  source,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
});

function fixture(state) {
  return `
    import { initializeHostLocale } from '/js/host-locale.js';
    import { profileApi } from '/js/api/index.js';
    import '/js/host-dashboard-navigation.js';
    initializeHostLocale();
    import { loadHostManagement } from '/js/host-management.js';
    const state = ${JSON.stringify(state)};
    window.fixture = state;
    state.requests = [];
    state.failures ??= {};
    window.accessErrors = [];
    window.addEventListener('platform:access-error', event => window.accessErrors.push(event.detail.code));
    const reply = (config, data, status = 200) => ({ status, statusText: 'OK', headers: {}, config, data });
    const refuse = (config, { status, code, details }) => {
      throw Object.assign(new Error(code), {
        isAxiosError: true,
        config,
        response: { status, statusText: code, headers: {}, config, data: { error: { code, message: code, ...(details ? { details } : {}) } } },
      });
    };
    const icons = { gate: ['door-small', 'bed-outline', 'garage-small'], 'dual-control': ['barrier-gate-small'], group: ['home', 'hosting'] };
    profileApi.defaults.adapter = async config => {
      const url = new URL(config.url, location.origin);
      const method = config.method.toUpperCase();
      const body = config.data ? JSON.parse(config.data) : undefined;
      const call = method + ' ' + url.pathname;
      state.requests.push({ call, body, key: config.headers.get('idempotency-key') ?? null });
      if (state.failures[call]) return refuse(config, state.failures[call]);
      if (url.pathname === '/api/v1/organizations') return reply(config, { organizations: state.organizations, nextCursor: null });
      if (url.pathname === '/api/v1/me/systems') return reply(config, { items: state.mySystems, nextCursor: null });
      let match = /^\\/api\\/v1\\/me\\/systems\\/([^/]+)\\/(link|unlink|remove)$/.exec(url.pathname);
      if (match) {
        const system = state.mySystems.find(item => item.id === match[1]);
        if (match[2] === 'remove') state.mySystems = state.mySystems.filter(item => item !== system);
        else {
          const target = state.organizations.find(item => item.id === body.organizationId);
          system.linkedOrganization = match[2] === 'link' ? { id: target.id, name: target.name } : null;
          system.version++;
        }
        return reply(config, { system }, match[2] === 'link' ? 201 : 200);
      }
      match = /^\\/api\\/v1\\/organizations\\/([^/]+)\\/reservations$/.exec(url.pathname);
      if (match) {
        const q = url.searchParams;
        const items = (state.reservations?.[match[1]] ?? []).filter(item =>
          item.startsAt < q.get('to') && item.endsAt > q.get('from') &&
          (!q.get('systemId') || item.systemId === q.get('systemId')) &&
          (!q.get('status') || item.status === q.get('status')));
        return reply(config, { items, nextCursor: null });
      }
      match = /^\\/api\\/v1\\/organizations\\/([^/]+)\\/systems(?:\\/([^/]+))?(?:\\/(remove))?$/.exec(url.pathname);
      if (match) {
        const list = state.orgSystems[match[1]] ?? [];
        if (match[2] === 'icons') return reply(config, { icons });
        if (!match[2]) return reply(config, { items: list, nextCursor: null });
        const system = list.find(item => item.id === match[2]);
        if (match[3]) system.status = 'disabled';
        else system.iconId = body.iconId;
        system.version++;
        return reply(config, { system });
      }
      return reply(config, { items: [], nextCursor: null });
    };
    window.workspaceReady = loadHostManagement(
      { uid: state.uid, getIdToken: async () => 'isolated-token' },
      { user: { uid: state.uid, email: state.email, displayName: 'Fixture Person', emailVerified: true }, role: state.plan, access: { state: 'active' }, mfa: { required: false, enrolled: true, verified: true } },
    );
  `;
}

test("My systems, Organization systems, examples and Try it", async (t) => {
  const server = createServer(async (request, response) => {
    try {
      const file = path.resolve(
        root,
        "." + new URL(request.url, "http://localhost").pathname,
      );
      if (!file.startsWith(path.resolve(root) + path.sep))
        return response.writeHead(403).end();
      response.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "application/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : file.endsWith(".svg")
              ? "image/svg+xml"
              : "application/octet-stream",
      );
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const browser = await chromium.launch({
    channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  t.after(() => browser.close());
  const origin = `http://127.0.0.1:${server.address().port}`;

  const defaults = {
    uid: "plan-holder",
    email: "owner@example.test",
    plan: "user",
    organizations: [
      organization("grand", "Grand Hotel", "owner"),
      organization("seaside", "Seaside Rooms", "admin"),
      organization("city", "City Stay", "staff"),
    ],
    mySystems: [
      personal("room-1", "gate", "Room 101", ["g1"]),
      personal("parking", "dual-control", "Parking", ["g2", "g3"], {
        id: "grand",
        name: "Grand Hotel",
      }),
      personal("lobby", "group", "Lobby and floors", ["g1", "g2", "g3"]),
    ],
    orgSystems: {
      grand: [
        orgSystem("parking", "Parking", {
          kind: "personal",
          ownerEmail: "owner@example.test",
        }),
        orgSystem("front", "Front door", {
          kind: "personal",
          ownerEmail: "manager@example.test",
        }),
        orgSystem("side", "Side gate", { kind: "organization" }),
        orgSystem("old", "Old gate", { kind: "organization" }, "disabled"),
      ],
      city: [orgSystem("city-door", "City door", { kind: "organization" })],
    },
  };
  async function scenario(overrides = {}, query = "", viewport) {
    const state = { ...structuredClone(defaults), ...overrides };
    const context = await browser.newContext({
      viewport: viewport ?? { width: 1440, height: 1000 },
    });
    t.after(() => context.close());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === "/systems-fixture.js")
        return route.fulfill({
          contentType: "application/javascript",
          body: fixture(state),
        });
      if (url.pathname === "/dashboard/host/")
        return route.fulfill({ contentType: "text/html", body: shell });
      return route.continue();
    });
    await installAppCheckFixture(page);
  await page.goto(origin + "/dashboard/host/" + query);
    await page.evaluate(() => window.workspaceReady);
    return { page, errors };
  }
  const requests = (page) => page.evaluate(() => window.fixture.requests);
  const writes = async (page) =>
    (await requests(page)).filter((entry) => !entry.call.startsWith("GET "));
  const loaded = (page, view) =>
    page
      .locator(`[data-workspace-view="${view}"][data-loaded="true"]`)
      .waitFor();
  const card = (page, id) =>
    page.locator(`#host-management [data-system-id="${id}"]`);
  const noSidewaysScroll = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  // Every visible button, summary and link under `selector` that a finger
  // cannot hit as a 44px target. An ⓘ draws 28px and reaches 44px through
  // its ::after hit area, which counts.
  const smallTargets = (page, selector) =>
    page.evaluate((selector) => {
      const small = [];
      for (const scope of document.querySelectorAll(selector))
        for (const element of scope.querySelectorAll(
          "button, summary, a[href]",
        )) {
          const box = element.getBoundingClientRect();
          if (!box.width || !box.height || element.closest("[hidden]"))
            continue;
          let { width, height } = box;
          const hit = getComputedStyle(element, "::after");
          if (hit.content !== "none" && hit.position === "absolute") {
            const inset = ["top", "right", "bottom", "left"].map((side) =>
              Math.min(0, parseFloat(hit[side]) || 0),
            );
            height -= inset[0] + inset[2];
            width -= inset[1] + inset[3];
          }
          if (Math.min(width, height) < 44)
            small.push(
              `${element.tagName.toLowerCase()} "${element.textContent.trim().slice(0, 40)}" ${Math.round(width)}x${Math.round(height)}`,
            );
        }
      return small;
    }, selector);
  // The right edges of the text of each `parts` element inside `selector`.
  const textEdges = (page, selector, parts) =>
    page.evaluate(
      ({ selector, parts }) =>
        parts.map((part) => {
          const range = document.createRange();
          range.selectNodeContents(
            document.querySelector(`${selector} ${part}`),
          );
          const box = range.getBoundingClientRect();
          return { left: Math.round(box.left), right: Math.round(box.right) };
        }),
      { selector, parts },
    );
  // WIFIGATE_SCREENSHOT_DIR keeps a picture of each screen for review.
  const shot = async (page, name) => {
    const folder = process.env.WIFIGATE_SCREENSHOT_DIR;
    if (!folder) return;
    await mkdir(folder, { recursive: true });
    await page.screenshot({
      path: path.join(folder, `${name}.png`),
      fullPage: true,
    });
  };

  await t.test(
    "a plan holder's My systems: cards, badges, sidebar and examples",
    async () => {
      const { page, errors } = await scenario();
      await loaded(page, "my-systems");
      assert.equal(
        await page.evaluate(() => document.body.dataset.hostViewId),
        "my-systems",
      );
      const view = page.locator('[data-workspace-view="my-systems"]');
      await shot(page, "my-systems-desktop");
      assert.equal(
        await view.locator(".systems-toolbar__text > span").first().innerText(),
        "3 systems",
      );
      assert.equal(
        await card(page, "room-1").locator(".system-card__kind").innerText(),
        "Gate",
      );
      assert.equal(
        await card(page, "parking").locator(".system-card__kind").innerText(),
        "Dual Control · 2 gates",
      );
      assert.equal(
        await card(page, "lobby").locator(".system-card__kind").innerText(),
        "Group · 3 gates",
      );
      assert.equal(
        await card(page, "room-1").locator("img").getAttribute("src"),
        "/assets/host-icons/gate-door-small.svg",
      );
      assert.equal(
        await card(page, "room-1").locator(".system-badge").innerText(),
        "Not linked",
      );
      assert.equal(
        await card(page, "parking").locator(".system-badge").innerText(),
        "Grand Hotel",
      );
      // Linked: only Unlink. Not linked: Link and Remove.
      assert.deepEqual(
        await card(page, "parking")
          .locator("[data-action]")
          .evaluateAll((items) => items.map((item) => item.dataset.action)),
        ["unlink"],
      );
      assert.deepEqual(
        await card(page, "room-1")
          .locator("[data-action]")
          .evaluateAll((items) => items.map((item) => item.dataset.action)),
        ["link", "remove"],
      );
      // No ids, keys or fingerprints in the normal view.
      const text = await view.innerText();
      assert.doesNotMatch(text, /room-1|target|fingerprint|wgk_|wfg_/i);
      // The sidebar lists every system with its badge.
      const sidebar = page.locator("#host-my-systems");
      assert.equal(await sidebar.isVisible(), true);
      assert.deepEqual(
        await sidebar
          .locator(".sidebar-system")
          .evaluateAll((rows) =>
            rows.map((row) => [
              row.querySelector(".sidebar-system__name").textContent,
              row.querySelector(".system-badge").textContent,
            ]),
          ),
        [
          ["Room 101", "Not linked"],
          ["Parking", "Grand Hotel"],
          ["Lobby and floors", "Not linked"],
        ],
      );
      // Examples lead the view inside a collapsed dropdown.
      const dropdown = view.locator("details[data-examples]");
      assert.equal(await dropdown.getAttribute("open"), null);
      assert.equal(await dropdown.evaluate(el => el.parentElement.firstElementChild === el), true);
      await dropdown.locator("summary").click();
      const examples = view.locator("[data-examples] .system-card");
      assert.deepEqual(
        await examples.evaluateAll((cards) =>
          cards.map(
            (item) => item.querySelector(".system-card__name").textContent,
          ),
        ),
        [
          "Example WIFIGATE Room 212 🥂🍾",
          "Example WIFIGATE Dual Control 212 🥂🍾",
          "Example WIFIGATE Group 212 🥂🍾",
        ],
      );
      for (const index of [0, 1, 2]) {
        const example = examples.nth(index);
        assert.equal(await example.getAttribute("data-example"), "true");
        assert.match(
          await example
            .locator(".system-badges, .system-card__badges")
            .innerText(),
          /Example/,
        );
        assert.equal(
          await example.locator('[data-action="remove"]').count(),
          0,
        );
        assert.equal(
          await example.evaluate(
            (item) => getComputedStyle(item).borderTopStyle,
          ),
          "dashed",
        );
      }
      // A sidebar row opens My systems on that card.
      await page
        .locator('#host-section-navigation [data-view-id="systems"]')
        .click();
      await loaded(page, "systems");
      await sidebar.locator('[data-system-id="lobby"]').click();
      await page.waitForFunction(
        () =>
          document.body.dataset.hostViewId === "my-systems" &&
          document.activeElement?.closest("[data-system-id]")?.dataset
            .systemId === "lobby",
      );
      // My systems are never mixed into the organization's list.
      assert.equal(
        (await requests(page)).filter((entry) =>
          entry.call.startsWith("GET /api/v1/me/systems"),
        ).length,
        1,
        "the view and the sidebar share one read",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "link lists owner and admin organizations, sends one intent and updates the badge",
    async () => {
      const { page, errors } = await scenario();
      await loaded(page, "my-systems");
      await card(page, "room-1").locator('[data-action="link"]').click();
      const dialog = page.locator("dialog.system-dialog[open]");
      await dialog.waitFor();
      assert.deepEqual(
        await dialog
          .locator(".choice__name")
          .evaluateAll((items) => items.map((item) => item.textContent)),
        ["Grand Hotel", "Seaside Rooms"],
        "a staff organization is not offered",
      );
      await shot(page, "link-dialog");
      await dialog.locator('input[value="seaside"]').check();
      await dialog.getByRole("button", { name: "Link", exact: true }).click();
      await dialog.waitFor({ state: "detached" });
      await page.waitForFunction(
        () =>
          document.querySelector(
            '#host-management [data-system-id="room-1"] .system-badge',
          )?.textContent === "Seaside Rooms",
      );
      const [linkCall] = await writes(page);
      assert.equal(linkCall.call, "POST /api/v1/me/systems/room-1/link");
      assert.deepEqual(linkCall.body, {
        version: 2,
        organizationId: "seaside",
      });
      assert.match(linkCall.key, /^[0-9a-f-]{36}$/);
      assert.equal(
        await page
          .locator('#host-my-systems [data-system-id="room-1"] .system-badge')
          .innerText(),
        "Seaside Rooms",
        "the sidebar follows",
      );
      // Focus returns to the changed card.
      await page.waitForFunction(
        () =>
          document.activeElement?.closest("[data-system-id]")?.dataset
            .systemId === "room-1",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "link refusals stay in the dialog and never end the session",
    async () => {
      const { page, errors } = await scenario();
      await loaded(page, "my-systems");
      const dialog = page.locator("dialog.system-dialog[open]");
      for (const [failure, text] of [
        [
          { status: 409, code: "SYSTEM_ALREADY_CLAIMED" },
          "Another organization already uses this system's gates.",
        ],
        [
          { status: 403, code: "TENANT_ACCESS_DENIED" },
          "Only an owner or admin of that organization can do this.",
        ],
        // The organization's service paused after the page opened.
        [
          { status: 403, code: "SUBSCRIPTION_UNAVAILABLE" },
          "Service is unavailable for that organization right now.",
        ],
        // A gate's delegation is missing: only the app can add it again.
        [
          { status: 409, code: "GATE_DELEGATION_REQUIRED" },
          "Add this system again from the WIFIGATE app, then try again.",
        ],
      ]) {
        await page.evaluate((failure) => {
          window.fixture.failures["POST /api/v1/me/systems/room-1/link"] =
            failure;
        }, failure);
        await card(page, "room-1").locator('[data-action="link"]').click();
        await dialog.getByRole("button", { name: "Link", exact: true }).click();
        await dialog.getByText(text, { exact: true }).waitFor();
        await dialog
          .getByRole("button", { name: "Cancel", exact: true })
          .click();
        await dialog.waitFor({ state: "detached" });
      }
      await page.waitForTimeout(100);
      assert.equal(await page.locator("#host-management").isVisible(), true);
      assert.equal(new URL(page.url()).pathname, "/dashboard/host/");
      assert.deepEqual(
        await page.evaluate(() => window.accessErrors),
        [],
        "refusals on My systems never end the session",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "without an owner or admin organization, Link is disabled with an ⓘ",
    async () => {
      const { page, errors } = await scenario({
        organizations: [organization("city", "City Stay", "staff")],
      });
      await loaded(page, "my-systems");
      const link = card(page, "room-1").locator('[data-action="link"]');
      assert.equal(await link.isDisabled(), true);
      assert.equal(
        await card(page, "room-1")
          .locator(".system-action-blocked .info-tip")
          .count(),
        1,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a paused organization is offered disabled with an ⓘ; with none open, Link is disabled",
    async () => {
      const { page, errors } = await scenario({
        organizations: [
          organization("lapsed", "Lapsed Hotel", "owner", false),
          organization("grand", "Grand Hotel", "owner"),
          organization("city", "City Stay", "staff"),
        ],
      });
      await loaded(page, "my-systems");
      await card(page, "room-1").locator('[data-action="link"]').click();
      const dialog = page.locator("dialog.system-dialog[open]");
      await dialog.waitFor();
      assert.deepEqual(
        await dialog
          .locator('input[name="organizationId"]')
          .evaluateAll((inputs) =>
            inputs.map((input) => [input.value, input.disabled, input.checked]),
          ),
        [
          ["lapsed", true, false],
          ["grand", false, true],
        ],
      );
      assert.equal(
        await dialog.locator(".choice-row .info-tip__bubble").textContent(),
        "Service is unavailable for this organization right now.",
      );
      assert.equal(
        await page.evaluate(() => document.activeElement?.value),
        "grand",
        "focus starts on the open choice",
      );
      await dialog.getByRole("button", { name: "Link", exact: true }).click();
      await dialog.waitFor({ state: "detached" });
      const [linkCall] = await writes(page);
      assert.deepEqual(linkCall.body, { version: 2, organizationId: "grand" });
      // Every organization that takes systems is paused: Link is disabled.
      const paused = await scenario({
        organizations: [organization("lapsed", "Lapsed Hotel", "owner", false)],
      });
      await loaded(paused.page, "my-systems");
      assert.equal(
        await card(paused.page, "room-1")
          .locator('[data-action="link"]')
          .isDisabled(),
        true,
      );
      assert.equal(
        await card(paused.page, "room-1")
          .locator(".system-action-blocked .info-tip__bubble")
          .textContent(),
        "Service is unavailable right now for the organizations you can link to.",
      );
      assert.deepEqual(
        await paused.page.evaluate(() => window.accessErrors),
        [],
      );
      assert.deepEqual([...errors, ...paused.errors], []);
    },
  );

  await t.test(
    "an owner of a paused organization: Create guest link and Change icon are disabled, Remove still frees the gates, and a late refusal ends nothing",
    async () => {
      const { page, errors } = await scenario({
        plan: null,
        organizations: [organization("grand", "Grand Hotel", "owner", false)],
      });
      await loaded(page, "systems");
      for (const name of ["guest-link", "icon"])
        assert.equal(
          await card(page, "side")
            .locator(`[data-action="${name}"]`)
            .isDisabled(),
          true,
          `${name} is disabled`,
        );
      assert.deepEqual(
        await card(page, "side")
          .locator(".system-action-blocked .info-tip__bubble")
          .allTextContents(),
        Array(2).fill(
          "Service is unavailable for this organization right now.",
        ),
      );
      // The backend lets a paused organization remove a system, so its gates
      // never stay held: Remove has no ⓘ and sends the removal.
      const removeButton = card(page, "side").locator('[data-action="remove"]');
      assert.equal(await removeButton.isDisabled(), false, "remove is enabled");
      assert.equal(
        await removeButton
          .locator(
            "xpath=ancestor::*[contains(@class, 'system-action-blocked')]",
          )
          .count(),
        0,
      );
      await removeButton.click();
      const danger = page.locator("dialog.system-dialog--danger[open]");
      await danger.getByRole("button", { name: "Remove", exact: true }).click();
      await card(page, "side").waitFor({ state: "detached" });
      assert.deepEqual(
        (await writes(page)).map((entry) => [
          entry.call,
          entry.body,
          Boolean(entry.key),
        ]),
        [
          [
            "POST /api/v1/organizations/grand/systems/side/remove",
            { version: 5 },
            true,
          ],
        ],
      );
      assert.deepEqual(await page.evaluate(() => window.accessErrors), []);
      // The service paused after the page opened: the refused icon change
      // stays in the dialog and the person stays in Host.
      const late = await scenario({
        plan: null,
        organizations: [organization("grand", "Grand Hotel", "owner")],
        failures: {
          "PUT /api/v1/organizations/grand/systems/side": {
            status: 403,
            code: "SUBSCRIPTION_UNAVAILABLE",
          },
        },
      });
      await loaded(late.page, "systems");
      await card(late.page, "side").locator('[data-action="icon"]').click();
      const dialog = late.page.locator("dialog.system-dialog[open]");
      await dialog.locator('input[value="bed-outline"]').check();
      await dialog
        .getByRole("button", { name: "Save icon", exact: true })
        .click();
      await dialog
        .getByText("Service is unavailable for that organization right now.", {
          exact: true,
        })
        .waitFor();
      assert.deepEqual(await late.page.evaluate(() => window.accessErrors), []);
      assert.equal(new URL(late.page.url()).pathname, "/dashboard/host/");
      assert.deepEqual([...errors, ...late.errors], []);
    },
  );

  await t.test(
    "unlink refused by bookings shows the count and opens them",
    async () => {
      const { page, errors } = await scenario({
        failures: {
          "POST /api/v1/me/systems/parking/unlink": {
            status: 409,
            code: "SYSTEM_HAS_BOOKINGS",
            details: { count: 3 },
          },
        },
      });
      await loaded(page, "my-systems");
      await card(page, "parking").locator('[data-action="unlink"]').click();
      const dialog = page.locator("dialog.system-dialog--danger[open]");
      await dialog.waitFor();
      assert.equal(
        await dialog.locator("h2").innerText(),
        "Unlink Parking from Grand Hotel?",
      );
      assert.equal(
        await page.evaluate(() => document.activeElement.textContent),
        "Cancel",
        "a red confirmation opens on Cancel",
      );
      await dialog.getByRole("button", { name: "Unlink", exact: true }).click();
      await dialog
        .getByText(
          "3 upcoming bookings use this system. Move or cancel them first.",
        )
        .waitFor();
      // The refused change cannot be sent again; focus moves to the way on.
      await page.waitForFunction(() =>
        document.activeElement?.hasAttribute("data-open-bookings"),
      );
      assert.equal(
        await dialog
          .getByRole("button", { name: "Unlink", exact: true })
          .count(),
        0,
      );
      assert.equal(
        await dialog
          .getByRole("button", { name: "Close", exact: true })
          .count(),
        1,
      );
      await shot(page, "unlink-bookings");
      await dialog
        .getByRole("button", { name: "Open bookings", exact: true })
        .click();
      await page.waitForFunction(
        () => document.body.dataset.hostViewId === "bookings",
      );
      assert.equal(new URL(page.url()).searchParams.get("org"), "grand");
      assert.equal(
        await page
          .locator("#workspace-org-switcher .org-card")
          .getAttribute("data-organization-id"),
        "grand",
      );
      assert.equal(
        (await writes(page)).length,
        1,
        "the refused unlink changed nothing",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "unlink refused by bookings in an organization the person left says who can move them",
    async () => {
      const { page, errors } = await scenario({
        mySystems: [
          personal("parking", "dual-control", "Parking", ["g2", "g3"], {
            id: "left",
            name: "Old Inn",
          }),
        ],
        failures: {
          "POST /api/v1/me/systems/parking/unlink": {
            status: 409,
            code: "SYSTEM_HAS_BOOKINGS",
            details: { count: 2 },
          },
        },
      });
      await loaded(page, "my-systems");
      await card(page, "parking").locator('[data-action="unlink"]').click();
      const dialog = page.locator("dialog.system-dialog--danger[open]");
      await dialog.getByRole("button", { name: "Unlink", exact: true }).click();
      const status = dialog.locator(".system-dialog__status");
      await page.waitForFunction(
        () =>
          document.querySelector("dialog[open] .system-dialog__status")
            ?.textContent ===
          "2 upcoming bookings use this system. Ask an owner or admin of Old Inn to move or cancel them.",
      );
      assert.deepEqual(await status.locator("bdi").allTextContents(), [
        "2",
        "Old Inn",
      ]);
      assert.equal(await dialog.locator("[data-open-bookings]").count(), 0);
      assert.equal(
        await dialog
          .getByRole("button", { name: "Unlink", exact: true })
          .count(),
        0,
      );
      await page.waitForFunction(
        () => document.activeElement?.textContent === "Close",
      );
      await page.keyboard.press("Enter");
      await dialog.waitFor({ state: "detached" });
      assert.equal(
        await page.evaluate(() => document.activeElement?.dataset.action),
        "unlink",
        "focus returns to Unlink",
      );
      assert.equal((await writes(page)).length, 1);
      assert.equal(
        await page.evaluate(() => document.body.dataset.hostViewId),
        "my-systems",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "unlink in another organization than the selected one switches to it",
    async () => {
      const { page, errors } = await scenario(
        {
          failures: {
            "POST /api/v1/me/systems/parking/unlink": {
              status: 409,
              code: "SYSTEM_HAS_BOOKINGS",
            },
          },
        },
        "?org=seaside",
      );
      await loaded(page, "my-systems");
      await card(page, "parking").locator('[data-action="unlink"]').click();
      const dialog = page.locator("dialog.system-dialog--danger[open]");
      await dialog.getByRole("button", { name: "Unlink", exact: true }).click();
      await dialog
        .getByText(
          "Upcoming bookings use this system. Move or cancel them first.",
        )
        .waitFor();
      await dialog
        .getByRole("button", { name: "Open bookings", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.body.dataset.hostViewId === "bookings" &&
          document.querySelector("#workspace-org-switcher .org-card")?.dataset
            .organizationId === "grand",
      );
      assert.equal(new URL(page.url()).searchParams.get("org"), "grand");
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Open bookings after a refused removal shows that system's upcoming bookings, stays on now included",
    async () => {
      const hour = 3600000;
      const at = (hours) => new Date(Date.now() + hours * hour).toISOString();
      const stay = (
        id,
        systemId,
        systemName,
        from,
        to,
        status = "confirmed",
      ) => ({
        id,
        systemId,
        systemName,
        targetIds: [systemId],
        guest: { name: `Guest ${id}` },
        startsAt: at(from),
        endsAt: at(to),
        status,
        version: 1,
      });
      const reservations = {
        grand: [
          stay("now", "parking", "Parking", -20, 20),
          stay("tomorrow", "parking", "Parking", 30, 60),
          stay("cancelled", "parking", "Parking", 40, 70, "cancelled"),
          stay("over", "parking", "Parking", -60, -30),
          stay("other", "side", "Side gate", 30, 60),
        ],
      };
      // My systems names the system by its own id; the organization's copy
      // has another id and the same gates.
      const { page, errors } = await scenario(
        {
          reservations,
          mySystems: [
            {
              ...personal("my-parking", "gate", "Parking", ["g9"], {
                id: "grand",
                name: "Grand Hotel",
              }),
              targetId: "parking-target",
            },
          ],
          failures: {
            "POST /api/v1/me/systems/my-parking/unlink": {
              status: 409,
              code: "SYSTEM_HAS_BOOKINGS",
              details: { count: 2 },
            },
            "POST /api/v1/organizations/grand/systems/side/remove": {
              status: 409,
              code: "SYSTEM_HAS_BOOKINGS",
              details: { count: 1 },
            },
          },
        },
        "?org=seaside",
      );
      await loaded(page, "my-systems");
      await card(page, "my-parking").locator('[data-action="unlink"]').click();
      let dialog = page.locator("dialog.system-dialog--danger[open]");
      await dialog.getByRole("button", { name: "Unlink", exact: true }).click();
      await dialog.locator("[data-open-bookings]").waitFor();
      // The refused dialog stops asking.
      assert.equal(
        await dialog.locator("h2").textContent(),
        "Can't unlink Parking yet",
      );
      assert.equal(await dialog.locator(".system-dialog__text").count(), 0);
      await dialog.locator("[data-open-bookings]").click();
      const view = page.locator('[data-workspace-view="bookings"]');
      await page.waitForFunction(
        () =>
          document.querySelector(
            '[data-workspace-view="bookings"] .bookings-filter:not([hidden])',
          ) &&
          document.querySelector(
            '[data-workspace-view="bookings"] .booking-row',
          ),
      );
      assert.equal(new URL(page.url()).searchParams.get("org"), "grand");
      assert.equal(
        await view
          .locator('[aria-pressed="true"][data-bookings-tab]')
          .getAttribute("data-bookings-tab"),
        "upcoming",
      );
      assert.equal(
        await view.locator(".bookings-filter__text").innerText(),
        "Only Parking",
      );
      const rows = () =>
        view
          .locator(".booking-row")
          .evaluateAll((items) => items.map((item) => item.dataset.bookingId));
      assert.deepEqual(await rows(), ["now", "tomorrow"]);
      const read = (await requests(page)).filter((entry) =>
        entry.call.endsWith("/organizations/grand/reservations"),
      );
      assert.ok(read.length >= 1);
      // Show all systems: every system's upcoming bookings again.
      await view
        .getByRole("button", { name: "Show all systems", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelectorAll(
            '[data-workspace-view="bookings"] .booking-row',
          ).length === 2 &&
          document.querySelector(
            '[data-workspace-view="bookings"] [data-booking-id="other"]',
          ),
      );
      assert.equal(await view.locator(".bookings-filter").isVisible(), false);
      assert.deepEqual(await rows(), ["tomorrow", "other"]);

      // In the selected organization: Organization systems → Remove →
      // Open bookings shows that system's bookings at once.
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent("host:workspace-view", { detail: "systems" }),
        ),
      );
      await loaded(page, "systems");
      await card(page, "side").locator('[data-action="remove"]').click();
      dialog = page.locator("dialog.system-dialog--danger[open]");
      await dialog.getByRole("button", { name: "Remove", exact: true }).click();
      await dialog.locator("[data-open-bookings]").click();
      await page.waitForFunction(
        () =>
          document.querySelector(
            '[data-workspace-view="bookings"] .bookings-filter__text',
          )?.textContent === "Only Side gate" &&
          document.querySelectorAll(
            '[data-workspace-view="bookings"] .booking-row',
          ).length === 1,
      );
      assert.deepEqual(await rows(), ["other"]);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "unlink and remove succeed; a linked system cannot be removed",
    async () => {
      const { page, errors } = await scenario({
        failures: {
          "POST /api/v1/me/systems/lobby/remove": {
            status: 409,
            code: "SYSTEM_LINKED",
          },
        },
      });
      await loaded(page, "my-systems");
      await card(page, "parking").locator('[data-action="unlink"]').click();
      let dialog = page.locator("dialog.system-dialog--danger[open]");
      await dialog.getByRole("button", { name: "Unlink", exact: true }).click();
      await page.waitForFunction(
        () =>
          document.querySelector(
            '#host-management [data-system-id="parking"] .system-badge',
          )?.textContent === "Not linked",
      );
      await card(page, "room-1").locator('[data-action="remove"]').click();
      dialog = page.locator("dialog.system-dialog--danger[open]");
      assert.equal(
        await dialog.locator("h2").innerText(),
        "Remove Room 101 from My systems?",
      );
      await dialog.getByRole("button", { name: "Remove", exact: true }).click();
      await card(page, "room-1").waitFor({ state: "detached" });
      await card(page, "lobby").locator('[data-action="remove"]').click();
      await dialog.getByRole("button", { name: "Remove", exact: true }).click();
      await dialog
        .getByText("Unlink it from its organization first.")
        .waitFor();
      const calls = (await writes(page)).map((entry) => [
        entry.call,
        entry.body,
      ]);
      assert.deepEqual(calls, [
        ["POST /api/v1/me/systems/parking/unlink", { version: 2 }],
        ["POST /api/v1/me/systems/room-1/remove", { version: 2 }],
        ["POST /api/v1/me/systems/lobby/remove", { version: 2 }],
      ]);
      assert.equal(
        await page
          .locator('#host-my-systems [data-system-id="room-1"]')
          .count(),
        0,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a Host plan that ended is a local refusal, not a session end",
    async () => {
      const { page, errors } = await scenario({
        failures: {
          "GET /api/v1/me/systems": { status: 403, code: "HOST_PLAN_REQUIRED" },
        },
      });
      const view = page.locator('[data-workspace-view="my-systems"]');
      await view.getByText("My systems needs an active Host plan.").waitFor();
      await page.waitForTimeout(100);
      assert.equal(new URL(page.url()).pathname, "/dashboard/host/");
      assert.equal(await page.locator("#host-my-systems").isVisible(), false);
      assert.equal(
        await view
          .getByRole("button", { name: "Check again", exact: true })
          .count(),
        1,
      );
      assert.equal(
        await view.locator("[data-examples] .system-card").count(),
        3,
        "the examples and Try it stay",
      );
      assert.deepEqual(await page.evaluate(() => window.accessErrors), []);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a My systems read that fails offers Try again and keeps the examples",
    async () => {
      const { page, errors } = await scenario({
        failures: {
          "GET /api/v1/me/systems": { status: 500, code: "INTERNAL" },
        },
      });
      const view = page.locator('[data-workspace-view="my-systems"]');
      await view
        .getByText("That didn't work. Try again.", { exact: true })
        .waitFor();
      assert.equal(
        await view.locator("[data-examples] .system-card").count(),
        3,
      );
      await page.evaluate(() => {
        delete window.fixture.failures["GET /api/v1/me/systems"];
      });
      await view
        .getByRole("button", { name: "Try again", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelectorAll(
            '[data-workspace-view="my-systems"] .system-card:not([data-example])',
          ).length === 3,
      );
      await page.locator("#host-my-systems .sidebar-system").nth(2).waitFor();
      assert.equal(
        await view.locator("[data-examples]").count(),
        1,
        "one examples group",
      );
      assert.deepEqual(await page.evaluate(() => window.accessErrors), []);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "organization systems for an owner: sources, icon change and removal",
    async () => {
      const { page, errors } = await scenario({}, "?view=systems");
      await loaded(page, "systems");
      const view = page.locator('[data-workspace-view="systems"]');
      assert.equal(
        await view.locator(".systems-toolbar__text > span").first().innerText(),
        "3 systems",
      );
      assert.equal(
        await card(page, "old").count(),
        0,
        "disabled systems stay hidden",
      );
      assert.equal(
        await card(page, "parking").locator(".system-badge").innerText(),
        "Linked from your My systems",
      );
      assert.equal(
        await card(page, "front").locator(".system-badge").innerText(),
        "Linked by manager@example.test",
      );
      assert.equal(
        await card(page, "side").locator(".system-badge").innerText(),
        "Added in the app",
      );
      assert.equal(
        await view.locator("[data-examples]").count(),
        0,
        "a plan holder's examples live in My systems",
      );
      await shot(page, "organization-systems-owner");
      // Change icon: only the icon and the version.
      await card(page, "side").locator('[data-action="icon"]').click();
      const dialog = page.locator("dialog.system-dialog[open]");
      await dialog.locator('input[value="bed-outline"]').check();
      await dialog
        .getByRole("button", { name: "Save icon", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document
            .querySelector('#host-management [data-system-id="side"] img')
            ?.getAttribute("src") === "/assets/host-icons/gate-bed-outline.svg",
      );
      // Remove a linked system: it goes back to its owner's My systems.
      await card(page, "front").locator('[data-action="remove"]').click();
      const danger = page.locator("dialog.system-dialog--danger[open]");
      assert.match(
        await danger.locator(".system-dialog__text").innerText(),
        /^It goes back to the My systems of manager@example\.test\./,
      );
      await danger.getByRole("button", { name: "Remove", exact: true }).click();
      await card(page, "front").waitFor({ state: "detached" });
      const calls = (await writes(page)).map((entry) => [
        entry.call,
        entry.body,
        Boolean(entry.key),
      ]);
      assert.deepEqual(calls, [
        [
          "PUT /api/v1/organizations/grand/systems/side",
          { version: 5, iconId: "bed-outline" },
          true,
        ],
        [
          "POST /api/v1/organizations/grand/systems/front/remove",
          { version: 5 },
          true,
        ],
      ]);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "organization removal refused by bookings opens this organization's bookings",
    async () => {
      const { page, errors } = await scenario({
        plan: null,
        failures: {
          "POST /api/v1/organizations/grand/systems/side/remove": {
            status: 409,
            code: "SYSTEM_HAS_BOOKINGS",
            details: { count: 1 },
          },
        },
      });
      await loaded(page, "systems");
      await card(page, "side").locator('[data-action="remove"]').click();
      const dialog = page.locator("dialog.system-dialog--danger[open]");
      assert.match(
        await dialog.locator(".system-dialog__text").innerText(),
        /^To use it here again, add it from the WIFIGATE app\./,
      );
      await dialog.getByRole("button", { name: "Remove", exact: true }).click();
      await dialog
        .getByText(
          "1 upcoming booking uses this system. Move or cancel it first.",
        )
        .waitFor();
      await dialog
        .getByRole("button", { name: "Open bookings", exact: true })
        .click();
      await page.waitForFunction(
        () => document.body.dataset.hostViewId === "bookings",
      );
      assert.equal(
        await card(page, "side").isVisible(),
        false,
        "the systems view is no longer on screen",
      );
      assert.deepEqual(errors, []);
    },
  );

  for (const [role, query, tip] of [
    [
      "owner",
      "",
      "Add systems from the WIFIGATE app: open your profile → WIFIGATE Host → “Add to Grand Hotel”. Rename them there too.",
    ],
    [
      "admin",
      "?lang=he",
      "מוסיפים מערכות מאפליקציית WIFIGATE: פרופיל ← WIFIGATE Host ← „הוספה ל־Grand Hotel”. גם את השם משנים שם.",
    ],
  ])
    await t.test(
      `organization systems for an ${role} with systems still say how to add one from the app`,
      async () => {
        const { page, errors } = await scenario(
          {
            plan: null,
            organizations: [organization("grand", "Grand Hotel", role)],
          },
          query,
        );
        await loaded(page, "systems");
        const view = page.locator('[data-workspace-view="systems"]');
        assert.equal(
          await view.locator(".system-card:not([data-example])").count(),
          3,
        );
        assert.equal(await view.locator(".app-steps").count(), 0);
        assert.equal(
          await view
            .locator(".systems-toolbar .info-tip__bubble")
            .textContent(),
          tip,
        );
        assert.deepEqual(errors, []);
      },
    );

  for (const role of ["staff", "viewer"])
    await t.test(
      `organization systems for ${role}: no system changes, examples without a plan`,
      async () => {
        const { page, errors } = await scenario({
          plan: null,
          organizations: [organization("grand", "Grand Hotel", role)],
        });
        await loaded(page, "systems");
        const view = page.locator('[data-workspace-view="systems"]');
        // Staff book (Create guest link); neither changes a system.
        assert.deepEqual(
          await view
            .locator('[data-system-id="side"] [data-action]')
            .evaluateAll((buttons) =>
              buttons.map((button) => button.dataset.action),
            ),
          role === "staff" ? ["guest-link"] : [],
        );
        assert.equal(
          await view.locator(".system-card:not([data-example])").count(),
          3,
        );
        assert.equal(
          await view.locator("[data-examples] .system-card").count(),
          3,
        );
        assert.equal(
          await view
            .locator(".systems-toolbar .info-tip__bubble")
            .textContent(),
          "To rename a system, rename it in the WIFIGATE app.",
        );
        assert.equal(
          (await requests(page)).some((entry) =>
            entry.call.includes("/api/v1/me/"),
          ),
          false,
          "an organization member never calls My systems",
        );
        assert.deepEqual(errors, []);
      },
    );

  await t.test(
    "empty organization: the app steps for an owner, one sentence for others",
    async () => {
      const owner = await scenario({
        plan: null,
        organizations: [organization("seaside", "Seaside Rooms", "owner")],
      });
      await loaded(owner.page, "systems");
      await shot(owner.page, "organization-empty-owner");
      const steps = owner.page.locator(
        '[data-workspace-view="systems"] .app-steps li',
      );
      assert.equal(await steps.count(), 3);
      assert.equal(
        await steps.nth(2).innerText(),
        "Choose Seaside Rooms and tap “Add to Seaside Rooms” next to the system.",
      );
      const viewer = await scenario({
        plan: null,
        organizations: [organization("seaside", "Seaside Rooms", "viewer")],
      });
      await loaded(viewer.page, "systems");
      await viewer.page
        .getByText("Ask an owner to add systems.", { exact: true })
        .waitFor();
      assert.equal(await viewer.page.locator(".app-steps").count(), 0);
      const empty = await scenario({ mySystems: [] });
      await loaded(empty.page, "my-systems");
      await empty.page
        .getByText("Add your first system from the app.", { exact: true })
        .waitFor();
      await shot(empty.page, "my-systems-empty");
      assert.equal(
        await empty.page
          .locator('[data-workspace-view="my-systems"] .app-steps li')
          .nth(2)
          .innerText(),
        "Tap “Add to My systems” next to the system.",
      );
      assert.deepEqual(
        [...owner.errors, ...viewer.errors, ...empty.errors],
        [],
      );
    },
  );

  for (const role of ["owner", "admin", "staff", "viewer"])
    await t.test(
      `examples for ${role === "admin" ? "an" : "a"} ${role} without a plan: Try it, a link badge and a local link`,
      async () => {
        const { page, errors } = await scenario({
          plan: null,
          organizations: [organization("grand", "Grand Hotel", role)],
        });
        await loaded(page, "systems");
        const examples = page.locator(
          '[data-workspace-view="systems"] [data-examples] .system-card',
        );
        assert.equal(await examples.count(), 3);
        for (const index of [0, 1, 2]) {
          const example = examples.nth(index);
          assert.deepEqual(
            await example
              .locator("[data-action]")
              .evaluateAll((buttons) =>
                buttons.map((button) => button.dataset.action),
              ),
            ["try", "link"],
          );
          assert.deepEqual(
            await example.locator(".system-badge").allTextContents(),
            ["Example", "Not linked"],
          );
        }
        // Linking only changes the example's own badge, in this browser.
        const before = (await requests(page)).length;
        const example = page.locator(
          '[data-workspace-view="systems"] [data-system-id="example-room-212"]',
        );
        if (await example.locator("xpath=ancestor::details").getAttribute("open") === null)
          await example.locator("xpath=ancestor::details/summary").click();
        await example.locator('[data-action="link"]').click();
        const dialog = page.locator("dialog.system-dialog[open]");
        await dialog.locator('input[value="grand"]').check();
        await dialog.getByRole("button", { name: "Link", exact: true }).click();
        await example
          .locator(".system-badge--org", { hasText: "Grand Hotel" })
          .waitFor();
        assert.deepEqual(
          await example.locator(".system-badge").allTextContents(),
          ["Example", "Grand Hotel"],
        );
        assert.deepEqual(
          await example
            .locator("[data-action]")
            .evaluateAll((buttons) =>
              buttons.map((button) => button.dataset.action),
            ),
          ["try", "unlink"],
        );
        if (await example.locator("xpath=ancestor::details").getAttribute("open") === null)
          await example.locator("xpath=ancestor::details/summary").click();
        await example.locator('[data-action="unlink"]').click();
        await example.locator(".system-badge--none").waitFor();
        assert.equal((await requests(page)).length, before, "no API call");
        assert.deepEqual(errors, []);
      },
    );

  for (const [label, overrides] of [
    ["a Host user", {}],
    ["a Host admin", { plan: "admin" }],
  ])
    await t.test(
      `examples for ${label}: a local link that never reaches the server`,
      async () => {
        const { page, errors } = await scenario(overrides);
        const view = overrides.plan === null ? "systems" : "my-systems";
        await loaded(page, view);
        const before = (await requests(page)).length;
        const example = page.locator(
          `[data-workspace-view="${view}"] [data-system-id="example-room-212"]`,
        );
        if (await example.locator("xpath=ancestor::details").getAttribute("open") === null)
          await example.locator("xpath=ancestor::details/summary").click();
        await example.locator('[data-action="link"]').click();
        const dialog = page.locator("dialog.system-dialog[open]");
        await dialog.locator('input[value="grand"]').check();
        await dialog.getByRole("button", { name: "Link", exact: true }).click();
        await page.waitForFunction(
          (view) =>
            document.querySelector(
              `[data-workspace-view="${view}"] [data-system-id="example-room-212"] .system-badge--org`,
            )?.textContent === "Grand Hotel",
          view,
        );
        assert.equal((await requests(page)).length, before, "no API call");
        const stored = await page.evaluate(async (uid) => {
          const digest = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(uid),
          );
          const key =
            "wg.host.examples.v1." +
            [...new Uint8Array(digest)]
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("");
          return [key, localStorage.getItem(key), Object.keys(localStorage)];
        }, "plan-holder");
        assert.deepEqual(JSON.parse(stored[1]), {
          "example-room-212": { id: "grand", name: "Grand Hotel" },
        });
        assert.equal(
          stored[2].some((key) => key.includes("plan-holder")),
          false,
          "the uid itself is never stored",
        );
        // It stays linked after a reload, and Unlink only changes the badge.
        await page.reload();
        await page.evaluate(() => window.workspaceReady);
        await loaded(page, view);
        if (await example.locator("xpath=ancestor::details").getAttribute("open") === null)
          await example.locator("xpath=ancestor::details/summary").click();
        await example.locator('[data-action="unlink"]').click();
        await example.locator(".system-badge--none").waitFor();
        assert.equal(
          (await requests(page)).some((entry) =>
            /example|calendar|reservations/.test(entry.call),
          ),
          false,
        );
        assert.deepEqual(errors, []);
      },
    );

  await t.test(
    "Try it makes a demo link with zero network requests",
    async () => {
      const { page, errors } = await scenario({}, "?lang=he");
      await loaded(page, "my-systems");
      // Only the page's own font files may load (a new glyph needs them);
      // nothing else, and nothing to another origin.
      const network = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (url.protocol === "data:") return;
        if (
          request.resourceType() === "font" &&
          url.origin === origin &&
          url.pathname.startsWith("/assets/fonts/")
        )
          return;
        network.push(request.resourceType() + " " + request.url());
      });
      const before = (await requests(page)).length;
      await page.locator("details[data-examples] > summary").click();
      await page
        .locator('[data-system-id="example-room-212"] [data-action="try"]')
        .click();
      const dialog = page.locator("dialog.try-it[open]");
      await dialog.waitFor();
      await shot(page, "try-it-he");
      // The default view: the guest form and the link card.
      assert.equal(
        await dialog.locator('input[name="name"]').inputValue(),
        "נועה לוי",
      );
      assert.equal(
        await dialog.locator('input[name="phone"]').inputValue(),
        "+44 7700 900212",
      );
      const arrive = await dialog
        .locator('input[name="startsAt"]')
        .inputValue();
      const leave = await dialog.locator('input[name="endsAt"]').inputValue();
      assert.match(arrive, /T15:00$/);
      assert.match(leave, /T12:00$/);
      assert.equal(
        new Date(leave).getTime() - new Date(arrive).getTime(),
        21 * 3600 * 1000 +
          (new Date(leave).getTimezoneOffset() -
            new Date(arrive).getTimezoneOffset()) *
            60000,
      );
      const link = await dialog
        .locator("[data-open-guest]")
        .getAttribute("href");
      assert.ok(
        link.startsWith("https://wifigate.io/wifigate-api/?ep=v1.demo_"),
      );
      const token = readDemoToken(new URL(link).searchParams.get("ep"));
      assert.equal(token.k, "room");
      assert.equal(token.ss, new Date(arrive).getTime());
      assert.equal(token.se, new Date(leave).getTime());
      assert.doesNotMatch(link, /%2B|נועה|Christopher/);
      const whatsapp = await dialog
        .locator("[data-whatsapp]")
        .getAttribute("href");
      assert.ok(
        whatsapp.startsWith("https://wa.me/?text="),
        "WhatsApp opens with no number",
      );
      assert.ok(decodeURIComponent(whatsapp).includes(link));
      // The developer section is collapsed and carries placeholders only.
      const developer = dialog.locator(".try-it__developer");
      assert.equal(await developer.evaluate((element) => element.open), false);
      await developer.locator("summary").click();
      const code = dialog.locator(".try-it__code");
      const request = await code.innerText();
      assert.match(
        request,
        /^POST https:\/\/api\.wifigate\.io\/v1\/guest-invitations/,
      );
      assert.match(request, /Bearer <YOUR_API_KEY>/);
      assert.match(request, /<HOST_KEY_FROM_THE_WIFIGATE_APP>/);
      assert.doesNotMatch(request, /wfg_live_k_|wgk_live/);
      await dialog.locator('[data-code="response"]').click();
      const response = JSON.parse(
        (await code.innerText()).split("\n\n").slice(1).join("\n\n"),
      );
      assert.equal(response.status, "issued");
      assert.equal(response.physicalGateCount, 1);
      assert.equal(response.inviteUrl, link);
      assert.match(response.effectiveEndsAt, /:59\.999Z$/);
      // A changed stay makes a new link; a wrong phone is one sentence.
      await dialog.locator('input[name="name"]').fill("Dana");
      await dialog
        .locator('input[name="startsAt"]')
        .fill(arrive.replace(/T15:00$/, "T16:30"));
      await dialog.locator('input[name="phone"]').fill("abc");
      await dialog
        .getByRole("button", { name: "יצירת קישור לאורח", exact: true })
        .click();
      await dialog
        .getByText("הזינו את הטלפון עם קידומת המדינה, למשל ‎+44 7700 900212.")
        .waitFor();
      await dialog.locator('input[name="phone"]').fill("+972 50 000 0212");
      await dialog
        .getByRole("button", { name: "יצירת קישור לאורח", exact: true })
        .click();
      await page.waitForFunction(
        (previous) =>
          document
            .querySelector("dialog.try-it [data-open-guest]")
            ?.getAttribute("href") !== previous,
        link,
      );
      // What is typed (not yet sent) follows to the other tracks.
      await dialog.locator('input[name="name"]').fill("Maya");
      // Booking system: a 202, then the link comes back.
      await dialog.locator('[data-track="booking"]').click();
      assert.equal(await dialog.locator(".link-card").isHidden(), true);
      assert.match(
        await dialog.locator(".try-it__card").innerText(),
        /^Maya · /m,
        "the booking carries the guest typed by hand",
      );
      await dialog
        .getByRole("button", { name: "שליחת ההזמנה ל־WIFIGATE", exact: true })
        .click();
      await dialog.locator(".try-it__steps li").nth(2).waitFor();
      await dialog.locator("[data-open-guest]").waitFor();
      await dialog.locator('[data-code="request"]').click();
      const webhook = await code.innerText();
      assert.match(
        webhook,
        /^POST https:\/\/api\.wifigate\.io\/v1\/webhooks\/reservations/,
      );
      assert.match(webhook, /"type": "reservation\.created"/);
      assert.match(webhook, /Idempotency-Key: sandbox-pms-A-212-revision-1/);
      await dialog.locator('[data-code="response"]').click();
      assert.match(await code.innerText(), /^HTTP\/1\.1 202 Accepted/);
      assert.match(await code.innerText(), /wifigate-guest-delivery-v1/);
      // Payment: success makes a link, a failed payment makes none.
      await dialog.locator('[data-track="payment"]').click();
      const checkout = await dialog.locator(".try-it__checkout").innerText();
      assert.match(checkout, /₪450/);
      assert.doesNotMatch(
        checkout,
        /stripe|paypal|visa|mastercard|card number/i,
      );
      assert.equal(
        await dialog
          .locator('input[autocomplete^="cc-"], input[name*="card"]')
          .count(),
        0,
      );
      await dialog
        .getByRole("button", { name: "הדמיית תשלום שנכשל", exact: true })
        .click();
      await dialog
        .getByText("התשלום נכשל, ולכן לא נוצר קישור לאורח.")
        .waitFor();
      assert.equal(await dialog.locator("[data-open-guest]").count(), 0);
      // A failed payment sends nothing: no tab shows a request.
      for (const tab of ["response", "request", "curl", "javascript"]) {
        await dialog.locator(`[data-code="${tab}"]`).click();
        assert.equal(
          await code.innerText(),
          "כשהתשלום נכשל לא נשלחת בקשה.",
          `${tab} after a failed payment`,
        );
      }
      await dialog
        .getByRole("button", { name: "הדמיית תשלום מוצלח", exact: true })
        .click();
      await dialog.locator("[data-open-guest]").waitFor();
      await shot(page, "try-it-payment-he");
      // QR from the bundled library.
      await dialog.getByRole("button", { name: "קוד QR", exact: true }).click();
      assert.match(
        await dialog.locator(".link-card__qr img").getAttribute("src"),
        /^data:image\/gif;base64,/,
      );
      // Back by hand: the form still holds what was typed.
      await dialog.locator('[data-track="manual"]').click();
      assert.equal(
        await dialog.locator('input[name="name"]').inputValue(),
        "Maya",
      );
      assert.equal(
        await dialog.locator('input[name="phone"]').inputValue(),
        "+972 50 000 0212",
      );
      await dialog.locator('[data-track="payment"]').click();
      await dialog.locator("[data-open-guest]").waitFor();
      // Phone widths, Hebrew: nothing scrolls sideways, every control
      // (the developer section's summary included) is a 44px target.
      for (const width of [390, 320]) {
        await page.setViewportSize({ width, height: 800 });
        assert.ok(
          await dialog.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
          `Try it fits at ${width}px`,
        );
        await shot(page, `try-it-${width}`);
        assert.ok(await noSidewaysScroll(page));
        assert.deepEqual(await smallTargets(page, "dialog.try-it"), []);
      }
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "detached" });
      assert.equal(
        await page.evaluate(() => document.activeElement?.dataset.action),
        "try",
        "focus returns to Try it",
      );
      assert.deepEqual(network, [], "the simulator made no request");
      assert.equal((await requests(page)).length, before, "and no API call");
      assert.deepEqual(errors, []);
    },
  );

  for (const width of [390, 320])
    await t.test(
      `systems screens fit a ${width}px phone in Hebrew with 44px targets`,
      async () => {
        const { page, errors } = await scenario({}, "?lang=he", {
          width,
          height: 844,
        });
        await loaded(page, "my-systems");
        assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
        assert.ok(await noSidewaysScroll(page), "My systems");
        await shot(page, `my-systems-he-${width}`);
        assert.deepEqual(
          await smallTargets(
            page,
            '[data-workspace-view="my-systems"], #host-my-systems',
          ),
          [],
        );
        // A Latin name keeps the page's direction: it lines up on the right
        // with its kind line, and "Dual Control · 2" stays in reading order.
        for (const id of ["example-room-212", "example-dual-212", "parking"]) {
          const edges = await textEdges(
            page,
            `[data-workspace-view="my-systems"] [data-system-id="${id}"]`,
            [".system-card__name", ".system-card__kind"],
          );
          assert.ok(
            Math.abs(edges[0].right - edges[1].right) <= 1,
            `${id}: name ${JSON.stringify(edges)}`,
          );
        }
        const kind = card(page, "parking").locator(".system-card__kind");
        assert.equal(await kind.textContent(), "Dual Control · 2 שערים");
        const order = await kind.evaluate((line) => {
          const [label, count] = [...line.querySelectorAll("bdi")].map((bdi) =>
            bdi.getBoundingClientRect(),
          );
          const range = document.createRange();
          range.selectNodeContents(line.lastChild);
          const words = range.getBoundingClientRect();
          return { label, count, words };
        });
        assert.ok(
          order.label.left >= order.count.right - 1 &&
            order.count.left >= order.words.right - 1,
          `kind line order ${JSON.stringify(order)}`,
        );
        await page
          .locator('[data-system-id="room-1"] [data-action="link"]')
          .click();
        const dialog = page.locator("dialog.system-dialog[open]");
        await dialog.waitFor();
        assert.ok(
          await dialog.evaluate(
            (element) => element.scrollWidth <= element.clientWidth + 1,
          ),
        );
        assert.deepEqual(
          await smallTargets(page, "dialog.system-dialog[open]"),
          [],
        );
        // Each organization name sits right next to its radio.
        const gaps = await dialog
          .locator("label.choice")
          .evaluateAll((labels) =>
            labels.map((label) => {
              const radio = label
                .querySelector("input")
                .getBoundingClientRect();
              const range = document.createRange();
              range.selectNodeContents(label.querySelector(".choice__name"));
              return radio.left - range.getBoundingClientRect().right;
            }),
          );
        assert.ok(
          gaps.every((gap) => gap >= 0 && gap <= 16),
          `name to radio ${JSON.stringify(gaps)}`,
        );
        await page.keyboard.press("Escape");
        await page.evaluate(() =>
          window.dispatchEvent(
            new CustomEvent("host:workspace-view", { detail: "systems" }),
          ),
        );
        await loaded(page, "systems");
        assert.ok(await noSidewaysScroll(page), "Organization systems");
        // Someone else's linked system names who linked it, in one short
        // badge that fits a phone card.
        assert.equal(
          await card(page, "front").locator(".system-badge").textContent(),
          "שויכה על ידי manager@example.test",
        );
        assert.deepEqual(
          await smallTargets(page, '[data-workspace-view="systems"]'),
          [],
        );
        await shot(page, `organization-systems-he-${width}`);
        assert.deepEqual(errors, []);
      },
    );
});
