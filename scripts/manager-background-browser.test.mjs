import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

async function workspace(t, browser, origin, options = {}) {
  const page = await browser.newPage(); page.setDefaultTimeout(6000); t.after(() => page.close());
  await page.route(origin + "/manager-background-fixture", route => route.fulfill({ contentType: "text/html", body: '<!doctype html><html><head><title>WIFIGATE Manager</title><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body><div id="root"></div></body></html>' }));
  await page.goto(origin + "/manager-background-fixture");
  await page.evaluate(async options => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    const { ManagerConnection } = await import("/js/manager-connection.js");
    window.calls = []; window.connections = []; window.commands = []; window.relayAttempts = 0; window.backgrounded = false;
    window.notices = []; window.permissionRequests = 0;
    window.Notification = class {
      static permission = options.notificationPermission ?? "default";
      static async requestPermission() { window.permissionRequests++; this.permission = "granted"; return "granted"; }
      constructor(title, options) { this.title = title; this.options = options; window.notices.push(this); }
      close() { this.closed = true; }
    };
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
      async open() { return new Promise((resolve, reject) => {
        window.releaseOpen = () => { this.session = {}; this.onState("active"); resolve({}); };
        window.rejectOpen = () => reject(new Error("NO_COMMUNICATION"));
      }); }
      close() { this.closed = true; this.session = null; return Promise.resolve(); }
      async command(cmd) { window.commands.push(cmd); return { data: { systemId: "123" } }; }
    }
    class RealConnection extends ManagerConnection {
      constructor(value) { super({ ...value, WebSocketImpl: class { constructor() { window.relayAttempts++; throw new Error("UNEXPECTED_RELAY"); } } }); window.connections.push(this); }
    }
    window.manager = createManagerDashboard({ root: document.querySelector("#root"), user: { uid: "owner" }, language: options.language ?? "en", api, Connection: options.realTransport ? RealConnection : Connection,
      ensureRecent: options.deferIdentity ? () => new Promise(resolve => { window.releaseIdentity = resolve; }) : async () => {},
    });
    await window.manager.ready;
  }, options);
  return page;
}

test("Manager continues connecting in another tab and reports success without another attempt", async t => {
  const { origin, browser } = await startSite(t);
  const page = await workspace(t, browser, origin, { notificationPermission: "granted" });
  await page.getByRole("button", { name: "Open workspace", exact: true }).click();
  await page.waitForFunction(() => window.releaseOpen);
  assert.equal(await page.evaluate(() => window.connections[0].timingVersion), 2, "the dashboard uses the advertised version");
  await page.evaluate(() => window.setBackground(true));
  assert.equal(await page.locator('.manager-connection-dialog[data-state="pending"]').count(), 1);
  assert.equal(await page.evaluate(() => window.connections[0].closed === true), false);
  assert.match(await page.title(), /Connecting/);
  await page.evaluate(() => window.releaseOpen());
  await page.waitForFunction(() => document.querySelector('[data-workspace-ready="true"]'));
  assert.match(await page.title(), /Connection ready/);
  assert.equal(await page.evaluate(() => window.notices.length), 1);
  assert.equal(await page.evaluate(() => window.notices[0].title), "Connection ready");
  assert.equal(await page.evaluate(() => window.permissionRequests), 0);
  assert.deepEqual(await page.evaluate(() => window.commands), ["ADMIN_GET_OVERVIEW"]);
  await page.evaluate(() => window.setBackground(false));
  assert.equal(await page.locator('.manager-connection-dialog[data-state="error"]').count(), 0);
  assert.equal(await page.title(), "WIFIGATE Manager");
  assert.equal(await page.evaluate(() => window.notices[0].closed), true);
  assert.equal(await page.evaluate(() => window.connections[0].closed === true), false);
  assert.equal(await page.evaluate(() => window.connections.length), 1, "returning to the foreground never starts a new request");
  await page.evaluate(() => window.manager.close());
});

test("notification permission is requested only by the user and a background failure is reported in Hebrew", async t => {
  const { origin, browser } = await startSite(t);
  const page = await workspace(t, browser, origin, { language: "he" });
  await page.getByRole("button", { name: "פתיחת סביבת ניהול", exact: true }).click();
  await page.waitForFunction(() => window.rejectOpen);
  assert.equal(await page.evaluate(() => window.permissionRequests), 0);
  await page.getByRole("button", { name: "קבלו התראת מערכת", exact: true }).click();
  assert.equal(await page.evaluate(() => window.permissionRequests), 1);
  await page.evaluate(() => { window.setBackground(true); window.rejectOpen(); });
  await page.locator('.manager-connection-dialog[data-state="error"]').waitFor();
  assert.match(await page.title(), /החיבור נכשל/);
  assert.equal(await page.evaluate(() => window.notices[0].title), "החיבור נכשל");
  assert.deepEqual(await page.evaluate(() => window.commands), []);
  await page.evaluate(() => window.setBackground(false));
  assert.equal(await page.title(), "WIFIGATE Manager");
  assert.equal(await page.evaluate(() => window.connections.length), 1);
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
  await page.getByRole("button", { name: "Close and return", exact: true }).click();
  await page.getByRole("heading", { name: "My systems", exact: true }).waitFor();
  assert.equal(await page.locator(".manager-workspace-head,#manager-content,.manager-connection-recovery").count(), 0);
  assert.equal(await page.evaluate(() => window.connections.length), 0, "dismissing a background failure never creates a connection");
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
  assert.equal(await page.locator(".manager-workspace-head,.manager-connection-recovery").count(), 0);
  assert.equal(await page.locator(".manager-connection-dialog").count(), 0);
  await page.evaluate(() => window.manager.close());
});
