import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const hold = () => { let release; const promise = new Promise(resolve => { release = resolve; }); return { promise, release }; };
const profile = { role: "user", personalRole: "user", account: { id: "fixture-account" }, organizations: [] };

test("Manager stays behind a first-paint progress bar until its bundle, identity and initial data are ready", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [390, 1440]) await t.test(`${language} ${width}px`, async t => {
    const { page, context, errors } = await scenario(browser, { manager: "active", enrolled: true, verified: true, viewport: { width, height: 900 } });
    t.after(() => context.close());
    const bundle = hold(), identity = hold(), inventory = hold(), reachedIdentity = hold(), reachedInventory = hold();
    t.after(() => { bundle.release(); identity.release(); inventory.release(); });
    await context.route("**/js/platform-dashboard.bundle.js?*", async route => { await bundle.promise; await route.continue(); });
    await context.route("**/api/v1/manager/**", async route => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/me")) { reachedIdentity.release(); await identity.promise; return route.fulfill({ json: profile }); }
      if (path.includes("/systems")) { reachedInventory.release(); await inventory.promise; }
      return route.fulfill({ json: { items: [], nextCursor: null } });
    });
    await page.goto(`${origin}/dashboard/manager/?lang=${language}`, { waitUntil: "commit" });
    const loader = page.locator("#manager-loading"), shell = page.locator(".platform-shell"), progress = page.locator("#manager-loading-progress");
    await loader.waitFor({ state: "visible" });
    assert.equal(await shell.isVisible(), false, "HTML alone conceals the incomplete shell");
    assert.equal(await shell.evaluate(node => node.inert), true);
    assert.equal(await page.locator("html").getAttribute("dir"), language === "he" ? "rtl" : "ltr");
    bundle.release();
    await reachedIdentity.promise;
    assert.equal(await loader.isVisible(), true);
    assert.equal(await progress.getAttribute("value"), "2");
    identity.release();
    await reachedInventory.promise;
    assert.equal(await page.locator(".manager-shell").count(), 1, "workspace construction has started");
    assert.equal(await shell.isVisible(), false, "a half-built workspace is never exposed");
    if (process.env.MANAGER_LOADING_SCREENSHOTS) {
      await mkdir(process.env.MANAGER_LOADING_SCREENSHOTS, { recursive: true });
      await page.screenshot({ path: `${process.env.MANAGER_LOADING_SCREENSHOTS}/loading-${language}-${width}.png` });
    }
    inventory.release();
    await loader.waitFor({ state: "hidden" });
    assert.equal(await shell.isVisible(), true);
    assert.equal(await shell.evaluate(node => node.inert), false);
    assert.equal(await shell.getAttribute("aria-busy"), "false");
    assert.equal(await progress.getAttribute("value"), "4");
    assert.equal(await page.evaluate(() => document.fonts.status), "loaded");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    if (process.env.MANAGER_LOADING_SCREENSHOTS)
      await page.screenshot({ path: `${process.env.MANAGER_LOADING_SCREENSHOTS}/ready-${language}-${width}.png` });
  });
});

test("Manager renders an actionable access error and can retry without exposing an intermediate shell", async t => {
  const { origin, browser } = await startSite(t);
  const { page, context, state } = await scenario(browser, { manager: "active", unavailable: true });
  t.after(() => context.close());
  await page.goto(origin + "/dashboard/manager/?lang=he");
  await page.locator("#manager-loading").waitFor({ state: "hidden" });
  assert.equal(await page.locator('#platform-status[data-state="error"]').isVisible(), true);
  assert.equal(await page.locator("#platform-retry").isVisible(), true);
  assert.notEqual(await page.locator("#manager-loading-progress").getAttribute("value"), "4");
  state.unavailable = false;
  await context.route("**/api/v1/manager/**", route => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith("/me") ? profile : { items: [], nextCursor: null } }));
  await page.locator("#platform-retry").click();
  await page.locator(".manager-shell").waitFor({ state: "visible" });
  assert.equal(await page.locator("#manager-loading").isVisible(), false);
});

test("a failed dashboard stylesheet keeps the unfinished Manager hidden and offers reload", async t => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, { manager: "active" });
  t.after(() => context.close());
  await context.route("**/css/manager-dashboard.css?*", route => route.abort("failed"));
  await page.goto(origin + "/dashboard/manager/?lang=he");
  await page.getByText("לא ניתן להשלים את טעינת התצוגה. נסו לטעון מחדש.", { exact: true }).waitFor();
  assert.equal(await page.locator(".platform-shell").isVisible(), false);
  assert.equal(await page.locator("#manager-loading a").isVisible(), true);
});

test("Manager waits for its fonts before revealing the styled workspace", async t => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, { manager: "active" });
  t.after(() => context.close());
  const font = hold(), requested = hold();
  t.after(() => font.release());
  await context.route("**/assets/fonts/*.woff2", async route => { requested.release(); await font.promise; await route.continue(); });
  await context.route("**/api/v1/manager/**", route => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith("/me") ? profile : { items: [], nextCursor: null } }));
  await page.goto(origin + "/dashboard/manager/?lang=he", { waitUntil: "domcontentloaded" });
  await requested.promise;
  await page.waitForFunction(() => document.querySelector('#manager-loading-progress').value === 3);
  assert.equal(await page.locator(".platform-shell").isVisible(), false);
  assert.equal(await page.locator("#manager-loading").isVisible(), true);
  font.release();
  await page.locator("#manager-loading").waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => document.fonts.status), "loaded");
  assert.equal(await page.locator(".platform-shell").isVisible(), true);
});

test("the inline progress surface paints even while the dashboard stylesheet is still downloading", async t => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, { manager: "active" });
  t.after(() => context.close());
  const css = hold(), requested = hold();
  t.after(() => css.release());
  await context.route("**/css/manager-dashboard.css?*", async route => { requested.release(); await css.promise; await route.continue(); });
  await context.route("**/api/v1/manager/**", route => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith("/me") ? profile : { items: [], nextCursor: null } }));
  await page.goto(origin + "/dashboard/manager/?lang=he", { waitUntil: "commit" });
  await requested.promise;
  await page.locator("#manager-loading").waitFor({ state: "visible" });
  assert.equal(await page.locator(".platform-shell").isVisible(), false);
  assert.equal(await page.locator("#manager-loading-progress").isVisible(), true);
  assert.equal(await page.locator('link[data-manager-style][href*="manager-dashboard.css"]').getAttribute("media"), "print");
  if (process.env.MANAGER_LOADING_SCREENSHOTS)
    await page.screenshot({ path: `${process.env.MANAGER_LOADING_SCREENSHOTS}/waiting-for-css-he.png` });
  css.release();
  await page.locator("#manager-loading").waitFor({ state: "hidden" });
  assert.equal(await page.locator('link[data-manager-style][href*="manager-dashboard.css"]').getAttribute("media"), "all");
  assert.equal(await page.locator(".platform-shell").isVisible(), true);
});
