import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

// The History master switch on the Manager History tab (js/manager-history-switch.js).
async function setup(t, browser, origin, options = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  t.after(() => page.close());
  await page.goto(origin + "/404.html");
  await page.evaluate(async (options) => {
    const { renderManagerHistorySwitch } = await import("/js/manager-history-switch.js");
    document.body.replaceChildren();
    const root = document.createElement("main");
    document.body.append(root);
    window.calls = [];
    window.confirmed = false;
    window.confirmations = [];
    window.gate = { enabled: options.enabled ?? true, revision: 4 };
    window.conflictOnce = Boolean(options.conflict);
    const connection = {
      session: {},
      capabilities: { data: { features: options.features ?? ["HISTORY", "HISTORY_SWITCH"] } },
      command: async (name, payload) => {
        window.calls.push({ name, payload });
        if (name === "ADMIN_GET_HISTORY_CONFIG") return { data: { config: { enabled: window.gate.enabled }, revision: window.gate.revision } };
        if (window.conflictOnce) {
          window.conflictOnce = false;
          window.gate = { enabled: !window.gate.enabled, revision: window.gate.revision + 1 };
          throw Object.assign(new Error("CONFLICT"), { code: "CONFLICT", firmwareRefusal: true });
        }
        window.gate = { enabled: payload.enabled, revision: window.gate.revision + 1 };
        return { data: { config: { enabled: window.gate.enabled }, revision: window.gate.revision } };
      },
    };
    window.card = await renderManagerHistorySwitch({
      root, connection, language: options.language ?? "en",
      confirm: async (message) => { window.confirmations.push(message); return window.confirmed; },
      isCurrent: () => true,
      errorText: (error) => error.message,
    });
  }, options);
  return page;
}

test("a gate without HISTORY_SWITCH shows no History switch and sends nothing", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin, { features: ["HISTORY"] });
  assert.equal(await page.evaluate(() => window.card), null);
  assert.equal(await page.locator(".manager-history-switch").count(), 0);
  assert.deepEqual(await page.evaluate(() => window.calls), []);
});

test("turning History off asks first and sends the revision the gate reported", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin);
  const box = page.getByRole("checkbox", { name: "Keep history" });
  assert.equal(await box.isChecked(), true);
  await box.click();
  assert.equal(await page.evaluate(() => window.confirmations.length), 1);
  assert.equal(await page.evaluate(() => window.calls.filter((c) => c.name === "ADMIN_SET_HISTORY_CONFIG").length), 0);
  assert.equal(await box.isChecked(), true);
  await page.evaluate(() => (window.confirmed = true));
  await box.click();
  await page.waitForFunction(() => window.calls.some((c) => c.name === "ADMIN_SET_HISTORY_CONFIG"));
  assert.deepEqual(await page.evaluate(() => window.calls.at(-1)), { name: "ADMIN_SET_HISTORY_CONFIG", payload: { enabled: false, expectedRevision: 4 } });
  await page.waitForFunction(() => document.querySelector(".manager-history-switch").dataset.historyEnabled === "false");
  assert.equal(await box.isChecked(), false);
  assert.match(await page.locator(".manager-history-switch").innerText(), /History is off/);
});

test("turning History on needs no confirmation", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin, { enabled: false, language: "he" });
  const box = page.getByRole("checkbox", { name: "שמירת היסטוריה" });
  assert.equal(await box.isChecked(), false);
  await box.click();
  await page.waitForFunction(() => document.querySelector(".manager-history-switch").dataset.historyEnabled === "true");
  assert.equal(await page.evaluate(() => window.confirmations.length), 0);
  assert.deepEqual(await page.evaluate(() => window.calls.at(-1).payload), { enabled: true, expectedRevision: 4 });
});

test("a CONFLICT from the gate shows the error and reloads the gate's value", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await setup(t, browser, origin, { enabled: false, conflict: true });
  await page.getByRole("checkbox", { name: "Keep history" }).click();
  await page.waitForFunction(() => window.calls.filter((c) => c.name === "ADMIN_GET_HISTORY_CONFIG").length === 2);
  await page.waitForFunction(() => document.querySelector(".manager-history-switch").dataset.historyEnabled === "true");
  assert.match(await page.getByRole("alert").innerText(), /CONFLICT/);
});
