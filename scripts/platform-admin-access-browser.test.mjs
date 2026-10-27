import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const estimate = {
  kind: "monthly-estimate",
  currency: "USD",
  physicalGates: 1,
  monthlyCents: 190,
  lines: {
    gates: { amountCents: 190 },
    dualControls: { amountCents: 0 },
    groups: { amountCents: 0 },
    organizations: { amountCents: 0 },
  },
};
const customer = {
  name: "Example Customer",
  email: "customer@example.test",
  role: "user",
  identityStatus: "verified",
  products: {
    host: { state: "blocked", financials: null },
    pay: { state: "no-plan" },
    manager: { state: "active", role: "user", financials: estimate },
  },
};
const admin = {
  platformRole: "admin",
  admin: true,
  enrolled: true,
  verified: true,
  authTime: Math.floor(Date.now() / 1000),
};

test("fresh TOTP is required before a mutation and cancelling reauthentication sends no change", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context, calls } = await scenario(browser, {
    ...admin,
    authTime: 0,
  });
  t.after(() => context.close());
  await directory(context);
  const changes = [];
  await context.route("**/api/v1/platform/directory/access", (route) => {
    changes.push(route.request().postDataJSON());
    return route.fulfill({ json: { state: "active" } });
  });
  await page.goto(origin + "/dashboard/platform/");
  await page.locator(".platform-admin-invite").click();
  const modal = page.locator(".platform-access-dialog");
  await modal.locator("input[name=email]").fill("new@example.test");
  await modal.locator("select[name=product]").selectOption("host");
  await modal.locator("button[type=submit]").click();
  const mfa = page.locator("#mfa-challenge");
  await mfa.waitFor();
  assert.equal(changes.length, 0);
  await mfa.locator("[data-cancel]").click();
  await modal
    .getByText("The action did not complete. You can try again.", {
      exact: true,
    })
    .waitFor();
  assert.equal(changes.length, 0);
  await modal.locator("button[type=submit]").click();
  await mfa.locator("input[name=code]").fill("123456");
  await mfa.locator("button[type=submit]").click();
  await modal.getByText(/Access is ready/).waitFor();
  assert.equal(changes.length, 1);
  assert.ok(calls.includes("reauth"));
});

test("a delayed revenue response cannot overwrite the newest product filter", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, admin);
  t.after(() => context.close());
  await directory(context);
  let release;
  await context.route(
    "**/api/v1/platform/directory/financials?*",
    async (route) => {
      const product = new URL(route.request().url()).searchParams.get(
        "product",
      );
      if (product === "host")
        await new Promise((resolve) => {
          release = resolve;
        });
      return route.fulfill({
        json: {
          totals: [
            { currency: "USD", amountCents: product === "host" ? 9000 : 190 },
          ],
          complete: true,
          unknownAccounts: 0,
        },
      });
    },
  );
  await page.goto(origin + "/dashboard/platform/");
  await page.locator('.platform-admin-revenue[aria-busy="false"]').waitFor();
  const hostRequest = page.waitForRequest(
    (request) =>
      request.url().includes("/directory/financials?") &&
      request.url().includes("product=host"),
  );
  await page.locator('.platform-admin-business [data-product="host"]').click();
  await hostRequest;
  await page
    .locator('.platform-admin-business [data-product="manager"]')
    .click();
  await page.locator('.platform-admin-revenue[aria-busy="false"]').waitFor();
  const oldResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/directory/financials?") &&
      response.url().includes("product=host"),
  );
  release();
  await oldResponse;
  assert.match(
    await page.locator(".platform-admin-revenue > strong").textContent(),
    /1\.90/,
  );
});
async function directory(context) {
  await context.route("**/api/v1/platform/directory?*", (route) =>
    route.fulfill({
      json: {
        counts: { admins: 0, users: 12, total: 12 },
        productCounts: { host: 12, pay: 0, manager: 12 },
        items: [customer],
        nextCursor: new URL(route.request().url()).searchParams.has("after")
          ? null
          : customer.email,
      },
    }),
  );
}

