import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const root = path.resolve(
  new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"),
);
const shell = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/host-workspace.css"></head><body class="portal-dashboard"><aside id="host-sidebar" class="host-sidebar"><nav id="host-section-navigation" aria-label="Dashboard sections"></nav></aside><main class="portal-shell"><details id="account-details"><summary>Account and security</summary></details><div id="workspace-org-switcher"></div><section id="host-management" class="portal-panel"></section></main><script type="module" src="/workspace-fixture.js"></script></body></html>`;

function fixture(role, platformRole = "user") {
  return `
    import { profileApi } from '/js/api/index.js';
    import '/js/host-dashboard-navigation.js';
    import { loadHostManagement } from '/js/host-management.js';
    window.requests = [];
    const role = ${JSON.stringify(role)};
    window.organization = {id:'org',name:'Test hotel',timezone:'UTC',version:1,membership:{role},workspace:{role,service:{state:'legacy-active',available:true}}};
    window.organizationSaveKeys = [];
    const today = new Date().toISOString().slice(0, 10);
    const booking = id => ({id, propertyId:'property', roomId:'room', roomName:'Room 101',
      guest:{name:'Guest ' + id, email:id + '@example.test',phone:'+15555550123'},
      startsAt:today+'T15:00:00Z',endsAt:new Date(Date.parse(today+'T00:00:00Z')+86400000).toISOString(),
      status:'draft', version:1, targetIds:[]});
    profileApi.defaults.adapter = async config => {
      window.requests.push(config.url);
      const url = new URL(config.url, location.origin);
      let data = {items:[],nextCursor:null};
      if (url.pathname === '/api/v1/organizations') {
        if (window.rejectOrganizationReload && window.organizationSaveReturned) throw new Error('isolated reload failure');
        data = {organizations:[window.organization],nextCursor:null};
      }
      else if (url.pathname === '/api/v1/organizations/org' && config.method === 'put') {
        window.organizationSaveKeys.push(config.headers.get('idempotency-key'));
        if (window.delayOrganizationSave) await new Promise(resolve => {window.releaseOrganizationSave=resolve;});
        if (window.rejectOrganizationSave) throw new Error('isolated save failure');
        window.organization = {...window.organization,...JSON.parse(config.data),version:window.organization.version+1};
        window.organizationSaveReturned = true;
        data = {organization:window.organization};
      }
      else if (url.pathname.endsWith('/properties')) data = {items:[{id:'property',name:'Property',timezone:'UTC'}],nextCursor:null};
      else if (url.pathname.endsWith('/rooms')) data = {items:[{id:'room',name:'Room 101',propertyId:'property',capacity:2}],nextCursor:null};
      else if (url.pathname.endsWith('/time-zone/resolve')) data = {instant:JSON.parse(config.data).localTime+':00Z'};
      else if (url.pathname.endsWith('/reservations')) {
        if (window.delayReservation) {
          await new Promise(resolve => { window.releaseReservation = resolve; });
          window.lateReservationReturned = true;
        }
        data = url.searchParams.has('cursor') ? {items:[booking('second')],nextCursor:null} : {items:[booking('first')],nextCursor:'next-page'};
      }
      else if (url.pathname.endsWith('/operations/preferences')) {
        if (window.delayOperations) await new Promise(resolve => { window.releaseOperations = resolve; });
        throw new Error('isolated dependency failure');
      }
      return {status:200,statusText:'OK',headers:{},config,data};
    };
    window.workspaceReady = loadHostManagement({uid:'fixture-user',getIdToken:async()=> 'isolated-token'}, {role:${JSON.stringify(platformRole)}});
  `;
}

