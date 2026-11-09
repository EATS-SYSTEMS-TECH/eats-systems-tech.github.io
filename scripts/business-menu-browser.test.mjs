import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";

// The "For Business" product panel: hover with a short leave tolerance,
// keyboard focus, Escape, start-edge alignment in both directions, and the
// indented product links in the collapsed menu.
// The shared fixture serves directories below the root; the root page is
// requested as /index.html.
const consent = () => localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }));
async function newPage(browser, origin, options) {
  const context = await browser.newContext(options);
  await context.addInitScript(consent);
  await context.route("**/*", route =>
    route.request().resourceType() === "media" || new URL(route.request().url()).origin !== origin ? route.abort() : route.continue());
  return { context, page: await context.newPage() };
}
const panelState = page => page.evaluate(() => {
  const group = document.querySelector(".nav__group"), panel = group.querySelector(".nav__submenu");
  const list = panel.querySelector(".nav__submenu-list").getBoundingClientRect(), link = group.querySelector(".nav__group-link").getBoundingClientRect();
  const header = document.querySelector(".site-header").getBoundingClientRect();
  const style = getComputedStyle(panel);
  return { open: style.opacity === "1" && style.pointerEvents === "auto", list: { left: list.left, right: list.right, top: list.top }, link: { left: link.left, right: link.right }, headerBottom: header.bottom, viewport: innerWidth };
});
const waitOpen = (page, open) => page.waitForFunction(expected => {
  const style = getComputedStyle(document.querySelector(".nav__submenu"));
  return (style.opacity === "1" && style.pointerEvents === "auto") === expected;
}, open);

test("desktop header opens the For Business panel on hover and keyboard focus", async (t) => {
  const { origin, browser } = await startSite(t);
  const { context, page } = await newPage(browser, origin, { viewport: { width: 1440, height: 900 } });
  t.after(() => context.close());
  for (const path of ["/index.html", "/he/", "/ar/", "/he/wifigate-host/", "/shop/", "/privacy-policy/", "/he/electric-gates/"]) await t.test(path, async () => {
    await page.goto(origin + path, { waitUntil: "load" });
    await page.mouse.move(5, 600);
    assert.equal((await panelState(page)).open, false, "closed at rest");
    const link = page.locator(".nav__group-link");
    await link.hover();
    await waitOpen(page, true);
    const state = await panelState(page);
    const rtl = await page.evaluate(() => document.documentElement.dir === "rtl");
    assert.ok(Math.abs(state.list.top - state.headerBottom) <= 8, "panel starts at the header edge");
    if (rtl) assert.ok(state.list.right >= state.link.right && state.list.right - state.link.right <= 16, "RTL: panel aligned to the item's right (start) edge");
    else assert.ok(state.list.left <= state.link.left && state.link.left - state.list.left <= 16, "LTR: panel aligned to the item's left (start) edge");
    assert.ok(state.list.left >= 0 && state.list.right <= state.viewport, "panel stays on screen");
    // Moving down into the panel keeps it open; the gap is part of the group.
    const manager = page.locator(".nav__sublink").first();
    const box = await manager.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
    assert.equal((await panelState(page)).open, true, "pointer can reach the panel");
    // A brief excursion outside does not close it; a real leave does.
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 30);
    await page.waitForTimeout(80);
    assert.equal((await panelState(page)).open, true, "short leave tolerance");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(400);
    assert.equal((await panelState(page)).open, true, "re-entering cancels the close");
    await page.mouse.move(5, 600);
    await waitOpen(page, false);
    // Escape closes a hover-opened panel until the pointer leaves.
    await link.hover();
    await waitOpen(page, true);
    await page.keyboard.press("Escape");
    await waitOpen(page, false);
    await page.mouse.move(5, 600);
    await link.hover();
    await waitOpen(page, true);
    await page.mouse.move(5, 600);
    await waitOpen(page, false);
    // Keyboard: focusing the link opens the panel, Tab reaches both products.
    await page.locator(".topbar-nav > .nav__link").nth(1).focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("nav__group-link")), true);
    await waitOpen(page, true);
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "WIFIGATE Manager");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "WIFIGATE Host");
    await page.keyboard.press("Escape");
    await waitOpen(page, false);
    assert.equal(await page.evaluate(() => document.activeElement.classList.contains("nav__group-link")), true, "Escape returns focus to For Business");
    await page.keyboard.press("Tab");
    await waitOpen(page, true);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.closest(".nav__group")), null, "focus left the group");
    await waitOpen(page, false);
    // Shift+Tab back from the next item reaches Host first.
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.evaluate(() => document.activeElement.textContent), "WIFIGATE Host");
    await waitOpen(page, true);
  });
});

