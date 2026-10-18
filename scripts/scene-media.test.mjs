import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import { readSceneManifest, applyNicheSceneMedia, applyHomeSceneMedia, sceneAssetUrl } from "./scene-media.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

test("existing scene styles and controllers receive the current asset version without duplicates", () => {
  for (const existingController of [false, true]) {
    const $ = cheerio.load(`<html><head><link rel="stylesheet" href="../css/scene-video.css?v=20261018b"><script src="../js/hero.js?v=20261018b" defer></script><script src="../js/media-runtime.js?v=old" defer></script>${existingController ? '<script src="../js/scene-video.js?v=20261018b" defer></script>' : ""}</head><body><section class="niche-hero"><div class="niche-hero__media"><img id="niche-image"></div></section></body></html>`);
    applyNicheSceneMedia($, { scene: { poster: { path: "assets/img/scene.webp" }, video: { path: "assets/vid/use-cases/roller-shutters-720p.mp4" } }, assetPrefix: "../../", copy: { play: "Play", pause: "Pause", replay: "Replay" } });
    assert.equal($("link[href*='scene-video.css']").length, 1);
    assert.equal($("link[href*='scene-video.css']").attr("href"), "../../css/scene-video.css?v=20261018c");
    for (const name of ["hero", "scene-video", "media-runtime"]) {
      assert.equal($(`script[src*='js/${name}.js']`).length, 1);
      assert.equal($(`script[src*='js/${name}.js']`).attr("src"), `../../js/${name}.js?v=20261018c`);
    }
  }
});

test("media cache versions follow delivered artifact hashes across home, hotel and niche renderers", () => {
  const scene = { key: "homepage-montage",
    video: { path: "assets/vid/home/homepage-montage-720p.mp4", sha256: hash("new video") },
    poster: { path: "assets/img/homepage-montage-scene.webp", sha256: hash("new first frame") } };
  const $ = cheerio.load('<html><head></head><body><section id="home" class="hero"><img class="hero__bg--image"><video id="hero-video"></video></section><section id="guest-invites-api"><figure class="automation-stay"><img alt="Guests"></figure></section><section class="niche-hero"><div class="niche-hero__media"><img id="niche-image"></div></section></body></html>');
  const copy = { play: "Play", pause: "Pause", replay: "Replay" };
  applyHomeSceneMedia($, { scene, hotelScene: scene, assetPrefix: "../", copy });
  applyNicheSceneMedia($, { scene, assetPrefix: "../../", copy });
  const imageUrl = "../" + scene.poster.path + "?v=" + scene.poster.sha256.slice(0, 12);
  const videoUrl = "../" + scene.video.path + "?v=" + scene.video.sha256.slice(0, 12);
  assert.equal($("#home img").attr("src"), imageUrl);
  assert.equal($("#hero-video").attr("data-video-src"), videoUrl);
  assert.equal($("#hero-video").attr("poster"), imageUrl);
  assert.equal($("#guest-invites-api video").attr("data-video-src"), videoUrl);
  assert.equal($("#guest-invites-api video").attr("poster"), $("#guest-invites-api img").attr("src"));
  assert.equal($(".niche-hero video").attr("data-video-src"), "../" + videoUrl);
  assert.equal($(".niche-hero video").attr("poster"), $("#niche-image").attr("src"));
  assert.notEqual(sceneAssetUrl("../", { ...scene.video, sha256: hash("replacement video") }), videoUrl, "replacing bytes invalidates old video cache");
  assert.notEqual(sceneAssetUrl("../", { ...scene.poster, sha256: hash("replacement poster") }), imageUrl, "poster has its own independent cache identity");
  assert.equal(scene.video.path.includes("?"), false, "manifest retains plain filesystem paths");
});

