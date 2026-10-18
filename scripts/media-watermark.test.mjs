import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import { applyMediaWatermarks, WATERMARK_ASSET, WATERMARK_SHA256 } from "./media-watermark.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";
import { LANDING_PAGES } from "./landing-pages/index.mjs";

const root = new URL("../", import.meta.url);
const raster = /\.(?:webp|png|jpe?g|avif)(?:\?|$)/i;

test("supplied watermark PNG is delivered byte-for-byte with a hash-bound CSS URL", async () => {
  const bytes = await fs.readFile(new URL(WATERMARK_ASSET, root));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), WATERMARK_SHA256);
  const css = await fs.readFile(new URL("css/media-watermark.css", root), "utf8");
  assert.ok(css.includes(`../${WATERMARK_ASSET}?v=${WATERMARK_SHA256.slice(0, 12)}`));
  assert.match(css, /right: 12px;/);
  assert.match(css, /bottom: 12px;/);
  assert.doesNotMatch(css, /inset-inline|direction:/, "physical lower-right is independent of language");
  assert.match(css, /pointer-events: none;/);
});

test("one decorative frame layer covers both poster and video without touching their attributes or controls", () => {
  const $ = cheerio.load('<html><head></head><body class="home-en"><main><section id="home"><div class="hero__media"><picture data-scene-picture><source media="(min-width:769px)" srcset="desktop.webp"><img class="hero__bg--image" src="mobile.webp" alt="Arrival"></picture><video data-media-variants="{&quot;mobile&quot;:{}}" muted playsinline></video><button id="replay">Replay</button></div></section><img class="security-statement__media-image" src="statement.webp" width="1536" height="1024" alt="Private entrance"><img class="feature-card__image" src="icon.svg"></main><header><img src="logo.webp"><img src="flag.png"></header></body></html>');
  const originalMedia = $("picture, video, button").toArray().map(node => $(node).toString());
  applyMediaWatermarks($, { assetPrefix: "../../" });
  assert.deepEqual($("picture, video, button").toArray().map(node => $(node).toString()), originalMedia);
  assert.equal($("[data-media-watermark]").length, 2);
  assert.equal($("[data-media-watermark][aria-hidden='true']").length, 2);
  assert.equal($("[data-media-watermark]").children().length, 0, "background decoration adds no announced or focusable content");
  assert.equal($("header [data-media-watermark], .feature-card__image [data-media-watermark]").length, 0);
  assert.equal($(".media-watermark-image.security-statement__media-image").length, 1, "original grid placement stays on its frame");
  const first = $.html();
  applyMediaWatermarks($, { assetPrefix: "../../" });
  assert.equal($.html(), first, "rendering is idempotent");
});

test("static Shabbat and public automation photos receive the same layer; utility pages add no unused assets", () => {
  for (const bodyClass of ["niche-page", "niche-page wa-page"]) {
    const $ = cheerio.load(`<html><head></head><body class="${bodyClass}"><main><div class="niche-hero__media"><img src="suite.webp"></div></main></body></html>`);
    applyMediaWatermarks($, { assetPrefix: "../../" });
    assert.equal($("[data-media-watermark-frame] > [data-media-watermark]").length, 1);
  }
  const $ = cheerio.load('<html><head></head><body><main><img class="brand" src="logo.webp"></main></body></html>');
  const original = $.html();
  applyMediaWatermarks($, { assetPrefix: "../" });
  assert.equal($.html(), original);
});

test("all 507 localized consumer and public marketing pages cover every displayed photo and video exactly once", async () => {
  let pages = 0, frames = 0;
  const keys = ["", ...NICHE_DEFINITIONS.map(item => item.key), ...LANDING_PAGES.map(item => item.key), "automation"];
  for (const { code } of SITE_LANGUAGES) for (const key of keys) {
    const relative = path.posix.join(code === "en" ? "" : code.toLowerCase(), key, "index.html");
    const $ = cheerio.load(await fs.readFile(new URL(relative, root), "utf8"));
    const photos = $("main img").toArray().filter(node => raster.test($(node).attr("src") || ""));
    assert.equal(photos.length, key ? 1 : 7, `${relative}: current photo inventory is explicit`);
    for (const element of [...photos, ...$("main video").toArray()]) {
      const frame = $(element).closest("[data-media-watermark-frame]");
      assert.equal(frame.length, 1, `${relative}: photo/video has one frame`);
      assert.equal(frame.children("[data-media-watermark][aria-hidden='true']").length, 1, `${relative}: one decorative layer per frame`);
    }
    assert.equal($("[data-media-watermark]").length, key ? 1 : 7, `${relative}: no duplicate video/poster watermarks`);
    assert.equal($("link[data-media-watermark-style]").length, 1);
    assert.equal($("header [data-media-watermark], footer [data-media-watermark]").length, 0);
    frames += $("[data-media-watermark]").length;
    pages++;
  }
  assert.equal(pages, 507);
  assert.equal(frames, 741);
});
