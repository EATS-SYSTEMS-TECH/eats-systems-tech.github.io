import test from "node:test";
import assert from "node:assert/strict";
import { createDecipheriv, hkdfSync } from "node:crypto";
import { ManagerConnection } from "../js/manager-connection.js";
import { managerBulkFrame, bytesHex, sha } from "../js/manager-crypto.js";
import { beginBulkSendEpoch } from "../js/manager-bulk-sequence.js";

const makeSession = () => beginBulkSendEpoch({
  systemId: "1234567890123456",
  sessionId: "0011223344556677",
  transcriptHash: new Uint8Array(32).fill(1),
  clientWriteKey: new Uint8Array(32).fill(2),
  deviceWriteKey: new Uint8Array(32).fill(3),
});

test("remaining transfer budget counts down without extending the hard session deadline", t => {
  let now=1000;t.mock.method(Date,"now",()=>now);
  const c=new ManagerConnection({api:async()=>({}),user:{uid:"fixture"}});
  c.session=makeSession();c.sessionDeadline=281000;
  assert.equal(c.remainingSessionMs(),280000);now+=60000;assert.equal(c.remainingSessionMs(),220000);
  now+=300000;assert.equal(c.remainingSessionMs(),0);assert.equal(c.sessionDeadline,281000);
  c.closed=true;now=1000;assert.equal(c.remainingSessionMs(),0);
});

test("import BEGIN waits for confirmed controller cleanup before creating the transfer", async (t) => {
  const c = new ManagerConnection({api: async()=>({}), user:{uid:"fixture"}});
  const payload = {collection:"USERS", expectedRevision:7, sha256:"a".repeat(64)};
  let calls=0, waits=0;
  t.mock.method(globalThis,"setTimeout",resolve=>{waits++;queueMicrotask(resolve);return 0;});
  c.command=async(name,body)=>{
    assert.equal(name,"ADMIN_IMPORT_BEGIN");assert.equal(body,payload);
    if(++calls<3)throw Object.assign(new Error("BUSY"),{code:"BUSY",field:"cleanup",firmwareRefusal:true});
    return {data:{transferId:42}};
  };
  assert.equal((await c.beginPreparedImport(payload)).data.transferId,42);
  assert.equal(calls,3);assert.equal(waits,2);
});

test("import preparation never retries timeouts, unverified errors or another busy resource", async () => {
  for(const error of [new Error("RESPONSE_TIMEOUT"),Object.assign(new Error("BUSY"),{code:"BUSY",field:"cleanup"}),Object.assign(new Error("BUSY"),{code:"BUSY",field:"collection",firmwareRefusal:true}),Object.assign(new Error("STORAGE_IO"),{code:"STORAGE_IO",field:"cleanup",firmwareRefusal:true})]){
    const c=new ManagerConnection({api:async()=>({}),user:{uid:"fixture"}});let calls=0;
    c.command=async()=>{calls++;throw error;};
    await assert.rejects(c.beginPreparedImport({}),e=>e===error);assert.equal(calls,1);
  }
});

test("import preparation is bounded to ninety seconds and stops when disconnected", async (t) => {
  let now=0, calls=0;
  t.mock.method(Date,"now",()=>now);
  t.mock.method(globalThis,"setTimeout",resolve=>{now+=500;queueMicrotask(resolve);return 0;});
  const c=new ManagerConnection({api:async()=>({}),user:{uid:"fixture"}});
  c.command=async()=>{calls++;throw Object.assign(new Error("BUSY"),{code:"BUSY",field:"cleanup",firmwareRefusal:true});};
  await assert.rejects(c.beginPreparedImport({}),/IMPORT_PREPARATION_TIMEOUT/);
  assert.equal(now,90000);assert.equal(calls,181);
  c.closed=true;await assert.rejects(c.beginPreparedImport({}),/DISCONNECTED/);assert.equal(calls,181);
});

