import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

async function fixture(t, browser, origin, { language = "en", width = 1440 } = {}) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.setDefaultTimeout(6000); t.after(() => page.close());
  await page.route(origin + "/manager-return-fixture", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><div id="root"></div></main></body></html>` }));
  await page.goto(origin + "/manager-return-fixture");
  await page.evaluate(async language => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    const { ManagerExampleConnection } = await import("/js/manager-example-connection.js");
    window.calls = []; window.commands = []; window.connections = []; window.demoConnections = []; window.backgrounded = false;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => window.backgrounded });
    window.setBackground = hidden => { window.backgrounded = hidden; document.dispatchEvent(new Event("visibilitychange")); };
    const originalOpen = ManagerExampleConnection.prototype.open;
    ManagerExampleConnection.prototype.open = async function(gate) {
      window.demoConnections.push(this);
      if (window.pauseExamples) await new Promise((resolve, reject) => { window.releaseExample = resolve; window.rejectExample = () => reject(new Error("NO_COMMUNICATION")); });
      return originalOpen.call(this, gate);
    };
    const system = { id: "return-test", name: "Hadar 6", type: "gate", systemIds: ["synthetic-gate"], orgId: "org-b", version: 1, status: "active" };
    const orgs = [{ id: "org-a", name: "First organization", role: "organization-user" }, { id: "org-b", name: "Harbor Residence", role: "organization-user" }];
    const api = async (path, method = "GET", body) => {
      window.calls.push({ path, method, body });
      if (method !== "GET") throw new Error("Unexpected write in isolated return fixture");
      if (path === "/me") return { role: "user", account: { id: "owner" }, organizations: orgs };
      if (/^\/(?:organizations\/org-[ab]\/)?systems\?/.test(path)) return { items: [system], nextCursor: null };
      if (path.startsWith("/organizations?")) return { items: orgs.map(org => ({ ...org, version: 1, linkedSystemCount: 1, administrators: [], owner: { email: "owner@example.test" } })), nextCursor: null };
      if (/^\/organizations\/org-[ab]$/.test(path)) return { organization: { ...orgs.find(org => path.endsWith(org.id)), version: 1 }, owner: { uid: "owner", email: "owner@example.test" }, counts: { administrators: 1, users: 1, systems: 1 }, permissions: { managePeople: false, manageLogo: false, openWorkspace: true } };
      if (/\/(members|invitations)\?/.test(path)) return { items: [], nextCursor: null };
      throw new Error("Unexpected return fixture request: " + path);
    };
    class Connection {
      constructor({ onState }) { this.onState = onState; window.connections.push(this); }
      open() { this.onState("waiting"); return new Promise((resolve, reject) => {
        this.finish = () => { this.session = {}; this.onState("active"); resolve(); };
        this.fail = () => reject(new Error("NO_COMMUNICATION"));
      }); }
      close() { this.closed = true; this.session = null; return Promise.resolve(); }
      async command(command) { window.commands.push(command); return { data: { systemId: "synthetic-gate", users: 1, admins: 1, state: "OK" } }; }
    }
    window.dashboard = createManagerDashboard({ root: document.querySelector("#root"), user: { uid: "owner" }, language, api, Connection });
    await window.dashboard.ready;
  }, language);
  return page;
}

async function selectOrigin(page, scope) {
  if (!scope) return;
  await page.locator(".manager-organization-picker-trigger").click();
  await page.locator('[data-organization-id="org-b"]').click();
  await page.getByRole("heading", { name: "Harbor Residence", exact: true }).waitFor();
}
async function dismiss(page, method, language, state) {
  const popup = page.locator(".manager-connection-dialog");
  if (method === "escape") await page.keyboard.press("Escape");
  else if (method === "x") await popup.getByRole("button", { name: language === "he" ? "סגירה" : "Close", exact: true }).click();
  else await popup.getByRole("button", { name: state === "error" ? language === "he" ? "סגירה וחזרה" : "Close and return" : language === "he" ? "ביטול וחזרה" : "Cancel and return", exact: true }).click();
}
async function assertOrigin(page, scope, language) {
  if (scope) {
    await page.getByRole("heading", { name: "Harbor Residence", exact: true }).waitFor();
    assert.equal(await page.locator(".manager-organization-picker-trigger").getAttribute("title"), "Harbor Residence");
  } else await page.getByRole("heading", { name: language === "he" ? "המערכות שלי" : "My systems", exact: true }).waitFor();
  await page.waitForFunction(() => document.querySelector(".manager-view")?.getAttribute("aria-busy") === "false");
  assert.equal(await page.locator(".manager-connection-dialog,.manager-workspace-head,#manager-content,#manager-tabs,.manager-connection-recovery").count(), 0, "origin is restored without an intermediate system-details screen");
  assert.equal(await page.locator(".manager-status").innerText(), "");
  const inventory = await page.evaluate(() => window.calls.filter(call => /\/systems\?/.test(call.path)).at(-1)?.path);
  assert.match(inventory, scope ? /^\/organizations\/org-b\/systems\?/ : /^\/systems\?/);
}

test("pending cancellation and failure dismissal return directly to the captured personal or selected organization origin", async t => {
  const { origin, browser } = await startSite(t);
  for (const scope of [null, "org-b"]) for (const state of ["pending", "error"]) for (const method of ["footer", "x", "escape"]) await t.test(`${scope || "personal"} ${state} ${method}`, async t => {
    const language = scope ? "he" : "en";
    const page = await fixture(t, browser, origin, { language, width: scope ? 390 : 1440 });
    await selectOrigin(page, scope);
    await page.getByRole("button", { name: language === "he" ? "פתיחת סביבת ניהול" : "Open workspace", exact: true }).click();
    await page.waitForFunction(() => typeof window.connections[0]?.finish === "function");
    if (state === "error") { await page.evaluate(() => window.connections[0].fail()); await page.locator('.manager-connection-dialog[data-state="error"]').waitFor(); }
    await dismiss(page, method, language, state);
    await assertOrigin(page, scope, language);
    assert.equal(await page.evaluate(() => window.connections.length), 1);
    assert.equal(await page.evaluate(() => window.connections[0].closed), true);
    await page.evaluate(state => {
      // Pending cancellation may still receive its successful open result.
      // An already rejected promise cannot subsequently resolve; only late
      // state notifications remain possible after an error dismissal.
      if (state === "pending") window.connections[0].finish();
      else window.connections[0].onState("active");
      window.connections[0].onState("DISCONNECTED");
    }, state);
    await page.waitForTimeout(10);
    await assertOrigin(page, scope, language);
    assert.equal(await page.evaluate(() => window.connections[0].session), null, "a late successful open is disposed");
    assert.equal(await page.evaluate(() => window.connections.length), 1, "dismissal never starts a replacement connection");
    assert.deepEqual(await page.evaluate(() => window.commands), [], "returning and late callbacks never send a gate action or load an old workspace");
    if (process.env.MANAGER_RETURN_SCREENSHOTS && method === "footer" && state === "error") {
      await mkdir(process.env.MANAGER_RETURN_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: `${process.env.MANAGER_RETURN_SCREENSHOTS}/return-${scope || "personal"}-${language}.png`, fullPage: true });
    }
  });
});

test("explicit retry preserves the organization origin and a background error returns there without another connection", async t => {
  const { origin, browser } = await startSite(t);
  const page = await fixture(t, browser, origin);
  await selectOrigin(page, "org-b");
  await page.getByRole("button", { name: "Open workspace", exact: true }).click();
  await page.waitForFunction(() => window.connections[0]?.fail);
  await page.evaluate(() => window.connections[0].fail());
  await page.getByRole("button", { name: "Try connecting again", exact: true }).click();
  await page.waitForFunction(() => window.connections.length === 2);
  assert.equal(await page.locator(".manager-workspace-head").count(), 1, "retry stays in the connection workflow");
  await page.evaluate(() => window.setBackground(true));
  assert.equal(await page.locator(".manager-connection-dialog").count(), 0);
  await page.evaluate(() => window.setBackground(false));
  await page.locator('.manager-connection-dialog[data-state="error"]').waitFor();
  await dismiss(page, "footer", "en", "error");
  await assertOrigin(page, "org-b", "en");
  await page.evaluate(() => window.connections[1].finish());
  await page.waitForFunction(() => window.connections[1].session === null);
  await assertOrigin(page, "org-b", "en");
  assert.equal(await page.evaluate(() => window.connections.length), 2);
  assert.deepEqual(await page.evaluate(() => window.commands), []);
});

test("successful completion timer and footer, X or Escape keep the active workspace", async t => {
  const { origin, browser } = await startSite(t);
  for (const method of ["timer", "footer", "x", "escape"]) await t.test(method, async t => {
    const page = await fixture(t, browser, origin);
    await page.clock.install();
    await page.getByRole("button", { name: "Open workspace", exact: true }).click();
    await page.waitForFunction(() => typeof window.connections[0]?.finish === "function");
    await page.evaluate(() => window.connections[0].finish());
    await page.locator('.manager-connection-dialog[data-state="complete"]').waitFor();
    if (method === "timer") await page.clock.fastForward(500);
    else if (method === "footer") await page.getByRole("button", { name: "Enter workspace", exact: true }).click();
    else await dismiss(page, method, "en", "complete");
    await page.locator(".manager-connection-dialog").waitFor({ state: "detached" });
    assert.equal(await page.getByRole("button", { name: "Open gate", exact: true }).count(), 1);
    assert.equal(await page.locator("#manager-tabs button").count(), 10);
    assert.equal(await page.locator(".manager-workspace-head").count(), 1);
    assert.equal(await page.evaluate(() => window.connections[0].closed === true), false);
    assert.deepEqual(await page.evaluate(() => window.commands), ["ADMIN_GET_OVERVIEW"]);
    assert.equal(await page.evaluate(() => window.calls.filter(call => /^\/systems\?/.test(call.path)).length), 1, "success never reloads the inventory origin");
  });
});

test("sample failure and cancellation restore My systems or the second sample organization without real connections", async t => {
  const { origin, browser } = await startSite(t);
  for (const organization of [false, true]) await t.test(organization ? "second sample organization" : "personal samples", async t => {
    const page = await fixture(t, browser, origin);
    let sockets = 0; page.on("websocket", () => sockets++);
    await page.locator(".manager-examples > summary").click();
    await page.locator('[data-example-system="example-manager-group"]').getByRole("button").click();
    await page.locator("#manager-content .manager-facts").waitFor();
    await page.locator(".manager-connection-dialog").waitFor({ state: "detached" });
    if (organization) {
      await page.locator(".manager-system-menu summary").click();
      await page.getByRole("button", { name: "Assign organization", exact: true }).click();
      await page.getByLabel("Organization", { exact: true }).selectOption("example-manager-office");
      await page.getByRole("button", { name: "Save", exact: true }).click();
      await page.locator("#manager-content .manager-facts").waitFor();
      await page.locator(".manager-connection-dialog").waitFor({ state: "detached" });
    }
    await page.getByRole("button", { name: "End and return", exact: true }).click();
    if (organization) {
      await page.locator(".manager-nav").getByRole("button", { name: "My organizations", exact: true }).click();
      await page.locator(".manager-organization-examples > summary").click();
      await page.locator("[data-example-organization]").nth(1).getByRole("button").click();
    } else await page.locator(".manager-examples > summary").click();
    await page.evaluate(() => { window.pauseExamples = true; });
    await page.locator('[data-example-system="example-manager-group"]').getByRole("button").click();
    await page.waitForFunction(() => window.releaseExample);
    if (!organization) { await page.evaluate(() => window.rejectExample()); await page.locator('.manager-connection-dialog[data-state="error"]').waitFor(); }
    await dismiss(page, organization ? "escape" : "footer", "en", organization ? "pending" : "error");
    if (organization) await page.getByRole("heading", { name: "Example WIFIGATE Office", exact: true }).waitFor();
    else await page.getByRole("heading", { name: "My systems", exact: true }).waitFor();
    assert.equal(await page.locator(".manager-workspace-head,#manager-content,.manager-connection-dialog,.manager-connection-recovery").count(), 0);
    if (organization) { await page.evaluate(() => window.releaseExample()); await page.waitForTimeout(10); }
    assert.equal(await page.locator("#manager-content,.manager-connection-dialog").count(), 0);
    assert.equal(await page.evaluate(() => window.connections.length), 0);
    assert.equal(await page.evaluate(() => window.calls.some(call => call.method !== "GET")), false);
    assert.equal(sockets, 0);
  });
});
