import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { startSite } from "./platform-test-fixtures.mjs";

const evidence = process.env.WIFIGATE_MANAGER_CONTROL_EVIDENCE;
const types = ["gate", "dual", "group"];
const tabs = ["overview", "users", "admins", "guests", "auto", "settings", "events", "history", "rf", "system"];
const styleProperties = ["display", "padding", "gap", "borderRadius", "backgroundColor", "color", "fontSize", "lineHeight", "minHeight"];

async function fixture(t, browser, origin, { language, width, type }) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  page.setDefaultTimeout(8000);
  t.after(() => page.close());
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route(origin + "/manager-control-workspace-fixture", route => route.fulfill({
    contentType: "text/html",
    body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"><link rel="stylesheet" href="/css/dashboard-header.css"></head><body data-product="manager" class="platform-page"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main></body></html>`,
  }));
  await page.goto(origin + "/manager-control-workspace-fixture");
  await page.evaluate(async ({ language, type }) => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    const { ManagerExampleConnection } = await import("/js/manager-example-connection.js");
    const { createManagerExampleData, managerExampleSystems } = await import("/js/manager-example-data.js");
    const template = managerExampleSystems[["gate", "dual", "group"].indexOf(type)];
    const data = createManagerExampleData();
    window.controlEvidence = { apiCalls: [], realConnections: 0, realOpenings: [], commands: [], authentications: 0, physicalConnections: 0 };
    window.WebSocket = class {
      constructor() {
        window.controlEvidence.physicalConnections++;
        throw new Error("Control fixtures never create a physical connection");
      }
    };
    class FixtureConnection extends ManagerExampleConnection {
      constructor(options) {
        super({ data, system: template, onState: options.onState });
        window.controlEvidence.realConnections++;
      }
      async open(gate) {
        window.controlEvidence.realOpenings.push(gate);
        return super.open(gate);
      }
      async command(command, payload) {
        window.controlEvidence.commands.push({ command, payload, gate: this.gateId });
        return super.command(command, payload);
      }
    }
    const system = { ...template, id: "fixture-real-" + type, status: "active", version: 1 };
    window.dashboard = createManagerDashboard({
      root: document.querySelector("#root"), user: { uid: "control-fixture" }, language,
      Connection: FixtureConnection,
      ensureRecent: async () => { window.controlEvidence.authentications++; },
      api: async (route, method = "GET") => {
        window.controlEvidence.apiCalls.push({ route, method });
        if (method !== "GET") throw new Error("Control fixtures never mutate a customer account");
        return route === "/me"
          ? { role: "user", account: { id: "control-account" }, organizations: [] }
          : { items: route.startsWith("/systems?") ? [system] : [], nextCursor: null };
      },
    });
    await window.dashboard.ready;
  }, { language, type });
  return { page, errors };
}

async function ready(page, tab = "overview") {
  await page.locator(`[data-tab="${tab}"][aria-selected="true"]`).waitFor();
  await page.waitForFunction(() =>
    document.querySelector(".manager-view")?.getAttribute("aria-busy") === "false" &&
    document.querySelector("#manager-content")?.childElementCount > 0 &&
    !document.querySelector(".manager-connection-dialog"),
  );
}

async function noPageOverflow(page, label) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, label);
}

async function touchControl(control, width, label) {
  await control.scrollIntoViewIfNeeded();
  const box = await control.boundingBox();
  assert.ok(box && box.height >= 44 && box.width >= 44, `${label}: touch target at least 44 px`);
  assert.ok(box.x >= -1 && box.x + box.width <= width + 1, `${label}: fits the viewport`);
}

async function snapshotStyles(page) {
  return page.locator(".manager-workspace-head, #manager-tabs, #manager-content .manager-control-overview, #manager-content .manager-primary-control, #manager-content .manager-facts, #manager-content .manager-overview-details").evaluateAll(
    (elements, properties) => elements.map(element => {
      const css = getComputedStyle(element);
      return { className: element.className, styles: Object.fromEntries(properties.map(property => [property, css[property]])) };
    }), styleProperties,
  );
}

