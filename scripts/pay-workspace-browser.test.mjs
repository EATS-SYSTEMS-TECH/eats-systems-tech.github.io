import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { scenario, startSite } from "./platform-test-fixtures.mjs";

const ID = "a".repeat(64), PUBLIC = "b".repeat(64), OTHER = "c".repeat(64);
const config = {
  displayName: "Harbour entrance", description: "Visitor parking entrance", currency: "ILS", priceMinor: 1200,
  graceMinutes: 10, maxSessionMinutes: 1440, accessMode: "single-entry", validityMin: 15, windowMin: 60,
  hourlyRateMinor: 800, dailyCap: 5000, enabled: false,
};
const system = () => ({ id: ID, type: "gate", name: "Harbour gate", targetId: "fixture-gate", systemIds: ["fixture-gate"], status: "active", version: 1, organization: null, permissions: { canConfigure: true, canRemove: true, canAssignOrganization: true }, capabilities: { paymentModes: ["single-entry", "metered", "timed"], paymentsEnabled: false, physicalOpening: false }, config: { ...config }, publicPoint: { id: PUBLIC, url: `/pay/point/?id=${PUBLIC}`, status: "preview_only" } });
const evidence = process.env.WIFIGATE_PAY_SCREENSHOTS;
async function shot(page, name) {
  if (!evidence) return;
  await mkdir(evidence, { recursive: true });
  await page.evaluate(() => Promise.all(document.getAnimations().filter(animation => animation.effect?.getComputedTiming().endTime !== Infinity).map(animation => animation.finished.catch(() => {}))));
  await page.screenshot({ path: path.join(evidence, name + ".png"), fullPage: true });
}
async function setup(t, browser, options = {}) {
  const fixture = await scenario(browser, { pay: "active", manager: "no-plan", verified: true, enrolled: true, ...options });
  t.after(() => fixture.context.close());
  const state = { system: system(), items: null, organizationItems: null, organizationRole: "owner", calls: [], conflict: false, listError: null, denied: false, next: false, loseSaveResponse: false, receipts: new Map() };
  await fixture.context.route("**/api/v1/pay/**", async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    const body = request.postDataJSON();
    state.calls.push({ path: url.pathname, query: url.search, method, body, headers: request.headers() });
    const fail = (status, code) => route.fulfill({ status, json: { error: { code } } });
    if (state.denied) return fail(403, "PAY_ACCESS_DENIED");
    if (url.pathname === "/api/v1/pay/me") return route.fulfill({ json: { user: { uid: "fixture-user", email: "fixture@example.test", name: "Fixture User" }, role: "user", canManageSystems: true, uploadEnabled: true, paymentsEnabled: false, organizations: [{ id: "fixture-org", name: "Harbour organization", role: state.organizationRole }, { id: "viewer-org", name: "Read-only organization", role: "viewer" }] } });
    if (url.pathname === "/api/v1/pay/systems") {
      if (state.listError) return fail(state.listError, "UNAVAILABLE");
      if (url.searchParams.has("organizationId")) return route.fulfill({ json: { items: state.organizationItems ?? [], nextCursor: null, paymentsEnabled: false } });
      if (url.searchParams.has("cursor")) return route.fulfill({ json: { items: [{ ...system(), id: OTHER, name: "Second linked system" }], nextCursor: null, paymentsEnabled: false } });
      return route.fulfill({ json: { items: state.items ?? [state.system], nextCursor: state.next ? "fixture-cursor" : null, paymentsEnabled: false } });
    }
    if (url.pathname === `/api/v1/pay/systems/${ID}` && method === "GET") return route.fulfill({ json: { system: state.system, paymentsEnabled: false } });
    if (url.pathname.endsWith("/config") && method === "PATCH") {
      if (state.conflict) return fail(409, "VERSION_CONFLICT");
      const key = request.headers()["idempotency-key"];
      if (state.receipts.has(key)) return route.fulfill({ json: state.receipts.get(key) });
      assert.equal(body.version, state.system.version);
      assert.equal(body.config.enabled, false);
      assert.match(request.headers()["idempotency-key"], /^[a-f0-9-]{36}$/);
      state.system = { ...state.system, version: state.system.version + 1, config: body.config };
      const result = { system: state.system, paymentsEnabled: false }; state.receipts.set(key, result);
      if (state.loseSaveResponse) { state.loseSaveResponse = false; return fail(502, "RESPONSE_UNAVAILABLE"); }
      return route.fulfill({ json: result });
    }
    if (url.pathname.endsWith("/remove") && method === "POST") {
      assert.equal(body.version, state.system.version);
      assert.match(request.headers()["idempotency-key"], /^[a-f0-9-]{36}$/);
      state.items = [];
      return route.fulfill({ json: { system: { id: ID, status: "removed" }, paymentsEnabled: false } });
    }
    if (url.pathname.endsWith("/organization") && method === "POST") {
      assert.equal(body.version, state.system.version);
      assert.match(request.headers()["idempotency-key"], /^[a-f0-9-]{36}$/);
      state.system = { ...state.system, version: state.system.version + 1, organization: body.organizationId ? { id: body.organizationId, name: "Harbour organization" } : null };
      return route.fulfill({ json: { system: state.system, paymentsEnabled: false } });
    }
    return fail(404, "NOT_FOUND");
  });
  fixture.page.setDefaultTimeout(7000);
  return { ...fixture, state };
}
async function enter(page, origin, language = "en") {
  await page.goto(origin + "/dashboard/pay/" + (language === "he" ? "?lang=he" : ""));
  await page.locator('.pay-system-card[data-system-id="' + ID + '"]').waitFor();
}

