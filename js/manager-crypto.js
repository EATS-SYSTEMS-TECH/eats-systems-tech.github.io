// Browser implementation of the existing SECURE_V4 primitives plus the
// explicitly versioned Manager W credential. No backend session-key access.
const utf8 = new TextEncoder();
const decode = new TextDecoder("utf-8", { fatal: true });
export const bytesHex = (bytes) =>
  [...new Uint8Array(bytes)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
export function hexBytes(value) {
  if (
    typeof value !== "string" ||
    value.length % 2 ||
    !/^[a-f0-9]*$/.test(value)
  )
    throw new Error("Invalid cryptographic field");
  return Uint8Array.from(value.match(/../g) ?? [], (v) => parseInt(v, 16));
}
const concat = (...arrays) => {
  const out = new Uint8Array(arrays.reduce((n, v) => n + v.length, 0));
  let i = 0;
  for (const v of arrays) {
    out.set(v, i);
    i += v.length;
  }
  return out;
};
export const randomHex = (length) =>
  bytesHex(crypto.getRandomValues(new Uint8Array(length)));
export const sha = async (value) =>
  new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      typeof value === "string" ? utf8.encode(value) : value,
    ),
  );
export async function hkdf(ikm, salt, info, length = 32) {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, [
    "deriveBits",
  ]);
  return new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: utf8.encode(info) },
      key,
      length * 8,
    ),
  );
}
export async function hmac(key, value) {
  const k = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, value));
}
const base64 = (bytes) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value) =>
  Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
async function aes(key, nonce, aad, value, decrypt = false) {
  const k = await crypto.subtle.importKey("raw", key, "AES-GCM", false, [
    decrypt ? "decrypt" : "encrypt",
  ]);
  return new Uint8Array(
    await crypto.subtle[decrypt ? "decrypt" : "encrypt"](
      {
        name: "AES-GCM",
        iv: nonce,
        additionalData: typeof aad === "string" ? utf8.encode(aad) : aad,
        tagLength: 128,
      },
      k,
      value,
    ),
  );
}
export function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value))
    return `[${value.map((v) => canonical(v ?? null)).join(",")}]`;
  const compare = (a, b) => {
    const x = utf8.encode(a),
      y = utf8.encode(b);
    for (let i = 0; i < Math.min(x.length, y.length); i++)
      if (x[i] !== y[i]) return x[i] - y[i];
    return x.length - y.length;
  };
  return `{${Object.keys(value)
    .filter((k) => value[k] !== undefined)
    .sort(compare)
    .map((k) => JSON.stringify(k) + ":" + canonical(value[k]))
    .join(",")}}`;
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let n = 0;
  for (let i = 0; i < a.length; i++) n |= a[i] ^ b[i];
  return n === 0;
}
function be(n, length) {
  const out = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    out[i] = n & 255;
    n = Math.floor(n / 256);
  }
  if (n) throw new Error("Integer too large");
  return out;
}
const pow = (base, exp, p) => {
  let result = 1n;
  for (base %= p; exp > 0n; exp >>= 1n, base = (base * base) % p)
    if (exp & 1n) result = (result * base) % p;
  return result;
};
export function uncompressed(publicHex) {
  if (/^04[a-f0-9]{128}$/.test(publicHex)) return hexBytes(publicHex);
  if (!/^(02|03)[a-f0-9]{64}$/.test(publicHex))
    throw new Error("Invalid device public key");
  const p = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffffn;
  const b = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;
  const x = BigInt("0x" + publicHex.slice(2));
  if (x >= p) throw new Error("Invalid curve point");
  const rhs = (((((x * x) % p) * x - 3n * x + b) % p) + p) % p;
  let y = pow(rhs, (p + 1n) / 4n, p);
  if ((y * y) % p !== rhs) throw new Error("Invalid curve point");
  if (Number(y & 1n) !== parseInt(publicHex.slice(0, 2), 16) % 2) y = p - y;
  return hexBytes("04" + publicHex.slice(2) + y.toString(16).padStart(64, "0"));
}

