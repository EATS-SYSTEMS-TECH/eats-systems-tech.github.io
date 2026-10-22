import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { passGateGame } from "./gate-game-helper.mjs";
import { scenario, startSite } from "./platform-test-fixtures.mjs";
import { workspaceFor } from "./host-test-shell.mjs";

test("web sign-in persists locally and activity renews a full idle day", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser);
  t.after(() => fixture.context.close());
  const { page, calls } = fixture;
  await page.clock.install();
  await page.goto(origin + "/dashboard/");
  await page.locator("#product-switcher-button").waitFor();
  assert.ok(calls.some(event => event?.type === "persistence" && event.mode === "local"));
  await page.clock.fastForward(23 * 60 * 60 * 1000);
  assert.equal(calls.includes("signout"), false);
  await page.evaluate(() => window.dispatchEvent(new Event("pointerdown")));
  await page.clock.fastForward(2 * 60 * 60 * 1000);
  assert.equal(calls.includes("signout"), false, "activity extends the idle window");
  await page.clock.fastForward(22 * 60 * 60 * 1000 + 1);
  await page.waitForURL(origin + "/login/");
  assert.ok(calls.includes("signout"));
});

test("returning to the dashboard preserves its view until a manual reload", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) {
    await t.test(language, async (t) => {
      const { page, context, calls, errors } = await scenario(browser);
      t.after(() => context.close());
      const profileCalls = () =>
        calls.filter((call) => call?.path === "/api/v1/platform/me").length;
      await page.goto(origin + "/dashboard/" + (language === "he" ? "?lang=he" : ""));
      await page.locator("#product-switcher-button").waitFor();
      const initialCalls = profileCalls();
      assert.ok(initialCalls > 0);
      await page.evaluate(() => {
        window.originalSwitcher = document.querySelector("#product-switcher-button");
        for (let i = 0; i < 3; i++) {
          window.dispatchEvent(new Event("blur"));
          window.dispatchEvent(new Event("focus"));
        }
      });
      await page.waitForTimeout(250);
      assert.equal(profileCalls(), initialCalls, "focus does not refetch the profile");
      assert.equal(
        await page.evaluate(() =>
          window.originalSwitcher === document.querySelector("#product-switcher-button"),
        ),
        true,
        "the existing controls stay mounted",
      );
      await page.reload();
      await page.locator("#product-switcher-button").waitFor();
      assert.equal(profileCalls(), initialCalls + 1, "manual reload loads fresh data");
      assert.deepEqual(errors, []);
    });
  }
});

test("dashboard logos return to their own product home and retain the interface language", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["en", "he"]) {
    for (const [path, home] of [
      ["/dashboard/", "/dashboard/"],
      ["/dashboard/manager/", "/dashboard/manager/"],
      ["/dashboard/pay/", "/dashboard/pay/"],
      ["/dashboard/host/", "/dashboard/host/"],
      ["/dashboard/host/overview/", "/dashboard/host/"],
    ])
      await t.test(`${language} ${path}`, async (t) => {
        const fixture = await scenario(browser, {
          admin: true,
          enrolled: true,
          verified: true,
          manager: "active",
          pay: "active",
        });
        t.after(() => fixture.context.close());
        await fixture.context.route("**/api/v1/manager/**", (route) =>
          route.fulfill({
            json: new URL(route.request().url()).pathname.endsWith("/me")
              ? {
                  role: "admin",
                  roles: ["admin"],
                  organizations: [],
                  account: null,
                }
              : {
                  admins: 1,
                  users: 1,
                  organizationAdmins: 0,
                  organizations: 0,
                },
          }),
        );
        const page = fixture.page;
        page.setDefaultTimeout(7000);
        const query = language === "he" ? "?lang=he" : "";
        await page.goto(origin + path + query);
        await page.locator("#product-switcher-button").waitFor();
        const brands = page.locator("a.brand");
        assert((await brands.count()) > 0);
        for (const brand of await brands.all())
          assert.equal(await brand.getAttribute("href"), home + query);
        const visibleBrand = page.locator("a.brand:visible").first();
        await visibleBrand.click();
        await page.waitForURL(origin + home + query);
        assert.equal(new URL(page.url()).pathname, home);
        assert.equal(new URL(page.url()).search, query);
        assert.deepEqual(fixture.errors, []);
      });
  }
});

