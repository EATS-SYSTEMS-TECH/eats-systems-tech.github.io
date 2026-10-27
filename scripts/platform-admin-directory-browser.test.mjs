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

test("global admins see unique counts, estimates, product filters and pagination in Hebrew", async (t) => {
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
        productCounts: { host: 12, pay: 3, manager: 8 },
        items: admin ? [] : [person],
        nextCursor:
          url.searchParams.has("after") || admin ? null : person.email,
      },
    });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + "/dashboard/?lang=he");
  await page.locator("#platform-management-entry").waitFor();
  assert.equal(requests.length, 0, "the profile does not load the directory");
  assert.equal(
    await page.locator("#platform-admin-management").isHidden(),
    true,
  );
  await page.locator("#platform-management-entry").click();
  await page.waitForURL(origin + "/dashboard/platform/?lang=he");
  const root = page.locator("#platform-admin-management");
  await root.locator(".platform-admin-person").waitFor();
  await page
    .getByRole("heading", { name: "ניהול פלטפורמה", exact: true })
    .waitFor();
  assert.equal(await page.locator("#platform-account-panel").isHidden(), true);
  assert.equal(await page.locator("#profile-subscriptions").isHidden(), true);
  assert.equal(
    await root.locator(".platform-admin-person").getAttribute("open"),
    null,
  );
  await root.locator(".platform-admin-person-summary").click();
  await root.locator("tbody").waitFor();
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
      .locator(".platform-admin-business button")
      .evaluateAll((nodes) => nodes.map((node) => node.dataset.product)),
    ["host", "pay", "manager"],
  );
  assert.equal(await root.locator(".platform-admin-business a").count(), 0);
  assert.deepEqual(
    await root.locator(".platform-admin-product-count").allTextContents(),
    ["12", "3", "8"],
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

test("the management shortcut follows the interface direction and the admin page has a return link", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440]) {
      const fixture = await scenario(browser, {
        platformRole: "admin",
        admin: true,
        enrolled: true,
        verified: true,
      });
      t.after(() => fixture.context.close());
      const { page, context } = fixture;
      await page.setViewportSize({ width, height: 900 });
      let requests = 0;
      await context.route("**/api/v1/platform/directory?*", (route) => {
        requests++;
        return route.fulfill({
          json: {
            counts: { admins: 1, users: 1, total: 2 },
            items: [person],
            nextCursor: null,
          },
        });
      });
      const suffix = language === "he" ? "?lang=he" : "";
      await page.goto(origin + "/dashboard/" + suffix);
      const entry = page.locator("#platform-management-entry");
      await entry.waitFor();
      assert.equal(requests, 0);
      const box = await entry.boundingBox();
      assert.ok(box.y + box.height <= 900 && box.y >= 750);
      assert.ok(language === "he" ? box.x > width / 2 : box.x < width / 2);
      if (process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS)
        await page.screenshot({
          path: `${process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS}/dashboard-entry-${language}-${width}.png`,
          fullPage: false,
        });
      await entry.click();
      await page.waitForURL(origin + "/dashboard/platform/" + suffix);
      await page.locator(".platform-admin-person-summary").waitFor();
      assert.equal(
        await page
          .locator("#product-switcher-button .product-switcher__name")
          .textContent(),
        language === "he" ? "ניהול פלטפורמה" : "Platform management",
      );
      assert.equal(requests, 1);
      assert.equal(await entry.isHidden(), true);
      const summary = page.locator(".platform-admin-person-summary");
      await summary.focus();
      await page.keyboard.press("Enter");
      assert.equal(
        await page.locator(".platform-admin-person").getAttribute("open"),
        "",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      if (process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS)
        await page.screenshot({
          path: `${process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS}/management-${language}-${width}.png`,
          fullPage: true,
        });
      await page.locator(".platform-management-back").click();
      await page.waitForURL(origin + "/dashboard/" + suffix);
      await page.locator("#platform-management-entry").waitFor();
      assert.equal(
        requests,
        1,
        "returning to the profile does not reload the directory",
      );
    }
});