test("Pay real workspace saves versioned metadata, rejects conflicts and shows QR preview without charging", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state, errors, calls } = await setup(t, browser);
  await enter(page, origin);
  assert.equal(await page.locator('.pay-system-grid:not(details *) .pay-system-card').count(), 1);
  assert.equal(await page.locator(`[data-system-id="${ID}"] button`).count(), 1);
  assert.equal(await page.locator(".pay-content").getByText(/revenue|transactions/i).count(), 0);
  await shot(page, "pay-workspace-en-desktop");
  await page.locator(`[data-system-id="${ID}"] button`).click();
  await page.locator('[data-pay-tab="settings"]').click();
  assert.equal(await page.locator('[name="hourlyRate"]').isVisible(), false);
  assert.equal(await page.locator('[name="windowMin"]').isVisible(), false);
  await page.getByLabel("Point name shown to the visitor").fill("Updated harbour entrance");
  state.conflict = true;
  await page.getByRole("button", { name: "Save settings", exact: true }).click();
  await page.getByText("These details changed in another session.", { exact: false }).waitFor();
  assert.equal(state.system.version, 1);
  assert.equal(await page.getByLabel("Point name shown to the visitor").inputValue(), "Updated harbour entrance");
  state.conflict = false;
  await page.getByRole("button", { name: "Load latest details" }).click();
  await page.locator('[data-pay-tab="settings"]').click();
  await page.getByLabel("Point name shown to the visitor").fill("Updated harbour entrance");
  await page.getByRole("button", { name: "Save settings", exact: true }).click();
  await page.getByText("Settings saved. Payments are not active.", { exact: true }).waitFor();
  assert.equal(state.system.version, 2);
  await page.locator('[data-pay-tab="preview"]').click();
  const inactive = page.locator('[data-pay-tab="overview"]');
  await inactive.hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-pay-tab="overview"]')).backgroundColor === "rgb(248, 250, 252)");
  const hover = await inactive.evaluate(node => {
    const style = getComputedStyle(node);
    const luminance = color => {
      const values = color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => { value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; });
      return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
    };
    const foreground = luminance(style.color), background = luminance(style.backgroundColor);
    return { background: style.backgroundColor, color: style.color, contrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05) };
  });
  assert.equal(hover.background, "rgb(248, 250, 252)", "inactive workspace tabs use the shared Manager hover surface");
  assert.ok(hover.contrast >= 4.5, "hover text remains readable on the shared surface");
  await page.mouse.move(0, 0);
  await page.locator(".pay-sharing img").waitFor();
  assert.match(await page.getByRole("link", { name: "Open preview" }).getAttribute("href"), new RegExp(`/pay/point/\\?id=${PUBLIC}$`));
  assert.equal(await page.locator(".pay-unavailable").textContent(), "Payments are not active");
  assert.equal(state.calls.filter(call => call.method !== "GET").length, 2);
  assert.equal(state.calls.some(call => /charge|checkout|open|session|redeem/.test(call.path)), false);
  assert.equal(calls.includes("signout"), false);
  assert.deepEqual(errors, []);
  await shot(page, "pay-point-preview-en-desktop");
});

