import "./app-check-test-hook.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  getPlatformProfile,
  profileApi,
  adminRequest,
} from "../js/api/index.js";
import { AxiosError } from "axios";
import {
  parsePlatformIdentity,
  safeDashboardPath,
  loginDestination,
  loginPath,
  pageLanguage,
  signInRefusal,
  hasHostPlan,
  canOpenProduct,
} from "../js/platform-model.js";

function profile() {
  return {
    user: { uid: "test-user", emailVerified: true },
    mfa: { enrolled: false, verified: false },
    products: {
      host: { state: "active", organizations: 1 },
      pay: { state: "no-plan" },
      manager: { state: "unavailable" },
    },
  };
}

test("Manager invitations open their workspace while blocked and unavailable access stay closed", () => {
  const invited = profile();
  invited.products.manager = { state: "pending" };
  const identity = parsePlatformIdentity(invited, "test-user");
  assert.equal(canOpenProduct(identity, "manager"), true);
  assert.equal(loginDestination(identity, "/dashboard/manager/?lang=he"), "/dashboard/manager/?lang=he");
  for (const state of ["blocked", "no-plan", "unavailable", "mfa-required"]) {
    invited.products.manager = { state };
    const refused = parsePlatformIdentity(invited, "test-user");
    assert.equal(canOpenProduct(refused, "manager"), false);
    assert.equal(loginDestination(refused, "/dashboard/manager/"), "/dashboard/");
  }
});

test("platform identity requires all server states and matches the signed-in account", () => {
  assert.equal(
    parsePlatformIdentity(profile(), "test-user").products.manager.state,
    "unavailable",
  );
  assert.throws(
    () => parsePlatformIdentity(profile(), "another-user"),
    /contract-incomplete/,
  );
  const absentProduct = profile();
  delete absentProduct.products.pay;
  assert.throws(
    () => parsePlatformIdentity(absentProduct),
    /contract-incomplete/,
  );
  const forgedState = profile();
  forgedState.products.pay.state = "approved";
  assert.throws(
    () => parsePlatformIdentity(forgedState),
    /contract-incomplete/,
  );
  const unverified = profile();
  unverified.user.emailVerified = false;
  assert.throws(() => parsePlatformIdentity(unverified), /contract-incomplete/);
});

test("the Host plan role parses as admin, user or null and nothing else", () => {
  const parsed = parsePlatformIdentity(profile(), "test-user");
  assert.equal(parsed.products.host.role, null, "an absent role means no plan");
  assert.equal(hasHostPlan(parsed), false);
  for (const role of ["admin", "user"]) {
    const value = profile();
    value.products.host.role = role;
    const identity = parsePlatformIdentity(value);
    assert.equal(identity.products.host.role, role);
    assert.equal(hasHostPlan(identity), true);
  }
  const member = profile();
  member.products.host.role = null;
  assert.equal(parsePlatformIdentity(member).products.host.role, null);
  for (const role of ["owner", "platform_admin", "", 1]) {
    const forged = profile();
    forged.products.host.role = role;
    assert.throws(() => parsePlatformIdentity(forged), /contract-incomplete/, String(role));
  }
  const pending = profile();
  pending.products.host = { state: "pending" };
  const pendingIdentity = parsePlatformIdentity(pending);
  assert.equal(canOpenProduct(pendingIdentity, "host"), true, "a pending invitation opens Host to accept it");
  assert.equal(canOpenProduct(pendingIdentity, "pay"), false);
  const payPending = profile();
  payPending.products.pay = { state: "pending" };
  assert.equal(canOpenProduct(parsePlatformIdentity(payPending), "pay"), false);
  assert.equal(
    loginDestination(pendingIdentity, "/dashboard/host/"),
    "/dashboard/host/",
  );
});

test("deep links reject external URLs, encoded separators and traversal", () => {
  const unsafePaths = [
    "https://outside.example/dashboard/host/",
    "//outside.example/dashboard/host/",
    "/dashboard//host/",
    "/dashboard/../outside",
    "/dashboard/host/../../outside",
    "/dashboard/%2f%2foutside.example/",
    "/dashboard/host/%2e%2e/pay/",
    "/dashboard/host/%252e%252e/pay/",
    "/dashboard/host\\outside",
    "/dashboard/host/\n",
    "/dashboard/admin/",
    "/dashboard/host;outside/",
    "/dashboard/host/%00",
    "/dashboard/host/reservations/example",
    "/dashboard/pay/transactions/1",
  ];
  for (const path of unsafePaths)
    assert.equal(safeDashboardPath(path), null, path);
  const requested = "/dashboard/host/?reservation=example#details";
  assert.equal(safeDashboardPath(requested), requested);
  assert.equal(loginDestination(profile(), requested), requested);
  assert.equal(
    loginDestination(profile(), "/dashboard/host/overview/?tab=users"),
    "/dashboard/host/overview/?tab=users",
  );
  assert.equal(
    loginDestination(profile(), "/dashboard/pay/transactions/1"),
    "/dashboard/",
  );
  assert.equal(
    loginDestination(profile(), "https://outside.example", "he"),
    "/dashboard/?lang=he",
  );
  assert.equal(loginPath("//outside.example", "he"), "/he/login/");
  assert.equal(
    loginPath("/dashboard/pay/", "zh-Hans"),
    "/zh-hans/login/?next=%2Fdashboard%2Fpay%2F",
  );
  assert.equal(loginPath(null, "en"), "/login/");
  assert.equal(loginPath(null, "../evil"), "/login/");
  assert.equal(
    loginPath(null, "he", "no-account"),
    "/he/login/?reason=no-account",
  );
  assert.equal(
    loginPath("/dashboard/pay/", "en", "unverified-email"),
    "/login/?next=%2Fdashboard%2Fpay%2F&reason=unverified-email",
  );
  assert.equal(loginPath(null, "en", "<script>"), "/login/");
});

