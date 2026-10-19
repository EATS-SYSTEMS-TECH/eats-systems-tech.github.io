import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const site = process.env.SITE_URL ?? "http://127.0.0.1:8000";
const screenshotDir = process.env.SCREENSHOT_DIR;
const locales = process.env.TEST_LOCALES?.split(",") ?? SITE_LANGUAGES.map(({ code }) => code);
const widths = process.env.TEST_WIDTHS?.split(",").map(Number) ?? [320, 412, 820, 1199];
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge", headless: true });
let checked = 0;
const referenceLayouts = new Map();

try {
  if (screenshotDir) await mkdir(screenshotDir, { recursive: true });
  const context = await browser.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() })));
  // Menu rendering does not depend on the large homepage videos.
  await context.route("**/*", (route) => route.request().resourceType() === "media" ? route.abort() : route.continue());
  const page = await context.newPage();
  for (const locale of locales) {
    const localePath = locale === "en" ? "/" : `/${locale.toLowerCase()}/`;
    for (const width of widths) {
      await page.setViewportSize({ width, height: 915 });
      await page.goto(`${site}${localePath}`, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.locator(".nav__toggle").tap();
      await page.waitForFunction(() => getComputedStyle(document.querySelector(".nav__links-wrapper")).opacity === "1");
      const menuBounds = await page.locator(".nav__links-wrapper").evaluate((menu) => {
        const rect = menu.getBoundingClientRect();
        return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
      });
      if (process.env.PRINT_METRICS) console.log(`${locale} at ${width}px menu`, menuBounds);
      assert.ok(Math.abs(menuBounds.left) <= 1, `${locale} at ${width}px: menu reaches left edge`);
      assert.ok(Math.abs(menuBounds.right - width) <= 1, `${locale} at ${width}px: menu reaches right edge`);
      assert.ok(Math.abs(menuBounds.top - 68) <= 1, `${locale} at ${width}px: menu begins below the header`);
      assert.ok(menuBounds.bottom < 914, `${locale} at ${width}px: menu ends at content height, above the viewport bottom`);
      assert.ok(Math.abs(menuBounds.bottom - menuBounds.top - 292) <= 4, `${locale} at ${width}px: menu matches the reference height`);
      const toggle = page.locator(".nav__toggle");
      const openIcon = await toggle.evaluate((button) => [...button.querySelectorAll(".nav__toggle-bar")].map((bar) => {
        const style = getComputedStyle(bar);
        return { transform: style.transform, opacity: style.opacity };
      }));
      assert.notEqual(openIcon[0].transform, "none", `${locale} at ${width}px: first bar rotates when open`);
      assert.equal(openIcon[1].opacity, "0", `${locale} at ${width}px: middle bar disappears when open`);
      assert.notEqual(openIcon[2].transform, "none", `${locale} at ${width}px: third bar rotates when open`);
      if (screenshotDir && ["en", "he", "ar"].includes(locale) && width === 412) {
        await page.screenshot({ path: `${screenshotDir}/${locale}-menu.png` });
      }
      const state = await page.locator(".nav__contact-link").evaluate((link) => {
        const style = getComputedStyle(link);
        const rect = link.getBoundingClientRect();
        const menu = link.parentElement;
        const menuRect = menu.getBoundingClientRect();
        const menuStyle = getComputedStyle(menu);
        return {
          background: style.backgroundColor, color: style.color, textAlign: style.textAlign,
          radius: style.borderRadius, height: rect.height, width: rect.width,
          availableWidth: menuRect.width - parseFloat(menuStyle.paddingLeft) - parseFloat(menuStyle.paddingRight),
          x: rect.x, right: rect.right, scrollWidth: link.scrollWidth, clientWidth: link.clientWidth,
          href: new URL(link.href).pathname + new URL(link.href).hash,
        };
      });
      const label = `${locale} at ${width}px`;
      if (process.env.PRINT_METRICS) console.log(label, state);
      assert.equal(state.background, "rgb(10, 10, 10)", `${label}: black contact button at rest`);
      assert.equal(state.color, "rgb(255, 255, 255)", `${label}: white contact label`);
      assert.equal(state.textAlign, "center", `${label}: centered label in either direction`);
      assert.equal(state.radius, "4px", `${label}: consistent corners`);
      assert.ok(Math.abs(state.width - state.availableWidth) <= 1, `${label}: button fills the menu width`);
      assert.ok(state.height >= 44, `${label}: usable touch target`);
      assert.ok(state.x >= 0 && state.right <= width, `${label}: button fits the screen`);
      assert.ok(state.scrollWidth <= state.clientWidth, `${label}: translation fits the button`);
      const reference = referenceLayouts.get(width) ?? state;
      for (const dimension of ["width", "height", "x", "right"]) {
        assert.ok(Math.abs(state[dimension] - reference[dimension]) <= 1, `${label}: ${dimension} matches the reference language`);
      }
      referenceLayouts.set(width, reference);
      assert.equal(state.href, `${localePath}#get-in-touch`, `${label}: localized contact destination`);
      await page.locator(".nav__contact-link").tap();
      assert.equal(await page.locator(".nav__toggle").getAttribute("aria-expanded"), "false", `${label}: contact closes the menu`);
      await page.waitForFunction(() => [...document.querySelectorAll(".nav__toggle-bar")].every((bar) => getComputedStyle(bar).transform === "none" && getComputedStyle(bar).opacity === "1"));
      assert.equal(new URL(page.url()).hash, "#get-in-touch", `${label}: contact navigation works`);
      checked++;
    }
    console.log(`Contact button: ${locale} passed ${widths.length} mobile/tablet widths.`);
  }
  await context.close();
  console.log(`Mobile contact button: ${checked} localized layouts passed.`);
} finally {
  await browser.close();
}