test("Pay Hebrew mobile examples use the real workspace layout and conditionally show only relevant tariff controls", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state, errors } = await setup(t, browser, { mobile: true });
  await enter(page, origin, "he");
  await page.getByText("דוגמאות", { exact: true }).click();
  await page.locator('[data-system-id="example-dual"] button').click();
  await page.getByText("סימולציה למערכת לדוגמה.", { exact: false }).waitFor();
  await page.locator('[data-pay-tab="settings"]').click();
  await page.getByLabel("סוג תעריף").selectOption("metered");
  assert.equal(await page.getByLabel("מחיר מתוכנן", { exact: true }).isVisible(), false);
  assert.equal(await page.getByLabel("תעריף לשעה", { exact: true }).isVisible(), true);
  assert.equal(await page.getByLabel("דקות חסד", { exact: true }).isVisible(), true);
  assert.equal(await page.getByLabel("חלון גישה בדקות", { exact: true }).isVisible(), false);
  await page.getByLabel("סוג תעריף").selectOption("timed");
  assert.equal(await page.getByLabel("חלון גישה בדקות", { exact: true }).isVisible(), true);
  assert.equal(await page.getByLabel("תעריף לשעה", { exact: true }).isVisible(), false);
  await page.getByRole("button", { name: "שמירה בסימולציה", exact: true }).click();
  await page.getByText("ההגדרות נשמרו. סליקה אינה פעילה.").waitFor();
  assert.equal(state.calls.some(call => call.method !== "GET"), false);
  assert.equal(await page.locator(".pay-danger-outline").count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await shot(page, "pay-settings-he-mobile");
  await page.locator('[data-pay-tab="preview"]').click();
  assert.equal(await page.locator(".pay-sharing img").count(), 0);
  assert.equal(await page.locator('.pay-sharing a[href*="/pay/point/"]').count(), 0);
  assert.deepEqual(errors, []);
  await shot(page, "pay-example-he-mobile");
});

test("Pay unlink requires confirmation and changes only its selected product link", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state, errors } = await setup(t, browser);
  await enter(page, origin);
  await page.locator(`[data-system-id="${ID}"] button`).click();
  await page.locator(".pay-system-actions summary").click();
  await page.getByRole("button", { name: "Unlink from Pay", exact: true }).click();
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.getByRole("dialog").getByText(/Host and Manager links stay/).count(), 1);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  assert.equal(await page.locator(".pay-system-actions summary").evaluate(node => node === document.activeElement), true, "dialog returns focus to the visible actions trigger");
  assert.equal(state.calls.some(call => call.path.endsWith("/remove")), false);
  await page.locator(".pay-system-actions summary").click();
  await page.getByRole("button", { name: "Unlink from Pay", exact: true }).click();
  await page.getByRole("button", { name: "Unlink system", exact: true }).click();
  await page.getByText("System unlinked from Pay.", { exact: true }).waitFor();
  assert.equal(await page.locator(`[data-system-id="${ID}"]`).count(), 0);
  assert.equal(state.calls.filter(call => call.path.endsWith("/remove")).length, 1);
  assert.deepEqual(errors, []);
});

test("Pay organization scope uses live membership context and keeps staff and viewer configuration read-only", async t => {
  const { origin, browser } = await startSite(t);
  for (const role of ["staff", "viewer"]) await t.test(role, async t => {
    const { page, state, errors } = await setup(t, browser);
    state.organizationRole = role;
    state.system = { ...system(), organization: { id: "fixture-org", name: "Harbour organization" }, permissions: { canConfigure: false, canRemove: false, canAssignOrganization: false } };
    state.organizationItems = [state.system];
    await enter(page, origin);
    await page.getByRole("button", { name: "My organizations", exact: true }).click();
    await page.locator(".pay-organization-card").filter({ hasText: "Harbour organization" }).getByRole("button", { name: "Open organization" }).click();
    await page.locator(`[data-system-id="${ID}"] button`).waitFor();
    assert.equal(await page.locator(".pay-organization-header h2").textContent(), "Harbour organization");
    assert.equal(state.calls.some(call => call.path === "/api/v1/pay/systems" && call.query.includes("organizationId=fixture-org")), true);
    await page.locator(`[data-system-id="${ID}"] button`).click();
    await page.locator('[data-pay-tab="settings"]').click();
    assert.equal(await page.getByLabel("Point name shown to the visitor").isDisabled(), true);
    assert.equal(await page.getByRole("button", { name: "Save settings", exact: true }).count(), 0);
    assert.equal(await page.locator(".pay-system-actions").count(), 0);
    await page.getByText("Your account has view access.", { exact: false }).waitFor();
    await page.locator('[data-pay-tab="preview"]').click();
    await page.locator(".pay-sharing img").waitFor();
    assert.equal(state.calls.some(call => call.method !== "GET"), false);
    assert.deepEqual(errors, []);
  });
});

