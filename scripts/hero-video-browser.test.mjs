import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

// The homepage hero video downloads only where it plays on its own: a
// desktop-sized screen without reduced motion or Save-Data. Everyone else
// gets the poster and a play button.
const browser = await chromium.launch({ channel: "chrome", headless: true });
const consent = JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() });

async function visit({ viewport, reducedMotion = "no-preference", saveData = false }) {
  const context = await browser.newContext({ viewport, reducedMotion });
  await context.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
  if (saveData) {
    await context.addInitScript(() => Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true }));
  }
  const page = await context.newPage();
  const videoRequests = [];
  page.on("request", (request) => { if (/\.mp4/.test(request.url())) videoRequests.push(request.url()); });
  await page.goto(pathToFileURL(path.resolve("he/index.html")).href);
  await page.waitForTimeout(1500);
  const state = await page.locator(".hero").getAttribute("data-hero-media-state");
  const replayVisible = await page.locator("#hero-replay").isVisible();
  return { context, page, state, videoRequests, replayVisible };
}

try {
  const desktop = await visit({ viewport: { width: 1280, height: 800 } });
  assert.equal(desktop.state, "video", "desktop plays the video");
  assert.ok(desktop.videoRequests.length > 0, "desktop downloads the video");
  await desktop.context.close();

  for (const [name, options] of [
    ["phone", { viewport: { width: 390, height: 844 } }],
    ["reduced motion", { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" }],
    ["Save-Data", { viewport: { width: 1280, height: 800 }, saveData: true }],
  ]) {
    const visitResult = await visit(options);
    assert.equal(visitResult.state, "image", `${name}: poster only`);
    assert.equal(visitResult.videoRequests.length, 0, `${name}: the video is not downloaded`);
    assert.equal(visitResult.replayVisible, true, `${name}: a play button is offered`);
    await visitResult.page.locator("#hero-replay").click();
    await visitResult.page.waitForTimeout(500);
    assert.equal(await visitResult.page.locator(".hero").getAttribute("data-hero-media-state"), "video", `${name}: the play button starts it`);
    await visitResult.context.close();
  }
  console.log("Hero video: plays on desktop; poster with a play button and no download on phones, reduced motion and Save-Data.");
} finally {
  await browser.close();
}