async function database() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open("wg-manager-keys", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("keys");
    r.onerror = () => reject(new Error("Secure key storage unavailable"));
    r.onsuccess = () => resolve(r.result);
  });
}
export async function managerKey(uid) {
  const db = await database();
  try {
    const read = await new Promise((resolve, reject) => {
      const r = db.transaction("keys").objectStore("keys").get(uid);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(new Error("Secure key storage unavailable"));
    });
    if (
      read?.privateKey?.extractable === false &&
      read.privateKey.algorithm.name === "ECDH" &&
      read.privateKey.algorithm.namedCurve === "P-256"
    )
      return read;
    const pair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      false,
      ["deriveBits"],
    );
    await new Promise((resolve, reject) => {
      const tx = db.transaction("keys", "readwrite");
      tx.objectStore("keys").put(pair, uid);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(new Error("Secure key storage unavailable"));
    });
    return pair;
  } finally {
    db.close();
  }
}

export async function managerHandshake({
  identity,
  keyPair,
  sessionId,
  grant,
}) {
  if (
    grant.grant.systemId !== identity.systemId ||
    grant.grant.keyId !== identity.keyId ||
    grant.grant.sessionId !== sessionId
  )
    throw new Error("Grant scope mismatch");
  const clientPub = bytesHex(
    await crypto.subtle.exportKey("raw", keyPair.publicKey),
  );
  if (clientPub !== grant.grant.clientPublicKey)
    throw new Error("Grant key mismatch");
  const device = await crypto.subtle.importKey(
    "raw",
    uncompressed(identity.devicePublicKey),
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: device },
      keyPair.privateKey,
      256,
    ),
  );
  const hash = await sha(grant.payload);
  const nonce = hexBytes(randomHex(16));
  const secret = await hkdf(
    shared,
    hash,
    `manager-credential-v1|${identity.systemId}|${sessionId}|${identity.keyId}`,
  );
  const blob = utf8.encode(canonical({ k: "W", h: bytesHex(hash) }));
  const info = (label) =>
    `${label}-v4|${identity.systemId}|${sessionId}|${identity.keyId}`;
  const credential = await aes(
    await hkdf(shared, nonce, info("client-cred-key")),
    await hkdf(shared, nonce, info("client-cred-nonce"), 12),
    `client_cred|${identity.systemId}|${sessionId}`,
    blob,
  );
  const state = {
    identity,
    sessionId,
    clientPub,
    nonce,
    shared,
    secret,
    credHash: bytesHex(await sha(blob)),
    info,
  };
  return {
    state,
    hello: {
      v: 4,
      type: "client_hello",
      sid: identity.systemId,
      keyId: identity.keyId,
      sessionId,
      clientPub,
      clientNonce: bytesHex(nonce),
      cred: base64(credential),
    },
  };
}