for(const verified of [true,false])test(`Manager firmware bulk ${verified?"finishes after verification":"refuses FINISH on an unverified image"}`,async()=>{
  const c=new ManagerConnection({api:async()=>({}),user:{uid:"fixture"}});c.session=makeSession();
  const bytes=new Uint8Array(1800).map((_,i)=>i%251),expected=bytes.slice();
  let received=new Uint8Array(0),seq=1,chain=Promise.resolve(),finishes=0;
  c.socket={close(){},send:bytes=>{chain=chain.then(async()=>{
    const f=decodeClient(c.session,bytes);assert.equal(f.offset,received.length);assert.equal(f.type,1);assert.equal(f.id,99);
    const next=new Uint8Array(received.length+f.plain.length);next.set(received);next.set(f.plain,received.length);received=next;
    c.onBulk(await managerBulkFrame(c.session,"d2c",{type:2,transferId:99,packetSeq:seq++,byteOffset:received.length,flagsOrValue:4}));
  });}};
  c.command=async(cmd)=>{
    if(cmd==="ADMIN_FOTA_BEGIN")return{data:{transferId:99,acceptedOffset:0,maxPacketBytes:476,credits:4}};
    if(cmd==="ADMIN_FOTA_STATUS"){await chain;assert.deepEqual(received,expected);return{data:{state:verified?"READY":"RECEIVING",verifiedOffset:verified?expected.length:0}};}
    if(cmd==="ADMIN_FOTA_FINISH"){finishes++;return{data:{verified:true,targetVersion:"W.11.26.19"}};}throw new Error(cmd);
  };
  const run=c.updateFirmware({bytes,beginPayload:{manifestSha256:"a".repeat(64),version:"W.11.26.19"}});
  if(verified)await run;else await assert.rejects(run,/FOTA_NOT_VERIFIED/);
  await chain;assert.equal(finishes,verified?1:0);assert.equal(bytes.every(x=>x===0),true);assert.equal(c.transfer,false);assert.equal(c.closed,verified);
});

for(const outcome of ["lost-ack","refused","cancelled","unverified-ack"])test(`Firmware FINISH ${outcome} preserves the difference between restart uncertainty, refusal and cancellation`,async()=>{
  const states=[],commands=[],c=new ManagerConnection({api:async()=>({}),user:{uid:"fixture"},onState:state=>states.push(state)});c.session=makeSession();c.socket={close(){}};
  const bytes=new Uint8Array(20).fill(1);
  c.command=async name=>{
    commands.push(name);
    if(name==="ADMIN_FOTA_BEGIN")return{data:{transferId:2,acceptedOffset:20,maxPacketBytes:476,credits:4}};
    if(name==="ADMIN_FOTA_STATUS")return{data:{state:"READY",verifiedOffset:20}};
    if(outcome==="lost-ack"){c.fail(new Error("DISCONNECTED"));throw new Error("CANCELLED");}
    if(outcome==="cancelled"){c.close();throw new Error("CANCELLED");}
    if(outcome==="refused")throw Object.assign(new Error("STORAGE_IO"),{firmwareRefusal:true});
    return{data:{verified:false,targetVersion:"W.11.26.19"}};
  };
  const run=c.updateFirmware({bytes,beginPayload:{version:"W.11.26.19",manifestSha256:"a".repeat(64)}});
  if(outcome==="lost-ack")assert.deepEqual(await run,{data:{rebootUnconfirmed:true}});
  else await assert.rejects(run,outcome==="refused"?/STORAGE_IO/:outcome==="cancelled"?/CANCELLED/:/FOTA_NOT_VERIFIED/);
  assert.deepEqual(states,[]);assert.equal(commands.filter(x=>x==="ADMIN_FOTA_FINISH").length,1);assert.equal(bytes.every(x=>x===0),true);assert.equal(c.firmwareRebootExpected,false);
});

