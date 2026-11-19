import test from "node:test";
import assert from "node:assert/strict";
import { createManagerFirmwareSource } from "../js/manager-firmware-source.js";
import { firmwareFixture } from "./manager-firmware-package.test.mjs";

async function fixture({corrupt=false,leave=false}={}) {
  const f=await firmwareFixture(),calls=[],releaseId="c".repeat(64);
  let current=true;
  const source=createManagerFirmwareSource({gateId:"12345",isCurrent:()=>current,request:async path=>{
    calls.push(path);
    if(path.includes('/latest?'))return{manifest:f.manifest,releaseId};
    const index=Number(/\/chunks\/(\d+)/.exec(path)[1]);
    const c=f.manifest.chunks[index];
    if(leave)current=false;
    return{releaseId,index,sha256:c.sha256,dataBase64:Buffer.from(corrupt?new Uint8Array(8).fill(99):f.chunks.get(c.fileName)).toString('base64')};
  }});
  return{...f,calls,source,releaseId};
}
test('Automatic FOTA uses only protected Manager routes, chooses the native channel and constructs the existing encrypted envelope',async()=>{
  const f=await fixture();
  const release=await f.source.latest(f.status);
  const p=await f.source.download(release,f.status);
  assert.equal(f.calls.length,11);
  assert.match(f.calls[0],/^\/gates\/12345\/firmware\/latest\?channel=dev&variant=16$/);
  assert.ok(f.calls.slice(1).every(p=>p.includes('version=W%2E11%2E26%2E19')&&!p.includes('http')));
  assert.equal(p.beginPayload.version,f.manifest.version);
  assert.deepEqual([...p.bytes.slice(0,4)],[87,71,70,49]);
});
test('Automatic FOTA refuses corrupted encrypted bytes and stops after navigation',async()=>{
  const corrupt=await fixture({corrupt:true});
  await assert.rejects(corrupt.source.download(await corrupt.source.latest(corrupt.status),corrupt.status),/INVALID_FIRMWARE_PACKAGE/);
  const leaving=await fixture({leave:true});
  await assert.rejects(leaving.source.download(await leaving.source.latest(leaving.status),leaving.status),/CANCELLED/);
  assert.equal(leaving.calls.length,2);
});
test('A malformed release or target never creates a chunk request',async()=>{
  let calls=0;
  const f=await fixture();
  const source=createManagerFirmwareSource({gateId:'12345',isCurrent:()=>true,request:async()=>{calls++;return{manifest:f.manifest,releaseId:'invalid'}}});
  await assert.rejects(source.latest(f.status),/INVALID_FIRMWARE_PACKAGE/);
  await assert.rejects(source.latest({...f.status,flashVariantMb:32}),/INVALID_FIRMWARE_PACKAGE/);
  assert.equal(calls,1);
});
