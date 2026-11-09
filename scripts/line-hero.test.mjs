// The WIFIGATE Host and WIFIGATE Manager line-animation heroes: committed
// static frames, scene modules, the CSS stage, the playback runtime and all 78
// generated pages (39 locales x 2). Browser behaviour is covered separately by
// scripts/line-hero-browser.test.mjs.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import * as cheerio from "cheerio";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { LINE_HERO_SCENES, LINE_HERO_FRAMES, lineHeroFrameHash, lineHeroFramePath, loadLineHeroScene, renderLineHeroFrame } from "./line-hero-frames.mjs";
import { LINE_HERO_VERSION } from "./line-hero.mjs";
import { createPlayer } from "../js/line-hero.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = file => fs.readFile(path.join(root, ...file.split("/")), "utf8");
const sha12 = async file => lineHeroFrameHash(await fs.readFile(path.join(root, ...file.split("/")))).slice(0, 12);

// Frames are rendered with JavaScript Math; another engine may round a value
// one step differently at its last kept digit (at most 0.1 of a unit).
function sameFrame(actual, expected) {
  if (actual === expected) return;
  const number = /(-?\d+(?:\.\d+)?(?:e-?\d+)?)/, a = actual.split(number), b = expected.split(number);
  assert.equal(a.length, b.length, "same frame structure");
  for (let i = 0; i < a.length; i++) {
    if (i % 2 === 0) assert.equal(a[i], b[i], "same markup");
    else assert.ok(Math.abs(Number(a[i]) - Number(b[i])) <= 0.1001, `number ${a[i]} vs ${b[i]}`);
  }
}

