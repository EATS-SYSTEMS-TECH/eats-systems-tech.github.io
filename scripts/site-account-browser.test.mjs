// The shared header's signed-in account (js/site-account.js) in a real browser.
// Firebase Auth is a stub served in place of the gstatic SDK: no network sign-in
// and no real account. Run after the site build:
//   node --test scripts/site-account-browser.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright-core";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const SESSION_KEY = "firebase:authUser:AIzaSyBnq0H2dk5MyEp0IWCmp83zqoLjnCWAiB0:[DEFAULT]";
const PHOTO_URL = "https://lh3.googleusercontent.com/a/fixture-photo";
const consent = JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() });
const fixtureUser = { uid: "fixture-user", displayName: "Dana Levi", email: "dana.levi@example.test", photoURL: null };

const copies = Object.fromEntries(
  await Promise.all(
    SITE_LANGUAGES.map(async ({ code }) => {
      const file = pathToFileURL(path.join(root, "scripts", "homepage-copy", `${code}.mjs`)).href;
      return [code, (await import(file)).default.navigation.account];
    }),
  ),
);
const pagePath = (code, page = "") => `${code === "en" ? "" : `/${code.toLowerCase()}`}/${page}`;

// The stub reads the stored session like Firebase does. `live` is what the
// server answers when the SDK reloads the account: the account, or null for a
// session that ended.
function authStub(live) {
  return `
    const KEY = ${JSON.stringify(SESSION_KEY)};
    const observers = [];
    export const getAuth = () => ({});
    export const connectAuthEmulator = () => {};
    export const browserLocalPersistence = {};
    export const setPersistence = async () => {};
    export const GoogleAuthProvider = function () {};
    export const OAuthProvider = function () {};
    export const onAuthStateChanged = (_, callback) => {
      observers.push(callback);
      setTimeout(() => {
        const stored = localStorage.getItem(KEY) || sessionStorage.getItem(KEY);
        const live = ${JSON.stringify(live)};
        if (stored && !live) { localStorage.removeItem(KEY); sessionStorage.removeItem(KEY); }
        callback(stored && live ? live : null);
      }, 0);
      return () => {};
    };
    export const signOut = async () => {
      await window.authFixtureEvent("signout");
      localStorage.removeItem(KEY); sessionStorage.removeItem(KEY);
      observers.forEach((callback) => callback(null));
    };
  `;
}

async function scenario(browser, origin, options = {}) {
  const { width = 1280, height = 800, signedIn = true, live = { ...fixtureUser, photoURL: PHOTO_URL }, firebase = true } = options;
  const context = await browser.newContext({ viewport: { width, height } });
  const events = [];
  const requests = [];
  await context.exposeBinding("authFixtureEvent", (_, event) => events.push(event));
  await context.addInitScript(
    ({ consentValue, key, user, storageName }) => {
      localStorage.setItem("wifigate-cookie-consent-v1", consentValue);
      // Only the first document of the tab starts with a session, the way a
      // sign-in leaves it; later loads keep what the page did.
      const storage = window[storageName];
      if (user && !storage.getItem("fixture-started")) {
        storage.setItem("fixture-started", "1");
        storage.setItem(key, JSON.stringify(user));
      }
    },
    { consentValue: consent, key: SESSION_KEY, user: signedIn ? fixtureUser : null, storageName: options.storageName ?? "sessionStorage" },
  );
  await context.route("https://www.gstatic.com/firebasejs/**", (route) => {
    if (!firebase) return route.abort();
    const url = route.request().url();
    return route.fulfill({
      contentType: "application/javascript",
      body: url.endsWith("firebase-app.js") ? "export const initializeApp = (value) => value;" : authStub(live),
    });
  });
  // The dashboard behind the menu entry stays offline.
  await context.route("https://api.wifigate.io/**", (route) => route.abort());
  await context.route(`${PHOTO_URL}**`, (route) =>
    route.fulfill({ contentType: "image/png", body: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64",
    ) }),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => requests.push(request.url()));
  return { context, page, events, requests, errors, origin };
}

