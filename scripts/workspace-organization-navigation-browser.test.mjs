import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";
import { startHostSite, openWorkspace, organization, loaded, requests, fits } from "./lib/host-booking-site.mjs";

const evidence = process.env.WIFIGATE_WORKSPACE_SCREENSHOTS;
async function screenshot(page, name) {
  if (!evidence) return;
  await mkdir(evidence, { recursive: true });
  await page.screenshot({ path: `${evidence}/${name}.png`, fullPage: true });
}

test("Manager and Pay separate personal access from explicitly selected organization systems", async t => {
  const { browser, origin } = await startSite(t);
  for (const product of ["manager", "pay"]) for (const role of ["admin", "user"]) for (const language of ["he", "en"]) for (const width of [390, 1440]) {
    await t.test(`${product} ${role} ${language} ${width}`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      try {
        page.setDefaultTimeout(7000);
        const errors = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.route(origin + "/workspace-fixture", route => route.fulfill({ contentType: "text/html; charset=utf-8", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"><link rel="stylesheet" href="/css/pay-dashboard.css"><body class="platform-page" data-product="${product}"><main class="platform-shell"><section class="portal-panel"><div id="root"></div></section></main>` }));
        await page.goto(origin + "/workspace-fixture");
        await page.evaluate(async ({ product, role, language }) => {
          const organizations = [{ id: "org-a", name: "WIFIGATE TEST", role: "owner" }, { id: "org-b", name: "Second organization", role: "viewer" }];
          window.calls = [];
          const api = async (rawPath, method = "GET") => {
            if (method !== "GET") throw new Error("Navigation must never mutate data");
            const path = rawPath.replace(/^\/api\/v1\/pay/, "");
            window.calls.push(path);
            if (path === "/me") return { user: { uid: "fixture" }, paymentsEnabled: false, role, roles: role === "admin" ? ["admin", "user"] : ["user"], account: { id: "me" }, organizations };
            if (path === "/organizations/org-a" || path === "/organizations/org-b") return { organization: organizations.find(org => path.endsWith(org.id)), permissions: { managePeople: false, manageLogo: false }, owner: { email: "fixture@example.test" }, counts: { systems: 0, admins: 0, users: 0 } };
            if (path.startsWith("/organizations?")) return { items: organizations, nextCursor: null };
            return { items: [], nextCursor: null, paymentsEnabled: false };
          };
          const module = await import(`/js/${product}-dashboard.js`);
          window.dashboard = module[product === "manager" ? "createManagerDashboard" : "createPayDashboard"]({ root: document.querySelector("#root"), user: { uid: "fixture" }, language, api });
          await window.dashboard.ready;
        }, { product, role, language });
        const nav = page.locator(".manager-nav");
        const personal = nav.locator(".manager-personal-navigation");
        const mySystems = language === "he" ? "המערכות שלי" : "My systems";
        const myOrganizations = language === "he" ? "הארגונים שלי" : "My organizations";
        await personal.getByRole("button", { name: mySystems, exact: true }).waitFor();
        assert.match(await personal.innerText(), new RegExp(`WIFIGATE ${product === "manager" ? "Manager" : "Pay"} ${role[0].toUpperCase() + role.slice(1)}`));
        assert.equal(await personal.getByRole("button", { name: myOrganizations, exact: true }).count(), 1);
        assert.equal(await nav.locator("[data-organization-view]").count(), 0);
        const choose = () => nav.getByRole("button", { name: language === "he" ? "בחירת ארגון" : "Choose organization", exact: true });
        await choose().click();
        await page.locator('.manager-organization-option[data-organization-id="org-a"]').click();
        await nav.locator('[data-organization-view="systems"]').waitFor();
        assert.match(await choose().innerText(), /WIFIGATE TEST/);
        assert.equal(await personal.locator('[aria-current="page"]').count(), 0);
        await choose().click();
        await page.locator('.manager-organization-option[data-organization-id="org-b"]').click();
        await page.waitForFunction(product => window.calls.some(path => product === "manager" ? path.startsWith("/organizations/org-b/systems?") : path.includes("organizationId=org-b")), product);
        assert.match(await choose().innerText(), /Second organization/);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true);
        if (width === 1440) assert.ok((await nav.boundingBox()).width >= 300);
        await screenshot(page, `${product}-${role}-${language}-${width}`);
        await personal.getByRole("button", { name: mySystems, exact: true }).click();
        await page.waitForFunction(() => !document.querySelector('[data-organization-view="systems"]'));
        assert.equal(await choose().locator("strong").innerText(), language === "he" ? "בחרו ארגון" : "Choose organization");
        assert.deepEqual(errors, []);
      } finally { await page.close(); }
    });
  }
});

test("Host requires organization selection and keeps systems, calendar and API scoped to it", async t => {
  const site = await startHostSite(t);
  for (const language of ["he", "en"]) for (const width of [390, 1440]) {
    await t.test(`${language} ${width}`, async () => {
      const { page, errors } = await openWorkspace(t, site, { plan: "user", organizations: [organization("org-a", "WIFIGATE TEST", "owner"), organization("org-b", "Second organization", "viewer")] }, { real: true, selectOrganization: false, query: language === "he" ? "?lang=he" : "", viewport: { width, height: 1000 } });
      await loaded(page, "my-systems");
      const nav = page.locator("#host-section-navigation");
      assert.equal(await nav.locator('.manager-personal-navigation [data-view-id="my-systems"]').isVisible(), true);
      assert.equal(await nav.locator('.manager-personal-navigation [data-view-id="my-organizations"]').isVisible(), true);
      assert.equal(await nav.locator('[data-view-id="systems"]').isVisible(), false);
      assert.equal((await requests(page)).some(row => /\/organizations\/org-[ab]\//.test(row.call)), false);
      const choose = () => page.locator("#workspace-org-switcher button.manager-organization-picker-trigger");
      await choose().click();
      await page.locator('.manager-organization-option[data-organization-id="org-a"]').click();
      await loaded(page, "systems");
      assert.equal(new URL(page.url()).searchParams.get("org"), "org-a");
      assert.equal(await nav.locator('.manager-personal-navigation [aria-current="page"]').count(), 0);
      assert.equal(await nav.locator('[data-view-id="calendar"]').innerText(), language === "he" ? "יומן הארגון" : "Organization calendar");
      assert.equal(await nav.locator('[data-view-id="connect"]').innerText(), language === "he" ? "אוטומציית הזמנת אורחים API" : "Guest invitation automation API");
      await screenshot(page, `host-${language}-${width}`);
      await choose().click();
      await page.locator('.manager-organization-option[data-organization-id="org-b"]').click();
      await loaded(page, "systems");
      assert.equal(new URL(page.url()).searchParams.get("org"), "org-b");
      assert.equal(await nav.locator('[data-view-id="connect"]').isVisible(), false, "Viewer cannot use guest automation");
      assert.equal(await fits(page), true);
      await nav.locator('[data-view-id="my-organizations"]').click();
      await loaded(page, "my-organizations");
      assert.equal(new URL(page.url()).searchParams.has("org"), false);
      assert.equal(await nav.locator('[data-view-id="systems"]').isVisible(), false);
      assert.equal(await page.locator('[data-workspace-view="my-organizations"] [data-organization]').count(), 2);
      await page.locator('[data-workspace-view="my-organizations"] [data-organization="org-a"] button').click();
      await loaded(page, "systems");
      assert.equal(new URL(page.url()).searchParams.get("org"), "org-a");
      assert.deepEqual(errors, []);
    });
  }
  await t.test("An unknown organization cannot select another organization or expose its screens", async () => {
    const { page, errors } = await openWorkspace(t, site, { plan: null, organizations: [organization("org-a", "WIFIGATE TEST", "viewer")] }, { real: true, selectOrganization: false, query: "?org=not-a-member&view=calendar" });
    await loaded(page, "my-organizations");
    assert.equal(new URL(page.url()).searchParams.has("org"), false);
    assert.equal(await page.locator('#host-section-navigation [data-view-id="systems"]').isVisible(), false);
    assert.equal(await page.locator('#host-section-navigation [data-view-id="my-systems"]').isVisible(), false);
    assert.equal((await requests(page)).some(row => /\/organizations\/[^/]+\//.test(row.call)), false);
    assert.deepEqual(errors, []);
  });
});
