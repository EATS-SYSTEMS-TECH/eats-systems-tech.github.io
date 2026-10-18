import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

// The homepage hero video downloads only where it plays on its own: a
// desktop-sized screen without reduced motion or Save-Data. Everyone else
// gets the poster and a play button.
const browser = await chromium.launch({ channel: "chrome", headless: true });
const consent = JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() });

async function visit({ viewport, reducedMotion = "no-preference", saveData = false, effectiveType, expectAutoplay = false }) {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
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
    ["reduced motion", { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" }],
    ["Save-Data", { viewport: { width: 1280, height: 800 }, saveData: true }],
    ["slow connection", { viewport: { width: 1280, height: 800 }, effectiveType: "3g" }],
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
  console.log("Hero video: desktop playback and pause; poster with zero automatic downloads on phones, reduced motion, Save-Data and slow connections; visible keyboard/manual playback and matching poster crop.");
} finally {
  await browser.close();
}
