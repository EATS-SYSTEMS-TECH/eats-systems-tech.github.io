import test from "node:test";
import assert from "node:assert/strict";
import { getPlatformProfile, profileApi } from "../js/api/index.js";
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
    loginDestination(profile(), "/dashboard/pay/transactions/1"),
    "/dashboard/",
  );
  assert.equal(
    loginDestination(profile(), "https://outside.example", "he"),
    "/dashboard/?lang=he",
  );
  assert.equal(loginPath("//outside.example", "he"), "/he/login/");
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
