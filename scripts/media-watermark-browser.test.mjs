import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";

const origin = (process.env.SITE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const screenshots = process.env.SCREENSHOT_DIR;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
const overlaps = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
const routes = ["", "roller-shutters/", "hotels-airbnb/", "shabbat-clock-electric-gate/", "wifigate-host/", "auto-open/"];
const report = { schema: "wifigate.video-watermark.browser.v1", kind: "host_browser", status: "RUNNING", cases: [], policyCases: [], failureCases: [], noJavaScriptCases: [], captures: [] };
const denyAnalytics = () => localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }));
const frameSelector = "[data-media-watermark-frame]";
function owner(page, route) { return page.locator(route ? ".niche-hero" : "#home.hero"); }
function video(page, route) { return owner(page, route).locator("video"); }
function playButton(page, route) { return page.locator(route ? "[data-scene-replay]" : "#hero-replay"); }
function pauseButton(page, route) { return page.locator(route ? "[data-scene-pause]" : "#hero-pause-toggle"); }
async function capture(page, name) {
  if (!screenshots) return;
  const bytes = await page.screenshot();
  const file = `${name}.png`;
  await fs.writeFile(path.join(screenshots, file), bytes, { flag: "wx" });
  report.captures.push({ file, sha256: createHash("sha256").update(bytes).digest("hex"), bytes: bytes.length });
}
async function markState(page, route) {
  return owner(page, route).evaluate(element => {
    const mark = element.querySelector("[data-media-watermark]");
    const v = element.querySelector("video");
    return { state: element.dataset.sceneState || element.dataset.heroMediaState, display: mark ? getComputedStyle(mark).display : null, opacity: mark ? Number(getComputedStyle(mark).opacity) : null, src: v?.getAttribute("src") ?? null, paused: v?.paused ?? null };
  });
}
async function assertUnmarkedPoster(page, route, noSource = true) {
  const value = await markState(page, route);
  assert.equal(value.state, "image");
  assert.equal(value.display, "none", "A poster, blocked autoplay or no-JavaScript image has no visible watermark");
  assert.equal(value.opacity, .3);
  if (noSource) assert.equal(value.src, null);
  return value;
}
async function waitPlaying(page, route) {
  await video(page, route).evaluate(async v => {
    const deadline = performance.now() + 20000;
    while (v.paused || v.readyState < 2 || v.currentTime < .15) {
      if (v.error) throw new Error("Accepted media failed to decode");
      if (performance.now() > deadline) throw new Error("Accepted video did not play");
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  });
}
async function inspectVideoLayer(page, route) {
  const result = await page.locator(frameSelector).evaluate(element => {
    const box = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
    const mark = element.querySelector(":scope > [data-media-watermark]");
    const style = getComputedStyle(mark), bounds = box(mark);
    const hero = element.closest(".hero,.niche-hero");
    const visible = node => { const s = getComputedStyle(node), r = box(node); return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0; };
    const controls = [...hero.querySelectorAll("button,a,input")].filter(visible).map(box);
    const text = [...hero.querySelectorAll("h1,h2,p,.hero__proof,.niche-hero__eyebrow,.niche-hero__breadcrumb")].filter(visible).map(box);
    const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    const a11y = document.getElementById("a11y-fab");
    return { frame: box(element), mark: bounds, display: style.display, pointer: style.pointerEvents, opacity: Number(style.opacity), background: style.backgroundImage, ariaHidden: mark.getAttribute("aria-hidden"), markHit: hit === mark, controls, text, niche: element.matches(".niche-hero__media"), accessibility: a11y ? box(a11y) : null, scrollWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth };
  });
  assert.equal(result.display, "block");
  assert.equal(result.opacity, .3, "Thirty percent opacity leaves the original artwork faint");
  assert.equal(result.pointer, "none");
  assert.equal(result.ariaHidden, "true");
  assert.equal(result.markHit, false);
  assert.match(result.background, /wifigate-watermark\.png\?v=d4e6db34dc50/);
  assert.ok(Math.abs(result.frame.right - result.mark.right - 12) < 1.1, "Physical right inset is 12px in both LTR and RTL");
  assert.ok(Math.abs(result.frame.bottom - result.mark.bottom - (route ? 8 : 12)) < 1.1, "Mark stays at the physical bottom edge");
  assert.ok(result.mark.x >= result.frame.x && result.mark.y >= result.frame.y);
  assert.ok(result.mark.width >= (result.niche ? 27.9 : 39.9) && result.mark.width <= (result.niche ? 38.1 : 96.1));
  assert.ok(result.scrollWidth <= result.viewportWidth);
  for (const control of result.controls) assert.equal(overlaps(result.mark, control), false, "Mark clears the video owner's actions");
  for (const block of result.text) assert.equal(overlaps(result.mark, block), false, "Mark clears hero copy");
  // The owner permits the fixed accessibility button to cover this corner.
  // Observe its position without avoiding or moving it.
  return { physicalRightPixels: 12, bottomPixels: route ? 8 : 12, opacity: result.opacity, pointerEvents: result.pointer, accessibilityOverlapAllowed: true, accessibilityOverlaps: result.accessibility ? overlaps(result.mark, result.accessibility) : false };
}
async function staticPhotosHaveNoLayer(page, route) {
  const checks = await page.evaluate(() => {
    const extra = [...document.querySelectorAll("main [data-media-watermark-frame]")].filter(frame => !frame.querySelector("video"));
    const grid = [...document.querySelectorAll(".security-statement__media-image")];
    const host = document.querySelector(".home-en .automation-stay__media");
    return { photoOnlyFrames: extra.length, gridImagesRetained: grid.every(item => item.tagName === "IMG"), staticHostMarks: host?.querySelectorAll("[data-media-watermark]").length || 0 };
  });
  assert.equal(checks.photoOnlyFrames, 0);
  assert.equal(checks.gridImagesRetained, true);
  assert.equal(checks.staticHostMarks, 0);
  if (route === "shabbat-clock-electric-gate/") {
    assert.equal(await page.locator("[data-media-watermark],link[data-media-watermark-style]").count(), 0);
    assert.equal(await page.locator("main video").count(), 0);
  }
}
try {
  if (screenshots) await fs.mkdir(screenshots, { recursive: true });
  for (const locale of ["", "he/"]) for (const route of routes) for (const width of [320, 390, 1280]) {
    const height = width < 769 ? 844 : 900;
    const id = `${locale || "en/"}${route || "home/"}${width}`;
    const result = { id, locale: locale || "en", route: route || "home", width, height, status: "RUNNING" };
    report.cases.push(result);
    const context = await browser.newContext({ viewport: { width, height } });
    try {
      await context.addInitScript(denyAnalytics);
      await context.addInitScript(() => Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } }));
      const page = await context.newPage();
      await page.goto(`${origin}/${locale}${route}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await staticPhotosHaveNoLayer(page, route);
      const hasVideo = route !== "shabbat-clock-electric-gate/";
      assert.equal(await page.locator(frameSelector).count(), hasVideo ? 1 : 0);
      if (!hasVideo) {
        result.staticPhotoUnmarked = true;
        await capture(page, `video-watermark-${locale ? "he" : "en"}-shabbat-${width}-static`);
      } else {
        result.poster = await assertUnmarkedPoster(page, route);
        await capture(page, `video-watermark-${locale ? "he" : "en"}-${route.replace(/\/$/, "") || "home"}-${width}-poster`);
        await playButton(page, route).click(); await waitPlaying(page, route);
        result.playing = await inspectVideoLayer(page, route);
        await capture(page, `video-watermark-${locale ? "he" : "en"}-${route.replace(/\/$/, "") || "home"}-${width}-playing`);
        await pauseButton(page, route).click();
        assert.equal((await markState(page, route)).paused, true);
        assert.equal((await markState(page, route)).display, "block", "A paused visible video retains its watermark");
        await pauseButton(page, route).click(); await waitPlaying(page, route);
        await video(page, route).evaluate(v => { v.currentTime = Math.max(0, v.duration - .25); });
        await page.waitForFunction(selector => document.querySelector(selector)?.ended, route ? ".niche-hero video" : "#hero-video", { timeout: 10000 });
        const ended = await markState(page, route);
        assert.equal(ended.display, route ? "block" : "none", "Completion follows the displayed medium: held video frame or restored homepage poster");
        result.endState = ended.state; result.endDisplay = ended.display;
        await playButton(page, route).click(); await waitPlaying(page, route);
        assert.equal((await markState(page, route)).display, "block");
        result.pauseResumeReplay = true;
      }
      result.status = "PASS";
    } finally { await context.close(); }
  }
  for (const locale of ["", "he/"]) for (const route of ["", "auto-open/"]) {
    const context = await browser.newContext({ viewport: { width: locale ? 390 : 1280, height: 900 }, reducedMotion: "reduce" });
    try {
      await context.addInitScript(denyAnalytics); const page = await context.newPage();
      await page.goto(`${origin}/${locale}${route}`, { waitUntil: "load" });
      await assertUnmarkedPoster(page, route); await playButton(page, route).click(); await waitPlaying(page, route);
      assert.equal((await markState(page, route)).display, "block");
      report.policyCases.push({ locale: locale || "en", route: route || "home", policy: "reduced-motion", posterUnmarked: true, explicitPlayMarked: true, status: "PASS" });
    } finally { await context.close(); }
  }
  for (const route of ["", "roller-shutters/"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    try {
      await context.addInitScript(denyAnalytics); await context.route(/\.mp4(?:\?|$)/, request => request.abort());
      const page = await context.newPage(); await page.goto(`${origin}/he/${route}`, { waitUntil: "load" });
      await page.waitForFunction(selector => Boolean(document.querySelector(selector)?.error), route ? ".niche-hero video" : "#hero-video", { timeout: 15000 });
      await assertUnmarkedPoster(page, route, false);
      report.failureCases.push({ route: route || "home", mediaFailurePosterUnmarked: true, status: "PASS" });
    } finally { await context.close(); }
  }
  for (const locale of ["", "he/"]) for (const route of ["", "wifigate-host/", "shabbat-clock-electric-gate/"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    try {
      const page = await context.newPage(); await page.goto(`${origin}/${locale}${route}`, { waitUntil: "load" });
      if (route === "shabbat-clock-electric-gate/") assert.equal(await page.locator("[data-media-watermark]").count(), 0);
      else await assertUnmarkedPoster(page, route);
      report.noJavaScriptCases.push({ locale: locale || "en", route: route || "home", posterUnmarked: true, status: "PASS" });
    } finally { await context.close(); }
  }
  report.status = "PASS";
  console.log(`Video-only watermark: ${report.cases.length} HE/EN 320/390/1280 route cases, ${report.policyCases.length} reduced-motion, ${report.failureCases.length} failure and ${report.noJavaScriptCases.length} no-JavaScript cases passed; unmarked photos/posters, opacity .3, physical bottom-right and existing playback states.`);
} catch (error) { report.status = "FAIL"; report.error = String(error.message || error); throw error; }
finally {
  await browser.close();
  if (screenshots) await fs.writeFile(path.join(screenshots, "video-watermark-browser-report.json"), JSON.stringify(report, null, 2) + "\n", { flag: "wx" });
}