test("a direct management URL stays closed for members and unverified admin sessions", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const options of [
    {},
    { platformRole: "admin", admin: true, enrolled: true, verified: false },
  ]) {
    const fixture = await scenario(browser, options);
    t.after(() => fixture.context.close());
    let requests = 0;
    await fixture.context.route("**/api/v1/platform/directory?*", (route) => {
      requests++;
      return route.fulfill({ status: 403, json: {} });
    });
    await fixture.page.goto(origin + "/dashboard/platform/?lang=he");
    await fixture.page.locator("#product-switcher-button").waitFor();
    assert.equal(
      await fixture.page.locator("#platform-admin-management").isHidden(),
      true,
    );
    assert.equal(
      await fixture.page.locator("#platform-management-entry").isHidden(),
      true,
    );
    assert.equal(requests, 0);
    if (options.platformRole)
      assert.equal(
        await fixture.page.locator("#platform-security").isVisible(),
        true,
      );
    else
      assert.match(
        await fixture.page.locator("#platform-status").textContent(),
        /מנהלי WIFIGATE/,
      );
  }
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
  assert.match(await root.locator("tbody").textContent(), /Unavailable/);
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

test("For Business cards filter in place, retain the role and reset pagination", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) {
    const { page, context, errors } = await scenario(browser, {
      platformRole: "admin",
      admin: true,
      enrolled: true,
      verified: true,
    });
    t.after(() => context.close());
    await page.setViewportSize({ width: 390, height: 900 });
    const requests = [];
    await context.route("**/api/v1/platform/directory?*", (route) => {
      const query = new URL(route.request().url()).searchParams;
      requests.push(query);
      const product = query.get("product");
      return route.fulfill({
        json: {
          counts: {
            admins: 2,
            users: product === "host" ? 19 : product === "manager" ? 5 : 25,
            total: product === "host" ? 21 : product === "manager" ? 7 : 27,
          },
          ...(product === "all"
            ? { productCounts: { host: 21, pay: 0, manager: 7 } }
            : {}),
          items:
            product === "pay"
              ? []
              : [{ ...person, name: product + " customer" }],
          nextCursor: query.has("after") ? null : person.email,
        },
      });
    });
    const url = origin + "/dashboard/platform/?lang=" + language;
    await page.goto(url);
    const root = page.locator("#platform-admin-management");
    await root.locator(".platform-admin-person").waitFor();
    assert.equal(
      await root
        .locator('[data-product="host"]')
        .evaluate((node) => getComputedStyle(node).backgroundColor),
      "rgb(255, 255, 255)",
    );
    assert.equal(
      requests.length,
      1,
      "overview totals use the single initial request",
    );
    assert.deepEqual(
      await root.locator(".platform-admin-product-count").allTextContents(),
      ["21", "0", "7"],
    );
    await root
      .getByRole("button", {
        name: language === "he" ? "טען עוד" : "Load more",
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () => document.querySelectorAll(".platform-admin-person").length === 2,
    );
    const host = root.locator('[data-product="host"]');
    await host.focus();
    await page.keyboard.press("Enter");
    await root.getByText("host customer", { exact: true }).waitFor();
    assert.equal(page.url(), url);
    assert.equal(await host.getAttribute("aria-pressed"), "true");
    if (process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS)
      await page.screenshot({
        path: `${process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS}/product-filter-selected-${language}-390.png`,
        fullPage: true,
      });
    await page.waitForFunction(() => {
      const selected = document.querySelector('.platform-admin-business [data-product="host"]');
      return selected && getComputedStyle(selected).backgroundColor !== "rgb(255, 255, 255)";
    });
    assert.notEqual(
      await host.evaluate((node) => getComputedStyle(node).backgroundColor),
      "rgb(255, 255, 255)",
    );
    assert.equal(requests.at(-1).get("product"), "host");
    assert.equal(requests.at(-1).has("after"), false);
    assert.equal(await root.locator(".platform-admin-person").count(), 1);
    assert.equal(
      await root.locator(".platform-admin-counts strong").last().textContent(),
      "21",
    );
    await root
      .getByRole("button", { name: "WIFIGATE Host Users", exact: true })
      .click();
    await page.waitForFunction(() =>
      document.querySelector('#platform-admin-management[aria-busy="false"]'),
    );
    await root.locator('[data-product="manager"]').click();
    await root.getByText("manager customer", { exact: true }).waitFor();
    assert.equal(requests.at(-1).get("role"), "user");
    assert.equal(requests.at(-1).get("product"), "manager");
    await root.locator('[data-product="pay"]').click();
    await root
      .getByText(
        language === "he" ? "לא נמצאו חשבונות." : "No accounts found.",
        { exact: true },
      )
      .waitFor();
    assert.equal(requests.at(-1).get("role"), "user");
    assert.equal(
      await root.locator('[data-product="pay"]').getAttribute("aria-pressed"),
      "true",
    );
    assert.deepEqual(
      await root.locator(".platform-admin-product-count").allTextContents(),
      ["21", "0", "7"],
    );
    await root
      .getByRole("button", {
        name: language === "he" ? "כל המסלולים" : "All plans",
        exact: true,
      })
      .click();
    await root.getByText("all customer", { exact: true }).waitFor();
    assert.equal(requests.at(-1).get("product"), "all");
    assert.equal(requests.at(-1).has("after"), false);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    if (process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS) {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.screenshot({
          path: `${process.env.WIFIGATE_ADMIN_UX_SCREENSHOTS}/product-filters-${language}-${width}.png`,
          fullPage: true,
        });
      }
    }
    assert.deepEqual(errors, []);
  }
});

