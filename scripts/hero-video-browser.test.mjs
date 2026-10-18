import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

// The homepage autoplays once in view on phones and desktops. Explicit motion
// and data preferences keep the poster until a visitor chooses replay.
const browser = await chromium.launch({ channel: "chrome", headless: true });
const consent = JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() });

async function visit({ viewport, reducedMotion = "no-preference", saveData = false, effectiveType, expectAutoplay = false, siteMotion = false, rejectFirstPlay = false, delayedFirstPlay = false }) {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
  if (siteMotion) await context.addInitScript(() => localStorage.setItem("wifigate-accessibility-settings-v2", JSON.stringify({ reducedMotion: true })));
  if (rejectFirstPlay || delayedFirstPlay) await context.addInitScript(({ rejectFirstPlay, delayedFirstPlay }) => {
    const play = HTMLMediaElement.prototype.play; let calls = 0;
    HTMLMediaElement.prototype.play = function (...args) {
      if (++calls === 1 && rejectFirstPlay) return Promise.reject(new DOMException("Autoplay denied by fixture", "NotAllowedError"));
      const result = play.apply(this, args);
      return calls === 1 && delayedFirstPlay ? result.then(() => new Promise(resolve => setTimeout(resolve, 1000))) : result;
    };
  }, { rejectFirstPlay, delayedFirstPlay });
  if (saveData || effectiveType) {
    await context.addInitScript((value) => Object.defineProperty(navigator, "connection", { value, configurable: true }), { saveData, effectiveType });
  }
  const page = await context.newPage();
  const videoRequests = [];
  page.on("request", (request) => { if (/\.mp4/.test(request.url())) videoRequests.push(request.url()); });
  await page.goto(pathToFileURL(path.resolve("he/index.html")).href);
  if (expectAutoplay) {
    await page.waitForFunction(() => {
      const video = document.getElementById("hero-video");
      return document.querySelector(".hero").dataset.heroMediaState === "video" && !video.paused && video.currentTime > 0;
    }, undefined, { timeout: 8000 });
  } else {
    // Keep a real observation window for the zero-automatic-request cases.
    await page.waitForTimeout(1500);
  }
  const state = await page.locator(".hero").getAttribute("data-hero-media-state");
  const replayVisible = await page.locator("#hero-replay").isVisible();
  return { context, page, state, videoRequests, replayVisible };
}

