import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

async function workspace(t, browser, origin, options = {}) {
  const page = await browser.newPage(); page.setDefaultTimeout(6000); t.after(() => page.close());
  await page.route(origin + "/manager-background-fixture", route => route.fulfill({ contentType: "text/html", body: '<!doctype html><html><body><div id="root"></div></body></html>' }));
  await page.goto(origin + "/manager-background-fixture");
  await page.evaluate(async options => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    const { ManagerConnection } = await import("/js/manager-connection.js");
    window.calls = []; window.connections = []; window.commands = []; window.relayAttempts = 0; window.backgrounded = false;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => window.backgrounded });
    window.setBackground = hidden => { window.backgrounded = hidden; document.dispatchEvent(new Event("visibilitychange")); };
    const system = { id: "fixture-system", type: "gate", name: "Fixture gate", systemIds: ["123"], version: 1, status: "active" };
    const api = async (path, method = "GET", body) => {
      window.calls.push({ path, method, body });
      if (path === "/me") return { role: "user", account: { id: "owner" }, organizations: [], timingPolicy: { supportedVersions: [1, 2], preferredVersion: 2 } };
      if (path.startsWith("/systems?")) return { items: [system], nextCursor: null };
      if (path.endsWith("/identity")) return { systemId: "123", keyId: "key", devicePublicKey: "04" + "1".repeat(128) };
      if (path === "/connection-requests") return new Promise(resolve => { window.releaseCreation = () => resolve({ requestId: "late-created-request", timingVersion: 2, demandLifetimeMs: 180000, softWaitMs: 120000, pollIntervalMs: 90000, expiresAt: new Date(Date.now() + 180000).toISOString() }); });
      if (path.endsWith("/cancel")) return { cancelled: true };
      throw new Error("Unexpected API request: " + path);
    };
    class Connection {
      constructor({ onState, timingVersion, onTiming }) { this.onState = onState; this.timingVersion = timingVersion; this.onTiming = onTiming; window.connections.push(this); }
      async open() { return new Promise(resolve => { window.releaseOpen = () => { this.session = {}; this.onState("active"); resolve({}); }; }); }
      close() { this.closed = true; this.session = null; return Promise.resolve(); }
      async command(cmd) { window.commands.push(cmd); return { data: { systemId: "123" } }; }
    }
    class RealConnection extends ManagerConnection {
      constructor(value) { super({ ...value, WebSocketImpl: class { constructor() { window.relayAttempts++; throw new Error("UNEXPECTED_RELAY"); } } }); window.connections.push(this); }
    }
    window.manager = createManagerDashboard({ root: document.querySelector("#root"), user: { uid: "owner" }, api, Connection: options.realTransport ? RealConnection : Connection,
      ensureRecent: options.deferIdentity ? () => new Promise(resolve => { window.releaseIdentity = resolve; }) : async () => {},
    });
    await window.manager.ready;
  }, options);
  return page;
}

test("Manager backgrounding closes pending work and a late session cannot create a workspace or auto-retry", async t => {
  const { origin, browser } = await startSite(t);
  const page = await workspace(t, browser, origin);
  await page.getByRole("button", { name: "Open workspace", exact: true }).click();
  await page.waitForFunction(() => window.releaseOpen);
  assert.equal(await page.evaluate(() => window.connections[0].timingVersion), 2, "the dashboard uses the advertised version");
  await page.evaluate(() => window.setBackground(true));
  assert.equal(await page.locator(".manager-connection-dialog").count(), 0);
  await page.evaluate(() => window.releaseOpen());
  await page.waitForFunction(() => window.connections[0].session === null);
  assert.equal(await page.locator("#manager-tabs button").count(), 0);
  assert.deepEqual(await page.evaluate(() => window.commands), []);
  await page.evaluate(() => window.setBackground(false));
  const popup = page.locator('.manager-connection-dialog[data-state="error"]'); await popup.waitFor();
  assert.match(await popup.innerText(), /Connection paused when you left the page/);
  assert.equal(await page.locator(".manager-status").innerText(), "");
  assert.equal(await page.locator(".manager-connection-recovery h3,.manager-connection-recovery p").count(), 0);
  assert.equal(await page.evaluate(() => window.connections.length), 1, "returning to the foreground never starts a new request");
  await popup.getByRole("button", { name: "Try connecting again", exact: true }).click();
  await page.waitForFunction(() => window.connections.length === 2);
  await page.evaluate(() => window.manager.close());
});

test("pagehide during identity verification fences the later callback before a connection is constructed", async t => {
  const { origin, browser } = await startSite(t);
  const page = await workspace(t, browser, origin, { deferIdentity: true });
  await page.getByRole("button", { name: "Open workspace", exact: true }).click();
  await page.waitForFunction(() => window.releaseIdentity);
  await page.evaluate(() => { window.dispatchEvent(new Event("pagehide")); window.releaseIdentity(); });
  assert.equal(await page.evaluate(() => window.connections.length), 0);
  assert.equal(await page.locator("#manager-tabs button").count(), 0);
  await page.evaluate(() => window.dispatchEvent(new Event("pageshow")));
  await page.locator('.manager-connection-dialog[data-state="error"]').waitFor();
  assert.equal(await page.evaluate(() => window.connections.length), 0);
  await page.evaluate(() => window.manager.close());
});

test("the dashboard preserves a late demand creation receipt solely to cancel it after leaving the workspace", async t => {
  const { origin, browser } = await startSite(t);
  const page = await workspace(t, browser, origin, { realTransport: true });
  await page.getByRole("button", { name: "Open workspace", exact: true }).click();
  await page.waitForFunction(() => window.releaseCreation);
  assert.equal(await page.evaluate(() => window.calls.find(call => call.path === "/connection-requests").body.timingVersion), 2);
  await page.getByRole("button", { name: "Cancel and return", exact: true }).click();
  await page.getByRole("button", { name: "Open workspace", exact: true }).waitFor();
  await page.evaluate(() => window.releaseCreation());
  await page.waitForFunction(() => window.calls.some(call => call.path.endsWith("/cancel")));
  assert.equal(await page.evaluate(() => window.calls.filter(call => call.path.endsWith("/cancel")).length), 1);
  assert.equal(await page.evaluate(() => window.relayAttempts), 0);
  assert.equal(await page.locator("#manager-content").count(), 0);
  assert.equal(await page.locator(".manager-connection-dialog").count(), 0);
  await page.evaluate(() => window.manager.close());
});
