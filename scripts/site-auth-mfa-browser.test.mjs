import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";
import { installAppCheckFixture } from "./app-check-browser-fixture.mjs";

test("TOTP initializes its own auth module when sign-in used a versioned module", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await browser.newPage();
  t.after(() => page.close());
  // site-auth.js starts App Check first; keep its SDK out of this test.
  await installAppCheckFixture(page);
  await page.route("**/firebase-app.js", (route) => route.fulfill({
    contentType: "application/javascript",
    body: "export const initializeApp = () => ({}); export const getApp = () => ({}); export const getApps = () => [];",
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

test("Only an explicit expired-challenge restart repeats popup authentication, with a bounded retry count", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await browser.newPage();
  t.after(() => page.close());
  await installAppCheckFixture(page);
  await page.route("**/firebase-app.js", route => route.fulfill({contentType:"application/javascript", body:"export const initializeApp=()=>({});export const getApp=()=>({});export const getApps=()=>[];"}));
  await page.route("**/firebase-auth.js", route => route.fulfill({contentType:"application/javascript", body:`
    export const getAuth=()=>({}); export const browserLocalPersistence={}; export const setPersistence=async()=>{};
    export class GoogleAuthProvider {setCustomParameters(){}}
    export const getMultiFactorResolver=()=>({});
    const challenge=async()=>{window.popupCalls++;throw {code:'auth/multi-factor-auth-required'};};
    export const signInWithPopup=challenge; export const reauthenticateWithPopup=challenge;
    export const getRedirectResult=challenge;
  `}));
  await page.route(origin + '/auth-restart-test', route => route.fulfill({contentType:'text/html',body:'<!doctype html><title>Auth restart test</title>'}));
  await page.goto(origin + '/auth-restart-test');
  const result = await page.evaluate(async()=>{
    const auth=await import('/js/site-auth.js');
    const restart=()=>Object.assign(new Error('restart'),{code:'mfa-restart-required'});
    window.popupCalls=0;let challenges=0;
    const success=await auth.signIn('google',async()=>{if(++challenges===1)throw restart();return 'verified';});
    const successfulCalls=window.popupCalls;
    const cases={};
    for(const mode of ['cancel','server-timeout','bound','redirect']){
      window.popupCalls=0;
      try {
        const callback=async()=>{throw mode==='cancel'?new Error('mfa-cancelled'):mode==='server-timeout'?{code:'auth/totp-challenge-timeout'}:restart();};
        await (mode==='redirect'?auth.completeAuthCallback(callback):auth.signIn('google',callback));
      } catch(error){cases[mode]={calls:window.popupCalls,code:error.code||error.message};}
    }
    window.popupCalls=0;let renewals=0;
    const user={getIdTokenResult:async()=>({claims:{firebase:{sign_in_provider:'google.com'}}})};
    await auth.reauthenticate(user,async()=>{if(!renewals++)throw restart();return 'verified';});
    return {success,successfulCalls,cases,reauthCalls:window.popupCalls};
  });
  assert.equal(result.success,'verified');assert.equal(result.successfulCalls,2);assert.equal(result.reauthCalls,2);
  assert.deepEqual(result.cases,{
    cancel:{calls:1,code:'mfa-cancelled'},'server-timeout':{calls:1,code:'auth/totp-challenge-timeout'},
    bound:{calls:3,code:'mfa-restart-required'},redirect:{calls:1,code:'mfa-restart-required'},
  });
});
