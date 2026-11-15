// Browser checks of the WIFIGATE Host and WIFIGATE Manager line heroes on a
// served site (node scripts/serve.mjs; SITE_URL, BROWSER_CHANNEL as in the
// other browser tests). Layout at phone, tablet and desktop widths in English
// (LTR) and Hebrew (RTL): the art fills the media layer as the video did and
// the text block reads over it on the white scrim at every loop moment;
// playback controls, motion and visibility policies, the no-JavaScript frame
// in the same box, light-theme contrast, the text collapse toggle (labels,
// aria-expanded, focus, no layout jump, scrim removed, session memory) and the
// untouched video heroes of the other use-case pages. Run: npm run test:line-hero (with SITE_URL), or
// node scripts/line-hero-browser.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { LINE_HERO_VERSION } from "./line-hero.mjs";

const origin = (process.env.SITE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const screenshots = process.env.SCREENSHOT_DIR;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
const denyAnalytics = () => localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }));
const pages = [["host", "wifigate-host/"], ["manager", "wifigate-manager/"]];
const viewports = [[360, 640], [375, 667], [360, 780], [390, 844], [768, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080]];
// Legibility is checked across the whole loop at these sizes (short phone, tablet, desktop).
const legibilitySizes = new Set(["360x640", "1024x768", "1280x720", "1440x900"]);
const counts = { layout: 0, legibility: 0, controls: 0, toggle: 0, policy: 0, noScript: 0, other: 0 };

