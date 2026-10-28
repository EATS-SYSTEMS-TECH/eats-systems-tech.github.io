import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

async function transport(t, browser, origin, options = {}) {
  const page = await browser.newPage(); page.setDefaultTimeout(6000); t.after(() => page.close());
  await page.route(origin + "/manager-timing-fixture", route => route.fulfill({ contentType: "text/html", body: "<!doctype html><html><body>Isolated Manager timing fixture</body></html>" }));
  await page.goto(origin + "/manager-timing-fixture");
  await page.clock.install({ time: new Date("2026-10-28T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-28T12:00:01Z"));
  await page.evaluate(async options => {
    const { ManagerConnection } = await import("/js/manager-connection.js");
    window.calls = []; window.states = []; window.relayAttempts = 0; window.ready = false;
    const version = options.responseVersion ?? 1;
    const policy = version === 2 ? { timingVersion: 2, demandLifetimeMs: 180000, softWaitMs: 120000, pollIntervalMs: 90000 } : { timingVersion: 1, demandLifetimeMs: 90000, softWaitMs: 60000, pollIntervalMs: 60000 };
    const startedAt = Date.now();
    const request = { requestId: "fixture-request", ...(options.legacy ? {} : policy), expiresAt: new Date(startedAt + policy.demandLifetimeMs).toISOString() };
    const api = async (path, method, body) => {
      window.calls.push({ path, method: method || "GET", body });
      if (path.endsWith("/identity")) return { systemId: "123", keyId: "key", devicePublicKey: "04" + "1".repeat(128) };
      if (path === "/connection-requests") {
        if (options.deferCreation) return new Promise(resolve => { window.releaseCreation = () => resolve(request); });
        return request;
      }
      if (path.endsWith("/cancel")) return { cancelled: true };
      return { state: window.ready ? "ready" : "waiting", nonce: "a".repeat(64), clientTicket: "synthetic-ticket", relayUrl: "wss://example.test", ...(options.legacy ? {} : policy), expiresAt: new Date(startedAt + (options.shortenToMs || policy.demandLifetimeMs)).toISOString() };
    };
    window.channel = new ManagerConnection({ api, user: { uid: "isolated-timing-test" }, timingVersion: options.requestVersion || 1, onState: state => window.states.push(state), onTiming: policy => { window.timing = policy; }, WebSocketImpl: class { constructor() { window.relayAttempts++; throw new Error("REACHED_RELAY"); } } });
    window.channel.open("123").then(() => { window.outcome = "OPEN"; }, error => { window.outcome = error.message; });
  }, options);
  await page.waitForFunction(() => window.calls.some(call => call.path === "/connection-requests"));
  return page;
}

test("Manager transport keeps old servers and v1 gates on their existing 90 second lifetime", async t => {
  const { origin, browser } = await startSite(t);
  for (const options of [{ legacy: true }, { requestVersion: 2, responseVersion: 1 }]) await t.test(JSON.stringify(options), async t => {
    const page = await transport(t, browser, origin, options);
    await page.waitForFunction(() => window.timing);
    const creation = await page.evaluate(() => window.calls.find(call => call.path === "/connection-requests").body);
    assert.equal("timingVersion" in creation, options.requestVersion === 2);
    await page.clock.fastForward(90000);
    await page.waitForFunction(() => window.outcome);
    assert.equal(await page.evaluate(() => window.outcome), "NO_COMMUNICATION");
    assert.equal(await page.evaluate(() => window.relayAttempts), 0);
    assert.equal(await page.evaluate(() => window.calls.filter(call => call.path.endsWith("/cancel")).length), 1);
  });
});
test("a negotiated v2 system can reach the relay after the legacy 90 second boundary", async t => {
  const { origin, browser } = await startSite(t);
  const page = await transport(t, browser, origin, { requestVersion: 2, responseVersion: 2 });
  await page.waitForFunction(() => window.timing);
  await page.clock.fastForward(100000);
  assert.equal(await page.evaluate(() => window.channel.closed), false);
  await page.evaluate(() => { window.ready = true; });
  await page.clock.runFor(1500);
  await page.waitForFunction(() => window.outcome);
  assert.equal(await page.evaluate(() => window.outcome), "REACHED_RELAY");
  assert.equal(await page.evaluate(() => window.relayAttempts), 1);
  assert.equal(await page.evaluate(() => window.calls.some(call => call.path.endsWith("/grants"))), false, "the synthetic socket never authenticates or sends commands");
});
test("v2 expires at 180 seconds and server expiry can only shorten that deadline", async t => {
  const { origin, browser } = await startSite(t);
  for (const shortenToMs of [undefined, 45000]) await t.test(String(shortenToMs || 180000), async t => {
    const page = await transport(t, browser, origin, { requestVersion: 2, responseVersion: 2, shortenToMs });
    await page.waitForFunction(() => window.calls.some(call => call.path === "/connection-requests/fixture-request"));
    await page.clock.fastForward((shortenToMs || 180000) - 1);
    assert.equal(await page.evaluate(() => window.channel.closed), false);
    await page.clock.runFor(1);
    await page.waitForFunction(() => window.outcome);
    assert.equal(await page.evaluate(() => window.outcome), "NO_COMMUNICATION");
    assert.equal(await page.evaluate(() => window.relayAttempts), 0);
  });
});
test("cancelling while demand creation is in flight retains a barrier and cancels its late requestId once", async t => {
  const { origin, browser } = await startSite(t);
  const page = await transport(t, browser, origin, { requestVersion: 2, responseVersion: 2, deferCreation: true });
  await page.waitForFunction(() => window.releaseCreation);
  await page.evaluate(() => { window.barrier = window.channel.close(); window.barrier.then(() => { window.barrierFinished = true; }); });
  assert.equal(await page.evaluate(() => window.barrierFinished === true), false);
  await page.evaluate(() => window.releaseCreation());
  await page.waitForFunction(() => window.outcome && window.barrierFinished);
  assert.equal(await page.evaluate(() => window.outcome), "CANCELLED");
  assert.equal(await page.evaluate(() => window.calls.filter(call => call.path.endsWith("/cancel")).length), 1);
  assert.equal(await page.evaluate(() => window.calls.some(call => call.path === "/connection-requests/fixture-request")), false);
  assert.equal(await page.evaluate(() => window.relayAttempts), 0);
});

test("negotiated v2 popup shows a slow state at 120 seconds without inventing progress", async t => {
  const { origin, browser } = await startSite(t);
  for (const [language, width] of [["he", 390], ["en", 1440]]) await t.test(language, async t => {
    const page = await browser.newPage({ viewport: { width, height: 900 } }); t.after(() => page.close());
    await page.route(origin + "/manager-popup-v2", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body></body></html>` }));
    await page.goto(origin + "/manager-popup-v2");
    await page.clock.install({ time: new Date("2026-10-28T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-28T12:00:01Z"));
    await page.evaluate(async language => { const { createManagerConnectionDialog } = await import("/js/manager-connection-dialog.js"); window.popup = createManagerConnectionDialog({ language }); window.popup.open({ systemName: "Example gate", gate: "123" }); window.popup.setTiming({ timingVersion: 2, softWaitMs: 120000 }); }, language);
    const popup = page.locator(".manager-connection-dialog");
    await page.clock.fastForward(119999);
    assert.equal(await popup.getAttribute("data-extended"), "false");
    await page.clock.runFor(1);
    assert.equal(await popup.getAttribute("data-extended"), "true");
    assert.equal(await popup.getByRole("progressbar").getAttribute("aria-valuenow"), "0");
    assert.match(await popup.innerText(), language === "he" ? /יותר זמן מהרגיל/ : /longer than usual/);
    assert.doesNotMatch(await popup.innerText(), /poll|180|90|60s/);
    if (process.env.CLOUD_MANAGER_SCREENSHOTS) {
      await mkdir(process.env.CLOUD_MANAGER_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: `${process.env.CLOUD_MANAGER_SCREENSHOTS}/manager-v2-slow-${language}-${width}.png`, fullPage: true });
    }
    await page.evaluate(() => window.popup.close());
  });
});