test("Pay owner assignment is confirmed in a dialog, uses a version and excludes viewer organizations", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state, errors } = await setup(t, browser);
  await enter(page, origin);
  await page.locator(`[data-system-id="${ID}"] button`).click();
  await page.locator(".pay-system-actions summary").click();
  await page.getByRole("button", { name: "Assign to organization", exact: true }).click();
  const dialog = page.getByRole("dialog"); await dialog.waitFor();
  assert.equal(await dialog.locator('option[value="viewer-org"]').count(), 0);
  await dialog.getByLabel("Organization", { exact: true }).selectOption("fixture-org");
  await dialog.getByRole("button", { name: "Save assignment", exact: true }).click();
  await page.getByText("System assignment saved.", { exact: true }).waitFor();
  assert.equal(state.system.organization.id, "fixture-org");
  assert.equal(state.system.version, 2);
  assert.deepEqual(state.calls.find(call => call.path.endsWith("/organization")).body, { version: 1, organizationId: "fixture-org" });
  await page.locator(".pay-system-actions summary").click();
  await page.getByRole("button", { name: "Assign to organization", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Organization", { exact: true }).selectOption("");
  await page.getByRole("dialog").getByRole("button", { name: "Save assignment", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(state.system.organization, null);
  assert.equal(state.system.version, 3);
  assert.deepEqual(errors, []);
});

test("Pay respects server payment modes and displays tariff amount with the correct billing unit", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state, errors } = await setup(t, browser);
  state.system.config.accessMode = "metered";
  await enter(page, origin);
  const card = page.locator(`[data-system-id="${ID}"]`);
  assert.equal(await card.locator(".pay-card-facts").count(), 0, "inventory cards share Manager layout; tariff details stay in the workspace");
  await card.getByRole("button").click();
  assert.match(await page.locator(".pay-overview-card").nth(1).textContent(), /8\.00.*per hour/);
  await page.locator('[data-pay-tab="settings"]').click();
  await page.getByText("This information is visible to anyone who opens the public preview link.", { exact: true }).first().waitFor();
  assert.equal(await page.getByLabel("Point name shown to the visitor").getAttribute("maxlength"), "80");
  assert.equal(await page.getByLabel("Visitor instructions").getAttribute("maxlength"), "300");
  state.system.config.accessMode = "timed";
  state.system.capabilities.paymentModes = ["timed"];
  await page.getByRole("button", { name: "My systems", exact: true }).click();
  await page.locator(`[data-system-id="${ID}"] button`).click();
  assert.match(await page.locator(".pay-overview-card").nth(1).textContent(), /12\.00.*60 minutes/);
  await page.locator('[data-pay-tab="settings"]').click();
  await page.locator('select[name="accessMode"] option[value="timed"]').waitFor({ state: "attached" });
  assert.deepEqual(await page.getByLabel("Tariff type", { exact: true }).locator("option").evaluateAll(options => options.map(option => option.value)), ["timed"]);
  state.system.capabilities.paymentModes = [];
  await page.getByRole("button", { name: "My systems", exact: true }).click();
  await page.locator(`[data-system-id="${ID}"] button`).click();
  await page.locator('[data-pay-tab="settings"]').click();
  await page.getByText("Payment point configuration is not currently supported for this system.", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Save settings", exact: true }).count(), 0);
  assert.equal(state.calls.some(call => call.method !== "GET"), false);
  assert.deepEqual(errors, []);
});

test("Pay retries an uncertain save with the same idempotency key and never applies the change twice", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state, errors } = await setup(t, browser);
  await enter(page, origin);
  await page.locator(`[data-system-id="${ID}"] button`).click();
  await page.locator('[data-pay-tab="settings"]').click();
  await page.getByLabel("Point name shown to the visitor").fill("Updated once");
  state.loseSaveResponse = true;
  await page.getByRole("button", { name: "Save settings", exact: true }).click();
  await page.getByText("We could not complete the action.", { exact: false }).waitFor();
  assert.equal(state.system.version, 2, "the first change reached the server");
  await page.getByRole("button", { name: "Save settings", exact: true }).click();
  await page.getByText("Settings saved. Payments are not active.", { exact: true }).waitFor();
  const saves = state.calls.filter(call => call.path.endsWith("/config"));
  assert.equal(saves.length, 2);
  assert.equal(saves[0].headers["idempotency-key"], saves[1].headers["idempotency-key"]);
  assert.deepEqual(saves[0].body, saves[1].body);
  assert.equal(state.system.version, 2, "receipt replay did not change the system again");
  assert.deepEqual(errors, []);
});

