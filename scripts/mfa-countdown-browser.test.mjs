import test from 'node:test';
import assert from 'node:assert/strict';
import {startSite} from './platform-test-fixtures.mjs';
import {installAppCheckFixture} from './app-check-browser-fixture.mjs';

async function setup(t, language='en', timeoutMs=120000) {
  const {origin,browser}=await startSite(t);
  const page=await browser.newPage();t.after(()=>page.close());
  await installAppCheckFixture(page);
  await page.route('**/firebase-app.js',route=>route.fulfill({contentType:'application/javascript',body:'export const initializeApp=()=>({});export const getApp=()=>({});export const getApps=()=>[];'}));
  await page.route('**/firebase-auth.js',route=>route.fulfill({contentType:'application/javascript',body:`
    export const getAuth=()=>({});export const browserLocalPersistence={};export const setPersistence=async()=>{};
    export const initializeAuth=()=>getAuth();export const browserSessionPersistence={};
    export const indexedDBLocalPersistence={};export const browserPopupRedirectResolver={};
    export const TotpMultiFactorGenerator={assertionForSignIn:(factor,code)=>({factor,code})};
  `}));
  await page.route(origin+'/mfa-timer-test',route=>route.fulfill({contentType:'text/html',body:`<!doctype html><html lang="${language}"><dialog id="mfa-challenge"><form><select name="factor"></select><label>Code<input name="code" required pattern="[0-9]{6}" maxlength="6"></label><p role="status"></p><button type="submit">${language==='he'?'אימות':'Verify'}</button><button type="button" data-cancel>Cancel</button></form></dialog></html>`}));
  await page.goto(origin+'/mfa-timer-test');
  await page.evaluate(async timeoutMs=>{
    const {requestMfaChallenge}=await import('/js/host-mfa-challenge.js');
    window.requests=0;window.result=null;
    window.begin=(duration=timeoutMs)=>{
      const resolver={hints:[{factorId:'totp',uid:'fixture-factor'}],resolveSignIn:async()=>{
        window.requests++;
        if(window.pending)return new Promise(resolve=>window.finish=resolve);
        if(window.failure)throw Object.assign(Error('test refusal'),{code:window.failure});
        return {user:{uid:'fixture-user'}};
      }};
      window.result=null;
      window.flow=requestMfaChallenge(resolver,{}, {timeoutMs:duration}).then(()=>window.result='verified',e=>window.result=e.code||e.message);
    };
    window.begin();
  },timeoutMs);
  return page;
}

test('MFA shows a two-minute input window, expires and explicitly renews without submitting an old code',async t=>{
  for(const language of ['he','en']){
    const page=await setup(t,language);
    assert.match(await page.getByRole('timer').innerText(),/02:00/);
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    await page.evaluate(()=>window.begin(1000));
    const restart=page.getByRole('button',{name:language==='he'?'התחלת אימות חדש':'Start new verification',exact:true});
    await restart.waitFor();
    assert.equal(await page.getByLabel('Code').isDisabled(),true);
    assert.match(await page.getByRole('timer').innerText(),/00:00/);
    assert.equal(await page.evaluate(()=>window.requests),0);
    await restart.click();
    assert.equal(await page.evaluate(()=>window.result),'mfa-restart-required');
    assert.equal(await page.locator('dialog[open]').count(),0);
    await page.evaluate(()=>window.begin(120000));
    assert.match(await page.getByRole('timer').innerText(),/02:00/);
    assert.equal(await page.getByLabel('Code').isEnabled(),true);
    assert.equal(await page.getByLabel('Code').inputValue(),'');
    assert.equal(await page.locator('.mfa-challenge-countdown').count(),1);
  }
});

test('A server TOTP challenge timeout expires immediately; a bad code remains retryable and no OTP is logged',async t=>{
  const page=await setup(t);const logs=[];page.on('console',message=>logs.push(message.text()));
  await page.evaluate(()=>window.failure='auth/totp-challenge-timeout');
  await page.getByLabel('Code').fill('123456');await page.getByRole('button',{name:'Verify',exact:true}).click();
  await page.getByRole('button',{name:'Start new verification',exact:true}).waitFor();
  assert.match(await page.getByRole('timer').innerText(),/00:00/);
  assert.equal(await page.getByLabel('Code').isDisabled(),true);
  assert.equal(logs.some(x=>x.includes('123456')),false);
  await page.getByRole('button',{name:'Start new verification',exact:true}).click();
  await page.evaluate(()=>{window.failure='auth/invalid-verification-code';window.begin();});
  await page.getByLabel('Code').fill('123456');await page.getByRole('button',{name:'Verify',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[role=status]').dataset.errorCode==='auth/invalid-verification-code');
  assert.equal(await page.getByLabel('Code').isEnabled(),true);
  assert.equal(await page.getByRole('button',{name:'Verify',exact:true}).isEnabled(),true);
  await page.evaluate(()=>window.failure=null);
  await page.getByLabel('Code').fill('123456');await page.getByRole('button',{name:'Verify',exact:true}).click();
  await page.waitForFunction(()=>window.result==='verified');
  assert.equal(await page.locator('dialog[open]').count(),0);
});

test('Expiry does not replay or reject an already submitted verification while its result is pending',async t=>{
  const page=await setup(t,'en',1000);
  await page.evaluate(()=>window.pending=true);
  await page.getByLabel('Code').fill('123456');await page.getByRole('button',{name:'Verify',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[role=timer]').textContent.includes('00:00'));
  assert.equal(await page.getByRole('button',{name:'Start new verification',exact:true}).isDisabled(),true);
  assert.equal(await page.evaluate(()=>window.requests),1);
  await page.evaluate(()=>window.finish({user:{uid:'fixture-user'}}));
  await page.waitForFunction(()=>window.result==='verified');
  assert.equal(await page.locator('dialog[open]').count(),0);
});
