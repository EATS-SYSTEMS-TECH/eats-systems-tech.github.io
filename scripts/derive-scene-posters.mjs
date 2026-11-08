// scripts/derive-scene-posters.mjs
// Lighter copies of the accepted scene posters, cut from them and never
// replacing them: a 640x720 centre crop for portrait phones (the hero shows
// only the middle of the 1280 px poster there) and an AVIF of the desktop
// poster. assets/img/derived-posters/index.json binds each copy to the exact
// accepted poster it was made from; the builder ignores a copy whose source
// poster changed. Run after accepting new scene media:
//   node scripts/derive-scene-posters.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = "assets/img/derived-posters";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const read = (file) => fs.readFile(path.join(repoRoot, ...file.split("/")));

const manifest = JSON.parse(await read("assets/vid/scene-manifest.json"));
const entries = {};
const write = async (name, bytes) => {
  const file = `${outDir}/${name}`;
  await fs.writeFile(path.join(repoRoot, ...file.split("/")), bytes);
  return { path: file, sha256: sha256(bytes) };
};
await fs.mkdir(path.join(repoRoot, ...outDir.split("/")), { recursive: true });

for (const scene of manifest.scenes) {
  if (!scene.accepted) continue;
  for (const [variant, artifact] of Object.entries(scene.variants || {})) {
    if (!artifact?.accepted || entries[artifact.poster.path]) continue;
    const source = await read(artifact.poster.path);
    if (sha256(source) !== artifact.poster.sha256) throw new Error(`Accepted poster changed: ${artifact.poster.path}`);
    const { width, height } = await sharp(source).metadata();
    const entry = { source: artifact.poster };
    if (variant === "mobile" && width === 1280 && height === 720) {
      const crop = await sharp(source).extract({ left: 320, top: 0, width: 640, height: 720 }).webp({ quality: 82, effort: 6 }).toBuffer();
      entry.portrait = { ...(await write(`${scene.key}-portrait.webp`, crop)), width: 640, height: 720 };
    }
    if (variant === "desktop") {
      const avif = await sharp(source).avif({ quality: 65, effort: 6 }).toBuffer();
      if (avif.length < source.length) entry.avif = { ...(await write(`${scene.key}-desktop.avif`, avif)), width, height };
    }
    if (entry.portrait || entry.avif) entries[artifact.poster.path] = entry;
  }
}
await fs.writeFile(path.join(repoRoot, ...outDir.split("/"), "index.json"), JSON.stringify({ schemaVersion: 1, posters: entries }, null, 2) + "\n");
console.log(`Derived posters: ${Object.keys(entries).length} accepted posters in ${outDir}`);
