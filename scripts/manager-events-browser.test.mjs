import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { startSite } from "./platform-test-fixtures.mjs";

async function setup(browser, origin, { language = "en", width = 1440, maxEvents = 50 } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await page.route(origin + "/events-fixture", (route) => route.fulfill({
    contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><link rel="stylesheet" href="/css/manager-events.css"></head><body><main id="root"></main></body></html>`,
  }));
  await page.goto(origin + "/events-fixture");
  await page.evaluate(async ({ language, maxEvents }) => {
    const { createManagerEvents } = await import("/js/manager-events.js");
    window.eventCalls = []; window.eventConfirms = []; window.revision = 8;
    window.eventTable = { today: 20753, items: [[0, 0, 420, 780], [2, 1, 300, 360]], swapContacts: false, revision: 8 };
    window.events = createManagerEvents({
      root: document.querySelector("#root"), language, table: window.eventTable, maxEvents,
      confirm: async (message) => { window.eventConfirms.push(message); return true; },
      command: async (name, payload) => {
        window.eventCalls.push({ name, payload });
        if (window.conflictOnce && name === "ADMIN_SET_EVENTS") { window.conflictOnce = false; window.eventTable.revision++; throw new Error("CONFLICT"); }
        if (name === "ADMIN_LIST_EVENTS") return { data: structuredClone(window.eventTable) };
        if (payload.expectedRevision !== window.eventTable.revision) throw new Error("CONFLICT");
        if (name === "ADMIN_SET_EVENTS") window.eventTable.items = payload.items;
        if (name === "ADMIN_CLEAR_EVENTS") window.eventTable.items = [];
        if (name === "ADMIN_SET_EVENT_OPTIONS") window.eventTable.swapContacts = payload.swapContacts;
        window.eventTable.revision++;
        return { data: structuredClone(window.eventTable) };
      },
    });
  }, { language, maxEvents });
  return { page, errors };
}

test("Manager event planner matches mobile weekly/day interaction in Hebrew/English on desktop/mobile", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [390, 1440]) {
    const { page, errors } = await setup(browser, origin, { language, width });
    try {
      assert.equal(await page.locator(".manager-event-day-track").count(), 7);
      await page.locator(".manager-event-edit").first().click();
      await page.locator("dialog[open]").waitFor();
      assert.equal(await page.locator("[data-event-mode]").count(), 14);
      assert.equal(await page.locator("[data-event-save]").isDisabled(), true);
      await page.locator("dialog .manager-event-block:not(.is-locked)").first().press("Enter");
      const start = page.locator("[data-event-focus='start-10']");
      await start.click();
      assert.equal(await start.evaluate((node) => node === document.activeElement), true);
      await page.locator("[data-event-copy-day='1']").check();
      if (process.env.WIFIGATE_REVIEW_DIR) {
        await mkdir(process.env.WIFIGATE_REVIEW_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.WIFIGATE_REVIEW_DIR, `manager-events-${language}-${width}.png`), fullPage: true });
      }
      await page.locator("[data-event-save]").click();
      await page.waitForFunction(() => !document.querySelector("dialog[open]"));
      const saved = await page.evaluate(() => window.eventCalls[0]);
      assert.equal(saved.name, "ADMIN_SET_EVENTS");
      assert.equal(saved.payload.expectedRevision, 8);
      assert.deepEqual(saved.payload.items, [[0, 0, 430, 780], [1, 0, 430, 780], [2, 1, 300, 360]]);
      await page.locator(".manager-event-edit").first().click();
      await page.locator("[data-event-mode]:not([data-event-mode='0'])").first().click();
      await page.locator("[data-event-palette='CLOSE']").click();
      const track = page.locator("[data-event-timeline='editor']");
      const bounds = await track.boundingBox();
      await track.click({ position: { x: bounds.width * .85, y: 30 } });
      await page.locator("[data-event-save]").click();
      await page.waitForFunction(() => !document.querySelector("dialog[open]"));
      const once = await page.evaluate(() => window.eventTable.items.find((row) => row.length === 5));
      assert.deepEqual([once[0], once[1], once[4]], [0, 1, 5], "one-time dates are gate-relative offsets, not browser dates or strings");
      assert.equal(once[3] - once[2], 360);
      assert.equal(once[2] % 10, 0);
      assert.ok(once[3] <= 1440);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(overflow, false, `${language} ${width} viewport fits`);
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  }
});

test("Manager event editor prevents overlap writes, handles stale revisions, and disposes its modal", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, errors } = await setup(browser, origin);
  try {
    await page.locator(".manager-event-edit").first().click();
    await page.locator("dialog .manager-event-block").first().press("Enter");
    await page.locator("[data-event-focus='start-10']").click();
    await page.evaluate(() => { window.conflictOnce = true; });
    await page.locator("[data-event-save]").click();
    await page.getByRole("alert").waitFor();
    assert.match(await page.getByRole("alert").textContent(), /changed meanwhile/);
    assert.deepEqual(await page.evaluate(() => window.eventCalls.map((call) => call.name)), ["ADMIN_SET_EVENTS", "ADMIN_LIST_EVENTS"]);
    assert.equal(await page.locator("dialog").count(), 0);
    await page.locator(".manager-event-options input").check();
    await page.waitForFunction(() => window.eventTable.swapContacts);
    assert.equal((await page.evaluate(() => window.eventCalls.at(-1))).payload.expectedRevision, 9);
    await page.locator(".manager-event-edit").first().click();
    await page.locator("[data-event-palette='CLOSE']").click();
    const track = page.locator("[data-event-timeline='editor']");
    const bounds = await track.boundingBox();
    // Tapping an existing block selects it; it never inserts an overlapping event.
    await track.click({ position: { x: bounds.width * .4, y: 30 } });
    assert.equal(await page.locator("[data-event-save]").isDisabled(), true);
    await page.evaluate(() => window.events.dispose());
    assert.equal(await page.locator("dialog").count(), 0);
    assert.equal(await page.locator(".manager-events").count(), 0);
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test("Event overview keeps readable controls and destructive confirmation on narrow and wide screens", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [320, 768, 1440]) {
    const { page, errors } = await setup(browser, origin, { language, width });
    try {
      const meter = page.getByRole("meter");
      assert.equal(await meter.getAttribute("max"), "50");
      assert.equal(await meter.getAttribute("value"), "2");
      const edit = page.locator(".manager-event-edit").first();
      const bounds = await edit.boundingBox();
      assert.ok(bounds.width >= 44 && bounds.height >= 44, "day editing meets 44px target size");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      if (process.env.WIFIGATE_REVIEW_DIR) await page.screenshot({ path: path.join(process.env.WIFIGATE_REVIEW_DIR, `manager-events-overview-${language}-${width}.png`), fullPage: true });
      await page.evaluate(() => { window.events.dispose(); });
      // Recreate with a cancelled destructive confirmation: no command may be sent.
      await page.evaluate(async ({ language }) => {
        const { createManagerEvents } = await import("/js/manager-events.js");
        window.events = createManagerEvents({ root: document.querySelector("#root"), language, table: window.eventTable,
          confirm: async () => false, command: async (...args) => { window.eventCalls.push(args); } });
      }, { language });
      await page.locator("[data-event-focus='clear']").click();
      assert.deepEqual(await page.evaluate(() => window.eventCalls), []);
      assert.equal(await page.locator(".manager-event-day-track").count(), 7);
      await page.locator(".manager-event-day-track").first().press("Enter");
      await page.locator("dialog[open]").waitFor();
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("dialog").count(), 0);
      assert.equal(await page.locator(".manager-event-day-track").first().evaluate(node => node === document.activeElement), true);
      assert.deepEqual(errors, []);
    } finally { await page.close(); }
  }
});
