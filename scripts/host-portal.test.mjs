import test from "node:test";
import assert from "node:assert/strict";
import { hostGet } from "../js/host-api.js";
import { parseIdentity, records } from "../js/host-dashboard-model.js";

test("portal identity accepts only specified roles and active memberships", () => {
  assert.equal(parseIdentity({ role: "other", memberships: [] }), null);
  assert.deepEqual(parseIdentity({ role: "client_member", memberships: [
    { clientId: "one", status: "active" }, { clientId: "two", status: "suspended" }
  ] }), { role: "client_member", memberships: [{ clientId: "one", status: "active" }] });
  assert.deepEqual(records({ keys: [{ label: "A" }] }, ["keys"]), [{ label: "A" }]);
});

test("management requests use a Firebase ID token and never cache responses", async () => {
  const originalFetch = globalThis.fetch;
  let request;
  globalThis.fetch = async (url, options) => {
    request = { url: String(url), ...options };
    return { ok: true, json: async () => ({ role: "platform_admin", memberships: [] }) };
  };
  try {
    const result = await hostGet({ getIdToken: async () => "test-id-token" }, "/v1/me");
    assert.equal(result.role, "platform_admin");
    assert.equal(new URL(request.url).pathname, "/v1/me");
    assert.equal(request.headers.Authorization, "Bearer test-id-token");
    assert.equal(request.cache, "no-store");
    assert.equal(request.credentials, "omit");
    await assert.rejects(hostGet({ getIdToken: async () => "x" }, "https://evil.example/v1/me"));
  } finally { globalThis.fetch = originalFetch; }
});