test("Pay request errors keep account signed in, support retry and give an honest empty state", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state, calls, errors } = await setup(t, browser);
  state.listError = 503;
  await page.goto(origin + "/dashboard/pay/");
  await page.getByRole("button", { name: "Try again", exact: true }).waitFor();
  state.listError = null; state.items = [];
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await page.getByText("Your first system starts here", { exact: true }).waitFor();
  assert.equal(await page.locator(".pay-system-grid:not(details *) .pay-system-card").count(), 0);
  state.denied = true;
  await page.getByRole("button", { name: "Refresh", exact: true }).click();
  await page.getByText("Your account does not have permission for this action.", { exact: false }).waitFor();
  assert.equal(calls.includes("signout"), false);
  assert.deepEqual(errors, []);
});

test("Pay paginates systems and filters the loaded list without inventing an account total", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state } = await setup(t, browser);
  state.next = true;
  await enter(page, origin);
  assert.equal(await page.locator(".pay-system-grid:not(details *) .pay-system-card").count(), 1);
  await page.getByRole("button", { name: "Load more systems", exact: true }).click();
  await page.locator(`[data-system-id="${OTHER}"]`).waitFor();
  assert.equal(await page.locator(".pay-system-grid:not(details *) .pay-system-card").count(), 2);
  assert.equal(await page.locator(".pay-count").count(), 0, "the shared inventory does not imply a complete account total");
  assert.equal(state.calls.some(call => call.path === "/api/v1/pay/systems" && call.query.includes("cursor=fixture-cursor")), true);
  await page.getByRole("searchbox", { name: "Search loaded systems" }).fill("Second");
  assert.equal(await page.locator(`.pay-system-grid:not(details *) .pay-system-card`).count(), 1);
  assert.equal(await page.locator(`[data-system-id="${OTHER}"]`).isVisible(), true);
});