export async function completeManagerHandshake(state, envelope) {
  // Refusals are plaintext gate-message numbers, never a successful handshake.
  // Preserve only known public codes so the UI can explain how to recover.
  if (envelope?.type === "server_busy") throw new Error("BUSY");
  if (envelope?.type === "hello_error") {
    const code = new Map([
      [6, "KEY_MISMATCH"],
      [8, "SYSTEM_MISMATCH"],
      [10, "VERSION_UNSUPPORTED"],
      [202, "CREDENTIAL_REVOKED"],
      [203, "CREDENTIAL_UNKNOWN"],
    ]).get(envelope.reason);
    throw new Error(code ?? "GATE_AUTHENTICATION_FAILED");
  }
  const {
    identity,
    sessionId,
    clientPub,
    nonce,
    shared,
    secret,
    credHash,
    info,
  } = state;
  if (
    envelope.v !== 4 ||
    envelope.type !== "device_hello" ||
    envelope.sid !== identity.systemId ||
    envelope.sessionId !== sessionId ||
    (envelope.devicePub &&
      bytesHex(uncompressed(envelope.devicePub)) !==
        bytesHex(uncompressed(identity.devicePublicKey)))
  )
    throw new Error("Device hello mismatch");
  const helloNonce = await hkdf(shared, nonce, info("hello-nonce"), 12);
  if (envelope.nonce && !equal(hexBytes(envelope.nonce), helloNonce))
    throw new Error("Device nonce mismatch");
  const payload = JSON.parse(
    decode.decode(
      await aes(
        await hkdf(shared, nonce, info("hello-key")),
        helloNonce,
        `device_hello|${identity.systemId}|${sessionId}`,
        fromBase64(envelope.ct),
        true,
      ),
    ),
  );
  if (
    !/^[a-f0-9]{32}$/.test(payload.deviceNonce) ||
    payload.principal !== "ADMIN" ||
    payload.keyId !== identity.keyId
  )
    throw new Error("Invalid device principal");
  const fields = [
    identity.systemId,
    sessionId,
    identity.keyId,
    clientPub,
    bytesHex(nonce),
    identity.devicePublicKey,
    payload.deviceNonce,
    "W",
    credHash,
  ].join("|");
  const proof = await hmac(
    secret,
    utf8.encode("device-hello-proof-v4|" + fields),
  );
  if (!equal(hexBytes(payload.credProof), proof))
    throw new Error("Device proof mismatch");
  const transcriptHash = await sha("wifigate-ble-secure-v4|" + fields);
  const salt = concat(nonce, hexBytes(payload.deviceNonce));
  const session = {
    systemId: identity.systemId,
    sessionId,
    keyId: identity.keyId,
    transcriptHash,
    clientWriteKey: await hkdf(shared, salt, info("client-write-key")),
    deviceWriteKey: await hkdf(shared, salt, info("device-write-key")),
    clientNoncePrefix: await hkdf(shared, salt, info("client-nonce-prefix"), 8),
    deviceNoncePrefix: await hkdf(shared, salt, info("device-nonce-prefix"), 8),
    authKey: await hkdf(secret, transcriptHash, info("command-auth-key")),
    seq: 1,
    started: performance.now(),
  };
  shared.fill(0);
  secret.fill(0);
  return session;
}
export async function encryptManagerCommand(session, command) {
  const seq = session.seq;
  if (!Number.isInteger(seq) || seq < 1 || seq > 0xffffffff)
    throw new Error("Invalid sequence");
  const commandJson = canonical(command);
  const tag = await hmac(
    session.authKey,
    concat(
      utf8.encode("command-auth-v4"),
      session.transcriptHash,
      be(seq, 4),
      await sha(commandJson),
    ),
  );
  const nonce = concat(session.clientNoncePrefix, be(seq, 4));
  const ct = await aes(
    session.clientWriteKey,
    nonce,
    `frame|c2d|${session.systemId}|${session.sessionId}|${seq}`,
    utf8.encode(canonical({ command, authTag: bytesHex(tag) })),
  );
  const envelope = {
    v: 4,
    type: "frame",
    sid: session.systemId,
    sessionId: session.sessionId,
    seq,
    ct: base64(ct),
  };
  const text = JSON.stringify(envelope);
  if (utf8.encode(text).length + 1 > 2048)
    throw new Error("Control frame too large");
  return text;
}
export async function decryptManagerResponse(session, envelope) {
  if (
    envelope.v !== 4 ||
    envelope.type !== "frame" ||
    envelope.seq !== session.seq ||
    envelope.dir !== "d2c" ||
    envelope.sid !== session.systemId ||
    envelope.sessionId !== session.sessionId
  )
    throw new Error("Response metadata mismatch");
  const nonce = concat(session.deviceNoncePrefix, be(session.seq, 4));
  if (envelope.nonce && !equal(hexBytes(envelope.nonce), nonce))
    throw new Error("Response nonce mismatch");
  const response = JSON.parse(
    decode.decode(
      await aes(
        session.deviceWriteKey,
        nonce,
        `frame|d2c|${session.systemId}|${session.sessionId}|${session.seq}`,
        fromBase64(envelope.ct),
        true,
      ),
    ),
  );
  session.seq++;
  return response;
}
export function eraseManagerSession(session) {
  if (session)
    for (const value of Object.values(session))
      if (value instanceof Uint8Array) value.fill(0);
}

