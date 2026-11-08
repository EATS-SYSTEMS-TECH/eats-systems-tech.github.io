import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

// WIFIGATE Host uses Manager's first-paint progress screen: the shell stays
// hidden and inert until the bundle, the access check and the workspace's
// first load have settled, with Host blue as the only difference.
const hold = () => { let release; const promise = new Promise(resolve => { release = resolve; }); return { promise, release }; };
const evidence = process.env.HOST_LOADING_SCREENSHOTS;

test("Host stays behind a first-paint progress bar until its bundle, access and workspace are ready", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [390, 1440]) await t.test(`${language} ${width}px`, async t => {
    const { page, context, errors } = await scenario(browser, { enrolled: true, verified: true, viewport: { width, height: 900 } });
    t.after(() => context.close());
    const bundle = hold(), identity = hold(), workspace = hold(), reachedIdentity = hold(), reachedWorkspace = hold();
    t.after(() => { bundle.release(); identity.release(); workspace.release(); });
    await context.route("**/js/host-dashboard.bundle.js?*", async route => { await bundle.promise; await route.continue(); });
    await context.route(url => new URL(url).pathname === "/api/v1/platform/me", async route => { reachedIdentity.release(); await identity.promise; await route.fallback(); });
    await context.route(url => new URL(url).pathname === "/api/v1/organizations", async route => { reachedWorkspace.release(); await workspace.promise; await route.fallback(); });
    await page.goto(`${origin}/dashboard/host/?lang=${language}`, { waitUntil: "commit" });
    const loader = page.locator("#host-loading"), shell = page.locator(".platform-shell"), progress = page.locator("#host-loading-progress");
    await loader.waitFor({ state: "visible" });
    assert.equal(await shell.isVisible(), false, "HTML alone conceals the incomplete shell");
    assert.equal(await shell.evaluate(node => node.inert), true);
    assert.equal(await page.locator("html").getAttribute("dir"), language === "he" ? "rtl" : "ltr");
    // Host's accent is its only difference from Manager's progress bar.
    assert.equal(await progress.evaluate(node => getComputedStyle(node).accentColor), "rgb(11, 99, 255)");
    bundle.release();
    await reachedIdentity.promise;
    assert.equal(await loader.isVisible(), true);
    assert.equal(await shell.isVisible(), false);
    identity.release();
    await reachedWorkspace.promise;
    assert.equal(await progress.getAttribute("value"), "2");
    assert.equal(await shell.isVisible(), false, "a half-built workspace is never exposed");
    if (evidence) {
      await mkdir(evidence, { recursive: true });
      await page.screenshot({ path: `${evidence}/host-loading-${language}-${width}.png` });
    }
    workspace.release();
    await loader.waitFor({ state: "hidden" });
    assert.equal(await shell.isVisible(), true);
    assert.equal(await shell.evaluate(node => node.inert), false);
    assert.equal(await shell.getAttribute("aria-busy"), "false");
    assert.equal(await progress.getAttribute("value"), "4");
    assert.equal(await page.evaluate(() => document.fonts.status), "loaded");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
  });
});

test("an aborted Host bundle keeps the shell hidden and offers reload", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) await t.test(language, async t => {
    const { page, context } = await scenario(browser, { mobile: true });
    t.after(() => context.close());
    await context.route("**/js/host-dashboard.bundle.js*", route => route.abort());
    await page.goto(`${origin}/dashboard/host/?lang=${language}`);
    await page.getByText(language === "he" ? "לא ניתן להשלים את טעינת התצוגה. נסו לטעון מחדש." : "The workspace could not finish loading. Please reload.", { exact: true }).waitFor();
    assert.equal(await page.locator(".platform-shell").isVisible(), false);
    assert.equal(await page.locator(".platform-shell").evaluate(node => node.inert), true);
    assert.equal(await page.locator("#host-loading a").isVisible(), true);
    assert.equal(await page.locator("#account-menu").isVisible(), false);
  });
});

test("a failed Host stylesheet keeps the unfinished workspace hidden and offers reload", async t => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, {});
  t.after(() => context.close());
  await context.route("**/css/host-dashboard.css?*", route => route.abort("failed"));
  await page.goto(origin + "/dashboard/host/?lang=he");
  await page.getByText("לא ניתן להשלים את טעינת התצוגה. נסו לטעון מחדש.", { exact: true }).waitFor();
  assert.equal(await page.locator(".platform-shell").isVisible(), false);
  assert.equal(await page.locator("#host-loading a").isVisible(), true);
});

test("the Host progress surface paints while its stylesheets are still downloading", async t => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, {});
  t.after(() => context.close());
  const css = hold(), requested = hold();
  t.after(() => css.release());
  await context.route("**/css/host-manager-theme.css?*", async route => { requested.release(); await css.promise; await route.continue(); });
  await page.goto(origin + "/dashboard/host/", { waitUntil: "commit" });
  await requested.promise;
  await page.locator("#host-loading").waitFor({ state: "visible" });
  assert.equal(await page.locator(".platform-shell").isVisible(), false);
  assert.equal(await page.locator('link[data-host-style][href*="host-manager-theme.css"]').getAttribute("media"), "print");
  css.release();
  await page.locator("#host-loading").waitFor({ state: "hidden" });
  assert.equal(await page.locator('link[data-host-style][href*="host-manager-theme.css"]').getAttribute("media"), "all");
  assert.equal(await page.locator(".platform-shell").isVisible(), true);
});
