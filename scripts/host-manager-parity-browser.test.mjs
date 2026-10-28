import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startHostSite, openWorkspace, organization, system, loaded, requests } from "./lib/host-booking-site.mjs";

const evidence = process.env.WIFIGATE_HOST_PARITY_SCREENSHOTS;
const properties = ["display", "boxSizing", "flexDirection", "alignItems", "justifyContent", "gridTemplateColumns", "gap", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "borderRadius", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "minHeight", "textAlign"];
const names = language => language === "he" ? ["שער החניון", "כניסה ויציאה", "מתחם העסקים"] : ["Car park gate", "Entry and exit", "Business campus"];
const systems = language => ["gate", "dual-control", "group"].map((type, index) => ({ ...system("system-" + index, names(language)[index], type), systemIds: Array.from({ length: [1, 2, 3][index] }, (_, i) => `physical-${index}-${i}`), linkedOrganization: null }));

async function managerFixture(t, site, language, width) {
  const context = await site.browser.newContext({ viewport: { width, height: 1000 } });
  t.after(() => context.close());
  const page = await context.newPage(), errors = [];
  page.setDefaultTimeout(7000);
  page.on("pageerror", error => errors.push(error.message));
  let html = await readFile(new URL("../dashboard/manager/index.html", import.meta.url), "utf8");
  html = html.replace(/<script[\s\S]*?<\/script>/g, "");
  await page.route("**/*", route => {
    const url = new URL(route.request().url());
    if (url.origin !== site.origin) return route.abort();
    if (url.pathname === "/dashboard/manager/") return route.fulfill({ contentType: "text/html", body: html });
    return route.continue();
  });
  await page.goto(site.origin + "/dashboard/manager/" + (language === "he" ? "?lang=he" : ""));
  await page.evaluate(async ({ language, records }) => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    for (const node of document.querySelectorAll(".platform-heading,#platform-status,#platform-retry,#product-grid,#platform-security,#product-title")) node.hidden = true;
    document.querySelector("#product-workspace").hidden = false;
    window.fixtureCalls = [];
    window.physicalConnections = 0;
    window.WebSocket = class { constructor() { window.physicalConnections++; throw new Error("No physical connections in a presentation fixture"); } };
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    window.dashboard = createManagerDashboard({ root: document.querySelector("#manager-root"), user: { uid: "fixture-user" }, language, api: async (route, method = "GET") => {
      window.fixtureCalls.push({ route, method });
      if (method !== "GET") throw new Error("Presentation fixtures never mutate records");
      if (route === "/me") return { role: "user", account: { id: "fixture-account" }, organizations: [{ id: "org", name: "Harbour organization", role: "owner" }] };
      return { items: route.startsWith("/systems?") ? records : [], nextCursor: null };
    } });
    await window.dashboard.ready;
    const { createManagerDialog } = await import("/js/manager-dialog.js");
    window.dialogs = createManagerDialog({ language });
    await document.fonts.ready;
  }, { language, records: systems(language) });
  await page.locator(".manager-view > .manager-grid .manager-system").first().waitFor();
  return { page, errors };
}

async function measure(locator) {
  return locator.evaluate((node, properties) => {
    const style = getComputedStyle(node), box = node.getBoundingClientRect();
    return { style: Object.fromEntries(properties.map(key => [key, style[key]])), width: Math.round(box.width * 100) / 100, height: Math.round(box.height * 100) / 100 };
  }, properties);
}
async function compare(manager, host, referenceSelector, hostSelector = referenceSelector, { height = false } = {}) {
  const reference = await measure(manager.locator(referenceSelector).first()), actual = await measure(host.locator(hostSelector).first());
  assert.deepEqual(actual.style, reference.style, `${referenceSelector}: shared geometry and typography`);
  assert.ok(Math.abs(actual.width - reference.width) <= 1, `${referenceSelector}: width ${actual.width} vs ${reference.width}`);
  if (height) assert.ok(Math.abs(actual.height - reference.height) <= 1, `${referenceSelector}: height ${actual.height} vs ${reference.height}`);
  return { manager: reference, host: actual };
}
async function contrast(locator) {
  return locator.evaluate(node => {
    const style = getComputedStyle(node);
    const luminance = color => { const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }); return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722; };
    const foreground = luminance(style.color), background = luminance(style.backgroundColor);
    return { color: style.color, background: style.backgroundColor, ratio: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
  });
}

