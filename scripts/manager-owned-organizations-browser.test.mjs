import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { startSite } from "./platform-test-fixtures.mjs";

// All accounts, requests and organizations below are synthetic. No customer API,
// authentication, hardware connection or mutation is used by this regression.
const profileOwner = { id: "owned", name: "Owned residence", role: "owner" };
const member = {
  id: "member", name: "Member residence", version: 2,
  owner: { id: "another-account", email: "another@example.test", role: "user" },
  administrators: [], linkedSystemCount: 1,
};
const owned = {
  id: "owned", name: "Owned residence", version: 7,
  owner: { id: "personal", uid: "current", email: "owner@example.test", role: "user" },
  administrators: [], linkedSystemCount: 2,
};

async function fixture(t, browser, origin, options = {}) {
  const config = {
    language: "he", width: 390, account: true,
    profileOrganizations: [profileOwner, { id: "member", name: member.name, role: "organization-admin" }],
    pages: [{ items: [member], nextCursor: null }],
    ...options,
  };
  const page = await browser.newPage({ viewport: { width: config.width, height: 1000 } });
  t.after(() => page.close());
  page.setDefaultTimeout(7000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route(origin + "/owned-organizations-fixture", (route) => route.fulfill({
    contentType: "text/html; charset=utf-8",
    body: `<!doctype html><html lang="${config.language}" dir="${config.language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><div class="portal-panel"><div id="root"></div></div></main></body></html>`,
  }));
  await page.goto(origin + "/owned-organizations-fixture");
  await page.evaluate(async ({ config, owned, member }) => {
    const { createManagerDashboard } = await import("/js/manager-dashboard.js");
    window.config = config;
    window.calls = [];
    window.connections = 0;
    window.pendingDetails = 0;
    window.settledDetails = 0;
    const detail = (org) => ({
      organization: { id: org.id, name: org.name, version: org.version, logoDataUrl: null },
      owner: org.owner,
      counts: { administrators: 1, users: 0, systems: org.linkedSystemCount },
      permissions: { managePeople: true, manageLogo: true, openWorkspace: true },
    });
    const api = async (requestPath, method = "GET") => {
      window.calls.push({ path: requestPath, method });
      if (method !== "GET") throw new Error("No mutation is permitted in this fixture");
      const url = new URL(requestPath, location.origin);
      const pathname = url.pathname;
      if (pathname === "/me") return {
        user: { uid: "current", name: "Synthetic operator", email: "owner@example.test" },
        role: "admin", roles: config.account ? ["admin", "user"] : ["admin"],
        account: config.account ? { id: "personal", status: "active" } : null,
        organizations: config.profileOrganizations,
      };
      if (pathname === "/organizations") {
        const index = Number(url.searchParams.get("cursor") || 0);
        return config.pages[index] ?? { items: [], nextCursor: null };
      }
      if (pathname === "/organizations/owned") {
        if (config.delayDetail) {
          window.pendingDetails++;
          await new Promise((resolve) => { window.resolveDetail = resolve; });
          window.settledDetails++;
        }
        if (config.detailFailure) {
          const status = config.detailFailure;
          if (config.failOnce) config.detailFailure = null;
          throw Object.assign(new Error(status === 503 ? "HOST_API_UNAVAILABLE" : status === 403 ? "FORBIDDEN" : "NOT_FOUND"), {
            status, code: status === 503 ? "HOST_API_UNAVAILABLE" : status === 403 ? "FORBIDDEN" : "NOT_FOUND",
          });
        }
        return detail(owned);
      }
      if (pathname === "/organizations/member") return detail(member);
      if (pathname === "/admin/overview") return { admins: 1, users: 1, organizations: 1 };
      if (pathname === "/admin/organizations") return {
        items: [{ ...member, id: "admin-only", name: "Platform inventory" }], nextCursor: null,
      };
      if (pathname === "/systems" || /\/(systems|members|invitations)$/.test(pathname)) return { items: [], nextCursor: null };
      throw new Error("Unexpected synthetic request " + requestPath);
    };
    window.dashboard = createManagerDashboard({
      root: document.querySelector("#root"), user: { uid: "current" },
      language: config.language, api,
      Connection: class {
        constructor() { window.connections++; throw new Error("No hardware in organization metadata tests"); }
      },
    });
    await window.dashboard.ready;
  }, { config, owned, member });
  return {
    page, errors, he: config.language === "he",
    organizations: () => page.locator(".manager-nav").getByRole("button", {
      name: config.language === "he" ? "הארגונים שלי" : "My organizations", exact: true,
    }).click(),
  };
}

async function assertSafe(page, errors) {
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => window.connections), 0);
  assert.equal(await page.evaluate(() => window.calls.some((call) => call.method !== "GET")), false);
}

