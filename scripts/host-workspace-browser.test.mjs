import assert from "node:assert/strict";
import { test } from "node:test";
import {
  startHostSite,
  openWorkspace,
  organization,
  system,
  booking,
  day,
  loaded,
  requests,
  fits,
} from "./lib/host-booking-site.mjs";

// The organization workspace against the in-memory Host API: failures
// stay inside one screen, Bookings pages and history, saved filters by
// system, Settings (organization, team) without "saved" lines, Connect per
// role, and the phone menu.
const fixture = (role = "owner", extra = {}) => ({
  plan: "user",
  organizations: [organization("org", "Test hotel", role)],
  systems: {
    org: [system("s1", "Room 101"), system("s2", "Lobby door")],
  },
  reservations: {
    org: [
      booking("first", "s1", "Room 101", day(0), day(1), {
        startsAt: new Date(Date.now() - 3600000).toISOString(),
        status: "draft",
      }),
      booking("second", "s2", "Lobby door", day(0), day(1), {
        startsAt: new Date(Date.now() - 1800000).toISOString(),
      }),
    ],
  },
  members: {
    org: [
      {
        id: "m1",
        email: "owner@example.test",
        role: "owner",
        status: "active",
      },
      {
        id: "m2",
        email: "front@example.test",
        role: "staff",
        status: "active",
      },
    ],
  },
  ...extra,
});
const nav = (page, id) =>
  page.locator(`#host-section-navigation [data-view-id="${id}"]`);
const tab = (page, id) =>
  page.locator(`[role="tab"][data-settings-tab="${id}"]`);
const calls = async (page, call) =>
  (await requests(page)).filter((entry) => entry.call === call);
const failNext = (page, call, failure) =>
  page.evaluate(
    ([call, failure]) => {
      window.fixture.failures[call] = failure;
    },
    [call, failure],
  );

