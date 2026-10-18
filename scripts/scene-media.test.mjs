import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as cheerio from "cheerio";
import { readSceneManifest, applyNicheSceneMedia, applyHomeSceneMedia } from "./scene-media.mjs";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

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