try {
  const desktop = await visit({ viewport: { width: 1280, height: 800 }, expectAutoplay: true });
  assert.equal(desktop.state, "video", "desktop plays the video");
  assert.ok(desktop.videoRequests.length > 0, "desktop downloads the video");
  await desktop.page.locator("#hero-pause-toggle").click();
  assert.equal(await desktop.page.locator("#hero-video").evaluate((video) => video.paused), true, "visitor can pause playback");
  await desktop.page.setViewportSize({ width: 1400, height: 800 });
  assert.equal(await desktop.page.locator("#hero-video").evaluate((video) => video.paused), true, "resize preserves the visitor pause");
  await desktop.page.locator("#hero-pause-toggle").focus();
  await desktop.page.keyboard.press("Enter");
  await desktop.page.waitForFunction(() => !document.getElementById("hero-video").paused);
  await desktop.context.close();

  for (const [name, options] of [
    ["phone", { viewport: { width: 390, height: 844 } }],
    ["phone on3g", { viewport: { width: 390, height: 844 }, effectiveType: "3g" }],
    ["desktop on2g", { viewport: { width: 1280, height: 800 }, effectiveType: "2g" }],
  ]) {
    const result = await visit({ ...options, expectAutoplay: true });
    const video = result.page.locator("#hero-video"), replay = result.page.locator("#hero-replay");
    assert.equal(result.state, "video", `${name}: autoplay starts before input`);
    assert.equal(await video.evaluate(v => v.muted && v.defaultMuted && v.playsInline && !v.loop), true, `${name}: muted inline single playback`);
    assert.equal(await replay.isVisible(), true, `${name}: replay remains visible during playback`);
    const controls = await result.page.evaluate(() => ["hero-replay", "hero-pause-toggle"].map(id => {
      const e = document.getElementById(id), r = e.getBoundingClientRect(); return { id, width: r.width, height: r.height, hit: e.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) };
    }));
    assert.ok(controls.every(control => control.hit && control.height >= 44), `${name}: replay and compact pause have unobstructed touch targets`);
    for (const paused of [false, true]) {
      await video.evaluate(v => { v.currentTime = 3; });
      await result.page.waitForFunction(() => document.getElementById("hero-video").currentTime > 2);
      if (paused) await result.page.locator("#hero-pause-toggle").click();
      await replay.focus(); await result.page.keyboard.press("Enter");
      await result.page.waitForFunction(() => { const v = document.getElementById("hero-video"); return !v.paused && v.currentTime > 0 && v.currentTime < 1; });
      assert.equal(await replay.isVisible(), true, `${name}: replay restarts at zero while ${paused ? "paused" : "playing"}`);
    }
    if (name === "phone") {
      // Observe the actual complete15s clip after replay, without faking an
      // ended event. Viewport re-entry must not start a completed clip again.
      await result.page.waitForFunction(() => document.getElementById("hero-video").ended, undefined, { timeout: 20000 });
      assert.equal(await result.page.locator(".hero").getAttribute("data-hero-media-state"), "image", "finished home video returns to its matching poster");
      assert.equal(await replay.isVisible(), true, "finished home retains replay");
      await result.page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await result.page.waitForTimeout(150);
      await result.page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await result.page.waitForTimeout(250);
      assert.equal(await video.evaluate(v => v.ended && v.paused), true, "completed home does not loop on viewport re-entry");
    }
    await result.context.close();
  }

  const superseded = await visit({ viewport: { width: 390, height: 844 }, expectAutoplay: true, delayedFirstPlay: true });
  await superseded.page.locator("#hero-pause-toggle").click();
  await superseded.page.locator("#hero-pause-toggle").click();
  await superseded.page.waitForTimeout(1200);
  assert.equal(await superseded.page.locator("#hero-video").evaluate(v => !v.paused && v.currentTime > 0), true, "older pending autoplay cannot pause the newer manual resume");
  await superseded.context.close();

  const denied = await visit({ viewport: { width: 390, height: 844 }, rejectFirstPlay: true });
  assert.equal(denied.state, "image", "browser autoplay rejection retains poster");
  assert.equal(denied.replayVisible, true, "browser autoplay rejection retains visible replay");
  await denied.page.locator("#hero-replay").click();
  await denied.page.waitForFunction(() => { const v = document.getElementById("hero-video"); return !v.paused && v.currentTime > 0; });
  await denied.context.close();

  for (const [name, options] of [
    ["reduced motion", { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" }],
    ["site accessibility motion", { viewport: { width: 390, height: 844 }, siteMotion: true }],
    ["Save-Data", { viewport: { width: 1280, height: 800 }, saveData: true }],
  ]) {
    const visitResult = await visit(options);
    assert.equal(visitResult.state, "image", `${name}: poster only`);
    assert.equal(visitResult.videoRequests.length, 0, `${name}: the video is not downloaded`);
    assert.equal(visitResult.replayVisible, true, `${name}: a play button is offered`);
    await visitResult.page.locator("#hero-replay").click();
    await visitResult.page.waitForFunction(() => {
      const video = document.getElementById("hero-video");
      return document.querySelector(".hero").dataset.heroMediaState === "video" && !video.paused && video.currentTime > 0;
    }, undefined, { timeout: 8000 });
    assert.equal(await visitResult.page.locator(".hero").getAttribute("data-hero-media-state"), "video", `${name}: the play button starts it`);
    assert.equal(await visitResult.page.locator("#hero-video").isVisible(), true, `${name}: explicit playback is visible`);
    const framing = await visitResult.page.locator(".hero__media").evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const hero = element.closest(".hero").getBoundingClientRect();
      const image = element.querySelector(".hero__bg--image");
      const video = element.querySelector("video");
      return { fullHeroBackground: ["x", "y", "width", "height"].every((key) => Math.abs(bounds[key] - hero[key]) < .5),
        imagePosition: getComputedStyle(image).objectPosition, videoPosition: getComputedStyle(video).objectPosition,
        imageTransform: getComputedStyle(image).transform, videoTransform: getComputedStyle(video).transform };
    });
    assert.ok(framing.fullHeroBackground, `${name}: video keeps the original full-bleed image hero`);
    assert.equal(framing.imagePosition, framing.videoPosition, `${name}: image/video crop matches`);
    assert.equal(framing.imageTransform, framing.videoTransform, `${name}: image/video scale matches`);
    await visitResult.context.close();
  }
  console.log("Hero video: phone/desktop autoplay, in-play and paused replay from zero, usable replay/pause controls, stale-play and rejection recovery; explicit motion/SaveData zero-download preferences and matching poster crop.");
} finally {
  await browser.close();
}
