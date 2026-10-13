// Account deletion on /dashboard/: the preview, the typed email, a recent
// sign-in retry with the same idempotency key, and the final message. Firebase
// and the API are fixtures; no real account is used.
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = { ".js": "application/javascript", ".css": "text/css", ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp" };

const authModule = `
  let observer; let signedIn = true;
  const user = { uid: "fixture-user", email: "dana.levi@example.test", emailVerified: true,
    getIdToken: async () => "isolated-token",
    getIdTokenResult: async () => ({claims: {firebase: {sign_in_provider: "google.com"}}}) };
  export const getAuth = () => ({}); export const connectAuthEmulator = () => {};
  export const browserSessionPersistence = {}; export const setPersistence = async () => {};
  export const onAuthStateChanged = (_, callback) => { observer = callback; setTimeout(() => callback(signedIn ? user : null), 0); return () => {}; };
  export const GoogleAuthProvider = function () { this.setCustomParameters = () => {}; };
  export const OAuthProvider = function () { this.addScope = () => {}; };
  export const signInWithPopup = async () => ({ user }); export const getRedirectResult = async () => null;
  export const signInWithRedirect = async () => {};
  export const signOut = async () => { signedIn = false; await window.authFixtureEvent("signout"); observer?.(null); };
  export const reauthenticateWithPopup = async () => { await window.authFixtureEvent("reauth"); return { user }; };
  export const getMultiFactorResolver = () => ({ hints: [] });
  export const multiFactor = () => ({}); export const TotpMultiFactorGenerator = {};
`;

async function scenario(browser, origin, options = {}) {
  const context = await browser.newContext({ viewport: options.viewport ?? { width: 1440, height: 950 } });
  const events = [];
  const calls = [];
  const errors = [];
  await context.exposeBinding("authFixtureEvent", (_, event) => events.push(event));
  await context.route("https://www.gstatic.com/firebasejs/**/firebase-app.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: "export const initializeApp = value => value;" }));
  await context.route("https://www.gstatic.com/firebasejs/**/firebase-auth.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: authModule }));
  await context.route("**/api/v1/**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    calls.push({ method: request.method(), path: url.pathname, body: request.postDataJSON(), key: request.headers()["idempotency-key"] });
    if (url.pathname === "/api/v1/platform/me")
      return route.fulfill({ json: {
        user: { uid: "fixture-user", email: "dana.levi@example.test", displayName: "Dana Levi", emailVerified: true },
        mfa: { enrolled: false, verified: false },
        products: { host: { state: "active" }, pay: { state: options.pay ?? "no-plan" }, manager: { state: "pending" } },
      } });
    if (url.pathname === "/api/v1/platform/account/deletion")
      return options.admin
        ? route.fulfill({ status: 403, json: { error: { code: "PLATFORM_ADMIN_DELETION_FORBIDDEN" } } })
        : route.fulfill({ json: { allowed: true, subscriptions: [{ organization: "Sea View Hotel", product: "host" }], closingOrganizations: [{ organization: "Sea View Hotel", otherMembers: 2 }], memberships: 1 } });
    if (url.pathname === "/api/v1/platform/account/delete") {
      if (calls.filter((call) => call.path === url.pathname).length === 1)
        return route.fulfill({ status: 403, json: { error: { code: "RECENT_REAUTH_REQUIRED" } } });
      return route.fulfill({ json: { deleted: true, cancelledSubscriptions: [{ organization: "Sea View Hotel", product: "host" }], archivedOrganizations: ["Sea View Hotel"], removedMemberships: 1 } });
    }
    return route.fulfill({ status: 404, json: { error: { code: "NOT_FOUND" } } });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}${options.path ?? "/dashboard/"}`);
  return { context, page, events, calls, errors };
}

test("account deletion from the dashboard", async (t) => {
  const server = createServer(async (request, response) => {
    try {
      let file = path.resolve(root, "." + new URL(request.url, "http://localhost").pathname);
      if (!file.startsWith(root)) return response.writeHead(403).end();
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      response.setHeader("Content-Type", types[path.extname(file)] ?? "application/octet-stream");
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const browser = await chromium.launch({ channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome", headless: true });
  t.after(() => browser.close());
  const origin = `http://127.0.0.1:${server.address().port}`;

  await t.test("preview, typed email, re-authentication with the same key, final message", async () => {
    const { context, page, events, calls, errors } = await scenario(browser, origin);
    await page.locator("#platform-account-panel").waitFor({ state: "visible" });
    assert.equal(await page.textContent("#account-name"), "Dana Levi");
    assert.equal(await page.textContent("#account-email"), "dana.levi@example.test");
    assert.equal(await page.textContent("#platform-avatar"), "D");

    await page.click("#delete-account");
    await page.locator("#account-delete .account-delete__group").first().waitFor();
    const plan = await page.locator("#account-delete .account-delete__group li").allTextContents();
    assert.deepEqual(plan, ["Sea View Hotel · WIFIGATE Host", "Sea View Hotel · 2 other members lose access"]);
    assert.equal(await page.isEnabled("#account-delete .account-delete__confirm"), true);

    await page.fill("#account-delete input[name=confirmEmail]", "someone@example.test");
    await page.click("#account-delete .account-delete__confirm");
    assert.equal(await page.textContent("#account-delete [role=status]"), "Type the email of this account exactly.");
    assert.equal(calls.filter((call) => call.method === "POST").length, 0);

    await page.fill("#account-delete input[name=confirmEmail]", " Dana.Levi@Example.test ");
    await page.click("#account-delete .account-delete__confirm");
    await page.locator("#account-deleted").waitFor({ state: "visible" });

    const posts = calls.filter((call) => call.method === "POST");
    assert.equal(posts.length, 2);
    assert.deepEqual(posts.map((call) => call.body), [{ confirmEmail: "dana.levi@example.test" }, { confirmEmail: "dana.levi@example.test" }]);
    assert.ok(posts[0].key && posts[0].key === posts[1].key);
    assert.ok(events.includes("reauth"));

    assert.equal(await page.textContent("#account-deleted h1"), "Your account was deleted");
    assert.match(await page.textContent("#account-deleted p"), /All your subscriptions were cancelled automatically, and your user was removed from WIFIGATE systems\./);
    assert.deepEqual(await page.locator("#account-deleted-list li").allTextContents(), ["Sea View Hotel · WIFIGATE Host"]);
    assert.equal(await page.isVisible(".platform-heading"), false);
    assert.equal(await page.isVisible("#product-grid"), false);
    await page.waitForTimeout(300);
    assert.ok(events.includes("signout"));
    assert.match(page.url(), /\/dashboard\/$/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  await t.test("a WIFIGATE administrator sees why the account cannot be deleted", async () => {
    const { context, page } = await scenario(browser, origin, { admin: true });
    await page.locator("#platform-account-panel").waitFor({ state: "visible" });
    await page.click("#delete-account");
    await page.locator("#account-delete [role=status][data-tone=error]").waitFor();
    assert.equal(await page.textContent("#account-delete [role=status]"), "A WIFIGATE administrator account is removed by another administrator.");
    assert.equal(await page.isEnabled("#account-delete .account-delete__confirm"), false);
    await page.click("#account-delete [data-cancel]");
    assert.equal(await page.isVisible("#account-delete"), false);
    await context.close();
  });

  await t.test("Hebrew at 320px: the dialog fits and the final message is Hebrew", async () => {
    const { context, page, errors } = await scenario(browser, origin, { path: "/dashboard/?lang=he", viewport: { width: 320, height: 720 } });
    await page.locator("#platform-account-panel").waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.click("#delete-account");
    await page.locator("#account-delete .account-delete__group").first().waitFor();
    const box = await page.locator("#account-delete").boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 320);
    await page.fill("#account-delete input[name=confirmEmail]", "dana.levi@example.test");
    await page.click("#account-delete .account-delete__confirm");
    await page.locator("#account-deleted").waitFor({ state: "visible" });
    assert.equal(await page.textContent("#account-deleted h1"), "החשבון שלך נמחק");
    assert.equal(await page.getAttribute("#account-deleted-home", "href"), "/he/");
    assert.deepEqual(errors, []);
    await context.close();
  });

  await t.test("the Pay page shares the header without the account panel", async () => {
    const { context, page, errors } = await scenario(browser, origin, { path: "/dashboard/pay/", pay: "active" });
    await page.locator("#product-workspace").waitFor({ state: "visible" });
    assert.equal(await page.textContent("#platform-avatar"), "D");
    assert.equal(await page.locator("#platform-account-panel").count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
