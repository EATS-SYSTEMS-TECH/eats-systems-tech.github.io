import test from 'node:test';
import assert from 'node:assert/strict';
import {createManagerQrSource} from '../js/manager-qr-source.js';

test('QR label requests only its live gate through the authenticated API and refuses raw JSON or stale responses',async()=>{
  let current=true,calls=0,response={token:'WGQ.'+'a'.repeat(100)},pause;
  const payload={i:'12345',n:'WIFIGATE_12345'};
  const source=createManagerQrSource({gateId:'12345',isCurrent:()=>current,request:async(path,method,body)=>{
    calls++;assert.equal(path,'/gates/12345/qr-label');assert.equal(method,'POST');assert.deepEqual(body,{payload});
    if(pause)await pause;return response;
  }});
  assert.equal(await source(payload),response.token);
  for(const token of [JSON.stringify(payload),'foreign-qr','WGQ.short','WGQ.'+'a'.repeat(3000),null]){
    response={token};await assert.rejects(source(payload),/INVALID_RESPONSE/);
  }
  const before=calls;await assert.rejects(source({...payload,i:'foreign'}),/INVALID_RESPONSE/);assert.equal(calls,before);
  response={token:'WGQ.'+'a'.repeat(100)};let finish;pause=new Promise(r=>finish=r);
  const pending=source(payload);current=false;finish();await assert.rejects(pending,/CANCELLED/);
  await assert.rejects(source(payload),/CANCELLED/);
});
