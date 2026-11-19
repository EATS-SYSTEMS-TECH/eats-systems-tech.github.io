import { canonical, sha, bytesHex } from "./manager-crypto.js";

const invalid = () => {
  throw new Error("INVALID_FIRMWARE_PACKAGE");
};
const hex = (value, length) =>
  typeof value === "string" &&
  value.length === length &&
  /^[0-9a-f]+$/.test(value);
const keys = [
  "schema",
  "keyId",
  "targetChip",
  "targetProfile",
  "version",
  "releaseCounter",
  "secureVersion",
  "manifestAuth",
  "family",
  "flashVariantMb",
  "month",
  "year",
  "build",
  "firmwareFileName",
  "firmwareSize",
  "firmwareSha256",
  "chunkCount",
];
// Packages contain ciphertext only. The gate independently authenticates the
// manifest, decrypts/verifies the image, enforces anti-rollback and selects OTA.
export async function describeManagerFirmware(manifest, status) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
    invalid();
  const m = manifest,
    version = /^W\.([1-9]|1[0-2])\.(\d{2})\.(\d{1,3})$/.exec(m.version ?? "");
  if (
    !version ||
    m.schema !== "wifigate-fota-encrypted-v2" ||
    m.family !== "W" ||
    m.targetChip !== "esp32c6" ||
    !["development", "production-secure"].includes(m.targetProfile) ||
    m.targetProfile !== status.targetProfile ||
    m.targetChip !== status.targetChip ||
    ![8, 16].includes(m.flashVariantMb) ||
    m.flashVariantMb !== status.flashVariantMb ||
    m.month !== Number(version[1]) ||
    m.year !== Number(version[2]) ||
    m.build !== Number(version[3]) ||
    m.build > 255 ||
    m.releaseCounter !==
      (2000 + m.year) * 1000000 + m.month * 10000 + m.build ||
    !Number.isInteger(m.secureVersion) ||
    m.secureVersion < 0 ||
    m.secureVersion > 16 ||
    m.secureVersion < (status.secureVersion ?? 0) ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(m.keyId ?? "") ||
    !hex(m.manifestAuth, 64) ||
    !hex(m.firmwareSha256, 64) ||
    !Number.isSafeInteger(m.firmwareSize) ||
    m.firmwareSize < 1 ||
    m.firmwareSize > 3 * 1024 * 1024 ||
    !/^(?=.{1,96}$)[A-Za-z0-9][A-Za-z0-9._-]*\.bin$/.test(
      m.firmwareFileName ?? "",
    ) ||
    m.chunkCount !== 10 ||
    !Array.isArray(m.chunks) ||
    m.chunks.length !== 10
  )
    invalid();
  if (
    canonical(m.encryption) !==
    canonical({
      aad: "authenticated-v2",
      algorithm: "AES-256-GCM",
      nonceSize: 12,
      tagSize: 16,
    })
  )
    invalid();
  const ordered = [...m.chunks].sort(
    (a, b) => (a?.index ?? -1) - (b?.index ?? -1),
  );
  let offset = 0;
  const nonces = new Set(),
    names = new Set();
  for (let i = 0; i < 10; i++) {
    const c = ordered[i];
    if (
      !c ||
      c.index !== i ||
      !Number.isSafeInteger(c.plainSize) ||
      c.plainSize < 1 ||
      c.plainOffset !== offset ||
      c.cipherSize !== c.plainSize ||
      !hex(c.nonce, 24) ||
      nonces.has(c.nonce) ||
      !hex(c.tag, 32) ||
      !hex(c.sha256, 64) ||
      typeof c.fileName !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/.test(c.fileName) ||
      names.has(c.fileName)
    )
      invalid();
    offset += c.plainSize;
    if (offset > m.firmwareSize) invalid();
    nonces.add(c.nonce);
    names.add(c.fileName);

  }
  if (offset !== m.firmwareSize) invalid();
  const document = Object.fromEntries(keys.map((key) => [key, m[key]]));
  document.encryption = m.encryption;
  document.chunks = ordered.map((c) =>
    Object.fromEntries(
      [
        "index",
        "fileName",
        "plainOffset",
        "plainSize",
        "cipherSize",
        "nonce",
        "tag",
        "sha256",
      ].map((key) => [key, c[key]]),
    ),
  );
  const manifestBytes = new TextEncoder().encode(canonical(document));
  if (manifestBytes.length > 32768) invalid();
  const manifestSha256 = bytesHex(await sha(manifestBytes));
  return {
    manifestBytes,
    ordered,
    beginPayload: {
      manifestByteCount: manifestBytes.length,
      manifestSha256,
      version: m.version,
      targetChip: m.targetChip,
      targetProfile: m.targetProfile,
      flashVariantMb: m.flashVariantMb,
      firmwareSize: m.firmwareSize,
      firmwareSha256: m.firmwareSha256,
      chunkCount: 10,
      releaseCounter: m.releaseCounter,
      secureVersion: m.secureVersion,
    },
  };
}

export async function prepareManagerFirmware(manifest, chunks, status) {
  const descriptor = await describeManagerFirmware(manifest, status);
  if (!(chunks instanceof Map) || chunks.size !== 10) invalid();
  const parts = [];
  for (const c of descriptor.ordered) {
    const bytes = chunks.get(c.fileName);
    if (!(bytes instanceof Uint8Array) || bytes.length !== c.cipherSize || bytesHex(await sha(bytes)) !== c.sha256) invalid();
    parts.push(bytes);
  }
  const bytes = new Uint8Array(8 + descriptor.manifestBytes.length + manifest.firmwareSize);
  bytes.set([0x57, 0x47, 0x46, 0x31]);
  new DataView(bytes.buffer).setUint32(4, descriptor.manifestBytes.length, false);
  bytes.set(descriptor.manifestBytes, 8);
  let at = 8 + descriptor.manifestBytes.length;
  for (const part of parts) { bytes.set(part, at); at += part.length; }
  return {bytes, beginPayload:descriptor.beginPayload};
}
