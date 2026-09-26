import assert from "node:assert/strict";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, OAuthProvider, signInWithCredential, signOut } from "firebase/auth";

const apiOrigin = "http://127.0.0.1:8101";
const projectId = "demo-wifigate-host";
const firebaseAuth = getAuth(initializeApp({ apiKey: "fake-api-key", authDomain: `${projectId}.firebaseapp.com`, projectId, appId: "1:123456789:web:staging" }));
connectAuthEmulator(firebaseAuth, "http://127.0.0.1:9099", { disableWarnings: true });

async function tokenFor(email, providerName) {
  const mockIdToken = JSON.stringify({ sub: `${providerName}-${email}`, email, email_verified: true });
  const credential = providerName === "google"
    ? GoogleAuthProvider.credential(mockIdToken)
    : new OAuthProvider("apple.com").credential({ idToken: mockIdToken });
  const result = await signInWithCredential(firebaseAuth, credential);
  assert.equal(result.user.email, email);
  assert.ok(result.user.providerData.some((provider) => provider.providerId === `${providerName}.com`));
  const idToken = await result.user.getIdToken();
  await signOut(firebaseAuth);
  return idToken;
}

async function get(path, token) {
  const response = await fetch(`${apiOrigin}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}`, Origin: "http://127.0.0.1:8100" } : { Origin: "http://127.0.0.1:8100" }
  });
  return { status: response.status, body: await response.json(), headers: response.headers };
}

const health = await get("/health");
assert.equal(health.status, 200, "staging API is running");
assert.equal((await get("/v1/me")).status, 401, "anonymous request is denied");
assert.equal((await get("/v1/me", "invalid-token")).status, 401, "invalid token is denied");

const admin = await tokenFor("admin-e2e@wifigate.test", "google");
const owner = await tokenFor("owner-e2e@grandplaza.test", "apple");
const member = await tokenFor("member-e2e@grandplaza.test", "google");
const stranger = await tokenFor("stranger-e2e@wifigate.test", "apple");

const adminMe = await get("/v1/me", admin);
assert.equal(adminMe.status, 200);
assert.equal(adminMe.body.role, "platform_admin");
assert.equal((await get("/v1/admin/clients", admin)).body.clients.length, 2);
assert.equal((await get("/v1/admin/audit", admin)).status, 200);
assert.equal((await get("/v1/portal/keys", admin)).status, 403);

const ownerMe = await get("/v1/me", owner);
assert.equal(ownerMe.body.role, "client_owner");
assert.equal(ownerMe.body.memberships[0].clientId, "grand-plaza");
const ownerKeys = await get("/v1/portal/keys", owner);
assert.equal(ownerKeys.body.keys.length, 2);
assert.equal(JSON.stringify(ownerKeys.body).includes("ownerEmail"), false);
assert.equal((await get("/v1/portal/usage", owner)).status, 200);
assert.equal((await get("/v1/admin/clients", owner)).status, 403);

const memberMe = await get("/v1/me", member);
assert.equal(memberMe.body.role, "client_member");
assert.equal((await get("/v1/portal/keys", member)).body.keys.length, 1);
assert.equal((await get("/v1/me", stranger)).status, 403);
assert.equal(ownerKeys.headers.get("cache-control"), "no-store");
assert.equal(ownerKeys.headers.get("access-control-allow-origin"), "http://127.0.0.1:8100");

console.log("Staging E2E passed: Firebase emulator tokens, all three roles, tenant isolation, and denied access.");