test("shared login, product isolation, MFA, safe redirects and session cleanup", async (t) => {
  const { origin, browser } = await startSite(t);

  await t.test(
    "returning to Overview refreshes changed memberships and removed Host users",
    async (t) => {
      const fixture = await scenario(browser, {
        admin: true,
        enrolled: true,
        verified: true,
        directoryPersonRole: "user",
        directoryMemberships: [
          {
            organizationName: "QA Organization",
            products: { host: { role: "viewer", status: "active" } },
          },
        ],
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      page.setDefaultTimeout(7000);
      await page.goto(origin + "/dashboard/host/overview/?tab=users");
      await page.locator("[data-cookie-reject]").click();
      await page.locator('#admin-directory [data-role="viewer"]').waitFor();
      await page.getByLabel("Search this directory").fill("Fixture");
      await page
        .locator("#admin-overview")
        .getByRole("button", { name: "Search", exact: true })
        .click();
      await page.locator("#admin-directory .admin-row").waitFor();
      const navigation = page.locator("#host-sidebar");
      await navigation.locator('[data-view-id="settings"]').click();
      fixture.state.directoryMemberships[0].products.host = {
        role: "admin",
        status: "blocked",
      };
      await navigation.locator('[data-view-id="overview"]').click();
      await page
        .locator('#admin-directory [data-role="admin"]')
        .waitFor({ timeout: 4000 });
      assert.equal(
        await page
          .locator("#admin-directory")
          .getByText("Blocked", { exact: true })
          .count(),
        1,
      );
      assert.equal(
        await page.getByLabel("Search this directory").inputValue(),
        "Fixture",
      );
      assert.equal(
        await page.locator('[data-tab="users"]').getAttribute("aria-selected"),
        "true",
      );

      await navigation.locator('[data-view-id="settings"]').click();
      fixture.state.emptyPeople = true;
      fixture.state.directoryUsers = 0;
      await navigation.locator('[data-view-id="overview"]').click();
      await page
        .locator("#admin-overview [role=status]", {
          hasText: "No matching records.",
        })
        .waitFor({ timeout: 4000 });
      assert.equal(
        await page.locator("#admin-directory .admin-row").count(),
        0,
      );
      assert.equal(
        await page.locator('[data-tab="users"] strong').textContent(),
        "0",
      );

      // A slower directory response from the previous visit cannot reinsert a removed user.
      let releaseLate;
      let observeLate;
      const lateStarted = new Promise((resolve) => {
        observeLate = resolve;
      });
      const lateReleased = new Promise((resolve) => {
        releaseLate = resolve;
      });
      let delayed = false;
      await page.route("**/api/v1/admin/people?**", async (route) => {
        if (delayed) return route.fallback();
        delayed = true;
        observeLate();
        await lateReleased;
        return route.fulfill({
          headers: { "x-fixture-delayed": "1" },
          json: {
            items: [
              {
                uid: "removed-qa-user",
                email: "removed@example.test",
                name: "Removed QA user",
                role: "user",
                status: "active",
                memberships: [],
              },
            ],
            nextCursor: null,
          },
        });
      });
      const lateResponse = page.waitForResponse(
        (response) => response.headers()["x-fixture-delayed"] === "1",
      );
      await navigation.locator('[data-view-id="settings"]').click();
      await navigation.locator('[data-view-id="overview"]').click();
      await lateStarted;
      await navigation.locator('[data-view-id="settings"]').click();
      await navigation.locator('[data-view-id="overview"]').click();
      await page
        .locator("#admin-overview [role=status]", {
          hasText: "No matching records.",
        })
        .waitFor();
      releaseLate();
      await (await lateResponse).finished();
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      assert.equal(
        await page.locator("#admin-directory .admin-row").count(),
        0,
      );
      assert.equal(
        await page.locator('[data-tab="users"] strong').textContent(),
        "0",
      );
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "focus checks preserve the directory and detect access revocation",
    async (t) => {
      const fixture = await scenario(browser, {
        admin: true,
        enrolled: true,
        verified: true,
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/overview/?tab=organizations");
      await page.locator("[data-cookie-reject]").click();
      await page
        .getByRole("button", { name: "Fixture Hotel", exact: true })
        .waitFor();
      await page.getByLabel("Search this directory").fill("Unsaved search");
      const initialDirectoryCalls = fixture.calls.filter(
        (call) => call.path === "/api/v1/admin/overview",
      ).length;
      const response = page.waitForResponse(
        (res) => new URL(res.url()).pathname === "/api/v1/platform/me",
      );
      await page.evaluate(() => {
        window.directoryBeforeFocus =
          document.querySelector("#admin-directory");
        window.dispatchEvent(new Event("focus"));
        window.dispatchEvent(new Event("focus"));
      });
      await response;
      assert.equal(await page.locator("#access-panel").isVisible(), false);
      assert.equal(
        await page.getByLabel("Search this directory").inputValue(),
        "Unsaved search",
      );
      assert.equal(
        await page.evaluate(
          () =>
            window.directoryBeforeFocus ===
            document.querySelector("#admin-directory"),
        ),
        true,
      );
      assert.equal(
        fixture.calls.filter((call) => call.path === "/api/v1/admin/overview")
          .length,
        initialDirectoryCalls,
      );

      fixture.state.admin = false;
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await page.locator("#admin-overview").waitFor({ state: "hidden" });
      await page.locator("#dashboard-content").waitFor({ state: "visible" });
      assert.equal(
        await page
          .locator('#host-sidebar [data-view-id="overview"]')
          .isVisible(),
        false,
      );

      fixture.state.host = "blocked";
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await page.waitForURL(origin + "/dashboard/");
      assert.equal(await page.locator("#host-management").count(), 0);
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "dashboard navigation stays compact and scrollable",
    async (t) => {
      const fixture = await scenario(browser, {
        admin: true,
        enrolled: true,
        verified: true,
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/overview/");
      await page.locator("[data-cookie-reject]").click();
      await page.locator("#admin-overview .admin-row").waitFor();

      const sidebar = page.locator("#host-sidebar");
      const overview = sidebar.locator('[data-view-id="overview"]');
      const overviewBounds = await overview.boundingBox();
      assert.ok(
        overviewBounds.height <= 48,
        "Sidebar tabs must not stretch to fill the screen",
      );
      const directoryTab = await page
        .locator('[data-tab="admins"]')
        .boundingBox();
      assert.ok(
        directoryTab.height <= 84,
        "Directory tabs should stay compact",
      );

      await page.setViewportSize({ width: 1280, height: 240 });
      await sidebar.hover();
      await page.mouse.wheel(0, 600);
      await page.waitForFunction(
        () => document.querySelector("#host-sidebar").scrollTop > 0,
      );
      await overview.click();
      const scrolledOverview = await overview.boundingBox();
      assert.ok(
        scrolledOverview.y >= 0 &&
          scrolledOverview.y + scrolledOverview.height <= 240,
        "A short screen scrolls the sidebar to every item",
      );

      await page.setViewportSize({ width: 390, height: 420 });
      await page.locator(".workspace-menu-toggle").click();
      await overview.click();
      await page.mouse.move(350, 350);
      await page.mouse.wheel(0, 600);
      await page
        .waitForFunction(() => window.scrollY > 0, null, { timeout: 5000 })
        .catch(async (error) => {
          if (process.env.WIFIGATE_SCREENSHOT_DIR)
            await page.screenshot({
              path: path.join(
                process.env.WIFIGATE_SCREENSHOT_DIR,
                "navigation-scroll-failure.png",
              ),
            });
          throw new Error(
            JSON.stringify(
              await page.evaluate(() => ({
                scrollY,
                height: innerHeight,
                scrollHeight: document.documentElement.scrollHeight,
                pointerTarget: document
                  .elementFromPoint(350, 350)
                  ?.outerHTML.slice(0, 600),
                navOpen: document
                  .querySelector(".workspace-menu-toggle")
                  .getAttribute("aria-expanded"),
                sidebar: document
                  .querySelector("#host-sidebar")
                  .getBoundingClientRect()
                  .toJSON(),
              })),
            ),
            { cause: error },
          );
        });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "English and Hebrew profile workspace lists keep Host, Pay, Manager order and use only platform GET",
    async () => {
      for (const mobile of [false, true]) {
        const fixture = await scenario(browser, {
          mobile,
          signedIn: false,
          manager: "unavailable",
        });
        await fixture.page.goto(origin + (mobile ? "/he/login/" : "/login/"));
        await (await passGateGame(fixture.page, "google")).click();
        await fixture.page.locator(".product-tile").first().waitFor();
        assert.deepEqual(
          await fixture.page
            .locator(".product-tile")
            .evaluateAll((tiles) => tiles.map((tile) => tile.dataset.product)),
          ["host", "pay", "manager"],
        );
        const positions = await fixture.page
          .locator(".product-tile")
          .evaluateAll((tiles) =>
            tiles.map((tile) => ({
              left: tile.getBoundingClientRect().left,
              top: tile.getBoundingClientRect().top,
            })),
          );
        const axis = mobile ? "top" : "left";
        assert.ok(
          positions[0][axis] < positions[1][axis] &&
            positions[1][axis] < positions[2][axis],
        );
        assert.equal(
          await fixture.page.locator("html").getAttribute("dir"),
          mobile ? "rtl" : "ltr",
        );
        assert.equal(
          await fixture.page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        assert.equal(await fixture.page.locator('[data-product="host"] a[href^="/dashboard/host/"]').count(), 1);
        assert.equal(await fixture.page.locator('[data-product="host"] .product-actions a').count(), 3);
        assert.equal(
          fixture.calls.filter((call) => call.path === "/api/v1/users/me")
            .length,
          0,
        );
        assert.equal(
          fixture.calls.filter((call) => call.method && call.method !== "GET")
            .length,
          0,
        );
        if (process.env.WIFIGATE_SCREENSHOT_DIR) {
          await fixture.page.screenshot({
            path: path.join(
              process.env.WIFIGATE_SCREENSHOT_DIR,
              `platform-${mobile ? "he-mobile" : "en-desktop"}.png`,
            ),
            fullPage: true,
          });
        }
        assert.deepEqual(fixture.errors, []);
        await fixture.context.close();
      }
    },
  );

  await t.test(
    "an account with no plan in any product is signed out and sent to support",
    async () => {
      const noPlan = { host: "no-plan", pay: "no-plan", manager: "no-plan" };
      for (const [loginUrl, text] of [
        ["/login/", "You don't have a WIFIGATE account. Please contact support: support@wifigate.io"],
        ["/he/login/", "אין לך משתמש ב־WIFIGATE. נא לפנות לתמיכה: support@wifigate.io"],
      ]) {
        const fixture = await scenario(browser, { ...noPlan, signedIn: false });
        await fixture.page.goto(origin + loginUrl);
        await (await passGateGame(fixture.page, "google")).click();
        const status = fixture.page.locator("#login-status", { hasText: text });
        await status.waitFor();
        assert.equal(await status.innerText(), text);
        assert.equal(
          await status
            .locator('a[href="mailto:support@wifigate.io"]')
            .getAttribute("dir"),
          "ltr",
        );
        assert.ok(fixture.calls.includes("signout"));
        assert.equal(new URL(fixture.page.url()).pathname, loginUrl);
        assert.deepEqual(
          fixture.calls
            .filter((call) => call.path)
            .map((call) => `${call.method} ${call.path}`),
          ["GET /api/v1/platform/me"],
        );
        assert.equal(
          await fixture.page
            .locator('[data-provider="google"]')
            .evaluate((button) => button.disabled),
          false,
        );
        assert.deepEqual(fixture.errors, []);
        await fixture.context.close();
      }

      const unverified = await scenario(browser, {
        ...noPlan,
        signedIn: false,
        emailVerified: false,
      });
      await unverified.page.goto(origin + "/login/");
      await (await passGateGame(unverified.page, "apple")).click();
      await unverified.page
        .locator("#login-status", {
          hasText: "Use the verified email approved by your admin.",
        })
        .waitFor();
      assert.ok(unverified.calls.includes("signout"));
      await unverified.context.close();

      // A session whose last plan ends is closed by the dashboard and the
      // sign-in page says why.
      for (const [dashboardUrl, loginUrl] of [
        ["/dashboard/pay/", "/login/?reason=no-account"],
        ["/dashboard/host/", "/login/?reason=no-account"],
        ["/dashboard/?lang=he", "/he/login/?reason=no-account"],
      ]) {
        const restored = await scenario(browser, noPlan);
        await restored.page.goto(origin + dashboardUrl);
        await restored.page.waitForURL(origin + loginUrl);
        await restored.page
          .locator('#login-status a[href="mailto:support@wifigate.io"]')
          .waitFor();
        assert.ok(restored.calls.includes("signout"));
        await restored.context.close();
      }
    },
  );

  await t.test(
    "platform failure retains authentication",
    async () => {
      const fixture = await scenario(browser);
      await fixture.page.goto(origin + "/dashboard/");
      await fixture.page.locator(".product-tile").first().waitFor();
      fixture.state.unavailable = true;
      await fixture.page.locator("#platform-retry").click();
      await fixture.page
        .getByText("Unable to check access right now. Please try again.", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        await fixture.page.locator("#product-grid").isVisible(),
        false,
      );
      assert.equal(fixture.calls.includes("signout"), false);
      fixture.state.unavailable = false;
      await fixture.page.locator("#platform-retry").click();
      await fixture.page.locator(".product-tile").first().waitFor();
      await fixture.context.close();
    },
  );

  await t.test(
    "deep links require active product and discard external next",
    async () => {
      const fixture = await scenario(browser, { manager: "blocked" });
      await fixture.page.goto(
        origin + "/login/?next=https%3A%2F%2Foutside.example",
      );
      await fixture.page.waitForURL(origin + "/dashboard/");
      await fixture.page.goto(origin + "/login/?next=%2Fdashboard%2Fpay%2F");
      await fixture.page.waitForURL(origin + "/dashboard/");
      fixture.state.pay = "active";
      await fixture.page.goto(
        origin + "/login/?next=%2Fdashboard%2Fpay%2Ftransactions%2F1",
      );
      await fixture.page.waitForURL(origin + "/dashboard/");
      await fixture.page.goto(
        origin + "/login/?next=%2Fdashboard%2Fpay%2F%3Fview%3Dtransactions",
      );
      await fixture.page.waitForURL(
        origin + "/dashboard/pay/?view=transactions",
      );
      await fixture.page
        .locator("#product-workspace")
        .waitFor({ state: "visible" });
      assert.equal(
        await fixture.page
          .locator('#product-switcher [data-product-option="manager"]')
          .getAttribute("aria-disabled"),
        "true",
      );
      // The pill is a listbox: arrow keys reach a disabled product, whose
      // reason shows; Enter on it does nothing; Escape returns to the pill.
      const pill = fixture.page.locator("#product-switcher-button");
      await pill.click();
      assert.equal(await pill.getAttribute("aria-expanded"), "true");
      const manager = fixture.page.locator(
        '#product-switcher [data-product-option="manager"]',
      );
      await fixture.page.keyboard.press("ArrowDown");
      assert.equal(
        await fixture.page
          .locator("#product-switcher-list")
          .getAttribute("aria-activedescendant"),
        "product-option-manager",
      );
      await manager.locator("[role=tooltip]").waitFor();
      assert.equal(
        await manager.locator("[role=tooltip]").innerText(),
        "Access is blocked. Contact your administrator.",
      );
      await fixture.page.keyboard.press("Enter");
      assert.equal(new URL(fixture.page.url()).pathname, "/dashboard/pay/");
      await fixture.page.keyboard.press("Escape");
      assert.equal(await pill.getAttribute("aria-expanded"), "false");
      assert.equal(
        await pill.evaluate((element) => element === document.activeElement),
        true,
      );
      assert.deepEqual(
        await fixture.page
          .locator("#product-switcher [role=option]")
          .evaluateAll((options) =>
            options.map((option) => option.dataset.productOption),
          ),
        ["host", "pay", "manager"],
      );
      assert.deepEqual(fixture.errors, []);
      await fixture.context.close();
    },
  );

  await t.test(
    "admin enrolls and verifies TOTP from picker before Host calls",
    async () => {
      const fixture = await scenario(browser, { admin: true });
      await fixture.page.goto(origin + "/dashboard/");
      await fixture.page.locator('[data-state="mfa-required"]').waitFor();
      assert.equal(
        fixture.calls.some((call) => call.path === "/api/v1/users/me"),
        false,
      );
      await fixture.page
        .locator('[data-product="host"] .platform-button')
        .click();
      await fixture.page.locator("#totp-setup").waitFor({ state: "visible" });
      assert.equal(fixture.calls.filter((call) => call === "reauth").length, 1);
      assert.equal(
        fixture.calls.filter((call) => call === "begin-enroll").length,
        1,
      );
      await fixture.page
        .locator('[data-product="host"] .platform-button')
        .click();
      assert.equal(
        fixture.calls.filter((call) => call === "begin-enroll").length,
        1,
        "repeat clicks retain the displayed setup secret",
      );
      assert.equal(
        await fixture.page
          .locator('[data-security-step="pair"]')
          .getAttribute("aria-current"),
        "step",
      );
      await fixture.page.locator("#enrollment-form input").fill("000000");
      await fixture.page.locator("#enrollment-form button").click();
      await fixture.page
        .getByText("That code is incorrect or expired.", { exact: true })
        .waitFor();
      await fixture.page.locator("#enrollment-form input").fill("123456");
      await fixture.page.locator("#enrollment-form button").click();
      await fixture.page
        .locator("#verify-session")
        .waitFor({ state: "visible" });
      assert.equal(await fixture.page.locator("#totp-secret").inputValue(), "");
      await fixture.page.locator("#verify-session").click();
      await fixture.page
        .locator('#mfa-challenge input[name="code"]')
        .fill("123456");
      await fixture.page
        .locator('#mfa-challenge button[type="submit"]')
        .click();
      await fixture.page
        .locator('[data-product="host"][data-state="active"]')
        .waitFor();
      await fixture.page.locator("#product-switcher-button").click();
      await fixture.page.locator('[data-product-option="host"]').click();
      await fixture.page
        .locator("#dashboard-content")
        .waitFor({ state: "visible" });
      assert.deepEqual(fixture.errors, []);
      await fixture.context.close();
    },
  );

  await t.test(
    "switching identity clears an unfinished authenticator and permits fresh setup",
    async (t) => {
      const fixture = await scenario(browser, { admin: true });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/");
      await page.locator('[data-product="host"] .platform-button').click();
      await page.locator("#totp-setup").waitFor({ state: "visible" });
      await page.locator("#enrollment-form input").fill("123");
      await page.evaluate(() =>
        window.fixtureChangeUser("another-fixture-user"),
      );
      await page.locator("#totp-setup").waitFor({ state: "hidden" });
      await page.locator('[data-product="host"] .platform-button').waitFor();
      assert.equal(await page.locator("#totp-secret").inputValue(), "");
      assert.equal(await page.locator("#totp-qr").getAttribute("src"), null);
      assert.equal(
        await page.locator("#enrollment-form input").inputValue(),
        "",
      );
      await page.locator('[data-product="host"] .platform-button').click();
      await page.locator("#totp-setup").waitFor({ state: "visible" });
      assert.equal(
        fixture.calls.filter((call) => call === "begin-enroll").length,
        2,
      );
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "late enrollment completion cannot clear another identity's setup",
    async (t) => {
      const fixture = await scenario(browser, { admin: true });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/");
      await page.locator('[data-product="host"] .platform-button').click();
      await page.locator("#totp-setup").waitFor({ state: "visible" });
      await page.evaluate(() => {
        window.fixturePauseFinish = true;
      });
      await page.locator("#enrollment-form input").fill("123456");
      await page.locator("#enrollment-form button").click();
      await page.waitForFunction(
        () => typeof window.fixtureReleaseFinish === "function",
      );
      assert.equal(
        await page.locator("#platform-security").getAttribute("aria-busy"),
        "true",
      );
      assert.equal(await page.locator("#cancel-enrollment").isEnabled(), false);
      await page.evaluate(() =>
        window.fixtureChangeUser("another-fixture-user"),
      );
      await page.locator('[data-product="host"] .platform-button').waitFor();
      await page.locator('[data-product="host"] .platform-button').click();
      await page.locator("#totp-setup").waitFor({ state: "visible" });
      const secret = await page.locator("#totp-secret").inputValue();
      const qr = await page.locator("#totp-qr").getAttribute("src");
      await page.evaluate(async () => {
        window.fixtureReleaseFinish();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      assert.equal(await page.locator("#totp-setup").isVisible(), true);
      assert.equal(await page.locator("#totp-secret").inputValue(), secret);
      assert.equal(await page.locator("#totp-qr").getAttribute("src"), qr);
      assert.equal(
        await page
          .locator('[data-security-step="pair"]')
          .getAttribute("aria-current"),
        "step",
      );
      assert.equal(
        await page.locator("#enrollment-status").textContent(),
        "Enter the current code to confirm setup.",
      );
      assert.ok(fixture.calls.includes("stale-enroll"));
      assert.deepEqual(fixture.errors, []);
    },
  );

  for (const language of ["en", "he"]) {
    await t.test(
      `product setup action is direct, localized and usable at 320px (${language})`,
      async (t) => {
        const fixture = await scenario(browser, { admin: true, mobile: true });
        t.after(() => fixture.context.close());
        const page = fixture.page;
        await page.setViewportSize({ width: 320, height: 800 });
        await page.goto(
          origin + "/dashboard/" + (language === "he" ? "?lang=he" : ""),
        );
        const card = page.locator('[data-product="host"]');
        await card.waitFor();
        assert.equal(
          await page.locator("html").getAttribute("dir"),
          language === "he" ? "rtl" : "ltr",
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
        assert.equal(
          await page
            .locator('[data-product="pay"] a')
            .first()
            .getAttribute("href"),
          (language === "he" ? "/he" : "") + "/contact-us/?product=pay",
        );
        await card
          .getByRole("button", {
            name:
              language === "he"
                ? "הגדרת אפליקציית אימות"
                : "Set up authenticator",
            exact: true,
          })
          .click();
        await page.locator("#totp-setup").waitFor({ state: "visible" });
        assert.equal(fixture.calls.includes("reauth"), true);
        assert.equal(
          await page
            .locator("#enrollment-form input")
            .evaluate((el) => el === document.activeElement),
          true,
        );
        assert.equal(
          await page.locator("#platform-security").getAttribute("aria-busy"),
          "false",
        );
        await page.locator("#cancel-enrollment").click();
        await page.locator("#totp-setup").waitFor({ state: "hidden" });
        assert.equal(await page.locator("#totp-secret").inputValue(), "");
        assert.equal(await page.locator("#totp-qr").getAttribute("src"), null);
        await page.locator('[data-product="host"] .platform-button').click();
        await page.locator("#totp-setup").waitFor({ state: "visible" });
        assert.equal(
          fixture.calls.filter((call) => call === "begin-enroll").length,
          2,
        );
        assert.deepEqual(fixture.errors, []);
      },
    );
  }

  await t.test(
    "cancelled provider confirmation shows feedback and restores setup actions without generating a secret",
    async (t) => {
      const fixture = await scenario(browser, {
        admin: true,
        reauthError: "auth/popup-closed-by-user",
      });
      t.after(() => fixture.context.close());
      await fixture.page.goto(origin + "/dashboard/");
      const action = fixture.page.locator(
        '[data-product="host"] .platform-button',
      );
      await action.click();
      await fixture.page
        .getByText("Sign-in was cancelled.", { exact: true })
        .waitFor();
      assert.equal(await action.isEnabled(), true);
      assert.equal(
        await fixture.page.locator("#start-enrollment").isEnabled(),
        true,
      );
      assert.equal(fixture.calls.includes("begin-enroll"), false);
      assert.equal(
        await fixture.page.locator("#totp-setup").isVisible(),
        false,
      );
    },
  );

  await t.test(
    "recent-authentication errors keep the recovery message in the current workspace",
    async () => {
      const fixture = await scenario(browser);
      await fixture.page.goto(origin + "/dashboard/host/");
      await fixture.page
        .locator("#dashboard-content")
        .waitFor({ state: "visible" });
      await fixture.page.waitForFunction(
        () =>
          document.querySelector("#host-management").dataset.loading ===
          "false",
      );
      await fixture.page.evaluate(() => {
        document.querySelector("#host-management").dataset.organizationId =
          "current";
      });
      fixture.state.deniedStatus = 403;
      const stepUpCodes = [
        "RECENT_REAUTH_REQUIRED",
        "RECENT_AUTH_REQUIRED",
        "RECENT_TOTP_REQUIRED",
      ];
      for (const code of stepUpCodes) {
        fixture.state.deniedCode = code;
        const recovery = await fixture.page.evaluate(async () => {
          const { portalRequest } = await import("/js/api/index.js");
          const { authErrorMessage } = await import("/js/host-auth-errors.js");
          try {
            await portalRequest(
              { getIdToken: async () => "isolated-token" },
              "/api/v1/organizations/current/client-api-keys/key/reveal",
              "POST",
              {},
              "step-up-request",
            );
          } catch (error) {
            const message = document.createElement("p");
            message.id = "step-up-recovery";
            message.textContent = authErrorMessage(error);
            document.querySelector("#step-up-recovery")?.remove();
            document.querySelector("#dashboard-content").append(message);
            return error.code;
          }
        });
        assert.equal(recovery, code);
        assert.equal(fixture.page.url(), origin + "/dashboard/host/");
        assert.match(
          await fixture.page.locator("#step-up-recovery").textContent(),
          /Sign in again/,
        );
        assert.equal(
          await fixture.page.locator("#dashboard-content").isVisible(),
          true,
        );
      }
      await fixture.context.close();
    },
  );

  await t.test(
    "revoked support access clears diagnostics without leaving the workspace",
    async () => {
      const fixture = await scenario(browser, {
        admin: true,
        enrolled: true,
        verified: true,
      });
      let revoked = false;
      await fixture.context.route(
        "**/api/v1/organizations/support-org/support/grants/support-grant/diagnostics",
        (route) =>
          revoked
            ? route.fulfill({
                status: 403,
                json: { error: { code: "SUPPORT_ACCESS_DENIED" } },
              })
            : route.fulfill({
                json: {
                  diagnostics: {
                    expiresAt: "2030-01-01T00:00:00.000Z",
                    sources: { jobs: { records: 4, statuses: { queued: 4 } } },
                  },
                },
              }),
      );
      await fixture.page.goto(origin + "/dashboard/host/");
      await fixture.page.waitForFunction(
        () =>
          document.querySelector("#host-management")?.dataset.loading ===
          "false",
      );
      await fixture.page.evaluate(() => {
        document.querySelector("#host-management").dataset.organizationId =
          "support-org";
      });
      await fixture.page
        .locator('#host-section-navigation [data-view-id="settings"]')
        .click();
      await fixture.page
        .getByRole("tab", { name: "Support access", exact: true })
        .click();
      const support = fixture.page.getByRole("region", {
        name: "Approved support diagnostics",
      });
      await support.getByLabel("Support organization ID").fill("support-org");
      await support.getByLabel("Support approval ID").fill("support-grant");
      await support
        .getByRole("button", { name: "Read approved support diagnostics" })
        .click();
      await support.getByText(/jobs.*records 4.*queued: 4/).waitFor();
      revoked = true;
      await support
        .getByRole("button", { name: "Read approved support diagnostics" })
        .click();
      await support
        .getByText("This support approval is unavailable, expired or revoked.")
        .waitFor();
      assert.equal(await support.getByText(/jobs.*records 4/).count(), 0);
      assert.equal(new URL(fixture.page.url()).pathname, "/dashboard/host/");
      assert.equal(
        new URL(fixture.page.url()).searchParams.get("view"),
        "settings",
      );
      assert.equal(
        new URL(fixture.page.url()).searchParams.get("tab"),
        "support",
      );
      assert.equal(
        await fixture.page.locator("#dashboard-content").isVisible(),
        true,
      );
      assert.deepEqual(fixture.errors, []);
      await fixture.context.close();
    },
  );

  await t.test(
    "a late denial from an old organization request does not clear the new workspace",
    async () => {
      const fixture = await scenario(browser);
      await fixture.page.goto(origin + "/dashboard/host/");
      await fixture.page.waitForFunction(
        () =>
          document.querySelector("#host-management")?.dataset.loading ===
          "false",
      );
      let resolveRequest;
      const pendingRequest = new Promise((resolve) => {
        resolveRequest = resolve;
      });
      await fixture.context.route(
        "**/api/v1/organizations/org-a/systems",
        (route) => resolveRequest(route),
      );
      await fixture.page.evaluate(() => {
        const workspace = document.querySelector("#host-management");
        workspace.dataset.organizationId = "org-a";
        workspace.dataset.requestGeneration = "1";
        void import("/js/api/index.js")
          .then(({ portalRequest }) => {
            return portalRequest(
              { getIdToken: async () => "isolated-token" },
              "/api/v1/organizations/org-a/systems",
            );
          })
          .catch((error) => {
            window.oldOrganizationError = error.code;
          });
      });
      const delayed = await pendingRequest;
      await fixture.page.evaluate(() => {
        const workspace = document.querySelector("#host-management");
        workspace.dataset.organizationId = "org-b";
        workspace.dataset.requestGeneration = "2";
        workspace.textContent = "Current organization B";
      });
      await delayed.fulfill({
        status: 403,
        json: { error: { code: "TENANT_ACCESS_DENIED" } },
      });
      await fixture.page.waitForFunction(
        () => window.oldOrganizationError === "TENANT_ACCESS_DENIED",
      );
      assert.equal(fixture.page.url(), origin + "/dashboard/host/");
      assert.equal(
        await fixture.page.locator("#host-management").textContent(),
        "Current organization B",
      );
      assert.equal(
        await fixture.page.locator("#dashboard-content").isVisible(),
        true,
      );
      await fixture.context.close();
    },
  );

  await t.test(
    "a supported signed-out link preserves its query and fragment through sign-in",
    async () => {
      const fixture = await scenario(browser, {
        signedIn: false,
        pay: "active",
      });
      await fixture.page.goto(
        origin + "/dashboard/pay/?view=transactions#details",
      );
      await fixture.page.waitForURL((url) => url.pathname === "/login/");
      const next = new URL(fixture.page.url()).searchParams.get("next");
      assert.equal(next, "/dashboard/pay/?view=transactions#details");
      await (await passGateGame(fixture.page, "google")).click();
      await fixture.page.waitForURL(
        origin + "/dashboard/pay/?view=transactions#details",
      );
      await fixture.page
        .locator("#product-workspace")
        .waitFor({ state: "visible" });
      await fixture.context.close();
    },
  );

  await t.test(
    "a restored login session gets a new idle watcher after sign-out and sign-in",
    async () => {
      const fixture = await scenario(browser, { unavailable: true });
      await fixture.page.clock.install();
      await fixture.page.goto(origin + "/login/");
      await fixture.page
        .locator("#login-status", { hasText: "Unable to check access" })
        .waitFor();
      await fixture.page.evaluate(async () => {
        const { signOut } = await import("/js/site-auth.js");
        await signOut();
      });
      await (
        await passGateGame(fixture.page, "google", { clock: true })
      ).click();
      await fixture.page
        .locator("#login-status", { hasText: "Unable to check access" })
        .waitFor();
      await fixture.page.clock.fastForward(24 * 60 * 60 * 1000 + 1);
      await fixture.page.waitForURL(origin + "/login/");
      await fixture.page.waitForFunction(
        () => !document.querySelector('[data-provider="google"]').disabled,
      );
      assert.equal(
        fixture.calls.filter((call) => call === "signout").length,
        2,
      );
      await fixture.context.close();
    },
  );

  await t.test(
    "blocked Host clears workspace on403 while other product access remains",
    async () => {
      const fixture = await scenario(browser, { pay: "active" });
      await fixture.page.goto(origin + "/dashboard/host/");
      await fixture.page
        .locator("#dashboard-content")
        .waitFor({ state: "visible" });
      fixture.state.host = "blocked";
      fixture.state.deniedStatus = 403;
      await fixture.page.evaluate(() => {
        void import("/js/api/index.js")
          .then(({ getProfile }) =>
            getProfile({ getIdToken: async () => "isolated-token" }),
          )
          .catch(() => {});
      });
      await fixture.page.waitForURL(origin + "/dashboard/");
      await fixture.page
        .locator('[data-product="host"][data-state="blocked"]')
        .waitFor();
      assert.equal(
        await fixture.page
          .locator('[data-product="pay"][data-state="active"] a')
          .count(),
        3,
      );
      assert.equal(await fixture.page.locator("#host-management").count(), 0);
      await fixture.context.close();
    },
  );

  await t.test(
    "a full idle day and401 both end the session",
    async () => {
      const idle = await scenario(browser);
      await idle.page.clock.install();
      await idle.page.goto(origin + "/dashboard/");
      await idle.page.locator(".product-tile").first().waitFor();
      await idle.page.clock.fastForward(23 * 60 * 60 * 1000);
      assert.equal(idle.calls.includes("signout"), false);
      await idle.page.clock.fastForward(60 * 60 * 1000 + 1);
      await idle.page.waitForURL(origin + "/login/");
      assert.ok(idle.calls.includes("signout"));
      await idle.context.close();
      const expired = await scenario(browser);
      await expired.page.goto(origin + "/dashboard/host/");
      await expired.page
        .locator("#dashboard-content")
        .waitFor({ state: "visible" });
      expired.state.deniedStatus = 401;
      await expired.page.evaluate(() => {
        void import("/js/api/index.js")
          .then(({ getProfile }) =>
            getProfile({ getIdToken: async () => "isolated-token" }),
          )
          .catch(() => {});
      });
      await expired.page.waitForURL(origin + "/login/");
      assert.ok(expired.calls.includes("signout"));
      await expired.context.close();
    },
  );

  await t.test(
    "a missing platform endpoint keeps Host closed without the old profile read",
    async () => {
      const fixture = await scenario(browser, { legacy: true });
      await fixture.page.goto(origin + "/dashboard/host/");
      await fixture.page
        .locator("#access-panel", { hasText: "Unable to check access" })
        .waitFor();
      assert.equal(
        await fixture.page.locator("#dashboard-content").isVisible(),
        false,
      );
      assert.equal(
        fixture.calls.some((call) => call.path === "/api/v1/users/me"),
        false,
      );
      assert.equal(
        fixture.calls.some((call) => call.path === "/api/v1/organizations"),
        false,
      );
      assert.deepEqual(fixture.errors, []);
      await fixture.context.close();
    },
  );

  await t.test(
    "owner invitation is reachable and accepts only after fresh authenticator verification",
    async (t) => {
      const fixture = await scenario(browser, {
        invited: true,
        enrolled: true,
        verified: true,
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/");
      await page.locator("[data-cookie-reject]").click();
      const bell = page.locator("#join-organization");
      await bell.locator("[data-invitation-count]", { hasText: "1" }).waitFor();
      await bell.click();
      await page
        .getByRole("button", { name: "Join Invited Hotel", exact: true })
        .click();
      await page.locator("#mfa-challenge").waitFor({ state: "visible" });
      assert.equal(fixture.state.accepted, undefined);
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await page.locator('#mfa-challenge input[name="code"]').fill("123456");
      await page.locator('#mfa-challenge button[type="submit"]').click();
      await page
        .getByText("No organization is waiting for you to join.", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        await bell.locator("[data-invitation-count]").innerText(),
        "",
      );
      assert.equal(fixture.state.accepted, true);
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "unenrolled invited owner can reach authenticator setup and return",
    async (t) => {
      const fixture = await scenario(browser, { invited: true });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/");
      await page.locator("[data-cookie-reject]").click();
      await page.locator("#join-organization").click();
      await page
        .getByRole("button", { name: "Join Invited Hotel", exact: true })
        .click();
      // Authenticator setup lives on the product picker, shared by every
      // product; the Host page has no copy of it.
      await page.waitForURL(origin + "/dashboard/");
      await page.locator("#platform-security").waitFor({ state: "visible" });
      assert.equal(fixture.state.accepted, undefined);
      assert.equal(fixture.calls.includes("begin-enroll"), false);
      await page.locator("#product-switcher-button").click();
      await page.locator('[data-product-option="host"]').click();
      await page.waitForURL(origin + "/dashboard/host/");
      await page.locator("#join-organization").click();
      await page
        .getByRole("button", { name: "Join Invited Hotel", exact: true })
        .waitFor();
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "an organization member without a Host plan reaches Host without My systems",
    async (t) => {
      const fixture = await scenario(browser, {
        hostRole: null,
        organizations: [
          {
            id: "member-org",
            name: "Member Hotel",
            timezone: "UTC",
            version: 1,
            membership: { role: "staff" },
            workspace: {
              role: "staff",
              permissions: [
                "read",
                "reservations:write",
                "invitations:write",
                "operations:write",
              ],
              service: { state: "legacy-active", available: true },
            },
          },
        ],
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/?view=my-systems");
      await page.locator("#dashboard-content").waitFor({ state: "visible" });
      await page.waitForFunction(
        () => document.body.dataset.hostViewId === "systems",
      );
      assert.equal(
        await page.locator('#host-sidebar [data-view-id="my-systems"]').isVisible(),
        false,
      );
      assert.equal(await page.locator("#host-my-systems").isVisible(), false);
      assert.equal(
        await page.locator("#workspace-org-switcher .org-card__name").innerText(),
        "Member Hotel",
      );
      assert.equal(
        await page
          .locator("#workspace-org-switcher .host-role-badge")
          .getAttribute("data-role"),
        "staff",
      );
      assert.equal(
        await page.locator('#host-sidebar [data-view-id="connect"]').isVisible(),
        false,
        "staff has no integrations:write",
      );
      assert.equal(
        fixture.calls.some((call) => call.path?.startsWith("/api/v1/me/")),
        false,
      );
      assert.equal(await page.locator("#account-plan").innerText(), "");
      // A My systems call refused for want of a plan stays a local refusal.
      const refusal = await page.evaluate(async () => {
        const { portalRequest } = await import("/js/api/index.js");
        try {
          await portalRequest(
            { getIdToken: async () => "isolated-token" },
            "/api/v1/me/systems",
          );
        } catch (error) {
          return error.code;
        }
      });
      assert.equal(refusal, "HOST_PLAN_REQUIRED");
      await page.waitForTimeout(100);
      assert.equal(new URL(page.url()).pathname, "/dashboard/host/");
      assert.equal(await page.locator("#dashboard-content").isVisible(), true);
      assert.equal(fixture.calls.includes("signout"), false);
      assert.deepEqual(fixture.errors, []);
    },
  );

  for (const mobile of [false, true])
    await t.test(
      `a pending invitation opens Host with only the join view (${mobile ? "phone, Hebrew" : "desktop"})`,
      async (t) => {
        const fixture = await scenario(browser, {
          host: "pending",
          hostRole: null,
          invited: true,
          mobile,
        });
        t.after(() => fixture.context.close());
        const page = fixture.page;
        await page.goto(origin + "/dashboard/" + (mobile ? "?lang=he" : ""));
        const tile = page.locator('.product-tile[data-product="host"]');
        await tile.waitFor();
        assert.equal(await tile.getAttribute("data-state"), "pending");
        assert.equal(await tile.locator(".product-actions > button").count(), 0);
        await page.locator("#product-switcher-button").click();
        await page.locator('[data-product-option="host"]').click();
        await page.waitForURL(
          origin + "/dashboard/host/" + (mobile ? "?lang=he" : ""),
        );
        await page.locator("#dashboard-content").waitFor({ state: "visible" });
        await page.waitForFunction(
          () => document.body.dataset.hostViewId === "invitations",
        );
        await page
          .getByRole("button", {
            name: mobile ? "הצטרפות ל־Invited Hotel" : "Join Invited Hotel",
            exact: true,
          })
          .waitFor();
        assert.equal(
          await page.locator("body").evaluate((body) =>
            body.classList.contains("host-menu-empty"),
          ),
          true,
        );
        assert.equal(await page.locator("#host-tabbar").isVisible(), false);
        assert.equal(
          fixture.calls.some((call) => call.path === "/api/v1/organizations"),
          false,
          "a pending account reads no organization data",
        );
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        assert.deepEqual(fixture.errors, []);
      },
    );

  for (const [path, selected] of [
    ["/dashboard/", ""],
    ["/dashboard/pay/", "pay"],
    ["/dashboard/manager/", "manager"],
    ["/dashboard/host/", "host"],
  ])
    for (const width of [1440, 390, 320])
      await t.test(
        `the product pill sits at the top centre of ${path} at ${width}px`,
        async (t) => {
          const fixture = await scenario(browser, {
            pay: "active",
            manager: "active",
          });
          t.after(() => fixture.context.close());
          const page = fixture.page;
          await page.setViewportSize({ width, height: 900 });
          await page.goto(origin + path + "?lang=he");
          const pill = page.locator("#product-switcher-button");
          await pill.waitFor();
          assert.equal(
            await pill.getAttribute("data-current-product"),
            selected || "all",
          );
          const box = await pill.boundingBox();
          const header = await page
            .locator(".platform-header, .host-topbar")
            .first()
            .boundingBox();
          assert.ok(
            box.y >= header.y && box.y + box.height <= header.y + header.height,
            "the pill is in the top bar",
          );
          // At the top centre on every page and width, so switching
          // products never moves it sideways.
          if (width === 1440)
            assert.ok(
              Math.abs(box.x + box.width / 2 - (header.x + header.width / 2)) < 40,
              `the pill is centred: ${box.x + box.width / 2}`,
            );
          else
            assert.ok(
              Math.abs(box.x + box.width / 2 - width / 2) <= 4,
              `the pill is centred on the phone: ${box.x + box.width / 2}`,
            );
          assert.ok(box.height >= 44, "touch target");
          await pill.click();
          const options = page.locator("#product-switcher [role=option]");
          assert.deepEqual(
            await options.evaluateAll((items) =>
              items.map((item) => item.dataset.productOption),
            ),
            ["host", "pay", "manager"],
          );
          const tops = await options.evaluateAll((items) =>
            items.map((item) => item.getBoundingClientRect().top),
          );
          assert.ok(tops[0] < tops[1] && tops[1] < tops[2], "fixed order");
          const panel = await page
            .locator(".product-switcher__popover")
            .boundingBox();
          assert.ok(
            panel.x >= 0 && panel.x + panel.width <= width,
            "the list stays on screen",
          );
          assert.ok(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          );
          await page.keyboard.press("Escape");
          assert.deepEqual(fixture.errors, []);
        },
      );

  // An organization the Host workspace can open, with the permissions the
  // API returns for that role.
  const organization = (name, role = "owner") => ({
    id:
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "hebrew-org",
    name,
    timezone: "UTC",
    version: 1,
    membership: { role },
    workspace: workspaceFor(role),
  });
  const settled = (page) =>
    page.waitForFunction(
      () =>
        document.querySelector("#host-management")?.dataset.loading ===
        "false",
    );
  const noSidewaysScroll = (page) =>
    page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

  // An ⓘ opens by hover, click or keyboard focus, stays inside the viewport
  // in both directions (Hebrew included) and closes on Escape and when the
  // pointer leaves; CSS alone never shows it.
  async function checkInfoTip(page, tip, width) {
    const button = tip.locator(".info-tip__button");
    const bubble = tip.locator(".info-tip__bubble");
    assert.equal(await bubble.isVisible(), false);
    await button.hover();
    await bubble.waitFor({ state: "visible" });
    await button.click();
    const box = await bubble.boundingBox();
    assert.ok(
      box.x >= 0 && box.x + box.width <= width,
      `the bubble stays on screen: ${box.x}..${box.x + box.width} of ${width}`,
    );
    assert.ok(await noSidewaysScroll(page), "no sideways scroll");
    await page.keyboard.press("Escape");
    await bubble.waitFor({ state: "hidden" });
    await button.click();
    await bubble.waitFor({ state: "visible" });
    await page.mouse.move(1, 1);
    await bubble.waitFor({ state: "hidden" });
    await button.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await bubble.waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    await bubble.waitFor({ state: "hidden" });
    assert.ok(await noSidewaysScroll(page));
  }

  for (const [language, width] of [
    ["he", 320],
    ["he", 390],
    ["en", 390],
  ])
    await t.test(
      `ⓘ bubbles stay on screen and close at ${width}px (${language})`,
      async (t) => {
        const query = language === "he" ? "?lang=he" : "";
        const holder = await scenario(browser, {
          viewport: { width, height: 844 },
          organizations: [organization("Grand Hotel")],
        });
        t.after(() => holder.context.close());
        await holder.page.goto(origin + "/dashboard/host/" + query);
        await holder.page.locator("[data-cookie-reject]").click();
        await holder.page.waitForFunction(
          () => document.body.dataset.hostViewId === "my-systems",
        );
        await settled(holder.page);
        await checkInfoTip(
          holder.page,
          holder.page
            .locator('[data-workspace-view="my-systems"] .info-tip')
            .first(),
          width,
        );
        assert.deepEqual(holder.errors, []);

        const pending = await scenario(browser, {
          viewport: { width, height: 844 },
          host: "pending",
          hostRole: null,
          invited: true,
        });
        t.after(() => pending.context.close());
        await pending.page.goto(origin + "/dashboard/host/" + query);
        await pending.page.locator("[data-cookie-reject]").click();
        await pending.page.locator(".join-card").waitFor();
        await checkInfoTip(
          pending.page,
          pending.page.locator(".join-view .view-heading .info-tip"),
          width,
        );
        assert.deepEqual(pending.errors, []);
      },
    );

  for (const mobile of [false, true])
    await t.test(
      `the account menu opens on its first action, not on the plan chip (${mobile ? "phone" : "desktop"}, Hebrew)`,
      async (t) => {
        const fixture = await scenario(browser, {
          mobile,
          organizations: [organization("Grand Hotel")],
        });
        t.after(() => fixture.context.close());
        const page = fixture.page;
        await page.goto(origin + "/dashboard/host/?lang=he");
        await page.locator("[data-cookie-reject]").click();
        await settled(page);
        await page.locator("#account-button").click();
        await page.locator("#account-menu").waitFor({ state: "visible" });
        assert.equal(
          await page.evaluate(() => document.activeElement?.id),
          "account-security",
        );
        const chip = page.locator("#account-plan .host-role-badge");
        assert.equal(await chip.getAttribute("data-role"), "host-user");
        assert.equal(
          await chip.locator(".host-role-explanation").isVisible(),
          false,
          "no tooltip covers the first action",
        );
        // The chip in the person's own menu speaks to them.
        assert.match(await chip.getAttribute("aria-label"), /יש לכם מנוי Host/);
        await page.keyboard.press("Escape");
        await page.locator("#account-menu").waitFor({ state: "hidden" });
        assert.equal(
          await page.evaluate(() => document.activeElement?.id),
          "account-button",
        );
        assert.deepEqual(fixture.errors, []);
      },
    );

  await t.test(
    "a pending account's menu opens on its first visible action (phone, Hebrew)",
    async (t) => {
      const fixture = await scenario(browser, {
        mobile: true,
        host: "pending",
        hostRole: null,
        invited: true,
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/?lang=he");
      await page.locator("[data-cookie-reject]").click();
      await page.locator(".join-card").waitFor();
      await page.locator("#account-button").click();
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.id === "host-profile-link",
        ),
        true,
      );
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "the account menu is closed before the dashboard script runs",
    async (t) => {
      const fixture = await scenario(browser, { mobile: true });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await fixture.context.route("**/js/host-dashboard.bundle.js*", (route) =>
        route.abort(),
      );
      await page.goto(origin + "/dashboard/host/");
      await page.locator("#access-panel").waitFor({ state: "visible" });
      assert.equal(await page.locator("#account-menu").isVisible(), false);
      assert.ok(await noSidewaysScroll(page));
    },
  );

  await t.test(
    "Hebrew text never asks for a weight its fonts don't have",
    async (t) => {
      const fixture = await scenario(browser, {
        admin: true,
        enrolled: true,
        verified: true,
        manager: "pending",
        organizations: [
          organization("מלון גרנד"),
          organization("Beach House", "viewer"),
        ],
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      // Manrope has no Hebrew letters; above 700 the Windows fallback has
      // none either and Chrome draws a serif.
      const heavyHebrew = () => {
        const found = new Set();
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        for (let text = walker.nextNode(); text; text = walker.nextNode()) {
          const element = text.parentElement;
          if (
            /[֐-׿]/.test(text.data) &&
            element.getClientRects().length &&
            Number(getComputedStyle(element).fontWeight) > 700
          )
            found.add(`${element.className}: ${text.data.trim()}`);
        }
        return [...found];
      };
      const fonts = async (selector) => {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("DOM.enable");
        await cdp.send("CSS.enable");
        const { root } = await cdp.send("DOM.getDocument");
        const { nodeId } = await cdp.send("DOM.querySelector", {
          nodeId: root.nodeId,
          selector,
        });
        const result = await cdp.send("CSS.getPlatformFontsForNode", {
          nodeId,
        });
        await cdp.detach();
        return result.fonts.map((font) => font.familyName).join(", ");
      };
      for (const view of [
        "",
        "&view=systems",
        "&view=calendar",
        "&view=bookings",
        "&view=settings&tab=organization",
        "&view=invitations",
      ]) {
        await page.goto(origin + "/dashboard/host/?lang=he" + view);
        await settled(page);
        await page.locator("#account-button").click();
        assert.deepEqual(await page.evaluate(heavyHebrew), [], view || "home");
        await page.keyboard.press("Escape");
      }
      assert.doesNotMatch(await fonts("#workspace-current-view"), /Times/);
      assert.doesNotMatch(await fonts(".org-card__name"), /Times/);
      await page.goto(origin + "/dashboard/?lang=he");
      await page.locator("#product-switcher-button").click();
      assert.deepEqual(await page.evaluate(heavyHebrew), [], "picker");
      assert.doesNotMatch(
        await fonts("#product-switcher-button .product-switcher__name"),
        /Times/,
      );
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "names keep their own direction but line up with the page",
    async (t) => {
      const fixture = await scenario(browser, {
        mobile: true,
        pay: "active",
        organizations: [organization("Grand Hotel")],
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      // How far the text of an element sits from its line's start or end.
      const gaps = (selector) =>
        page.locator(selector).first().evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const text = range.getBoundingClientRect();
          const box = element.getBoundingClientRect();
          return {
            right: Math.round(box.right - text.right),
            left: Math.round(text.left - box.left),
          };
        });
      await page.goto(origin + "/dashboard/host/?lang=he");
      await settled(page);
      for (const selector of [".org-card__name", "#account-name"]) {
        if (selector === "#account-name")
          await page.locator("#account-button").click();
        assert.ok((await gaps(selector)).right <= 1, `${selector} on the right`);
      }
      await page.keyboard.press("Escape");
      await page.locator("#product-switcher-button").click();
      assert.ok(
        (await gaps(".product-switcher__label strong")).right <= 1,
        "product names on the right",
      );
      await page.keyboard.press("Escape");

      const pending = await scenario(browser, {
        mobile: true,
        host: "pending",
        hostRole: null,
        invited: true,
      });
      t.after(() => pending.context.close());
      await pending.page.goto(origin + "/dashboard/host/?lang=he");
      await pending.page.locator(".join-card").waitFor();
      const joinName = await pending.page
        .locator(".join-card__details strong")
        .evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return Math.round(
            element.getBoundingClientRect().right -
              range.getBoundingClientRect().right,
          );
        });
      assert.ok(joinName <= 1, "the organization name sits over its date");

      const english = await scenario(browser, {
        organizations: [organization("מלון גרנד")],
      });
      t.after(() => english.context.close());
      await english.page.goto(origin + "/dashboard/host/");
      await settled(english.page);
      assert.equal(
        await english.page.locator(".org-card__name").getAttribute("dir"),
        "auto",
      );
      const left = await english.page
        .locator(".org-card__name")
        .evaluate((element) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return Math.round(
            range.getBoundingClientRect().left -
              element.getBoundingClientRect().left,
          );
        });
      assert.ok(left <= 1, "a Hebrew name on an English page sits on the left");
      assert.deepEqual(
        [...fixture.errors, ...pending.errors, ...english.errors],
        [],
      );
    },
  );

  await t.test(
    "the phone drawer is modal: Tab stays inside until it closes",
    async (t) => {
      const fixture = await scenario(browser, {
        mobile: true,
        organizations: [organization("Grand Hotel"), organization("Beach House")],
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/?lang=he");
      await page.locator("[data-cookie-reject]").click();
      await settled(page);
      await page.locator(".workspace-menu-toggle").click();
      await page.locator("#host-sidebar.is-open").waitFor();
      await page.waitForFunction(() =>
        document.querySelector("#host-sidebar").contains(document.activeElement),
      );
      for (const selector of [
        ".host-topbar",
        "#workspace-main",
        "#host-tabbar",
        ".portal-legal",
      ])
        assert.equal(
          await page.locator(selector).evaluate((element) => element.inert),
          true,
          `${selector} is inert behind the drawer`,
        );
      for (let step = 0; step < 14; step += 1) {
        await page.keyboard.press("Tab");
        assert.equal(
          await page.evaluate(
            () =>
              document.activeElement === document.body ||
              document
                .querySelector("#host-sidebar")
                .contains(document.activeElement),
          ),
          true,
          `Tab ${step + 1} stays in the drawer`,
        );
      }
      await page.keyboard.press("Escape");
      await page.locator("#host-sidebar.is-open").waitFor({ state: "detached" });
      assert.equal(
        await page.locator("#workspace-main").evaluate((element) => element.inert),
        false,
      );
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.classList.contains("workspace-menu-toggle"),
        ),
        true,
      );
      assert.deepEqual(fixture.errors, []);
    },
  );

  for (const role of ["staff", "owner"])
    await t.test(
      `joining from a pending account opens the full workspace (${role})`,
      async (t) => {
        const fixture = await scenario(browser, {
          mobile: true,
          host: "pending",
          hostRole: null,
          invited: true,
          inviteRole: role,
          enrolled: role === "owner",
          verified: role === "owner",
          joinedOrganizations: [
            { ...organization("Invited Hotel", role), id: "fixture-org" },
          ],
        });
        t.after(() => fixture.context.close());
        const page = fixture.page;
        await page.goto(origin + "/dashboard/host/");
        await page.locator("[data-cookie-reject]").click();
        const join = page.getByRole("button", {
          name: "Join Invited Hotel",
          exact: true,
        });
        await join.waitFor();
        assert.equal(
          await page.evaluate(() =>
            document.body.classList.contains("host-menu-empty"),
          ),
          true,
        );
        await join.click();
        if (role === "owner") {
          await page.locator('#mfa-challenge input[name="code"]').fill("123456");
          await page.locator('#mfa-challenge button[type="submit"]').click();
        }
        await page.waitForFunction(
          () => document.body.dataset.hostAccess === "member",
        );
        // The menu is back at once, also while the workspace still loads.
        assert.equal(
          await page.evaluate(() =>
            document.body.classList.contains("host-menu-empty"),
          ),
          false,
        );
        await settled(page);
        await page.waitForFunction(
          () => document.body.dataset.hostViewId === "systems",
        );
        assert.equal(fixture.state.accepted, true);
        assert.equal(await page.locator("#host-tabbar").isVisible(), true);
        await page.locator(".workspace-menu-toggle").click();
        await page.locator("#host-sidebar.is-open").waitFor();
        const views = await page
          .locator("#host-section-navigation button:not([hidden])")
          .evaluateAll((items) => items.map((item) => item.dataset.viewId));
        assert.ok(views.includes("systems") && views.includes("bookings"));
        assert.equal(views.includes("my-systems"), false, "no My systems");
        assert.equal(
          views.includes("connect"),
          role === "owner",
          "Connect follows integrations:write",
        );
        assert.equal(
          await page.locator(".org-card__name").innerText(),
          "Invited Hotel",
        );
        assert.equal(
          fixture.calls.some((call) => call.path?.startsWith("/api/v1/me/")),
          false,
        );
        assert.deepEqual(fixture.errors, []);
      },
    );

  await t.test(
    "the join view speaks of joining in Hebrew and shows local time",
    async (t) => {
      const fixture = await scenario(browser, {
        mobile: true,
        host: "pending",
        hostRole: null,
        invited: true,
        inviteRole: "staff",
        timezoneId: "Asia/Jerusalem",
        acceptError: { status: 410, code: "INVITATION_EXPIRED" },
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/?lang=he");
      const card = page.locator(".join-card");
      await card.waitFor();
      // 10:00 UTC is 13:00 in Jerusalem on 15 October.
      const until = await card.locator("small").innerText();
      assert.match(until, /13:00/);
      assert.doesNotMatch(until, /10:00|UTC/);
      await page
        .getByRole("button", { name: "הצטרפות ל־Invited Hotel", exact: true })
        .click();
      const status = page.locator(".join-view__status");
      await status
        .getByText("הבקשה להצטרף לארגון פגה. בקשו מהבעלים לשלוח בקשה חדשה.", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page
          .locator(".join-view")
          .getByRole("button", { name: "בדיקה חוזרת", exact: true })
          .isVisible(),
        true,
      );
      // "הזמנות" means bookings: nothing in the join view uses the word.
      assert.doesNotMatch(await page.locator(".join-view").innerText(), /הזמנ/);
      assert.doesNotMatch(
        await page.locator("#join-organization").getAttribute("aria-label"),
        /הזמנ/,
      );
      assert.equal(fixture.state.accepted, undefined);
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "a request to join whose owner is no longer active says so and keeps the join view",
    async (t) => {
      const fixture = await scenario(browser, {
        host: "pending",
        hostRole: null,
        invited: true,
        inviteRole: "staff",
        acceptError: { status: 403, code: "INVITER_ACCESS_DENIED" },
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/");
      await page.locator("[data-cookie-reject]").click();
      await page
        .getByRole("button", { name: "Join Invited Hotel", exact: true })
        .click();
      await page
        .locator(".join-view__status")
        .getByText(
          "The owner who asked you to join is no longer active. Ask an active owner to send a new request.",
          { exact: true },
        )
        .waitFor();
      // The refusal never ends Host: no return to the product picker.
      await page.waitForTimeout(300);
      assert.equal(new URL(page.url()).pathname, "/dashboard/host/");
      assert.equal(await page.locator(".join-card").count(), 1);
      assert.equal(
        await page
          .locator(".join-view")
          .getByRole("button", { name: "Check again", exact: true })
          .isVisible(),
        true,
      );
      assert.equal(
        fixture.calls.filter(
          (call) =>
            call.path === "/api/v1/auth/invitations/owner-invite/accept",
        ).length,
        1,
      );
      assert.equal(fixture.state.accepted, undefined);
      assert.deepEqual(fixture.errors, []);
    },
  );

  await t.test(
    "a disabled product's ⓘ says why, not only its state",
    async (t) => {
      for (const language of ["en", "he"]) {
        const fixture = await scenario(browser, {
          manager: "blocked",
          viewport: { width: 320, height: 800 },
        });
        t.after(() => fixture.context.close());
        const page = fixture.page;
        await page.goto(
          origin + "/dashboard/" + (language === "he" ? "?lang=he" : ""),
        );
        await page.locator("#product-switcher-button").click();
        const option = page.locator('[data-product-option="manager"]');
        assert.equal(await option.getAttribute("aria-disabled"), "true");
        const state = await option
          .locator(".product-switcher__state")
          .innerText();
        const reason = await option
          .locator(".product-switcher__reason")
          .textContent();
        assert.equal(
          reason,
          language === "he"
            ? "הגישה חסומה. פנו למנהל."
            : "Access is blocked. Contact your administrator.",
        );
        assert.notEqual(reason.replace(/\.$/, ""), state);
        assert.deepEqual(fixture.errors, []);
      }
    },
  );

  await t.test(
    "Overview creates an owner-designated organization after fresh MFA",
    async (t) => {
      const fixture = await scenario(browser, {
        admin: true,
        enrolled: true,
        verified: true,
      });
      t.after(() => fixture.context.close());
      const page = fixture.page;
      await page.goto(origin + "/dashboard/host/overview/?tab=organizations");
      await page.locator("[data-cookie-reject]").click();
      await page
        .locator("#admin-overview")
        .getByRole("button", { name: "Create organization", exact: true })
        .click();
      const modal = page.locator(".admin-dialog");
      await modal.getByLabel("Organization name").fill("New Hotel");
      await modal.getByLabel("Time zone").fill("UTC");
      await modal.getByLabel("Owner email").fill("new-owner@example.test");
      await modal
        .getByRole("button", { name: "Create organization", exact: true })
        .click();
      await page.locator('#mfa-challenge input[name="code"]').fill("123456");
      await page.locator('#mfa-challenge button[type="submit"]').click();
      await modal.waitFor({ state: "detached" });
      const created = fixture.calls.find(
        (call) =>
          call.method === "POST" && call.path === "/api/v1/admin/organizations",
      );
      assert.deepEqual(created.body, {
        name: "New Hotel",
        timezone: "UTC",
        ownerEmail: "new-owner@example.test",
      });
      assert.ok(created.key);
      assert.deepEqual(fixture.errors, []);
    },
  );

  for (const mobile of [false, true])
    await t.test(
      `administrator Overview, fresh MFA and archive confirmation (${mobile ? "mobile" : "desktop"})`,
      async (t) => {
        const fixture = await scenario(browser, {
          admin: true,
          enrolled: true,
          verified: true,
          mobile,
        });
        t.after(() => fixture.context.close());
        const page = fixture.page;
        await page.goto(origin + "/dashboard/host/overview/?tab=admins");
        await page.locator("[data-cookie-reject]").click();
        await page
          .locator("#admin-overview .admin-row")
          .waitFor({ state: "visible" });
        await page.getByText("Actions", { exact: true }).first().click();
        assert.equal(
          await page
            .locator("#admin-overview")
            .getByRole("button", { name: "Remove", exact: true })
            .isDisabled(),
          true,
        );
        await page.locator('[data-tab="organizations"]').click();
        await page.locator('[data-tab="users"]').click();
        await page.goBack();
        await page.waitForFunction(
          () =>
            document
              .querySelector('[data-tab="organizations"]')
              .getAttribute("aria-selected") === "true",
        );
        await page.goBack();
        await page.waitForFunction(
          () =>
            document
              .querySelector('[data-tab="admins"]')
              .getAttribute("aria-selected") === "true",
        );
        await page.goForward();
        await page.waitForFunction(
          () =>
            document
              .querySelector('[data-tab="organizations"]')
              .getAttribute("aria-selected") === "true",
        );
        await page
          .getByRole("button", { name: "Fixture Hotel", exact: true })
          .waitFor();
        if (process.env.WIFIGATE_SCREENSHOT_DIR)
          await page.screenshot({
            path: path.join(
              process.env.WIFIGATE_SCREENSHOT_DIR,
              `v1-overview-${mobile ? "mobile" : "desktop"}.png`,
            ),
            fullPage: true,
          });
        fixture.state.gates = 1;
        await page
          .locator("#admin-overview")
          .getByRole("button", { name: "Archive organization" })
          .click();
        await page
          .locator(".admin-dialog")
          .getByLabel("Type the organization name")
          .fill("Fixture Hotel");
        assert.equal(
          await page
            .locator(".admin-dialog")
            .getByRole("button", { name: "Archive organization", exact: true })
            .isDisabled(),
          true,
        );
        // The archive impact names systems, members and bookings only; it
        // never counts systems.
        assert.match(
          await page.locator(".admin-dialog").textContent(),
          /Fixture Hotel: its systems, 1 members and 4 open bookings will become inaccessible/,
        );
        assert.doesNotMatch(
          await page.locator(".admin-dialog").textContent(),
          /propert|room/i,
        );
        // Gates leave an organization only when its systems are removed:
        // there is no transfer. Without a status per system a row may be a
        // system that was already removed, so no system is named.
        assert.match(
          await page.locator(".admin-dialog").textContent(),
          /Gates still held: 1\. Remove the systems that hold them first\./,
        );
        assert.doesNotMatch(
          await page.locator(".admin-dialog").textContent(),
          /transfer|Systems to remove|Front gate/i,
        );
        await page
          .locator(".admin-dialog")
          .getByRole("button", { name: "Cancel" })
          .click();
        // With a status per system, only active systems are named, and a
        // removed one is never asked to be removed again.
        fixture.state.archiveSystems = [
          { id: "front", name: "Front gate", status: "active" },
          { id: "old", name: "Old gate", status: "disabled" },
        ];
        await page
          .locator("#admin-overview")
          .getByRole("button", { name: "Archive organization" })
          .click();
        await page
          .locator(".admin-dialog")
          .getByText("Systems to remove: Front gate.", { exact: false })
          .waitFor();
        assert.doesNotMatch(
          await page.locator(".admin-dialog").textContent(),
          /Old gate/,
        );
        await page
          .locator(".admin-dialog")
          .getByRole("button", { name: "Cancel" })
          .click();
        delete fixture.state.archiveSystems;
        fixture.state.gates = 0;
        await page
          .locator("#admin-overview")
          .getByRole("button", { name: "Archive organization" })
          .click();
        await page
          .locator(".admin-dialog")
          .getByLabel("Type the organization name")
          .fill("Wrong name");
        assert.equal(
          await page
            .locator(".admin-dialog")
            .getByRole("button", { name: "Archive organization", exact: true })
            .isDisabled(),
          true,
        );
        await page
          .locator(".admin-dialog")
          .getByLabel("Type the organization name")
          .fill("Fixture Hotel");
        await page
          .locator(".admin-dialog")
          .getByRole("button", { name: "Archive organization", exact: true })
          .click();
        await page.locator("#mfa-challenge").waitFor({ state: "visible" });
        await page.evaluate(() => window.dispatchEvent(new Event("focus")));
        await page.locator('#mfa-challenge input[name="code"]').fill("123456");
        await page.locator('#mfa-challenge button[type="submit"]').click();
        await page
          .locator("#admin-overview")
          .getByText("No matching records.", { exact: true })
          .waitFor();
        const archived = fixture.calls.find(
          (call) =>
            call.method === "DELETE" &&
            call.path === "/api/v1/organizations/fixture-org",
        );
        assert.deepEqual(archived.body, {
          confirmName: "Fixture Hotel",
          version: 4,
        });
        assert.ok(archived.key);
        assert.ok(fixture.calls.includes("reauth"));
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
        assert.deepEqual(fixture.errors, []);
        await fixture.context.close();
      },
    );
});
