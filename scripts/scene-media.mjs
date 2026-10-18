import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";

const sceneKeys = new Set(["homepage-montage", "electric-gates-barrier", "auto-open-futuristic", ...NICHE_DEFINITIONS.map(({ key }) => key)]);

// Only a reviewed artifact and its matching poster may enter generated pages.
export async function readSceneManifest(repoRoot) {
  const file = path.join(repoRoot, "assets", "vid", "scene-manifest.json");
  let document;
  try { document = JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) { if (error.code === "ENOENT") return new Map(); throw error; }
  if (![1, 2].includes(document.schemaVersion) || !Array.isArray(document.scenes)) throw new Error("Invalid scene media manifest");
  const scenes = new Map();
  async function validateArtifact(scene, artifact, variant = "fallback") {
    for (const field of ["video", "poster"]) {
      const asset = artifact[field];
      const expected = field === "video" ? /^assets\/vid\/(use-cases|home)\/(?:(?:mobile|desktop)\/)?[a-z-]+-(720p|1080p)\.mp4$/ : /^assets\/(wifigate_niche_pages|img)\/(?:(?:mobile|desktop)\/)?[a-z0-9-]+\.(webp|png)$/;
      if (!asset || !expected.test(asset.path) || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw new Error("Invalid scene artifact path/hash");
      if (field === "video" && ![`${scene.key}-720p.mp4`, `${scene.key}-1080p.mp4`].includes(path.posix.basename(asset.path))) throw new Error("Scene/video identity mismatch");
      const bytes = await fs.readFile(path.join(repoRoot, ...asset.path.split("/")));
      if (createHash("sha256").update(bytes).digest("hex") !== asset.sha256) throw new Error(`Scene artifact changed after acceptance: ${scene.key}/${variant}`);
      const desktop = variant === "desktop" || (variant === "fallback" && artifact.video.path.includes("/desktop/"));
      const maxBytes = scene.key === "homepage-montage" ? (desktop ? 12_000_000 : 8_000_000) : (desktop ? 6_000_000 : 3_000_000);
      if (field === "video" && bytes.length > maxBytes) throw new Error(`Scene clip exceeds delivery budget: ${scene.key}/${variant}`);
    }
    const validDuration = scene.key === "homepage-montage"
      ? Math.abs(artifact.durationSeconds - 15) <= 0.05
      : Number.isFinite(artifact.durationSeconds) && artifact.durationSeconds >= 4 && artifact.durationSeconds <= 12;
    const desktop = variant === "desktop" || (variant === "fallback" && artifact.video.path.includes("/desktop/"));
    const nativeDesktop = desktop && artifact.height === 1080 && Number.isInteger(artifact.width) && artifact.width % 2 === 0 && Math.abs(artifact.width / artifact.height - 16 / 9) <= 0.01;
    const validSize = (artifact.width === 1280 && artifact.height === 720) || nativeDesktop;
    if (!validSize || !validDuration || artifact.codec !== "h264" || artifact.audioTracks !== 0 || !artifact.fastStart
      || !artifact.motionReviewed || !artifact.matchingFirstFrameReviewed) throw new Error(`Scene acceptance incomplete: ${scene.key}/${variant}`);
  }
  for (const scene of document.scenes) {
    if (!scene.accepted) continue;
    if (!sceneKeys.has(scene.key) || scenes.has(scene.key)) throw new Error("Invalid or duplicate scene key");
    await validateArtifact(scene, scene);
    if (scene.variants) {
      if (document.schemaVersion !== 2 || typeof scene.variants !== "object" || Array.isArray(scene.variants) || Object.keys(scene.variants).some(key => !["mobile", "desktop"].includes(key))) throw new Error("Invalid scene variants");
      for (const [variant, artifact] of Object.entries(scene.variants)) if (artifact?.accepted) await validateArtifact(scene, artifact, variant);
    }
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
  if (!$("script[src*='js/media-runtime.js']").length) {
    const runtime = $("<script>").attr("src", `${assetPrefix}js/media-runtime.js?v=20261018d`).attr("defer", "");
    const heroScript = $("script[src*='js/hero.js']");
    if (heroScript.length) heroScript.before(runtime);
    else $("head").append(runtime);
  }
  $("script[src*='js/media-runtime.js']").attr("src", `${assetPrefix}js/media-runtime.js?v=20261018d`);
  $("script[src*='js/hero.js']").attr("src", `${assetPrefix}js/hero.js?v=20261018d`);
  if (!$("link[href*='scene-video.css']").length) {
    $("head").append($("<link>").attr("rel", "stylesheet").attr("href", `${assetPrefix}css/scene-video.css?v=20261018d`));
  }
  if (!$("script[src*='js/scene-video.js']").length) {
    $("head").append($("<script>").attr("src", `${assetPrefix}js/scene-video.js?v=20261018d`).attr("defer", ""));
  }
  $("link[href*='scene-video.css']").attr("href", `${assetPrefix}css/scene-video.css?v=20261018d`);
  $("script[src*='js/scene-video.js']").attr("src", `${assetPrefix}js/scene-video.js?v=20261018d`);
}

function attachResponsiveMedia($, { scene, assetPrefix, image, video }) {
  if (!Object.values(scene.variants || {}).some(variant => variant?.accepted)) return;
  const variants = {};
  for (const name of ["mobile", "desktop"]) {
    const artifact = scene.variants?.[name]?.accepted ? scene.variants[name] : scene;
    variants[name] = { src: sceneAssetUrl(assetPrefix, artifact.video), poster: sceneAssetUrl(assetPrefix, artifact.poster), width: artifact.width, height: artifact.height };
  }
  // Picture performs initial poster selection before JavaScript. The runtime
  // pins that same pair for this page; no other video URL is attached or fetched.
  image.wrap($("<picture>").attr("data-scene-picture", ""));
  image.before($("<source>").attr("media", "(min-width: 769px)").attr("srcset", variants.desktop.poster));
  image.before($("<source>").attr("media", "(max-width: 768px)").attr("srcset", variants.mobile.poster));
  image.attr("src", variants.mobile.poster);
  video.removeAttr("poster").attr("data-media-variants", JSON.stringify(variants));
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
  attachResponsiveMedia($, { scene, assetPrefix, image, video });
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
  const actions = $(".niche-hero__actions");
  if (actions.length) actions.empty().append($("<button>").attr({ type: "button", id: "niche-hero-replay", "data-scene-replay": "" }).addClass("btn btn--primary niche-hero__btn-primary"));
  const replay = actions.find("[data-scene-replay]");
  if (replay.length) {
    replay.text(copy.replay).attr({ "aria-label": copy.replay, title: copy.replay });
    $(".niche-hero .scene-video-controls [data-scene-play]").remove();
  }
  // Pause/resume stays beside navigation; the single primary action restarts.
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
    attachResponsiveMedia($, { scene, assetPrefix, image, video });
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
    media.append(image.attr("src", sceneAssetUrl(assetPrefix, hotelScene.poster)).attr("width", String(hotelScene.width || 1280)).attr("height", String(hotelScene.height || 720)));
    // The homepage Host card is a photo. Responsive poster selection needs no
    // video element, playback data, controls or media-runtime registration.
    if (Object.values(hotelScene.variants || {}).some(variant => variant?.accepted)) {
      image.wrap($("<picture>"));
      for (const [name, query] of [["desktop", "(min-width: 769px)"], ["mobile", "(max-width: 768px)"]]) {
        const artifact = hotelScene.variants?.[name]?.accepted ? hotelScene.variants[name] : hotelScene;
        image.before($("<source>").attr("media", query).attr("srcset", sceneAssetUrl(assetPrefix, artifact.poster)));
      }
    }
  }
}
