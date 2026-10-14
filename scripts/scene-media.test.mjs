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
    for (const change of [{ audioTracks: 1 }, { motionReviewed: false }, { matchingFirstFrameReviewed: false }, { durationSeconds: 30 }, { fastStart: false }]) {
      await save({ ...scene, ...change });
      await assert.rejects(readSceneManifest(root), /acceptance incomplete/);
    }
    await save({ ...scene, video: { ...scene.video, path: "../owner-file.mp4" } });
    await assert.rejects(readSceneManifest(root), /artifact path/);
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

test("homepage private access media leaves the Host section byte-identical", () => {
  const $ = cheerio.load('<html><head></head><body><section id="private-access"><div><img class="security-statement__media-image" alt="Arrival" width="1536" height="1024"></div></section><section id="guest-invites-api"><h2>WIFIGATE Host</h2><img src="original-host.webp"></section></body></html>');
  const host = $("#guest-invites-api").toString();
  applyHomeSceneMedia($, { scene: { poster: { path: "assets/img/private-access-scene.webp" }, video: { path: "assets/vid/home/private-access-720p.mp4" } },
    assetPrefix: "../", copy: { play: "Play", pause: "Pause", replay: "Replay" } });
  assert.equal($("#guest-invites-api").toString(), host);
  assert.equal($("#private-access [data-scene-video]").length, 1);
  assert.equal($("#private-access [data-scene-image]").attr("alt"), "Arrival");
  assert.equal($("#private-access video").attr("src"), undefined);
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