test("Pay rejects an unsafe public link and fits a narrow RTL phone without horizontal overflow", async t => {
  const { origin, browser } = await startSite(t);
  const { page, state, errors } = await setup(t, browser, { viewport: { width: 320, height: 780 } });
  state.system.publicPoint.url = "https://malicious.example/point";
  await enter(page, origin, "he");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  await page.locator(`[data-system-id="${ID}"] button`).click();
  await page.locator('[data-pay-tab="preview"]').click();
  assert.equal(await page.locator(".pay-sharing img,.pay-sharing a").count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
  assert.deepEqual(errors, []);
});

test("Pay clears private content on account change and ignores the previous account's late detail response", async t => {
  const { origin, browser } = await startSite(t);
  const { page, context, errors } = await setup(t, browser);
  await enter(page, origin);
  let release;
  const held = new Promise(resolve => { release = resolve; });
  let requested;
  const reached = new Promise(resolve => { requested = resolve; });
  await context.route(`**/api/v1/pay/systems/${ID}`, async route => {
    requested(); await held;
    return route.fulfill({ json: { system: { ...system(), name: "Previous account private name" }, paymentsEnabled: false } });
  });
  await page.locator(`[data-system-id="${ID}"] button`).click(); await reached;
  await page.evaluate(() => window.fixtureChangeUser("second-account"));
  await page.locator(".pay-error").waitFor();
  release();
  await page.waitForTimeout(100);
  assert.equal(await page.getByText("Previous account private name", { exact: true }).count(), 0);
  assert.equal(await page.locator(".pay-detail-header").count(), 0);
  assert.deepEqual(errors, []);
});

test("Pay platform entry requires global WIFIGATE admin plus verified MFA and has a scoped dedicated route", async t => {
  const { origin, browser } = await startSite(t);
  for (const options of [{ platformRole: null, verified: true }, { platformRole: "admin", verified: false }, { platformRole: "admin", verified: true }]) {
    await t.test(JSON.stringify(options), async t => {
      const { page, errors } = await setup(t, browser, options);
      await enter(page, origin);
      const allowed = options.platformRole === "admin" && options.verified;
      assert.equal(await page.locator(".pay-management-entry").count(), 0);
      assert.equal(await page.locator("#platform-admin-management").isVisible(), false);
      await page.goto(origin + "/dashboard/pay/platform/");
      if (allowed) {
        await page.locator("#platform-admin-management h2").waitFor();
        assert.equal(new URL(page.url()).pathname, "/dashboard/platform/");
        assert.equal(new URL(page.url()).searchParams.get("product"), "pay");
      } else {
        if (options.platformRole !== "admin") await page.getByText("This page is available to WIFIGATE administrators only.").waitFor();
        else await page.locator("#platform-security").waitFor();
        assert.equal(await page.locator("#platform-admin-management").isVisible(), false);
      }
      assert.deepEqual(errors, []);
    });
  }
});

test("Pay public point is an unauthenticated safe informational preview with no payment or opening control", async t => {
  const { origin, browser } = await startSite(t);
  for (const [language, mobile] of [["en", false], ["he", true]]) {
    await t.test(language, async t => {
      const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 950 } });
      t.after(() => context.close());
      const calls = [], errors = [];
      await context.route("**/api/v1/pay/points/**", route => {
        calls.push(route.request());
        return route.fulfill({ json: { point: { id: PUBLIC, ...config, accessMode: language === "en" ? "metered" : "timed", displayName: '<img src=x onerror="alert(1)">', status: "preview_only", paymentsEnabled: false, canPay: false }, paymentsEnabled: false } });
      });
      const page = await context.newPage(); page.on("pageerror", error => errors.push(error.message));
      await page.goto(origin + `/pay/point/?id=${PUBLIC}&lang=${language}`);
      await page.getByText('<img src=x onerror="alert(1)">', { exact: true }).waitFor();
      assert.equal(await page.locator("#pay-point img").count(), 0);
      assert.equal(await page.locator("#pay-point button,#pay-point a,#pay-point form").count(), 0);
      assert.match(await page.locator(".pay-preview-price").textContent(), language === "en" ? /8\.00/ : /12\.00/);
      assert.match(await page.locator("#pay-point").textContent(), language === "en" ? /Planned hourly tariff/ : /60 דקות/);
      assert.equal(calls.length, 1);
      assert.equal(calls[0].headers().authorization, undefined);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      assert.deepEqual(errors, []);
      await shot(page, `pay-public-${language}`);
    });
  }
});

test("Pay public preview rejects an invalid link and fails closed if the server enables a payment claim", async t => {
  const { origin, browser } = await startSite(t);
  const context = await browser.newContext(); t.after(() => context.close());
  const page = await context.newPage(); let calls = 0;
  await context.route("**/api/v1/pay/points/**", route => { calls++; return route.fulfill({ json: { point: { id: PUBLIC, ...config, canPay: true, paymentsEnabled: true }, paymentsEnabled: true } }); });
  await page.goto(origin + "/pay/point/?id=invalid");
  await page.getByRole("heading", { name: "Point unavailable", exact: true }).waitFor();
  assert.equal(calls, 0);
  await page.goto(origin + `/pay/point/?id=${PUBLIC}`);
  await page.getByRole("heading", { name: "Unable to load this point", exact: true }).waitFor();
  assert.equal(await page.locator("#pay-point button").count(), 1);
  assert.equal(await page.getByRole("button", { name: /pay|open|charge/i }).count(), 0);
});
