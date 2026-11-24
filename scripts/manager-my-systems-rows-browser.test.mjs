import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

// My systems is ordered in rows: one per organization of the account (an
// organization without systems too), then the systems in no organization.
test("My systems shows one row per organization, an empty organization row and a no-organization row", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [390, 1280]) {
    await t.test(`${language} ${width}`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.setDefaultTimeout(8000);
      try {
        const errors = []; page.on("pageerror", e => errors.push(e.message));
        const dir = language === "he" ? "rtl" : "ltr";
        await page.route(origin + "/rows-fixture", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${dir}"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>` }));
        await page.goto(origin + "/rows-fixture");
        await page.evaluate(async language => {
          const { createManagerDashboard } = await import("/js/manager-dashboard.js");
          const { managerExampleSystems } = await import("/js/manager-example-data.js");
          const base = managerExampleSystems[0];
          window.calls = [];
          window.WebSocket = class { constructor() { throw new Error("Physical transport forbidden"); } };
          const orgs = [{ id: "org-a", name: "WIFIGATE TEST", role: "owner" }, { id: "org-b", name: "Beit Hadar", role: "owner" }];
          const systems = [
            { ...base, id: "real-1", name: "19560", status: "active", orgId: "org-a", version: 3 },
            { ...base, id: "real-3", name: "Parking", status: "active", orgId: "org-a", version: 1 },
            { ...base, id: "real-4", name: "Back gate", status: "active", orgId: "org-a", version: 1 },
            { ...base, id: "real-5", name: "Lobby", status: "active", orgId: "org-a", version: 1 },
            { ...base, id: "real-6", name: "Warehouse", status: "active", orgId: "org-a", version: 1 },
            { ...base, id: "real-2", name: "Main entrance", status: "active", version: 1 },
          ];
          window.dashboard = createManagerDashboard({ root: document.querySelector("#root"), user: { uid: "rows-fixture" }, language,
            api: async (path, method) => {
              window.calls.push([path, method ?? "GET"]);
              if (path === "/me") return { role: "user", roles: ["user"], account: { id: "acct" }, organizations: orgs };
              if (path.startsWith("/systems?")) return { items: systems, nextCursor: null };
              return { items: [], nextCursor: null };
            } });
          await window.dashboard.ready;
        }, language);
        const rows = page.locator(".manager-view > .manager-systems-row");
        await rows.first().waitFor();
        const he = language === "he";
        assert.deepEqual(await rows.evaluateAll(list => list.map(row => row.dataset.row)), ["org-org-a", "org-org-b", "none"]);
        const titles = await page.locator(".manager-systems-row-title h4").allTextContents();
        assert.deepEqual(titles, ["WIFIGATE TEST", "Beit Hadar", he ? "ללא ארגון" : "No organization"]);
        const counts = await page.locator(".manager-systems-row-title p").allTextContents();
        assert.deepEqual(counts, he ? ["5 מערכות", "עדיין אין מערכות בארגון", "מערכת אחת"] : ["5 systems", "No systems yet", "1 system"]);
        assert.equal(await rows.nth(0).locator(".manager-system").count(), 5);
        // A row keeps its height and scrolls sideways; the step buttons move it.
        const track = rows.nth(0).locator(":scope > .manager-grid");
        const box = await track.evaluate(el => ({ overflow: el.scrollWidth > el.clientWidth + 2, display: getComputedStyle(el).display, tops: new Set([...el.children].map(c => Math.round(c.getBoundingClientRect().top))).size }));
        assert.equal(box.display, "flex"); assert.equal(box.tops, 1, "one line of cards"); assert.equal(box.overflow, true);
        if (width >= 768) {
          await rows.nth(0).getByRole("button", { name: he ? "מערכות נוספות" : "More systems" }).click();
          await page.waitForFunction(() => Math.abs(document.querySelector(".manager-systems-row > .manager-grid").scrollLeft) > 20);
        }
        assert.equal(await rows.nth(1).locator(".manager-system").count(), 0);
        assert.equal(await rows.nth(1).locator(".manager-systems-row-empty").count(), 1);
        assert.equal(await rows.nth(2).locator(".manager-system").count(), 1);
        assert.equal(await rows.nth(2).getByRole("button", { name: he ? "כניסה לארגון" : "Open organization" }).count(), 0, "no organization to open");
        // Every row is labelled by its heading and stays inside the viewport.
        for (const row of await rows.all()) assert.ok(await row.getAttribute("aria-labelledby"));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, "no horizontal scroll");
        await page.screenshot({ path: `${process.env.ROWS_SHOT_DIR || "."}/my-systems-rows-${language}-${width}.png`, fullPage: true }).catch(() => {});
        assert.deepEqual(errors, []);
        // The search filters systems and organization names and reports no results.
        const visibleRows = () => page.locator(".manager-view > .manager-systems-row:not([hidden])").evaluateAll(l => l.map(r => r.dataset.row));
        const search = page.getByRole("searchbox", { name: he ? "חיפוש במערכות שלי" : "Search my systems" });
        await search.fill("park");
        assert.deepEqual(await visibleRows(), ["org-org-a"]);
        assert.equal(await rows.nth(0).locator(".manager-system:not([hidden])").count(), 1);
        assert.equal(await rows.nth(0).locator(".manager-systems-row-title p").textContent(), he ? "1 מתוך 5" : "1 of 5");
        await search.fill("beit");
        assert.deepEqual(await visibleRows(), ["org-org-b"]);
        await search.fill("zzzz");
        assert.equal(await page.locator(".manager-systems-search-empty").isVisible(), true);
        await search.fill("");
        assert.deepEqual(await visibleRows(), ["org-org-a", "org-org-b", "none"]);
        assert.equal(await page.locator(".manager-systems-search-empty").isVisible(), false);
        // Opening the organization requests it; the fixture has no detail page.
        await rows.nth(0).getByRole("button", { name: he ? "כניסה לארגון" : "Open organization" }).click();
        await page.waitForFunction(() => window.calls.some(([path]) => path.startsWith("/organizations/org-a")));
      } finally {
        await page.close();
      }
    });
  }
});
