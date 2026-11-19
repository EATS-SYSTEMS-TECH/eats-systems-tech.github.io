import test from 'node:test';
import assert from 'node:assert/strict';
import {managerConnectionError} from '../js/manager-connection-errors.js';

test('A controller credential refusal explains local Manager renewal; website HTTP sign-in refusal stays separate',()=>{
  for(const language of ['he','en']) {
    const gate=managerConnectionError({code:'UNAUTHORIZED',firmwareRefusal:true},language);
    const web=managerConnectionError({code:'UNAUTHORIZED'},language);
    assert.equal(gate.code,'CREDENTIAL_REVOKED');assert.equal(web.code,'UNAUTHORIZED');
    assert.match(gate.steps.join(' '),language==='he'?/סנכרון/:/Sync/);
    assert.match(web.title,language==='he'?/לאתר/:/Sign in/);
    assert.notEqual(gate.title,web.title);
  }
});
