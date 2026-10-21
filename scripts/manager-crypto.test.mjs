import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createDecipheriv,
  createCipheriv,
  createHmac,
  hkdfSync,
  createECDH,
  webcrypto,
} from "node:crypto";
import {
  bytesHex,
  hexBytes,
  hkdf,
  sha,
  hmac,
  canonical,
  uncompressed,
  managerHandshake,
  completeManagerHandshake,
  encryptManagerCommand,
  decryptManagerResponse,
  eraseManagerSession,
  managerBulkFrame,
  decryptManagerBulk,
} from "../js/manager-crypto.js";

const vectors = JSON.parse(
  await readFile(
    new URL("./fixtures/auth_v4_vectors.json", import.meta.url),
    "utf8",
  ),
);
const { inputs: i, expected: e } = vectors;
const b = (v) => Buffer.from(v, "hex");
const info = (label) => `${label}-v4|${i.systemId}|${i.sessionId}|${i.keyId}`;
test("Manager Bulk v1 header, nonce and authenticated metadata match independent Node crypto", async () => {
  const session = {
    systemId: i.systemId,
    sessionId: i.sessionId,
    clientWriteKey: b(e.clientWriteKey),
    deviceWriteKey: b(e.deviceWriteKey),
    transcriptHash: b("aa".repeat(32)),
  };
  const frame = {
    type: 1,
    transferId: 7,
    packetSeq: 3,
    byteOffset: 99,
    flagsOrValue: 1,
    plaintext: new TextEncoder().encode("שלום\n"),
  };
  const bytes = await managerBulkFrame(session, "d2c", frame);
  const header = bytes.slice(0, 20);
  assert.equal(
    Buffer.from(header).toString("hex"),
    "5747010100000007000000030000006300090001",
  );
  const key = Buffer.from(
    hkdfSync(
      "sha256",
      session.deviceWriteKey,
      session.transcriptHash,
      `wifigate-admin-bulk-key-v1|d2c|${i.systemId}|${i.sessionId}|7`,
      32,
    ),
  );
  const prefix = Buffer.from(
    hkdfSync(
      "sha256",
      session.deviceWriteKey,
      session.transcriptHash,
      `wifigate-admin-bulk-nonce-v1|d2c|${i.systemId}|${i.sessionId}|7`,
      8,
    ),
  );
  const d = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.concat([prefix, Buffer.from([0, 0, 0, 3])]),
  );
  const sid = Buffer.from(i.systemId);
  d.setAAD(
    Buffer.concat([header, Buffer.from([0, sid.length]), sid, b(i.sessionId)]),
  );
  d.setAuthTag(bytes.slice(-16));
  assert.deepEqual(
    Buffer.concat([d.update(bytes.slice(20, -16)), d.final()]),
    Buffer.from(frame.plaintext),
  );
  assert.deepEqual(
    (await decryptManagerBulk(session, bytes)).plaintext,
    frame.plaintext,
  );
  const altered = bytes.slice();
  altered[15]++;
  await assert.rejects(decryptManagerBulk(session, altered));
});
test("browser HKDF, curve decoding and command authentication match existing SECURE_V4 vectors", async () => {
  const ecdh = createECDH("prime256v1");
  ecdh.setPrivateKey(b(i.devicePrivateKey));
  assert.equal(
    bytesHex(uncompressed(i.devicePublicKey)),
    ecdh.getPublicKey("hex", "uncompressed"),
  );
  for (const [label, field, len] of [
    ["hello-key", "helloKey", 32],
    ["hello-nonce", "helloNonce", 12],
    ["client-cred-key", "credKey", 32],
    ["client-cred-nonce", "credNonce", 12],
  ])
    assert.equal(
      bytesHex(
        await hkdf(b(e.sharedSecret), b(i.clientNonce), info(label), len),
      ),
      e[field],
    );
  const c = e.cases ?? e.principals ?? e.credentials;
  const resident = (
    c ?? Object.values(e).find((v) => Array.isArray(v) && v[0]?.transcriptHash)
  ).find((v) => v.name === "resident-admin");
  const session = {
    systemId: i.systemId,
    sessionId: i.sessionId,
    seq: 1,
    transcriptHash: b(resident.transcriptHash),
    authKey: b(resident.authKey),
    clientWriteKey: b(e.clientWriteKey),
    clientNoncePrefix: b(e.clientNoncePrefix),
  };
  const frame = JSON.parse(
    await encryptManagerCommand(session, JSON.parse(i.command.canonicalJson)),
  );
  const ciphertext = Buffer.from(frame.ct, "base64"),
    nonce = Buffer.concat([b(e.clientNoncePrefix), Buffer.from([0, 0, 0, 1])]);
  const decipher = createDecipheriv("aes-256-gcm", b(e.clientWriteKey), nonce);
  decipher.setAAD(Buffer.from(`frame|c2d|${i.systemId}|${i.sessionId}|1`));
  decipher.setAuthTag(ciphertext.subarray(-16));
  const payload = JSON.parse(
    Buffer.concat([
      decipher.update(ciphertext.subarray(0, -16)),
      decipher.final(),
    ]),
  );
  assert.equal(payload.authTag, resident.authTag);
  assert.equal(canonical(payload.command), i.command.canonicalJson);
  assert.throws(() => uncompressed("02" + "ff".repeat(32)));
});
test("Manager W handshake proves the gate, encrypts traffic, rejects tampering and wipes session keys", async () => {
  const pair = await webcrypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"],
  );
  const identity = {
    systemId: i.systemId,
    keyId: i.keyId,
    devicePublicKey: i.devicePublicKey,
  };
  const pub = bytesHex(await webcrypto.subtle.exportKey("raw", pair.publicKey));
  const grant = {
    payload: "fixed Manager test grant",
    grant: { ...identity, clientPublicKey: pub, sessionId: i.sessionId },
  };
  const { hello, state } = await managerHandshake({
    identity,
    keyPair: pair,
    sessionId: i.sessionId,
    grant,
  });
  const device = createECDH("prime256v1");
  device.setPrivateKey(b(i.devicePrivateKey));
  const shared = device.computeSecret(b(hello.clientPub));
  const kdf = (salt, label, n = 32) =>
    Buffer.from(hkdfSync("sha256", shared, salt, info(label), n));
  const decrypt = (key, nonce, aad, ct) => {
    const c = Buffer.from(ct, "base64"),
      d = createDecipheriv("aes-256-gcm", key, nonce);
    d.setAAD(Buffer.from(aad));
    d.setAuthTag(c.subarray(-16));
    return Buffer.concat([d.update(c.subarray(0, -16)), d.final()]);
  };
  const encrypt = (key, nonce, aad, value) => {
    const c = createCipheriv("aes-256-gcm", key, nonce);
    c.setAAD(Buffer.from(aad));
    return Buffer.concat([
      c.update(Buffer.from(JSON.stringify(value))),
      c.final(),
      c.getAuthTag(),
    ]).toString("base64");
  };
  const nonce = b(hello.clientNonce),
    credential = decrypt(
      kdf(nonce, "client-cred-key"),
      kdf(nonce, "client-cred-nonce", 12),
      `client_cred|${i.systemId}|${i.sessionId}`,
      hello.cred,
    );
  assert.deepEqual(JSON.parse(credential), {
    h: bytesHex(await sha(grant.payload)),
    k: "W",
  });
  const secret = Buffer.from(
    hkdfSync(
      "sha256",
      shared,
      await sha(grant.payload),
      `manager-credential-v1|${i.systemId}|${i.sessionId}|${i.keyId}`,
      32,
    ),
  );
  const fields = [
    i.systemId,
    i.sessionId,
    i.keyId,
    hello.clientPub,
    hello.clientNonce,
    i.devicePublicKey,
    i.deviceNonce,
    "W",
    bytesHex(await sha(credential)),
  ].join("|");
  const credProof = createHmac("sha256", secret)
    .update("device-hello-proof-v4|" + fields)
    .digest("hex");
  const envelope = {
    v: 4,
    type: "device_hello",
    sid: i.systemId,
    sessionId: i.sessionId,
    devicePub: i.devicePublicKey,
    ct: encrypt(
      kdf(nonce, "hello-key"),
      kdf(nonce, "hello-nonce", 12),
      `device_hello|${i.systemId}|${i.sessionId}`,
      {
        keyId: i.keyId,
        deviceNonce: i.deviceNonce,
        credProof,
        principal: "ADMIN",
      },
    ),
  };
  const session = await completeManagerHandshake(state, envelope);
  const response = {
    v: 4,
    type: "frame",
    dir: "d2c",
    sid: i.systemId,
    sessionId: i.sessionId,
    seq: 1,
    ct: encrypt(
      session.deviceWriteKey,
      Buffer.concat([session.deviceNoncePrefix, Buffer.from([0, 0, 0, 1])]),
      `frame|d2c|${i.systemId}|${i.sessionId}|1`,
      { status: "OK", cmd: "ADMIN_PING" },
    ),
  };
  await assert.rejects(
    decryptManagerResponse(session, { ...response, seq: 2 }),
  );
  assert.equal((await decryptManagerResponse(session, response)).status, "OK");
  await assert.rejects(decryptManagerResponse(session, response));
  eraseManagerSession(session);
  assert.ok(session.authKey.every((n) => n === 0));
});
