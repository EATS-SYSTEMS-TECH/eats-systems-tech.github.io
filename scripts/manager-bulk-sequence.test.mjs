import test from "node:test";
import assert from "node:assert/strict";
import {readFile, writeFile, mkdir, mkdtemp} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";
import {webcrypto, createDecipheriv, hkdfSync} from "node:crypto";
const ROOT = fileURLToPath(new URL("../", import.meta.url));
const LOGS = process.env.WG_REVIEW_LOG_ROOT ?? path.join(ROOT, ".codex-artifacts/logs/bulk-client-sequence");
const selected = process.env.WG_BULK_SITE_PREDECESSOR;
await mkdir(LOGS, {recursive: true});
const work = await mkdtemp(path.join(LOGS, "site-node-"));
async function source(name) {if (selected) {try {return await readFile(path.join(selected, name), "utf8");} catch {}} return readFile(path.join(ROOT, name), "utf8");}
const current = await source("js/manager-crypto.js"), shared = current.includes("export async function managerClientBulkFrame(");
for (const name of ["manager-crypto", "manager-connection", "manager-connection-timing", "manager-bulk-sequence"]) {
 let text = await source("js/"+name+".js");
 text = text.replaceAll('"./manager-crypto.js"', '"./manager-crypto.mjs"').replaceAll('"./manager-connection-timing.js"', '"./manager-connection-timing.mjs"').replaceAll('"./manager-bulk-sequence.js"', '"./manager-bulk-sequence.mjs"');
 if (name === "manager-bulk-sequence") text += "\nexport function seedForTest(owner,n){epochs.get(owner[epochHandle]).next=n;}\n";
 await writeFile(path.join(work, name+".mjs"), text);
}
const cryptoModule = await import(pathToFileURL(path.join(work, "manager-crypto.mjs")));
const epoch = await import(pathToFileURL(path.join(work, "manager-bulk-sequence.mjs")));
const {ManagerConnection} = await import(pathToFileURL(path.join(work, "manager-connection.mjs")));
let serial = 0;
function session() {const n=++serial;const s={systemId:"synthetic-system",sessionId:n.toString(16).padStart(16,"0"),transcriptHash:new Uint8Array(32).fill(n),clientWriteKey:new Uint8Array(32).fill(n+1),deviceWriteKey:new Uint8Array(32).fill(n+2)};return shared?epoch.beginBulkSendEpoch(s):s;}
const frame = {type:1,transferId:99,byteOffset:0,flagsOrValue:1,plaintext:Uint8Array.of(1)};
const seq = bytes => new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(8);
const next = (s,f=frame) => cryptoModule.managerClientBulkFrame(s,f);
function needsShared(t) {if(!shared){t.skip("Predecessor has no shared epoch wrapper");return false;}return true;}
function decodeClient(s, bytes) {
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.length),id=view.getUint32(4),n=view.getUint32(8),system=Buffer.from(s.systemId),sequence=Buffer.alloc(4);sequence.writeUInt32BE(n);
 const derive=(name,len)=>Buffer.from(hkdfSync("sha256",s.clientWriteKey,s.transcriptHash,`${name}|c2d|${s.systemId}|${s.sessionId}|${id}`,len));
 const cipher=createDecipheriv("aes-256-gcm",derive("wifigate-admin-bulk-key-v1",32),Buffer.concat([derive("wifigate-admin-bulk-nonce-v1",8),sequence]));
 cipher.setAAD(Buffer.concat([bytes.slice(0,20),Buffer.from([0,system.length]),system,Buffer.from(s.sessionId,"hex")]));cipher.setAuthTag(bytes.slice(-16));
 return {seq:n,id,offset:view.getUint32(12),type:bytes[3],plaintext:Buffer.concat([cipher.update(bytes.slice(20,-16)),cipher.final()])};
}

for (const order of ["export-export","export-import"]) test("actual website connection avoids repeated-ID c2d nonce reuse for "+order, async()=>{
 const c=new ManagerConnection({api:async()=>({}),user:{uid:"synthetic"}});c.session=session();c.capabilities={data:{limits:{maxUsers:1000,maxAdmins:20}}};
 const sent=[];let exportNumber=0,exportBytes,exportSent=false,chain=Promise.resolve(),received=Buffer.alloc(0);
 c.socket={send(bytes){chain=chain.then(async()=>{const f=decodeClient(c.session,bytes);sent.push(f);
  if(f.type===2&&!exportSent){exportSent=true;c.onBulk(await cryptoModule.managerBulkFrame(c.session,"d2c",{type:1,transferId:99,packetSeq:1,byteOffset:0,flagsOrValue:1,plaintext:exportBytes}));}
  if(f.type===1){received=Buffer.concat([received,f.plaintext]);c.onBulk(await cryptoModule.managerBulkFrame(c.session,"d2c",{type:2,transferId:99,packetSeq:1,byteOffset:received.length,flagsOrValue:8}));}
 });}};
 c.command=async(cmd)=>{
  if(cmd==="ADMIN_EXPORT_BEGIN"){exportSent=false;exportBytes=new TextEncoder().encode(JSON.stringify(["972","500000000","R".repeat(++exportNumber),"",0,0,0])+"\n");return{data:{transferId:99,recordCount:1}};}
  if(cmd==="ADMIN_EXPORT_FINISH"){await chain;return{data:{byteCount:exportBytes.length,recordCount:1,sha256:cryptoModule.bytesHex(await cryptoModule.sha(exportBytes))}};}
  if(cmd==="ADMIN_IMPORT_BEGIN")return{data:{transferId:99,acceptedOffset:0,maxPacketBytes:476,credits:8}};
  if(cmd==="ADMIN_IMPORT_VALIDATE"){await chain;return{data:{valid:true,rejected:0}};}
  if(cmd==="ADMIN_IMPORT_COMMIT")return{data:{created:1}};
  throw Error("Unexpected command "+cmd);
 };
 await c.exportCollection("USERS");await chain;
 if(order==="export-export")await c.exportCollection("USERS");else await c.importCollection("USERS","MERGE",[["972","500000000","New","",0,0,0]],1,async()=>true);
 await chain;assert.equal(new Set(sent.map(f=>f.seq)).size,sent.length,"every new c2d encryption under this ID/key must have a new nonce");
});