/** The existing Admin Bulk v1 wire format, with independent direction keys. */
export async function managerBulkFrame(session, direction, frame) {
  const {
    type,
    transferId,
    packetSeq,
    byteOffset,
    flagsOrValue = 0,
    plaintext = new Uint8Array(),
  } = frame;
  for (const n of [transferId, packetSeq, byteOffset])
    if (!Number.isInteger(n) || n < 0 || n > 0xffffffff)
      throw new Error("INVALID_BULK_FRAME");
  if (
    !transferId ||
    !packetSeq ||
    type < 1 ||
    type > 4 ||
    plaintext.length > 476 ||
    (type !== 1 && plaintext.length) ||
    !Number.isInteger(flagsOrValue) ||
    flagsOrValue < 0 ||
    flagsOrValue > 65535
  )
    throw new Error("INVALID_BULK_FRAME");
  const header = concat(
    new Uint8Array([0x57, 0x47, 1, type]),
    be(transferId, 4),
    be(packetSeq, 4),
    be(byteOffset, 4),
    be(plaintext.length, 2),
    be(flagsOrValue, 2),
  );
  const { key, noncePrefix, aadSuffix } = await bulkMaterial(
    session,
    direction,
    transferId,
  );
  return concat(
    header,
    await aes(
      key,
      concat(noncePrefix, be(packetSeq, 4)),
      concat(header, aadSuffix),
      plaintext,
    ),
  );
}
async function bulkMaterial(session, direction, transferId) {
  if (!["c2d", "d2c"].includes(direction)) throw new Error("INVALID_DIRECTION");
  const writeKey =
    direction === "c2d" ? session.clientWriteKey : session.deviceWriteKey;
  const label = (name) =>
    `${name}|${direction}|${session.systemId}|${session.sessionId}|${transferId}`;
  const system = utf8.encode(session.systemId);
  return {
    key: await hkdf(
      writeKey,
      session.transcriptHash,
      label("wifigate-admin-bulk-key-v1"),
    ),
    noncePrefix: await hkdf(
      writeKey,
      session.transcriptHash,
      label("wifigate-admin-bulk-nonce-v1"),
      8,
    ),
    aadSuffix: concat(
      be(system.length, 2),
      system,
      hexBytes(session.sessionId),
    ),
  };
}
export async function decryptManagerBulk(session, encoded) {
  if (
    encoded.length < 36 ||
    encoded.length > 512 ||
    encoded[0] !== 0x57 ||
    encoded[1] !== 0x47 ||
    encoded[2] !== 1
  )
    throw new Error("INVALID_BULK_FRAME");
  const view = new DataView(
      encoded.buffer,
      encoded.byteOffset,
      encoded.byteLength,
    ),
    type = encoded[3],
    transferId = view.getUint32(4),
    packetSeq = view.getUint32(8),
    byteOffset = view.getUint32(12),
    length = view.getUint16(16),
    flagsOrValue = view.getUint16(18);
  if (
    !transferId ||
    !packetSeq ||
    type < 1 ||
    type > 4 ||
    encoded.length !== length + 36 ||
    (type !== 1 && length)
  )
    throw new Error("INVALID_BULK_FRAME");
  const { key, noncePrefix, aadSuffix } = await bulkMaterial(
    session,
    "d2c",
    transferId,
  );
  const plaintext = await aes(
    key,
    concat(noncePrefix, be(packetSeq, 4)),
    concat(encoded.slice(0, 20), aadSuffix),
    encoded.slice(20),
    true,
  );
  return { type, transferId, packetSeq, byteOffset, flagsOrValue, plaintext };
}