test("Host uses production Manager layout and shared components with Host colors in Hebrew and English", async t => {
  const site = await startHostSite(t);
  for (const language of ["he", "en"]) for (const width of [320, 390, 1440]) {
    await t.test(`${language} ${width}: production shell, card, disclosures, picker and dialog`, async t => {
      const manager = await managerFixture(t, site, language, width);
      const host = await openWorkspace(t, site, { plan: "user", organizations: [organization("org", "Harbour organization", "owner")], mySystems: systems(language) }, { query: language === "he" ? "?lang=he" : "", viewport: { width, height: 1000 }, real: true });
      host.page.setDefaultTimeout(7000);
      await loaded(host.page, "my-systems");
      await host.page.evaluate(async () => { window.physicalConnections = 0; window.WebSocket = class { constructor() { window.physicalConnections++; throw new Error("No physical connections in a presentation fixture"); } }; await document.fonts.ready; });
      const report = { language, width, components: {} };
      try {
        // Match the production header artwork as well as the workspace.
        // Both pages use the same logo asset; controls keep their own auth
        // fixture state, so compare the unambiguous visible artwork box.
        const logoBox = locator => locator.evaluate(node => { const box = node.getBoundingClientRect(); return { width: box.width, height: box.height }; });
        const managerLogo = await logoBox(manager.page.locator(".platform-header .brand img")), hostLogo = await logoBox(host.page.locator(".host-topbar .brand img"));
        assert.ok(Math.abs(managerLogo.width - hostLogo.width) <= 1 && Math.abs(managerLogo.height - hostLogo.height) <= 1, `header logo matches Manager: ${JSON.stringify({ managerLogo, hostLogo })}`);
        report.components.headerLogo = { manager: managerLogo, host: hostLogo };
        for (const selector of [".manager-shell", ".manager-nav", ".manager-main", ".manager-nav-title"]) report.components[selector] = await compare(manager.page, host.page, selector);
        const navLabel = language === "he" ? "המערכות שלי" : "My systems";
        const managerNav = manager.page.locator(".manager-nav").getByRole("button", { name: navLabel, exact: true }), hostNav = host.page.locator("#host-section-navigation").getByRole("button", { name: navLabel, exact: true });
        assert.deepEqual(await measure(hostNav), await measure(managerNav), "selected sidebar control uses identical geometry");
        const managerCards = manager.page.locator(".manager-view > .manager-grid .manager-system"), hostCards = host.page.locator('[data-workspace-view="my-systems"] .my-systems > .manager-grid .manager-system');
        assert.equal(await hostCards.count(), 3);
        for (let index = 0; index < 3; index++) {
          const reference = managerCards.nth(index), actual = hostCards.nth(index);
          assert.deepEqual(await measure(actual), await measure(reference), `Gate/Dual Control/Group ${index} use identical card geometry`);
          for (const inner of [".manager-icon", "h4", ".manager-muted", ".manager-system-actions", "button"]) assert.deepEqual(await measure(actual.locator(inner).first()), await measure(reference.locator(inner).first()), `${index} ${inner}: same card component`);
          assert.equal(await actual.locator(":scope > .manager-system-actions button").count(), 1, "one primary workspace action per card");
        }
        const primary = hostCards.first().locator(":scope > .manager-system-actions button");
        const hostColor = await contrast(primary), managerColor = await contrast(managerCards.first().locator("button"));
        assert.notEqual(hostColor.background, managerColor.background, "Host keeps its own product color");
        assert.equal(hostColor.color, "rgb(255, 255, 255)");
        assert.ok(hostColor.ratio >= 4.5, "primary text contrast");
        await primary.hover();
        assert.ok((await contrast(primary)).ratio >= 4.5, "hover text contrast");
        await primary.focus();
        assert.notEqual(await primary.evaluate(node => getComputedStyle(node).outlineStyle), "none", "visible keyboard focus");
        for (const selector of [".manager-examples", ".manager-examples > summary", ".manager-setup-guide", ".manager-setup-guide > summary"]) report.components[selector] = await compare(manager.page, host.page, selector, selector, { height: selector.endsWith("summary") });
        for (const page of [manager.page, host.page]) {
          const examples = page.locator(".manager-examples > summary");
          await examples.click();
          assert.equal(await page.locator(".manager-examples .manager-system").count(), 3);
          await examples.click();
          const setup = page.locator(".manager-setup-guide > summary");
          await setup.click();
          assert.equal(await page.locator(".manager-setup-guide").getAttribute("open"), "");
          await setup.click();
        }
        // The Host workspace has an authorized selected organization while
        // Manager's personal inventory starts unselected. Instantiate the same
        // production picker with equal selected metadata before comparing its
        // content-dependent intrinsic width; full-shell geometry was compared
        // above without any fixture replacement.
        await manager.page.evaluate(async language => {
          const original = document.querySelector(".manager-organization-picker");
          const panel = document.getElementById(original.querySelector("button").getAttribute("aria-controls"));
          const { createManagerOrganizationPicker } = await import("/js/manager-organization-picker.js");
          const picker = createManagerOrganizationPicker({ organizations: [{ id: "org", name: "Harbour organization", role: "owner" }], selectedId: "org", language, onSelect: () => {} });
          original.replaceWith(picker.root);
          panel.remove();
        }, language);
        report.components.picker = await compare(manager.page, host.page, ".manager-organization-picker-trigger", undefined, { height: true });
        for (const page of [manager.page, host.page]) await page.locator(".manager-organization-picker-trigger").click();
        report.components.pickerPanel = await compare(manager.page, host.page, ".manager-organization-picker-panel");
        for (const page of [manager.page, host.page]) await page.keyboard.press("Escape");
        await manager.page.evaluate(() => { void window.dialogs.confirm("Fixture confirmation for comparison."); });
        await host.page.evaluate(async () => {
          const { openSystemDialog } = await import("/js/host-system-cards.js");
          openSystemDialog({ container: document.querySelector('[data-workspace-view="my-systems"] .my-systems'), title: "Fixture confirmation", text: "Fixture confirmation for comparison.", submitLabel: "Confirm", submit: async () => { throw new Error("Presentation comparison must never submit"); } });
        });
        report.components.dialog = await compare(manager.page, host.page, ".manager-confirm-dialog[open]");
        report.components.dialogActions = await compare(manager.page, host.page, ".manager-confirm-dialog[open] .manager-confirm-actions");
        if (evidence) {
          await mkdir(evidence, { recursive: true });
          for (const [product, page] of [["manager", manager.page], ["host", host.page]]) await page.screenshot({ path: path.join(evidence, `parity-dialog-${product}-${language}-${width}.png`), fullPage: true });
        }
        for (const page of [manager.page, host.page]) {
          const cancel = page.getByRole("dialog").getByRole("button", { name: language === "he" ? "ביטול" : "Cancel", exact: true });
          assert.equal(await cancel.evaluate(node => node === document.activeElement), true, "safe action receives initial focus");
          await page.keyboard.press("Escape");
          assert.equal(await page.locator("dialog[open]").count(), 0);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
          assert.equal(await page.evaluate(() => window.physicalConnections), 0);
        }
        assert.equal((await requests(host.page)).some(call => !call.call.startsWith("GET ")), false, "no customer mutation, booking creation or physical command");
        assert.equal((await manager.page.evaluate(() => window.fixtureCalls)).some(call => call.method !== "GET" || /connection-request/.test(call.route)), false);
        assert.deepEqual(manager.errors, []);
        assert.deepEqual(host.errors, []);
        if (evidence) {
          await writeFile(path.join(evidence, `geometry-${language}-${width}.json`), JSON.stringify(report, null, 2) + "\n");
          for (const [product, page] of [["manager", manager.page], ["host", host.page]]) await page.screenshot({ path: path.join(evidence, `parity-${product}-${language}-${width}.png`), fullPage: true });
        }
      } finally { await Promise.all([manager.page.close(), host.page.close()]); }
    });
  }
});
