import test from "node:test";
import assert from "node:assert/strict";
import { prepareManagerFirmware } from "../js/manager-firmware-package.js";
import { canonical, sha, bytesHex } from "../js/manager-crypto.js";

export async function firmwareFixture() {
  const chunks = new Map(),
    entries = [];
  for (let index = 0; index < 10; index++) {
    const bytes = new Uint8Array(8).fill(index),
      fileName = `chunk-${index}.enc`;
    chunks.set(fileName, bytes);
    entries.push({
      index,
      fileName,
      plainOffset: index * 8,
      plainSize: 8,
      cipherSize: 8,
      nonce: index.toString(16).padStart(24, "0"),
      tag: "a".repeat(32),
      sha256: bytesHex(await sha(bytes)),
      downloadUrl: "https://example.invalid/unused",
    });
  }
  const manifest = {
    schema: "wifigate-fota-encrypted-v2",
    keyId: "synthetic",
    targetChip: "esp32c6",
    targetProfile: "development",
    version: "W.11.26.19",
    releaseCounter: 2026110019,
    secureVersion: 0,
    manifestAuth: "a".repeat(64),
    family: "W",
    flashVariantMb: 16,
    month: 11,
    year: 26,
    build: 19,
    firmwareFileName: "test.bin",
    firmwareSize: 80,
    firmwareSha256: "b".repeat(64),
    chunkCount: 10,
    encryption: {
      aad: "authenticated-v2",
      algorithm: "AES-256-GCM",
      nonceSize: 12,
      tagSize: 16,
    },
    chunks: entries,
  };
  return {
    manifest,
    chunks,
    status: {
      targetChip: "esp32c6",
      targetProfile: "development",
      flashVariantMb: 16,
      secureVersion: 0,
    },
  };
}
test("Manager sends the exact canonical encrypted mobile FOTA envelope without download metadata", async () => {
  const f = await firmwareFixture(),
    p = await prepareManagerFirmware(f.manifest, f.chunks, f.status);
  assert.deepEqual([...p.bytes.slice(0, 4)], [0x57, 0x47, 0x46, 0x31]);
  const count = new DataView(p.bytes.buffer).getUint32(4, false),
    text = new TextDecoder().decode(p.bytes.slice(8, 8 + count)),
    manifest = JSON.parse(text);
  assert.equal(text, canonical(manifest));
  assert.equal(
    manifest.chunks.some((c) => "downloadUrl" in c),
    false,
  );
  assert.equal(
    p.beginPayload.manifestSha256,
    bytesHex(await sha(p.bytes.slice(8, 8 + count))),
  );
  assert.equal(p.bytes.length, 8 + count + 80);
  assert.equal(p.beginPayload.version, "W.11.26.19");
});
test("Manager rejects wrong target, rollback security level, malformed chunks and ciphertext corruption before sending", async () => {
  for (const change of [
    (f) => (f.status.flashVariantMb = 8),
    (f) => (f.status.targetProfile = "production-secure"),
    (f) => (f.status.secureVersion = 1),
    (f) => (f.manifest.chunks[1].index = 0),
    (f) => (f.manifest.chunks[1].nonce = f.manifest.chunks[0].nonce),
    (f) => (f.manifest.chunks[1].plainOffset = 9),
    (f) => (f.chunks.get("chunk-0.enc")[0] = 99),
    (f) => (f.manifest.firmwareSize = 79),
    (f) => f.manifest.releaseCounter++,
    (f) => (f.manifest.encryption.extra = true),
    (f) => (f.manifest.chunks[0].fileName = "../secret"),
    (f) => (f.manifest.build = 999),
  ]) {
    const f = await firmwareFixture();
    change(f);
    await assert.rejects(
      prepareManagerFirmware(f.manifest, f.chunks, f.status),
      /INVALID_FIRMWARE_PACKAGE/,
    );
  }
});
