import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startSite } from "./platform-test-fixtures.mjs";

const evidence = process.env.WIFIGATE_PAY_SCREENSHOTS;
const ids = ["a", "c", "d"].map(value => value.repeat(64));
const properties = [
  "display", "boxSizing", "flexDirection", "alignItems", "justifyContent",
  "gridTemplateColumns", "gap", "paddingTop", "paddingRight", "paddingBottom",
  "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth",
  "borderLeftWidth", "borderRadius", "fontFamily", "fontSize", "fontWeight",
  "lineHeight", "letterSpacing", "minHeight", "textAlign",
];

async function fixture(browser, origin, product, language, width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.physicalConnections = 0;
    window.WebSocket = class {
      constructor() {
        window.physicalConnections++;
        throw new Error("This visual fixture must not connect to a physical system");
      }
    };
  });
  await page.route(origin + "/pay-manager-parity", route => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/${product === "pay" ? "pay-dashboard" : "manager-dashboard"}.css"><link rel="stylesheet" href="/css/dashboard-header.css"></head><body data-product="${product}" class="platform-page"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>`,
  }));
  await page.goto(origin + "/pay-manager-parity");
  await page.evaluate(async ({ product, language, ids }) => {
    const organizations = [{ id: "fixture-org", name: "Harbour organization", role: "owner" }];
    const systems = ["gate", "dual-control", "group"].map((type, index) => ({
      id: ids[index], type,
      name: language === "he" ? ["שער החניון", "כניסה ויציאה", "מתחם העסקים"][index] : ["Car park gate", "Entry and exit", "Business campus"][index],
      targetId: "fixture-gate", systemIds: type === "group" ? ["fixture-1", "fixture-2", "fixture-3"] : ["fixture-gate"],
      status: "active", version: 1, organization: null,
      permissions: { canConfigure: true, canRemove: true, canAssignOrganization: true },
      capabilities: { paymentModes: ["single-entry", "metered", "timed"], paymentsEnabled: false, physicalOpening: false },
      config: { displayName: "Harbour entrance", description: "Visitor parking entrance", currency: "ILS", priceMinor: 1200, graceMinutes: 10, maxSessionMinutes: 1440, accessMode: "single-entry", validityMin: 15, windowMin: 60, hourlyRateMinor: 800, dailyCap: 5000, enabled: false },
      publicPoint: { id: "b".repeat(64), url: `/pay/point/?id=${"b".repeat(64)}`, status: "preview_only" },
    }));
    window.fixtureCalls = [];
    if (product === "manager") {
      const { createManagerDashboard } = await import("/js/manager-dashboard.js");
      window.dashboard = createManagerDashboard({
        root: document.querySelector("#root"), user: { uid: "fixture-user" }, language,
        api: async (route, method = "GET") => {
          window.fixtureCalls.push({ route, method });
          if (method !== "GET") throw new Error("Visual fixtures never perform mutations");
          return route === "/me"
            ? { role: "user", account: { id: "fixture-account" }, organizations }
            : { items: route.startsWith("/systems?") ? systems : [], nextCursor: null };
        },
      });
      await window.dashboard.ready;
      const { createManagerDialog } = await import("/js/manager-dialog.js");
      window.dialogs = createManagerDialog({ language });
    } else {
      const { createPayDashboard } = await import("/js/pay-dashboard.js");
      window.dashboard = createPayDashboard({
        root: document.querySelector("#root"), user: { uid: "fixture-user" }, language,
        api: async (route, method = "GET") => {
          window.fixtureCalls.push({ route, method });
          if (method !== "GET") throw new Error("Visual fixtures never perform mutations");
          if (route === "/api/v1/pay/me") return { user: { uid: "fixture-user" }, role: "user", canManageSystems: true, uploadEnabled: true, paymentsEnabled: false, organizations };
          if (route.startsWith("/api/v1/pay/systems?")) return { items: systems, nextCursor: null, paymentsEnabled: false };
          const selected = systems.find(system => route === `/api/v1/pay/systems/${system.id}`);
          if (selected) return { system: selected, paymentsEnabled: false };
          throw new Error("Unexpected Pay visual-fixture route: " + route);
        },
      });
    }
    await document.fonts.ready;
  }, { product, language, ids });
  await page.locator(".manager-view > .manager-grid .manager-system").first().waitFor();
  return { page, errors };
}