test("mixed Manager admin and user sees owned and member organizations in the personal view and can select them", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440])
      await t.test(`${language} ${width}px`, async (t) => {
        const { page, he, errors, organizations } = await fixture(t, browser, origin, { language, width });
        await organizations();
        const ownedCard = page.locator('[data-organization="owned"]');
        await ownedCard.waitFor();
        assert.equal(await page.locator('[data-organization="member"]').count(), 1);
        assert.equal(await ownedCard.locator(".manager-org-count b").innerText(), "2");
        await ownedCard.getByText("owner@example.test", { exact: true }).waitFor();
        assert.equal(await page.locator(".manager-empty-organizations").count(), 0);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
        if (process.env.MANAGER_OWNED_ORG_SCREENSHOTS) {
          await mkdir(process.env.MANAGER_OWNED_ORG_SCREENSHOTS, { recursive: true });
          await page.screenshot({ path: path.join(process.env.MANAGER_OWNED_ORG_SCREENSHOTS, `owned-organizations-${language}-${width}.png`), fullPage: true });
        }
        await ownedCard.getByRole("button", { name: he ? "כניסה לארגון" : "Open organization", exact: true }).click();
        await page.locator(".manager-organization-header h2").getByText(owned.name, { exact: true }).waitFor();
        assert.equal(await page.evaluate(() => window.calls.some((call) => call.path.startsWith("/organizations/owned/systems?"))), true);
        assert.equal(await page.evaluate(() => window.calls.some((call) => call.path.startsWith("/admin/organizations/owned"))), false);
        await page.getByRole("button", { name: he ? "כל הארגונים" : "All organizations", exact: true }).click();
        await page.locator('[data-organization="member"]').getByRole("button", { name: he ? "כניסה לארגון" : "Open organization", exact: true }).click();
        await page.locator(".manager-organization-header h2").getByText(member.name, { exact: true }).waitFor();
        await assertSafe(page, errors);
      });
});

test("current organization list rows avoid redundant owner detail reads and paging deduplicates IDs", async (t) => {
  const { origin, browser } = await startSite(t);
  const current = await fixture(t, browser, origin, { pages: [{ items: [owned, member], nextCursor: null }] });
  await current.organizations();
  await current.page.locator('[data-organization="owned"]').waitFor();
  assert.equal(await current.page.evaluate(() => window.calls.filter((call) => call.path === "/organizations/owned").length), 0);
  await assertSafe(current.page, current.errors);

  const paged = await fixture(t, browser, origin, {
    pages: [
      { items: [member], nextCursor: "1" },
      { items: [owned, member, { ...member, id: "additional", name: "Additional residence" }], nextCursor: null },
    ],
  });
  await paged.organizations();
  await paged.page.locator('[data-organization="owned"]').waitFor();
  await paged.page.getByRole("button", { name: "הצגת עוד", exact: true }).click();
  await paged.page.locator('[data-organization="additional"]').waitFor();
  assert.deepEqual(await paged.page.locator("[data-organization]").evaluateAll((cards) => cards.map((card) => card.dataset.organization).sort()), ["additional", "member", "owned"]);
  assert.equal(await paged.page.getByRole("button", { name: "הצגת עוד", exact: true }).count(), 0);
  await assertSafe(paged.page, paged.errors);
});

test("entering My organizations refreshes ownership added since the dashboard profile loaded", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, errors, organizations } = await fixture(t, browser, origin, {
    profileOrganizations: [{ id: "member", name: member.name, role: "organization-admin" }],
  });
  assert.equal(await page.locator('.manager-organization-option[data-organization-id="owned"]').count(), 0);
  await page.evaluate((owner) => {
    window.config.profileOrganizations = [...window.config.profileOrganizations, owner];
  }, profileOwner);
  await organizations();
  await page.locator('[data-organization="owned"]').waitFor();
  assert.equal(await page.locator('.manager-organization-option[data-organization-id="owned"]').count(), 1);
  assert.equal(await page.evaluate(() => window.calls.filter((call) => call.path === "/me").length), 2);
  await assertSafe(page, errors);
});