async function signedInHeader(page) {
  await page.locator(".site-header--account .site-account__button").waitFor();
}

const box = (locator) => locator.evaluate((element) => {
  const rect = element.getBoundingClientRect();
  return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
});
const overlaps = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;

test("signed-in account in the shared header", async (t) => {
  const server = createServer(async (request, response) => {
    try {
      let file = path.resolve(root, "." + decodeURIComponent(new URL(request.url, "http://localhost").pathname));
      if (file !== path.resolve(root) && !file.startsWith(root)) return response.writeHead(403).end();
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const type = { ".js": "application/javascript", ".css": "text/css", ".html": "text/html; charset=utf-8", ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png" }[path.extname(file)];
      response.setHeader("Content-Type", type ?? "application/octet-stream");
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

  await t.test("a visitor without a session keeps the Log in header and loads no Firebase code", async () => {
    for (const [code, width] of [["en", 1280], ["he", 1280], ["en", 390], ["he", 390]]) {
      const fixture = await scenario(browser, origin, { signedIn: false, width, height: 844 });
      const { page } = fixture;
      await page.goto(origin + pagePath(code), { waitUntil: "domcontentloaded" });
      const before = await box(page.locator(".site-login__trigger"));
      await page.waitForLoadState("load");
      await page.waitForTimeout(400);
      const after = await box(page.locator(".site-login__trigger"));
      assert.deepEqual(after, before, `${code} ${width}: the header does not move`);
      assert.equal(await page.locator(".site-login__trigger").isVisible(), true, `${code} ${width}: Log in shows`);
      assert.equal(await page.locator(".site-account").isVisible(), false, `${code} ${width}: no account control`);
      assert.equal(await page.locator(".site-header").getAttribute("class"), "site-header");
      assert.deepEqual(fixture.requests.filter((url) => /site-auth\.js|gstatic\.com\/firebasejs/.test(url)), [], `${code} ${width}: no auth code`);
      assert.deepEqual(fixture.errors, []);
      await fixture.context.close();
    }
  });

  await t.test("the account shows at once, then Firebase confirms it with the provider photo", async () => {
    const fixture = await scenario(browser, origin);
    const { page } = fixture;
    await page.goto(origin + "/", { waitUntil: "domcontentloaded" });
    // Before any Firebase code: the stored session alone swaps Log in for the account.
    assert.equal(await page.locator(".site-login__trigger").isVisible(), false);
    await signedInHeader(page);
    const button = page.locator("#account-button");
    assert.equal(await button.getAttribute("aria-label"), `${copies.en.menu}, Dana Levi`);
    assert.equal(await button.getAttribute("aria-haspopup"), "menu");
    assert.equal(await button.getAttribute("aria-expanded"), "false");
    await page.locator(".site-account__avatar img").waitFor();
    assert.equal(await page.locator(".site-account__avatar img").getAttribute("src"), PHOTO_URL);
    assert.equal(await page.locator(".site-account__avatar img").getAttribute("referrerpolicy"), "no-referrer");
    const size = await box(button);
    assert.ok(size.width >= 44 && size.height >= 44, "44px touch target");
    assert.ok(fixture.requests.some((url) => new URL(url).pathname.endsWith("/js/site-auth.js")), "Firebase loads for a signed-in visitor");
    assert.deepEqual(fixture.errors, []);
    await fixture.context.close();
  });

  await t.test("a persistent account survives reopening a tab and sign-out clears it", async () => {
    const fixture = await scenario(browser, origin, { storageName: "localStorage", firebase: false });
    await fixture.page.goto(origin + "/");
    await signedInHeader(fixture.page);
    await fixture.page.close();
    const page = await fixture.context.newPage();
    await page.goto(origin + "/he/");
    await signedInHeader(page);
    await page.locator("#account-button").click();
    await page.locator("[data-account-sign-out]").click();
    await page.locator(".site-login__trigger").waitFor({state: "visible"});
    assert.equal(await page.evaluate(key => localStorage.getItem(key), SESSION_KEY), null);
    const another = await fixture.context.newPage();
    await another.goto(origin + "/");
    assert.equal(await another.locator(".site-login__trigger").isVisible(), true);
    await fixture.context.close();
  });

  await t.test("a stored session without a photo shows the initial", async () => {
    const fixture = await scenario(browser, origin, { firebase: false });
    const { page } = fixture;
    await page.goto(origin + "/he/");
    await signedInHeader(page);
    assert.equal(await page.locator(".site-account__avatar").innerText(), "D");
    assert.equal(await page.locator("#account-button").getAttribute("aria-label"), `${copies.he.menu}, Dana Levi`);
    await fixture.context.close();
  });

  await t.test("keyboard: Enter, arrows, Escape and Tab follow the menu button pattern", async () => {
    const fixture = await scenario(browser, origin);
    const { page } = fixture;
    await page.goto(origin + "/");
    await signedInHeader(page);
    const button = page.locator("#account-button");
    const panel = page.locator(".site-account__panel");
    const focused = () => page.evaluate(() => document.activeElement?.id || document.activeElement?.textContent.trim());
    await button.focus();
    await page.keyboard.press("Enter");
    assert.equal(await button.getAttribute("aria-expanded"), "true");
    assert.equal(await panel.isVisible(), true);
    assert.equal(await focused(), copies.en.dashboard);
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle),
      "solid",
      "visible focus ring",
    );
    await page.keyboard.press("ArrowDown");
    assert.equal(await focused(), copies.en.signOut);
    await page.keyboard.press("ArrowDown");
    assert.equal(await focused(), copies.en.dashboard, "arrows wrap");
    await page.keyboard.press("End");
    assert.equal(await focused(), copies.en.signOut);
    await page.keyboard.press("Escape");
    assert.equal(await panel.isVisible(), false);
    assert.equal(await button.getAttribute("aria-expanded"), "false");
    assert.equal(await focused(), "account-button", "focus returns to the button");
    await page.keyboard.press(" ");
    assert.equal(await panel.isVisible(), true, "Space opens");
    await page.keyboard.press("Escape");
    await page.keyboard.press("ArrowUp");
    assert.equal(await focused(), copies.en.signOut, "ArrowUp opens on the last item");
    await page.keyboard.press("Tab");
    assert.equal(await panel.isVisible(), false, "Tab leaves and closes the menu");
    await button.click();
    assert.equal(await panel.isVisible(), true);
    await page.mouse.click(20, 400);
    assert.equal(await panel.isVisible(), false, "a click outside closes the menu");
    await button.click();
    await page.locator("#language-button").click();
    assert.equal(await panel.isVisible(), false, "the language selector closes the menu");
    await fixture.context.close();
  });

  await t.test("the dashboard entry opens the product picker in the page language", async () => {
    for (const code of ["en", "he", "ar"]) {
      const fixture = await scenario(browser, origin);
      const { page } = fixture;
      await page.goto(origin + pagePath(code));
      await signedInHeader(page);
      const link = page.locator("[data-account-dashboard]");
      assert.equal(await link.getAttribute("href"), code === "he" ? "/dashboard/?lang=he" : "/dashboard/");
      await page.locator("#account-button").click();
      await link.click();
      await page.waitForURL((url) => url.pathname === "/dashboard/");
      await fixture.context.close();
    }
  });

  await t.test("Sign out calls Firebase and shows Log in without a reload", async () => {
    for (const code of ["en", "he"]) {
      const fixture = await scenario(browser, origin);
      const { page } = fixture;
      await page.goto(origin + pagePath(code));
      await signedInHeader(page);
      await page.evaluate(() => {
        window.fixtureSameDocument = true;
      });
      await page.locator("#account-button").click();
      await page.getByRole("menuitem", { name: copies[code].signOut }).click();
      await page.locator(".site-login__trigger").waitFor({ state: "visible" });
      assert.deepEqual(fixture.events, ["signout"]);
      assert.equal(await page.locator(".site-account").isVisible(), false);
      assert.equal(await page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY), null);
      assert.equal(await page.evaluate(() => window.fixtureSameDocument), true, "no reload");
      assert.equal(await page.evaluate(() => document.activeElement?.className), "site-login__trigger", "focus lands on Log in");
      await page.reload();
      assert.equal(await page.locator(".site-login__trigger").isVisible(), true, "the next page is signed out");
      await fixture.context.close();
    }
  });

  await t.test("Sign out still ends the session when Firebase cannot load", async () => {
    const fixture = await scenario(browser, origin, { firebase: false });
    const { page } = fixture;
    await page.goto(origin + "/");
    await signedInHeader(page);
    await page.locator("#account-button").click();
    await page.getByRole("menuitem", { name: copies.en.signOut }).click();
    await page.locator(".site-login__trigger").waitFor({ state: "visible" });
    assert.equal(await page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY), null);
    await fixture.context.close();
  });

  await t.test("a session that ended shows the signed-out header", async () => {
    const fixture = await scenario(browser, origin, { live: null });
    const { page } = fixture;
    await page.goto(origin + "/he/");
    await page.locator(".site-login__trigger").waitFor({ state: "visible" });
    assert.equal(await page.locator(".site-account").isVisible(), false);
    assert.equal(await page.evaluate((key) => sessionStorage.getItem(key), SESSION_KEY), null);
    await fixture.context.close();
  });

  await t.test("every page type with the shared header carries the account", async () => {
    for (const route of ["/hotels-airbnb/", "/wifigate-host/", "/he/wifigate-host/", "/he/cookies/", "/accessibility/"]) {
      const fixture = await scenario(browser, origin, { firebase: false });
      const { page } = fixture;
      await page.goto(origin + route);
      await signedInHeader(page);
      assert.equal(await page.locator(".site-login__trigger").isVisible(), false, route);
      await fixture.context.close();
    }
  });

  await t.test("every language fits at 1280 and 390 (and 320 for the longest), menu open, with no horizontal scroll", async () => {
    const sizes = SITE_LANGUAGES.flatMap(({ code }) =>
      [1280, 390, ...(["en", "he", "ar", "te", "bn", "fil"].includes(code) ? [320] : [])].map((width) => ({ code, width })),
    );
    for (const { code, width } of sizes) {
      const fixture = await scenario(browser, origin, { width, height: 844, firebase: false });
      const { page } = fixture;
      await page.goto(origin + pagePath(code), { waitUntil: "domcontentloaded" });
      await signedInHeader(page);
      const copy = copies[code];
      assert.equal(await page.locator(".site-account__label").innerText(), copy.signedInAs, code);
      assert.equal((await page.locator("[data-account-dashboard]").textContent()).trim(), copy.dashboard, code);
      assert.equal((await page.locator("[data-account-sign-out]").textContent()).trim(), copy.signOut, code);
      await page.locator("#account-button").click();
      const panel = await box(page.locator(".site-account__panel"));
      const account = await box(page.locator("#account-button"));
      const result = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth,
      }));
      const label = `${code} ${width}`;
      assert.ok(result.scrollWidth <= result.innerWidth, `${label}: no horizontal page overflow`);
      assert.ok(panel.x >= 0 && panel.right <= result.innerWidth, `${label}: menu inside the screen`);
      assert.ok(panel.y >= account.bottom, `${label}: menu opens below the button`);
      assert.ok(account.x >= 0 && account.right <= result.innerWidth, `${label}: account button inside the screen`);
      for (const other of [".nav__brand", ".language-selector__button", ".nav__toggle"]) {
        if (!(await page.locator(other).isVisible())) continue;
        assert.ok(!overlaps(account, await box(page.locator(other))), `${label}: account clears ${other}`);
      }
      await fixture.context.close();
    }
  });
});