test("closing a Manager channel exposes one cancellation barrier without reopening authentication", async () => {
  let release;
  const calls = [];
  const connection = new ManagerConnection({
    user: { uid: "fixture" },
    WebSocketImpl: class {},
    api: (path) => {
      calls.push(path);
      return new Promise((resolve) => {
        release = resolve;
      });
    },
  });
  connection.requestId = "old-request";
  const barrier = connection.close();
  assert.equal(connection.closed, true);
  assert.equal(connection.close(), barrier);
  assert.deepEqual(calls, ["/connection-requests/old-request/cancel"]);
  release({ cancelled: true });
  await barrier;
});
function decodeClient(session, bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.length),
    id = view.getUint32(4),
    seq = view.getUint32(8);
  const kdf = (label, len) =>
    Buffer.from(
      hkdfSync(
        "sha256",
        session.clientWriteKey,
        session.transcriptHash,
        `${label}|c2d|${session.systemId}|${session.sessionId}|${id}`,
        len,
      ),
    );
  const seqBytes = Buffer.alloc(4);
  seqBytes.writeUInt32BE(seq);
  const sid = Buffer.from(session.systemId);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    kdf("wifigate-admin-bulk-key-v1", 32),
    Buffer.concat([kdf("wifigate-admin-bulk-nonce-v1", 8), seqBytes]),
  );
  decipher.setAAD(
    Buffer.concat([
      bytes.slice(0, 20),
      Buffer.from([0, sid.length]),
      sid,
      Buffer.from(session.sessionId, "hex"),
    ]),
  );
  decipher.setAuthTag(bytes.slice(-16));
  return {
    type: bytes[3],
    id,
    seq,
    offset: view.getUint32(12),
    value: view.getUint16(18),
    plain: Buffer.concat([
      decipher.update(bytes.slice(20, -16)),
      decipher.final(),
    ]),
  };
}
test("bulk capacity follows the gate's 8 MB/16 MB limits and keeps the admin limit separate", async () => {
  const c = new ManagerConnection({
    api: async () => ({}),
    user: { uid: "fixture" },
  });
  c.capabilities = { data: { limits: { maxUsers: 1000, maxAdmins: 20 } } };
  assert.equal(c.collectionCapacity("USERS"), 1000);
  assert.equal(c.collectionCapacity("ADMINS"), 20);
  await assert.rejects(
    c.importCollection(
      "USERS",
      "MERGE",
      Array(1001).fill([]),
      1,
      async () => true,
    ),
    /INVALID_IMPORT/,
  );
  await assert.rejects(
    c.importCollection(
      "ADMINS",
      "MERGE",
      Array(21).fill([]),
      1,
      async () => true,
    ),
    /INVALID_IMPORT/,
  );
  c.capabilities.data.limits.maxUsers = 5000;
  assert.equal(c.collectionCapacity("USERS"), 5000);
  delete c.capabilities;
  assert.throws(() => c.collectionCapacity("USERS"), /INVALID_CAPABILITIES/);
});
for (const accepted of [true, false])
  test(`Manager imports an encrypted staged collection with half-window ACKs and ${accepted ? "commits" : "cancels"} after validation`, async (t) => {
    const c = new ManagerConnection({
      api: async () => ({}),
      user: { uid: "fixture" },
    });
    c.session = makeSession();
    c.capabilities = { data: { limits: { maxUsers: 1000, maxAdmins: 20 } } };
    const rows = Array.from({ length: 250 }, (_, n) => [
      "972",
      String(500000000 + n),
      `Resident ${n}`,
      "",
      0,
      0,
      n,
    ]);
    const expected = Buffer.from(
      rows.map((r) => JSON.stringify(r) + "\n").join(""),
    );
    let received = Buffer.alloc(0),
      feedback = 1,
      lastClient = 0,
      inWindow = 0,
      grantedCredits = 8,
      chain = Promise.resolve(),
      commits = 0,
      aborts = 0;
    const commands = [];
    c.socket = {
      send: (bytes) => {
        chain = chain.then(async () => {
          const f = decodeClient(c.session, bytes);
          assert.equal(f.type, 1);
          assert.equal(f.id, 42);
          assert.equal(f.seq, ++lastClient);
          assert.equal(f.offset, received.length);
          received = Buffer.concat([received, f.plain]);
          inWindow++;
          if (inWindow === Math.max(1, Math.floor(grantedCredits / 2)) || f.value & 1) {
            inWindow = 0;
            grantedCredits = 20;
            c.onBulk(
              await managerBulkFrame(c.session, "d2c", {
                type: 2,
                transferId: 42,
                packetSeq: feedback++,
                byteOffset: received.length,
                flagsOrValue: grantedCredits,
              }),
            );
          }
        });
      },
    };
    c.command = async (cmd, payload) => {
      commands.push(cmd);
      if (cmd === "ADMIN_IMPORT_BEGIN") {
        assert.equal(payload.sha256, bytesHex(await sha(expected)));
        return {
          data: {
            transferId: 42,
            acceptedOffset: 0,
            maxPacketBytes: 476,
            credits: 8,
          },
        };
      }
      if (cmd === "ADMIN_IMPORT_VALIDATE") {
        await chain;
        assert.deepEqual(received, expected);
        assert.equal(payload.sha256, bytesHex(await sha(expected)));
        return { data: { valid: true, rejected: 0, accepted: rows.length } };
      }
      if (cmd === "ADMIN_IMPORT_COMMIT") {
        commits++;
        assert.equal(payload.expectedRevision, 7);
        assert.equal(payload.sha256, bytesHex(await sha(expected)));
        return { data: { created: rows.length } };
      }
      if (cmd === "ADMIN_IMPORT_ABORT") {
        aborts++;
        return { data: { aborted: true } };
      }
      if (cmd === "ADMIN_PING") return { data: {} };
      throw new Error(cmd);
    };
    const result = await c.importCollection(
      "USERS",
      "MERGE",
      rows,
      7,
      async () => {
        t.mock.timers.enable({ apis: ["setInterval"] });
        c.startHeartbeat();
        assert.equal(c.importAwaitingConfirmation, true);
        t.mock.timers.tick(45000);
        assert.equal(commands.filter(v => v === "ADMIN_PING").length, 4, "human confirmation must survive the controller's 30-second idle window");
        return accepted;
      },
    );
    await chain;
    assert.equal(commits, accepted ? 1 : 0);
    assert.equal(aborts, accepted ? 0 : 1);
    assert.equal(c.transfer, false);
    assert.equal(c.importAwaitingConfirmation, false);
    clearInterval(c.heartbeat);
    assert.equal(c.onBulk, null);
    if (accepted) assert.equal(result.created, 250);
    else assert.equal(result.cancelled, true);
  });
