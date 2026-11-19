import { describeManagerFirmware, prepareManagerFirmware } from "./manager-firmware-package.js";

// Same published dev/prod, 8/16 MB channels as the mobile app. Only the
// authenticated Manager API is used; release URLs and keys never enter the UI.
export function createManagerFirmwareSource({ request, gateId, isCurrent }) {
  const base = `/gates/${encodeURIComponent(gateId)}/firmware`;
  const current = () => { if (!isCurrent()) throw new Error("CANCELLED"); };
  const target = status => {
    if (![8,16].includes(status.flashVariantMb) || !["development","production-secure"].includes(status.targetProfile) || status.targetChip !== "esp32c6") throw new Error("INVALID_FIRMWARE_PACKAGE");
    return new URLSearchParams({channel:status.targetProfile === "production-secure" ? "prod" : "dev",variant:String(status.flashVariantMb)});
  };
  return {
    async latest(status) {
      current();
      const result = await request(`${base}/latest?${target(status)}`);
      current();
      if (!/^[a-f0-9]{64}$/.test(result?.releaseId ?? "")) throw new Error("INVALID_FIRMWARE_PACKAGE");
      await describeManagerFirmware(result.manifest,status);
      current();
      return result;
    },
    async download(release,status,onProgress = () => {}) {
      current();
      const {ordered} = await describeManagerFirmware(release.manifest,status);
      const chunks = new Map();
      try {
        for (const c of ordered) {
          const query = target(status);
          query.set("version",release.manifest.version);
          query.set("releaseId",release.releaseId);
          // The existing API path allowlist permits percent-encoded versions.
          const encoded = query.toString().replaceAll(".","%2E");
          const result = await request(`${base}/chunks/${c.index}?${encoded}`);
          current();
          if (result?.releaseId !== release.releaseId || result?.index !== c.index || result?.sha256 !== c.sha256 || typeof result.dataBase64 !== "string" || result.dataBase64.length !== 4 * Math.ceil(c.cipherSize / 3) || !/^[A-Za-z0-9+/]*={0,2}$/.test(result.dataBase64)) throw new Error("INVALID_FIRMWARE_PACKAGE");
          let binary;
          try { binary = atob(result.dataBase64); } catch { throw new Error("INVALID_FIRMWARE_PACKAGE"); }
          if (binary.length !== c.cipherSize) throw new Error("INVALID_FIRMWARE_PACKAGE");
          const bytes = Uint8Array.from(binary,ch=>ch.charCodeAt(0));
          chunks.set(c.fileName,bytes);
          onProgress(c.index + 1,10);
        }
        current();
        return await prepareManagerFirmware(release.manifest,chunks,status);
      } finally {
        for (const bytes of chunks.values()) bytes.fill(0);
        chunks.clear();
      }
    },
  };
}