test("website concurrent DATA/ACK/NACK calls reserve before asynchronous derivation",async t=>{
 if(!needsShared(t))return;const s=session();const outputs=await Promise.all([next(s),next({...s},{...frame,type:2,plaintext:new Uint8Array()}),next(Object.assign({},s),{...frame,type:3,transferId:100,plaintext:new Uint8Array()})]);assert.deepEqual(outputs.map(seq),[1,2,3]);outputs.forEach(p=>decodeClient(s,p));
});
test("website unregistered/deep clones and erased aliases fail before encryption",async t=>{
 if(!needsShared(t))return;const s=session();for(const value of [{},structuredClone(s),JSON.parse(JSON.stringify(s))])await assert.rejects(next(value),/unavailable/);
 cryptoModule.eraseManagerSession({...s});await assert.rejects(next(s),/closed/);assert.ok(s.clientWriteKey.every(n=>n===0));
});

test("actual website connection close retires captured session aliases",async t=>{
 if(!needsShared(t))return;const s=session();
 const c=new ManagerConnection({api:async()=>({}),user:{uid:"synthetic"}});c.session=s;
 await c.close();assert.equal(c.session,null);assert.equal(c.closed,true);
 await assert.rejects(next({...s}),/closed/);assert.ok(s.clientWriteKey.every(n=>n===0));
});
test("website MAX is usable once; spread/carry cannot restart exhaustion",async t=>{
 if(!needsShared(t))return;const s=session();epoch.seedForTest(s,0xffffffff);assert.equal(seq(await next(s)),0xffffffff);await assert.rejects(next(epoch.carryBulkSendEpoch(s,{...s})),/exhausted/);assert.equal(seq(await next(session())),1);
});
test("website repeated completion ownership shares the pending epoch",async t=>{
 if(!needsShared(t))return;const state=epoch.beginBulkSendEpoch({}),a=epoch.carryBulkSendEpoch(state,{}),b=epoch.carryBulkSendEpoch({...state},{});assert.equal(epoch.reserveClientBulkSequence(a),1);epoch.beginBulkSendEpoch(state);assert.equal(epoch.reserveClientBulkSequence(b),2);
});

for(const stage of ["derive-failure","cipher-failure","close-derive","close-key-import","close-after-encrypt"])test("website "+stage+" burns its reservation and respects closure",async t=>{
 if(!needsShared(t))return;const s=session();let refused=false,encryptions=0;
 const original=globalThis.crypto;const proxy=new Proxy(webcrypto.subtle,{get(target,key){const method=Reflect.get(target,key);if(typeof method!=="function")return method;return async(...args)=>{
  if(key==="importKey"&&args[2]==="HKDF"&&!refused&&(stage==="derive-failure"||stage==="close-derive")){refused=true;if(stage==="derive-failure")throw Error("fixture derive refusal");const value=await method.apply(target,args);cryptoModule.eraseManagerSession(s);return value;}
  if(key==="importKey"&&args[2]==="AES-GCM"&&stage==="close-key-import"){const value=await method.apply(target,args);cryptoModule.eraseManagerSession(s);return value;}
  if(key==="encrypt"){encryptions++;if(stage==="cipher-failure"&&!refused){refused=true;throw Error("fixture cipher refusal");}const value=await method.apply(target,args);if(stage==="close-after-encrypt")cryptoModule.eraseManagerSession(s);return value;}
  return method.apply(target,args);
 };}});
 Object.defineProperty(globalThis,"crypto",{configurable:true,value:{subtle:proxy,getRandomValues:webcrypto.getRandomValues.bind(webcrypto)}});
 try{await assert.rejects(next(s),/refusal|closed/);
  if(stage.endsWith("failure"))assert.equal(seq(await next(s)),2);
  else {await assert.rejects(next({...s}),/closed/);assert.equal(encryptions,stage==="close-after-encrypt"?1:0);}
 }finally{Object.defineProperty(globalThis,"crypto",{configurable:true,value:original});}
});
