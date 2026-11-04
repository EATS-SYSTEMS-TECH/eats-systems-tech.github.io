import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

// Changing a system's organization makes the gate delete its saved Wi-Fi
// networks on its next check; the owner is warned before anything is sent.
test("assigning a system to another organization warns about the gate's Wi-Fi first", async t => {
  const { origin, browser } = await startSite(t);
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(8000); t.after(() => page.close());
  const errors = []; page.on("pageerror", e => errors.push(e.message));
  await page.route(origin + "/assign-fixture", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="en" dir="ltr"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>` }));
  await page.goto(origin + "/assign-fixture");
  await page.evaluate(async () => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    const { ManagerExampleConnection } = await import("/js/manager-example-connection.js");
    const { createManagerExampleData, managerExampleSystems } = await import("/js/manager-example-data.js");
    const data = createManagerExampleData(), system = managerExampleSystems[0];
    window.calls = [];
    window.WebSocket = class { constructor() { throw new Error("Physical transport forbidden"); } };
    class Connection extends ManagerExampleConnection { constructor(options) { super({ data, system, onState: options.onState }); } }
    const orgs = [{ id: "org-a", name: "Org A", role: "owner" }, { id: "org-b", name: "Org B", role: "owner" }];
    window.dashboard = createManagerDashboard({ root: document.querySelector("#root"), user: { uid: "assign-fixture" }, language: "en", Connection,
      api: async (path, method) => {
        window.calls.push([path, method ?? "GET"]);
        if (path === "/me") return { role: "user", roles: ["user"], account: { id: "acct" }, organizations: orgs };
        if (path.endsWith("/assign")) return { ok: true };
        return { items: path.startsWith("/systems?") ? [{ ...system, id: "real-1", name: "Gate One", status: "active", orgId: "org-a", version: 3 }] : [], nextCursor: null };
      } });
    await window.dashboard.ready;
  });
  await page.locator(".manager-view > .manager-grid .manager-system").getByRole("button", { name: "Open workspace", exact: true }).click();
  const menu = page.locator(".manager-system-menu").first();
  await menu.locator("summary").click();
  await menu.getByRole("button", { name: "Assign organization", exact: true }).click();
  const select = page.getByRole("combobox", { name: "Organization" });
  await select.selectOption("org-b");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "deletes its saved Wi-Fi networks" });
  await dialog.waitFor();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal((await page.evaluate(() => window.calls)).some(([path]) => path.endsWith("/assign")), false, "cancel sends nothing");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.getByRole("dialog").filter({ hasText: "deletes its saved Wi-Fi networks" }).getByRole("button", { name: "Confirm", exact: true }).click();
  await page.waitForFunction(() => window.calls.some(([path, method]) => path === "/systems/real-1/assign" && method === "POST"));
  assert.deepEqual(errors, []);
});
