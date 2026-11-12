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
  // The feature page scenes (No SIM, No Router; Stability) need no clip path, so they have no id at all.
  const expected = { host: { duration: 42, still: 27.0, clip: "wgh-door-clip" }, manager: { duration: 38.9, still: 27.65, clip: "wgm-lens" }, nosim: { duration: 14, still: 6.3, clip: null }, stability: { duration: 16, still: 9.2, clip: null },
    guest: { duration: 14.5, still: 6.8, clip: null }, history: { duration: 13, still: 8.3, clip: null }, autoopen: { duration: 12.4, still: 5.2, clip: null },
    events: { duration: 12.5, still: 6.4, clip: null }, rf: { duration: 13.5, still: 5.6, clip: null }, security: { duration: 13, still: 6.0, clip: null }, nofees: { duration: 13, still: 7.0, clip: null } };
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
    assert.deepEqual([...source.matchAll(/id: '([^']+)'/g)].map(match => match[1]), expected[name].clip ? [expected[name].clip] : []);
    if (expected[name].clip) assert.ok(source.includes(`url(#${expected[name].clip})`));
    else assert.doesNotMatch(source, /url\(#/);
  }
});

test("the blue reads strongly: lifted context strokes, heavier lines and tints, same geometry and timing", async () => {
  // One tone curve per scene keeps opacity 0 and 1 (fades and keyframes are
  // unchanged) and lifts the pale context strokes; weights are 1.2x, tints 1.6x.
  for (const [name, scene] of Object.entries(LINE_HERO_SCENES)) {
    const source = await read(scene.module);
    assert.match(source, /var TONE = 2\.7, WEIGHT = 1\.2, TINT = 1\.6;/, `${name}: tone parameters`);
    assert.match(source, /if \(k === 'stroke-opacity'\) return \w+\(1 - Math\.pow\(1 - /, `${name}: stroke opacity passes the tone curve`);
    assert.match(source, /if \(k === 'stroke-width'\) return \w+\(\+v \* WEIGHT\)/, `${name}: stroke weight factor`);
    for (const frame of LINE_HERO_FRAMES) {
      const svg = await read(lineHeroFramePath(name, frame));
      const values = attribute => [...svg.matchAll(new RegExp(` ${attribute}="([^"]+)"`, "g"))].map(match => Number(match[1]));
      const opacities = values("stroke-opacity"), widths = values("stroke-width");
      assert.ok(opacities.length > 0 && widths.length > 0, `${name}-${frame}: strokes present`);
      assert.ok(opacities.every(value => value === 0 || value >= 0.6), `${name}-${frame}: no pale context stroke (${opacities.filter(value => value > 0 && value < 0.6)})`);
      assert.ok(widths.every(value => value >= 1.8), `${name}-${frame}: no line thinner than 1.8 units`);
      assert.ok(Math.max(...widths) >= 3.6, `${name}-${frame}: primary strokes are 3.6 units`);
      assert.ok(/stroke="#146BFF"/.test(svg), `${name}-${frame}: brand blue`);
    }
  }
  // No opacity or filter dims the art in CSS.
  const css = await read("css/line-hero.css");
  assert.doesNotMatch(css, /\.line-hero__(?:art|stage|frame)[^{]*\{[^}]*(?:opacity|filter)\s*:/, "no opacity or filter on the art");
});

test("the art fills the media layer like the video it replaces, in CSS only, with a white scrim behind the text only", async () => {
  const css = await read("css/line-hero.css"), runtime = await read("js/line-hero.js");
  // One 16:9 box, as large as the hero allows (never cropped), centred; on tall
  // heroes it rises to just below the top bar row. No script moves it.
  assert.match(css, /--line-hero-w: min\(100cqw, 100cqh \* 16 \/ 9\);/);
  assert.match(css, /left: calc\(\(100cqw - var\(--line-hero-w\)\) \/ 2\);/);
  assert.match(css, /top: min\(calc\(\(100cqh - var\(--line-hero-h\)\) \/ 2\), var\(--line-hero-band\)\);/);
  assert.match(css, /\.niche-hero--line \.niche-hero__media \{ container-type: size;/);
  assert.doesNotMatch(css, /--line-hero-x|--line-hero-y/);
  assert.doesNotMatch(runtime, /ResizeObserver|getClientRects|createRange|placeArt|lineHeroLayout|style\.setProperty/);
  // The overlay stays the shared layer but paints nothing over the art; the
  // white scrim belongs to the text block (as wide as its text) with soft edges.
  const overlay = css.match(/\.niche-page \.niche-hero--line \.niche-hero__overlay,\s*html\[dir="rtl"\] \.niche-page \.niche-hero--line \.niche-hero__overlay \{([^}]+)\}/)?.[1] || "";
  assert.match(overlay, /background: none;/); assert.doesNotMatch(overlay, /rgba\(/);
  assert.match(css, /\.niche-hero--line \.niche-hero__text \{ position: relative; width: fit-content; max-width: 100%; \}/);
  const scrim = css.match(/\.niche-hero--line \.niche-hero__text::before \{([^}]+)\}/)?.[1] || "";
  assert.match(scrim, /z-index: -1;/); assert.match(scrim, /background: rgba\(255,255,255,\.9\);/); assert.match(scrim, /mask-composite: intersect;/);
  // Collapsed: the text and its scrim fade out in place (no layout change),
  // without a transition under reduced motion (system or site setting).
  const collapsed = css.match(/\.niche-hero--line\[data-line-hero-text="collapsed"\] \.niche-hero__text \{([^}]+)\}/)?.[1] || "";
  assert.match(collapsed, /opacity: 0; visibility: hidden;/); assert.doesNotMatch(collapsed, /display|height|position|transform/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{[^\n]*\[data-line-hero-text="collapsed"\] \.niche-hero__text \{ transition: none; \} \}/);
  assert.match(css, /html\.a11y-reduced-motion \.niche-hero--line\[data-line-hero-text="collapsed"\] \.niche-hero__text \{ transition: none; \}/);
  // The toggle shares the pause button's 44 px light style.
  assert.match(css, /\.niche-hero--line :is\(\[data-scene-pause\],\[data-hero-text-toggle\]\) \{[^}]*width: 44px; height: 44px;/);
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
    const heroCopy = (await import(new URL(`./homepage-copy/${code}.mjs`, import.meta.url))).default.hero;
    const copy = { ...heroCopy.media, hideText: heroCopy.textToggle.hide, showText: heroCopy.textToggle.show };
    const hero = $("main > section.niche-hero");
    assert.equal(hero.length, 1, relative);
    assert.ok(hero.hasClass("niche-hero--line"), `${relative}: light modifier`);
    assert.equal(hero.attr("data-line-hero"), scene); assert.equal(hero.attr("data-line-hero-state"), "poster");
    assert.equal(hero.is("[data-scene-video],[data-scene-state]"), false, `${relative}: no video scene controller`);
    assert.equal($("main video").length, 0, `${relative}: no video`);
    // The same decorative mark as the video heroes, in the media layer.
    assert.equal(hero.find("> .niche-hero__media[data-media-watermark-frame] > .media-watermark[data-media-watermark][aria-hidden='true']").length, 1, `${relative}: one watermark`);
    assert.equal($("[data-media-watermark]").length, 1); assert.equal($("link[data-media-watermark-style]").length, 1);
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
    // Text toggle beside pause: hidden until the runtime runs, expanded, controlling the text block.
    const toggle = hero.find(".niche-hero__pager > .scene-video-controls > [data-scene-pause] + button[data-hero-text-toggle][type=button]");
    assert.equal(toggle.length, 1, `${relative}: text toggle next to pause`);
    assert.notEqual(toggle.attr("hidden"), undefined);
    assert.deepEqual([toggle.attr("aria-controls"), toggle.attr("aria-expanded"), toggle.attr("aria-label"), toggle.attr("title")], ["niche-hero-text", "true", copy.hideText, copy.hideText]);
    assert.equal(toggle.find("svg[aria-hidden='true'][focusable='false'] .line-hero__toggle-hide").length, 1);
    assert.equal(toggle.find("svg .line-hero__toggle-show").length, 1);
    // Double chevrons, no baseline (a chevron over a bar reads as download/eject).
    assert.deepEqual(toggle.find("svg path").toArray().map(path => path.attribs.class || "").sort(), ["line-hero__toggle-hide", "line-hero__toggle-show"]);
    const text = hero.find("> .niche-hero__content > .niche-hero__text#niche-hero-text");
    assert.equal(text.length, 1, `${relative}: controlled text block`);
    assert.ok(text.find("> h1#niche-title.niche-hero__title").text().trim().length > 0, `${relative}: the h1 stays in the HTML`);
    assert.equal(text.find("> .niche-hero__actions > [data-scene-replay]").length, 1);
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
  // Each scene is imported from its own module (several scenes may share one) by its factory.
  for (const [scene, { module, factory }] of Object.entries(LINE_HERO_SCENES)) assert.ok(runtime.includes(`${scene}: () => import("./${path.posix.basename(module)}?v=${LINE_HERO_VERSION}").then(module => module.${factory})`), scene);
  for (const file of ["css/line-hero.css", "js/line-hero.js", "js/line-hero-host.js", "js/line-hero-manager.js"]) await fs.access(path.join(root, file));
});

test("every locale has its own hide/show text labels for the line hero toggle", async () => {
  const english = (await import(new URL("./homepage-copy/en.mjs", import.meta.url))).default.hero.textToggle;
  assert.deepEqual(english, { hide: "Hide text", show: "Show text" });
  for (const { code } of SITE_LANGUAGES) {
    const toggle = (await import(new URL(`./homepage-copy/${code}.mjs`, import.meta.url))).default.hero.textToggle;
    assert.deepEqual(Object.keys(toggle).sort(), ["hide", "show"], code);
    for (const key of ["hide", "show"]) assert.ok(typeof toggle[key] === "string" && toggle[key].trim() === toggle[key] && toggle[key].length > 1, `${code}.${key}`);
    assert.notEqual(toggle.hide, toggle.show, code);
    if (code !== "en") assert.notDeepEqual(toggle, english, `${code}: translated`);
  }
});
