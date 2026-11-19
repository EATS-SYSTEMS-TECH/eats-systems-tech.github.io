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
// outside it, closes with Escape and gives focus back; the skip link moves
// focus to the main element, which shows no ring, not even after a click.
async function assertComponents(page, code) {
  const copy = copies[code];
  await page.waitForFunction(() => document.querySelector("#a11y-fab")?.getAttribute("aria-label") && window.accessibilityCopy);
  const dir = await page.evaluate(() => getComputedStyle(document.documentElement).direction);
  assert.equal(dir, ["he", "ar"].includes(code) ? "rtl" : "ltr", code);
  const skip = page.locator(".skip-link");
  // Hidden, nothing of it shows: not even its shadow above the page.
  assert.equal(await skip.evaluate((node) => getComputedStyle(node).boxShadow), "none", `${code}: the hidden skip link casts a shadow`);
  await page.keyboard.press("Tab");
  assert.equal(await skip.evaluate((node) => node === document.activeElement), true, `${code}: the skip link comes first`);
  assert.equal((await skip.textContent()).trim(), copy.skipLink);
  // It slides into view when focused.
  await page.waitForFunction(() => document.querySelector(".skip-link").getBoundingClientRect().top >= 0);
  await page.keyboard.press("Enter");
  assert.equal(new URL(page.url()).hash, "#main-content");
  await page.waitForFunction(() => document.activeElement?.id === "main-content", null, { timeout: 2000 }).catch(() => {});
  assert.equal(await page.evaluate(() => document.activeElement?.id), "main-content", `${code}: the skip link moves focus to main`);
  // It lands at the start of main, not in the middle of a tall page, and main
  // keeps its tabindex for the next time.
  await page.waitForTimeout(300);
  const landing = await page.evaluate(() => ({ top: document.querySelector("#main-content").getBoundingClientRect().top, height: innerHeight, tabindex: document.querySelector("#main-content").getAttribute("tabindex") }));
  assert.ok(landing.top > -2 && landing.top < landing.height / 2, `${code}: the skip link lands mid-page (main top ${Math.round(landing.top)})`);
  assert.equal(landing.tabindex, "-1", `${code}: main lost its tabindex`);
  assert.equal(await page.locator("#main-content").evaluate((main) => getComputedStyle(main).outlineStyle), "none", `${code}: a ring around main`);
  // A click on plain text inside main focuses main without a ring.
  const spot = await page.evaluate(() => {
    const interactive = "a, button, input, select, textarea, label, summary, [tabindex]:not(#main-content)";
    for (const text of document.querySelectorAll("#main-content :is(h1, h2, p)")) {
      text.scrollIntoView({ block: "center" });
      const box = text.getBoundingClientRect();
      if (!box.width || !box.height) continue;
      const point = { x: box.left + 2, y: box.top + box.height / 2 };
      const hit = document.elementFromPoint(point.x, point.y);
      if (hit?.closest("#main-content") && !hit.closest(interactive)) return point;
    }
    return null;
  });
  if (spot) {
    await page.mouse.click(spot.x, spot.y);
    if (await page.evaluate(() => document.activeElement?.id === "main-content"))
      assert.equal(await page.locator("#main-content").evaluate((main) => getComputedStyle(main).outlineStyle), "none", `${code}: a ring around main after a click`);
  }

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
  // The home pages centre same-page links (js/navigation.js); the skip link keeps its own jump.
  { name: "home", url: "/index.html", state: { signedIn: false }, ready: "main" },
  { name: "products", url: "/dashboard/", state: { enrolled: true, verified: true }, ready: ".product-tile" },
  { name: "host", url: "/dashboard/host/", state: { host: "active", enrolled: true, verified: true }, ready: ".manager-view:not([hidden])" },
  { name: "reservations", url: "/reservations/", state: { signedIn: false }, ready: "#reservations-sign-in" },
  { name: "pay point", url: "/pay/point/", state: { signedIn: false }, ready: "#pay-point" },
  { name: "invitation", url: "/wifigate-link/", state: { signedIn: false }, ready: "#page-title", locales: ["en", "ar", "ja"] },
  // An invalid invitation shows no control in main: the skip link still lands there.
  { name: "invalid invitation", url: "/wifigate-link/?code=abc", state: { signedIn: false }, ready: "#page-title", locales: ["en"] },
  { name: "invalid API invitation", url: "/wifigate-api/?code=abc", state: { signedIn: false }, ready: "#page-title", locales: ["en"] },
  { name: "not found", url: "/404.html", state: { signedIn: false }, ready: "main", locales: ["en"] },
  { name: "contact", url: "/contact-us/", state: { signedIn: false }, ready: "main", locales: ["en"] },
];