for (const credits of [0, 21, 1.5]) test(`Manager rejects invalid import credit grant ${credits} before sending data`, async () => {
  const c=new ManagerConnection({api:async()=>({}),user:{uid:"fixture"}});
  c.session=makeSession();c.capabilities={data:{limits:{maxUsers:1000,maxAdmins:20}}};
  let sent=0,aborted=0;
  c.socket={send(){sent++;}};
  c.command=async command=>{
    if(command==="ADMIN_IMPORT_BEGIN")return {data:{transferId:42,acceptedOffset:0,maxPacketBytes:476,credits}};
    if(command==="ADMIN_IMPORT_ABORT"){aborted++;return {data:{aborted:true}};}
    throw new Error(command);
  };
  await assert.rejects(c.importCollection("USERS","MERGE",[["972","500000001","Resident","",0,0,0]],7,async()=>true),/INVALID_IMPORT/);
  assert.equal(sent,0);assert.equal(aborted,1);assert.equal(c.transfer,false);
});

test("Manager verifies the complete encrypted export before returning any rows", async () => {
  const c = new ManagerConnection({
    api: async () => ({}),
    user: { uid: "fixture" },
  });
  c.session = makeSession();
  c.capabilities = { data: { limits: { maxUsers: 5000, maxAdmins: 20 } } };
  const rows = [["972", "500000000", "Test resident", "", 0, 0, 0]],
    bytes = new TextEncoder().encode(JSON.stringify(rows[0]) + "\n");
  let sent = false;
  c.socket = {
    send: async (data) => {
      const f = decodeClient(c.session, data);
      assert.equal(f.type, 2);
      if (!sent) {
        sent = true;
        c.onBulk(
          await managerBulkFrame(c.session, "d2c", {
            type: 1,
            transferId: 42,
            packetSeq: 1,
            byteOffset: 0,
            flagsOrValue: 1,
            plaintext: bytes,
          }),
        );
      }
    },
  };
  c.command = async (cmd) =>
    cmd === "ADMIN_EXPORT_BEGIN"
      ? { data: { transferId: 42, recordCount: 1 } }
      : {
          data: {
            byteCount: bytes.length,
            recordCount: 1,
            sha256: bytesHex(await sha(bytes)),
          },
        };
  assert.deepEqual(await c.exportCollection("USERS"), rows);
  assert.equal(c.transfer, false);
});