test("For Business still navigates and the full header fits every language", async (t) => {
  const { origin, browser } = await startSite(t);
  const { context, page } = await newPage(browser, origin, { viewport: { width: 1440, height: 900 } });
  t.after(() => context.close());
  await page.goto(origin + "/he/electric-gates/", { waitUntil: "load" });
  await page.locator(".nav__group-link").click();
  await page.waitForURL(/\/he\/#wifigate-for-business$/);
  await page.goto(origin + "/he/", { waitUntil: "load" });
  await page.locator(".nav__group-link").hover();
  await page.locator(".nav__sublink", { hasText: "WIFIGATE Manager" }).click();
  await page.waitForURL(/\/he\/wifigate-manager\/$/);
  for (const width of [1440, 1600, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const { code } of SITE_LANGUAGES) {
      await page.goto(`${origin}${code === "en" ? "/index.html" : `/${code.toLowerCase()}/`}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // The group must not move any header control: compare with the same
      // page after replacing the group by its plain link (the earlier markup).
      const result = await page.evaluate(() => {
        const measure = () => {
          const links = [...document.querySelectorAll(".topbar-nav .nav__link")].map(element => element.getBoundingClientRect());
          return {
            controls: [...document.querySelectorAll(".nav__link, .site-login__trigger, .site-account, .site-cart__trigger, .language-selector__button, .nav__logo")].filter(element => element.getClientRects().length).map(element => { const box = element.getBoundingClientRect(); return [element.className, Math.round(box.left), Math.round(box.right), Math.round(box.top + box.height / 2)]; }),
            overflow: document.documentElement.scrollWidth > innerWidth,
            oneRow: Math.max(...links.map(box => box.top + box.height / 2)) - Math.min(...links.map(box => box.top + box.height / 2)) <= 2,
            toggleHidden: getComputedStyle(document.querySelector(".nav__toggle")).display === "none",
          };
        };
        const withGroup = measure();
        const group = document.querySelector(".nav__group"), link = group.querySelector(".nav__group-link");
        group.replaceWith(link);
        link.classList.remove("nav__group-link");
        const plain = measure();
        withGroup.controls = withGroup.controls.map(([name, ...rest]) => [name.replace(" nav__group-link", ""), ...rest]);
        return { withGroup, plain };
      });
      assert.deepEqual(result.withGroup.controls, result.plain.controls, `${code} at ${width}px: header controls unchanged`);
      assert.deepEqual({ ...result.withGroup, controls: undefined }, { overflow: false, oneRow: true, toggleHidden: true, controls: undefined }, `${code} at ${width}px`);
    }
  }
});

test("collapsed menu lists the products under For Business", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const [width, touch] of [[390, true], [1024, false], [1439, false]]) {
    const { context, page } = await newPage(browser, origin, { viewport: { width, height: 915 }, hasTouch: touch });
    t.after(() => context.close());
    for (const path of ["/index.html", "/he/", "/ar/wifigate-manager/"]) {
      await page.goto(origin + path, { waitUntil: "load" });
      await page.locator(".nav__toggle").click();
      await page.waitForFunction(() => getComputedStyle(document.querySelector(".nav__links-wrapper")).opacity === "1");
      const rows = await page.evaluate(() => [...document.querySelectorAll(".topbar-nav .nav__link, .topbar-nav .nav__sublink")].map(element => {
        const box = element.getBoundingClientRect(), style = getComputedStyle(element);
        return { sub: element.classList.contains("nav__sublink"), text: element.textContent, top: box.top, height: box.height, visible: style.visibility === "visible" && Number(getComputedStyle(element.closest(".nav__submenu") || element).opacity) === 1, indentStart: document.documentElement.dir === "rtl" ? innerWidth - box.right + parseFloat(style.paddingRight) : box.left + parseFloat(style.paddingLeft) };
      }));
      const label = `${path} at ${width}px`;
      assert.deepEqual(rows.map(row => row.sub), [false, false, false, true, true, false, false, false], `${label}: products follow For Business`);
      assert.deepEqual(rows.filter(row => row.sub).map(row => row.text), ["WIFIGATE Manager", "WIFIGATE Host"]);
      assert.ok(rows.every(row => row.visible && row.height >= 32), `${label}: every row is visible and tappable`);
      assert.ok(rows[3].indentStart > rows[2].indentStart + 8, `${label}: product rows are indented from the start edge`);
      for (let index = 1; index < rows.length; index++) assert.ok(rows[index].top >= rows[index - 1].top + rows[index - 1].height - 1, `${label}: rows do not overlap`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${label}: no horizontal overflow`);
    }
    if (touch) {
      await page.goto(origin + "/he/", { waitUntil: "load" });
      await page.locator(".nav__toggle").tap();
      await page.waitForFunction(() => getComputedStyle(document.querySelector(".nav__links-wrapper")).opacity === "1");
      await page.locator(".nav__sublink", { hasText: "WIFIGATE Host" }).tap();
      await page.waitForURL(/\/he\/wifigate-host\/$/);
    }
  }
});
