import test from "node:test";
import assert from "node:assert/strict";
import { createProfile, getProfile, approveEmail, changePortalAccess, deletePortalAccess, profileApi } from "../js/api/index.js";
import { parseIdentity, portalState, canApproveEmail } from "../js/host-dashboard-model.js";
const user = { uid: "user-1", email: "person@example.test", displayName: "Person", emailVerified: true };
const me = (role = "user", state = "active", enrolled = false, verified = false) => ({ user, role, access: { state }, mfa: { required: role === "admin", enrolled, verified } });
test("access requires an explicit backend state and verified identity", () => {
  assert.throws(() => parseIdentity({ user }), /portal-contract-incomplete/);
  assert.throws(() => parseIdentity({ ...me(), role: "platform_admin" }), /portal-contract-incomplete/);
  assert.throws(() => parseIdentity({ ...me(), mfa: {} }), /portal-contract-incomplete/);
  assert.equal(portalState(parseIdentity(me())), "approved");
  assert.equal(portalState(parseIdentity(me(null, "pending"))), "pending");
  assert.equal(portalState(parseIdentity(me(null, "denied"))), "denied");
  assert.equal(portalState(parseIdentity({ ...me(), user: { ...user, emailVerified: false } })), "denied");
});
test("admins require enrollment and verified MFA; regular users are not blocked", () => {
  assert.equal(portalState(me("admin")), "enrollment");
  assert.equal(portalState(me("admin", "active", true)), "verification");
  assert.equal(portalState(me("admin", "active", true, true)), "approved");
  assert.equal(portalState(me("admin", "denied", true, true)), "denied");
  assert.equal(portalState(me("user")), "approved");
  assert.equal(canApproveEmail(me("admin")), false);
  assert.equal(canApproveEmail(me("admin", "active", true)), false);
  assert.equal(canApproveEmail(me("admin", "active", true, true)), true);
  assert.equal(canApproveEmail(me("user", "active", true, true)), false);
  assert.equal(canApproveEmail(undefined), false);
});
async function withAdapter(run) {
  const previous = profileApi.defaults.adapter;
  const requests = [];
  profileApi.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: me(), status: 200, statusText: "OK", headers: {}, config };
  };
  try { await run(requests); } finally { profileApi.defaults.adapter = previous; }
}
test("GET profile sends only the Firebase ID token without cookies or caching", async () => {
  await withAdapter(async (requests) => {
    const result = await getProfile({ getIdToken: async () => "firebase-id-token" });
    assert.equal(result.role, "user");
    const request = requests[0];
    assert.equal(request.url, "/api/v1/users/me");
    assert.equal(request.method, "get");
    assert.equal(request.headers.get("Authorization"), "Bearer firebase-id-token");
    // Only CORS headers the Host allows (Authorization, Content-Type, Idempotency-Key).
    assert.equal(request.headers.get("Cache-Control"), undefined);
    assert.equal(request.withCredentials, false);
    assert.equal(request.data, undefined);
  });
});
test("profile synchronization keeps the empty PUT contract", async () => {
  await withAdapter(async (requests) => {
    assert.deepEqual(await createProfile({ getIdToken: async () => "profile-token" }), user);
    assert.equal(requests[0].method, "put");
    assert.equal(requests[0].data, "{}");
    assert.equal(requests[0].headers.get("Authorization"), "Bearer profile-token");
  });
});
test("approval sends the Host's exact { email, status } body and an idempotency key", async () => {
  await withAdapter(async (requests) => {
    await approveEmail({ getIdToken: async () => "admin-token" }, " PERSON@Example.test ", "approval-request-1");
    assert.equal(requests[0].url, "/api/v1/admin/portal-access");
    assert.equal(requests[0].method, "post");
    assert.equal(requests[0].data, '{"email":"person@example.test","status":"active"}');
    assert.equal(requests[0].headers.get("Idempotency-Key"), "approval-request-1");
    assert.equal(requests[0].headers.get("Authorization"), "Bearer admin-token");
  });
});
test("role changes and deletion use explicit contracts without deleting an Auth account", async () => {
  await withAdapter(async (requests) => {
    const identity = { getIdToken: async () => "admin-token" };
    await changePortalAccess(identity, {email:" ADMIN@Example.test ",status:"active",role:"admin"},"add-admin-request");
    await changePortalAccess(identity, {email:"admin@example.test",status:"blocked"},"block-admin-request");
    await deletePortalAccess(identity," ADMIN@Example.test ","delete-access-request");
    assert.deepEqual(JSON.parse(requests[0].data),{email:"admin@example.test",status:"active",role:"admin"});
    assert.deepEqual(JSON.parse(requests[1].data),{email:"admin@example.test",status:"blocked"});
    assert.equal(requests[2].method,"delete");
    assert.equal(requests[2].url,"/api/v1/admin/portal-access");
    assert.deepEqual(JSON.parse(requests[2].data),{email:"admin@example.test"});
    assert.equal(requests[2].headers.get("Idempotency-Key"),"delete-access-request");
  });
});