test("responsive renderer provides native selected posters and inert video variants", () => {
  const mobile = { accepted: true, video: { path: "assets/vid/use-cases/roller-shutters-720p.mp4", sha256: hash("mobile") }, poster: { path: "assets/wifigate_niche_pages/roller-shutters-scene-hero.webp", sha256: hash("mobile poster") }, width: 1280, height: 720 };
  const desktop = { ...mobile, video: { path: "assets/vid/use-cases/desktop/roller-shutters-1080p.mp4", sha256: hash("desktop") }, poster: { path: "assets/wifigate_niche_pages/desktop/roller-shutters-scene-hero.webp", sha256: hash("desktop poster") }, width: 1920, height: 1080 };
  const $ = cheerio.load('<html><head></head><body><section class="niche-hero"><div class="niche-hero__media"><img id="niche-image" alt="Gate"></div></section></body></html>');
  applyNicheSceneMedia($, { scene: { ...mobile, variants: { mobile, desktop } }, assetPrefix: "../../", copy: { play: "Play", pause: "Pause", replay: "Replay" } });
  const variants = JSON.parse($("video").attr("data-media-variants"));
  assert.equal($("video").attr("src"), undefined, "neither variant is downloaded before playback policy permits");
  assert.equal($("video").attr("poster"), undefined, "video cannot preload the fallback poster before viewport selection");
  assert.equal($("source[media='(min-width: 769px)']").attr("srcset"), variants.desktop.poster);
  assert.equal($("source[media='(max-width: 768px)']").attr("srcset"), variants.mobile.poster);
  assert.equal($("picture img").attr("alt"), "Gate");
  assert.equal(variants.desktop.width, 1920);
  assert.equal($("script[src*='media-runtime.js']").length, 1);
});

test("accepted desktop Auto Open replaces only its existing feature media and remains explicit mobile fallback", () => {
  const artifact = { accepted: true, video: { path: "assets/vid/home/desktop/auto-open-futuristic-1080p.mp4", sha256: hash("auto desktop") }, poster: { path: "assets/img/desktop/auto-open-futuristic-scene.webp", sha256: hash("auto first frame") }, width: 1920, height: 1080 };
  const $ = cheerio.load('<html><head></head><body><article class="feature-card--auto-open"><figure class="feature-card__media"><img class="feature-card__image" src="auto_open.svg" alt="Auto Open"></figure><h3>Automatic arrival</h3><p>Keep both hands free.</p></article><article class="other"><img src="other.svg"><h3>Other feature</h3></article></body></html>');
  const other = $(".other").toString();
  applyHomeSceneMedia($, { autoOpenScene: { key: "auto-open-futuristic", ...artifact, variants: { desktop: artifact } }, assetPrefix: "../", copy: { play: "Play", pause: "Pause", replay: "Replay" } });
  assert.equal($(".other").toString(), other);
  assert.equal($("h3").first().text(), "Automatic arrival"); assert.equal($("p").text(), "Keep both hands free.");
  assert.equal($("[data-scene-image]").attr("alt"), "Auto Open");
  const variants = JSON.parse($("video").attr("data-media-variants"));
  assert.deepEqual(variants.mobile, variants.desktop, "no invented mobile clip; both choices bind accepted desktop poster/video");
  assert.equal($("video").attr("src"), undefined);
});

