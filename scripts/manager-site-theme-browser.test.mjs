import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

test("Manager uses the public site's white, ink and blue design across languages and viewports", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [320, 390, 1440]) await t.test(`${language}/${width}`, async t => {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: "reduce" });
    t.after(() => page.close());
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route(origin + "/manager-site-theme-fixture", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${["host-portal", "platform", "manager-dashboard", "dashboard-header", "role-guide", "manager-site-theme"].map(name => `<link rel="stylesheet" href="/css/${name}.css">`).join("")}</head><body class="platform-page" data-product="manager"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>` }));
    await page.goto(origin + "/manager-site-theme-fixture");
    await page.evaluate(async language => {
      const { createManagerDashboard } = await import("/js/manager-dashboard.js");
      const { ManagerExampleConnection } = await import("/js/manager-example-connection.js");
      const { createManagerExampleData, managerExampleSystems } = await import("/js/manager-example-data.js");
      const data = createManagerExampleData(), system = managerExampleSystems.find(row => row.id === "example-manager-gate");
      window.WebSocket = class { constructor() { throw new Error("Physical transport forbidden in presentation fixtures"); } };
      class Connection extends ManagerExampleConnection { constructor(options) { super({ data, system, onState: options.onState }); } }
      const dashboard = createManagerDashboard({ root: document.querySelector("#root"), user: { uid: "theme-fixture" }, language, Connection,
        api: async path => path === "/me" ? { role: "user", roles: ["user"], account: { id: "fixture" }, organizations: [] } : { items: path.startsWith("/systems?") ? [{ ...system, id: "theme-fixture", status: "active" }] : [], nextCursor: null } });
      await dashboard.ready;
    }, language);
    const he = language === "he", copy = (h, e) => he ? h : e;
    const open = page.locator(":is(.manager-view > .manager-grid, .manager-view > .manager-systems-row > .manager-grid, .manager-view > .pay-system-rows > .manager-systems-row > .manager-grid) .manager-system").getByRole("button", { name: copy("פתיחת סביבת ניהול", "Open workspace"), exact: true });
    assert.deepEqual(await open.evaluate(button => ({ background: getComputedStyle(button).backgroundColor, radius: getComputedStyle(button).borderRadius })), { background: "rgb(17, 17, 17)", radius: "4px" });
    assert.equal(await page.locator("body").evaluate(body => getComputedStyle(body).backgroundColor), "rgb(255, 255, 255)");
    assert.equal(await page.locator('.manager-nav button[aria-current="page"]').evaluate(button => getComputedStyle(button).backgroundColor), "rgb(17, 17, 17)");
    const capture = async section => {
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, section + " fits");
      if (process.env.MANAGER_THEME_EVIDENCE) {
        await mkdir(process.env.MANAGER_THEME_EVIDENCE, { recursive: true });
        await page.screenshot({ path: `${process.env.MANAGER_THEME_EVIDENCE}/${language}-${width}-${section}.png`, fullPage: true });
      }
    };
    await capture("systems");
    await open.click();
    await page.locator('[data-tab="history"]').waitFor();
    for (const tab of ["overview", "history", "guests"]) {
      await page.locator(`[data-tab="${tab}"]`).click();
      await page.locator("#manager-content > *").first().waitFor();
      await capture(tab);
    }
    const invite = page.getByRole("button", { name: copy("הזמנת אורח", "Invite a guest"), exact: true });
    await invite.click();
    await page.getByRole("dialog", { name: copy("הזמנת אורח", "Invite a guest") }).waitFor();
    await capture("guest-invite");
    assert.deepEqual(errors, []);
  });
});
