import assert from "node:assert/strict";
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider, OAuthProvider, signInWithCredential, signOut } from "firebase/auth";
const apiOrigin = "http://127.0.0.1:8101";
const projectId = "demo-wifigate-host";
const auth = getAuth(initializeApp({ apiKey: "fake-api-key", authDomain: projectId + ".firebaseapp.com", projectId, appId: "1:123456789:web:staging" }));
connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
async function tokenFor(email, provider) {
  const idToken = JSON.stringify({ sub: provider + "-" + email, email, email_verified: true });
  const credential = provider === "google" ? GoogleAuthProvider.credential(idToken) : new OAuthProvider("apple.com").credential({ idToken });
  const result = await signInWithCredential(auth, credential); const token = await result.user.getIdToken(); await signOut(auth); return token;
}
async function request(path, token, method = "GET", body) {
  const response = await fetch(apiOrigin + path, { method, headers: { Origin: "http://127.0.0.1:8100", ...(token ? { Authorization: "Bearer " + token } : {}), ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, body: await response.json(), headers: response.headers };
}
assert.equal((await request("/health")).status, 200);
assert.equal((await request("/api/v1/users/me")).status, 401);
assert.equal((await request("/api/v1/users/me", "invalid-token")).status, 401);
const admin = await tokenFor("admin-e2e@wifigate.test", "google");
const member = await tokenFor("owner-e2e@grandplaza.test", "apple");
const stranger = await tokenFor("stranger-e2e@wifigate.test", "apple");
const pending = await tokenFor("pending-e2e@wifigate.test", "google");
const adminMe = await request("/api/v1/users/me", admin);
assert.equal(adminMe.body.role, "admin"); assert.equal(adminMe.body.mfa.required, true); assert.equal(adminMe.body.mfa.verified, false);
assert.equal((await request("/api/v1/admin/portal-access", admin, "POST", { email: "new@test.example" })).status, 403);
const memberMe = await request("/api/v1/users/me", member);
assert.equal(memberMe.body.access.state, "active"); assert.equal(memberMe.body.mfa.required, false);
assert.equal((await request("/api/v1/admin/portal-access", member, "POST", { email: "new@test.example" })).status, 403);
assert.equal((await request("/api/v1/users/me", stranger)).body.access.state, "denied");
assert.equal((await request("/api/v1/users/me", pending)).body.access.state, "pending");
assert.equal((await request("/api/v1/users/me", member, "PUT", {})).status, 200);
assert.equal(memberMe.headers.get("cache-control"), "no-store");
assert.equal(memberMe.headers.get("access-control-allow-origin"), "http://127.0.0.1:8100");
console.log("Staging API passed: Firebase tokens, profile contract, pending/denied access, and approval denied without MFA.");
