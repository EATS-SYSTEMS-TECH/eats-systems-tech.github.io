import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import { applyMediaWatermarks, WATERMARK_ASSET, WATERMARK_SHA256, WATERMARK_VERSION } from "./media-watermark.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";
import { LANDING_PAGES } from "./landing-pages/index.mjs";
import { AUTO_OPEN_PAGE_KEY } from "./auto-open-page.mjs";

const root = new URL("../", import.meta.url);

test("unchanged supplied PNG has a faint physical bottom-right layer shown only in a video state", async () => {
  const bytes = await fs.readFile(new URL(WATERMARK_ASSET, root));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), WATERMARK_SHA256);
  const css = await fs.readFile(new URL("css/media-watermark.css", root), "utf8");
  assert.ok(css.includes(`../${WATERMARK_ASSET}?v=${WATERMARK_SHA256.slice(0, 12)}`));
  assert.match(css, /right:\s*12px;/);
  assert.match(css, /bottom:\s*12px;/);
  assert.match(css, /bottom:\s*8px;/);
  assert.match(css, /opacity:\s*(?:\.3|0\.3);/);
  assert.match(css, /\.media-watermark\s*\{[^}]*display:\s*none;/s, "Posters and no-JavaScript fallbacks have no visible watermark");
  assert.match(css, /\[data-hero-media-state=["']video["']\][^{]*\.media-watermark/);
  assert.match(css, /\[data-scene-state=["']video["']\][^{]*\.media-watermark/);
  assert.doesNotMatch(css, /inset-inline|direction:|html:not|a11y-fab|3\.75rem/, "The accessibility button must not move the physical corner");
  assert.match(css, /pointer-events:\s*none;/);
});

test("only a video frame gets one decorative layer; static photos retain their original elements and layout classes", () => {
  const $ = cheerio.load('<html><head></head><body class="home-en"><main><section id="home" class="hero" data-hero-scene="homepage-montage" data-hero-media-state="image"><div class="hero__media"><picture data-scene-picture><source media="(min-width:769px)" srcset="desktop.webp"><img class="hero__bg--image" src="mobile.webp" alt="Arrival"></picture><video data-video-src="scene.mp4" data-media-variants="{&quot;mobile&quot;:{}}" muted playsinline></video><button id="replay">Replay</button></div></section><img class="security-statement__media-image" src="statement.webp" width="1536" height="1024" alt="Private entrance"><div class="automation-stay__media"><picture><source srcset="host.webp"><img src="host.webp"></picture></div><div class="where-media"><img src="where.webp"></div><figure class="product-overview__figure"><img src="product.png"></figure><img class="feature-card__image" src="icon.svg"></main><header><img src="logo.webp"><img src="flag.png"></header></body></html>');
  const originalMedia = $("picture, img, video, button").toArray().map(node => $(node).toString());
  applyMediaWatermarks($, { assetPrefix: "../../" });
  assert.deepEqual($("picture, img, video, button").toArray().map(node => $(node).toString()), originalMedia);
  assert.equal($("[data-media-watermark]").length, 1);
  assert.equal($("[data-media-watermark-frame]").length, 1);
  assert.equal($(".hero__media > [data-media-watermark][aria-hidden='true']").length, 1);
  assert.equal($("[data-media-watermark]").children().length, 0, "Decoration adds no announced or focusable content");
  assert.equal($("header [data-media-watermark], .automation-stay__media [data-media-watermark], .where-media [data-media-watermark], .product-overview__figure [data-media-watermark]").length, 0);
  assert.equal($("img.security-statement__media-image").length, 1, "Static grid photo keeps its original element");
  assert.equal($(".media-watermark-image.security-statement__media-image").length, 0, "Static grid photos need no added frame");
  assert.equal($("link[data-media-watermark-style]").attr("href"), `../../css/media-watermark.css?v=${WATERMARK_VERSION}`);
  const first = $.html();
  applyMediaWatermarks($, { assetPrefix: "../../" });
  assert.equal($.html(), first, "Rendering is idempotent");
});

test("static marketing and utility pages add no watermark elements, wrappers or unused stylesheet", () => {
  for (const bodyClass of ["niche-page", "niche-page wa-page", "home-en", ""]) {
    const $ = cheerio.load(`<html><head></head><body class="${bodyClass}"><main><div class="niche-hero__media"><img src="suite.webp"></div><img class="security-statement__media-image" src="statement.webp"><img class="brand" src="logo.webp"></main></body></html>`);
    const original = $.html();
    applyMediaWatermarks($, { assetPrefix: "../../" });
    assert.equal($.html(), original, "A photo-only page remains byte-identical after this rendering step");
  }
});

test("all 546 localized consumer pages contain exactly 507 video-only layers; every static Shabbat page has none", async () => {
  let pages = 0, frames = 0, staticPages = 0;
  const keys = ["", ...NICHE_DEFINITIONS.map(item => item.key), ...LANDING_PAGES.map(item => item.key), "wifigate-host", AUTO_OPEN_PAGE_KEY];
  for (const { code } of SITE_LANGUAGES) for (const key of keys) {
    const relative = path.posix.join(code === "en" ? "" : code.toLowerCase(), key, "index.html");
    const $ = cheerio.load(await fs.readFile(new URL(relative, root), "utf8"));
    const videos = $("main video");
    const expected = videos.length;
    assert.equal(expected, LANDING_PAGES.some(item => item.key === key) ? 0 : 1, `${relative}: current video inventory is explicit`);
    assert.equal($("[data-media-watermark-frame]").length, expected, `${relative}: only video frames own a layer`);
    assert.equal($("[data-media-watermark]").length, expected, `${relative}: no static-photo or duplicate poster layer`);
    for (const element of videos.toArray()) {
      const frame = $(element).closest("[data-media-watermark-frame]");
      assert.equal(frame.length, 1, `${relative}: video has one containing frame`);
      assert.equal(frame.children("[data-media-watermark][aria-hidden='true']").length, 1, `${relative}: exactly one decorative layer`);
      const owner = frame.closest("[data-scene-video], [data-hero-scene]");
      assert.equal(owner.length, 1, `${relative}: layer follows the playback owner's state`);
      assert.equal(owner.attr(key ? "data-scene-state" : "data-hero-media-state"), "image", `${relative}: initial poster is unmarked`);
    }
    if (!key) {
      assert.equal($("[data-media-watermark-frame]").is(".hero__media"), true);
      assert.match($(".feature-card--auto-open img").attr("src"), /auto_open\.svg(?:\?|$)/);
      assert.equal($(".feature-card--auto-open [data-media-watermark], .feature-card--auto-open video, .automation-stay__media [data-media-watermark], .where-media [data-media-watermark], .product-overview__figure [data-media-watermark]").length, 0);
      assert.equal($("img.security-statement__media-image").length, 2, "Both static security photos keep their original elements");
    }
    assert.equal($("link[data-media-watermark-style]").length, expected ? 1 : 0, `${relative}: static-only pages request no overlay CSS`);
    assert.equal($("header [data-media-watermark], footer [data-media-watermark]").length, 0);
    if (!expected) staticPages++;
    frames += $("[data-media-watermark]").length;
    pages++;
  }
  assert.equal(pages, 546);
  assert.equal(staticPages, 39);
  assert.equal(frames, 507);
});
