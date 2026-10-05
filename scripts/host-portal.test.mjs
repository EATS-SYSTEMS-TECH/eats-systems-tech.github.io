import test from "node:test";
import assert from "node:assert/strict";
import { createProfile, getProfile, approveEmail, changePortalAccess, deletePortalAccess, profileApi, portalRequest } from "../js/api/index.js";
import { parseIdentity, portalState, canApproveEmail } from "../js/host-dashboard-model.js";
import { readHostPages } from "../js/host-pages.js";
const user = { uid: "user-1", email: "person@example.test", displayName: "Person", emailVerified: true };
const me = (role = "user", state = "active", enrolled = false, verified = false) => ({ user, role, access: { state }, mfa: { required: role === "admin", enrolled, verified } });
test("resource pagination traverses empty pages, deduplicates rows and stops on identity changes or cyclic cursors", async () => {
  const previous = profileApi.defaults.adapter;
  const identity = { getIdToken: async () => "test-token" };
  let calls = 0, active = true;
  profileApi.defaults.adapter = async config => {
    const pages = [{items: [],nextCursor:"first"},{items:[{id:"room-1"}],nextCursor:"second"},{items:[{id:"room-1"},{id:"room-2"}],nextCursor:null}];
    return { data: pages[calls++], status:200,statusText:"OK",headers:{},config };
  };
  try {
    assert.deepEqual((await readHostPages(identity,"/api/v1/organizations/org/rooms",()=>active)).items,[{id:"room-1"},{id:"room-2"}]);
    assert.equal(calls,3);
    profileApi.defaults.adapter = async config => { calls++; active=false; return {data:{items:[],nextCursor:"more"},status:200,statusText:"OK",headers:{},config}; };
    await assert.rejects(readHostPages(identity,"/api/v1/organizations/org/rooms",()=>active), /session-changed/);
    assert.equal(calls,4);
    active=true;
    profileApi.defaults.adapter = async config => ({data:{items:[],nextCursor:"cycle"},status:200,statusText:"OK",headers:{},config});
    await assert.rejects(readHostPages(identity,"/api/v1/organizations/org/rooms",()=>active), /repeated-cursor/);
  } finally { profileApi.defaults.adapter=previous; }
});
test("portal paths reject encoded traversal before reading the identity token", async () => {
  let reads = 0;
  const identity = { getIdToken: async () => { reads++; return "private-token"; } };
  await withAdapter(async requests => {
    for (const path of ["//foreign.test/api/v1/organizations", "/api/v1/organizations/../admin", "/api/v1/organizations/%2e%2e/admin", "/api/v1/organizations/%252e%252e/admin", "/api/v1/organizations/%2fadmin", "/api/v1/organizations\\..\\admin", "/api/v1/organizations/org#fragment", "/api/v1/organizations/org\n/admin", "/api/v1/organizations//admin"]) {
      assert.throws(() => portalRequest(identity, path), /invalid-request/);
    }
    assert.equal(reads, 0);
    assert.equal(requests.length, 0);
    await portalRequest(identity, "/api/v1/organizations/org-1/reservations?cursor=abc%2Fdef&search=Guest%20Name");
    assert.equal(reads, 1);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].headers.get("Authorization"), "Bearer private-token");
  });
});
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
