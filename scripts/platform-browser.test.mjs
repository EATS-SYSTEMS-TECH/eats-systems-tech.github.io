import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { passGateGame } from "./gate-game-helper.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));

function fixtureProfile(state) {
  const host =
    state.host === "active" && state.admin && !state.verified
      ? "mfa-required"
      : state.host;
  return {
    user: {
      uid: state.uid ?? "fixture-user",
      email: "fixture@example.test",
      displayName: "Fixture User",
      emailVerified: true,
    },
    mfa: { enrolled: state.enrolled, verified: state.verified },
    products: {
      host: { state: host },
      pay: { state: state.pay },
      manager: { state: state.manager },
    },
  };
}

async function scenario(browser, options = {}) {
  const state = {
    signedIn: true,
    enrolled: false,
    verified: false,
    admin: false,
    host: "active",
    pay: "no-plan",
    manager: "pending",
    ...options,
  };
  const context = await browser.newContext({
    viewport: options.mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 950 },
  });
  const calls = [];
  const errors = [];
  await context.exposeBinding("authFixtureEvent", (_, event) => {
    if (event?.type === "identity") {
      state.uid = event.uid;
      state.enrolled = false;
      state.verified = false;
    }
    if (event === "signin") state.signedIn = true;
    if (event === "signout") state.signedIn = false;
    if (event === "enroll") state.enrolled = true;
    if (event === "verify") state.verified = true;
    calls.push(event);
  });
  await context.route(
    "https://www.gstatic.com/firebasejs/**/firebase-app.js",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: "export const initializeApp = value => value;",
      }),
  );
  await context.route(
    "https://www.gstatic.com/firebasejs/**/firebase-auth.js",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `
      let signedIn = ${JSON.stringify(state.signedIn)};
      let enrolled = ${JSON.stringify(state.enrolled)};
      let observer;
      let user = { uid: "fixture-user", email: "fixture@example.test", emailVerified: true,
        getIdToken: async () => "isolated-token",
        getIdTokenResult: async () => ({claims: {firebase: {sign_in_provider: "google.com"}}}) };
      export const getAuth = () => ({});
      export const connectAuthEmulator = () => {};
      export const browserSessionPersistence = {};
      export const setPersistence = async () => {};
      export const onAuthStateChanged = (_, callback) => { observer = callback; setTimeout(() => callback(signedIn ? user : null), 0); return () => {}; };
      window.fixtureChangeUser = async uid => { user = {...user, uid}; enrolled = false; await window.authFixtureEvent({type: "identity", uid}); observer?.(user); };
      export const GoogleAuthProvider = function () { this.setCustomParameters = () => {}; };
      export const OAuthProvider = function () { this.addScope = () => {}; };
      export const signInWithPopup = async () => {
        if (${JSON.stringify(Boolean(state.popupBlocked))}) throw Object.assign(new Error(), {code: "auth/popup-blocked"});
        if (enrolled) throw Object.assign(new Error(), {code: "auth/multi-factor-auth-required"});
        signedIn = true; await window.authFixtureEvent("signin"); observer?.(user); return { user };
      };
      export const getRedirectResult = async () => null;
      export const signInWithRedirect = async () => { await window.authFixtureEvent("redirect"); };
      export const signOut = async () => { signedIn = false; await window.authFixtureEvent("signout"); observer?.(null); };
      export const reauthenticateWithPopup = async () => {
        await window.authFixtureEvent("reauth");
        if (${JSON.stringify(state.reauthError ?? null)}) throw Object.assign(new Error(), {code:${JSON.stringify(state.reauthError ?? null)}});
        if (enrolled) throw Object.assign(new Error(), {code: "auth/multi-factor-auth-required"});
        return { user };
      };
      export const getMultiFactorResolver = () => ({
        hints: [{factorId: "totp", uid: "test-factor", displayName: "Authenticator"}],
        resolveSignIn: async ({code}) => {
          if (code !== "123456") throw Object.assign(new Error(), {code: "auth/invalid-verification-code"});
          await window.authFixtureEvent("verify");
          if (!signedIn) { signedIn = true; await window.authFixtureEvent("signin"); observer?.(user); }
          return { user };
        }
      });
      export const multiFactor = account => ({getSession: async () => ({}), enroll: async ({code}) => {
        if (code !== "123456") throw Object.assign(new Error(), {code: "auth/invalid-verification-code"});
        if (window.fixturePauseFinish) await new Promise(resolve => { window.fixtureReleaseFinish = resolve; });
        if (account.uid === user.uid) { enrolled = true; await window.authFixtureEvent("enroll"); }
        else await window.authFixtureEvent("stale-enroll");
      }});
      export const TotpMultiFactorGenerator = {
        assertionForSignIn: (_, code) => ({code}), assertionForEnrollment: (_, code) => ({code}),
        generateSecret: async () => { await window.authFixtureEvent("begin-enroll"); return { secretKey: "JBSWY3DPEHPK3PXP", generateQrCodeUrl: () => "otpauth://totp/Fixture?secret=JBSWY3DPEHPK3PXP" }; }
      };
    `,
      }),
  );
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    calls.push({
      method: request.method(),
      path: url.pathname,
      body: request.postDataJSON(),
      key: request.headers()["idempotency-key"],
    });
    if (url.pathname === "/api/v1/platform/me") {
      if (state.legacy)
        return route.fulfill({
          status: 404,
          json: { error: { code: "NOT_FOUND" } },
        });
      if (state.unavailable)
        return route.fulfill({
          status: 503,
          json: { error: { code: "AUTH_UNAVAILABLE" } },
        });
      return route.fulfill({ json: fixtureProfile(state) });
    }
    if (state.deniedStatus)
      return route.fulfill({
        status: state.deniedStatus,
        json: { error: { code: state.deniedCode ?? "PORTAL_ACCESS_DENIED" } },
      });
    if (url.pathname === "/api/v1/users/me") {
      return route.fulfill({
        json: {
          user: fixtureProfile(state).user,
          role: state.admin ? "admin" : "user",
          access: { state: "active" },
          mfa: {
            required: state.admin,
            enrolled: state.enrolled,
            verified: state.verified,
          },
        },
      });
    }
    if (url.pathname === "/api/v1/organizations")
      return route.fulfill({ json: { organizations: [], nextCursor: null } });
    if (url.pathname === "/api/v1/auth/invitations")
      return route.fulfill({
        json: {
          items:
            state.invited && !state.accepted
              ? [
                  {
                    id: "owner-invite",
                    clientId: "fixture-org",
                    organizationName: "Invited Hotel",
                    role: "owner",
                    version: 1,
                    expiresAt: "2026-10-15T10:00:00.000Z",
                  },
                ]
              : [],
          nextCursor: null,
        },
      });
    if (url.pathname === "/api/v1/auth/invitations/owner-invite/accept") {
      state.accepted = true;
      return route.fulfill({ json: { member: { role: "owner" } } });
    }
    if (url.pathname === "/api/v1/admin/overview")
      return route.fulfill({
        json: {
          admins: 1,
          activeAdmins: 1,
          users: 1,
          organizations: state.archived ? 0 : 1,
        },
      });
    if (url.pathname === "/api/v1/admin/people")
      return route.fulfill({
        json: {
          items: [
            {
              uid: "fixture-user",
              email: "fixture@example.test",
              name: "Fixture User",
              role: "admin",
              status: "active",
              mfaEnrolled: true,
              lastSignInAt: null,
              memberships: [],
            },
          ],
          nextCursor: null,
        },
      });
    if (
      url.pathname === "/api/v1/admin/organizations" &&
      request.method() === "GET"
    )
      return route.fulfill({
        json: {
          items: state.archived
            ? []
            : [
                {
                  id: "fixture-org",
                  name: "Fixture Hotel",
                  status: "active",
                  owners: ["owner@example.test"],
                  memberCount: 1,
                  gateCount: state.gates ?? 0,
                  products: ["host"],
                },
              ],
          nextCursor: null,
        },
      });
    if (url.pathname === "/api/v1/admin/organizations/fixture-org")
      return route.fulfill({
        json: {
          organization: {
            id: "fixture-org",
            name: "Fixture Hotel",
            status: "active",
            version: 4,
          },
          members: [],
          impact: {
            members: 1,
            properties: 2,
            rooms: 3,
            openReservations: 4,
            gates: state.gates ?? 0,
            systems: state.gates ? [{ name: "Front gate" }] : [],
          },
        },
      });
    if (
      url.pathname === "/api/v1/organizations/fixture-org" &&
      request.method() === "DELETE"
    ) {
      state.archived = true;
      return route.fulfill({
        json: { organization: { status: "archived" }, historyRetained: true },
      });
    }
    return route.fulfill({ json: { items: [], nextCursor: null } });
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  return { state, context, page, calls, errors };
}