test("workspace isolates feature failures, permissions, paging and browser history", async (t) => {
  const server = createServer(async (request, response) => {
    try {
      const file = path.resolve(
        root,
        "." + new URL(request.url, "http://localhost").pathname,
      );
      if (!file.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      response.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "application/javascript"
          : file.endsWith(".css")
            ? "text/css"
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
  async function scenario(role, query = "", platformRole = "user") {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    t.after(() => context.close());
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/*", (route) => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (url.pathname === "/workspace-fixture.js")
        return route.fulfill({
          contentType: "application/javascript",
          body: fixture(role, platformRole),
        });
      if (url.pathname === "/dashboard/host/")
        return route.fulfill({ contentType: "text/html", body: shell });
      return route.continue();
    });
    await page.goto(origin + "/dashboard/host/" + query);
    await page.addStyleTag({ url: origin + "/css/host-interface.css" });
    await page.evaluate(() => window.workspaceReady);
    return { page, errors };
  }

  await t.test(
    "calendar survives an operations outage and billing has no operations dependency",
    async () => {
      const { page, errors } = await scenario("owner");
      assert.equal(await page.locator(".reservation-chip").count(), 1);
      const initial = await page.evaluate(() => window.requests);
      assert.equal(
        initial.some((url) =>
          /operations|api-keys|automation|billing|integrations/.test(url),
        ),
        false,
      );
      await page
        .getByRole("button", { name: "Operations", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Alerts and activity", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Retry this section", exact: true })
        .waitFor();
      assert.equal(await page.locator(".reservation-chip").count(), 1);
      await page.getByRole("button", { name: "Calendar", exact: true }).click();
      assert.equal(await page.locator(".reservation-chip").isVisible(), true);
      await page
        .getByRole("button", { name: "Billing statements", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Generate monthly draft", exact: true })
        .waitFor();
      assert.equal(
        (await page.evaluate(() => window.requests)).filter((url) =>
          url.includes("operations/preferences"),
        ).length,
        1,
      );
      await page
        .getByRole("button", { name: "Organization settings", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Organization settings", exact: true })
        .waitFor();
      assert.equal(
        await page
          .getByRole("button", { name: "Generate monthly draft", exact: true })
          .isVisible(),
        false,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "reservations own their filters, pages, readable buttons and refresh-safe URL",
    async () => {
      const { page, errors } = await scenario("viewer", "?view=reservations");
      const reservations = page.getByRole("region", {
        name: "Reservations",
        exact: true,
      });
      assert.equal(await reservations.isVisible(), true);
      assert.equal(await page.locator(".host-calendar").count(), 0);
      assert.equal(
        await reservations
          .getByLabel("Reservation property", { exact: true })
          .inputValue(),
        "",
      );
      await reservations
        .getByRole("button", { name: "Load more reservations", exact: true })
        .click();
      await reservations
        .getByRole("button", { name: "Guest second", exact: true })
        .waitFor();
      assert.equal(await reservations.locator("li").count(), 2);
      const colors = await reservations
        .getByRole("button", { name: "Guest first", exact: true })
        .evaluate((element) => {
          const style = getComputedStyle(element);
          return { color: style.color, background: style.backgroundColor };
        });
      assert.equal(colors.color, "rgb(255, 255, 255)");
      assert.equal(colors.background, "rgb(7, 91, 196)");
      await reservations
        .getByRole("button", { name: "Guest first", exact: true })
        .click();
      const dialog = page.getByRole("dialog", {
        name: "Reservation details",
        exact: true,
      });
      assert.equal(
        await dialog.getByRole("button", { name: "Save reservation" }).count(),
        0,
      );
      await page.keyboard.press("Escape");
      await page
        .getByRole("button", { name: "Properties", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Properties", exact: true })
        .waitFor();
      await page.goBack();
      await reservations.waitFor();
      assert.equal(
        new URL(page.url()).searchParams.get("view"),
        "reservations",
      );
      await page.reload();
      await page.evaluate(() => window.workspaceReady);
      assert.equal(await reservations.isVisible(), true);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "late booking-screen responses cannot overwrite Calendar, and saved filters load it lazily",
    async () => {
      const { page, errors } = await scenario("owner");
      await page.evaluate(() => {
        window.delayReservation = true;
      });
      await page
        .getByRole("button", { name: "Reservations", exact: true })
        .click();
      await page.waitForFunction(
        () => typeof window.releaseReservation === "function",
      );
      await page.evaluate(() => {
        window.delayReservation = false;
      });
      await page.getByRole("button", { name: "Calendar", exact: true }).click();
      await page.locator(".reservation-chip").waitFor();
      await page.evaluate(() => window.releaseReservation());
      await page.waitForFunction(() => window.lateReservationReturned === true);
      assert.equal(await page.locator(".host-calendar").isVisible(), true);
      assert.equal(
        await page
          .locator(
            '[data-workspace-view="reservations"] .host-reservations-view',
          )
          .count(),
        0,
      );
      await page
        .getByRole("button", { name: "Properties", exact: true })
        .click();
      await page.evaluate(() =>
        window.dispatchEvent(
          new CustomEvent("host:operations-filter", {
            detail: {
              orgId: "org",
              propertyId: "property",
              roomId: "room",
              status: "draft",
            },
          }),
        ),
      );
      await page.waitForFunction(
        () =>
          document.querySelector('.host-calendar [name="status"]')?.value ===
          "draft",
      );
      assert.equal(await page.locator(".host-calendar").isVisible(), true);
      assert.equal(new URL(page.url()).searchParams.has("view"), false);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "normal-user navigation reflects each tenant role, not disabled privileged links",
    async () => {
      for (const role of ["owner", "admin", "staff", "viewer"]) {
        const { page, errors } = await scenario(role);
        assert.equal(
          await page
            .getByRole("button", { name: "Team", exact: true })
            .isVisible(),
          role === "owner",
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Automation", exact: true })
            .isVisible(),
          role === "owner" || role === "admin",
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Operations", exact: true })
            .isVisible(),
          role !== "viewer",
        );
        assert.equal(
          await page
            .getByRole("button", { name: "Overview", exact: true })
            .isVisible(),
          false,
        );
        assert.deepEqual(errors, []);
      }
    },
  );

  await t.test(
    "organization save locks fields, reports success after refresh and offers a clear action",
    async () => {
      const { page, errors } = await scenario("owner", "?view=organization");
      const panel = page.locator('[data-workspace-view="organization"]');
      await panel.locator("summary").click();
      await panel
        .getByLabel("Organization name", { exact: true })
        .fill("Renamed hotel");
      await page.evaluate(() => {
        window.delayOrganizationSave = true;
      });
      await panel.locator('form button[type="submit"]').click();
      await page.waitForFunction(
        () => typeof window.releaseOrganizationSave === "function",
        null,
        { timeout: 5000 },
      );
      assert.equal(
        await panel
          .getByLabel("Organization name", { exact: true })
          .isDisabled(),
        true,
      );
      assert.equal(
        await panel.getByLabel("IANA timezone", { exact: true }).isDisabled(),
        true,
      );
      await page.evaluate(() => window.releaseOrganizationSave());
      await panel
        .getByRole("status")
        .filter({ hasText: "Changes saved." })
        .waitFor({ timeout: 5000 });
      assert.equal(
        await page
          .getByRole("combobox", { name: "Organization", exact: true })
          .innerText()
          .then((text) => text.includes("Renamed hotel")),
        true,
      );
      await panel.locator("summary").click();
      assert.equal(
        await panel
          .getByRole("button", {
            name: "Save organization details",
            exact: true,
          })
          .isEnabled(),
        true,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a late organization save preserves another screen draft and refreshes on return",
    async () => {
      const { page, errors } = await scenario("owner", "?view=organization");
      const settings = page.locator('[data-workspace-view="organization"]');
      await settings.locator("summary").click();
      await settings
        .getByLabel("Organization name", { exact: true })
        .fill("Renamed hotel");
      await page.evaluate(() => {
        window.delayOrganizationSave = true;
      });
      await settings.locator('form button[type="submit"]').click();
      await page.waitForFunction(
        () => typeof window.releaseOrganizationSave === "function",
        null,
        { timeout: 5000 },
      );
      await page
        .getByRole("button", { name: "Properties", exact: true })
        .click();
      const properties = page.locator('[data-workspace-view="properties"]');
      const addProperty = properties
        .locator("details")
        .filter({ hasText: "Add property" });
      await addProperty.locator("summary").click();
      const draft = addProperty.getByLabel("Name", { exact: true });
      await draft.fill("Unsaved property draft");
      await page.evaluate(() => window.releaseOrganizationSave());
      await page.waitForFunction(
        () => window.organizationSaveReturned === true,
        null,
        { timeout: 5000 },
      );
      await page.waitForTimeout(100);
      assert.equal(await draft.inputValue(), "Unsaved property draft");
      assert.equal(
        await properties
          .getByRole("status")
          .filter({ hasText: "Changes saved." })
          .count(),
        0,
      );
      await page
        .getByRole("button", { name: "Organization settings", exact: true })
        .click();
      await settings
        .getByText("Renamed hotel", { exact: true })
        .waitFor({ timeout: 5000 });
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a failed save preserves the form and safely reuses the reviewed attempt",
    async () => {
      const { page, errors } = await scenario("owner", "?view=organization");
      const panel = page.locator('[data-workspace-view="organization"]');
      await panel.locator("summary").click();
      await panel
        .getByLabel("Organization name", { exact: true })
        .fill("Retry hotel");
      await page.evaluate(() => {
        window.rejectOrganizationSave = true;
      });
      await panel.locator('form button[type="submit"]').click();
      await panel
        .getByRole("status")
        .filter({
          hasText: "The request could not be completed. You can retry.",
        })
        .waitFor({ timeout: 5000 });
      assert.equal(
        await panel
          .getByLabel("Organization name", { exact: true })
          .inputValue(),
        "Retry hotel",
      );
      assert.equal(
        await panel
          .getByLabel("Organization name", { exact: true })
          .isEnabled(),
        true,
      );
      await page.evaluate(() => {
        window.rejectOrganizationSave = false;
      });
      await panel.locator('form button[type="submit"]').click();
      await panel
        .getByRole("status")
        .filter({ hasText: "Changes saved." })
        .waitFor({ timeout: 5000 });
      const keys = await page.evaluate(() => window.organizationSaveKeys);
      assert.equal(keys.length, 2);
      assert.equal(keys[0], keys[1]);
      assert.ok(keys[0]);
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "a confirmed save stays confirmed when loading the updated screen fails",
    async () => {
      const { page, errors } = await scenario("owner", "?view=organization");
      const panel = page.locator('[data-workspace-view="organization"]');
      await panel.locator("summary").click();
      await panel
        .getByLabel("Organization name", { exact: true })
        .fill("Saved before outage");
      await page.evaluate(() => {
        window.rejectOrganizationReload = true;
      });
      await panel.locator('form button[type="submit"]').click();
      const workspace = page.locator("#host-management");
      await workspace
        .getByRole("status")
        .filter({
          hasText:
            "Changes saved. Refresh the screen to load the updated data.",
        })
        .waitFor({ timeout: 5000 });
      assert.equal(
        await page.evaluate(() => window.organizationSaveKeys.length),
        1,
      );
      assert.equal(
        new URL(page.url()).searchParams.get("view"),
        "organization",
      );
      await page.evaluate(() => {
        window.rejectOrganizationReload = false;
      });
      await workspace
        .getByRole("button", { name: "Refresh organizations", exact: true })
        .click();
      await panel
        .getByText("Saved before outage", { exact: true })
        .waitFor({ timeout: 5000 });
      assert.equal(
        await page.evaluate(() => window.organizationSaveKeys.length),
        1,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "failure preparing a save restores controls without an uncaught error",
    async () => {
      const { page, errors } = await scenario("owner", "?view=organization");
      const panel = page.locator('[data-workspace-view="organization"]');
      await panel.locator("summary").click();
      await page.evaluate(() => {
        crypto.subtle.digest = async () => {
          throw new Error("isolated preparation failure");
        };
      });
      await panel.locator('form button[type="submit"]').click();
      await panel
        .getByRole("status")
        .filter({
          hasText: "The request could not be completed. You can retry.",
        })
        .waitFor({ timeout: 5000 });
      assert.equal(
        await panel.locator('form button[type="submit"]').isEnabled(),
        true,
      );
      assert.equal(
        await panel
          .getByLabel("Organization name", { exact: true })
          .isEnabled(),
        true,
      );
      assert.equal(
        await page.evaluate(() => window.organizationSaveKeys.length),
        0,
      );
      assert.deepEqual(errors, []);
    },
  );

  await t.test(
    "mobile menu is discoverable and unknown view values cannot select arbitrary content",
    async () => {
      const { page, errors } = await scenario(
        "viewer",
        "?view=not-a-screen&lang=he",
      );
      assert.equal(await page.locator(".host-calendar").isVisible(), true);
      await page.setViewportSize({ width: 390, height: 844 });
      const menu = page.getByRole("button", { name: "תפריט", exact: true });
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
      await menu.click();
      await page.getByRole("button", { name: "הזמנות", exact: true }).click();
      await page.getByRole("region", { name: "הזמנות", exact: true }).waitFor();
      assert.equal(await menu.getAttribute("aria-expanded"), "false");
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      assert.deepEqual(errors, []);
    },
  );
});
