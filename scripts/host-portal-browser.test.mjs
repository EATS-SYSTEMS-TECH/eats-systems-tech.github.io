import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { join } from "node:path";
import { passGateGame } from "./gate-game-helper.mjs";
const origin = process.env.WIFIGATE_SITE_ORIGIN ?? "http://127.0.0.1:8100";
const browser = await chromium.launch({
  channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome",
  headless: true,
});
const active = {
  role: "user",
  access: { state: "active" },
  mfa: { required: false, enrolled: false, verified: false },
};
async function scenario(options = {}) {
  const state = {
    ...structuredClone(active),
    signedIn: true,
    organizations: [],
    invitations: [],
    people: [
      {
        uid: "fixture-user",
        email: "approved@example.test",
        name: "Approved User",
        role: "admin",
        status: "active",
        mfaEnrolled: true,
        lastSignInAt: "2026-10-10T12:34:00.000Z",
        memberships: [],
      },
      {
        uid: "target-user",
        email: "target@example.test",
        name: "Target User",
        role: "user",
        status: "active",
        memberships: [],
      },
    ],
    ...options,
  };
  const calls = [];
  const context = await browser.newContext({
    locale: options.browserLocale ?? "en-US",
    viewport: options.mobile
      ? { width: 390, height: 844 }
      : { width: 1440, height: 1000 },
  });
  // This fixture tests Host journeys; consent is exercised by the staging suite.
  await context.addInitScript(() =>
    localStorage.setItem(
      "wifigate-cookie-consent-v1",
      JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }),
    ),
  );
  await context.exposeBinding("fixtureAuthEvent", (_, event) => {
    if (event === "signed-in") state.signedIn = true;
    if (event === "signed-out") state.signedIn = false;
    if (event === "enrolled") state.mfa.enrolled = true;
    if (event === "verified") state.mfa.verified = true;
    calls.push(event);
  });
  await context.route(
    "https://www.gstatic.com/firebasejs/**/firebase-app.js",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: "export const initializeApp = (config) => ({config});",
      }),
  );
  await context.route(
    "https://www.gstatic.com/firebasejs/**/firebase-auth.js",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: `
    let signedIn = ${JSON.stringify(state.signedIn)};
    let enrolled = ${JSON.stringify(state.mfa.enrolled)};
    let verified = ${JSON.stringify(state.mfa.verified)};
    let observer;
    const user = { uid: "fixture-user", email: "approved@example.test", displayName: "Approved User", emailVerified: true,
      getIdToken: async () => verified ? "fixture-id-token-mfa" : "fixture-id-token",
      getIdTokenResult: async () => ({claims:{firebase:{sign_in_provider:${JSON.stringify(state.provider ?? "google.com")}}}}) };
    export const getAuth = () => ({get currentUser(){return signedIn ? user : null;}});
    export const connectAuthEmulator = () => {};
    export const browserSessionPersistence = {};
    export const setPersistence = async () => {};
    export const onAuthStateChanged = (_, callback) => { observer=callback; setTimeout(()=>callback(signedIn ? user : null),0); return ()=>{}; };
    export const GoogleAuthProvider = function(){this.providerId="google.com";this.setCustomParameters=()=>{};};
    export const OAuthProvider = function(id){this.providerId=id;this.addScope=()=>{};};
    export const signInWithPopup = async () => {
      if (enrolled) throw Object.assign(new Error("MFA required"),{code:"auth/multi-factor-auth-required"});
      signedIn=true; await window.fixtureAuthEvent("signed-in"); observer?.(user); return {user};
    };
    export const signInWithRedirect = async () => {};
    export const getRedirectResult = async () => null;
    export const signOut = async () => {signedIn=false; await window.fixtureAuthEvent("signed-out"); observer?.(null);};
    export const reauthenticateWithPopup = async (_,provider) => {
      if(provider.providerId!==${JSON.stringify(state.provider ?? "google.com")}) throw new Error("Incorrect reauthentication provider");
      await window.fixtureAuthEvent("reauthenticated");
      if(enrolled) throw Object.assign(new Error("MFA required"),{code:"auth/multi-factor-auth-required"});
      return {user};
    };
    export const getMultiFactorResolver = () => ({hints:[{factorId:"totp",uid:"totp-factor",displayName:"Test authenticator"}],resolveSignIn:async assertion=>{
      if(assertion.code!=="123456") throw Object.assign(new Error("Bad code"),{code:"auth/invalid-verification-code"});
      verified=true; await window.fixtureAuthEvent("verified"); if(!signedIn){signedIn=true;await window.fixtureAuthEvent("signed-in");observer?.(user);} return {user};
    }});
    export const multiFactor = () => ({ getSession:async()=>({}),enroll:async assertion=>{
      if(assertion.code!=="123456") throw Object.assign(new Error("Bad code"),{code:"auth/invalid-verification-code"});
      enrolled=true; await window.fixtureAuthEvent("enrolled");
    }});
    export const TotpMultiFactorGenerator = {
      assertionForSignIn:(uid,code)=>({uid,code}), assertionForEnrollment:(secret,code)=>({secret,code}),
      generateSecret:async()=>({secretKey:"JBSWY3DPEHPK3PXP",codeLength:6,codeIntervalSeconds:30,hashingAlgorithm:"SHA1",generateQrCodeUrl:()=>"otpauth://totp/WIFIGATE:approved@example.test?secret=JBSWY3DPEHPK3PXP&issuer=WIFIGATE"})
    };
  `,
      }),
  );
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    calls.push({
      path: new URL(request.url()).pathname,
      method: request.method(),
      headers: request.headers(),
      body: request.postData(),
    });
    const requestPath = new URL(request.url()).pathname;
    if (request.method() === "GET" && requestPath === "/api/v1/organizations") {
      await route.fulfill({
        status: 200,
        json: { organizations: [], nextCursor: null },
      });
      return;
    }
    if (
      request.method() === "GET" &&
      requestPath === "/api/v1/auth/invitations"
    ) {
      await route.fulfill({
        status: 200,
        json: { items: state.invitations, nextCursor: null },
      });
      return;
    }
    if (state.errorStatus) {
      await route.fulfill({
        status: state.errorStatus,
        json: { error: { code: "DEPENDENCY_UNAVAILABLE" } },
      });
      return;
    }
    if (requestPath === "/api/v1/platform/me") {
      let host =
        state.access.state === "active"
          ? "active"
          : state.access.state === "pending"
            ? "pending"
            : "no-plan";
      if (
        host === "active" &&
        state.role === "admin" &&
        (!state.mfa.enrolled || !state.mfa.verified)
      )
        host = "mfa-required";
      await route.fulfill({
        json: {
          user: {
            uid: "fixture-user",
            email: "approved@example.test",
            displayName: "Approved User",
            emailVerified: true,
          },
          mfa: { enrolled: state.mfa.enrolled, verified: state.mfa.verified },
          ...(state.incomplete
            ? {}
            : {
                products: {
                  host: { state: host },
                  pay: { state: "no-plan" },
                  manager: { state: "no-plan" },
                },
              }),
        },
      });
      return;
    }
    if (["POST", "DELETE"].includes(request.method())) {
      if (state.failMutationOnce) {
        state.failMutationOnce = false;
        await route.fulfill({
          status: 503,
          json: { error: { code: "DEPENDENCY_UNAVAILABLE" } },
        });
        return;
      }
      if (
        state.role !== "admin" ||
        !state.mfa.verified ||
        state.access.state !== "active"
      ) {
        await route.fulfill({
          status: 403,
          json: { error: { code: "MFA_REQUIRED" } },
        });
        return;
      }
      const input = JSON.parse(request.postData());
      if (requestPath === "/api/v1/admin/people")
        state.people.push({
          uid: "added-" + input.email,
          email: input.email.toLowerCase(),
          role: input.role,
          status: "active",
          memberships: [],
        });
      if (requestPath === "/api/v1/admin/organizations") {
        const id = "created-organization";
        state.organizations.push({
          id,
          name: input.name,
          timezone: input.timezone,
          status: "pending",
          version: 1,
          owners: [],
          ownerEmail: input.ownerEmail,
          memberCount: 0,
          gateCount: 0,
          products: ["host"],
        });
        state.invitations.push({
          id: "created-owner-invitation",
          clientId: id,
          organizationName: input.name,
          role: "owner",
          version: 1,
          expiresAt: "2099-01-01T00:00:00.000Z",
        });
      }
      if (requestPath === "/api/v1/admin/portal-access") {
        if (request.method() === "DELETE")
          state.people = state.people.filter(
            (person) => person.email !== input.email,
          );
        else
          state.people.find((person) => person.email === input.email).status =
            input.status;
      }
      await route.fulfill({ json: { access: { state: "active" } } });
      return;
    }
    if (requestPath === "/api/v1/admin/overview") {
      await route.fulfill({
        json: {
          admins: 2,
          activeAdmins: 2,
          users: state.people.filter((person) => person.role === "user").length,
          organizations: state.organizations.length,
        },
      });
      return;
    }
    if (requestPath === "/api/v1/admin/people") {
      await route.fulfill({
        json: {
          items: state.people.filter(
            (person) =>
              person.role === new URL(request.url()).searchParams.get("role"),
          ),
          nextCursor: null,
        },
      });
      return;
    }
    if (requestPath === "/api/v1/admin/organizations") {
      await route.fulfill({
        json: { items: state.organizations, nextCursor: null },
      });
      return;
    }
    await route.fulfill({
      json: {
        user: {
          uid: "fixture-user",
          email: "approved@example.test",
          displayName: "Approved User",
          emailVerified: true,
        },
        ...(state.incomplete
          ? {}
          : { role: state.role, access: state.access, mfa: state.mfa }),
      },
    });
  });
  const page = await context.newPage();
  return { context, page, state, calls };
}
async function openPortal(t) {
  await t.page.goto(origin + "/dashboard/host/");
}
async function openSettings(page) {
  const settings = page.getByRole("button", { name: "Settings", exact: true });
  if (!(await settings.isVisible()))
    await page.getByRole("button", { name: "Menu", exact: true }).click();
  await settings.click();
}
async function enroll(t) {
  const page = t.page;
  await page.locator("#start-enrollment").click();
  await page.locator("#totp-setup").waitFor({ state: "visible" });
  assert.equal(
    await page.locator("#totp-secret").inputValue(),
    "JBSWY3DPEHPK3PXP",
  );
  assert.match(
    await page.locator("#totp-qr").getAttribute("src"),
    /^data:image/,
  );
  await page.locator("#enrollment-form input").fill("000000");
  await page.locator("#enrollment-form button").click();
  await page
    .getByText("That code is incorrect or expired.", { exact: false })
    .waitFor();
  assert.equal(await page.locator("#admin-approval").isVisible(), false);
  await page.locator("#enrollment-form input").fill("123456");
  await page.locator("#enrollment-form button").click();
}
try {
  for (const state of ["pending", "denied"]) {
    const t = await scenario({ role: null, access: { state } });
    await openPortal(t);
    await t.page
      .locator(
        '[data-product="host"][data-state="' +
          (state === "pending" ? "pending" : "no-plan") +
          '"]',
      )
      .waitFor();
    assert.equal(await t.page.locator("#dashboard-content").isVisible(), false);
    assert.equal(await t.page.locator("#mfa-enrollment").isVisible(), false);
    await t.context.close();
  }
  for (const options of [{ incomplete: true }, { errorStatus: 503 }]) {
    const t = await scenario(options);
    await openPortal(t);
    await t.page
      .getByRole("heading", { name: "Unable to check access", exact: true })
      .waitFor();
    assert.equal(await t.page.locator("#dashboard-content").isVisible(), false);
    await t.context.close();
  }
  const admin = await scenario({
    role: "admin",
    browserLocale: "he-IL",
    mfa: { required: true, enrolled: false, verified: false },
  });
  await openPortal(admin);
  await admin.page.locator("#platform-security").waitFor({ state: "visible" });
  assert.equal(
    await admin.page.locator("#dashboard-content").isVisible(),
    false,
  );
  assert.equal(
    await admin.page.locator("#cancel-enrollment").isVisible(),
    false,
  );
  await enroll(admin);
  await admin.page.locator("#verify-session").waitFor({ state: "visible" });
  assert.equal(await admin.page.locator("#totp-secret").inputValue(), "");
  await admin.page.locator("#verify-session").click();
  await admin.page.locator("#mfa-challenge").waitFor({ state: "visible" });
  await admin.page.locator('#mfa-challenge input[name="code"]').fill("000000");
  await admin.page.locator('#mfa-challenge button[type="submit"]').click();
  await admin.page
    .locator('#mfa-challenge [role="status"]')
    .getByText("That code is incorrect or expired.", { exact: false })
    .waitFor();
  await admin.page.locator('#mfa-challenge input[name="code"]').fill("123456");
  await admin.page.locator('#mfa-challenge button[type="submit"]').click();
  await admin.page
    .locator('[data-product="host"][data-state="active"] a')
    .click();
  await admin.page
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await admin.page.locator("#admin-overview").waitFor({ state: "visible" });
  const modal = admin.page.locator("dialog.admin-dialog[open]");
  const confirm = async () => {
    await admin.page.locator("#mfa-challenge").waitFor({ state: "visible" });
    await admin.page
      .locator('#mfa-challenge input[name="code"]')
      .fill("123456");
    await admin.page.locator('#mfa-challenge button[type="submit"]').click();
  };
  const addPerson = async (role, email) => {
    await admin.page
      .locator("#admin-tab-" + (role === "admin" ? "admins" : "users"))
      .click();
    await admin.page
      .getByRole("button", { name: "Add " + role, exact: true })
      .click();
    await modal.locator('input[name="email"]').fill(email);
    await modal.locator('button[type="submit"]').click();
    await confirm();
  };
  if (process.env.WIFIGATE_SCREENSHOT_DIR)
    await admin.page.screenshot({
      path: join(process.env.WIFIGATE_SCREENSHOT_DIR, "admin-portal.png"),
      fullPage: true,
    });
  await addPerson("user", "new@example.test");
  await modal.waitFor({ state: "hidden" });
  await admin.page
    .locator("#admin-directory")
    .getByText("new@example.test", { exact: true })
    .first()
    .waitFor();
  const approval = admin.calls.find((call) => call.method === "POST");
  assert.equal(approval.path, "/api/v1/admin/people");
  assert.deepEqual(JSON.parse(approval.body), {
    email: "new@example.test",
    role: "user",
  });
  assert.equal(approval.headers.authorization, "Bearer fixture-id-token-mfa");
  assert.ok(approval.headers["idempotency-key"]);
  await addPerson("admin", "admin@example.test");
  await modal.waitFor({ state: "hidden" });
  assert.equal(
    JSON.parse(admin.calls.filter((call) => call.method === "POST").at(-1).body)
      .role,
    "admin",
  );
  const own = admin.page.locator(".admin-row").filter({
    has: admin.page.getByText("approved@example.test", { exact: true }),
  });
  assert.match(await own.innerText(), /Oct 10, 2026/);
  assert.match(await own.innerText(), /UTC/);
  await own.locator("summary").click();
  assert.equal(
    await own.getByRole("button", { name: "Block", exact: true }).isDisabled(),
    true,
  );
  assert.equal(
    await own.getByRole("button", { name: "Remove", exact: true }).isDisabled(),
    true,
  );
  await admin.page.locator("#admin-tab-users").click();
  for (const action of ["block", "unblock", "delete"]) {
    const label =
      action === "delete" ? "Remove" : action === "block" ? "Block" : "Unblock";
    const target = admin.page.locator(".admin-row").filter({
      has: admin.page.getByText("target@example.test", { exact: true }),
    });
    await target.locator("summary").click();
    await target.getByRole("button", { name: label, exact: true }).click();
    await modal.locator('button[type="submit"]').click();
    await confirm();
    await modal.waitFor({ state: "hidden" });
    const mutation = admin.calls
      .filter((call) => ["POST", "DELETE"].includes(call.method))
      .at(-1);
    assert.equal(mutation.method, action === "delete" ? "DELETE" : "POST");
    assert.deepEqual(
      JSON.parse(mutation.body),
      action === "delete"
        ? { email: "target@example.test" }
        : {
            email: "target@example.test",
            status: action === "block" ? "blocked" : "active",
          },
    );
  }
  admin.state.failMutationOnce = true;
  await addPerson("user", "retry@example.test");
  await modal
    .getByText("The request could not be completed. Please retry.", {
      exact: true,
    })
    .waitFor();
  await modal.locator('button[type="submit"]').click();
  await confirm();
  await modal.waitFor({ state: "hidden" });
  const retryCalls = admin.calls.filter(
    (call) =>
      call.method === "POST" &&
      JSON.parse(call.body).email === "retry@example.test",
  );
  assert.equal(retryCalls.length, 2);
  assert.equal(
    retryCalls[0].headers["idempotency-key"],
    retryCalls[1].headers["idempotency-key"],
  );
  await admin.page.locator("#admin-tab-organizations").click();
  await admin.page
    .getByRole("button", { name: "Create organization", exact: true })
    .click();
  await modal.locator('input[name="name"]').fill("New test organization");
  await modal.locator('input[name="timezone"]').fill("Asia/Jerusalem");
  await modal.locator('input[name="ownerEmail"]').fill("approved@example.test");
  await modal.locator('button[type="submit"]').click();
  await confirm();
  await modal.waitFor({ state: "hidden" });
  await admin.page
    .locator('#host-management [data-invitation-id="created-owner-invitation"]')
    .waitFor({ state: "attached" });
  await admin.page.getByRole("button", { name: /Team invitations/ }).click();
  await admin.page
    .getByRole("button", { name: "Accept team invitation", exact: true })
    .waitFor({ state: "visible" });
  const visibleInvitation = await admin.page
    .locator('[data-invitation-id="created-owner-invitation"]')
    .innerText();
  assert.match(visibleInvitation, /2099/);
  assert.match(visibleInvitation, /UTC/);
  assert.doesNotMatch(visibleInvitation, /2099-01-01T00:00:00/);
  assert.equal(admin.state.organizations.length, 1);
  assert.equal(admin.state.invitations.length, 1);
  admin.state.access.state = "denied";
  await admin.page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await admin.page
    .locator('[data-product="host"][data-state="no-plan"]')
    .waitFor();
  assert.equal(await admin.page.locator("#admin-overview").isVisible(), false);
  await admin.context.close();
  const hebrewAdmin = await scenario({
    role: "admin",
    browserLocale: "en-US",
    mfa: { required: true, enrolled: true, verified: true },
  });
  await hebrewAdmin.page.goto(origin + "/dashboard/host/overview/?lang=he");
  await hebrewAdmin.page.locator("#admin-tab-users").click();
  const hebrewTarget = hebrewAdmin.page.locator(".admin-row").filter({
    has: hebrewAdmin.page.getByText("target@example.test", { exact: true }),
  });
  await hebrewTarget.locator("summary").click();
  for (const [label, confirmation] of [
    ["חסימה", "חסימת גישה"],
    ["הסרה", "הסרת גישה"],
  ]) {
    await hebrewTarget.getByRole("button", { name: label, exact: true }).click();
    await hebrewAdmin.page
      .locator("dialog.admin-dialog[open]")
      .getByRole("button", { name: confirmation, exact: true })
      .waitFor();
    await hebrewAdmin.page
      .locator("dialog.admin-dialog[open]")
      .getByRole("button", { name: "ביטול", exact: true })
      .click();
  }
  assert.equal(
    hebrewAdmin.calls.some((call) => ["POST", "DELETE"].includes(call.method)),
    false,
    "reviewing and canceling access changes does not mutate accounts",
  );
  await hebrewAdmin.context.close();
  for (const mobile of [false, true]) {
    const regular = await scenario({
      mobile,
      provider: mobile ? "apple.com" : "google.com",
    });
    await openPortal(regular);
    await regular.page
      .locator("#dashboard-content")
      .waitFor({ state: "visible" });
    await regular.page
      .getByRole("region", { name: "Reservation calendar", exact: true })
      .waitFor();
    assert.equal(await regular.page.locator("#calendar-image").count(), 0);
    assert.equal(
      await regular.page.locator("#account-details").isVisible(),
      false,
    );
    assert.equal(
      await regular.page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
    );
    if (process.env.WIFIGATE_SCREENSHOT_DIR)
      await regular.page.screenshot({
        path: join(
          process.env.WIFIGATE_SCREENSHOT_DIR,
          `empty-calendar-${mobile ? "mobile" : "desktop"}.png`,
        ),
        fullPage: true,
      });
    await openSettings(regular.page);
    await regular.page.locator("#optional-enrollment").click();
    await regular.page.locator("#cancel-enrollment").click();
    await regular.page
      .locator("#dashboard-content")
      .waitFor({ state: "visible" });
    await openSettings(regular.page);
    await regular.page.locator("#optional-enrollment").click();
    await enroll(regular);
    await regular.page
      .locator("#dashboard-content")
      .waitFor({ state: "visible" });
    assert.equal(
      await regular.page.locator("#admin-approval").isVisible(),
      false,
    );
    await regular.page.locator("#sign-out").click();
    await regular.page.waitForURL("**/login/");
    await regular.page.goto(origin + "/dashboard/");
    await regular.page.waitForURL((url) => url.pathname === "/login/");
    await regular.context.close();
  }
  for (const provider of ["google", "apple"]) {
    const t = await scenario({
      signedIn: false,
      mfa: { required: false, enrolled: true, verified: false },
    });
    await t.page.goto(origin + "/login/");
    await (await passGateGame(t.page, provider)).click();
    await t.page.locator('#mfa-challenge input[name="code"]').fill("123456");
    await t.page.locator('#mfa-challenge button[type="submit"]').click();
    await t.page.waitForURL("**/dashboard/");
    await t.page.locator("#product-grid").waitFor({ state: "visible" });
    assert.ok(t.calls.some((call) => call.path === "/api/v1/platform/me"));
    assert.equal(
      t.calls.some((call) => call.method === "PUT"),
      false,
    );
    await t.context.close();
  }
  console.log(
    "Portal browser fixtures passed: denial/errors, admin MFA enrollment/challenge/approval, revoked access, optional MFA, responsive calendar workspace, login and logout.",
  );
} finally {
  await browser.close();
}
