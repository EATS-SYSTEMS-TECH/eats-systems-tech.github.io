import { installAppCheckFixture } from "./app-check-browser-fixture.mjs";
// The mocked platform shared by the dashboard browser tests: Firebase Auth and
// the WIFIGATE API answered from one in-memory state, plus the static site
// served from the repository.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = fileURLToPath(new URL("../", import.meta.url));

// Serves the repository and launches installed Chrome for one test; both close
// when the test ends. Returns the site origin and the browser.
export async function startSite(t) {
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
              : file.endsWith(".svg")
                ? "image/svg+xml"
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
  return { origin: `http://127.0.0.1:${server.address().port}`, browser };
}

export function fixtureProfile(state) {
  const host =
    state.host === "active" && state.admin && !state.verified
      ? "mfa-required"
      : state.host;
  return {
    user: {
      uid: state.uid ?? "fixture-user",
      email: "fixture@example.test",
      displayName: "Fixture User",
      emailVerified: state.emailVerified ?? true,
    },
    mfa: { enrolled: state.enrolled, verified: state.verified },
    platformRole: state.platformRole ?? null,
    products: {
      host: {
        state: host,
        summary: state.personalSummaries?.host,
        financials: state.productFinancials?.host,
        role:
          state.hostRole !== undefined
            ? state.hostRole
            : state.admin
              ? "admin"
              : "user",
      },
      pay: { state: state.pay, ...(state.platformRole === "admin" ? { role: "admin" } : {}), summary: state.personalSummaries?.pay, financials: state.productFinancials?.pay },
      manager: { state: state.manager, ...(state.platformRole === "admin" ? { role: "admin" } : {}), summary: state.personalSummaries?.manager, financials: state.productFinancials?.manager },
    },
  };
}

export async function scenario(browser, options = {}) {
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
    hasTouch: options.hasTouch ?? false,
    viewport:
      options.viewport ??
      (options.mobile
        ? { width: 390, height: 844 }
        : { width: 1440, height: 950 }),
    ...(options.timezoneId ? { timezoneId: options.timezoneId } : {}),
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
  await installAppCheckFixture(context);
  await context.route(
    "https://www.gstatic.com/firebasejs/**/firebase-app.js",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: "export const initializeApp = value => value; export const getApp = () => ({});",
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
        metadata: ${JSON.stringify(state.userMetadata ?? {})},
        getIdToken: async () => "isolated-token",
        getIdTokenResult: async () => ({claims: {auth_time: ${JSON.stringify(state.authTime ?? 0)}, firebase: {sign_in_provider: "google.com"}}}) };
      export const getAuth = () => ({});
      export const connectAuthEmulator = () => {};
      export const browserLocalPersistence = {type: "local"};
      export const setPersistence = async (_, persistence) => { await window.authFixtureEvent({type: "persistence", mode: persistence.type}); };
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
    if (["/api/v1/platform/me", "/api/v1/platform/login"].includes(url.pathname)) {
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
      if (url.pathname.endsWith("/login")) {
        const identity = fixtureProfile(state);
        const denied = Object.values(identity.products).every(product => product.state === "no-plan");
        if (denied) {
          state.loginFailures = Math.min(5, (state.loginFailures ?? 0) + 1);
          const until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          if (state.loginFailures === 5) state.loginLockedUntil ??= until;
          return route.fulfill({ status: state.loginFailures === 5 ? 429 : 403, json: { error: { code: state.loginFailures === 5 ? "PORTAL_LOGIN_LOCKED" : "PORTAL_LOGIN_DENIED", details: { reason: identity.user.emailVerified ? "no-account" : "unverified-email", attempts: { failed: state.loginFailures, limit: 5, resetAt: until, lockedUntil: state.loginLockedUntil ?? null } } } } });
        }
        return route.fulfill({ json: { identity, attempts: { failed: 0, limit: 5, resetAt: null, lockedUntil: null } } });
      }
      return route.fulfill({ json: fixtureProfile(state) });
    }
    if (state.deniedStatus)
      return route.fulfill({
        status: state.deniedStatus,
        json: { error: { code: state.deniedCode ?? "PORTAL_ACCESS_DENIED" } },
      });
    if (url.pathname === "/api/v1/platform/directory/financials")
      return route.fulfill({ json: { kind: "monthly-estimate", totals: [], accounts: 1, billingPolicy: "platform-admin-exempt-v1", unknownAccounts: 1, complete: false, payRevenueAvailable: false } });
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
      return route.fulfill({
        json: { organizations: state.organizations ?? [], nextCursor: null },
      });
    if (url.pathname.startsWith("/api/v1/me/"))
      return state.hostRole === null
        ? route.fulfill({
            status: 403,
            json: { error: { code: "HOST_PLAN_REQUIRED" } },
          })
        : route.fulfill({ json: { items: state.mySystems ?? [], nextCursor: null } });
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
                    role: state.inviteRole ?? "owner",
                    version: 1,
                    expiresAt: "2026-10-15T10:00:00.000Z",
                  },
                ]
              : [],
          nextCursor: null,
        },
      });
    if (url.pathname === "/api/v1/auth/invitations/owner-invite/accept") {
      if (state.acceptError)
        return route.fulfill({
          status: state.acceptError.status,
          json: { error: { code: state.acceptError.code } },
        });
      state.accepted = true;
      // Joining makes Host active for a pending account, with the
      // organization it joined.
      if (state.host === "pending") state.host = "active";
      if (state.joinedOrganizations)
        state.organizations = state.joinedOrganizations;
      return route.fulfill({
        json: { member: { role: state.inviteRole ?? "owner" } },
      });
    }
    if (url.pathname === "/api/v1/admin/overview")
      return route.fulfill({
        json: {
          admins: 1,
          activeAdmins: 1,
          users: state.directoryUsers ?? 1,
          organizations: state.archived ? 0 : 1,
        },
      });
    if (url.pathname === "/api/v1/admin/people")
      return route.fulfill({
        json: {
          items: state.emptyPeople
            ? []
            : [
                {
                  uid: "fixture-user",
                  email: "fixture@example.test",
                  name: "Fixture User",
                  role: state.directoryPersonRole ?? "admin",
                  status: "active",
                  mfaEnrolled: true,
                  lastSignInAt: null,
                  memberships: state.directoryMemberships ?? [],
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
            openReservations: 4,
            gates: state.gates ?? 0,
            systems: state.gates
              ? (state.archiveSystems ?? [{ name: "Front gate" }])
              : [],
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