test("committed start and still frames are exactly what the shipped scene modules render", async () => {
  for (const name of Object.keys(LINE_HERO_SCENES)) {
    const createScene = await loadLineHeroScene(name);
    for (const frame of LINE_HERO_FRAMES) {
      const committed = await read(lineHeroFramePath(name, frame));
      assert.match(committed, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet"/);
      sameFrame(committed.replace(/\r\n/g, "\n"), renderLineHeroFrame(createScene, frame));
    }
  }
});

test("scene modules keep the approved timing and carry no page driver, debug hook or global", async () => {
  const expected = { host: { duration: 42, still: 27.0, clip: "wgh-door-clip" }, manager: { duration: 38.9, still: 27.65, clip: "wgm-lens" } };
  for (const [name, scene] of Object.entries(LINE_HERO_SCENES)) {
    const source = await read(scene.module);
    for (const forbidden of [/\bwindow\./, /\bdocument\./, /\blocation\b/, /URLSearchParams/, /requestAnimationFrame/, /IntersectionObserver/, /matchMedia/, /WG_/, /geomtest|selftest|data-geom|data-frames|data-selftest/i, /document\.title|onerror/])
      assert.doesNotMatch(source, forbidden, `${scene.module}: ${forbidden}`);
    const svg = { ownerDocument: { createElementNS: () => ({ setAttribute() {}, appendChild(child) { return child; }, insertBefore(child) { return child; } }) }, setAttribute() {}, appendChild(child) { return child; }, insertBefore(child) { return child; } };
    const instance = (await loadLineHeroScene(name))(svg);
    assert.equal(instance.duration, expected[name].duration);
    assert.equal(instance.still, expected[name].still);
    assert.equal(typeof instance.render, "function");
    // The only ids are the scoped clip paths, referenced by the same name.
    assert.deepEqual([...source.matchAll(/id: '([^']+)'/g)].map(match => match[1]), [expected[name].clip]);
    assert.ok(source.includes(`url(#${expected[name].clip})`));
  }
});

test("the art fills the media layer like the video it replaces, in CSS only, with a white scrim", async () => {
  const css = await read("css/line-hero.css"), runtime = await read("js/line-hero.js");
  // One 16:9 box, as large as the hero allows (never cropped), centred; on tall
  // heroes it rises to just below the top bar row. No script moves it.
  assert.match(css, /--line-hero-w: min\(100cqw, 100cqh \* 16 \/ 9\);/);
  assert.match(css, /left: calc\(\(100cqw - var\(--line-hero-w\)\) \/ 2\);/);
  assert.match(css, /top: min\(calc\(\(100cqh - var\(--line-hero-h\)\) \/ 2\), var\(--line-hero-band\)\);/);
  assert.match(css, /\.niche-hero--line \.niche-hero__media \{ container-type: size;/);
  assert.doesNotMatch(css, /--line-hero-x|--line-hero-y/);
  assert.doesNotMatch(runtime, /ResizeObserver|getClientRects|createRange|placeArt|lineHeroLayout|style\.setProperty/);
  // The overlay stays the shared layer, painted white instead of dark.
  const overlay = css.match(/\.niche-page \.niche-hero--line \.niche-hero__overlay \{([^}]+)\}/)?.[1] || "";
  assert.match(overlay, /rgba\(255,255,255,\.92\) 0%/); assert.doesNotMatch(overlay, /rgba\(5,5,5/);
  // Content hashes ignore line endings, so a CRLF checkout keeps every ?v=.
  const frame = await fs.readFile(path.join(root, ...lineHeroFramePath("host", "start").split("/")));
  assert.equal(lineHeroFrameHash(Buffer.from(frame.toString("utf8").replace(/\r?\n/g, "\r\n"))), lineHeroFrameHash(frame));
  assert.match(await read(".gitattributes"), /^assets\/img\/line-hero\/\*\.svg text eol=lf$/m);
});

test("the player loops by elapsed frame time, pauses, resumes, restarts at 0 and renders the still", () => {
  const frames = [], rendered = [];
  globalThis.document = { hidden: false };
  globalThis.requestAnimationFrame = callback => { frames.push(callback); return frames.length; };
  globalThis.cancelAnimationFrame = () => { frames.length = 0; };
  const tick = timestamp => { const callback = frames.shift(); assert.ok(callback, "a frame is scheduled"); callback(timestamp); };
  const states = [];
  try {
    const player = createPlayer({ duration: 10, still: 7.5, render: t => rendered.push(t) }, { onState: state => states.push(state) });
    player.start(); tick(1000); tick(1500); tick(1516);
    assert.deepEqual(rendered, [0, 0.1, 0.116], "first frame at 0; one step is at most 0.1 s");
    player.pause(); assert.equal(frames.length, 0); assert.equal(player.playing, false);
    player.resume(); tick(9000); assert.equal(rendered.at(-1), 0.116, "no jump after a pause");
    player.view({ onScreen: false }); assert.equal(frames.length, 0, "off screen stops the loop");
    player.view({ onScreen: true }); tick(20000); tick(20050);
    assert.ok(Math.abs(rendered.at(-1) - 0.166) < 1e-9);
    player.view({ visible: false }); assert.equal(frames.length, 0, "a hidden tab stops the loop");
    player.view({ visible: true });
    player.restart(); assert.equal(rendered.at(-1), 0);
    player.still(); assert.equal(rendered.at(-1), 7.5); assert.equal(frames.length, 0);
    assert.deepEqual(states, ["playing", "paused", "playing", "playing", "still"]);
    // The loop wraps at the scene duration.
    const wrap = []; const looping = createPlayer({ duration: 0.25, still: 0, render: t => wrap.push(t) });
    looping.start(); for (let i = 0; i < 6; i++) tick(1000 + i * 100);
    assert.ok(wrap.every(t => t >= 0 && t < 0.25)); assert.ok(Math.abs(wrap.at(-1) - 0.25 * ((0.5 / 0.25) % 1)) < 1e-9);
  } finally { delete globalThis.document; delete globalThis.requestAnimationFrame; delete globalThis.cancelAnimationFrame; }
});

test("all 78 Host and Manager pages carry the light line hero with the existing controls and no video", async () => {
  const runtime = await read("js/line-hero.js");
  const frames = {};
  for (const name of Object.keys(LINE_HERO_SCENES)) for (const frame of LINE_HERO_FRAMES) frames[`${name}-${frame}`] = await sha12(lineHeroFramePath(name, frame));
  let pages = 0;
  for (const { code } of SITE_LANGUAGES) for (const [scene, key] of [["host", "wifigate-host"], ["manager", "wifigate-manager"]]) {
    const relative = path.posix.join(code === "en" ? "" : code.toLowerCase(), key, "index.html"), prefix = code === "en" ? "../" : "../../";
    const $ = cheerio.load(await read(relative));
    const copy = (await import(new URL(`./homepage-copy/${code}.mjs`, import.meta.url))).default.hero.media;
    const hero = $("main > section.niche-hero");
    assert.equal(hero.length, 1, relative);
    assert.ok(hero.hasClass("niche-hero--line"), `${relative}: light modifier`);
    assert.equal(hero.attr("data-line-hero"), scene); assert.equal(hero.attr("data-line-hero-state"), "poster");
    assert.equal(hero.is("[data-scene-video],[data-scene-state]"), false, `${relative}: no video scene controller`);
    assert.equal($("main video, [data-media-watermark], [data-media-watermark-frame], link[data-media-watermark-style]").length, 0, `${relative}: no video or video mark`);
    assert.equal($("script[src*='scene-video.js'], script[src*='media-runtime.js'], link[href*='scene-video.css']").length, 0, `${relative}: video runtime not loaded`);
    // Media layer: one 16:9 stage with the static frames, decorative live SVG added at runtime.
    const stage = hero.find("> .niche-hero__media > .line-hero__stage[data-line-hero-stage]");
    assert.equal(stage.length, 1, `${relative}: stage`);
    assert.equal(hero.find("> .niche-hero__media > .niche-hero__overlay").length, 1);
    const source = stage.find("picture > source"), image = stage.find("picture > img#niche-image");
    assert.equal(source.length, 1); assert.equal(image.length, 1);
    assert.equal(source.attr("media"), "(prefers-reduced-motion: reduce)");
    assert.equal(source.attr("srcset"), `${prefix}${lineHeroFramePath(scene, "still")}?v=${frames[`${scene}-still`]}`);
    assert.equal(image.attr("src"), `${prefix}${lineHeroFramePath(scene, "start")}?v=${frames[`${scene}-start`]}`);
    assert.ok(image.hasClass("line-hero__frame") && !image.hasClass("niche-hero__bg"));
    assert.ok((image.attr("alt") || "").trim().length > 10, `${relative}: localized image description kept`);
    assert.deepEqual([image.attr("width"), image.attr("height"), image.attr("loading"), image.attr("fetchpriority")], ["1600", "900", "eager", "high"]);
    // Controls: one replay action, one hidden pause button in the pager, localized copy.
    const replay = hero.find(".niche-hero__actions > *");
    assert.equal(replay.length, 1); assert.ok(replay.is("button#niche-hero-replay[data-scene-replay].btn.btn--primary[type=button]"));
    assert.equal(replay.text(), copy.replay); assert.equal(replay.attr("aria-label"), copy.replay);
    const pause = hero.find(".niche-hero__pager > .scene-video-controls > button[data-scene-pause][type=button]");
    assert.equal(pause.length, 1); assert.notEqual(pause.attr("hidden"), undefined); assert.equal(pause.text(), copy.pause);
    assert.deepEqual(JSON.parse(hero.children("script[type='application/json'][data-scene-copy]").text()), copy);
    // Assets: the light stylesheet after niche.css, the scene preloaded, the runtime as a module.
    const sheets = $("link[rel=stylesheet]").map((_, element) => $(element).attr("href")).get();
    assert.ok(sheets.indexOf(`${prefix}css/line-hero.css?v=${LINE_HERO_VERSION}`) > sheets.findIndex(href => href.includes("css/niche.css")));
    assert.equal($(`link[rel=modulepreload][href='${prefix}js/line-hero-${scene}.js?v=${LINE_HERO_VERSION}']`).length, 1);
    assert.equal($(`script[type=module][src='${prefix}js/line-hero.js?v=${LINE_HERO_VERSION}']`).length, 1);
    pages++;
  }
  assert.equal(pages, 78);
  // The preloaded scene URL is exactly the one the runtime imports.
  for (const scene of Object.keys(LINE_HERO_SCENES)) assert.ok(runtime.includes(`import("./line-hero-${scene}.js?v=${LINE_HERO_VERSION}")`), scene);
  for (const file of ["css/line-hero.css", "js/line-hero.js", "js/line-hero-host.js", "js/line-hero-manager.js"]) await fs.access(path.join(root, file));
});