for (const { name, url, state, ready, locales = ["en", "he"] } of pages)
  test(`${name}: the components work in ${locales.join(" and ")}`, async (t) => {
    const { origin, browser } = await startSite(t);
    for (const code of locales)
      for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
        const target = name === "invitation" && code !== "en" ? `/${code}${url}` : name === "home" && code === "he" ? "/he/index.html" : code === "he" ? `${url}?lang=he` : url;
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

// Tabs through the page and lists every stop the button or the cookie banner
// covers, or that ends off screen, where the page has scrolled it to. Smooth
// scrolling is turned off so each stop is measured where its scroll ends.
async function coveredStops(page, limit = 150) {
  await page.addStyleTag({ content: "html { scroll-behavior: auto !important; }" });
  const seen = new Set(), covered = [];
  for (let step = 0; step < limit; step++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const node = document.activeElement;
      if (!node || node === document.body) return null;
      const label = (node.textContent || node.getAttribute("aria-label") || node.id || "").trim().replace(/\s+/g, " ").slice(0, 40);
      const name = `${node.tagName.toLowerCase()} "${label}"`;
      const key = `${name} ${[...document.querySelectorAll("*")].indexOf(node)}`;
      if (node.closest("#a11y-panel, #a11y-fab, .a11y-fab__dismiss, .cookie-consent, .skip-link")) return { key };
      const box = node.getBoundingClientRect();
      if (!box.width || !box.height) return { key };
      const over = [document.querySelector("#a11y-fab"), document.querySelector(".cookie-consent:not([hidden])")]
        .filter((cover) => cover && !cover.hidden)
        .map((cover) => cover.getBoundingClientRect())
        .some((cover) => box.left < cover.right && cover.left < box.right && box.top < cover.bottom && cover.top < box.bottom);
      const problem = over ? `${name} is covered` : box.bottom > innerHeight || box.top < 0 ? `${name} is off screen` : null;
      return { key, problem };
    });
    if (!stop) continue;
    if (seen.has(stop.key)) break;
    seen.add(stop.key);
    if (stop.problem) covered.push(stop.problem);
  }
  return { covered, stops: seen.size };
}