test("Manager export reads the paged list when the gate has no bulk index", async () => {
  const c = new ManagerConnection({ api: async () => ({}), user: { uid: "fixture" } });
  c.session = makeSession();
  c.capabilities = { data: { limits: { maxUsers: 5000, maxAdmins: 20, maxPageItems: 2 } } };
  const items = [{ name: "A" }, { name: "B" }, { name: "C" }];
  const calls = [];
  let stale = true;
  c.command = async (cmd, payload) => {
    calls.push([cmd, payload?.page?.cursor ?? null]);
    if (cmd === "ADMIN_EXPORT_BEGIN") throw new Error("UNSUPPORTED_COMMAND");
    assert.equal(cmd, "ADMIN_LIST_USERS");
    assert.equal(c.transfer, false);
    if (payload.page.cursor === "p2" && stale) {
      stale = false;
      throw new Error("STALE_CURSOR");
    }
    return payload.page.cursor === "p2"
      ? { data: { items: items.slice(2), page: { hasMore: false, nextCursor: null } } }
      : { data: { items: items.slice(0, 2), page: { hasMore: true, nextCursor: "p2" } } };
  };
  const exported = await c.exportCollection("USERS");
  assert.deepEqual([...exported], items);
  assert.equal(exported.paged, true);
  assert.deepEqual(calls.map(([cmd, cursor]) => `${cmd}:${cursor}`), [
    "ADMIN_EXPORT_BEGIN:null",
    "ADMIN_LIST_USERS:null",
    "ADMIN_LIST_USERS:p2",
    "ADMIN_LIST_USERS:null",
    "ADMIN_LIST_USERS:p2",
  ]);
  c.command = async () => { throw new Error("STORAGE_IO"); };
  await assert.rejects(c.exportCollection("USERS"), /STORAGE_IO/);
});


test("history allows a slow safe SD remount without changing other command waits", async () => {
  for (const [cmd, explicit, expected] of [["ADMIN_LIST_HISTORY", undefined, 35000], ["ADMIN_GET_STORAGE_HEALTH", undefined, 15000], ["ADMIN_GET_OVERVIEW", undefined, 15000], ["ADMIN_LIST_HISTORY", 2500, 2500]]) {
    const connection = new ManagerConnection({user: {}, WebSocketImpl: class {}, api: async () => ({})});
    connection.session = {...makeSession(), seq: 1, authKey: new Uint8Array(32), clientNoncePrefix: new Uint8Array(8)};
    let observed;
    connection.next = (_match, timeout) => {observed=timeout;throw new Error("FIXTURE_STOP");};
    await assert.rejects(connection.command(cmd, {}, explicit), /FIXTURE_STOP/);
    assert.equal(observed, expected, cmd);
    assert.equal(connection.busy, false);
  }
});

