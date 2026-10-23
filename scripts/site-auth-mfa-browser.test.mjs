import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("TOTP initializes its own auth module when sign-in used a versioned module", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await browser.newPage();
  t.after(() => page.close());
  await page.route("**/firebase-app.js", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "export const initializeApp = () => ({});",
  }));
  await page.route("**/firebase-auth.js", (route) => route.fulfill({
    contentType: "application/javascript",
    body: `export const getAuth = () => ({});
      export const browserLocalPersistence = {};
      export const setPersistence = async () => {};
      export const onAuthStateChanged = () => () => {};
      export const TotpMultiFactorGenerator = {
        assertionForSignIn: (factor, code) => ({factor, code})
      };`,
  }));
  await page.route(origin + "/auth-regression", (route) => route.fulfill({
    contentType: "text/html", body: "<!doctype html><title>Auth regression</title>",
  }));
  await page.goto(origin + "/auth-regression");
  const result = await page.evaluate(async () => {
    const signInModule = await import("/js/site-auth.js?sign-in-instance");
    await signInModule.initializeSiteAuth(() => {});
    const challengeModule = await import("/js/site-auth.js");
    let calls = 0;
    const resolver = { resolveSignIn: async ({ factor, code }) => {
      calls++;
      if (factor !== "test-factor" || code !== "123456") {
        throw { code: "auth/invalid-verification-code" };
      }
      return { user: { uid: "test-user" } };
    }};
    let invalidCode;
    try { await challengeModule.resolveTotp(resolver, "test-factor", "000000"); }
    catch (error) { invalidCode = error.code; }
    const valid = await challengeModule.resolveTotp(resolver, "test-factor", "123456");
    return { invalidCode, uid: valid.user.uid, calls };
  });
  assert.deepEqual(result, {
    invalidCode: "auth/invalid-verification-code", uid: "test-user", calls: 2,
  });
});
