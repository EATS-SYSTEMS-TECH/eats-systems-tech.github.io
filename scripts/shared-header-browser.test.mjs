import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";

const origin = process.env.SITE_URL || "http://127.0.0.1:8000";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
let checked = 0;
try {
  const context = await browser.newContext();
  await context.addInitScript(() => localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() })));
  await context.route("**/*", route => (route.request().resourceType() === "media" || new URL(route.request().url()).origin !== new URL(origin).origin) ? route.abort() : route.continue());
  const page = await context.newPage();
  const selectedLocales = process.env.TEST_LOCALES?.split(',');
  for (const { code } of SITE_LANGUAGES.filter(item => !selectedLocales || selectedLocales.includes(item.code))) {
    const prefix = code === "en" ? "/" : `/${code.toLowerCase()}/`;
    const routes = ["", ...(["en", "he", "ar"].includes(code) ? NICHE_DEFINITIONS.map(item => `${item.key}/`) : ["electric-gates/"]), "auto-open/", "wifigate-host/", "wifigate-manager/", "shop/", "shop/wifigate/", "security-privacy/", "no-subscription-fees/", "privacy-policy/"];
    const widths = process.env.TEST_WIDTHS?.split(',').map(Number) || (["en", "he", "ar"].includes(code) ? [320, 390, 820, 1280, 1440] : [390, 1440]);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 915 });
      let reference;
      for (const route of routes) {
        const label = `${code}/${route || "home"} at ${width}px`;
        await page.goto(`${origin}${prefix}${route}`, { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        await page.addStyleTag({ content: '.site-header, .site-header * { transition: none !important; animation: none !important; }' });
        const collapsed = width < 1440;
        if (collapsed) {
          await page.locator(".nav__toggle").click();
          await page.waitForFunction(() => getComputedStyle(document.querySelector(".nav__links-wrapper")).opacity === "1");
        }
        await page.mouse.move(width - 1, 914);
        const result = await page.evaluate(() => {
          // Current-page highlights are intentional; compare the shared base
          // appearance without this transient state or the previous mouse hover.
          const active = [...document.querySelectorAll('.site-header .nav__link--active')];
          active.forEach(link => link.classList.remove('nav__link--active'));
          const selectors = [".site-header", ".nav", ".nav__logo", ".site-login__trigger", ".site-cart__trigger", ".language-selector__button", ".nav__toggle", ".nav__links-wrapper", ".topbar-nav", ".nav__link"];
          const elements = selectors.flatMap(selector => [...document.querySelectorAll(`.site-header ${selector}, header${selector}`)].map(element => {
            const s = getComputedStyle(element), r = element.getBoundingClientRect();
            return { selector, x: r.x, y: r.y, width: r.width, height: r.height, display: s.display, color: s.color, background: s.backgroundColor, fontSize: s.fontSize, fontFamily: s.fontFamily, borderBottom: s.borderBottom, padding: s.padding, gap: s.gap };
          }));
          const menu = document.querySelector(".topbar-nav"), box = menu.getBoundingClientRect(), style = getComputedStyle(menu);
          const result = { elements, links: [...menu.children].map(link => ({ width: link.getBoundingClientRect().width, available: box.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight) })), scrollWidth: document.documentElement.scrollWidth };
          active.forEach(link => link.classList.add('nav__link--active'));
          return result;
        });
        assert.ok(result.scrollWidth <= width, `${label}: no horizontal overflow`);
        assert.ok(result.elements.some(item => item.selector === ".nav__logo"), `${label}: shared logo exists`);
        if (collapsed) for (const link of result.links) assert.ok(Math.abs(link.width - link.available) <= 1, `${label}: every row and separator fills the menu`);
        if (reference) {
          assert.equal(result.elements.length, reference.length, `${label}: same header controls`);
          result.elements.forEach((item, index) => {
            const expected = reference[index];
            for (const key of ["x", "y", "width", "height"]) assert.ok(Math.abs(item[key] - expected[key]) <= 1, `${label}: ${item.selector} ${key} matches homepage (${item[key]} vs ${expected[key]})`);
            for (const key of ["display", "color", "background", "fontSize", "fontFamily", "borderBottom", "padding", "gap"]) assert.equal(item[key], expected[key], `${label}: ${item.selector} ${key} matches homepage`);
          });
        } else reference = result.elements;
        if (collapsed) {
          await page.locator(".nav__toggle").click();
          assert.equal(await page.locator(".nav__toggle").getAttribute("aria-expanded"), "false");
        }
        checked++;
      }
      if (["en", "he", "ar"].includes(code)) console.log(`Shared header: ${code} ${width}px passed all routes.`);
    }
    console.log(`Shared header: ${code} passed ${routes.length} routes at ${widths.length} widths.`);
  }
  await context.close();
  console.log(`Shared header: ${checked} page/locale/viewport comparisons passed.`);
} finally {
  await browser.close();
}
