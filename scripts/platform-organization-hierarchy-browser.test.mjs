import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

for (const language of ["he", "en"]) for (const width of [390, 1440]) {
  test(`organization hierarchy ${language} ${width}: owner first and free employees in separate columns`, async t => {
    const { origin, browser } = await startSite(t);
    const f = await scenario(browser, { platformRole: "admin", admin: true, enrolled: true, verified: true, viewport: { width, height: 1000 } });
    t.after(() => f.context.close());
    await f.context.route("**/api/v1/platform/directory?*", route => route.fulfill({ json: {
      counts: { admins: 1, users: 1, total: 2 }, productCounts: { host: 1, manager: 2, pay: 1 }, items: [], nextCursor: null,
    } }));
    let requested = false;
    await f.context.route("**/api/v1/platform/directory/organization-overview?*", route => {
      requested = new URL(route.request().url()).searchParams.get("includeMembers") === "true";
      const owner = { email: "owner@example.test", subscriptionStatus: "active", billingExempt: false, products: { manager: { state: "active", role: "user", financials: { kind: "monthly-estimate", currency: "USD", physicalGates: 1, monthlyCents: 190, lines: { gates: { amountCents: 190 }, dualControls: { amountCents: 0 }, groups: { amountCents: 0 }, organizations: { amountCents: 0 } } } } } };
      return route.fulfill({ json: { items: [
        { id: "one", name: "WIFIGATE TEST", status: "active", products: { manager: "active" }, owner, members: [{ email: "employee@example.test", subscriptionRequired: false, products: { manager: { role: "organization-user", status: "active" } } }] },
        { id: "two", name: "Second organization", status: "active", products: { manager: "active" }, owner, members: [] },
      ], complete: true, basis: "provisioned-organizations" } });
    });
    await f.page.goto(origin + "/dashboard/platform/?lang=" + language);
    const root = f.page.locator("#platform-admin-management");
    await root.locator('[data-role="organization-users"]').click();
    assert.ok(await root.locator(".platform-admin-org-separator").evaluate(node => parseFloat(getComputedStyle(node).borderInlineStartWidth) >= 3));
    const columns = root.locator(".platform-admin-organization-column");
    await columns.first().waitFor();
    assert.equal(requested, true);
    assert.equal(await columns.count(), 2);
    const first = columns.first();
    assert.equal(await first.locator(".platform-admin-organization-owner").getByText("WIFIGATE User", { exact: true }).count(), 1);
    assert.match(await first.locator(".platform-admin-organization-owner").innerText(), /1[.,]90/);
    const employees = first.locator(".platform-admin-organization-members");
    assert.equal(await employees.getByText("employee@example.test", { exact: true }).count(), 1);
    assert.match(await employees.innerText(), language === "he" ? /ללא דמי מנוי/ : /No subscription fee/);
    assert.equal(await employees.getByText("WIFIGATE User", { exact: true }).count(), 0);
    assert.equal(await root.locator(".platform-admin-person").count(), 0);
    assert.equal(await root.locator(".platform-admin-revenue").isHidden(), true);
    assert.equal(await f.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await f.page.screenshot({ path: `work/organization-hierarchy-20261030/hierarchy-${language}-${width}.png`, fullPage: true });
    await root.locator('[data-role="user"]').click();
    await root.locator(".platform-admin-organization-column").waitFor({ state: "detached" });
    assert.equal(await root.locator(".platform-admin-organization-columns").count(), 0);
    assert.deepEqual(f.errors, []);
  });
}

test("organization employee profile is not a WIFIGATE subscription user", async t => {
  const { origin, browser } = await startSite(t);
  const f = await scenario(browser, { host: "no-plan", pay: "no-plan", manager: "active", managerRole: "organization-user", enrolled: true, verified: true });
  t.after(() => f.context.close());
  await f.page.goto(origin + "/dashboard/?lang=he");
  const details = f.page.locator("#profile-details");
  await details.getByText("משתמש ארגון", { exact: true }).waitFor();
  assert.equal(await details.getByText("WIFIGATE User", { exact: true }).count(), 0);
  assert.equal(await f.page.locator(".platform-management-entry:visible").count(), 0);
  assert.deepEqual(f.errors, []);
});
