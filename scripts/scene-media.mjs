import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";

const sceneKeys = new Set(["homepage-montage", "electric-gates-barrier", ...NICHE_DEFINITIONS.map(({ key }) => key)]);

// Only a reviewed artifact and its matching poster may enter generated pages.
export async function readSceneManifest(repoRoot) {
  const file = path.join(repoRoot, "assets", "vid", "scene-manifest.json");
  let document;
  try { document = JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return new Map(); throw error; }
  if (document.schemaVersion !== 1 || !Array.isArray(document.scenes)) throw new Error("Invalid scene media manifest");
  const scenes = new Map();
  for (const scene of document.scenes) {
    if (!scene.accepted) continue;
    if (!sceneKeys.has(scene.key) || scenes.has(scene.key)) throw new Error("Invalid or duplicate scene key");
    for (const field of ["video", "poster"]) {
      const asset = scene[field];
      const expected = field === "video" ? /^assets\/vid\/(use-cases|home)\/[a-z-]+-720p\.mp4$/ : /^assets\/(wifigate_niche_pages|img)\/[a-z0-9-]+\.(webp|png)$/;
      if (!asset || !expected.test(asset.path) || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw new Error("Invalid scene artifact path/hash");
      if (field === "video" && path.posix.basename(asset.path) !== `${scene.key}-720p.mp4`) throw new Error("Scene/video identity mismatch");
      const bytes = await fs.readFile(path.join(repoRoot, ...asset.path.split("/")));
      if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256) throw new Error(`Scene artifact changed after acceptance: ${scene.key}`);
      const maxBytes = scene.key === "homepage-montage" ? 8_000_000 : 3_000_000;
      if (field === "video" && bytes.length > maxBytes) throw new Error(`Scene clip exceeds delivery budget: ${scene.key}`);
    }
    const validDuration = scene.key === "homepage-montage"
      ? Math.abs(scene.durationSeconds - 15) <= 0.05
      : Number.isFinite(scene.durationSeconds) && scene.durationSeconds >= 4 && scene.durationSeconds <= 12;
    if (scene.width !== 1280 || scene.height !== 720 || !validDuration
      || scene.codec !== "h264" || scene.audioTracks !== 0 || !scene.fastStart
      || !scene.motionReviewed || !scene.matchingFirstFrameReviewed) throw new Error(`Scene acceptance incomplete: ${scene.key}`);
    scenes.set(scene.key, scene);
  }
  return scenes;
}

// Validated production artifacts carry a SHA; small direct renderer fixtures may omit it.
// Keep filesystem manifest paths plain and bind browser caches to delivered bytes.
export function sceneAssetUrl(assetPrefix, asset) {
  const version = /^[a-f0-9]{64}$/.test(asset.sha256 || "") ? "?v=" + asset.sha256.slice(0, 12) : "";
  return assetPrefix + asset.path + version;
}

function attachSceneAssets($, assetPrefix) {
  if (!$("link[href*='scene-video.css']").length) {
    $("head").append($("<link>").attr("rel", "stylesheet").attr("href", `${assetPrefix}css/scene-video.css?v=20261018b`));
    $("head").append($("<script>").attr("src", `${assetPrefix}js/scene-video.js?v=20261018b`).attr("defer", ""));
  }
}

function attachScene($, { scene, assetPrefix, copy, image, container, media }) {
  if (!["play", "pause", "replay"].every((key) => typeof copy?.[key] === "string" && copy[key].trim())) throw new Error("Missing localized scene controls");
  image.attr("src", sceneAssetUrl(assetPrefix, scene.poster)).attr("data-scene-image", "");
  container.attr("data-scene-video", "").attr("data-scene-state", "image");
  const video = $("<video>")
    .attr("data-video-src", sceneAssetUrl(assetPrefix, scene.video))
    .attr("poster", sceneAssetUrl(assetPrefix, scene.poster))
    .attr("preload", "none").attr("muted", "").attr("playsinline", "")
    .attr("aria-hidden", "true").attr("width", "1280").attr("height", "720");
  image.after(video);
  const controls = $("<div>").addClass("scene-video-controls");
  controls.append($("<button>").attr("type", "button").attr("data-scene-play", "").text(copy.play));
  controls.append($("<button>").attr("type", "button").attr("data-scene-pause", "").attr("hidden", "").text(copy.pause));
  // Controls stay above the tint overlay; the video remains under it with the image.
  media.append(controls);
  container.append($("<script>").attr("type", "application/json").attr("data-scene-copy", "").text(JSON.stringify(copy).replace(/</g, "\\u003c")));
  attachSceneAssets($, assetPrefix);
}

export function applyNicheSceneMedia($, { scene, assetPrefix, copy }) {
  if (!scene) return;
  attachScene($, { scene, assetPrefix, copy, image: $("#niche-image"), container: $(".niche-hero"), media: $(".niche-hero__media") });
  // Keep playback beside the existing previous/next actions in the overlay.
  const pager = $(".niche-hero__pager");
  if (pager.length === 1) pager.prepend($(".niche-hero__media > .scene-video-controls"));
}

export function applyHomeSceneMedia($, { scene, hotelScene, assetPrefix, copy }) {
  if (scene) {
    const hero = $("#home.hero");
    const image = hero.find("img.hero__bg--image");
    const video = hero.find("#hero-video");
    if (hero.length !== 1 || image.length !== 1 || video.length !== 1) throw new Error("Homepage hero media is missing");
    hero.attr("data-hero-scene", scene.key).attr("data-hero-media-state", "image");
    image.attr("src", sceneAssetUrl(assetPrefix, scene.poster)).attr("width", "1280").attr("height", "720");
    video.empty().removeAttr("src loop").attr("data-video-src", sceneAssetUrl(assetPrefix, scene.video))
      .attr("data-silent", "true").attr("poster", image.attr("src"))
      .attr("width", "1280").attr("height", "720");
    hero.find("#hero-mute-toggle").attr("hidden", "");
    hero.find("#hero-pause-toggle").attr("hidden", "");
    hero.find("#hero-replay").removeAttr("hidden");
    attachSceneAssets($, assetPrefix);
  }
  if (hotelScene) {
    const figure = $("#guest-invites-api .automation-stay");
    const image = figure.children("img");
    if (figure.length !== 1 || image.length !== 1) throw new Error("Hospitality scene image is missing");
    const media = $("<div>").addClass("automation-stay__media");
    image.before(media);
    media.append(image.attr("width", "1280").attr("height", "720"));
    attachScene($, { scene: hotelScene, assetPrefix, copy, image, container: media, media });
  }
}