// A control that takes focus is never under the button: the page scrolls it
// clear, and on narrow screens the end of the page can scroll above the
// button's corner.
test("every page: the button never covers a focused control on a small phone", async (t) => {
  const { origin, browser } = await startSite(t);
  const list = [
    { url: "/404.html", state: { signedIn: false }, ready: "main" },
    { url: "/contact-us/", state: { signedIn: false }, ready: "main" },
    { url: "/shop/", state: { signedIn: false }, ready: "main" },
    { url: "/privacy-policy/", state: { signedIn: false }, ready: "main" },
    { url: "/he/office-buildings/", state: { signedIn: false }, ready: "main" },
    { url: "/wifigate-link/?code=abc", state: { signedIn: false }, ready: "#page-title" },
    { url: "/dashboard/", state: { enrolled: true, verified: true }, ready: ".product-tile" },
    { url: "/dashboard/host/", state: { host: "active", enrolled: true, verified: true }, ready: ".manager-view:not([hidden])" },
    { url: "/dashboard/pay/", state: { pay: "active", enrolled: true, verified: true }, ready: "main" },
    { url: "/dashboard/manager/", state: { enrolled: true, verified: true }, ready: ".manager-retry, .manager-view:not([hidden])" },
    { url: "/reservations/", state: { signedIn: false }, ready: "#reservations-sign-in" },
  ];
  for (const viewport of [{ width: 320, height: 640 }, { width: 375, height: 667 }, { width: 390, height: 844 }])
    for (const { url, state, ready } of list) {
      const fixture = await open(browser, state, viewport, origin + url, ready);
      try {
        await fixture.page.waitForFunction(() => document.querySelector("#a11y-fab")?.getAttribute("aria-label"));
        const { covered, stops } = await coveredStops(fixture.page);
        assert.ok(stops > 1, `${url} ${viewport.width}: no stops`);
        assert.deepEqual(covered, [], `${url} ${viewport.width}x${viewport.height}`);
        assert.deepEqual(fixture.errors, []);
      } finally {
        await fixture.context.close();
      }
    }
});

// On a first visit the cookie banner shows without taking focus: the skip
// link stays the first stop, the banner's buttons come next, and every link
// at the end of the page, the legal and statement links included, scrolls
// into view clear of the banner and the button above it.
test("first visit: the skip link comes first and the banner covers no focused control", async (t) => {
  const { origin, browser } = await startSite(t);
  const list = [
    { url: "/login/", state: { signedIn: false }, ready: ".app-login__statement a", code: "en" },
    { url: "/he/login/", state: { signedIn: false }, ready: ".app-login__statement a", code: "he" },
    { url: "/dashboard/host/", state: { host: "active", enrolled: true, verified: true }, ready: ".manager-view:not([hidden])", code: "en" },
    { url: "/404.html", state: { signedIn: false }, ready: "main", code: "en" },
    { url: "/he/", state: { signedIn: false }, ready: "main", code: "he" },
    { url: "/contact-us/", state: { signedIn: false }, ready: "main", code: "en" },
  ];
  const sideways = [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 568, height: 320 }];
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }, ...sideways])
    for (const { url, state, ready, code } of list) {
      // Phones held sideways: the sign-in card, whose screen never scrolls.
      if (sideways.includes(viewport) && !url.endsWith("/login/")) continue;
      const fixture = await open(browser, state, viewport, origin + url, ready, { saveConsent: false });
      try {
        const { page } = fixture;
        const where = `${url} ${viewport.width}x${viewport.height}`;
        await page.waitForFunction(() => document.body.classList.contains("has-cookie-banner") && document.querySelector("#a11y-fab")?.getAttribute("aria-label"));
        const banner = page.locator(".cookie-consent");
        // The banner is announced through a status region that was in the page
        // empty before the banner showed; the dialog itself is no live region.
        assert.equal(await banner.getAttribute("aria-live"), null, `${where}: the whole dialog is a live region`);
        await page.waitForFunction(() => document.querySelector(".cookie-consent__announcer[role='status']")?.textContent.includes(document.querySelector("#cookie-consent-title").textContent), null, { timeout: 3000 }).catch(() => {});
        assert.equal(await page.evaluate(() => document.querySelector(".cookie-consent__announcer[role='status']")?.textContent.includes(document.querySelector("#cookie-consent-title").textContent)), true, `${where}: the banner is not announced`);
        assert.equal(await page.evaluate(() => document.activeElement === document.body), true, `${where}: something took focus on load`);
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement?.classList.contains("skip-link")), true, `${where}: the skip link is not first`);
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => Boolean(document.activeElement?.closest(".cookie-consent"))), true, `${where}: the banner does not follow the skip link`);
        const { covered } = await coveredStops(page);
        assert.deepEqual(covered, [], where);
        // The statement link in the page's language scrolls into view above the banner.
        const statement = page.locator("a[href]:not(#a11y-statement)").filter({ hasText: accessibilityLinkLabels[code] }).last();
        await statement.focus();
        const box = await statement.evaluate((link) => link.getBoundingClientRect().toJSON());
        const bannerBox = await banner.evaluate((node) => node.getBoundingClientRect().toJSON());
        assert.ok(box.bottom <= bannerBox.top && box.top >= 0, `${where}: the statement link stays under the banner`);
        assert.deepEqual(fixture.errors, []);
      } finally {
        await fixture.context.close();
      }
    }
});