test("the closed user card shows Manager 1.90 and revenue covers all matching pages, filters and currencies", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context, errors } = await scenario(browser, admin);
  t.after(() => context.close());
  await directory(context);
  const financialRequests = [];
  await context.route("**/api/v1/platform/directory/financials?*", (route) => {
    const params = new URL(route.request().url()).searchParams;
    financialRequests.push(params);
    return route.fulfill({
      json: {
        kind: "monthly-estimate",
        totals: [
          {
            currency: "USD",
            amountCents: params.get("product") === "host" ? 0 : 2280,
          },
        ],
        accounts: 12,
        unknownAccounts: 0,
        complete: true,
        payRevenueAvailable: false,
      },
    });
  });
  await page.goto(origin + "/dashboard/platform/?lang=he");
  await page.locator(".platform-admin-person-summary").waitFor();
  assert.match(
    await page.locator(".platform-admin-person-price").textContent(),
    /1\.90/,
  );
  assert.equal(
    await page.locator(".platform-admin-person").getAttribute("open"),
    null,
  );
  await page.locator('.platform-admin-revenue[aria-busy="false"]').waitFor();
  assert.match(
    await page.locator(".platform-admin-revenue > strong").textContent(),
    /22\.80/,
  );
  if (process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS) {
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.screenshot({
        path: `${process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS}/platform-revenue-he-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page.getByRole("button", { name: "טען עוד", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelectorAll(".platform-admin-person").length === 2,
  );
  assert.equal(
    financialRequests.length,
    1,
    "pagination does not trigger another full revenue scan",
  );
  await page.locator('.platform-admin-business [data-product="host"]').click();
  await page.locator('.platform-admin-revenue[aria-busy="false"]').waitFor();
  assert.equal(financialRequests.at(-1).get("product"), "host");
  assert.match(
    await page.locator(".platform-admin-revenue > strong").textContent(),
    /0\.00/,
  );
  assert.deepEqual(errors, []);
});

test("removal requires an explicit popup confirmation, targets one product and refreshes after success", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) {
    const { page, context, errors } = await scenario(browser, admin);
    t.after(() => context.close());
    await page.setViewportSize({ width: 390, height: 900 });
    await directory(context);
    const changes = [];
    await context.route(
      "**/api/v1/platform/directory/access",
      async (route) => {
        changes.push({
          input: route.request().postDataJSON(),
          key: route.request().headers()["idempotency-key"],
        });
        return route.fulfill({
          json: { product: "manager", state: "blocked", emailDelivery: false },
        });
      },
    );
    await page.goto(origin + `/dashboard/platform/?lang=${language}`);
    await page.locator(".platform-admin-person-summary").click();
    await page.locator(".platform-admin-remove").click();
    const modal = page.locator(".platform-access-dialog");
    await modal.waitFor();
    assert.equal(changes.length, 0);
    await modal.locator("select[name=product]").selectOption("manager");
    assert.match(
      await modal.locator(".platform-access-scope").textContent(),
      /customer@example.test.*WIFIGATE Manager/,
    );
    if (process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS)
      await page.screenshot({
        path: `${process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS}/access-confirm-${language}-390.png`,
        fullPage: true,
      });
    await modal.locator(".platform-access-cancel").click();
    assert.equal(changes.length, 0, "Cancel never mutates access");
    await page.locator(".platform-admin-remove").click();
    await modal.locator("select[name=product]").selectOption("manager");
    await modal.locator("button[type=submit]").click();
    await modal.waitFor({ state: "detached" });
    await page.locator(".platform-admin-person-summary").waitFor();
    assert.deepEqual(changes[0].input, {
      action: "remove",
      email: customer.email,
      product: "manager",
    });
    assert.match(changes[0].key, /^[a-f0-9-]{36}$/);
    assert.equal(changes.length, 1);
    assert.deepEqual(errors, []);
  }
});

test("invitation chooses a Pay organization, never grants admin and offers a link without claiming email delivery", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context, errors } = await scenario(browser, admin);
  t.after(() => context.close());
  await directory(context);
  await context.route("**/api/v1/platform/directory/organizations", (route) =>
    route.fulfill({
      json: { items: [{ id: "hotel", name: "Example Hotel" }] },
    }),
  );
  const changes = [];
  await context.route("**/api/v1/platform/directory/access", (route) => {
    changes.push(route.request().postDataJSON());
    return route.fulfill({
      json: { product: "pay", state: "active", emailDelivery: false },
    });
  });
  await page.goto(origin + "/dashboard/platform/?lang=he");
  await page.locator(".platform-admin-invite").click();
  const modal = page.locator(".platform-access-dialog");
  await modal.locator("input[name=email]").fill("new@example.test");
  await modal.locator("select[name=product]").selectOption("pay");
  await modal
    .locator("select[name=organizationId] option")
    .waitFor({ state: "attached" });
  await modal.locator("button[type=submit]").click();
  await modal.getByText(/הגישה הוגדרה/).waitFor();
  assert.deepEqual(changes, [
    {
      action: "invite",
      email: "new@example.test",
      product: "pay",
      organizationId: "hotel",
    },
  ]);
  assert.match(
    await modal.locator(".platform-access-feedback").textContent(),
    /לא נשלחה הודעת דוא״ל/,
  );
  assert.equal(
    await modal.getByLabel("קישור כניסה לשיתוף").inputValue(),
    origin + "/dashboard/pay/?lang=he",
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  assert.deepEqual(errors, []);
});

test("incomplete revenue is never shown as a full total and retry keeps the same mutation key", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, admin);
  t.after(() => context.close());
  await directory(context);
  await context.route("**/api/v1/platform/directory/financials?*", (route) =>
    route.fulfill({
      json: {
        totals: [{ currency: "USD", amountCents: 190 }],
        unknownAccounts: 1,
        complete: false,
      },
    }),
  );
  const keys = [];
  await context.route("**/api/v1/platform/directory/access", (route) => {
    keys.push(route.request().headers()["idempotency-key"]);
    return route.fulfill(
      keys.length === 1
        ? { status: 503, json: { error: { code: "DEPENDENCY_UNAVAILABLE" } } }
        : { json: { state: "active" } },
    );
  });
  await page.goto(origin + "/dashboard/platform/");
  await page.locator('.platform-admin-revenue[aria-busy="false"]').waitFor();
  assert.equal(
    await page.locator(".platform-admin-revenue > strong").textContent(),
    "Unavailable",
  );
  assert.match(
    await page.locator(".platform-admin-revenue p").textContent(),
    /1\.90.*1 accounts/,
  );
  await page.locator(".platform-admin-invite").click();
  const modal = page.locator(".platform-access-dialog");
  await modal.locator("input[name=email]").fill("new@example.test");
  await modal.locator("select[name=product]").selectOption("host");
  await modal.locator("button[type=submit]").click();
  await modal
    .getByText("The action did not complete. You can try again.", {
      exact: true,
    })
    .waitFor();
  await modal.locator("button[type=submit]").click();
  await modal.getByText(/Access is ready/).waitFor();
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
});
