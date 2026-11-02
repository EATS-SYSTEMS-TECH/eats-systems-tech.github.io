import assert from "node:assert/strict";
import test from "node:test";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const administrator = {
  platformRole: "admin",
  admin: true,
  enrolled: true,
  verified: true,
  authTime: Math.floor(Date.now() / 1000),
};
const email = "reception@example.test";

async function setup(browser, origin, language = "en") {
  const fixture = await scenario(browser, administrator);
  const access = {
    state: "active",
    personalRole: null,
    personalAccessState: "no-plan",
  };
  let organizationRequests = 0;
  await fixture.context.route("**/api/v1/platform/directory?*", (route) =>
    route.fulfill({
      json: {
        counts: { admins: 0, users: 1, total: 1 },
        productCounts: { host: 0, pay: 1, manager: 0 },
        items: [
          {
            email,
            name: "Reception",
            role: "user",
            identityStatus: "verified",
            products: {
              host: { state: "no-plan" },
              pay: { ...access },
              manager: { state: "no-plan" },
            },
          },
        ],
        nextCursor: null,
      },
    }),
  );
  await fixture.context.route(
    "**/api/v1/platform/directory/organizations",
    (route) => {
      organizationRequests++;
      return route.fulfill({
        json: { items: [{ id: "hotel", name: "Hotel 1" }] },
      });
    },
  );
  await fixture.page.goto(
    `${origin}/dashboard/platform/?product=pay&lang=${language}`,
  );
  await fixture.page.locator(".platform-admin-person-summary").waitFor();
  return {
    ...fixture,
    access,
    organizationRequests: () => organizationRequests,
  };
}

test("personal Pay User grants and revokes stay separate from organization membership in both languages", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["en", "he"]) {
    const fixture = await setup(browser, origin, language);
    t.after(() => fixture.context.close());
    const { page, context, access } = fixture;
    const changes = [];
    await context.route("**/api/v1/platform/directory/access", (route) => {
      const input = route.request().postDataJSON();
      changes.push({
        input,
        key: route.request().headers()["idempotency-key"],
      });
      access.personalRole = input.action === "invite" ? "user" : null;
      access.personalAccessState =
        input.action === "invite" ? "active" : "blocked";
      return route.fulfill({
        json: {
          product: "pay",
          scope: "personal",
          state: access.personalAccessState,
          changed: true,
          emailDelivery: false,
        },
      });
    });
    await page.locator(".platform-admin-person-summary").click();
    assert.match(
      await page.locator(".platform-admin-access").innerText(),
      /Organization access|גישה דרך ארגון/,
    );
    await page.locator(".platform-admin-invite").click();
    const modal = page.locator(".platform-access-dialog");
    await modal.locator("input[name=email]").fill(email);
    assert.equal(
      await modal.locator("select[name=product]").inputValue(),
      "pay",
    );
    assert.equal(
      await modal.locator("select[name=scope]").inputValue(),
      "personal",
    );
    assert.equal(
      await modal.locator("select[name=organizationId]").isVisible(),
      false,
    );
    assert.equal(fixture.organizationRequests(), 0);
    assert.match(
      await modal.innerText(),
      /does not join an organization or change billing|אינה מצרפת את המשתמש לארגון ואינה משנה חיוב/,
    );
    await modal.locator("button[type=submit]").click();
    await modal
      .locator(".platform-access-feedback", {
        hasText: /Access is ready|הגישה הוגדרה/,
      })
      .waitFor();
    assert.deepEqual(changes[0].input, {
      action: "invite",
      email,
      product: "pay",
      scope: "personal",
    });
    assert.match(changes[0].key, /^[a-f0-9-]{36}$/);
    await modal.locator(".platform-access-cancel").click();
    await page.locator(".platform-admin-person-summary").click();
    assert.match(
      await page.locator(".platform-admin-access").innerText(),
      /Pay User/,
    );
    await page.locator(".platform-admin-remove").click();
    assert.equal(
      await modal.locator("select[name=scope]").inputValue(),
      "personal",
    );
    assert.match(
      await modal.innerText(),
      /memberships and roles stay unchanged|החברות והתפקידים בארגונים יישארו/,
    );
    await modal.locator("button[type=submit]").click();
    await modal.waitFor({ state: "detached" });
    assert.deepEqual(changes[1].input, {
      action: "remove",
      email,
      product: "pay",
      scope: "personal",
    });
    await page.locator(".platform-admin-person-summary").click();
    const status = await page.locator(".platform-admin-access").innerText();
    assert.match(status, /Personal access blocked|גישה אישית חסומה/);
    assert.match(status, /Organization access|גישה דרך ארגון/);
    assert.equal(fixture.organizationRequests(), 0);
    assert.deepEqual(fixture.errors, []);
    await context.close();
  }
});