// A phone held sideways: the open menu is entirely on screen and scrolls.
test("every page: the open menu fits a short screen", async (t) => {
  const { origin, browser } = await startSite(t);
  const list = [
    { url: "/index.html", state: { signedIn: false }, ready: "main" },
    { url: "/he/privacy-policy/", state: { signedIn: false }, ready: "main" },
    { url: "/he/office-buildings/", state: { signedIn: false }, ready: "main" },
    { url: "/shop/", state: { signedIn: false }, ready: "main" },
    { url: "/404.html", state: { signedIn: false }, ready: "main" },
    { url: "/login/", state: { signedIn: false }, ready: ".app-login__statement a" },
    { url: "/wifigate-link/", state: { signedIn: false }, ready: "#page-title" },
    { url: "/dashboard/", state: { enrolled: true, verified: true }, ready: ".product-tile" },
    { url: "/dashboard/host/", state: { host: "active", enrolled: true, verified: true }, ready: ".manager-view:not([hidden])" },
  ];
  // On a first visit too, when the cookie banner shows and lifts the button.
  for (const firstVisit of [false, true])
  for (const viewport of [{ width: 844, height: 390 }, { width: 667, height: 375 }, { width: 568, height: 320 }, { width: 1024, height: 600 }])
    for (const { url, state, ready } of list) {
      const fixture = await open(browser, state, viewport, origin + url, ready, { saveConsent: !firstVisit });
      try {
        const { page } = fixture;
        const where = `${url} ${viewport.width}x${viewport.height}${firstVisit ? " first visit" : ""}`;
        await page.waitForFunction(() => document.querySelector("#a11y-fab")?.getAttribute("aria-label"));
        // Pages without the cookie banner (the signed-in workspaces) have no first-visit state.
        if (firstVisit && !(await page.locator("script[src*='cookie-consent.js']").count())) continue;
        await page.waitForFunction((banner) => document.body.classList.contains("has-cookie-banner") === banner, firstVisit);
        await page.locator("#a11y-fab").focus();
        await page.keyboard.press("Enter");
        await page.locator("#a11y-panel.is-open").waitFor();
        await page.waitForFunction(() => getComputedStyle(document.querySelector("#a11y-panel")).transform === "matrix(1, 0, 0, 1, 0, 0)");
        const layout = await page.evaluate(() => {
          const panel = document.querySelector("#a11y-panel");
          const close = document.querySelector("#a11y-close").getBoundingClientRect();
          // Nothing, such as a sticky page header, lies over the close button.
          const top = document.elementFromPoint(close.left + close.width / 2, close.top + close.height / 2);
          return {
            panel: panel.getBoundingClientRect().toJSON(),
            close: close.toJSON(),
            closeOnTop: Boolean(top?.closest("#a11y-close")),
            scrolls: panel.scrollHeight <= panel.clientHeight || getComputedStyle(panel).overflowY === "auto",
          };
        });
        const span = `${Math.round(layout.panel.top)}..${Math.round(layout.panel.bottom)}`;
        assert.ok(layout.panel.top >= 0 && layout.panel.bottom <= viewport.height, `${where}: the menu runs off screen (${span})`);
        assert.ok(layout.close.top >= 0, `${where}: the close button is off screen`);
        assert.equal(layout.closeOnTop, true, `${where}: something covers the close button`);
        assert.equal(layout.scrolls, true, where);
        // Its last control scrolls into view inside it.
        await page.locator("#a11y-statement").focus();
        const statement = await page.locator("#a11y-statement").evaluate((link) => {
          const box = link.getBoundingClientRect();
          const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
          return { ...box.toJSON(), onTop: Boolean(top?.closest("#a11y-statement")) };
        });
        assert.ok(statement.top >= layout.panel.top && statement.bottom <= layout.panel.bottom + 1, `${where}: the statement link is out of reach`);
        assert.equal(statement.onTop, true, `${where}: something covers the statement link`);
        assert.deepEqual(fixture.errors, []);
      } finally {
        await fixture.context.close();
      }
    }
});

