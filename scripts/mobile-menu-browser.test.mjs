import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";

test("mobile navigation closes outside, keeps inside taps and supports keyboard dismissal", async (t) => {
  const { origin, browser } = await startSite(t);
  const context = await browser.newContext({ viewport: { width: 390, height: 915 }, hasTouch: true });
  t.after(() => context.close());
  await context.addInitScript(() => localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() })));
  await context.route("**/*", route =>
    route.request().resourceType() === "media" || new URL(route.request().url()).origin !== origin
      ? route.abort() : route.continue());
  const page = await context.newPage();
  const paths = SITE_LANGUAGES.map(({ code }) => code === "en" ? "/" : `/${code.toLowerCase()}/`);
  for (const prefix of ["/", "/he/", "/ar/"])
    for (const path of ["electric-gates/", "auto-open/", "wifigate-host/"])
      paths.push(prefix + path);
  for (const path of paths) await t.test(path, async () => {
    await page.goto(origin + path + "index.html", { waitUntil: "load" });
    const toggle = page.locator(".nav__toggle");
    const menu = page.locator(".nav__links-wrapper");
    await toggle.tap();
    await assert.doesNotReject(() => page.waitForFunction(() => document.querySelector(".nav__links-wrapper").classList.contains("is-open")));
    await menu.dispatchEvent("pointerdown", { pointerType: "touch", bubbles: true });
    assert.equal(await toggle.getAttribute("aria-expanded"), "true", "inside touch keeps the menu open");
    // Choose a real page point below the menu, away from links or actions.
    const box = await menu.boundingBox();
    const y = Math.min(900, box.y + box.height + 30);
    assert.ok(y > box.y + box.height, "page remains reachable below menu");
    await page.touchscreen.tap(10, y);
    assert.equal(await toggle.getAttribute("aria-expanded"), "false", "outside touch closes the menu");
    assert.equal(await menu.evaluate(el => el.classList.contains("is-open")), false);
    await toggle.tap();
    assert.equal(await toggle.getAttribute("aria-expanded"), "true", "can reopen");
    await toggle.tap();
    assert.equal(await toggle.getAttribute("aria-expanded"), "false", "toggle still closes rather than reopening");
    await toggle.tap();
    await page.keyboard.press("Escape");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
  });
});