async function measure(locator) {
  return locator.evaluate((node, properties) => {
    const style = getComputedStyle(node), box = node.getBoundingClientRect();
    return {
      style: Object.fromEntries(properties.map(key => [key, style[key]])),
      width: Math.round(box.width * 100) / 100,
      height: Math.round(box.height * 100) / 100,
    };
  }, properties);
}

async function compare(manager, pay, selector, label, { height = false } = {}) {
  const reference = await measure(manager.locator(selector).first());
  const actual = await measure(pay.locator(selector).first());
  assert.deepEqual(actual.style, reference.style, `${label}: shared computed geometry and typography`);
  assert.ok(Math.abs(actual.width - reference.width) <= 1, `${label}: width ${actual.width} vs ${reference.width}`);
  if (height) assert.ok(Math.abs(actual.height - reference.height) <= 1, `${label}: height ${actual.height} vs ${reference.height}`);
  return { manager: reference, pay: actual };
}

async function contrast(locator) {
  return locator.evaluate(node => {
    const style = getComputedStyle(node);
    const luminance = color => {
      const channels = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
        value /= 255;
        return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
      });
      return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const foreground = luminance(style.color), background = luminance(style.backgroundColor);
    return { color: style.color, background: style.backgroundColor, ratio: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
  });
}

