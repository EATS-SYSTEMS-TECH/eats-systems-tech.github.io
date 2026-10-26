import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const estimate = {
  kind: "monthly-estimate",
  currency: "USD",
  physicalGates: 16,
  monthlyCents: 8000,
  lines: {
    gates: { amountCents: 8000 },
    dualControls: { amountCents: 0 },
    groups: { amountCents: 0 },
    organizations: { amountCents: 0 },
  },
};
const person = {
  name: "Example Customer",
  email: "customer@example.test",
  role: "user",
  identityStatus: "verified",
  products: {
    host: {
      state: "active",
      role: "user",
      plan: "GROWTH",
      financials: estimate,
    },
    manager: { state: "no-plan" },
    pay: { state: "active", financials: { kind: "revenue", revenue: null } },
  },
};

test("global admins see unique counts, estimates, product links, filtering and pagination in Hebrew", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context, errors } = await scenario(browser, {
    platformRole: "admin",
    admin: true,
    enrolled: true,
    verified: true,
    manager: "active",
    pay: "active",
  });
  t.after(() => context.close());
  const requests = [];
  await context.route("**/api/v1/platform/directory?*", (route) => {
    const url = new URL(route.request().url());
    requests.push(url.searchParams);
    const admin = url.searchParams.get("role") === "admin";
    return route.fulfill({
      json: {
        counts: { admins: 2, users: 11, total: 13 },
        items: admin ? [] : [person],
        nextCursor:
          url.searchParams.has("after") || admin ? null : person.email,
      },
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + "/dashboard/?lang=he");
  const root = page.locator("#platform-admin-management");
  await root.locator(".platform-admin-person").waitFor();
  assert.match(await root.textContent(), /ניהול פלטפורמה/);
  assert.match(await root.textContent(), /GROWTH/);
  assert.match(await root.textContent(), /80\.00/);
  assert.equal(
    await root
      .locator(".platform-admin-counts strong")
      .allTextContents()
      .then((x) => x.join(",")),
    "2,11,13",
  );
  assert.deepEqual(
    await root
      .locator(".platform-admin-business a")
      .evaluateAll((nodes) => nodes.map((node) => new URL(node.href).pathname)),
    ["/dashboard/host/", "/dashboard/pay/", "/dashboard/manager/"],
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
    true,
  );
  if (process.env.WIFIGATE_ADMIN_SCREENSHOT)
    await root.screenshot({ path: process.env.WIFIGATE_ADMIN_SCREENSHOT });
  await root.getByRole("button", { name: "טען עוד", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".platform-admin-person").length === 2,
  );
  assert.equal(requests.at(-1).get("after"), person.email);
  await root
    .getByRole("button", { name: "WIFIGATE Admins", exact: true })
    .click();
  await root.getByText("לא נמצאו חשבונות.", { exact: true }).waitFor();
  assert.equal(requests.at(-1).get("role"), "admin");
  assert.deepEqual(errors, []);
});

test("members and admins without verified MFA never load the directory", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const options of [
    {},
    { platformRole: "admin", enrolled: true, verified: false },
  ]) {
    const fixture = await scenario(browser, options);
    t.after(() => fixture.context.close());
    await fixture.page.goto(origin + "/dashboard/");
    await fixture.page.locator("#product-switcher-button").waitFor();
    assert.equal(
      await fixture.page.locator("#platform-admin-management").isHidden(),
      true,
    );
    assert.equal(
      fixture.calls.some((call) => call?.path === "/api/v1/platform/directory"),
      false,
    );
  }
});

test("Pay management requests only Pay and shows unavailable billing without a false zero", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser, {
    platformRole: "admin",
    admin: true,
    enrolled: true,
    verified: true,
    pay: "active",
  });
  t.after(() => fixture.context.close());
  let product;
  await fixture.context.route("**/api/v1/platform/directory?*", (route) => {
    product = new URL(route.request().url()).searchParams.get("product");
    return route.fulfill({
      json: {
        counts: { admins: 1, users: 1, total: 2 },
        items: [{ ...person, products: { pay: person.products.pay } }],
        nextCursor: null,
      },
    });
  });
  await fixture.page.goto(origin + "/dashboard/pay/");
  const root = fixture.page.locator("#platform-admin-management");
  await root.locator(".platform-admin-person").waitFor();
  assert.equal(product, "pay");
  assert.equal(await root.locator("tbody tr").count(), 1);
  assert.match(await root.locator("tbody").textContent(), /—/);
  assert.doesNotMatch(await root.locator("tbody").textContent(), /0\.00/);
});

test("Host administration loads product plans only when its costs section is opened", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser, {
    admin: true,
    enrolled: true,
    verified: true,
  });
  t.after(() => fixture.context.close());
  const requests = [];
  await fixture.context.route("**/api/v1/platform/directory?*", (route) => {
    requests.push(new URL(route.request().url()).searchParams.get("product"));
    return route.fulfill({
      json: {
        counts: { admins: 1, users: 1, total: 2 },
        items: [{ ...person, products: { host: person.products.host } }],
        nextCursor: null,
      },
    });
  });
  await fixture.page.goto(origin + "/dashboard/host/overview/?lang=he");
  const root = fixture.page.locator("#admin-overview");
  await root
    .getByRole("heading", {
      name: "ניהול פלטפורמה · WIFIGATE Host",
      exact: true,
    })
    .waitFor();
  assert.equal(requests.length, 0);
  await root
    .locator("summary")
    .filter({ hasText: "תוכניות ועלויות משתמשי Host" })
    .click();
  await root.locator(".platform-admin-person").waitFor();
  assert.deepEqual(requests, ["host"]);
  assert.equal(
    await root.locator(".platform-admin-person tbody tr").count(),
    1,
  );
  assert.match(
    await root.locator(".platform-admin-person").textContent(),
    /80\.00/,
  );
});