test("Manager Gate, Dual Control and group controls are responsive, deliberate and identical for real and sample workspaces", async t => {
  const { origin, browser } = await startSite(t);
  if (evidence) await mkdir(evidence, { recursive: true });
  const receipts = [];
  for (const language of ["he", "en"]) for (const width of [320, 390, 1440]) for (const type of types) {
    await t.test(`${type} ${language} ${width}px`, async t => {
      const { page, errors } = await fixture(t, browser, origin, { language, width, type });
      const he = language === "he";
      const copy = (h, e) => he ? h : e;
      const realCard = page.locator(".manager-view > .manager-grid .manager-system");
      await realCard.getByRole("button", { name: copy("פתיחת סביבת ניהול", "Open workspace"), exact: true }).click();
      await ready(page);
      const workspace = page.locator(".manager-control-workspace");
      await workspace.waitFor();
      const content = page.locator("#manager-content");
      const finish = page.getByRole("button", { name: copy("סיום וחזרה", "End and return"), exact: true });
      const open = content.getByRole("button", { name: copy("פתיחת שער", "Open gate"), exact: true });
      assert.equal(await workspace.getByRole("tab").count(), 10);
      if (width >= 851) {
        assert.equal(await page.locator("#manager-tabs").evaluate(element => element.scrollWidth <= element.clientWidth), true, "desktop shows every section without horizontal clipping");
        const navigation = await page.locator("#manager-tabs").boundingBox();
        for (const tab of tabs) {
          const bounds = await page.locator(`[data-tab="${tab}"]`).boundingBox();
          assert.ok(bounds && bounds.x >= navigation.x - 1 && bounds.x + bounds.width <= navigation.x + navigation.width + 1, `${tab} is fully visible in desktop navigation`);
        }
      }
      assert.equal(await open.count(), 1, "the currently selected gate has one deliberate primary opening action");
      await touchControl(finish, width, "End and return");
      await touchControl(open, width, "Open gate");
      await noPageOverflow(page, "the complete workspace fits the viewport");
      assert.doesNotMatch(await content.innerText(), /Flash|flashVariantMb|secret|privateKey|credentialNonce/);
      assert.equal(await content.locator(".manager-overview-metrics dt").count(), 4);
      assert.equal(await content.locator(".manager-overview-metrics dd").count(), 4);
      assert.equal((await content.locator('[data-metric="maxUsers"] dd').innerText()).replace(/\D/g, ""), type === "dual" ? "1000" : "5000", "capacity is actual reported data");
      const details = content.locator(".manager-overview-details");
      assert.equal(await details.evaluate(element => element.open), false, "technical system facts start collapsed");
      await details.locator("summary").focus();
      await page.keyboard.press("Enter");
      assert.equal(await details.evaluate(element => element.open), true, "technical details remain keyboard accessible");
      await details.locator(".manager-detail-facts").waitFor();
      assert.doesNotMatch(await details.textContent(), /Flash|flashVariantMb|secret|privateKey|credentialNonce/);
      await details.locator("summary").click();
      const reference = await snapshotStyles(page);
      assert.equal(reference.length, 6, "the comparison covers the header, tabs, opening panel, metrics and details");
      if (evidence) await page.screenshot({ path: path.join(evidence, `controls-${type}-${language}-${width}.png`), fullPage: true });
      const counts = type === "gate" ? 1 : type === "dual" ? 2 : 4;
      const gatePicker = page.getByLabel(copy("בחירת שער", "Choose gate"), { exact: true });
      assert.equal(await gatePicker.count(), counts === 1 ? 0 : 1);
      if (counts > 1) {
        assert.equal(await gatePicker.locator("option").count(), counts);
        await touchControl(gatePicker, width, "Choose gate");
        const gate = await gatePicker.locator("option").last().getAttribute("value");
        await gatePicker.selectOption(gate);
        await ready(page);
        assert.equal(await page.evaluate(() => window.controlEvidence.realOpenings.at(-1)), gate);
        assert.equal(await gatePicker.inputValue(), gate, "gate selection and authenticated transport target agree");
        assert.equal((await content.locator('[data-metric="users"] dd').innerText()).replace(/\D/g, ""), type === "dual" ? "120" : "58", "visible summary belongs to the newly selected gate");
        await gatePicker.selectOption(await gatePicker.locator("option").first().getAttribute("value"));
        await ready(page);
      }
      assert.equal(await page.evaluate(() => window.controlEvidence.commands.filter(call => call.command === "ADMIN_REMOTE_OPEN").length), 0);
      await open.click();
      const dialog = page.getByRole("dialog");
      const cancel = dialog.getByRole("button", { name: copy("ביטול", "Cancel"), exact: true });
      await cancel.waitFor();
      assert.equal(await cancel.evaluate(element => document.activeElement === element), true, "confirmation defaults to the safe action");
      await cancel.click();
      await dialog.waitFor({ state: "detached" });
      assert.equal(await open.evaluate(element => document.activeElement === element), true, "cancelling restores the triggering control's focus");
      assert.equal(await page.evaluate(() => window.controlEvidence.commands.filter(call => call.command === "ADMIN_REMOTE_OPEN").length), 0);
      if (type === "gate") {
        const overview = page.locator('[data-tab="overview"]');
        assert.equal(await page.locator('[role="tab"][tabindex="0"]').count(), 1, "tabs provide a single keyboard entry point");
        await overview.focus();
        await page.keyboard.press("End");
        assert.equal(await page.locator(":focus").getAttribute("data-tab"), "system");
        assert.equal(await overview.getAttribute("aria-selected"), "true", "moving tab focus does not fetch or activate a tab");
        await page.keyboard.press("Enter");
        await ready(page, "system");
        assert.equal(await page.locator(":focus").getAttribute("data-tab"), "system", "activation restores focus after rendering");
        await page.keyboard.press("Home");
        assert.equal(await page.locator(":focus").getAttribute("data-tab"), "overview");
        await page.keyboard.press("Space");
        await ready(page);
        await page.keyboard.press("ArrowRight");
        assert.ok(tabs.slice(1).includes(await page.locator(":focus").getAttribute("data-tab")), "arrow navigation works in both reading directions");
        assert.equal(await overview.getAttribute("aria-selected"), "true");
      }
      // Reaching and leaving every data tab cannot issue a physical operation.
      for (const tab of tabs) {
        await page.locator(`[data-tab="${tab}"]`).click();
        await ready(page, tab);
        await noPageOverflow(page, `${type} ${language} ${width}: ${tab} stays within the page`);
      }
      await page.locator('[data-tab="overview"]').click();
      await ready(page);
      assert.equal(await page.evaluate(() => window.controlEvidence.commands.filter(call => call.command === "ADMIN_REMOTE_OPEN").length), 0);
      if (counts > 1) {
        await gatePicker.selectOption(await gatePicker.locator("option").last().getAttribute("value"));
        await ready(page);
      }
      await open.click();
      await page.getByRole("dialog").getByRole("button", { name: copy("אישור", "Confirm"), exact: true }).click();
      await page.waitForFunction(() => window.controlEvidence.commands.some(call => call.command === "ADMIN_REMOTE_OPEN"));
      const operation = await page.evaluate(() => window.controlEvidence.commands.filter(call => call.command === "ADMIN_REMOTE_OPEN"));
      assert.equal(operation.length, 1, "confirmation sends one operation without replay");
      assert.equal(operation[0].gate, await page.evaluate(() => window.controlEvidence.realOpenings.at(-1)), "operation targets the selected gate");
      assert.deepEqual(operation[0].payload, { mode: "METHOD", expectedGateCommand: "PULSE_AFTER_PULSE" }, "the existing secure command contract is preserved");
      await finish.click();
      await page.locator(".manager-examples > summary").click();
      await page.locator(`[data-example-system="example-manager-${type}"]`).getByRole("button").click();
      await ready(page);
      await page.locator(".manager-simulation-note").waitFor();
      assert.deepEqual(await snapshotStyles(page), reference, "sample controls use the exact real workspace layout and styling");
      const before = await page.evaluate(() => structuredClone(window.controlEvidence));
      await open.click();
      await page.getByRole("dialog").getByRole("button", { name: copy("אישור", "Confirm"), exact: true }).click();
      await page.getByText(copy("הפעולה בוצעה בסימולציה. לא הופעל שער פיזי.", "Action completed in the simulation. No physical gate was activated."), { exact: true }).waitFor();
      assert.deepEqual(await page.evaluate(() => window.controlEvidence), before, "sample operation cannot invoke real transport, account APIs or authentication");
      assert.equal(await page.evaluate(() => window.controlEvidence.physicalConnections), 0);
      await noPageOverflow(page, "sample controls fit the same viewport");
      if (evidence) await page.screenshot({ path: path.join(evidence, `controls-${type}-${language}-${width}.png`), fullPage: true });
      receipts.push({ type, language, width, tabs: tabs.length, sampleStyleParity: true, safeCancellation: true, physicalConnections: 0 });
      assert.deepEqual(errors, []);
      await page.evaluate(() => window.dashboard.close());
      assert.equal(await page.locator(".manager-control-workspace, dialog").count(), 0);
    });
  }
  if (evidence) await writeFile(path.join(evidence, "manager-controls-responsive-receipt.json"), JSON.stringify({ cases: receipts }, null, 2) + "\n");
});