test("shared login, product isolation, MFA, safe redirects and session cleanup", async (t) => {
  const server = createServer(async (request, response) => {
    try {
      let file = path.resolve(
        root,
        "." + new URL(request.url, "http://localhost").pathname,
      );
      if (!file.startsWith(root)) {
        response.writeHead(403).end();
        return;
      }
      if ((await stat(file)).isDirectory())
        file = path.join(file, "index.html");
      response.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "application/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : file.endsWith(".html")
              ? "text/html; charset=utf-8"
              : "application/octet-stream",
      );
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const browser = await chromium.launch({
    channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  t.after(() => browser.close());
  const origin = `http://127.0.0.1:${server.address().port}`;

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
        (res) => new URL(res.url()).pathname === "/api/v1/users/me",
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
          .locator('#host-section-navigation [data-view-id="overview"]')
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

      const navigation = page.locator("#host-section-navigation");
      const overview = navigation.locator('[data-view-id="overview"]');
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

      await page.setViewportSize({ width: 1280, height: 420 });
      await navigation.hover();
      await page.mouse.wheel(0, 600);
      await page.waitForFunction(
        () => document.querySelector("#host-section-navigation").scrollTop > 0,
      );
      await overview.click();
      const profile = await page.locator("#sidebar-profile").boundingBox();
      const scrolledOverview = await overview.boundingBox();
      assert.ok(
        scrolledOverview.y + scrolledOverview.height <= profile.y,
        "Profile must not cover navigation",
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
    "EN and Hebrew mobile picker keep Host, Pay, Manager order and use only platform GET",
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
        assert.equal(
          await fixture.page
            .locator('[data-product="host"] a')
            .getAttribute("href"),
          mobile ? "/dashboard/host/?lang=he" : "/dashboard/host/",
        );
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
    "all no-plan tiles do not create access and platform failure retains authentication",
    async () => {
      const fixture = await scenario(browser, {
        host: "no-plan",
        pay: "no-plan",
        manager: "no-plan",
      });
      await fixture.page.goto(origin + "/dashboard/");
      await fixture.page
        .locator('.product-tile[data-state="no-plan"]')
        .first()
        .waitFor();
      assert.equal(
        await fixture.page
          .locator('.product-tile[data-state="no-plan"]')
          .count(),
        3,
      );
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
      const fixture = await scenario(browser);
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
          .locator('#product-switcher option[value="manager"]')
          .evaluate((option) => option.disabled),
        true,
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
      await fixture.page.locator('[data-product="host"] a').click();
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
        .getByRole("button", { name: "Support", exact: true })
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
        "**/api/v1/organizations/org-a/rooms",
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
              "/api/v1/organizations/org-a/rooms",
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
      await fixture.page.clock.fastForward(30 * 60 * 1000 + 1);
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
        1,
      );
      assert.equal(await fixture.page.locator("#host-management").count(), 0);
      await fixture.context.close();
    },
  );

  await t.test(
    "thirty idle minutes and401 both end the tab session",
    async () => {
      const idle = await scenario(browser);
      await idle.page.clock.install();
      await idle.page.goto(origin + "/dashboard/");
      await idle.page.locator(".product-tile").first().waitFor();
      await idle.page.clock.fastForward(30 * 60 * 1000 + 1);
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
    "legacy API dashboard entry preserves Host access and leaves other products unavailable",
    async () => {
      const fixture = await scenario(browser, { legacy: true });
      await fixture.page.goto(origin + "/dashboard/");
      await fixture.page
        .locator('[data-product="host"][data-state="active"] a')
        .click();
      await fixture.page
        .locator("#dashboard-content")
        .waitFor({ state: "visible" });
      assert.ok(fixture.calls.some((call) => call.path === "/api/v1/users/me"));
      assert.equal(
        await fixture.page.locator('[data-view="overview"]:visible').count(),
        0,
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
      await page
        .getByRole("button", { name: "Team invitations", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Accept team invitation" })
        .click();
      await page.locator("#mfa-challenge").waitFor({ state: "visible" });
      assert.equal(fixture.state.accepted, undefined);
      await page.evaluate(() => window.dispatchEvent(new Event("focus")));
      await page.locator('#mfa-challenge input[name="code"]').fill("123456");
      await page.locator('#mfa-challenge button[type="submit"]').click();
      await page
        .getByText("No pending team invitations.", { exact: true })
        .waitFor();
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
      await page
        .getByRole("button", { name: "Team invitations", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Accept team invitation" })
        .click();
      await page.locator("#mfa-enrollment").waitFor({ state: "visible" });
      assert.equal(fixture.state.accepted, undefined);
      await page.locator("#cancel-enrollment").click();
      await page
        .getByRole("button", { name: "Team invitations", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Accept team invitation" })
        .waitFor();
      assert.deepEqual(fixture.errors, []);
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
        assert.match(
          await page.locator(".admin-dialog").textContent(),
          /Front gate/,
        );
        await page
          .locator(".admin-dialog")
          .getByRole("button", { name: "Cancel" })
          .click();
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