test("sign-in is refused only when every product has no plan", () => {
  const noPlan = profile();
  for (const id of ["host", "pay", "manager"])
    noPlan.products[id] = { state: "no-plan" };
  assert.equal(signInRefusal(noPlan), "no-account");
  noPlan.user.emailVerified = false;
  assert.equal(signInRefusal(noPlan), "unverified-email");
  assert.equal(signInRefusal(profile()), null);
  for (const state of ["pending", "blocked", "mfa-required", "unavailable"]) {
    const other = profile();
    for (const id of ["host", "pay", "manager"])
      other.products[id] = { state: "no-plan" };
    other.products.manager = { state };
    assert.equal(signInRefusal(other), null, state);
  }
});

test("the Hebrew picker speaks to the reader in the plural throughout", async () => {
  const { platformText } = await import("../js/platform-copy.js");
  const hebrew = platformText("he");
  // "My account" in a button names the reader's own thing; every sentence
  // addresses them as "you" in the plural.
  for (const [key, value] of Object.entries(hebrew))
    assert.doesNotMatch(value, /שלך(?![\u0590-\u05FF])|התחברת(?![\u0590-\u05FF])|אין לך(?![\u0590-\u05FF])/, key);
  assert.equal(hebrew.account, "החשבון שלכם");
  assert.match(hebrew.accountDetail, /^התחברתם /);
});

test("URL selects the interface language without browser storage", () => {
  assert.equal(pageLanguage({ pathname: "/he/login/", search: "" }), "he");
  assert.equal(pageLanguage({ pathname: "/login/", search: "" }), "en");
  assert.equal(pageLanguage({ pathname: "/login/", search: "?lang=he" }), "en");
  assert.equal(
    pageLanguage({ pathname: "/dashboard/", search: "?lang=he" }),
    "he",
  );
});

test("shared login reads platform access without creating a Host profile", async () => {
  const previous = profileApi.defaults.adapter;
  const requests = [];
  profileApi.defaults.adapter = async (config) => {
    requests.push(config);
    return {
      status: 200,
      statusText: "OK",
      headers: {},
      config,
      data: profile(),
    };
  };
  try {
    await getPlatformProfile({ getIdToken: async () => "isolated-id-token" });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "get");
    assert.equal(requests[0].url, "/api/v1/platform/me");
    assert.equal(requests[0].data, undefined);
    assert.equal(
      requests[0].headers.get("Authorization"),
      "Bearer isolated-id-token",
    );
  } finally {
    profileApi.defaults.adapter = previous;
  }
});

test("a missing platform endpoint stays closed and never falls back to the old profile read", async () => {
  const previous = profileApi.defaults.adapter;
  const requests = [];
  profileApi.defaults.adapter = async (config) => {
    requests.push(`${config.method} ${config.url}`);
    throw new AxiosError("Missing", "ERR_BAD_REQUEST", config, null, {
      status: 404,
      data: { error: { code: "NOT_FOUND" } },
      config,
      headers: {},
    });
  };
  try {
    await assert.rejects(
      getPlatformProfile({ getIdToken: async () => "test-token" }),
      { status: 404 },
    );
    assert.deepEqual(requests, ["get /api/v1/platform/me"]);
  } finally {
    profileApi.defaults.adapter = previous;
  }
});

test("platform auth failures and outages never fall back to a different access endpoint", async () => {
  const previous = profileApi.defaults.adapter;
  try {
    for (const status of [401, 403, 503]) {
      let count = 0;
      profileApi.defaults.adapter = async (config) => {
        count++;
        throw new AxiosError("Denied", "ERR_BAD_REQUEST", config, null, {
          status,
          data: { error: { code: "DENIED" } },
          config,
          headers: {},
        });
      };
      await assert.rejects(
        getPlatformProfile({ getIdToken: async () => "test-token" }),
        { status },
      );
      assert.equal(count, 1);
    }
  } finally {
    profileApi.defaults.adapter = previous;
  }
});

test("admin transport refuses alternate origins and path traversal before disclosing the token", () => {
  const user = {
    getIdToken: () => {
      throw new Error("token accessed");
    },
  };
  for (const path of [
    "https://elsewhere.example/api/v1/admin/people",
    "/api/v1/admin/../people",
    "/api/v1/admin/organizations/%2e%2e",
    "/api/v1/admin/people#fragment",
    "/api/v1/admin/people\\other",
  ]) {
    assert.throws(() => adminRequest(user, path), /invalid-request/);
  }
});
