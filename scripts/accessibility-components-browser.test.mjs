// The skip link, the accessibility menu and the statement link work the same
// on the sign-in pages, the workspaces, the invitation pages and 404 as on
// the public pages: in the page's language and direction, from the keyboard,
// and clear of the sign-in card and of the workspace tools in the corner.
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { accessibilityLinkLabels } from "./legal/footer-labels.mjs";

const sandbox = { window: {} };
vm.runInNewContext(await readFile(path.resolve("js/accessibility-copy.js"), "utf8"), sandbox);
const copies = sandbox.window.accessibilityCopy;
const consent = JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() });
const statementPath = (code) => (code === "en" ? "/accessibility/" : `/${code.toLowerCase()}/accessibility/`);
const loginPath = (code) => (code === "en" ? "" : `/${code.toLowerCase()}`) + "/login/";

async function open(browser, state, viewport, url, ready, { saveConsent = true } = {}) {
  const fixture = await scenario(browser, { ...state, viewport });
  if (saveConsent) await fixture.page.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
  await fixture.page.goto(url);
  await fixture.page.locator(ready).first().waitFor();
  return fixture;
}

// The menu opens from the keyboard in the page's language, traps nothing
// outside it, closes with Escape and gives focus back; the skip link reaches
// the main element.
async function assertComponents(page, code) {
  const copy = copies[code];
  await page.waitForFunction(() => document.querySelector("#a11y-fab")?.getAttribute("aria-label") && window.accessibilityCopy);
  const dir = await page.evaluate(() => getComputedStyle(document.documentElement).direction);
  assert.equal(dir, ["he", "ar"].includes(code) ? "rtl" : "ltr", code);
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  assert.equal(await skip.evaluate((node) => node === document.activeElement), true, `${code}: the skip link comes first`);
  assert.equal((await skip.textContent()).trim(), copy.skipLink);
  // It slides into view when focused.
  await page.waitForFunction(() => document.querySelector(".skip-link").getBoundingClientRect().top >= 0);
  await page.keyboard.press("Enter");
  assert.equal(new URL(page.url()).hash, "#main-content");

  const fab = page.locator("#a11y-fab");
  assert.equal(await fab.getAttribute("aria-label"), copy.openButton);
  await fab.focus();
  await page.keyboard.press("Enter");
  await page.locator("#a11y-panel.is-open").waitFor();
  assert.equal(await page.locator("#a11y-title").textContent(), copy.title);
  await page.waitForFunction(() => document.activeElement?.id === "a11y-close");
  assert.equal(await page.locator("#a11y-statement").getAttribute("href"), statementPath(code));
  await page.keyboard.press("Escape");
  await page.locator("#a11y-panel:not(.is-open)").waitFor();
  assert.equal(await page.evaluate(() => document.activeElement.id), "a11y-fab");

  const links = page.locator("a[href]:not(#a11y-statement)").filter({ hasText: accessibilityLinkLabels[code] });
  assert.ok((await links.count()) >= 1, `${code}: a statement link labelled ${accessibilityLinkLabels[code]}`);
  assert.equal(await links.first().evaluate((link) => new URL(link.href).pathname), statementPath(code));
}

const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

test("sign-in: the components work in every language and the button never covers the card", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 640 }, { width: 568, height: 320 }, { width: 667, height: 375 }]) {
    await t.test(`${viewport.width}x${viewport.height}`, async () => {
      for (const { code } of SITE_LANGUAGES) {
        const fixture = await open(browser, { signedIn: false }, viewport, origin + loginPath(code), ".app-login__statement a");
        try {
          const { page } = fixture;
          const layout = await page.evaluate(() => {
            const box = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON();
            const card = document.querySelector(".app-login__card");
            return { card: box(".app-login__card"), fab: box("#a11y-fab"), statement: box(".app-login__statement"), fits: card.scrollHeight <= card.clientHeight, overflow: document.documentElement.scrollWidth > innerWidth };
          });
          assert.equal(overlap(layout.card, layout.fab), false, `${code}: the button covers the card`);
          assert.equal(layout.fits, true, `${code}: the card scrolls`);
          assert.equal(layout.overflow, false, `${code}: the page scrolls sideways`);
          assert.ok(layout.statement.bottom <= layout.card.bottom && layout.statement.bottom <= viewport.height, code);
          if (viewport.width === 390 || code === "en") await assertComponents(page, code);
          assert.deepEqual(fixture.errors, []);
        } finally {
          await fixture.context.close();
        }
      }
    });
  }
});

// A first visit shows the cookie banner, which lifts the button above it. The
// card cannot clear that height, so the button and its menu move to the top
// corner while the banner is showing, and neither covers the card or the banner.
test("sign-in: with the cookie banner showing the button covers neither the card nor the banner", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const viewport of [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 568, height: 320 }, { width: 667, height: 375 }])
    for (const code of ["en", "he", "ar", "de"]) {
      const fixture = await open(browser, { signedIn: false }, viewport, origin + loginPath(code), ".app-login__statement a", { saveConsent: false });
      try {
        const { page } = fixture;
        await page.waitForFunction(() => document.body.classList.contains("has-cookie-banner"));
        const layout = await page.evaluate(() => {
          const box = (selector) => document.querySelector(selector).getBoundingClientRect().toJSON();
          return { card: box(".app-login__card"), fab: box("#a11y-fab"), banner: box(".cookie-consent") };
        });
        const where = `${code} ${viewport.width}x${viewport.height}`;
        assert.equal(overlap(layout.card, layout.fab), false, `${where}: the button covers the card`);
        assert.equal(overlap(layout.banner, layout.fab), false, `${where}: the button covers the banner`);
        assert.ok(layout.fab.top >= 0 && layout.fab.bottom <= viewport.height, `${where}: the button is on screen`);
        await page.locator("#a11y-fab").click();
        await page.locator("#a11y-panel.is-open").waitFor();
        await page.waitForFunction(() => getComputedStyle(document.querySelector("#a11y-panel")).transform === "matrix(1, 0, 0, 1, 0, 0)");
        const panel = await page.evaluate(() => document.querySelector("#a11y-panel").getBoundingClientRect().toJSON());
        if (viewport.height >= 600) assert.ok(panel.top >= 0 && panel.bottom <= layout.banner.top, `${where}: the menu is on screen above the banner`);
        assert.deepEqual(fixture.errors, []);
      } finally {
        await fixture.context.close();
      }
    }
});

