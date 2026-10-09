import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
test("workspace preserves deep links, reloads and browser history without exposing unavailable views", async (t) => {
  const server = createServer(async (req, res) => {
    try {
      const file = path.resolve(
        root,
        "." + new URL(req.url, "http://localhost").pathname,
      );
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      res.setHeader(
        "Content-Type",
        file.endsWith(".js") ? "application/javascript" : "text/css",
      );
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const browser = await chromium.launch({
    channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/dashboard/host/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/css/host-workspace.css"></head><body class="portal-dashboard"><nav id="host-section-navigation"></nav><details id="account-details"><summary>Account</summary></details><section id="admin-overview" hidden></section><main id="host-management" data-loading="true"></main><script type="module" src="/js/host-dashboard-navigation.js"></script></body></html>`,
    }),
  );
  const origin = `http://127.0.0.1:${server.address().port}`;
  async function ready() {
    await page.locator('button[data-view="Calendar"]').waitFor();
    await page.evaluate(() => {
      const root = document.getElementById("host-management");
      root.innerHTML =
        '<section class="host-calendar">Calendar content</section><section aria-label="Reservations">Reservations content</section><section aria-label="properties">Properties content</section><section aria-label="Team invitations">Invitations content</section>';
      root.dataset.loading = "false";
      root.dataset.organizationId = "test-org";
    });
  }
  await page.goto(origin + "/dashboard/host/?lang=he&view=reservations");
  await ready();
  await page.waitForFunction(
    () => document.body.dataset.hostView === "Reservations",
  );
  assert.equal(
    await page
      .getByRole("region", { name: "Reservations", exact: true })
      .isVisible(),
    true,
  );
  const navigation = page.locator("#host-section-navigation");
  assert.equal(
    await navigation.locator('button[data-view="Calendar"]').innerText(),
    "לוח שנה",
  );
  await navigation.locator('button[data-view="Settings"]').click();
  assert.equal(new URL(page.url()).searchParams.get("view"), "settings");
  assert.equal(new URL(page.url()).searchParams.get("lang"), "he");
  await navigation.locator('button[data-view="Properties"]').click();
  assert.equal(new URL(page.url()).searchParams.get("view"), "properties");
  await page.goBack();
  await page.waitForFunction(
    () => document.body.dataset.hostView === "Settings",
  );
  assert.equal(
    await page.locator("#account-details").evaluate((e) => e.open),
    true,
  );
  await page.goForward();
  await page.waitForFunction(
    () => document.body.dataset.hostView === "Properties",
  );
  await page.reload();
  await ready();
  await page.waitForFunction(
    () => document.body.dataset.hostView === "Properties",
  );
  assert.equal(
    await page
      .getByRole("region", { name: "properties", exact: true })
      .isVisible(),
    true,
  );
  // An import approval can refresh the workspace between pointer down/up.
  // Preserve the navigation intent while replacing authorized components.
  await page.evaluate(() => {
    const keys = document.createElement("section");
    keys.setAttribute("aria-label", "WIFIGATE systems");
    keys.textContent = "Original systems";
    document.getElementById("host-management").append(keys);
  });
  const keysButton = navigation.locator('button[data-view="Access Keys"]');
  await keysButton.hover();
  await page.mouse.down();
  await page.evaluate(() => {
    const root = document.getElementById("host-management");
    root.dataset.loading = "true";
    root.innerHTML = '<p role="status">Refreshing authorized workspace</p>';
  });
  assert.equal(
    await keysButton.isDisabled(),
    false,
    "a workspace refresh must not discard an in-progress navigation click",
  );
  await page.mouse.up();
  await page.waitForFunction(
    () => document.body.dataset.hostView === "Access Keys",
  );
  assert.equal(new URL(page.url()).searchParams.get("view"), "access-keys");
  await page.evaluate(() => {
    const root = document.getElementById("host-management");
    root.innerHTML =
      '<section class="host-calendar">Calendar content</section><section aria-label="WIFIGATE systems">Refreshed authorized systems</section>';
    root.dataset.loading = "false";
  });
  await page
    .getByText("Refreshed authorized systems", { exact: true })
    .waitFor();
  assert.equal(await keysButton.getAttribute("aria-current"), "page");
  // A completed reload without the authorized section still revokes the view.
  await page.evaluate(() => {
    const root = document.getElementById("host-management");
    root.dataset.loading = "true";
    root.innerHTML = '<p role="status">Refreshing changed role</p>';
  });
  await page.evaluate(() => {
    const root = document.getElementById("host-management");
    root.innerHTML =
      '<section class="host-calendar">Calendar content</section>';
    root.dataset.loading = "false";
  });
  await page.waitForFunction(
    () => document.body.dataset.hostView === "Calendar",
  );
  assert.equal(await keysButton.isDisabled(), true);
  await page.goto(origin + "/dashboard/host/?view=access-keys");
  await ready();
  await page.waitForFunction(
    () => document.body.dataset.hostView === "Calendar",
  );
  assert.equal(
    await navigation
      .getByRole("button", { name: "Access Keys", exact: true })
      .isDisabled(),
    true,
  );
  assert.equal(new URL(page.url()).searchParams.has("view"), false);
  await navigation
    .getByRole("button", { name: "Reservations", exact: true })
    .click();
  await page.evaluate(() => {
    document.getElementById("host-management").replaceChildren();
    window.dispatchEvent(new CustomEvent("host:workspace-reset"));
  });
  assert.equal(
    await page.locator('section[aria-label="Reservations"]').count(),
    0,
  );
  assert.equal(new URL(page.url()).searchParams.has("view"), false);
  assert.deepEqual(errors, []);
});
