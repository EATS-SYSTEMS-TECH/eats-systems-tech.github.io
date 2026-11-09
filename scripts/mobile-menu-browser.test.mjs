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

test("open mobile menu stays scrollable to its last row on short landscape phones", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const [width, height] of [[667, 375], [844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true });
    t.after(() => context.close());
    await context.addInitScript(() => localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() })));
    await context.route("**/*", route =>
      route.request().resourceType() === "media" || new URL(route.request().url()).origin !== origin
        ? route.abort() : route.continue());
    const page = await context.newPage();
    for (const path of ["/he/", "/"]) await t.test(`${path} at ${width}x${height}`, async () => {
      await page.goto(origin + path + "index.html", { waitUntil: "load" });
      await page.locator(".nav__toggle").tap();
      await page.waitForFunction(() => document.querySelector(".nav__links-wrapper").classList.contains("is-open"));
      const before = await page.evaluate(() => {
        const menu = document.querySelector(".nav__links-wrapper");
        return { bottom: menu.getBoundingClientRect().bottom, overflowY: getComputedStyle(menu).overflowY, scrollable: menu.scrollHeight > menu.clientHeight };
      });
      assert.ok(before.bottom <= height + 0.5, "open menu is capped to the viewport");
      assert.equal(before.overflowY, "auto", "open menu scrolls inside itself");
      assert.equal(before.scrollable, true, "the menu is taller than this viewport, so it must scroll");
      await page.mouse.move(width / 2, height - 60);
      await page.mouse.wheel(0, 400);
      await page.waitForFunction(() => { const m = document.querySelector(".nav__links-wrapper"); return Math.ceil(m.scrollTop + m.clientHeight) >= m.scrollHeight; });
      const contact = await page.locator(".topbar-nav .nav__contact-link").boundingBox();
      assert.ok(contact.y >= 68 - 0.5 && contact.y + contact.height <= height + 0.5, "contact button is fully reachable after scrolling the menu");
      assert.equal(await page.locator(".nav__toggle").getAttribute("aria-expanded"), "true", "scrolling keeps the menu open");
    });
  }
});