test("personal owner compatibility does not fabricate ownership for a pure admin or modify platform organization inventory", async (t) => {
  const { origin, browser } = await startSite(t);
  const pure = await fixture(t, browser, origin, {
    account: false, profileOrganizations: [profileOwner], pages: [{ items: [], nextCursor: null }],
  });
  await pure.organizations();
  await pure.page.locator(".manager-empty-organizations").waitFor();
  assert.equal(await pure.page.locator("[data-organization]").count(), 0);
  assert.equal(await pure.page.evaluate(() => window.calls.some((call) => call.path === "/organizations/owned")), false);
  await assertSafe(pure.page, pure.errors);

  const mixed = await fixture(t, browser, origin);
  await mixed.page.evaluate(() => window.dashboard.setManagement(true));
  await mixed.page.locator(".manager-platform-tabs").getByRole("button", { name: "ארגונים", exact: true }).click();
  await mixed.page.locator('[data-organization="admin-only"]').waitFor();
  assert.equal(await mixed.page.locator('[data-organization="owned"]').count(), 0);
  assert.equal(await mixed.page.evaluate(() => window.calls.some((call) => call.path === "/organizations/owned")), false);
  await assertSafe(mixed.page, mixed.errors);
});

test("denied or stale owned organization details are excluded without exposing an unauthorized card", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const detailFailure of [403, 404]) await t.test(String(detailFailure), async (t) => {
    const { page, errors, organizations } = await fixture(t, browser, origin, { detailFailure });
    await organizations();
    await page.locator('[data-organization="member"]').waitFor();
    await page.waitForFunction(() => document.querySelector(".manager-view").getAttribute("aria-busy") === "false");
    assert.equal(await page.locator('[data-organization="owned"]').count(), 0);
    assert.equal(await page.locator(".manager-status").innerText(), "");
    await assertSafe(page, errors);
  });
});

test("owner detail service failure is visible and explicit reload restores the personal list", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, errors, organizations } = await fixture(t, browser, origin, { detailFailure: 503, failOnce: true });
  await organizations();
  await page.locator('.manager-status[role="alert"]').waitFor();
  assert.notEqual(await page.locator(".manager-status").innerText(), "");
  assert.equal(await page.locator('[data-organization="owned"]').count(), 0);
  assert.equal(await page.locator(".manager-empty-organizations").count(), 0);
  await page.getByRole("button", { name: "טעינה מחדש", exact: true }).click();
  await page.locator('[data-organization="owned"]').waitFor();
  assert.equal(await page.locator('[data-organization="member"]').count(), 1);
  assert.equal(await page.locator(".manager-status").innerText(), "");
  assert.equal(await page.locator(".manager-view").getAttribute("aria-busy"), "false");
  await assertSafe(page, errors);
});

test("navigation and disposal fence late owned-organization detail responses", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const dispose of [false, true]) await t.test(dispose ? "closed dashboard" : "another view", async (t) => {
    const { page, errors, organizations } = await fixture(t, browser, origin, { delayDetail: true });
    await organizations();
    await page.waitForFunction(() => window.pendingDetails === 1);
    assert.equal(await page.locator(".manager-view").getAttribute("aria-busy"), "true");
    if (dispose) await page.evaluate(() => window.dashboard.close());
    else {
      await page.locator(".manager-nav").getByRole("button", { name: "המערכות שלי", exact: true }).click();
      await page.locator(".manager-view h3").getByText("המערכות שלי", { exact: true }).waitFor();
    }
    await page.evaluate(async () => { window.resolveDetail(); await new Promise((resolve) => setTimeout(resolve, 25)); });
    assert.equal(await page.locator("[data-organization]").count(), 0);
    assert.equal(await page.locator(".manager-status").count() ? await page.locator(".manager-status").innerText() : "", "");
    assert.equal(await page.locator(".manager-progress:not([hidden])").count(), 0);
    await assertSafe(page, errors);
  });
});