async function open(context, url) {
  const page = await context.newPage(), requests = [];
  page.on("request", request => requests.push(new URL(request.url()).pathname));
  await page.goto(url, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  return { page, requests };
}
const ready = page => page.waitForFunction(() => {
  const hero = document.querySelector("[data-line-hero]");
  return hero?.querySelector("svg.line-hero__art") && hero.dataset.lineHeroState !== "poster";
}, {}, { timeout: 15000 });
const artMarkup = page => page.evaluate(() => [...document.querySelector("svg.line-hero__art").childNodes].map(node => new XMLSerializer().serializeToString(node)).join(""));
// The scene's own render at a time, made by the page's browser from the shipped module.
const reference = (page, scene, time) => page.evaluate(async ([scene, time, version]) => {
  const module = await import(new URL(`/js/line-hero-${scene}.js?v=${version}`, location.origin).href);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  module[scene === "host" ? "createHostScene" : "createManagerScene"](svg).render(time);
  return [...svg.childNodes].map(node => new XMLSerializer().serializeToString(node)).join("");
}, [scene, time, LINE_HERO_VERSION]);
// Pixels of the art stage (pause control hidden for the capture). A live SVG
// keeps attributes of currently hidden parts from earlier frames, so frames are
// compared as rendered, against the same page frozen at that time.
async function frameShot(page) {
  await page.locator("[data-scene-pause]").evaluate(button => { button.style.visibility = "hidden"; });
  const png = await page.locator("[data-line-hero-stage]").screenshot();
  await page.locator("[data-scene-pause]").evaluate(button => { button.style.visibility = ""; });
  return sharp(png).removeAlpha().raw().toBuffer();
}
async function frozenShot(url, viewport, time) {
  const context = await browser.newContext({ viewport, serviceWorkers: "block" });
  try {
    await context.addInitScript(denyAnalytics);
    await context.addInitScript(at => document.addEventListener("readystatechange", () => {
      if (document.readyState === "interactive") document.querySelector("[data-line-hero]")?.setAttribute("data-line-hero-time", String(at));
    }), time);
    const { page } = await open(context, url); await ready(page);
    assert.equal(await page.locator(".niche-hero").getAttribute("data-line-hero-state"), "still");
    return await frameShot(page);
  } finally { await context.close(); }
}
// A live loop may leave a hidden part's attributes from earlier frames, which
// can move single anti-aliased pixels; anything beyond 0.1% of the stage fails.
function sameFrame(a, b) {
  if (a.length !== b.length) return false;
  let different = 0;
  for (let i = 0; i < a.length; i += 3) if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) different++;
  return different <= Math.max(4, a.length / 3 * 0.001);
}
// Some stretches of a loop hold a pose briefly, so motion is sampled for up to 2 s.
async function moving(page, expected) {
  const before = await artMarkup(page);
  let changed = false;
  for (let step = 0; step < (expected ? 10 : 3) && !changed; step++) { await page.waitForTimeout(200); changed = before !== await artMarkup(page); }
  assert.equal(changed, expected, expected ? "The animation advances" : "The animation holds still");
}
// The stage box as CSS lays it out (the same with or without JavaScript).
const stageBox = page => page.evaluate(() => { const r = document.querySelector("[data-line-hero-stage]").getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; });
async function layout(page) {
  const result = await page.evaluate(() => {
    const box = element => { const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const hero = document.querySelector(".niche-hero"), image = hero.querySelector("#niche-image");
    return { hero: box(hero), media: box(hero.querySelector(".niche-hero__media")), stage: box(hero.querySelector("[data-line-hero-stage]")), topbar: box(hero.querySelector(".niche-hero__topbar")), title: box(hero.querySelector(".niche-hero__title")),
      overflow: document.documentElement.scrollWidth - innerWidth, image: image.complete && image.naturalWidth > 0, decorative: hero.querySelector("svg.line-hero__art").getAttribute("aria-hidden"), phone: matchMedia("(max-width: 768px)").matches };
  });
  const { hero, media, stage, topbar } = result;
  assert.ok(result.overflow <= 0, "No horizontal overflow");
  assert.deepEqual([media.left, media.top, media.width, media.height], [hero.left, hero.top, hero.width, hero.height], "The media layer fills the hero");
  assert.ok(stage.left >= hero.left - 0.5 && stage.right <= hero.right + 0.5 && stage.top >= hero.top - 0.5 && stage.bottom <= hero.bottom + 0.5, "Art stays inside the hero");
  assert.ok(Math.abs(stage.height - stage.width * 9 / 16) < 1, "Art keeps 16:9 (never cropped)");
  assert.ok(Math.abs(stage.left + stage.width / 2 - (hero.left + hero.width / 2)) < 1, "Art is centred");
  // Every width: the art sits just below the top bar row, never above it.
  assert.ok(stage.top >= topbar.bottom - 0.5, "Art sits below the top bar");
  if (result.phone) {
    // Phones: as large as the hero allows, in the upper band; the text overlays the media layer.
    assert.ok(Math.abs(stage.width - Math.min(hero.width, hero.height * 16 / 9)) < 1, "Art is as large as the hero allows");
    assert.ok(stage.top <= hero.top + (hero.height - stage.height) / 2 + 0.5, "Art sits in the upper band below the top bar");
    assert.ok(result.title.left < media.right && result.title.right > media.left && result.title.top < media.bottom && result.title.bottom > media.top, "Text overlays the media layer");
  } else {
    // Wider screens stack: the art band, then the text below it, so the text never covers the art.
    assert.ok(result.title.top >= stage.bottom - 0.5, "Text sits below the art");
    assert.ok(stage.height >= 339, "Art keeps a usable height");
  }
  assert.equal(result.image, true, "The static frame loaded"); assert.equal(result.decorative, "true");
  return result;
}
// Text over the art: with the glyphs made transparent (their white halo and the
// scrim stay), the darkest pixel behind each text line still meets AA against
// that line's ink (3:1 for the large title). The art is frozen at each sampled
// loop moment by rendering the shipped scene module at that time.
async function legible(page, scene, duration) {
  const lines = await page.evaluate(() => {
    const hero = document.querySelector(".niche-hero"), range = document.createRange(), rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number), out = [];
    for (const node of hero.querySelectorAll(".niche-breadcrumb__list, .niche-hero__eyebrow, .niche-hero__title, .niche-hero__lead")) {
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) if (r.width > 1) out.push({ x: r.left, y: r.top, w: r.width, h: r.height, ink: rgb(getComputedStyle(node).color), large: node.matches(".niche-hero__title"), kind: node.className.split(" ")[0] });
    }
    return out;
  });
  await page.addStyleTag({ content: ".niche-hero--line :is(.niche-breadcrumb__list,.niche-hero__eyebrow,.niche-hero__title,.niche-hero__lead), .niche-hero--line :is(.niche-breadcrumb__list,.niche-hero__eyebrow,.niche-hero__title,.niche-hero__lead) * { color: transparent !important; } .niche-hero--line .niche-breadcrumb__list *::before { color: transparent !important; } .a11y-fab { visibility: hidden !important; }" });
  let worst = Infinity;
  for (let time = 0; time < duration; time += 1.5) {
    await page.evaluate(async ([scene, time, version]) => {
      const module = await import(new URL(`/js/line-hero-${scene}.js?v=${version}`, location.origin).href);
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      module[scene === "host" ? "createHostScene" : "createManagerScene"](svg).render(time);
      svg.setAttribute("class", "line-hero__art"); svg.setAttribute("aria-hidden", "true");
      document.querySelector("svg.line-hero__art").replaceWith(svg);
    }, [scene, time, LINE_HERO_VERSION]);
    const { data, info } = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (const line of lines) {
      let darkest = 1;
      for (let y = Math.max(0, Math.floor(line.y)); y < Math.min(info.height, Math.ceil(line.y + line.h)); y++)
        for (let x = Math.max(0, Math.floor(line.x)); x < Math.min(info.width, Math.ceil(line.x + line.w)); x++) { const i = (y * info.width + x) * 3; darkest = Math.min(darkest, luminance([data[i], data[i + 1], data[i + 2]])); }
      const ratio = (darkest + 0.05) / (luminance(line.ink) + 0.05);
      worst = Math.min(worst, ratio);
      assert.ok(ratio >= (line.large ? 3 : 4.5), `${line.kind} stays legible over the art at t=${time} (${ratio.toFixed(2)}:1 at ${Math.round(line.x)},${Math.round(line.y)})`);
    }
  }
  return worst;
}
function luminance([r, g, b]) { const c = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); }
const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
async function inks(page) {
  const colours = await page.evaluate(() => {
    const rgb = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const read = selector => { const element = document.querySelector(selector); return element ? rgb(getComputedStyle(element).color) : null; };
    const button = document.querySelector("[data-scene-replay]"), pause = document.querySelector("[data-scene-pause]"), toggle = document.querySelector("[data-hero-text-toggle]");
    return { title: read(".niche-hero__title"), lead: read(".niche-hero__lead"), eyebrow: read(".niche-hero__eyebrow"), crumb: read(".niche-breadcrumb__list"), link: read(".niche-breadcrumb__link"),
      button: rgb(getComputedStyle(button).color), buttonBackground: rgb(getComputedStyle(button).backgroundColor), pause: rgb(getComputedStyle(pause).color), pauseBackground: rgb(getComputedStyle(pause).backgroundColor),
      toggle: rgb(getComputedStyle(toggle).color), toggleBackground: rgb(getComputedStyle(toggle).backgroundColor) };
  });
  const white = [255, 255, 255];
  for (const key of ["title", "lead", "eyebrow", "crumb", "link"]) assert.ok(contrast(colours[key], white) >= 4.5, `${key} text meets AA on white`);
  assert.ok(contrast(colours.button, colours.buttonBackground) >= 4.5, "Replay label meets AA on the dark button");
  assert.ok(contrast(colours.pause, colours.pauseBackground) >= 4.5, "Pause icon reads on its surface");
  assert.ok(contrast(colours.toggle, colours.toggleBackground) >= 4.5, "Text toggle icon reads on its surface");
}
// The text toggle: expanded by default; collapsing hides the text block and
// its scrim in place (nothing moves) and keeps focus on the toggle; keyboard
// activation works; the choice is remembered for the session.
async function textToggle(page, copy) {
  const toggle = page.locator(".niche-hero__pager [data-hero-text-toggle]");
  const state = () => page.evaluate(() => {
    const hero = document.querySelector(".niche-hero"), text = document.querySelector("#niche-hero-text"), toggle = document.querySelector("[data-hero-text-toggle]");
    const box = element => { const r = element.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(value => Math.round(value * 10) / 10); };
    const scrim = getComputedStyle(text, "::before");
    return { scrolled: [scrollY, hero.scrollTop, hero.querySelector(".niche-hero__media").scrollTop], attr: hero.dataset.lineHeroText, expanded: toggle.getAttribute("aria-expanded"), label: toggle.getAttribute("aria-label"), title: toggle.title, controls: toggle.getAttribute("aria-controls"),
      visibility: getComputedStyle(text).visibility, opacity: Number(getComputedStyle(text).opacity), scrimVisibility: scrim.visibility, scrimContent: scrim.content,
      overlay: getComputedStyle(hero.querySelector(".niche-hero__overlay")).backgroundImage, h1: Boolean(text.querySelector("h1#niche-title")),
      h1Exposed: getComputedStyle(text.querySelector("h1#niche-title")).visibility === "visible",
      hero: box(hero), stage: box(hero.querySelector("[data-line-hero-stage]")), text: box(text), focused: document.activeElement === toggle,
      replayFocusable: hero.querySelector("[data-scene-replay]").checkVisibility({ visibilityProperty: true }) };
  });
  assert.equal(await toggle.isVisible(), true, "The text toggle is offered");
  const scene = await page.locator(".niche-hero").getAttribute("data-line-hero");
  await page.evaluate(() => window.scrollTo(0, 0));
  const open = await state();
  assert.deepEqual([open.attr, open.expanded, open.label, open.title, open.controls], ["expanded", "true", copy.hideText, copy.hideText, "niche-hero-text"]);
  assert.deepEqual([open.visibility, open.opacity, open.scrimVisibility, open.overlay], ["visible", 1, "visible", "none"]);
  // Phones keep the text over the art on a white scrim; wider screens stack the
  // text on white below the art, so there is no scrim.
  if (await page.evaluate(() => matchMedia("(max-width: 768px)").matches)) assert.notEqual(open.scrimContent, "none", "The white scrim sits behind the text");
  else assert.equal(open.scrimContent, "none", "Stacked text needs no scrim");
  await toggle.click();
  await page.waitForFunction(() => getComputedStyle(document.querySelector("#niche-hero-text")).visibility === "hidden", {}, { timeout: 2000 });
  const closed = await state();
  assert.deepEqual([closed.attr, closed.expanded, closed.label, closed.title], ["collapsed", "false", copy.showText, copy.showText]);
  assert.deepEqual([closed.visibility, closed.opacity, closed.scrimVisibility, closed.h1, closed.replayFocusable], ["hidden", 0, "hidden", true, false], "Text and scrim hidden; the h1 stays in the DOM");
  assert.equal(closed.h1Exposed, true, "The h1 stays in the accessibility tree while the block is faded out");
  assert.equal(closed.focused, true, "Focus stays on the toggle");
  assert.deepEqual([closed.hero, closed.stage, closed.text], [open.hero, open.stage, open.text], "Neither the hero nor the art moves");
  assert.equal(await page.evaluate(key => sessionStorage.getItem(key), `wifigate-line-hero-text:${scene}`), "collapsed");
  // The choice is kept per product: the other product's hero stays expanded.
  assert.equal(await page.evaluate(key => sessionStorage.getItem(key), `wifigate-line-hero-text:${scene === "host" ? "manager" : "host"}`), null);
  // The choice survives a reload in this session, applied without a fade.
  await page.reload({ waitUntil: "load" }); await ready(page);
  const restored = await state();
  assert.deepEqual([restored.attr, restored.expanded, restored.visibility], ["collapsed", "false", "hidden"]);
  // Keyboard: Enter and Space toggle it; focus stays.
  await toggle.focus(); await page.keyboard.press("Enter");
  await page.waitForFunction(() => getComputedStyle(document.querySelector("#niche-hero-text")).visibility === "visible", {}, { timeout: 2000 });
  const reopened = await state();
  assert.deepEqual([reopened.attr, reopened.expanded, reopened.label, reopened.focused], ["expanded", "true", copy.hideText, true]);
  await page.keyboard.press("Space"); assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  await page.keyboard.press("Space"); assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector("#niche-hero-text")).opacity) === 1, {}, { timeout: 2000 });
  assert.equal(await page.evaluate(key => sessionStorage.getItem(key), `wifigate-line-hero-text:${scene}`), "expanded");
}
async function capture(page, name) { if (screenshots) await page.screenshot({ path: path.join(screenshots, name + ".png") }); }