test("a late product response cannot replace the latest filter or its counts", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, {
    platformRole: "admin",
    admin: true,
    enrolled: true,
    verified: true,
  });
  t.after(() => context.close());
  let releaseHost;
  await context.route("**/api/v1/platform/directory?*", async (route) => {
    const product = new URL(route.request().url()).searchParams.get("product");
    if (product === "host")
      await new Promise((resolve) => {
        releaseHost = resolve;
      });
    return route.fulfill({
      json: {
        counts: {
          admins: 1,
          users: product === "host" ? 98 : 6,
          total: product === "host" ? 99 : 7,
        },
        ...(product === "all"
          ? { productCounts: { host: 99, pay: 0, manager: 7 } }
          : {}),
        items: [{ ...person, name: product + " customer" }],
        nextCursor: null,
      },
    });
  });
  await page.goto(origin + "/dashboard/platform/");
  await page.getByText("all customer", { exact: true }).waitFor();
  const hostRequest = page.waitForRequest((request) =>
    request.url().includes("product=host"),
  );
  await page.locator('.platform-admin-business [data-product="host"]').click();
  await hostRequest;
  await page
    .locator('.platform-admin-business [data-product="manager"]')
    .click();
  await page.getByText("manager customer", { exact: true }).waitFor();
  assert.ok(releaseHost);
  const oldResponse = page.waitForResponse((response) =>
    response.url().includes("product=host"),
  );
  releaseHost();
  await oldResponse;
  assert.equal(
    await page.locator(".platform-admin-person-identity strong").textContent(),
    "manager customer",
  );
  assert.equal(
    await page
      .locator('.platform-admin-business [aria-pressed="true"]')
      .getAttribute("data-product"),
    "manager",
  );
  assert.equal(
    await page.locator(".platform-admin-counts strong").last().textContent(),
    "7",
  );
});

test("a failed product filter shows unavailable counts and can return to the overview", async (t) => {
  const { origin, browser } = await startSite(t);
  const { page, context } = await scenario(browser, {
    platformRole: "admin",
    admin: true,
    enrolled: true,
    verified: true,
  });
  t.after(() => context.close());
  await context.route("**/api/v1/platform/directory?*", (route) => {
    const product = new URL(route.request().url()).searchParams.get("product");
    return route.fulfill(
      product === "host"
        ? { status: 503, json: {} }
        : {
            json: {
              counts: { admins: 1, users: 2, total: 3 },
              items: [person],
              nextCursor: null,
            },
          },
    );
  });
  await page.goto(origin + "/dashboard/platform/");
  await page.locator(".platform-admin-person").waitFor();
  assert.deepEqual(
    await page.locator(".platform-admin-product-count").allTextContents(),
    ["Unavailable", "Unavailable", "Unavailable"],
    "missing product totals are never shown as zero",
  );
  await page.locator('.platform-admin-business [data-product="host"]').click();
  await page
    .getByText("Data is currently unavailable. Try refreshing.", {
      exact: true,
    })
    .waitFor();
  assert.deepEqual(
    await page.locator(".platform-admin-counts strong").allTextContents(),
    ["Unavailable", "Unavailable", "Unavailable"],
  );
  assert.equal(await page.locator(".platform-admin-person").count(), 0);
  await page.getByRole("button", { name: "All plans", exact: true }).click();
  await page.locator(".platform-admin-person").waitFor();
  assert.equal(
    await page.locator(".platform-admin-counts strong").last().textContent(),
    "3",
  );
});
