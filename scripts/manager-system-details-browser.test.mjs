import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

async function workspace(browser, origin, language, width, legacy = false) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.route(origin + "/manager-details-fixture", (route) => route.fulfill({
    contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body data-product="manager" class="platform-page"><main class="platform-shell"><div id="root"></div></main></body></html>`,
  }));
  await page.goto(origin + "/manager-details-fixture");
  await page.evaluate(async ({ language, legacy }) => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    const { ManagerExampleConnection } = await import("/js/manager-example-connection.js");
    const { createManagerExampleData, managerExampleSystems } = await import("/js/manager-example-data.js");
    window.managerDetailCommands = [];
    class FixtureConnection extends ManagerExampleConnection {
      constructor(options) { super({ data: createManagerExampleData(), system: managerExampleSystems[0], onState: options.onState }); }
      async open() {
        const result = await super.open("DEMO-24980");
        if (legacy) {
          this.capabilities.data.features = this.capabilities.data.features.filter((feature) => feature !== "AUTO_OPEN_USERS");
          delete this.capabilities.data.limits.maxUsers;
        }
        return result;
      }
      async command(name, payload) {
        window.managerDetailCommands.push({ name, payload });
        const result = await super.command(name, payload);
        if (legacy && name === "ADMIN_GET_STORAGE_HEALTH") {
          // Legacy firmware reported file byte counts; these are not SD capacity.
          result.data.sd = { supported: true, mounted: true, writable: true, historyBytes: 3456 };
        }
        if (legacy && name === "ADMIN_RF_GET") result.data.rfCode = { present: false, codeHex: "", bits: 0, protocol: 0 };
        return result;
      }
    }
    window.dashboard = createManagerDashboard({
      root: document.querySelector("#root"), user: {}, language, Connection: FixtureConnection,
      ensureRecent: async () => {},
      api: async (path) => path === "/me" ? { role: "user", account: { id: "details-fixture" }, organizations: [] }
        : { items: path.startsWith("/systems?") ? [{ ...managerExampleSystems[0], id: "fixture-real-gate", status: "active" }] : [], nextCursor: null },
    });
    await window.dashboard.ready;
  }, { language, legacy });
  return { page, errors };
}

async function tab(page, key) {
  await page.locator(`[data-tab="${key}"]`).click();
  await page.waitForFunction(() => document.querySelector(".manager-view")?.getAttribute("aria-busy") === "false" && document.querySelector("#manager-content")?.childElementCount > 0);
}
async function assertDetails(page, language) {
  const he = language === "he";
  const content = page.locator("#manager-content");
  await tab(page, "overview");
  assert.match(await content.textContent(), he ? /מספר משתמשים מרבי/ : /Maximum users/);
  assert.match(await content.textContent(), /5000/);
  assert.doesNotMatch(await content.textContent(), /Flash|flashVariantMb|נפח Flash/);
  await tab(page, "settings");
  for (const [method, count] of [["PULSE", 1], ["PULSE_AFTER_PULSE", 3], ["PULSE_AFTER_PULSE_AFTER_PULSE", 5], ["TOGGLE", 0], ["PUSH_BUTTON", 0]]) {
    await content.locator('select[name="command"]').selectOption(method);
    assert.equal(await content.locator(".manager-timing-fields input:visible").count(), count, method);
    assert.equal(await content.locator(".manager-timing-fields input:not(:disabled)").count(), count, `${method} inactive timing fields cannot be submitted`);
  }
  await tab(page, "rf");
  assert.match(await content.textContent(), /0x0000000000A1B2C3/);
  assert.equal(await content.getByRole("button").count(), 0, "RF is a read-only learned-code summary");
  assert.equal(await content.locator("input,select").count(), 0);
  await tab(page, "system");
  const sd = content.locator(".manager-device-card").first();
  assert.match(await sd.textContent(), /32 GB/);
  assert.match(await sd.textContent(), he ? /פורמט תואם למערכת/ : /Compatible with the system/);
  assert.match(await sd.textContent(), /128 MB/);
  await tab(page, "auto");
  const rows = content.locator(".manager-auto-user");
  assert.equal(await rows.count(), 10);
  const more = content.locator(".manager-auto-users").getByRole("button");
  await more.click(); assert.equal(await rows.count(), 20);
  await more.click(); assert.equal(await rows.count(), 24);
  assert.equal(await more.isHidden(), true);
  assert.doesNotMatch(await content.locator(".manager-auto-user-list").textContent(), /Demo resident (24|25|26|27|28|29|30)/);
  assert.match(await content.locator(".manager-auto-user-list").textContent(), /Demo admin 01/);
  for (const people of ["users", "admins"]) {
    await tab(page, people);
    await content.getByRole("button", { name: he ? "ייבוא CSV" : "Import CSV", exact: true }).click();
    const dialog = page.locator(".manager-csv-dialog[open]");
    await dialog.waitFor();
    assert.match(await dialog.locator("pre code").textContent(), /^Name,Email,Country,Local,Floor,Apt,Parking\n/);
    assert.match(await dialog.textContent(), he ? /UTF-8/ : /comma-separated UTF-8/);
    assert.equal(await dialog.locator("input[type='file']").count(), 1);
    await dialog.getByRole("button", { name: he ? "ביטול" : "Cancel", exact: true }).click();
    await page.waitForFunction(() => !document.querySelector(".manager-csv-dialog[open]"));
  }
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
}

test("real and example Manager share nontechnical system facts, dynamic opening settings, RF/SD details, enrolled Auto Open pages and CSV examples", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [390, 1440]) {
    const { page, errors } = await workspace(browser, origin, language, width);
    try {
      await page.locator(".manager-view > .manager-grid .manager-system").getByRole("button",{name:language==="he"?"פתיחת סביבת ניהול":"Open workspace",exact:true}).click();
      await page.locator("#manager-content .manager-facts").waitFor();
      await assertDetails(page, language);
      assert.deepEqual(await page.evaluate(() => window.managerDetailCommands.filter((call) => call.name === "ADMIN_LIST_AUTO_OPEN_USERS").map((call) => call.payload.page)), [
        { cursor: null, limit: 10 }, { cursor: "10", limit: 10 }, { cursor: "20", limit: 10 },
      ]);
      await page.getByRole("button", { name: language === "he" ? "סיום וחזרה" : "End and return", exact: true }).click();
      await page.locator(".manager-examples > summary").click();
      await page.locator('[data-example-system="example-manager-gate"]').getByRole("button",{name:language==="he"?"פתיחת סביבת ניהול":"Open workspace",exact:true}).click();
      await page.locator(".manager-simulation-note").waitFor();
      await page.locator("#manager-content .manager-facts").waitFor();
      await assertDetails(page, language);
      assert.deepEqual(errors, []);
      await page.evaluate(() => window.dashboard.close());
    } finally { await page.close(); }
  }
});

test("older firmware exposes unavailable Auto Open/SD facts without inventing enrollment, capacity or format", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) {
    const { page, errors } = await workspace(browser, origin, language, 390, true);
    try {
      await page.locator(".manager-view > .manager-grid .manager-system").getByRole("button",{name:language==="he"?"פתיחת סביבת ניהול":"Open workspace",exact:true}).click();
      await page.locator("#manager-content .manager-facts").waitFor();
      const content = page.locator("#manager-content");
      assert.equal(await content.locator('[data-metric="maxUsers"] dd').innerText(), language === "he" ? "לא זמין" : "Unavailable", "unknown capacity is explicit rather than estimated");
      assert.equal(await content.locator(".manager-overview-metrics progress").count(), 0, "unknown capacity cannot become a usage ratio");
      assert.doesNotMatch(await content.textContent(), /5000|5,000|Flash/);
      await tab(page, "auto");
      assert.match(await content.locator(".manager-auto-users").textContent(), language === "he" ? /דורשת קושחה/ : /requires firmware/);
      assert.equal(await content.locator(".manager-auto-user").count(), 0);
      assert.equal(await page.evaluate(() => window.managerDetailCommands.filter((call) => call.name === "ADMIN_LIST_AUTO_OPEN_USERS").length), 0);
      await tab(page, "system");
      const sd = content.locator(".manager-device-card").first();
      assert.match(await sd.textContent(), language === "he" ? /לא ניתן לאמת את הפורמט/ : /Format could not be verified/);
      assert.match(await sd.textContent(), language === "he" ? /לא דווח על ידי המערכת/ : /Not reported by the system/);
      assert.doesNotMatch(await sd.textContent(), /\b(?:32|2|3456) (?:GB|MB|KB|B)\b/);
      await tab(page, "rf");
      assert.match(await content.textContent(), language === "he" ? /לא נשמר שלט/ : /No remote saved/);
      assert.doesNotMatch(await content.textContent(), /0x|Learned code|הקוד שנלמד/);
      assert.deepEqual(errors, []);
      await page.evaluate(() => window.dashboard.close());
    } finally { await page.close(); }
  }
});