try {
  if (screenshots) await fs.mkdir(screenshots, { recursive: true });
  for (const [scene, route] of pages) for (const locale of ["", "he/"]) {
    for (const [width, height] of viewports) {
      const context = await browser.newContext({ viewport: { width, height }, serviceWorkers: "block" });
      try {
        await context.addInitScript(denyAnalytics);
        const { page, requests } = await open(context, `${origin}/${locale}${route}`);
        await ready(page);
        assert.equal(await page.locator(".niche-hero").getAttribute("data-line-hero-state"), "playing");
        await layout(page);
        if (width === 1280) await inks(page);
        assert.equal(requests.some(item => /\.mp4$|scene-video\.js|media-runtime\.js/.test(item)), false, "No video or video runtime is requested");
        await capture(page, `line-hero-${scene}-${locale ? "he" : "en"}-${width}x${height}`);
        counts.layout++;
        // Without JavaScript (and before the module runs) the art has this very box: nothing moves.
        const live = await stageBox(page);
        const plain = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: false });
        try {
          const still = await plain.newPage(); await still.goto(`${origin}/${locale}${route}`, { waitUntil: "load" });
          const box = await stageBox(still);
          for (const key of Object.keys(live)) assert.ok(Math.abs(box[key] - live[key]) < 0.6, `No-JavaScript art box matches the live one (${key})`);
        } finally { await plain.close(); }
        if (legibilitySizes.has(`${width}x${height}`)) { const worst = await legible(page, scene, scene === "host" ? 42 : 38.9); counts.legibility++; if (process.env.LINE_HERO_VERBOSE) console.log(`${scene} ${locale || "en/"} ${width}x${height}: worst text contrast over the loop ${worst.toFixed(2)}:1`); }

        if (width === 390 || width === 1280) {
          await page.reload({ waitUntil: "load" }); await ready(page);
          const copy = JSON.parse(await page.locator("[data-scene-copy]").textContent());
          const pause = page.locator(".niche-hero__pager [data-scene-pause]"), replay = page.locator(".niche-hero__actions [data-scene-replay]");
          assert.equal(await pause.isVisible(), true, "Pause is offered while the art moves");
          assert.deepEqual([await pause.getAttribute("aria-pressed"), await pause.getAttribute("aria-label")], ["false", copy.pause]);
          await moving(page, true);
          await pause.click();
          assert.equal(await page.locator(".niche-hero").getAttribute("data-line-hero-state"), "paused");
          assert.deepEqual([await pause.getAttribute("aria-pressed"), await pause.getAttribute("aria-label"), await pause.isVisible()], ["true", copy.play, true]);
          await moving(page, false);
          await pause.click(); await moving(page, true);
          // Replay renders t=0 in the click itself, then keeps playing.
          await page.evaluate(() => { document.querySelector("[data-scene-replay]").click(); document.querySelector("[data-scene-pause]").click(); });
          const url = `${origin}/${locale}${route}`, viewport = { width, height };
          assert.ok(sameFrame(await frameShot(page), await frozenShot(url, viewport, 0)), "Replay restarts at the first frame");
          await pause.click();
          assert.equal(await replay.getAttribute("aria-label"), copy.replay);
          await moving(page, true);
          // Off screen and hidden tabs stop the loop; returning resumes it.
          await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight)); await page.waitForTimeout(250);
          await moving(page, false);
          await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(250);
          await moving(page, true);
          await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => true }); document.dispatchEvent(new Event("visibilitychange")); });
          await moving(page, false);
          await page.evaluate(() => { Object.defineProperty(document, "hidden", { configurable: true, get: () => false }); document.dispatchEvent(new Event("visibilitychange")); });
          await moving(page, true);
          // The site's own reduced-motion setting shows the approved still frame.
          await page.evaluate(() => { window.isReducedMotionRequested = () => true; document.dispatchEvent(new CustomEvent("site-accessibility-change")); });
          assert.equal(await page.locator(".niche-hero").getAttribute("data-line-hero-state"), "still");
          assert.equal(await pause.isVisible(), false, "Nothing moves, so no pause control");
          const still = scene === "host" ? 27.0 : 27.65;
          assert.ok(sameFrame(await frameShot(page), await frozenShot(url, viewport, still)), "Reduced motion shows the approved still");
          await moving(page, false);
          await page.evaluate(() => { window.isReducedMotionRequested = () => false; document.dispatchEvent(new CustomEvent("site-accessibility-change")); });
          assert.equal(await page.locator(".niche-hero").getAttribute("data-line-hero-state"), "playing");
          await moving(page, true);
          counts.controls++;
          await textToggle(page, copy);
          counts.toggle++;
        }
      } finally { await context.close(); }
    }
    // prefers-reduced-motion: the still frame from the first paint; replay plays on request.
    const reduced = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", serviceWorkers: "block" });
    try {
      await reduced.addInitScript(denyAnalytics);
      const { page } = await open(reduced, `${origin}/${locale}${route}`);
      await ready(page);
      assert.equal(await page.locator(".niche-hero").getAttribute("data-line-hero-state"), "still");
      assert.match(await page.locator("#niche-image").evaluate(image => image.currentSrc), new RegExp(`/assets/img/line-hero/${scene}-still\\.svg\\?v=[0-9a-f]{12}$`));
      assert.equal(await artMarkup(page), await reference(page, scene, scene === "host" ? 27.0 : 27.65));
      assert.equal(await page.locator("[data-scene-pause]").isVisible(), false);
      await moving(page, false);
      await page.locator("[data-scene-replay]").click();
      assert.equal(await page.locator(".niche-hero").getAttribute("data-line-hero-state"), "playing");
      assert.equal(await page.locator("[data-scene-pause]").isVisible(), true);
      await moving(page, true);
      await capture(page, `line-hero-${scene}-${locale ? "he" : "en"}-reduced-motion`);
      counts.policy++;
    } finally { await reduced.close(); }
    // Without JavaScript the start frame fills the same stage.
    const noScript = await browser.newContext({ viewport: { width: 1280, height: 720 }, javaScriptEnabled: false });
    try {
      const page = await noScript.newPage(); await page.goto(`${origin}/${locale}${route}`, { waitUntil: "load" });
      const state = await page.evaluate(() => { const image = document.querySelector("#niche-image"), stage = document.querySelector("[data-line-hero-stage]").getBoundingClientRect();
        return { src: image.currentSrc, loaded: image.complete && image.naturalWidth > 0, svg: document.querySelectorAll("svg.line-hero__art").length, pause: document.querySelector("[data-scene-pause]").hidden, toggle: document.querySelector("[data-hero-text-toggle]").hidden, width: stage.width, height: stage.height }; });
      assert.match(state.src, new RegExp(`/assets/img/line-hero/${scene}-start\\.svg\\?v=[0-9a-f]{12}$`));
      assert.deepEqual([state.loaded, state.svg, state.pause, state.toggle], [true, 0, true, true], "Without script, no pause or text toggle is offered");
      assert.ok(state.width > 300 && Math.abs(state.height - state.width * 9 / 16) < 1);
      await capture(page, `line-hero-${scene}-${locale ? "he" : "en"}-no-javascript`);
      counts.noScript++;
    } finally { await noScript.close(); }
  }
  // The other use-case heroes keep their dark video presentation.
  for (const route of ["hotels-airbnb/", "he/residential-buildings/"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
      const page = await context.newPage(); await page.goto(`${origin}/${route}`, { waitUntil: "load" });
      assert.equal(await page.locator(".niche-hero[data-scene-video] video[data-video-src]").count(), 1);
      assert.equal(await page.locator(".niche-hero--line, [data-line-hero], link[href*='line-hero.css'], script[src*='line-hero']").count(), 0);
      assert.equal(await page.locator(".niche-hero").evaluate(hero => getComputedStyle(hero).color), "rgb(255, 255, 255)");
      counts.other++;
    } finally { await context.close(); }
  }
  console.log(`PASS: line heroes ${counts.layout} layout cases (Host/Manager x EN/HE x ${viewports.length} viewports, each matching its no-JavaScript box), ${counts.legibility} whole-loop legibility cases, ${counts.controls} control/visibility/accessibility cases, ${counts.toggle} text-toggle cases, ${counts.policy} reduced-motion and ${counts.noScript} no-JavaScript cases; ${counts.other} video heroes unchanged.`);
} finally { await browser.close(); }