test("confirmation keep-alive admits only PING and leaves other controls blocked during import", async () => {
  const connection = new ManagerConnection({user: {}, api: async () => ({})});
  connection.session = {...makeSession(), seq: 1, authKey: new Uint8Array(32), clientNoncePrefix: new Uint8Array(8)};
  connection.transfer = true;
  connection.next = () => { throw new Error("REACHED_ENCRYPTED_SEND"); };
  await assert.rejects(connection.command("ADMIN_PING"), /BUSY/);
  connection.importAwaitingConfirmation = true;
  await assert.rejects(connection.command("ADMIN_PING"), /REACHED_ENCRYPTED_SEND/);
  await assert.rejects(connection.command("ADMIN_OPEN_GATE"), /BUSY/);
  connection.importAwaitingConfirmation = false;
  await assert.rejects(connection.command("ADMIN_PING"), /BUSY/);
});

for (const [error, transfer, expected] of [["RESPONSE_TIMEOUT", false, "SECURE_SESSION_EXPIRED"], ["RESPONSE_TIMEOUT", true, "RESPONSE_TIMEOUT"], ["INVALID_TAG", false, "INVALID_TAG"]])
  test(`heartbeat ${error} with transfer=${transfer} reports ${expected} without replaying a command`, async (t) => {
    t.mock.timers.enable({ apis: ["setInterval"] });
    const states = [], connection = new ManagerConnection({ user: {}, api: async () => ({}), onState: state => states.push(state) });
    connection.session = makeSession();
    connection.transfer = transfer;
    connection.importAwaitingConfirmation = transfer;
    let calls = 0;
    connection.command = async command => { assert.equal(command, "ADMIN_PING"); calls++; throw new Error(error); };
    connection.startHeartbeat();
    t.mock.timers.tick(10000);
    await Promise.resolve();
    await Promise.resolve();
    assert.deepEqual(states, [expected]);
    assert.equal(calls, 1);
    assert.equal(connection.closed, true);
  });

test("a user command waits for the idle keep-alive ping instead of failing BUSY", async () => {
  const connection = new ManagerConnection({user: {}, WebSocketImpl: class {}, api: async () => ({})});
  connection.session = {...makeSession(), seq: 1, authKey: new Uint8Array(32), clientNoncePrefix: new Uint8Array(8)};
  const order = [];
  let releasePing;
  connection.next = (match) => {
    const cmd = connection.pendingCommand;
    order.push(`send:${cmd}`);
    if (cmd === "ADMIN_PING") return new Promise((_, reject) => { releasePing = () => reject(new Error("PING_DONE")); });
    return Promise.reject(new Error(`DONE:${cmd}`));
  };
  connection.socket = {send() {}};
  // Encryption is asynchronous: wait for the ping to reach the socket rather
  // than for a fixed tick, which a loaded test runner can outlast.
  const until = async (ready) => { for (let i = 0; i < 500 && !ready(); i++) await new Promise((resolve) => setTimeout(resolve, 2)); };
  const ping = connection.command("ADMIN_PING", {}).catch((error) => error.message);
  await until(() => order.length === 1);
  const read = connection.command("ADMIN_GET_AUTO_OPEN_CONFIG", {}).catch((error) => error.message);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(order, ["send:ADMIN_PING"], "the read waits while the ping is in flight");
  releasePing();
  assert.equal(await ping, "PING_DONE");
  assert.equal(await read, "DONE:ADMIN_GET_AUTO_OPEN_CONFIG");
  assert.deepEqual(order, ["send:ADMIN_PING", "send:ADMIN_GET_AUTO_OPEN_CONFIG"]);
  // A second user command while one is in flight is still refused.
  connection.next = () => new Promise(() => {});
  void connection.command("ADMIN_GET_OVERVIEW", {});
  await new Promise((resolve) => setTimeout(resolve, 0));
  await assert.rejects(connection.command("ADMIN_GET_GATE_CONFIG", {}), /BUSY/);
});
