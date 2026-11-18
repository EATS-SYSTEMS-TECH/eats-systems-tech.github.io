import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyManagerRecentIdentity} from '../js/manager-recent-identity.js';

const token = (age=0, factor='totp') => ({claims:{auth_time:Date.now()/1000-age,firebase:{sign_in_second_factor:factor,second_factor_identifier:'fixture-factor'}}});
function fixture(before=token(),after=token()) {
  let calls=0,reads=0,current=true;
  const user={getIdTokenResult:async refresh=>{reads++;return refresh?after:before}};
  return { user, reauthenticate:async()=>{calls++},isCurrent:()=>current,
    get calls(){return calls},get reads(){return reads},leave(){current=false} };
}
test('Forced reset reauthenticates even a fresh TOTP session on each action',async()=>{
  const f=fixture();
  for(let i=0;i<2;i++)await verifyManagerRecentIdentity(f,{force:true,requireTotp:true,maxAgeSeconds:240});
  assert.equal(f.calls,2);assert.equal(f.reads,4);
});
test('Recent non-destructive action reuses a valid session',async()=>{
  const f=fixture();await verifyManagerRecentIdentity(f,{maxAgeSeconds:240});assert.equal(f.calls,0);
});
test('Provider-only reauthentication cannot authorize reset',async()=>{
  const f=fixture(token(),token(0,'sms'));
  await assert.rejects(verifyManagerRecentIdentity(f,{force:true,requireTotp:true}),/TOTP_REQUIRED/);
});
test('Stale or future auth returned by refresh remains rejected',async()=>{
  for(const age of [241,-30]) {
    const f=fixture(token(900),token(age));
    await assert.rejects(verifyManagerRecentIdentity(f,{force:true,requireTotp:true,maxAgeSeconds:240}),/RECENT_REAUTH_REQUIRED/);
  }
});
test('Cancelled authenticator and changed identity never authorize a command',async()=>{
  const f=fixture();f.reauthenticate=async()=>{throw Error('auth/user-cancelled')};
  await assert.rejects(verifyManagerRecentIdentity(f,{force:true,requireTotp:true}),/auth\/user-cancelled/);
  const changed=fixture();changed.reauthenticate=async()=>changed.leave();
  await assert.rejects(verifyManagerRecentIdentity(changed,{force:true,requireTotp:true}),/CANCELLED/);
});