test("Pay shares production Manager component geometry in both languages at phone and desktop widths", async t => {
  const { browser, origin } = await startSite(t);
  for (const language of ["he", "en"]) for (const width of [320, 390, 1440]) {
    await t.test(`${language} ${width}: shell, navigation, cards, disclosures, picker and dialog`, async () => {
      const manager = await fixture(browser, origin, "manager", language, width);
      const pay = await fixture(browser, origin, "pay", language, width);
      const report = { language, width, components: {} };
      try {
        for (const selector of [".manager-shell", ".manager-nav", ".manager-main", ".manager-view", ".manager-view > .manager-grid", ".manager-nav-title"]) {
          report.components[selector] = await compare(manager.page, pay.page, selector, selector);
        }
        const navLabel = language === "he" ? "המערכות שלי" : "My systems";
        const managerNav = manager.page.locator(".manager-nav").getByRole("button", { name: navLabel, exact: true });
        const payNav = pay.page.locator(".manager-nav").getByRole("button", { name: navLabel, exact: true });
        assert.deepEqual(await measure(payNav), await measure(managerNav), "selected navigation target geometry");
        const realCards = ".manager-view > .manager-grid .manager-system";
        assert.equal(await pay.page.locator(realCards).count(), 3, "Gate, Dual Control and Group retain the same inventory layout");
        for (let index = 0; index < 3; index++) {
          const reference = manager.page.locator(realCards).nth(index), actual = pay.page.locator(realCards).nth(index);
          assert.deepEqual(await measure(actual), await measure(reference), `type ${index}: same card geometry`);
          for (const inner of [".manager-icon", "h4", ".manager-muted", ".manager-system-actions", "button"]) {
            assert.deepEqual(await measure(actual.locator(inner)), await measure(reference.locator(inner)), `type ${index} ${inner}: same inner geometry`);
          }
          assert.equal(await actual.getByRole("button").count(), 1, "one primary workspace action per inventory card");
        }
        const primary = page => page.locator(realCards).first().getByRole("button");
        const managerColor = await contrast(primary(manager.page)), payColor = await contrast(primary(pay.page));
        assert.notEqual(payColor.background, managerColor.background, "Pay keeps its own product accent");
        assert.equal(payColor.color, "rgb(255, 255, 255)");
        assert.ok(payColor.ratio >= 4.5, "Pay primary text has readable contrast");
        await primary(pay.page).hover();
        assert.ok((await contrast(primary(pay.page))).ratio >= 4.5, "Pay hover text stays readable");
        await primary(pay.page).focus();
        assert.notEqual(await primary(pay.page).evaluate(node => getComputedStyle(node).outlineStyle), "none", "keyboard focus remains visible");

        for (const selector of [".manager-examples", ".manager-examples > summary", ".manager-setup-guide", ".manager-setup-guide > summary"]) {
          report.components[selector] = await compare(manager.page, pay.page, selector, selector, { height: selector.endsWith("summary") });
        }
        for (const page of [manager.page, pay.page]) {
          const summary = page.locator(".manager-examples > summary");
          await summary.click();
          assert.equal(await page.locator(".manager-examples").getAttribute("open"), "");
          assert.equal(await page.locator(".manager-examples .manager-system").count(), 3);
          await summary.click();
          assert.equal(await page.locator(".manager-examples").getAttribute("open"), null);
          const setup = page.locator(".manager-setup-guide > summary");
          await setup.click();
          assert.equal(await page.locator(".manager-setup-guide").getAttribute("open"), "");
          await setup.click();
        }
        report.components.picker = await compare(manager.page, pay.page, ".manager-organization-picker-trigger", "organization picker", { height: true });
        for (const page of [manager.page, pay.page]) await page.locator(".manager-organization-picker-trigger").click();
        report.components.pickerPanel = await compare(manager.page, pay.page, ".manager-organization-picker-panel", "organization picker popup");
        for (const page of [manager.page, pay.page]) await page.keyboard.press("Escape");

        await manager.page.evaluate(() => { void window.dialogs.confirm("Fixture confirmation for comparison."); });
        await pay.page.locator(realCards).first().getByRole("button").click();
        await pay.page.locator(".pay-system-actions summary").click();
        await pay.page.getByRole("button", { name: language === "he" ? "ניתוק מ־Pay" : "Unlink from Pay", exact: true }).click();
        await pay.page.locator(".manager-confirm-dialog[open]").waitFor();
        report.components.dialog = await compare(manager.page, pay.page, ".manager-confirm-dialog", "confirmation dialog");
        report.components.dialogActions = await compare(manager.page, pay.page, ".manager-confirm-actions", "confirmation actions");
        if (evidence) {
          await mkdir(evidence, { recursive: true });
          for (const [product, page] of [["manager", manager.page], ["pay", pay.page]]) {
            await page.screenshot({ path: path.join(evidence, `parity-dialog-${product}-${language}-${width}.png`), fullPage: true });
          }
        }
        for (const page of [manager.page, pay.page]) {
          const cancel = page.getByRole("dialog").getByRole("button", { name: language === "he" ? "ביטול" : "Cancel", exact: true });
          assert.equal(await cancel.evaluate(node => node === document.activeElement), true, "confirmations initially focus the safe action");
          await page.keyboard.press("Escape");
          assert.equal(await page.locator("dialog[open]").count(), 0);
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "no horizontal overflow");
          const calls = await page.evaluate(() => window.fixtureCalls);
          assert.equal(calls.some(call => call.method !== "GET" || /charge|checkout|redeem|connection-request/.test(call.route)), false, "visual interactions never charge, open or request a physical connection");
          assert.equal(await page.evaluate(() => window.physicalConnections), 0);
        }
        assert.deepEqual(manager.errors, []);
        assert.deepEqual(pay.errors, []);
        if (evidence) {
          await mkdir(evidence, { recursive: true });
          await writeFile(path.join(evidence, `geometry-${language}-${width}.json`), JSON.stringify(report, null, 2) + "\n");
          for (const [product, page] of [["manager", manager.page], ["pay", pay.page]]) {
            if (product === "pay") await page.getByRole("button", { name: navLabel, exact: true }).click();
            await page.screenshot({ path: path.join(evidence, `parity-${product}-${language}-${width}.png`), fullPage: true });
          }
        }
      } finally {
        await Promise.all([manager.page.close(), pay.page.close()]);
      }
    });
  }
});
