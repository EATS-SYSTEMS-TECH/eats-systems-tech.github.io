import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("a newly exported offline gate can be assigned before Wi-Fi or a remote session exists", async t => {
  const site = await startSite(t);
  for (const language of ["en", "he"]) for (const width of [390, 1440]) {
    await t.test(`${language}/${width}`, async () => {
      const he = language === "he";
      const page = await site.browser.newPage({ viewport: { width, height: 950 } });
      t.after(() => page.close());
      await page.route(site.origin + "/first-assignment", route => route.fulfill({
        contentType: "text/html", body: `<html lang="${language}" dir="${he ? "rtl" : "ltr"}"><head><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page"><main class="platform-shell"><div id="root"></div></main></body></html>`,
      }));
      await page.goto(site.origin + "/first-assignment");
      await page.evaluate(async language => {
        const { createManagerDashboard } = await import("/js/manager-dashboard.js");
        window.assignments = []; window.connections = 0; window.reauth = 0;
        const org = { id: "bench", name: "Bench organization", role: "owner" };
        const system = { id: "new", name: "Offline gate", type: "gate", status: "active", version: 1, orgId: null, systemIds: ["gate"] };
        window.dashboard = createManagerDashboard({ root: document.querySelector("#root"), user: { uid: "owner" }, language,
          ensureRecent: async () => { window.reauth++; },
          Connection: class { constructor() { window.connections++; throw Error("Gate has no Wi-Fi yet"); } },
          api: async (path, method, body) => {
            if (path === "/me") return { role: "user", account: { id: "owner" }, organizations: [org] };
            if (path.startsWith("/systems?")) return { items: [system], nextCursor: null };
            if (path.startsWith("/invitations?")) return { items: [], nextCursor: null };
            if (path === "/systems/new/assign") { window.assignments.push({ method, body }); system.orgId = body.orgId; return { system }; }
            throw Error("Unexpected API " + path);
          },
        });
        await window.dashboard.ready;
      }, language);
      await page.getByRole("button", { name: he ? "המערכות שלי" : "My systems", exact: true }).click();
      const card = page.locator(":is(.manager-view > .manager-grid, .manager-view > .manager-systems-row > .manager-grid, .manager-view > .pay-system-rows > .manager-systems-row > .manager-grid) .manager-system").filter({ hasText: "Offline gate" });
      const menu = card.locator(".manager-system-menu");
      await menu.locator("summary").click();
      await menu.getByRole("button", { name: he ? "שיוך לארגון" : "Assign organization", exact: true }).click();
      await page.getByRole("combobox", { name: he ? "ארגון" : "Organization", exact: true }).selectOption("bench");
      const save = page.getByRole("button", { name: he ? "שמירה" : "Save", exact: true });
      await save.click();
      await page.getByRole("dialog").getByRole("button", { name: he ? "ביטול" : "Cancel", exact: true }).click();
      assert.equal(await page.evaluate(() => window.assignments.length), 0);
      await save.click();
      await page.getByRole("dialog").getByRole("button", { name: he ? "אישור" : "Confirm", exact: true }).click();
      await card.getByRole("button", { name: he ? "פתיחת סביבת ניהול" : "Open workspace", exact: true }).waitFor();
      assert.deepEqual(await page.evaluate(() => window.assignments), [{ method: "POST", body: { orgId: "bench", expectedVersion: 1 } }]);
      assert.equal(await page.evaluate(() => window.connections), 0);
      assert.equal(await page.evaluate(() => window.reauth), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    });
  }
});