test("workspace isolates failures, follows permissions and keeps history", async (t) => {
  const site = await startHostSite(t);

  await t.test(
    "the calendar survives an Activity outage and billing needs no Activity",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          failures: {
            "GET /api/v1/organizations/org/operations/preferences": {
              status: 503,
              code: "SERVICE_UNAVAILABLE",
            },
          },
        }),
        { query: "?view=calendar" },
      );
      await loaded(page, "calendar");
      assert.equal(await page.locator(".reservation-chip").count(), 2);
      assert.equal(
        (await requests(page)).some((entry) =>
          /operations|api-keys|automation|billing|integrations/.test(
            entry.call,
          ),
        ),
        false,
      );
      await nav(page, "activity").click();
      await page
        .getByRole("button", { name: "Alerts and activity", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Retry this section", exact: true })
        .waitFor();
      assert.deepEqual(
        await page
          .locator(".workspace-tabs button")
          .evaluateAll((buttons) =>
            buttons.map((button) => button.textContent),
          ),
        ["Automatic links", "Alerts and activity", "Service health"],
      );
      await nav(page, "calendar").click();
      assert.equal(
        await page.locator(".reservation-chip").first().isVisible(),
        true,
      );
      await nav(page, "settings").click();
      await tab(page, "billing").click();
      assert.equal(new URL(page.url()).searchParams.get("tab"), "billing");
      await page
        .getByRole("button", { name: "Create statement", exact: true })
        .waitFor();
      assert.equal(
        (
          await calls(
            page,
            "GET /api/v1/organizations/org/operations/preferences",
          )
        ).length,
        1,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Bookings pages with Show more, opens read-only for a viewer and keeps its URL",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("viewer", { pageSize: 1 }),
        { query: "?view=reservations" },
      );
      await loaded(page, "bookings");
      assert.equal(new URL(page.url()).searchParams.get("view"), "bookings");
      assert.equal(await page.locator(".host-calendar").count(), 0);
      assert.equal(await page.locator(".booking-row").count(), 1);
      await page
        .getByRole("button", { name: "Show more", exact: true })
        .click();
      await page.waitForFunction(
        () => document.querySelectorAll(".booking-row").length === 2,
      );
      await page.locator('.booking-row[data-booking-id="first"]').click();
      const sheet = page.locator("dialog.booking-sheet[open]");
      await sheet.waitFor();
      assert.equal(await sheet.locator(".booking-status--draft").count(), 1);
      assert.equal(await sheet.locator("[data-booking-edit]").count(), 0);
      await page.keyboard.press("Escape");
      await nav(page, "settings").click();
      await page.locator('[data-settings-panel="organization"]').waitFor();
      await page.goBack();
      await loaded(page, "bookings");
      assert.equal(new URL(page.url()).searchParams.get("view"), "bookings");
      await page.reload();
      await page.waitForFunction(() => window.workspaceStarted);
      await loaded(page, "bookings");
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a late Bookings answer cannot overwrite the Calendar",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("owner"));
      await loaded(page, "my-systems");
      await page.evaluate(() => {
        window.fixture.delays["GET /api/v1/organizations/org/reservations"] =
          true;
      });
      await nav(page, "bookings").click();
      await page.waitForFunction(
        () =>
          typeof window.release[
            "GET /api/v1/organizations/org/reservations"
          ] === "function",
      );
      await nav(page, "calendar").click();
      await loaded(page, "calendar");
      await page.evaluate(() =>
        window.release["GET /api/v1/organizations/org/reservations"](),
      );
      await page.waitForTimeout(100);
      assert.equal(await page.locator(".host-calendar").isVisible(), true);
      assert.equal(
        await page
          .locator('[data-workspace-view="bookings"] .booking-row')
          .count(),
        0,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a saved filter names a system and opens the Calendar with it",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("staff"), {
        query: "?view=activity",
      });
      await page
        .getByRole("button", { name: "Alerts and activity", exact: true })
        .click();
      const review = page.locator('[data-operations-screen="review"]');
      // Saved filters are a power tool: under For your developer.
      await review.locator("details.operations-developer > summary").click();
      await review
        .locator("summary", { hasText: "Saved calendar filters" })
        .click();
      await review
        .getByLabel("Saved filter name", { exact: true })
        .fill("Lobby");
      await review
        .getByLabel("Saved filter system", { exact: true })
        .selectOption("s2");
      await review
        .getByLabel("Saved filter status", { exact: true })
        .selectOption("confirmed");
      assert.equal(await review.locator("text=propert").count(), 0);
      await review
        .getByRole("button", { name: "Save filters", exact: true })
        .click();
      await review.locator('[data-saved-filter="Lobby"]').waitFor();
      const [saved] = await calls(
        page,
        "PUT /api/v1/organizations/org/operations/preferences",
      );
      assert.deepEqual(saved.body.savedFilters, [
        { name: "Lobby", systemId: "s2", status: "confirmed" },
      ]);
      assert.equal(
        await review
          .locator('[data-saved-filter="Lobby"]')
          .evaluate((row) => row.firstChild.textContent),
        "Lobby · Lobby door · Confirmed",
      );
      await review
        .locator('[data-saved-filter="Lobby"]')
        .getByRole("button", { name: "Apply saved filter", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector('.host-calendar select[name="systemId"]')
            ?.value === "s2",
      );
      assert.equal(new URL(page.url()).searchParams.get("view"), "calendar");
      await page.waitForFunction(() =>
        window.fixture.requests.some(
          (entry) =>
            entry.query.systemId === "s2" && entry.query.status === "confirmed",
        ),
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "navigation follows the Host plan and workspace.permissions for every role",
    async () => {
      for (const role of ["owner", "admin", "staff", "viewer"]) {
        for (const plan of ["user", null]) {
          const { page, errors } = await openWorkspace(
            t,
            site,
            fixture(role, { plan }),
          );
          const visible = (id) => nav(page, id).isVisible();
          assert.equal(
            await visible("my-systems"),
            plan !== null,
            `${role} ${plan}`,
          );
          assert.equal(
            await page.evaluate(() => document.body.dataset.hostViewId),
            plan ? "my-systems" : "my-organizations",
          );
          for (const id of ["systems", "calendar", "bookings", "settings"])
            assert.equal(await visible(id), true, `${role} ${id}`);
          assert.equal(
            await visible("activity"),
            role !== "viewer",
            `${role} activity`,
          );
          assert.equal(
            await visible("connect"),
            ["owner", "admin"].includes(role),
            `${role} connect`,
          );
          assert.equal(
            await page.locator('[data-view-id="properties"]').count(),
            0,
          );
          await nav(page, "settings").click();
          await page.locator('[role="tab"]').first().waitFor();
          assert.deepEqual(
            await page
              .locator('[role="tab"]')
              .evaluateAll((tabs) =>
                tabs.map((item) => item.dataset.settingsTab),
              ),
            role === "owner"
              ? ["organization", "team", "billing", "support", "account"]
              : ["organization", "account"],
          );
          await page.locator("#workspace-org-switcher .manager-organization-picker-trigger").click();
          assert.equal(await page.locator('.manager-organization-option[data-organization-id="org"] .manager-organization-picker-identity small').innerText(), { owner: "Owner", admin: "Admin", staff: "Staff", viewer: "Viewer" }[role], "shared picker preserves each original Host role");
          await page.keyboard.press("Escape");
          assert.deepEqual(errors, []);
        }
      }
    },
  );

  await t.test(
    "an organization member without a plan never reaches My systems through a link",
    async () => {
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("staff", { plan: null }),
        { query: "?view=my-systems" },
      );
      assert.equal(
        await page.evaluate(() => document.body.dataset.hostViewId),
        "my-organizations",
      );
      assert.equal(
        await page.locator('[data-workspace-view="my-systems"]').count(),
        0,
      );
      assert.equal(await page.locator("#host-my-systems").isVisible(), false);
      assert.equal(new URL(page.url()).searchParams.has("view"), false);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "the owner changes the organization: fields lock, no saved line, every screen follows",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("owner"), {
        query: "?view=organization",
      });
      assert.equal(new URL(page.url()).searchParams.get("view"), "settings");
      assert.equal(new URL(page.url()).searchParams.get("tab"), "organization");
      const panel = page.locator('[data-settings-panel="organization"]');
      await panel
        .getByLabel("Organization name", { exact: true })
        .fill("Renamed hotel");
      await panel
        .getByLabel("Time zone", { exact: true })
        .selectOption("Asia/Jerusalem");
      await page.evaluate(() => {
        window.fixture.delays["PUT /api/v1/organizations/org"] = true;
      });
      await panel
        .getByRole("button", { name: "Save organization details", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          typeof window.release["PUT /api/v1/organizations/org"] === "function",
      );
      assert.equal(
        await panel
          .getByLabel("Organization name", { exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(
        await panel.getByLabel("Time zone", { exact: true }).isDisabled(),
        true,
      );
      await page.evaluate(() =>
        window.release["PUT /api/v1/organizations/org"](),
      );
      await page.waitForFunction(() =>
        document
          .querySelector("#workspace-org-switcher")
          ?.textContent.includes("Renamed hotel"),
      );
      const [saved] = await calls(page, "PUT /api/v1/organizations/org");
      assert.deepEqual(saved.body, {
        name: "Renamed hotel",
        timezone: "Asia/Jerusalem",
        version: 1,
      });
      const refreshed = page.locator('[data-settings-panel="organization"]');
      await refreshed.waitFor();
      assert.equal(
        await refreshed
          .getByLabel("Organization name", { exact: true })
          .inputValue(),
        "Renamed hotel",
      );
      assert.doesNotMatch(
        await page.locator("#host-management").innerText(),
        /saved/i,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "anyone else reads the organization's name, time zone and role",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("admin"), {
        query: "?view=settings&tab=organization",
      });
      const panel = page.locator('[data-settings-panel="organization"]');
      await panel.locator(".settings-facts").waitFor();
      assert.equal(await panel.locator("form").count(), 0);
      const text = await panel.innerText();
      assert.match(text, /Test hotel/);
      assert.match(text, /UTC/);
      assert.equal(
        await panel.locator('.host-role-badge[data-role="admin"]').count(),
        1,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a late organization change keeps another tab's draft and shows on return",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("owner"), {
        query: "?view=organization",
      });
      const panel = page.locator('[data-settings-panel="organization"]');
      await panel
        .getByLabel("Organization name", { exact: true })
        .fill("Renamed hotel");
      await page.evaluate(() => {
        window.fixture.delays["PUT /api/v1/organizations/org"] = true;
      });
      await panel
        .getByRole("button", { name: "Save organization details", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          typeof window.release["PUT /api/v1/organizations/org"] === "function",
      );
      await tab(page, "team").click();
      const team = page.locator('[data-settings-panel="team"]');
      const draft = team.getByLabel("Invite verified email", { exact: true });
      await draft.fill("draft@example.test");
      await page.evaluate(() =>
        window.release["PUT /api/v1/organizations/org"](),
      );
      await page.waitForFunction(
        () => window.fixture.organizations[0].name === "Renamed hotel",
      );
      await page.waitForTimeout(100);
      assert.equal(await draft.inputValue(), "draft@example.test");
      await tab(page, "organization").click();
      await page.waitForFunction(
        () =>
          document.querySelector(
            '[data-settings-panel="organization"] input[name="name"]',
          )?.value === "Renamed hotel",
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a refused change keeps the form and retries with the same Idempotency-Key",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("owner"), {
        query: "?view=organization",
      });
      const panel = page.locator('[data-settings-panel="organization"]');
      await panel
        .getByLabel("Organization name", { exact: true })
        .fill("Retry hotel");
      await failNext(page, "PUT /api/v1/organizations/org", {
        status: 503,
        code: "SERVICE_UNAVAILABLE",
        times: 1,
      });
      const save = panel.getByRole("button", {
        name: "Save organization details",
        exact: true,
      });
      await save.click();
      await panel
        .getByText("The request could not be completed. You can retry.", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        await panel
          .getByLabel("Organization name", { exact: true })
          .inputValue(),
        "Retry hotel",
      );
      assert.equal(await save.isEnabled(), true);
      await save.click();
      await page.waitForFunction(() =>
        document
          .querySelector("#workspace-org-switcher")
          ?.textContent.includes("Retry hotel"),
      );
      const keys = (await calls(page, "PUT /api/v1/organizations/org")).map(
        (entry) => entry.key,
      );
      assert.equal(keys.length, 2);
      assert.ok(keys[0]);
      assert.equal(keys[0], keys[1]);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a change that went through stays when the reload fails",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("owner"), {
        query: "?view=organization",
      });
      const panel = page.locator('[data-settings-panel="organization"]');
      await panel
        .getByLabel("Organization name", { exact: true })
        .fill("Saved before outage");
      await failNext(page, "GET /api/v1/organizations", {
        status: 503,
        code: "SERVICE_UNAVAILABLE",
        times: 1,
      });
      await panel
        .getByRole("button", { name: "Save organization details", exact: true })
        .click();
      const workspace = page.locator("#host-management");
      await workspace
        .getByText(
          "Couldn't load the latest details. Refresh to see your change.",
          {
            exact: true,
          },
        )
        .waitFor();
      assert.equal(
        (await calls(page, "PUT /api/v1/organizations/org")).length,
        1,
      );
      assert.equal(new URL(page.url()).searchParams.get("tab"), "organization");
      await workspace
        .getByRole("button", { name: "Refresh organizations", exact: true })
        .click();
      await page.waitForFunction(
        () =>
          document.querySelector(
            '[data-settings-panel="organization"] input[name="name"]',
          )?.value === "Saved before outage",
      );
      assert.equal(
        (await calls(page, "PUT /api/v1/organizations/org")).length,
        1,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Team: people with their roles, a change for one, new people only by invitation",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("owner"), {
        query: "?view=settings&tab=team",
      });
      const team = page.locator('[data-settings-panel="team"]');
      await team.locator('[data-member-email="front@example.test"]').waitFor();
      assert.equal(await team.getByText("Add team member").count(), 0);
      assert.equal(
        await team.getByLabel("Invite verified email", { exact: true }).count(),
        1,
      );
      await team
        .locator('[data-member-email="front@example.test"]')
        .getByRole("button")
        .click();
      const dialog = page.locator("dialog.system-dialog[open]");
      await dialog.locator('input[name="role"][value="admin"]').check();
      await dialog.getByRole("button", { name: "Save", exact: true }).click();
      await page.waitForFunction(() =>
        window.fixture.requests.some(
          (entry) => entry.call === "POST /api/v1/organizations/org/members",
        ),
      );
      const [change] = await calls(
        page,
        "POST /api/v1/organizations/org/members",
      );
      assert.deepEqual(change.body, {
        email: "front@example.test",
        role: "admin",
        status: "active",
      });
      await page
        .locator(
          '[data-member-email="front@example.test"] .host-role-badge[data-role="admin"]',
        )
        .waitFor();
      await team
        .getByLabel("Invite verified email", { exact: true })
        .fill("new@example.test");
      await team.getByRole("button", { name: "Invite", exact: true }).click();
      await team.locator('[data-invitation-id="invitation-1"]').waitFor();
      assert.doesNotMatch(await team.innerText(), /created|saved|loaded/i);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "Connect: one policy per organization, booking-system rooms to systems, API keys for the owner",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("owner"), {
        query: "?view=connect",
      });
      await loaded(page, "connect");
      const policy = page.getByRole("region", {
        name: "Automatic guest links",
      });
      await policy.getByLabel("Create guest links automatically").check();
      await policy.getByRole("button", { name: "Save", exact: true }).click();
      await page.waitForFunction(() =>
        window.fixture.requests.some(
          (entry) =>
            entry.call === "PUT /api/v1/organizations/org/automation/policy",
        ),
      );
      const [saved] = await calls(
        page,
        "PUT /api/v1/organizations/org/automation/policy",
      );
      assert.deepEqual(saved.body, {
        enabled: true,
        earlyAccessMinutes: 0,
        lateExpiryMinutes: 0,
        channel: "none",
      });
      const rooms = page.getByRole("region", { name: "Your booking system" });
      await rooms.locator("details.connect-setup > summary").click();
      await rooms.getByLabel("Booking system", { exact: true }).fill("pms");
      await rooms
        .getByRole("button", { name: "Show connections", exact: true })
        .click();
      await rooms
        .getByLabel("ID in your booking system", { exact: true })
        .fill("212");
      await rooms.getByLabel("Opens", { exact: true }).selectOption("s1");
      await rooms
        .getByRole("button", { name: "Add connection", exact: true })
        .click();
      await rooms.locator('[data-provider-room="212"]').waitFor();
      assert.match(
        await rooms
          .locator('[data-provider-room="212"] .connect-room-list__line')
          .innerText(),
        /212\s*→\s*Room 101/,
      );
      const [mapping] = await calls(
        page,
        "POST /api/v1/organizations/org/integrations/providers/pms/mappings",
      );
      assert.deepEqual(mapping.body, { providerRoomId: "212", systemId: "s1" });
      assert.equal(
        (await requests(page)).some((entry) =>
          /propert|rooms?\b/.test(entry.call),
        ),
        false,
      );
      const keys = page.getByRole("region", { name: "Your own software" });
      // Keys are for a developer: closed until "For your developer" opens.
      assert.equal(
        await keys
          .getByRole("button", { name: "Create API key", exact: true })
          .isVisible(),
        false,
      );
      await keys.getByText("For your developer", { exact: true }).click();
      await keys
        .getByRole("button", { name: "Create API key", exact: true })
        .waitFor();
      assert.ok(await fits(page));
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "an owner reveals a key on Connect; an admin sees the keys but cannot change them",
    async () => {
      const keyList = {
        org: [
          {
            id: "key-1",
            name: "Booking engine",
            prefix: "wfg_test",
            status: "active",
            version: 1,
            scopes: ["guest-invitations:create"],
            targetTypes: ["gate"],
          },
        ],
      };
      const owner = await openWorkspace(
        t,
        site,
        fixture("owner", { apiKeys: keyList }),
        { query: "?view=connect" },
      );
      await loaded(owner.page, "connect");
      const ownerKeys = owner.page.getByRole("region", {
        name: "Your own software",
      });
      await ownerKeys.getByText("For your developer", { exact: true }).click();
      await ownerKeys
        .getByRole("button", { name: "Reveal private API key", exact: true })
        .click();
      await ownerKeys.locator("textarea").waitFor();
      assert.equal(
        await ownerKeys.locator("textarea").inputValue(),
        "wfg_test_private_value",
      );
      // The key on screen is the confirmation: no "revealed", "created" or
      // "revoked" line; what matters sits in an ⓘ by the button.
      const keyStatus = ownerKeys.locator('p[role="status"]');
      assert.equal(await keyStatus.textContent(), "");
      for (const [name, call] of [
        ["Rotate API key", "rotate"],
        ["Revoke API key", "revoke"],
      ]) {
        await ownerKeys.getByRole("button", { name, exact: true }).click();
        await owner.page.waitForFunction(
          (call) =>
            window.fixture.requests.some(
              (entry) =>
                entry.call ===
                `POST /api/v1/organizations/org/api-keys/key-1/${call}`,
            ),
          call,
        );
        await owner.page.waitForTimeout(100);
        assert.equal(await keyStatus.textContent(), "", name);
      }
      assert.ok(
        (
          await ownerKeys.locator(".info-tip__bubble").allTextContents()
        ).includes("Requests that use a revoked key are refused."),
      );
      assert.deepEqual(owner.errors, []);
      const admin = await openWorkspace(
        t,
        site,
        fixture("admin", { apiKeys: keyList }),
        { query: "?view=connect" },
      );
      await loaded(admin.page, "connect");
      const adminKeys = admin.page.getByRole("region", {
        name: "Your own software",
      });
      await adminKeys.getByText("For your developer", { exact: true }).click();
      await adminKeys.getByText("Booking engine", { exact: true }).waitFor();
      for (const name of [
        "Create API key",
        "Reveal private API key",
        "Rotate API key",
        "Revoke API key",
      ])
        assert.equal(
          await adminKeys.getByRole("button", { name, exact: true }).count(),
          0,
          name,
        );
      assert.equal(
        await adminKeys.locator(".info-tip__bubble").textContent(),
        "Your developer connects your website or software to WIFIGATE with a key. Only the owner can create, change or show keys.",
      );
      assert.equal(
        await admin.page
          .getByRole("region", { name: "Automatic guest links" })
          .count(),
        1,
      );
      assert.deepEqual(admin.errors, []);
    },
  );

  await t.test(
    "phone navigation stays inline and unknown view values return home",
    async () => {
      const { page, errors } = await openWorkspace(t, site, fixture("viewer"), {
        query: "?view=not-a-screen&lang=he",
        viewport: { width: 390, height: 844 },
      });
      assert.equal(
        await page.evaluate(() => document.body.dataset.hostViewId),
        "my-systems",
      );
      assert.equal(new URL(page.url()).searchParams.has("view"), false);
      assert.equal(await page.locator("#host-section-navigation").isVisible(), true);
      assert.equal(await page.locator(".workspace-menu-toggle").isVisible(), false);
      await nav(page, "bookings").click();
      await page.getByRole("region", { name: "הזמנות", exact: true }).waitFor();
      assert.equal(await page.locator("#workspace-main").evaluate(node => node.inert), false);
      assert.ok(await fits(page));
      assert.deepEqual(errors, []);
    },
  );
  await t.test(
    "booking system events: Try again reloads the list with one Show more",
    async () => {
      const event = (id, status) => ({
        id,
        type: "reservation.created",
        status,
        provider: "pms",
        createdAt: "2026-10-14T09:00:00.000Z",
      });
      const { page, errors } = await openWorkspace(
        t,
        site,
        fixture("owner", {
          eventsPageSize: 1,
          events: {
            org: [event("e1", "dead_letter"), event("e2", "processed")],
          },
        }),
        { query: "?view=connect" },
      );
      await loaded(page, "connect");
      const card = page.getByRole("region", { name: "Your booking system" });
      const more = card.getByRole("button", { name: "Show more", exact: true });
      assert.equal(await more.count(), 1);
      await card
        .getByRole("button", { name: "Try again", exact: true })
        .click();
      await page.waitForFunction(() =>
        window.fixture.requests.some((entry) =>
          entry.call.endsWith("/integrations/events/e1/replay"),
        ),
      );
      await page.waitForFunction(
        () =>
          window.fixture.requests.filter((entry) =>
            entry.call.endsWith("/integrations/events"),
          ).length === 2,
      );
      await page.waitForTimeout(100);
      assert.equal(await more.count(), 1, "one Show more after Try again");
      await more.click();
      await card.locator('[data-event-status="processed"]').waitFor();
      assert.equal(await more.count(), 0);
      assert.equal(await card.locator(".connect-event-list > li").count(), 2);
      assert.deepEqual(errors, []);
    },
  );
});