test("schema2 accepts reviewed1080p variants, ignores pending variants and protects legacy fallback", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "wifigate-variant-manifest-"));
  try {
    const mobileBytes = Buffer.from("reviewed mobile"), desktopBytes = Buffer.from("reviewed desktop"), posterBytes = Buffer.from("first frame");
    const make = (desktop) => ({ accepted: true, video: { path: `assets/vid/use-cases/${desktop ? "desktop/" : ""}roller-shutters-${desktop ? "1080p" : "720p"}.mp4`, sha256: hash(desktop ? desktopBytes : mobileBytes) }, poster: { path: `assets/wifigate_niche_pages/${desktop ? "desktop/" : ""}roller-shutters-scene-hero.webp`, sha256: hash(posterBytes) }, width: desktop ? 1920 : 1280, height: desktop ? 1080 : 720, durationSeconds: 10, codec: "h264", audioTracks: 0, fastStart: true, motionReviewed: true, matchingFirstFrameReviewed: true });
    const mobile = make(false), desktop = make(true), scene = { ...mobile, key: "roller-shutters", variants: { mobile, desktop } };
    for (const artifact of [mobile, desktop]) for (const field of ["video", "poster"]) {
      const file = path.join(root, artifact[field].path); await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, field === "poster" ? posterBytes : artifact === mobile ? mobileBytes : desktopBytes);
    }
    const save = (value, schemaVersion = 2) => fs.writeFile(path.join(root, "assets/vid/scene-manifest.json"), JSON.stringify({ schemaVersion, scenes: [value] }));
    await save(scene); assert.equal((await readSceneManifest(root)).get(scene.key).variants.desktop.width, 1920);
    await save({ ...scene, variants: { desktop: { ...desktop, width: 1918 } } }); assert.equal((await readSceneManifest(root)).get(scene.key).variants.desktop.width, 1918, "native near16:9 source pixels remain unpadded");
    await save({ ...scene, variants: { desktop: { ...desktop, width: 1919 } } }); await assert.rejects(readSceneManifest(root), /acceptance incomplete/, "delivery must retain even native frame dimensions");
    await save({ ...scene, variants: { desktop: { accepted: false } } }); assert.equal((await readSceneManifest(root)).size, 1, "pending variant does not invalidate existing accepted fallback");
    await save({ ...scene, variants: { desktop: { ...desktop, matchingFirstFrameReviewed: false } } }); await assert.rejects(readSceneManifest(root), /acceptance incomplete/);
    await save({ ...scene, variants: { mobile: desktop } }); await assert.rejects(readSceneManifest(root), /acceptance incomplete/);
    await save({ ...scene, variants: { tablet: desktop } }); await assert.rejects(readSceneManifest(root), /Invalid scene variants/);
    await save(scene, 1); await assert.rejects(readSceneManifest(root), /Invalid scene variants/);
    await save({ ...scene, variants: { desktop } }); await fs.appendFile(path.join(root, desktop.video.path), "altered"); await assert.rejects(readSceneManifest(root), /changed after acceptance/);
  } finally {
    assert.equal(path.dirname(root), path.resolve(os.tmpdir())); assert.ok(path.basename(root).startsWith("wifigate-variant-manifest-")); await fs.rm(root, { recursive: true, force: true });
  }
});

test("only accepted, unchanged scene artifacts enter pages", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "wifigate-scene-manifest-"));
  try {
    assert.equal((await readSceneManifest(root)).size, 0);
    await fs.mkdir(path.join(root, "assets", "vid", "use-cases"), { recursive: true });
    await fs.mkdir(path.join(root, "assets", "wifigate_niche_pages"), { recursive: true });
    const video = Buffer.from("video fixture: decoder/motion acceptance is separate");
    const poster = Buffer.from("poster fixture");
    const scene = { key: "roller-shutters", accepted: true,
      video: { path: "assets/vid/use-cases/roller-shutters-720p.mp4", sha256: hash(video) },
      poster: { path: "assets/wifigate_niche_pages/roller-shutters-scene-hero.webp", sha256: hash(poster) },
      width: 1280, height: 720, durationSeconds: 5, codec: "h264", audioTracks: 0,
      fastStart: true, motionReviewed: true, matchingFirstFrameReviewed: true };
    const manifest = path.join(root, "assets", "vid", "scene-manifest.json");
    const save = (entry) => fs.writeFile(manifest, JSON.stringify({ schemaVersion: 1, scenes: [entry] }));
    await fs.writeFile(path.join(root, scene.video.path), video);
    await fs.writeFile(path.join(root, scene.poster.path), poster);
    await save(scene);
    assert.equal((await readSceneManifest(root)).size, 1);
    await save({ ...scene, durationSeconds: 8 });
    assert.equal((await readSceneManifest(root)).get("roller-shutters").durationSeconds, 8, "natural longer action is accepted");
    for (const change of [{ audioTracks: 1 }, { motionReviewed: false }, { matchingFirstFrameReviewed: false }, { durationSeconds: 30 }, { fastStart: false }]) {
      await save({ ...scene, ...change });
      await assert.rejects(readSceneManifest(root), /acceptance incomplete/);
    }
    await save({ ...scene, video: { ...scene.video, path: "../owner-file.mp4" } });
    await assert.rejects(readSceneManifest(root), /artifact path/);
    await save({ ...scene, key: "private-access" });
    await assert.rejects(readSceneManifest(root), /scene key/, "courier is excluded from the current video selection");
    await fs.mkdir(path.join(root, "assets", "vid", "home"), { recursive: true });
    const montage = { ...scene, key: "homepage-montage", durationSeconds: 15,
      video: { ...scene.video, path: "assets/vid/home/homepage-montage-720p.mp4" } };
    await fs.writeFile(path.join(root, montage.video.path), video);
    await save(montage);
    assert.equal((await readSceneManifest(root)).get("homepage-montage").durationSeconds, 15);
    await save({ ...montage, durationSeconds: 16 });
    await assert.rejects(readSceneManifest(root), /acceptance incomplete/);
    await save(scene);
    await fs.appendFile(path.join(root, scene.video.path), "changed");
    await assert.rejects(readSceneManifest(root), /changed after acceptance/);
    await save({ ...scene, accepted: false });
    assert.equal((await readSceneManifest(root)).size, 0);
  } finally {
    if (path.dirname(path.resolve(root)) !== path.resolve(os.tmpdir()) || !path.basename(root).startsWith("wifigate-scene-manifest-")) {
      throw new Error("Fixture cleanup target is outside its temporary directory");
    }
    await fs.rm(root, { recursive: true, force: true });
  }
});