const pages = [
  { name: "products", url: "/dashboard/", state: { enrolled: true, verified: true }, ready: ".product-tile" },
  { name: "host", url: "/dashboard/host/", state: { host: "active", enrolled: true, verified: true }, ready: ".manager-view:not([hidden])" },
  { name: "reservations", url: "/reservations/", state: { signedIn: false }, ready: "#reservations-sign-in" },
  { name: "pay point", url: "/pay/point/", state: { signedIn: false }, ready: "#pay-point" },
  { name: "invitation", url: "/wifigate-link/", state: { signedIn: false }, ready: "#page-title", locales: ["en", "ar", "ja"] },
  { name: "not found", url: "/404.html", state: { signedIn: false }, ready: "main", locales: ["en"] },
  { name: "contact", url: "/contact-us/", state: { signedIn: false }, ready: "main", locales: ["en"] },
];

for (const { name, url, state, ready, locales = ["en", "he"] } of pages)
  test(`${name}: the components work in ${locales.join(" and ")}`, async (t) => {
    const { origin, browser } = await startSite(t);
    for (const code of locales)
      for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
        const target = name === "invitation" && code !== "en" ? `/${code}${url}` : code === "he" ? `${url}?lang=he` : url;
        const fixture = await open(browser, state, viewport, origin + target, ready);
        try {
          await assertComponents(fixture.page, code);
          assert.deepEqual(fixture.errors, []);
        } finally {
          await fixture.context.close();
        }
      }
  });

// At the end of the page the footer links sit above the button, not under it.
test("workspaces: the button never covers the footer links at the end of the page", async (t) => {
  const { origin, browser } = await startSite(t);
  const footers = [
    { url: "/dashboard/host/", state: { host: "active", enrolled: true, verified: true }, ready: ".manager-view:not([hidden])", links: ".portal-legal a" },
    { url: "/dashboard/", state: { enrolled: true, verified: true }, ready: ".product-tile", links: ".portal-a11y-footer a" },
    { url: "/reservations/", state: { signedIn: false }, ready: "#reservations-sign-in", links: ".portal-a11y-footer a" },
  ];
  for (const { url, state, ready, links } of footers)
    for (const code of ["en", "he"])
      for (const viewport of [{ width: 320, height: 640 }, { width: 390, height: 844 }]) {
        const fixture = await open(browser, state, viewport, origin + url + (code === "he" ? "?lang=he" : ""), ready);
        try {
          const { page } = fixture;
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
          await page.waitForFunction(() => Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 1);
          const covered = await page.evaluate((selector) => {
            const fab = document.querySelector("#a11y-fab").getBoundingClientRect();
            return [...document.querySelectorAll(selector)].filter((link) => {
              const box = link.getBoundingClientRect();
              return box.width > 0 && box.left < fab.right && fab.left < box.right && box.top < fab.bottom && fab.top < box.bottom;
            }).map((link) => link.textContent.trim());
          }, links);
          assert.deepEqual(covered, [], `${url} ${code} ${viewport.width}: the button covers footer links`);
          assert.deepEqual(fixture.errors, []);
        } finally {
          await fixture.context.close();
        }
      }
});

test("workspaces: the button rests above the admin tools in its corner and returns while the menu is open", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const code of ["en", "he"])
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const fixture = await open(browser, { platformRole: "admin", admin: true, enrolled: true, verified: true }, viewport,
        origin + "/dashboard/" + (code === "he" ? "?lang=he" : ""), ".platform-admin-tools:not([hidden])");
      try {
        const { page } = fixture;
        const boxes = () => page.evaluate(() => ({
          fab: document.querySelector("#a11y-fab").getBoundingClientRect().toJSON(),
          tools: document.querySelector(".platform-admin-tools").getBoundingClientRect().toJSON(),
        }));
        await page.waitForFunction(() => document.querySelector("#a11y-fab").style.getPropertyValue("--a11y-fab-lift"));
        let { fab, tools } = await boxes();
        assert.equal(overlap(fab, tools), false, `${code} ${viewport.width}: the button covers the admin tools`);
        assert.ok(fab.bottom <= tools.top, `${code} ${viewport.width}: the button is above the tools`);
        // Collapsing the tools brings the button down with them.
        await page.locator(".platform-admin-tools-toggle").click();
        await page.waitForFunction((top) => document.querySelector("#a11y-fab").getBoundingClientRect().bottom > top, fab.bottom);
        ({ fab, tools } = await boxes());
        assert.equal(overlap(fab, tools), false, `${code} ${viewport.width}: collapsed`);
        assert.deepEqual(fixture.errors, []);
      } finally {
        await fixture.context.close();
      }
    }
});
