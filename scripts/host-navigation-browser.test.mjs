import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const shell = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/host-dashboard.css"></head><body class="host-app host-ready"><header class="host-topbar"><div class="host-topbar__start"><button class="workspace-menu-toggle" type="button"><svg viewBox="0 0 24 24"></svg></button><h1 id="workspace-current-view"></h1></div><div id="product-switcher" class="product-switcher"></div><div class="host-topbar__end"><button id="join-organization" class="host-icon-button host-bell" type="button"><span class="host-bell__count" data-invitation-count></span></button></div></header><aside id="host-sidebar" class="host-sidebar"><nav id="host-section-navigation" aria-label="Dashboard sections"></nav><div id="host-platform-navigation" class="sidebar-platform"></div></aside><div class="host-scrim" hidden></div><main class="portal-shell"><section id="admin-overview" hidden></section><section id="host-management" data-loading="true"></section></main><nav id="host-tabbar" class="host-tabbar" hidden></nav><script type="module" src="/js/host-dashboard-navigation.js"></script></body></html>`;

test("Host navigation keeps deep links, aliases, history, the bell and the phone drawer on authorized views only", async (t) => {
  const server = createServer(async (req, res) => {
    try {
      const file = path.resolve(
        root,
        "." + new URL(req.url, "http://localhost").pathname,
      );
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "application/javascript"
          : file.endsWith(".svg")
            ? "image/svg+xml"
            : "text/css",
      );
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end();
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/dashboard/host/**", (route) =>
    route.fulfill({ contentType: "text/html", body: shell }),
  );
  const origin = `http://127.0.0.1:${server.address().port}`;
  const view = () => page.evaluate(() => document.body.dataset.hostViewId);
  const query = (name) => new URL(page.url()).searchParams.get(name);
  // A plan holder's workspace: My systems (home), an organization with
  // calendar, bookings and settings, and one organization waiting to be joined.
  async function ready({ systems = true } = {}) {
    await page.locator('button[data-view-id="calendar"]').waitFor({ state: "attached" });
    await page.evaluate((systems) => {
      const root = document.getElementById("host-management");
      root.dataset.homeView = "my-systems";
      root.innerHTML =
        '<div data-workspace-view="invitations"><section aria-label="Join an organization"><article data-invitation-id="invite-1">Grand Plaza</article></section></div>' +
        '<div data-workspace-view="my-systems"><section aria-label="My systems">My systems content</section></div>' +
        (systems
          ? '<div data-workspace-view="systems"><section aria-label="WIFIGATE systems">Systems content</section></div>'
          : "") +
        '<div data-workspace-view="calendar"><section class="host-calendar">Calendar content</section></div>' +
        '<div data-workspace-view="bookings"><section aria-label="Reservations">Bookings content</section></div>' +
        '<div data-workspace-view="settings"><div>Settings content</div></div>';
      root.dataset.loading = "false";
      root.dataset.organizationId = "test-org";
      window.dispatchEvent(new CustomEvent("host:workspace-ready"));
    }, systems);
  }
  const navigation = page.locator("#host-section-navigation");

  // An old view id is an alias: ?view=reservations opens Bookings.
  await page.goto(origin + "/dashboard/host/?lang=he&view=reservations");
  await ready();
  await page.waitForFunction(() => document.body.dataset.hostViewId === "bookings");
  assert.equal(
    await page.getByText("Bookings content", { exact: true }).isVisible(),
    true,
  );
  assert.equal(await page.getByText("Calendar content").isVisible(), false);
  assert.equal(
    await navigation.locator('button[data-view-id="calendar"]').innerText(),
    "לוח שנה",
  );
  assert.equal(
    await navigation.locator('button[data-view-id="bookings"]').innerText(),
    "הזמנות",
  );
  assert.equal(
    await page.locator("#workspace-current-view").innerText(),
    "הזמנות",
  );
  assert.equal(
    await page.locator('[data-view-id="properties"]').count(),
    0,
    "Properties is no longer a view",
  );
  // Views without a panel stay hidden: Activity and Connect were not built.
  for (const id of ["activity", "connect", "overview"])
    assert.equal(
      await page.locator(`button[data-view-id="${id}"]`).isVisible(),
      false,
      id,
    );

  // The bell counts organizations waiting and opens the join view.
  const bell = page.locator("#join-organization");
  assert.equal(await bell.locator("[data-invitation-count]").innerText(), "1");
  assert.match(await bell.getAttribute("aria-label"), /הצטרפות לארגון/);
  await bell.click();
  assert.equal(query("view"), "invitations");
  assert.equal(await bell.getAttribute("aria-current"), "page");

  // Settings tabs come from old ids as aliases and survive history.
  await navigation.locator('button[data-view-id="settings"]').click();
  assert.equal(query("view"), "settings");
  assert.equal(query("lang"), "he");
  assert.equal(query("tab"), null);
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("host:workspace-view", { detail: "team" })),
  );
  assert.equal(query("view"), "settings");
  assert.equal(query("tab"), "team");
  await navigation.locator('button[data-view-id="calendar"]').click();
  assert.equal(query("tab"), null);
  await page.goBack();
  await page.waitForFunction(() => document.body.dataset.hostViewId === "settings");
  assert.equal(query("tab"), "team");
  await page.goForward();
  await page.waitForFunction(() => document.body.dataset.hostViewId === "calendar");
  await page.goto(origin + "/dashboard/host/?view=billing");
  await ready();
  await page.waitForFunction(() => document.body.dataset.hostViewId === "settings");
  assert.equal(query("tab"), "billing");

  // The home view has no ?view= and a reload keeps the current view.
  await navigation.locator('button[data-view-id="my-systems"]').click();
  assert.equal(query("view"), null);
  await navigation.locator('button[data-view-id="systems"]').click();
  await page.reload();
  await ready();
  await page.waitForFunction(() => document.body.dataset.hostViewId === "systems");

  // A workspace refresh between pointer down and up keeps the navigation
  // intent while authorized components are replaced.
  const bookingsButton = navigation.locator('button[data-view-id="bookings"]');
  await bookingsButton.hover();
  await page.mouse.down();
  await page.evaluate(() => {
    const root = document.getElementById("host-management");
    root.dataset.loading = "true";
    root.innerHTML = '<p role="status">Refreshing authorized workspace</p>';
  });
  assert.equal(await bookingsButton.isDisabled(), false);
  await page.mouse.up();
  await page.waitForFunction(() => document.body.dataset.hostViewId === "bookings");
  // A completed reload without that view revokes it and returns home.
  await page.evaluate(() => {
    const root = document.getElementById("host-management");
    root.innerHTML =
      '<div data-workspace-view="my-systems"><section aria-label="My systems">My systems content</section></div>';
    root.dataset.loading = "false";
  });
  await page.waitForFunction(() => document.body.dataset.hostViewId === "my-systems");
  assert.equal(await bookingsButton.isHidden(), true);
  assert.equal(query("view"), null);

  // An old ?view=properties link lands on Organization systems, or home
  // when that view is not authorized.
  await page.goto(origin + "/dashboard/host/?view=properties");
  await ready();
  await page.waitForFunction(() => document.body.dataset.hostViewId === "systems");
  await page.goto(origin + "/dashboard/host/?view=properties");
  await ready({ systems: false });
  await page.waitForFunction(() => document.body.dataset.hostViewId === "my-systems");
  assert.equal(query("view"), null);

  // Ending the session clears the view.
  await page.evaluate(() => {
    document.getElementById("host-management").replaceChildren();
    window.dispatchEvent(new CustomEvent("host:workspace-reset"));
  });
  assert.equal(query("view"), null);

  // Phone: the sidebar is a drawer and a tab bar holds home, Calendar,
  // Bookings and More. Background completion keeps a drawer the user opened.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + "/dashboard/host/");
  await ready();
  const tabbar = page.locator("#host-tabbar");
  await tabbar.waitFor();
  assert.deepEqual(
    await tabbar
      .locator("button:visible")
      .evaluateAll((items) => items.map((item) => item.dataset.tabView ?? item.dataset.tab)),
    ["my-systems", "calendar", "bookings", "more"],
  );
  const menu = page.locator(".workspace-menu-toggle");
  assert.equal(await navigation.isVisible(), false);
  await menu.click();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("host:workspace-ready")),
  );
  assert.equal(await menu.getAttribute("aria-expanded"), "true");
  await navigation.locator('button[data-view-id="settings"]').waitFor();
  await navigation.locator('button[data-view-id="settings"]').click();
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert.equal(query("view"), "settings");
  await tabbar.locator('[data-tab="more"]').click();
  assert.equal(await menu.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  await menu.click();
  await page.locator(".host-scrim").click({ position: { x: 370, y: 400 } });
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  await tabbar.locator('[data-tab-view="calendar"]').click();
  assert.equal(query("view"), "calendar");
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
  );
  await menu.click();
  await page.evaluate(() =>
    window.dispatchEvent(new CustomEvent("host:workspace-reset")),
  );
  assert.equal(await menu.getAttribute("aria-expanded"), "false");

  // A pending account has only the join view: no drawer, menu or tab bar.
  await page.goto(origin + "/dashboard/host/");
  await page.locator('button[data-view-id="calendar"]').waitFor({ state: "attached" });
  await page.evaluate(() => {
    const root = document.getElementById("host-management");
    root.dataset.homeView = "invitations";
    root.innerHTML =
      '<div data-workspace-view="invitations"><section aria-label="Join an organization">Join content</section></div>';
    root.dataset.loading = "false";
    window.dispatchEvent(new CustomEvent("host:workspace-ready"));
  });
  await page.waitForFunction(() => document.body.classList.contains("host-menu-empty"));
  assert.equal(await view(), "invitations");
  assert.equal(await tabbar.isVisible(), false);
  assert.equal(await menu.isVisible(), false);
  assert.deepEqual(errors, []);
});
