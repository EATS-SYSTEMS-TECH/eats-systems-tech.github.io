import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { createServer } from "node:http";
import { chromium } from "playwright-core";

// This fixture uses the existing hero clip to qualify the media controller.
// Scene content/motion and the eleven deliverable clips are audited separately.
const style = await fs.readFile(new URL("../css/scene-video.css", import.meta.url), "utf8");
const script = await fs.readFile(new URL("../js/scene-video.js", import.meta.url), "utf8");
const fixtureAssets = new Map(await Promise.all([
  ["/assets/img/wifigate_homepage.webp", "image/webp"],
  ["/assets/vid/wifigate-final-hero-720p.mp4", "video/mp4"],
].map(async ([pathname, contentType]) => {
  const bytes = await fs.readFile(new URL(`..${pathname}`, import.meta.url));
  assert.ok(bytes.length > 0, `Scene fixture asset is empty: ${pathname}`);
  return [pathname, { contentType, bytes }];
})));

// Own only these public fixture assets and an OS-assigned loopback port. The
// intercepted HTML used to hide an absent localhost:8000 media server until
// the playback assertion timed out. Never depend on or stop a user's server.
const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://127.0.0.1").pathname;
  const asset = fixtureAssets.get(pathname);
  if (!asset || !["GET", "HEAD"].includes(request.method)) {
    response.writeHead(404);
    response.end("No fixture asset");
    return;
  }
  response.writeHead(200, {
    "Content-Type": asset.contentType,
    "Content-Length": asset.bytes.length,
    "Cache-Control": "no-store",
  });
  response.end(request.method === "HEAD" ? undefined : asset.bytes);
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const origin = `http://127.0.0.1:${server.address().port}`;
let browser;
let assertions = 0;
const check = (value, expected, message) => { assert.equal(value, expected, message); assertions++; };

async function visit({ width = 1280, reducedMotion = "no-preference", connection = {}, fail = false, offscreen = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 800 }, reducedMotion });
  await context.addInitScript((value) => Object.defineProperty(navigator, "connection", { value, configurable: true }), connection);
  const page = await context.newPage();
  const mediaRequests = [];
  page.on("request", (request) => { if (/\.mp4(?:\?|$)/.test(request.url())) mediaRequests.push(request.url()); });
  if (fail) await page.route("**/*.mp4", (route) => route.fulfill({ status: 404, body: "fixture failure" }));
  await page.route("**/__scene-controller-test", (route) => route.fulfill({ contentType: "text/html", body: `
    <!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>Scene controller fixture</title>
    <style>${style} body{margin:0}.fixture{width:min(640px,100%);aspect-ratio:16/9}img{width:100%;height:100%;object-fit:cover}#spacer{height:${offscreen ? 1200 : 0}px}</style>
    <div id="spacer"></div><section class="fixture" data-scene-video>
      <img data-scene-image src="/assets/img/wifigate_homepage.webp" width="1280" height="720" alt="Fixture image" fetchpriority="high">
      <video data-video-src="/assets/vid/wifigate-final-hero-720p.mp4" preload="none" muted playsinline aria-hidden="true" poster="/assets/img/wifigate_homepage.webp"></video>
      <div class="scene-video-controls"><button data-scene-play>Play</button><button data-scene-pause hidden>Pause</button></div>
      <script type="application/json" data-scene-copy>{"play":"הפעלת הסרטון","pause":"השהיית הסרטון","replay":"נגן את הסרטון שוב"}</script>
    </section><script>${script}</script></html>` }));
  await page.goto(`${origin}/__scene-controller-test`);
  return { context, page, mediaRequests };
}

try {
  for (const [pathname, asset] of fixtureAssets) {
    const response = await fetch(`${origin}${pathname}`);
    check(response.status, 200, `${pathname}: fixture HTTP status`);
    check(response.headers.get("content-type"), asset.contentType, `${pathname}: fixture content type`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), asset.bytes, `${pathname}: fixture delivers the actual media bytes`);
    assertions++;
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const [name, settings] of [
    ["phone", { width: 390 }], ["768px", { width: 768 }],
    ["reduced motion", { reducedMotion: "reduce" }],
    ["Save-Data", { connection: { saveData: true } }],
    ["slow-2g", { connection: { effectiveType: "slow-2g" } }],
    ["2g", { connection: { effectiveType: "2g" } }],
    ["3g", { connection: { effectiveType: "3g" } }],
    ["outside viewport", { offscreen: true }],
  ]) {
    const { context, page, mediaRequests } = await visit(settings);
    await page.waitForTimeout(600);
    check(mediaRequests.length, 0, `${name}: zero automatic video requests`);
    check(await page.locator("video").getAttribute("src"), null, `${name}: no attached source`);
    check(await page.locator("[data-scene-video]").getAttribute("data-scene-state"), "image", `${name}: image stays visible`);
    if (!settings.offscreen) {
      await page.locator("[data-scene-play]").focus();
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => document.querySelector("[data-scene-video]").dataset.sceneState === "video");
      check(mediaRequests.length > 0, true, `${name}: keyboard playback explicitly downloads`);
      check(await page.locator("video").evaluate((video) => video.muted && video.defaultMuted && !video.loop), true, `${name}: silent single playback`);
      check(await page.locator("[data-scene-pause]").getAttribute("aria-label"), "השהיית הסרטון", `${name}: localized control`);
    }
    await context.close();
  }

  const desktop = await visit({ width: 769 });
  await desktop.page.waitForFunction(() => document.querySelector("[data-scene-video]").dataset.sceneState === "video");
  check(desktop.mediaRequests.length > 0, true, "769px: automatic playback downloads");
  await desktop.page.locator("[data-scene-pause]").click();
  check(await desktop.page.locator("video").evaluate((video) => video.paused), true, "visitor pause takes effect");
  await desktop.page.setViewportSize({ width: 1280, height: 800 });
  await desktop.page.waitForTimeout(200);
  check(await desktop.page.locator("video").evaluate((video) => video.paused), true, "resize preserves visitor pause");
  await desktop.page.locator("[data-scene-pause]").click();
  await desktop.page.waitForFunction(() => !document.querySelector("video").paused);
  await desktop.page.emulateMedia({ reducedMotion: "reduce" });
  await desktop.page.waitForFunction(() => document.querySelector("[data-scene-video]").dataset.sceneState === "image");
  check(await desktop.page.locator("video").evaluate((video) => video.paused), true, "changed motion preference stops playback");
  await desktop.context.close();

  const failed = await visit({ fail: true });
  await failed.page.waitForTimeout(600);
  check(await failed.page.locator("[data-scene-video]").getAttribute("data-scene-state"), "image", "failed media retains image");
  check(await failed.page.locator("[data-scene-play]").isVisible(), true, "failed media retains manual control");
  await failed.context.close();
  console.log(`Scene controller: ${assertions} assertions passed; network policy, keyboard playback, pause, preference changes and error fallback. Deliverable scene motion remains separate.`);
} finally {
  try { await browser?.close(); }
  finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}
