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

test("legacy dashboard entry uses only authenticated profile authority and creates a missing profile once", async () => {
  const previous = profileApi.defaults.adapter;
  const requests = [];
  let exists = false;
  const legacy = {
    user: { uid: "test-user", email: "user@example.test", emailVerified: true },
    role: "user",
    access: { state: "active" },
    mfa: { required: false, enrolled: false, verified: false },
  };
  profileApi.defaults.adapter = async (config) => {
    requests.push(`${config.method} ${config.url}`);
    assert.equal(config.headers.get("Authorization"), "Bearer test-token");
    if (
      config.url.endsWith("platform/me") ||
      (!exists && config.method === "get")
    ) {
      throw new AxiosError("Missing", "ERR_BAD_REQUEST", config, null, {
        status: 404,
        data: { error: { code: "NOT_FOUND" } },
        config,
        headers: {},
      });
    }
    exists = true;
    return { status: 200, data: legacy, config, headers: {} };
  };
  try {
    const user = { getIdToken: async () => "test-token" };
    assert.equal(
      (await getPlatformProfile(user)).products.host.state,
      "active",
    );
    assert.deepEqual(requests, [
      "get /api/v1/platform/me",
      "get /api/v1/users/me",
      "put /api/v1/users/me",
      "get /api/v1/users/me",
    ]);
    legacy.role = null;
    assert.equal(
      (await getPlatformProfile(user)).products.host.state,
      "blocked",
    );
    legacy.role = "admin";
    assert.equal(
      (await getPlatformProfile(user)).products.host.state,
      "mfa-required",
    );
    legacy.mfa.enrolled = legacy.mfa.verified = true;
    const result = await getPlatformProfile(user);
    assert.equal(result.products.host.state, "active");
    assert.equal(result.products.pay.state, "unavailable");
    legacy.access.state = "pending";
    assert.equal(
      (await getPlatformProfile(user)).products.host.state,
      "pending",
    );
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