test("homepage montage and reused hotel scene leave the courier static and retain localized content", () => {
  const $ = cheerio.load(`<html><head></head><body><section id="home" class="hero"><div class="hero__media"><img class="hero__bg--image"><video id="hero-video" loop><source src="old.mp4"></video><button id="hero-mute-toggle"></button><button id="hero-pause-toggle"></button><button id="hero-replay" hidden></button></div><h1>One app.</h1></section>
    <section id="private-access"><img class="security-statement__media-image" src="courier.webp" alt="Arrival"></section>
    <section id="guest-invites-api"><h2>WIFIGATE Host</h2><figure class="automation-stay"><img alt="Guests enter"><figcaption>Booking received</figcaption></figure></section></body></html>`);
  const courier = $("#private-access").toString();
  applyHomeSceneMedia($, { scene: { key: "homepage-montage", poster: { path: "assets/img/homepage-montage-scene.webp" }, video: { path: "assets/vid/home/homepage-montage-720p.mp4" } },
    hotelScene: { poster: { path: "assets/wifigate_niche_pages/hotels-airbnb-scene-hero.webp" }, video: { path: "assets/vid/use-cases/hotels-airbnb-720p.mp4" } },
    assetPrefix: "../", copy: { play: "Play", pause: "Pause", replay: "Replay" } });
  assert.equal($("#private-access").toString(), courier);
  assert.equal($("#home h1").text(), "One app.");
  assert.equal($("#home").attr("data-hero-scene"), "homepage-montage");
  assert.equal($("#hero-video").attr("src"), undefined);
  assert.equal($("#hero-video source").length, 0);
  assert.equal($("#hero-video").attr("loop"), undefined);
  assert.equal($("#hero-video").attr("data-silent"), "true");
  assert.equal($("#hero-video").attr("poster"), $("#home img").attr("src"));
  assert.ok($("#hero-mute-toggle").is("[hidden]"));
  assert.equal($("#guest-invites-api [data-scene-video]").length, 1);
  assert.equal($("#guest-invites-api h2").text(), "WIFIGATE Host");
  assert.equal($("#guest-invites-api figcaption").text(), "Booking received");
  assert.equal($("#guest-invites-api video").attr("src"), undefined);
  assert.equal($("#guest-invites-api [data-scene-image]").attr("alt"), "Guests enter");
});

test("localized niche media preserves the image, has no automatic source, and stays out of absent scenes", () => {
  const $ = cheerio.load('<html><head></head><body><section class="niche-hero"><div class="niche-hero__media"><img id="niche-image" alt="תיאור התמונה"><div class="niche-hero__overlay"></div></div></section></body></html>');
  const original = $.html();
  applyNicheSceneMedia($, {});
  assert.equal($.html(), original);
  applyNicheSceneMedia($, { scene: { poster: { path: "assets/img/scene.webp" }, video: { path: "assets/vid/use-cases/roller-shutters-720p.mp4" } },
    assetPrefix: "../../", copy: { play: "הפעלת הסרטון", pause: "השהיית הסרטון", replay: "נגן שוב" } });
  assert.equal($("#niche-image").attr("alt"), "תיאור התמונה");
  assert.equal($(".niche-hero__media").children().first().attr("id"), "niche-image");
  assert.equal($("video").attr("src"), undefined);
  assert.equal($("video").attr("poster"), $("#niche-image").attr("src"));
  assert.equal($("video").attr("preload"), "none");
  assert.equal($("video").attr("aria-hidden"), "true");
  assert.equal($("[data-scene-play]").text(), "הפעלת הסרטון");
  assert.equal($("script[src*=scene-video]").length, 1);
});
