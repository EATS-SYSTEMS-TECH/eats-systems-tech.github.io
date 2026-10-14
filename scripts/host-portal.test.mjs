import { AxiosError } from "axios";
import { authErrorMessage } from "../js/host-auth-errors.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createProfile, getProfile, approveEmail, changePortalAccess, deletePortalAccess, profileApi, portalRequest, portalExport, pendingMembershipInvitations, acceptMembershipInvitation } from "../js/api/index.js";
import { portalState, hostIdentity, sameHostAccess } from "../js/host-dashboard-model.js";
import { allowedWorkspaceViews, allowedSettingsTabs, homeView, workspaceLocation, workspaceView, settingsTabFor } from "../js/host-workspace-model.js";
import { readHostPages } from "../js/host-pages.js";
const user = { uid: "user-1", email: "person@example.test", displayName: "Person", emailVerified: true };
const me = (role = "user", state = "active", enrolled = false, verified = false) => ({ user, role, access: { state }, mfa: { required: role === "admin", enrolled, verified } });
test("resource pagination traverses empty pages, deduplicates rows and stops on identity changes or cyclic cursors", async () => {
  const previous = profileApi.defaults.adapter;
  const identity = { getIdToken: async () => "test-token" };
  let calls = 0, active = true;
  profileApi.defaults.adapter = async config => {
    const pages = [{items: [],nextCursor:"first"},{items:[{id:"system-1"}],nextCursor:"second"},{items:[{id:"system-1"},{id:"system-2"}],nextCursor:null}];
    return { data: pages[calls++], status:200,statusText:"OK",headers:{},config };
  };
  try {
    assert.deepEqual((await readHostPages(identity,"/api/v1/organizations/org/systems",()=>active)).items,[{id:"system-1"},{id:"system-2"}]);
    assert.equal(calls,3);
    profileApi.defaults.adapter = async config => { calls++; active=false; return {data:{items:[],nextCursor:"more"},status:200,statusText:"OK",headers:{},config}; };
    await assert.rejects(readHostPages(identity,"/api/v1/organizations/org/systems",()=>active), /session-changed/);
    assert.equal(calls,4);
    active=true;
    profileApi.defaults.adapter = async config => ({data:{items:[],nextCursor:"cycle"},status:200,statusText:"OK",headers:{},config});
    await assert.rejects(readHostPages(identity,"/api/v1/organizations/org/systems",()=>active), /repeated-cursor/);
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
test("portal paths allow the signed-in person's own routes under /api/v1/me/ and nothing beside them", async () => {
  let reads = 0;
  const identity = { getIdToken: async () => { reads++; return "private-token"; } };
  await withAdapter(async requests => {
    for (const path of ["/api/v1/me", "/api/v1/me/", "/api/v1/me/../admin", "/api/v1/me/%2e%2e/admin", "/api/v1/meta/systems", "/api/v1/me//systems", "/api/v1/me/systems#x", "/api/v1/users/me", "/api/v1/admin/people"]) {
      assert.throws(() => portalRequest(identity, path), /invalid-request/, path);
    }
    assert.equal(reads, 0);
    await portalRequest(identity, "/api/v1/me/systems?limit=50&cursor=abc");
    await portalRequest(identity, "/api/v1/me/systems/system-1/link", "POST", { version: 1, organizationId: "org-1" }, "link-request-1");
    assert.deepEqual(requests.map(request => request.url), ["/api/v1/me/systems?limit=50&cursor=abc", "/api/v1/me/systems/system-1/link"]);
    assert.equal(requests[1].headers.get("Idempotency-Key"), "link-request-1");
  });
});
test("HOST_PLAN_REQUIRED refuses one action locally and never ends the session", async () => {
  const previous = profileApi.defaults.adapter;
  const previousWindow = globalThis.window;
  const events = [];
  globalThis.window = new EventTarget();
  window.addEventListener("platform:access-error", event => events.push(event.detail));
  const deny = code => async config => { throw new AxiosError("denied", "ERR_BAD_REQUEST", config, {}, { status: 403, data: { error: { code } }, headers: {}, statusText: "Forbidden", config }); };
  try {
    profileApi.defaults.adapter = deny("HOST_PLAN_REQUIRED");
    await assert.rejects(portalRequest({ getIdToken: async () => "token" }, "/api/v1/me/systems"), error => error.status === 403 && error.code === "HOST_PLAN_REQUIRED");
    assert.deepEqual(events, []);
    profileApi.defaults.adapter = deny("PORTAL_ACCESS_DENIED");
    await assert.rejects(portalRequest({ getIdToken: async () => "token" }, "/api/v1/me/systems"), error => error.code === "PORTAL_ACCESS_DENIED");
    assert.deepEqual(events.map(detail => detail.code), ["PORTAL_ACCESS_DENIED"]);
  } finally {
    profileApi.defaults.adapter = previous;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
});
test("a refusal keeps its details, and an organization refused on My systems ends nothing", async () => {
  const previous = profileApi.defaults.adapter;
  const previousWindow = globalThis.window;
  const events = [];
  globalThis.window = new EventTarget();
  window.addEventListener("platform:access-error", event => events.push(event.detail.code));
  const refuse = (status, error) => async config => { throw new AxiosError("refused", "ERR_BAD_REQUEST", config, {}, { status, data: { error }, headers: {}, statusText: "Refused", config }); };
  const identity = { getIdToken: async () => "token" };
  try {
    profileApi.defaults.adapter = refuse(409, { code: "SYSTEM_HAS_BOOKINGS", message: "Bookings", details: { count: 3 } });
    await assert.rejects(portalRequest(identity, "/api/v1/me/systems/s-1/unlink", "POST", { version: 2 }, "unlink-intent-0001"), error => error.status === 409 && error.code === "SYSTEM_HAS_BOOKINGS" && error.details.count === 3);
    profileApi.defaults.adapter = refuse(409, { code: "SYSTEM_HAS_BOOKINGS", details: ["not", "an", "object"] });
    await assert.rejects(portalRequest(identity, "/api/v1/organizations/org/systems/s-1/remove", "POST", { version: 2 }, "remove-intent-0001"), error => error.details === undefined);
    profileApi.defaults.adapter = refuse(403, { code: "TENANT_ACCESS_DENIED" });
    await assert.rejects(portalRequest(identity, "/api/v1/me/systems/s-1/link", "POST", { version: 2, organizationId: "org" }, "link-intent-00001"), error => error.code === "TENANT_ACCESS_DENIED");
    assert.deepEqual(events, [], "a link refused by its organization stays local");
    profileApi.defaults.adapter = refuse(403, { code: "TOTP_REQUIRED" });
    await assert.rejects(portalRequest(identity, "/api/v1/me/systems/s-1/link", "POST", { version: 2, organizationId: "org" }, "link-intent-00002"), error => error.code === "TOTP_REQUIRED");
    assert.deepEqual(events, [], "an authenticator to verify first stays local on My systems");
    profileApi.defaults.adapter = refuse(403, { code: "TENANT_ACCESS_DENIED" });
    await assert.rejects(portalRequest(identity, "/api/v1/organizations/org/systems"), error => error.code === "TENANT_ACCESS_DENIED");
    assert.deepEqual(events, ["TENANT_ACCESS_DENIED"], "an organization route still follows the access rules");
  } finally {
    profileApi.defaults.adapter = previous;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
});
test("an organization whose service is paused refuses one change and ends nothing", async () => {
  const previous = profileApi.defaults.adapter;
  const previousWindow = globalThis.window;
  const events = [];
  globalThis.window = new EventTarget();
  window.addEventListener("platform:access-error", event => events.push(event.detail.code));
  profileApi.defaults.adapter = async config => { throw new AxiosError("refused", "ERR_BAD_REQUEST", config, {}, { status: 403, data: { error: { code: "SUBSCRIPTION_UNAVAILABLE" } }, headers: {}, statusText: "Forbidden", config }); };
  const identity = { getIdToken: async () => "token" };
  try {
    await assert.rejects(portalRequest(identity, "/api/v1/me/systems/s-1/link", "POST", { version: 2, organizationId: "lapsed" }, "link-intent-00003"), error => error.status === 403 && error.code === "SUBSCRIPTION_UNAVAILABLE");
    await assert.rejects(portalRequest(identity, "/api/v1/organizations/lapsed/systems/s-1/remove", "POST", { version: 2 }, "remove-intent-0002"), error => error.code === "SUBSCRIPTION_UNAVAILABLE");
    await assert.rejects(portalRequest(identity, "/api/v1/organizations/lapsed/systems/s-1", "PUT", { version: 2, iconId: "home" }, "icon-intent-00001"), error => error.code === "SUBSCRIPTION_UNAVAILABLE");
    assert.deepEqual(events, [], "a paused organization never ends the session");
  } finally {
    profileApi.defaults.adapter = previous;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
});
test("a refused request to join stays in the join view; only a Host ban ends the session", async () => {
  const previous = profileApi.defaults.adapter;
  const previousWindow = globalThis.window;
  const events = [];
  globalThis.window = new EventTarget();
  window.addEventListener("platform:access-error", event => events.push(event.detail));
  const refuse = code => async config => { throw new AxiosError("refused", "ERR_BAD_REQUEST", config, {}, { status: 403, data: { error: { code } }, headers: {}, statusText: "Forbidden", config }); };
  const identity = { getIdToken: async () => "token" };
  try {
    // The owner who asked them to join lost the role, left, or has no
    // authenticator: the join view says so instead of ending Host.
    for (const code of ["INVITER_ACCESS_DENIED", "TENANT_ACCESS_DENIED", "TOTP_REQUIRED", "RECENT_TOTP_REQUIRED"]) {
      profileApi.defaults.adapter = refuse(code);
      await assert.rejects(acceptMembershipInvitation(identity, "invite-1", 1, `join-intent-${code}`), error => error.status === 403 && error.code === code);
    }
    assert.deepEqual(events, [], "a refusal to join never ends the session");
    profileApi.defaults.adapter = refuse("PORTAL_ACCESS_DENIED");
    await assert.rejects(acceptMembershipInvitation(identity, "invite-1", 1, "join-intent-blocked"), error => error.code === "PORTAL_ACCESS_DENIED");
    assert.deepEqual(events.map(detail => detail.code), ["PORTAL_ACCESS_DENIED"], "a Host ban still ends it");
    assert.equal(events[0].scope, undefined);
    // Only the acceptance itself is local: the list of requests to join still
    // follows the access rules.
    profileApi.defaults.adapter = refuse("TENANT_ACCESS_DENIED");
    await assert.rejects(pendingMembershipInvitations(identity, {}), error => error.code === "TENANT_ACCESS_DENIED");
    assert.deepEqual(events.map(detail => detail.code), ["PORTAL_ACCESS_DENIED", "TENANT_ACCESS_DENIED"]);
  } finally {
    profileApi.defaults.adapter = previous;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
});
test("an owner-only refusal to an admin refuses one action and keeps the organization", async () => {
  const previous = profileApi.defaults.adapter;
  const previousWindow = globalThis.window;
  const events = [];
  globalThis.window = new EventTarget();
  window.addEventListener("platform:access-error", event => events.push(event.detail.code));
  const refuse = code => async config => { throw new AxiosError("refused", "ERR_BAD_REQUEST", config, {}, { status: 403, data: { error: { code } }, headers: {}, statusText: "Forbidden", config }); };
  const identity = { getIdToken: async () => "token" };
  try {
    profileApi.defaults.adapter = refuse("OWNER_REQUIRED");
    for (const [path, body] of [["/api/v1/organizations/org/api-keys", { name: "Engine" }], ["/api/v1/organizations/org/api-keys/key-1/rotate", { version: 1 }], ["/api/v1/organizations/org/api-keys/key-1/revoke", { version: 1 }], ["/api/v1/organizations/org/api-keys/key-1/reveal", {}]])
      await assert.rejects(portalRequest(identity, path, "POST", body, "owner-only-intent-1"), error => error.status === 403 && error.code === "OWNER_REQUIRED");
    profileApi.defaults.adapter = refuse("SLO_OWNER_UNAVAILABLE");
    await assert.rejects(portalRequest(identity, "/api/v1/organizations/org/operations/slo-policy", "PUT", { enabled: true, responsibleUid: "someone" }, "slo-intent-000001"), error => error.code === "SLO_OWNER_UNAVAILABLE");
    assert.deepEqual(events, [], "the admin stays in the organization");
    profileApi.defaults.adapter = refuse("TENANT_ACCESS_DENIED");
    await assert.rejects(portalRequest(identity, "/api/v1/organizations/org/api-keys", "POST", { name: "Engine" }, "owner-only-intent-2"), error => error.code === "TENANT_ACCESS_DENIED");
    assert.deepEqual(events, ["TENANT_ACCESS_DENIED"], "lost access to the organization still ends it");
    const { hostHebrew } = await import("../js/host-locale-he.js");
    const { readFile } = await import("node:fs/promises");
    const keys = await readFile(new URL("../js/host-api-keys.js", import.meta.url), "utf8");
    assert.match(keys, /OWNER_REQUIRED: hostText\("Only the organization owner can manage API keys\."\)/, "create, rotate, revoke and reveal are all the owner's");
    assert.equal(hostHebrew["Only the organization owner can manage API keys."], "רק הבעלים של הארגון יכולים לנהל מפתחות API.");
    assert.equal(hostHebrew["Only an organization owner can reveal a key."], undefined);
    const health = await readFile(new URL("../js/host-service-health.js", import.meta.url), "utf8");
    assert.match(health, /SLO_OWNER_UNAVAILABLE: hostText\(/, "the targets form says why the responsible member was refused");
  } finally {
    profileApi.defaults.adapter = previous;
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  }
});
test("access requires an explicit backend state and verified identity", () => {
  assert.equal(portalState(me()), "approved");
  assert.equal(portalState(me(null, "pending")), "pending");
  assert.equal(portalState(me(null, "denied")), "denied");
  assert.equal(portalState({ ...me(), user: { ...user, emailVerified: false } }), "denied");
  assert.equal(portalState({ ...me(), role: "platform_admin" }), "denied");
});
test("the dashboard has no users/me identity parser: access comes from platform/me only", async () => {
  const model = await import("../js/host-dashboard-model.js");
  assert.equal("parseIdentity" in model, false);
});
test("Hebrew keeps הזמנות for bookings: joining an organization and guest links never use it", async () => {
  const { hostHebrew } = await import("../js/host-locale-he.js");
  for (const key of [
    "Join an organization",
    "Join an organization ({p0} waiting)",
    "Organizations waiting for you",
    "Organizations that asked your verified email to join appear here. Owner and admin roles ask for your authenticator.",
    "Open until {p0}",
    "Join",
    "Join {p0}",
    "Set up your authenticator, then come back to join.",
    "No organization is waiting for you to join.",
    "Verify your authenticator before joining with a management role.",
    "Sign in again with your authenticator, then retry.",
    "This request to join has expired. Ask the owner to send a new one.",
    "You already belong to this organization.",
    "The owner who asked you to join is no longer active. Ask an active owner to send a new request.",
    "This request to join changed. Choose Check again, then retry.",
    "Joining didn't work. Choose Check again, then retry.",
    "Invitation API",
    "WIFIGATE checks every hour that guest links and messages go out on time. To be sure a gate opens, open it from the WIFIGATE app.",
    "Some guest links or messages were late or failed. Details for your developer are below.",
    "Invitation pending · open until {p0}",
    "Cancel team invitation",
  ]) {
    assert.ok(hostHebrew[key], key);
    assert.doesNotMatch(hostHebrew[key], /הזמנ/, key);
  }
  assert.equal(hostHebrew["Invitation API"], "API לקישורים לאורחים");
});
test("admins require enrollment and verified MFA; regular users are not blocked", () => {
  assert.equal(portalState(me("admin")), "enrollment");
  assert.equal(portalState(me("admin", "active", true)), "verification");
  assert.equal(portalState(me("admin", "active", true, true)), "approved");
  assert.equal(portalState(me("admin", "denied", true, true)), "denied");
  assert.equal(portalState(me("user")), "approved");
});
test("an organization member without a Host plan (role null) is approved, never denied", () => {
  assert.equal(portalState(me(null)), "approved");
  assert.equal(portalState(me(null, "pending")), "pending");
  const platform = (host, mfa = { enrolled: false, verified: false }) => ({ user, mfa, products: { host, pay: { state: "no-plan" }, manager: { state: "no-plan" } } });
  const member = hostIdentity(platform({ state: "active", role: null, organizations: 1 }));
  assert.deepEqual([member.role, member.hasPlan, member.access.state, portalState(member)], [null, false, "active", "approved"]);
  const holder = hostIdentity(platform({ state: "active", role: "user", organizations: 0 }));
  assert.deepEqual([holder.role, holder.hasPlan, portalState(holder)], ["user", true, "approved"]);
  const operator = hostIdentity(platform({ state: "active", role: "admin" }, { enrolled: true, verified: true }));
  assert.deepEqual([operator.mfa.required, portalState(operator)], [true, "approved"]);
  assert.equal(portalState(hostIdentity(platform({ state: "pending" }))), "pending");
  for (const state of ["no-plan", "blocked", "mfa-required", "unavailable"])
    assert.equal(portalState(hostIdentity(platform({ state, role: "user" }))), "denied", state);
  assert.equal(sameHostAccess(member, hostIdentity(platform({ state: "active", role: null, organizations: 2 }))), true);
  assert.equal(sameHostAccess(member, holder), false);
});
test("Host views follow the Host plan and workspace.permissions, never role names", () => {
  const ids = options => allowedWorkspaceViews(options).map(view => view.id);
  const owner = ["read", "organization:write", "members:write", "systems:write", "reservations:write", "invitations:write", "billing:write", "integrations:write", "operations:write"];
  assert.deepEqual(ids({ plan: true, permissions: owner }), ["my-systems", "systems", "calendar", "bookings", "activity", "connect", "settings", "invitations"]);
  assert.deepEqual(ids({ plan: false, permissions: ["read", "reservations:write", "invitations:write", "operations:write"] }), ["systems", "calendar", "bookings", "activity", "settings", "invitations"]);
  assert.deepEqual(ids({ plan: false, permissions: ["read"] }), ["systems", "calendar", "bookings", "settings", "invitations"]);
  assert.deepEqual(ids({ plan: true }), ["my-systems", "settings", "invitations"]);
  assert.deepEqual(ids({ plan: false }), ["systems", "settings", "invitations"]);
  assert.deepEqual(ids({ pending: true, plan: true, permissions: owner }), ["invitations"]);
  assert.deepEqual(ids({ plan: false, permissions: ["owner", "admin"] }), ["settings", "invitations"], "role names grant nothing");
  assert.equal(homeView({ plan: true }), "my-systems");
  assert.equal(homeView({ plan: false }), "systems");
  assert.equal(homeView({ pending: true }), "invitations");
  const tabs = options => allowedSettingsTabs(options).map(tab => tab.id);
  assert.deepEqual(tabs({ permissions: owner }), ["organization", "team", "billing", "support", "account"]);
  assert.deepEqual(tabs({ permissions: ["read", "systems:write"] }), ["organization", "account"]);
  assert.deepEqual(tabs({ platformAdmin: true }), ["support", "account"]);
});
test("old view ids and labels stay working deep links", () => {
  const at = (query, home = "my-systems", path = "/dashboard/host/") => workspaceLocation(new URL("https://wifigate.io" + path + query), home);
  assert.equal(at(""), "my-systems");
  assert.equal(at("", "systems"), "systems");
  assert.equal(at("?view=reservations"), "bookings");
  assert.equal(at("?view=operations"), "activity");
  for (const old of ["integrations", "automation", "api-keys", "api-integrations"]) assert.equal(at("?view=" + old), "connect", old);
  for (const [old, tab] of [["team", "team"], ["billing", "billing"], ["invoices", "billing"], ["support", "support"], ["organization", "organization"], ["account", "account"]]) {
    assert.equal(at("?view=" + old), "settings", old);
    assert.equal(settingsTabFor(old), tab);
  }
  assert.equal(at("?view=properties"), "systems");
  assert.equal(at("?view=unknown"), "my-systems");
  assert.equal(at("", "systems", "/dashboard/host/overview/"), "overview");
  assert.equal(workspaceView("Team invitations").id, "invitations");
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

test("CSV exports use fresh authenticated GET text requests and reject non-export paths before reading tokens", async () => {
  const previous=profileApi.defaults.adapter; let reads=0;
  const user={getIdToken:async()=>{reads++; return "fresh-export-token";}};
  profileApi.defaults.adapter=async config=>{ assert.equal(config.responseType,"text"); assert.equal(config.method,"get"); assert.equal(config.headers.get("Authorization"),"Bearer fresh-export-token"); assert.equal(config.headers.get("Accept"),"text/csv"); assert.equal(config.withCredentials,false); return {data:'"date","total"\r\n"2026-10-05","1"\r\n',status:200,statusText:"OK",headers:{},config}; };
  try {
    for (const path of ["//foreign.test/api/v1/organizations/a/operations/usage/export","/api/v1/organizations/a/operations/usage","/api/v1/organizations/a/operations/../usage/export","/api/v1/organizations/a/operations/usage/export#fragment"]) assert.throws(()=>portalExport(user,path),/invalid-request/);
    assert.equal(reads,0);
    assert.equal(await portalExport(user,"/api/v1/organizations/a/operations/usage/export?from=2026-10-05&to=2026-10-05"),'"date","total"\r\n"2026-10-05","1"\r\n'); assert.equal(reads,1);
  } finally {profileApi.defaults.adapter=previous;}
});

test("membership invitations validate before token reads and accept only the current recipient with a version", async () => {
  let reads = 0;
  const identity = { getIdToken: async () => { reads++; return `recipient-token-${reads}`; } };
  await withAdapter(async requests => {
    for (const limit of [0, 101, 1.5, NaN]) assert.throws(() => pendingMembershipInvitations(identity, { limit }), /invalid-request/);
    for (const id of ["../other", "%2fother", "a?uid=other", "a#fragment", ""]) {
      assert.throws(() => pendingMembershipInvitations(identity, { cursor: id }), /invalid-request/);
      assert.throws(() => acceptMembershipInvitation(identity, id, 1, "invitation-request-1"), /invalid-request/);
    }
    assert.throws(() => acceptMembershipInvitation(identity, "invite-1", 0, "invitation-request-1"), /invalid-request/);
    assert.throws(() => acceptMembershipInvitation(identity, "invite-1", 1, "short"), /invalid-request/);
    assert.equal(reads, 0); assert.equal(requests.length, 0);
    await pendingMembershipInvitations(identity, { limit: 1, cursor: "invite-1" });
    await acceptMembershipInvitation(identity, "invite-1", 2, "invitation-request-1");
    assert.equal(requests[0].url, "/api/v1/auth/invitations?limit=1&cursor=invite-1");
    assert.equal(requests[0].method, "get"); assert.equal(requests[0].data, undefined);
    assert.equal(requests[0].headers.get("Authorization"), "Bearer recipient-token-1");
    assert.equal(requests[1].url, "/api/v1/auth/invitations/invite-1/accept");
    assert.equal(requests[1].method, "post"); assert.deepEqual(JSON.parse(requests[1].data), { version: 2 });
    assert.equal(requests[1].headers.get("Idempotency-Key"), "invitation-request-1");
    assert.equal(requests[1].headers.get("Authorization"), "Bearer recipient-token-2");
    for (const request of requests) assert.equal(request.withCredentials, false);
  });
});

test("Host transport failures explain server unavailability without hiding authorization failures or exposing request details", async () => {
  const previous = profileApi.defaults.adapter;
  try {
    for (const code of ["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT"]) {
      profileApi.defaults.adapter = async config => { throw new AxiosError("private transport details", code, config); };
      await assert.rejects(createProfile({ getIdToken: async () => "private-token" }), error => {
        assert.equal(error.code, "HOST_API_UNAVAILABLE"); assert.equal(error.status, undefined);
        assert.equal(authErrorMessage(error), "Cannot reach the WIFIGATE Host server. Please try again later or contact support.");
        assert(!authErrorMessage(error).includes("private")); return true;
      });
    }
    profileApi.defaults.adapter = async config => { throw new AxiosError("denied", "ERR_BAD_REQUEST", config, {}, { status: 403, data: { error: { code: "PORTAL_ACCESS_DENIED", message: "Access denied" } }, headers: {}, statusText: "Forbidden", config }); };
    await assert.rejects(createProfile({ getIdToken: async () => "token" }), error => {
      assert.equal(error.status, 403); assert.equal(error.code, "PORTAL_ACCESS_DENIED");
      assert.equal(authErrorMessage(error), "Access was not permitted. Contact your admin."); return true;
    });
    assert.equal(authErrorMessage({code:"auth/network-request-failed"}), "Unable to connect. Check your connection.");
    assert.equal(authErrorMessage({code:"unknown"}), "Something went wrong. Please try again.");
  } finally { profileApi.defaults.adapter = previous; }
});

import { calendarSpans } from "../js/host-calendar-layout.js";
const calendarDate = (instant, timezone) => new Intl.DateTimeFormat("en-CA", {timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(instant));
test("calendar cards clip to the visible range and keep midnight expiry exclusive", () => {
  const result = calendarSpans([{id:"before",startsAt:"2026-01-01T00:00:00Z",endsAt:"2026-01-09T00:00:00Z"},{id:"after",startsAt:"2026-01-20T00:00:00Z",endsAt:"2026-02-01T00:00:00Z"},{id:"outside",startsAt:"2026-02-01T00:00:00Z",endsAt:"2026-02-02T00:00:00Z"}],"2026-01-08",14,calendarDate,"UTC");
  assert.deepEqual(result.spans.map(({record,start,end})=>[record.id,start,end]),[["before",0,1],["after",12,14]]);
});
test("same-day turnovers and overlapping cancelled stays remain separately accessible", () => {
  const records=[{id:"b",startsAt:"2026-01-08T12:00:00Z",endsAt:"2026-01-09T00:00:00Z"},{id:"a",startsAt:"2026-01-08T00:00:00Z",endsAt:"2026-01-08T11:00:00Z"}];
  assert.equal(calendarSpans(records,"2026-01-08",21,calendarDate,"UTC").lanes,2);
  assert.deepEqual(calendarSpans(records,"2026-01-08",21,calendarDate,"UTC").spans.map(x=>x.record.id),["a","b"]);
  assert.deepEqual(calendarSpans([],"2026-01-08",21,calendarDate,"UTC"),{spans:[],lanes:1});
});
test("calendar spans follow local dates across DST instead of fixed 24-hour days", () => {
  const {spans}=calendarSpans([{id:"dst",startsAt:"2026-03-28T23:00:00Z",endsAt:"2026-03-29T22:00:00Z"}],"2026-03-29",7,calendarDate,"Europe/Berlin");
  assert.equal(spans[0].start,0); assert.equal(spans[0].end,1);
});

// Bookings without properties or rooms: one system per booking, the
// organization's time zone, and older bookings that still show.
import { readReservation, systemLabel, zonedInstant, zoneOf, statusLabel, dayStart, dateAt } from "../js/host-booking-model.js";
import { toE164, phoneSearch } from "../js/host-phone.js";
import { guestLinkQr } from "../js/host-link-card.js";
import { changeBody, guestBody } from "../js/host-booking-sheet.js";
test("a guest phone written the local way becomes E.164; a number with + or 00 keeps its own country", () => {
  assert.equal(toE164("IL", "050-123-4567"), "+972501234567");
  assert.equal(toE164("IL", "(050) 123 4567"), "+972501234567");
  assert.equal(toE164("US", "+44 7700 900212"), "+447700900212");
  assert.equal(toE164("IL", "0044 7700 900212"), "+447700900212");
  assert.equal(toE164("GB", "07700 900212"), "+447700900212");
  for (const value of ["", "abc", "12", "+0 123 456 789"]) assert.equal(toE164("IL", value), null, value);
});
test("a number typed with its country code but without + or 00 is not given the code twice", () => {
  assert.equal(toE164("IL", "972501234567"), "+972501234567");
  assert.equal(toE164("IL", "972 50-123-4567"), "+972501234567");
  assert.equal(toE164("IL", "97221234567"), "+97221234567");
  assert.equal(toE164("US", "15551234567"), "+15551234567");
  assert.equal(toE164("US", "1 555 123 4567"), "+15551234567");
  assert.equal(toE164("US", "(555) 123-4567"), "+15551234567");
  assert.equal(toE164("GB", "447911123456"), "+447911123456");
  assert.equal(toE164("GB", "07911 123456"), "+447911123456");
  // Italy keeps its leading 0 after the country code.
  assert.equal(toE164("IT", "06 1234 5678"), "+390612345678");
  assert.equal(toE164("IT", "390612345678"), "+390612345678");
  assert.equal(toE164("IT", "393 123 4567"), "+393931234567", "an Italian mobile that starts with 39");
  // Trunk prefixes other than 0.
  assert.equal(toE164("RU", "8 912 345-67-89"), "+79123456789");
  assert.equal(toE164("RU", "79123456789"), "+79123456789");
  assert.equal(toE164("HU", "06 1 234 5678"), "+3612345678");
});
test("a phone search reaches the stored E.164 number however the number is written", () => {
  for (const typed of ["050-123-4567", "0501234567", "(050) 123 4567"])
    assert.equal(phoneSearch("IL", typed), "501234567", typed);
  for (const typed of ["+972 50 123 4567", "00972501234567", "972501234567"])
    assert.ok("+972501234567".includes(phoneSearch("IL", typed)), typed);
  assert.equal(phoneSearch("IL", "07700 900212"), "7700900212", "a foreign number written the local way");
  assert.equal(phoneSearch("US", "(555) 123-4567"), "5551234567");
  for (const typed of ["Dana", "AB-123", "dana@example.test"]) assert.equal(phoneSearch("IL", typed), typed);
  assert.equal(phoneSearch("IL", "4567"), "4567");
});
test("a day starts at its first minute, even where the clocks skip midnight", () => {
  for (const [zone, date, instant] of [
    ["America/Santiago", "2026-09-06", "2026-09-06T04:00:00.000Z"],
    ["Africa/Cairo", "2026-04-24", "2026-04-23T22:00:00.000Z"],
    ["Asia/Beirut", "2026-03-29", "2026-03-28T22:00:00.000Z"],
    ["Asia/Jerusalem", "2026-10-14", "2026-10-13T21:00:00.000Z"],
    ["Europe/Berlin", "2026-03-29", "2026-03-28T23:00:00.000Z"],
    ["UTC", "2026-10-14", "2026-10-14T00:00:00.000Z"],
  ]) {
    const start = dayStart(date, zone);
    assert.equal(start, instant, `${zone} ${date}`);
    assert.equal(dateAt(start, zone), date);
    assert.ok(dateAt(Date.parse(start) - 60000, zone) < date);
  }
});
test("a guest link too long for a QR code has none; a long one that fits has one", () => {
  assert.equal(guestLinkQr(`https://wifigate.io/wifigate-api/?ep=v1.${"A".repeat(3500)}`), null);
  assert.match(guestLinkQr(`https://wifigate.io/wifigate-api/?ep=v1.${"A".repeat(2500)}`), /^data:image\/gif;base64,/);
});
test("day boundaries follow the organization's time zone, across a clock change too", () => {
  assert.equal(zonedInstant("2026-10-14T00:00", "Asia/Jerusalem"), "2026-10-13T21:00:00.000Z");
  assert.equal(zonedInstant("2026-03-29T00:00", "Europe/Berlin"), "2026-03-28T23:00:00.000Z");
  assert.equal(zonedInstant("2026-03-30T00:00", "Europe/Berlin"), "2026-03-29T22:00:00.000Z");
  assert.equal(zoneOf({ timezone: "Not/AZone" }), "UTC");
  assert.equal(zoneOf({}), "UTC");
});
test("an older booking without a system shows with — and is never changed blindly", () => {
  const old = readReservation({ id: "old", propertyId: "property", roomId: "room", roomName: "Room 1", guest: { name: "Dana", phone: "+972501234567" }, startsAt: "2026-01-01T15:00:00Z", endsAt: "2026-01-02T12:00:00Z", status: "confirmed", version: 3, targetIds: ["a", "b"] });
  assert.equal(old.systemId, null);
  assert.equal(old.changeSystemId, null, "several targets: no single system to change it with");
  assert.equal(systemLabel(old, new Map([["a", { name: "A" }]])), "—");
  assert.equal(statusLabel(old.status), "Confirmed");
  const single = readReservation({ id: "single", guest: { name: "Dana", phone: "+972501234567" }, startsAt: "2026-01-01T15:00:00Z", endsAt: "2026-01-02T12:00:00Z", status: "draft", version: 1, targetIds: ["a"] });
  assert.equal(single.changeSystemId, "a");
  assert.equal(systemLabel(single, new Map([["a", { name: "A" }]])), "A", "one active target: that system's name");
  assert.equal(systemLabel(single, new Map()), "—", "a target no longer active: —");
  assert.deepEqual(Object.keys(changeBody(single, { status: "confirmed" })).sort(), ["endsAt", "guest", "note", "startsAt", "status", "systemId", "version"]);
  assert.equal(changeBody(single, { status: "confirmed" }).systemId, "a");
  for (const broken of [null, {}, { id: "x" }, { id: "x", startsAt: "soon", endsAt: "later" }]) assert.equal(readReservation(broken), null);
  const missingGuest = readReservation({ id: "g", startsAt: "2026-01-01T15:00:00Z", endsAt: "2026-01-02T12:00:00Z" });
  assert.equal(missingGuest.guest.name, "");
  assert.equal(missingGuest.status, "");
  const current = readReservation({ id: "now", systemId: "s1", systemName: "Room 212", startsAt: "2026-01-01T15:00:00Z", endsAt: "2026-01-02T12:00:00Z", status: "confirmed", version: 1, guest: { name: "A", phone: "+972501234567" } });
  assert.equal(systemLabel(current, new Map()), "Room 212", "a removed system keeps the name stored on its booking");
  assert.equal(systemLabel(current, new Map([["s1", { name: "Renamed" }]])), "Renamed");
});
test("an older booking that holds several systems closes on the first one it holds and is never moved blindly", () => {
  const raw = { id: "multi", roomId: "room", guest: { name: "Dana", phone: "+972501234567" }, startsAt: "2026-01-01T15:00:00Z", endsAt: "2026-01-02T12:00:00Z", status: "confirmed", version: 4, targetIds: ["a", "", 7, "a", "b"] };
  const old = readReservation(raw);
  assert.equal(old.changeSystemId, null);
  assert.deepEqual(old.heldTargets, ["a", "b"], "the systems it holds, each once");
  for (const status of ["cancelled", "completed"]) {
    const body = changeBody(old, { status });
    assert.equal(body.systemId, "a", status);
    assert.equal(body.status, status);
    assert.equal(body.version, 4);
  }
  assert.equal(changeBody(old, { status: "confirmed" }).systemId, null, "a change that keeps it open names no system");
  assert.equal(changeBody(old).systemId, null);
  const none = readReservation({ ...raw, targetIds: [] });
  assert.deepEqual(none.heldTargets, []);
  assert.equal(changeBody(none, { status: "cancelled" }).systemId, null, "a booking that holds no system has none to close on");
  const current = readReservation({ ...raw, systemId: "s1", targetIds: ["s1"] });
  assert.deepEqual(current.heldTargets, ["s1"]);
  assert.equal(changeBody(current, { status: "cancelled" }).systemId, "s1");
});
test("refusals a retry cannot get past say what to do, in both languages", async () => {
  const { bookingMessage, finalRefusals } = await import("../js/host-booking-model.js");
  const { systemMessage } = await import("../js/host-system-cards.js");
  const { automationMessage } = await import("../js/host-automation.js");
  const { integrationMessage, eventStateLabel } = await import("../js/host-integrations.js");
  const { hostText } = await import("../js/host-locale.js");
  const generic = "That didn't work. Try again.";
  const unverified = "One of this system's gates isn't verified by WIFIGATE. Contact support.";
  const cases = [
    [systemMessage({ code: "DEVICE_IDENTITY_UNVERIFIED" }), unverified],
    [bookingMessage({ code: "DEVICE_IDENTITY_UNVERIFIED" }), unverified],
    [bookingMessage({ code: "GUEST_DATA_REDACTED" }), "This booking's guest details were deleted, so it can't be saved again."],
    [automationMessage({ code: "DELIVERY_TEMPLATE_UNAVAILABLE" }), "That guest message template isn't set up. Ask your developer."],
    [integrationMessage({ code: "RESOURCE_NOT_FOUND" }, { mapping: true }), "That system isn't available any more. Choose another."],
    [integrationMessage({ code: "SYSTEM_UNAVAILABLE" }, { mapping: true }), "That system isn't available any more. Choose another."],
  ];
  for (const [shown, expected] of cases) {
    assert.equal(shown, expected);
    assert.notEqual(hostText(expected, {}, "he"), expected, `${expected} has Hebrew`);
  }
  // A missing provider event is not a missing system.
  assert.equal(integrationMessage({ code: "RESOURCE_NOT_FOUND" }), generic);
  for (const code of ["DEVICE_IDENTITY_UNVERIFIED", "GUEST_DATA_REDACTED"]) assert.ok(finalRefusals.has(code), code);
  // Every status the API gives a received booking reads as a word.
  const states = { received: "Received", queued: "Waiting", processing: "Working on it", processed: "Done", retry: "Trying again", dead_letter: "Failed", expired: "Expired", redacted: "Guest details removed" };
  for (const [status, label] of Object.entries(states)) {
    assert.equal(eventStateLabel(status), label, status);
    assert.notEqual(hostText(label, {}, "he"), label, `${label} has Hebrew`);
  }
  assert.equal(eventStateLabel("something-new"), "Received");
});
test("a booking's guest carries only the details that hold something", () => {
  assert.deepEqual(guestBody({ name: " Dana ", phone: "+972501234567", email: "", floor: " 2 ", comment: "" }), { name: "Dana", phone: "+972501234567", floor: "2" });
});
test("in Hebrew הזמנות are bookings only: team invitations and guest links never use the word", async () => {
  const { hostHebrew } = await import("../js/host-locale-he.js");
  for (const [key, value] of Object.entries(hostHebrew))
    if (/invit|guest link/i.test(key) && !/booking/i.test(key))
      assert.doesNotMatch(value, /הזמנ/, key);
  assert.equal(hostHebrew["+ Booking"], "+ הזמנה");
  assert.equal(hostHebrew["Create guest link"], "יצירת קישור לאורח");
  for (const key of ["Properties", "properties", "rooms", "Calendar property", "Add property", "Automation property", "Saved filter property"])
    assert.equal(hostHebrew[key], undefined, key);
});
test("no Host copy offers a removed path: system transfers, import requests or properties", async () => {
  const { hostHebrew } = await import("../js/host-locale-he.js");
  const { readFile, readdir } = await import("node:fs/promises");
  const removed = /transfer|import request|propert(?:y|ies)|key rotation/i;
  for (const key of Object.keys(hostHebrew)) assert.doesNotMatch(key, removed, key);
  const sources = (await readdir(new URL("../js/", import.meta.url))).filter((file) => /^host-.*\.js$/.test(file) && !file.includes("bundle") && !file.startsWith("host-locale"));
  for (const file of sources) {
    const source = await readFile(new URL(`../js/${file}`, import.meta.url), "utf8");
    for (const [, literal] of source.matchAll(/"((?:[^"\\\r\n]|\\.){12,})"/g))
      assert.doesNotMatch(literal, removed, `${file}: ${literal}`);
  }
  assert.equal(hostHebrew["Gates still held: {count}. Remove the systems that hold them first."], "שערים שעדיין משויכים: {count}. הסירו תחילה את המערכות שמחזיקות אותם.");
  assert.equal(hostHebrew["Remove the systems that hold {count} gates first: {names}."], undefined, "the archive dialog never asks to remove systems that may already be gone");
});
test("no Host copy names rooms: a booking system's items are IDs and connections", async () => {
  const { hostHebrew } = await import("../js/host-locale-he.js");
  const { readFile, readdir } = await import("node:fs/promises");
  const room = /\brooms?\b/i;
  for (const [key, value] of Object.entries(hostHebrew)) {
    assert.doesNotMatch(key, room, key);
    // "חדר כושר" is the gym icon's name, not a room.
    assert.doesNotMatch(value.replaceAll("חדר כושר", ""), /חדר/, key);
  }
  const sources = (await readdir(new URL("../js/", import.meta.url))).filter((file) => /^host-.*\.js$/.test(file) && !file.includes("bundle") && !file.startsWith("host-locale"));
  for (const file of sources) {
    const source = await readFile(new URL(`../js/${file}`, import.meta.url), "utf8");
    for (const [, literal] of source.matchAll(/(?:hostText|isolatedText)\(\s*"((?:[^"\\]|\\.)*)"/g))
      assert.doesNotMatch(literal, room, `${file}: ${literal}`);
  }
  assert.equal(hostHebrew["Show connections"], "הצגת החיבורים");
  assert.equal(hostHebrew["ID in your booking system"], "מזהה במערכת ההזמנות");
  assert.equal(hostHebrew["Booking A-212 · 212"], "הזמנה A-212 · 212");
});
test("every Hebrew Host string is shown somewhere: no copy from removed screens", async () => {
  // A key is in use when the Host page or a module of its bundle holds it as a
  // whole string: a quoted literal, or a data-host-copy / data-host-label
  // value. A key that is only part of a longer string does not count, and
  // neither do old view names kept only as deep-link aliases.
  // Values the Host API sends and a Host screen shows through hostText(value),
  // by call site. Each list is the backend's enum for that field: API key
  // statuses, automation job statuses, service target assessment states,
  // staff notification statuses and support approval statuses. (A team
  // invitation's status and a plan's state each pick a whole label.)
  const apiValues = {
    "js/host-api-keys.js: record.status": ["active", "revoked"],
    "js/host-automation.js: job.status": ["queued", "retry", "processing", "paused", "ready", "delivered", "failed", "expired", "cancelled"],
    "js/host-operations.js: assessment.state": ["healthy", "breached", "unknown", "unowned", "disabled"],
    "js/host-operations.js: item.status": ["queued", "retry", "processing", "delivered", "failed", "cancelled", "expired"],
    "js/host-support.js: item.status": ["active", "revoked", "expired"],
  };
  // A code key (a lowercase id such as "retry") is shown only when the API
  // sends it to one of those call sites, a fixed list passes it to hostText,
  // or a module passes it to hostText as a literal. A code that is merely
  // compared somewhere is not shown.
  const codes = new Set([
    ...Object.values(apiValues).flat(),
    // Role ids, shown through hostText(role) from fixed role lists.
    "owner", "admin", "staff", "viewer", "user",
  ]);
  const dynamic = new Set([
    ...codes,
    // The admin access actions: hostText(`${action} access`).
    "Block access", "Remove access", "Unblock access",
    // The Platform tab names, capitalised from their ids.
    "Admins", "Users", "Organizations",
  ]);
  const { readFile } = await import("node:fs/promises");
  const { build } = await import("esbuild");
  const { dashboardBundle } = await import("./lib/bundles.mjs");
  const { hostHebrew } = await import("../js/host-locale-he.js");
  const root = new URL("../", import.meta.url);
  const locale = (await readFile(new URL("js/host-locale.js", root), "utf8")).replace(/\r\n/g, "\n");
  const start = locale.indexOf("const hebrew = {"), end = locale.indexOf("\n};", start) + 3;
  assert.ok(start > 0 && end > start, "js/host-locale.js keeps its inline Hebrew map");
  const inline = Function(`return ${locale.slice(start + "const hebrew = ".length, end - 1)}`)();
  const { metafile } = await build({ ...dashboardBundle, write: false, metafile: true });
  const modules = Object.keys(metafile.inputs).filter((file) => !/host-locale(-he)?\.js$/.test(file));
  assert.ok(modules.includes("js/host-dashboard.js") && modules.includes("js/host-admin-overview.js"));
  const page = (await readFile(new URL("dashboard/host/index.html", root), "utf8")).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const withoutAliases = (file, source) => {
    if (file !== "js/host-workspace-model.js") return source;
    let rest = source.replace(/\r\n/g, "\n");
    for (const name of ["const aliases = {", "const tabAliases = {"]) {
      const from = rest.indexOf(name), to = rest.indexOf("\n};", from);
      assert.ok(from > 0 && to > from, `${file} keeps ${name}`);
      rest = rest.slice(0, from) + rest.slice(to + 3);
    }
    return rest;
  };
  const files = await Promise.all(modules.map(async (file) => [file, withoutAliases(file, await readFile(new URL(file, root), "utf8"))]));
  const sources = [locale.slice(0, start) + locale.slice(end), page, ...files.map(([, source]) => source)].join("\n");
  const code = /^[a-z][a-z_-]*$/;
  const shown = (key) =>
    code.test(key)
      ? codes.has(key) || [`hostText(${JSON.stringify(key)})`, `hostText('${key}')`, `data-host-copy="${key}"`, `data-host-label="${key}"`].some((use) => sources.includes(use))
      : dynamic.has(key) || [JSON.stringify(key), `'${key}'`, `\`${key}\``].some((quoted) => sources.includes(quoted));
  for (const [name, map] of [["js/host-locale-he.js", hostHebrew], ["js/host-locale.js", inline]]) {
    const unused = Object.keys(map).filter((key) => !shown(key));
    assert.deepEqual(unused, [], `${name} holds copy no Host screen shows`);
  }
  // Every call site that shows a raw API value is listed above, so a new one
  // cannot show English words to a Hebrew operator unnoticed.
  const firstArgument = (source, from) => {
    let depth = 0, quote = "";
    for (let index = from; index < source.length; index++) {
      const char = source[index];
      if (quote) {
        if (char === "\\") index++;
        else if (char === quote) quote = "";
      } else if (char === '"' || char === "'" || char === "`") quote = char;
      else if ("([{".includes(char)) depth++;
      else if (")]}".includes(char) && depth) depth--;
      else if (char === ")" || char === ",") return source.slice(from, index);
    }
    return source.slice(from);
  };
  const callSites = [];
  for (const [file, source] of files)
    for (const match of source.matchAll(/\bhostText\(/g)) {
      const argument = firstArgument(source, match.index + match[0].length).replace(/\s+/g, " ").trim();
      if (/^["'`]/.test(argument)) continue;
      // What reaches hostText: not a value that is only compared, quoted or
      // used as a lookup key.
      let outside = argument.replace(/[\w$?.]+ [!=]==? (?:"[^"]*"|'[^']*'|\d+)/g, "").replace(/"[^"]*"|'[^']*'/g, '""');
      while (/\[[^[\]]*\]/.test(outside)) outside = outside.replace(/\[[^[\]]*\]/g, "");
      if (/\.(?:status|state|effectiveStatus)\b/.test(outside)) callSites.push(`${file}: ${argument}`);
    }
  assert.deepEqual(callSites.sort(), Object.keys(apiValues).sort(), "every hostText(<API value>) call site lists the values the API sends");
  const untranslated = [...dynamic].filter((key) => !(hostHebrew[key] ?? inline[key]));
  assert.deepEqual(untranslated, [], "every value the API sends to a Host screen has Hebrew");
  // Copy from the removed calendar landing, approval, portal-access and
  // invitation screens, words that only survive inside longer strings, and
  // statuses no API sends to a Host screen.
  for (const key of ["Create team invitation", "Back to calendar", "Approval pending", "Manage portal access", "{count} reservation", "{p0} · revision {p1}", "Set up your authenticator", "Action", "Systems on record, removed ones included: {names}.", "Reservations", "Access Keys", "grace", "observed", "past_due", "running", "sent", "current", "dead_letter", "archived", "blocked", "draft", "confirmed", "changed", "completed"])
    assert.equal(hostHebrew[key] ?? inline[key], undefined, key);
  // The booking statuses are shown through their capitalised labels, and the
  // automation job statuses an operator meets in Activity read in Hebrew.
  for (const [key, hebrew] of [["Cancelled", "בוטלה"], ["Completed", "הסתיימה"], ["retry", "ממתין לניסיון נוסף"], ["processing", "בעיבוד"], ["paused", "מושהה"], ["unowned", "האחראי אינו זמין"]])
    assert.equal(hostHebrew[key] ?? inline[key], hebrew, key);
});
test("a plan's state reads as a word in both languages, never its id or revision", async () => {
  const { planState } = await import("../js/host-billing.js");
  const { hostText } = await import("../js/host-locale.js");
  const states = ["legacy-active", "trial", "trial-expired", "active", "cancelling", "cancelled", "suspended", "invalid", "something-new", undefined];
  for (const state of states) {
    const label = planState({ status: state, version: 7 });
    assert.doesNotMatch(label, /-|revision|\b7\b/, String(state));
    assert.match(label, /^[A-Z][a-z]+(?: [a-z]+)?$/, String(state));
    assert.notEqual(hostText(label, {}, "he"), label, `${label} has Hebrew`);
  }
  assert.equal(planState({ status: "legacy-active" }), "Active");
  assert.equal(planState({ status: "suspended", effectiveStatus: "trial" }), "Trial");
  assert.equal(planState({ status: "invalid" }), "Needs attention");
});
test("a phone number reads the way people write it in the organization's country", async () => {
  const { phoneDisplay } = await import("../js/host-phone.js");
  assert.equal(phoneDisplay("+972501234567", "IL"), "050-123-4567");
  assert.equal(phoneDisplay("+97221234567", "IL"), "02-123-4567");
  assert.equal(phoneDisplay("+15551234567", "US"), "(555) 123-4567");
  assert.equal(phoneDisplay("+447700900212", "IL"), "+44 7700900212");
  assert.equal(phoneDisplay("+447700900212", "GB"), "07700900212");
  assert.equal(phoneDisplay("not a phone", "IL"), "not a phone");
});
test("a Hebrew time zone names its place in Hebrew, never the Latin city of the zone id", async () => {
  const { zoneLabel } = await import("../js/host-settings.js");
  for (const zone of ["Asia/Jerusalem", "Europe/Paris", "America/Los_Angeles", "Australia/Sydney"])
    assert.doesNotMatch(zoneLabel(zone, "he"), /[A-Za-z]/, zone);
  assert.equal(zoneLabel("Asia/Jerusalem", "he"), "שעון ישראל");
  assert.equal(zoneLabel("Europe/Paris", "he"), "שעון צרפת · שעון מרכז אירופה");
  assert.equal(zoneLabel("UTC", "he"), "UTC");
  assert.equal(zoneLabel("Asia/Jerusalem", "en"), "Jerusalem · Israel Time");
});
test("Hebrew buttons and labels use the noun form, never a masculine imperative", async () => {
  const { hostHebrew } = await import("../js/host-locale-he.js");
  const imperative = /^(צור|הוסף|שמור|בטל|מחק|שלח|פתח|סגור|הצג|ערוך|בחר|הזן|לחץ|נסה|העתק|חפש|טען|רענן)\s/;
  for (const [key, value] of Object.entries(hostHebrew)) assert.doesNotMatch(value, imperative, key);
  assert.equal(hostHebrew["Create guest link"], "יצירת קישור לאורח");
});
test("a system that is not ready says what to do next, never a reason code", async () => {
  const { readinessReason } = await import("../js/host-operations.js");
  for (const code of ["SUBSCRIPTION_UNAVAILABLE", "SYSTEM_DISABLED", "SYSTEM_UNAVAILABLE", "HOST_KEY_UNAVAILABLE", "OWNERSHIP_UNAVAILABLE", "DEVICE_IDENTITY_UNVERIFIED", "GATE_DELEGATION_REQUIRED", "SOMETHING_NEW"]) {
    const text = readinessReason(code);
    assert.doesNotMatch(text, /[A-Z]{2,}_|_[A-Z]{2,}/, code);
  }
  assert.equal(readinessReason("SOMETHING_NEW"), "Needs attention");
  const { hostHebrew } = await import("../js/host-locale-he.js");
  for (const key of ["Needs attention", "Add the system again from the WIFIGATE app", "Another organization holds one of its gates"])
    assert.ok(hostHebrew[key], key);
});
