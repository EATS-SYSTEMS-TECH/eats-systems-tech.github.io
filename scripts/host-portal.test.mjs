import test from "node:test";
import assert from "node:assert/strict";
import { hostGet } from "../js/host-api.js";
import { createProfile, hostApi, profileApi } from "../js/api/index.js";
import { parseIdentity, records } from "../js/host-dashboard-model.js";

test("portal identity accepts only specified roles and active memberships", () => {
  assert.equal(parseIdentity({ role: "other", memberships: [] }), null);
  assert.deepEqual(parseIdentity({ role: "client_member", memberships: [
    { clientId: "one", status: "active" }, { clientId: "two", status: "suspended" }
  ] }), { role: "client_member", memberships: [{ clientId: "one", status: "active" }] });
  assert.deepEqual(records({ keys: [{ label: "A" }] }, ["keys"]), [{ label: "A" }]);
});

test("management requests use a Firebase ID token and never cache responses", async () => {
  const originalAdapter = hostApi.defaults.adapter;
  let request;
  hostApi.defaults.adapter = async (config) => {
    request = config;
    return { data: { role: "platform_admin", memberships: [] }, status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    const result = await hostGet({ getIdToken: async () => "test-id-token" }, "/v1/me");
    assert.equal(result.role, "platform_admin");
    assert.equal(request.url, "/v1/me");
    assert.equal(request.headers.get("Authorization"), "Bearer test-id-token");
    assert.equal(request.headers.get("Cache-Control"), "no-store");
    assert.equal(request.withCredentials, false);
    assert.throws(() => hostGet({ getIdToken: async () => "x" }, "https://evil.example/v1/me"));
  } finally { hostApi.defaults.adapter = originalAdapter; }
});

test("createProfile sends an empty JSON PUT with the Firebase ID token", async () => {
  const originalAdapter = profileApi.defaults.adapter;
  let request;
  profileApi.defaults.adapter = async (config) => {
    request = config;
    return { data: { user: { uid: "user-1" } }, status: 200, statusText: "OK", headers: {}, config };
  };
  try {
    const profile = await createProfile({ getIdToken: async () => "profile-token" });
    assert.deepEqual(profile, { uid: "user-1" });
    assert.equal(request.method, "put");
    assert.equal(request.url, "/api/v1/users/me");
    assert.equal(request.headers.get("Authorization"), "Bearer profile-token");
    assert.equal(request.headers.get("Content-Type"), "application/json");
    assert.equal(request.data, "{}");
  } finally { profileApi.defaults.adapter = originalAdapter; }
});
