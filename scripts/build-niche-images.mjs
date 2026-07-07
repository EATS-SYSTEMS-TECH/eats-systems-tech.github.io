// scripts/build-niche-images.mjs
// Generates optimized derivatives for the niche/use-case source PNGs in
// assets/wifigate_niche_pages/:
//   <key>-hero.webp  1280w  niche page hero image
//   <key>-card.webp   640w  homepage "where" section card
//   <key>-og.jpg   1200x630  Open Graph / social preview (cover crop)
// Source PNGs are kept untouched. Run after adding or replacing a source PNG:
//   node scripts/build-niche-images.mjs

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.join(process.cwd(), "assets", "wifigate_niche_pages");

async function main() {
  const entries = await fs.readdir(sourceDir);
  const sources = entries.filter(
    (name) => name.endsWith(".png") && !name.includes("-hero") && !name.includes("-card")
  );

  for (const name of sources) {
    const key = name.replace(/\.png$/, "");
    const sourceFile = path.join(sourceDir, name);

    const hero = await sharp(sourceFile)
      .resize({ width: 1280, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(path.join(sourceDir, `${key}-hero.webp`));

    const card = await sharp(sourceFile)
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(sourceDir, `${key}-card.webp`));

    const og = await sharp(sourceFile)
      .resize({ width: 1200, height: 630, fit: "cover", position: "attention" })
      .jpeg({ quality: 82 })
      .toFile(path.join(sourceDir, `${key}-og.jpg`));

    console.log(
      `${key}: hero ${hero.width}x${hero.height} (${Math.round(hero.size / 1024)}KB), ` +
        `card ${card.width}x${card.height} (${Math.round(card.size / 1024)}KB), ` +
        `og ${og.width}x${og.height} (${Math.round(og.size / 1024)}KB)`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