test("personal Pay access never reports success for denied, conflicting, unavailable or incomplete responses", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const response of [
    { status: 403, json: { error: { code: "TOTP_REQUIRED" } } },
    { status: 409, json: { error: { code: "VERSION_CONFLICT" } } },
    { status: 503, json: { error: { code: "DEPENDENCY_UNAVAILABLE" } } },
    {
      status: 200,
      json: { product: "pay", state: "active", emailDelivery: false },
    },
  ]) {
    const fixture = await setup(browser, origin);
    t.after(() => fixture.context.close());
    const requests = [];
    await fixture.context.route(
      "**/api/v1/platform/directory/access",
      (route) => {
        requests.push({
          input: route.request().postDataJSON(),
          key: route.request().headers()["idempotency-key"],
        });
        return route.fulfill(response);
      },
    );
    await fixture.page.locator(".platform-admin-invite").click();
    const modal = fixture.page.locator(".platform-access-dialog");
    await modal.locator("input[name=email]").fill(email);
    for (let attempt = 0; attempt < 2; attempt++) {
      await modal.locator("button[type=submit]").click();
      await modal
        .locator(".platform-access-feedback", {
          hasText:
            /Sign in again|Access has changed|The action did not complete/,
        })
        .waitFor();
      assert.equal(
        await modal.locator("button[type=submit]").isVisible(),
        true,
      );
      assert.equal(await modal.getByLabel("Sign-in link to share").count(), 0);
    }
    assert.equal(requests.length, 2);
    assert.equal(requests[0].key, requests[1].key);
    assert.deepEqual(requests[0].input, {
      action: "invite",
      email,
      product: "pay",
      scope: "personal",
    });
    await fixture.context.close();
  }
});

test("a full Pay removal remains an explicit separate choice and the Pay role guide does not promise a subscription", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await setup(browser, origin);
  t.after(() => fixture.context.close());
  let input;
  await fixture.context.route(
    "**/api/v1/platform/directory/access",
    (route) => {
      input = route.request().postDataJSON();
      return route.fulfill({
        json: {
          product: "pay",
          state: "blocked",
          changed: true,
          emailDelivery: false,
        },
      });
    },
  );
  await fixture.page.locator(".platform-admin-person-summary").click();
  await fixture.page.locator(".platform-admin-remove").click();
  const modal = fixture.page.locator(".platform-access-dialog");
  await modal.locator("select[name=scope]").selectOption("all");
  await modal.locator("button[type=submit]").click();
  await modal.waitFor({ state: "detached" });
  assert.deepEqual(input, { action: "remove", email, product: "pay" });
  await fixture.page.evaluate(async () =>
    (await import("/js/role-guide.js")).openRoleGuide({
      product: "pay",
      language: "en",
    }),
  );
  const guide = fixture.page.locator(".role-guide-panel[data-product=pay]");
  assert.match(
    await guide.innerText(),
    /does not create a subscription or change billing/,
  );
  assert.equal(
    await guide.getByText("Monthly subscription", { exact: true }).count(),
    0,
  );
});
