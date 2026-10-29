import test from "node:test";
import assert from "node:assert/strict";
import { createDecipheriv, hkdfSync } from "node:crypto";
import { ManagerConnection } from "../js/manager-connection.js";
import { managerBulkFrame, bytesHex, sha } from "../js/manager-crypto.js";

const makeSession = () => ({
  systemId: "1234567890123456",
  sessionId: "0011223344556677",
  transcriptHash: new Uint8Array(32).fill(1),
  clientWriteKey: new Uint8Array(32).fill(2),
  deviceWriteKey: new Uint8Array(32).fill(3),
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
  test(`Manager imports an encrypted staged collection with half-window ACKs and ${accepted ? "commits" : "cancels"} after validation`, async () => {
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
          if (inWindow === 4 || f.value & 1) {
            inWindow = 0;
            c.onBulk(
              await managerBulkFrame(c.session, "d2c", {
                type: 2,
                transferId: 42,
                packetSeq: feedback++,
                byteOffset: received.length,
                flagsOrValue: 8,
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
      throw new Error(cmd);
    };
    const result = await c.importCollection(
      "USERS",
      "MERGE",
      rows,
      7,
      async () => accepted,
    );
    await chain;
    assert.equal(commits, accepted ? 1 : 0);
    assert.equal(aborts, accepted ? 0 : 1);
    assert.equal(c.transfer, false);
    assert.equal(c.onBulk, null);
    if (accepted) assert.equal(result.created, 250);
    else assert.equal(result.cancelled, true);
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