// While a workspace loads, or after it failed to, its main element is inert:
// the skip link leads to the loading screen and its reload link instead.
test("workspaces: the skip link leads somewhere usable while the workspace loads or failed to", async (t) => {
  const { origin, browser } = await startSite(t);
  const workspaces = [
    { url: "/dashboard/manager/", bundle: "**/js/platform-dashboard.bundle.js*", screen: "manager-loading", state: { enrolled: true, verified: true } },
    { url: "/dashboard/host/", bundle: "**/js/host-dashboard.bundle.js*", screen: "host-loading", state: { host: "active", enrolled: true, verified: true } },
  ];
  for (const { url, bundle, screen, state } of workspaces)
    for (const mode of ["loading", "failed"]) {
      const fixture = await scenario(browser, { ...state, viewport: { width: 390, height: 844 } });
      try {
        const { page } = fixture;
        await page.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
        // The bundle never arrives, or fails to.
        await page.route(bundle, (route) => (mode === "failed" ? route.abort("failed") : new Promise(() => {})));
        await page.goto(origin + url, { waitUntil: "commit" });
        await page.locator(`#${screen}`).waitFor();
        await page.waitForFunction(() => document.querySelector("#a11y-fab")?.getAttribute("aria-label"));
        const where = `${url} ${mode}`;
        assert.equal(await page.evaluate(() => document.querySelector("#main-content").closest("[inert]") !== null), true, `${where}: main is not inert`);
        await page.keyboard.press("Tab");
        assert.equal(await page.evaluate(() => document.activeElement?.classList.contains("skip-link")), true, `${where}: the skip link is not first`);
        await page.keyboard.press("Enter");
        await page.waitForFunction((id) => document.activeElement?.id === id, screen, { timeout: 2000 }).catch(() => {});
        assert.equal(await page.evaluate(() => document.activeElement?.id), screen, `${where}: the skip link leads nowhere`);
        await page.keyboard.press("Tab");
        const next = await page.evaluate((id) => Boolean(document.activeElement?.closest(`#${id} a[href]`)), screen);
        assert.equal(next, true, `${where}: the reload link does not follow`);
        // The accessibility button and its menu stay above the loading screen.
        const fabOnTop = await page.evaluate(() => {
          const box = document.querySelector("#a11y-fab").getBoundingClientRect();
          return Boolean(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest("#a11y-fab"));
        });
        assert.equal(fabOnTop, true, `${where}: the loading screen covers the accessibility button`);
        // The menu opens once the page's scripts have run (DOMContentLoaded),
        // which a bundle that never arrives holds back; after a failure it opens.
        if (mode === "failed") {
          await page.locator("#a11y-fab").click({ timeout: 3000 });
          await page.locator("#a11y-panel.is-open").waitFor();
          await page.waitForFunction(() => document.activeElement?.id === "a11y-close");
          const closeOnTop = await page.evaluate(() => {
            const box = document.querySelector("#a11y-close").getBoundingClientRect();
            return Boolean(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest("#a11y-close"));
          });
          assert.equal(closeOnTop, true, `${where}: the loading screen covers the menu`);
        }
      } finally {
        await fixture.context.close();
      }
    }
});
