import assert from "node:assert/strict";
import { after, test } from "node:test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

// Exercise the checked-in page and its real media in isolated Chrome contexts.
// Faults below affect browser inputs only; no product response is substituted.
const chrome = await chromium.launch({ channel: "chrome", headless: true });
after(async () => { await chrome.close(); });
const homeUrl = pathToFileURL(resolve("he/index.html")).href;
const desktop = { width: 1280, height: 800 };
const phone = { width: 390, height: 844 };

// Observe actual playback independently of play() promise settlement. A stale
// promise can settle after a later visitor action, while the media keeps playing.
async function playing(page) {
  await page.waitForFunction(() => {
    const media = document.getElementById("hero-video");
    return document.querySelector(".hero").dataset.heroMediaState === "video"
      && media.currentTime > 0 && !media.paused;
  }, undefined, { timeout: 8000 });
}

async function state(page) {
  return page.evaluate(() => {
    const media = document.getElementById("hero-video");
    return { mode: document.querySelector(".hero").dataset.heroMediaState,
      paused: media.paused, ended: media.ended, position: media.currentTime,
      muted: media.muted, initiallyMuted: media.defaultMuted,
      inline: media.playsInline, loop: media.loop,
      controlPlaying: document.getElementById("hero-replay").dataset.playing };
  });
}

async function enterPrimary(page) {
  await page.locator("#hero-replay").focus();
  await page.keyboard.press("Enter");
  await playing(page);
}

// Always release this scenario's context, including assertion/navigation errors.
// Automatic opt-out cases keep the original real 1.5 second request window.
async function scenario(options, inspect) {
  const context = await chrome.newContext({ viewport: options.viewport ?? desktop,
    reducedMotion: options.osMotion ? "reduce" : "no-preference" });
  try {
    await context.addInitScript(input => {
      localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({
        version: 1, analytics: false, savedAt: Date.now(),
      }));
      if (input.siteMotion) localStorage.setItem("wifigate-accessibility-settings-v2",
        JSON.stringify({ reducedMotion: true }));
      if (input.saveData || input.connection) Object.defineProperty(navigator, "connection", {
        configurable: true, value: { saveData: Boolean(input.saveData), effectiveType: input.connection },
      });
      if (input.firstPlayFault) {
        const nativePlay = HTMLMediaElement.prototype.play;
        let first = true;
        HTMLMediaElement.prototype.play = function (...args) {
          const thisIsFirst = first;first = false;
          if (thisIsFirst && input.firstPlayFault === "denied") {
            return Promise.reject(new DOMException("Browser policy fixture denies first play", "NotAllowedError"));
          }
          const nativeResult = Reflect.apply(nativePlay, this, args);
          return thisIsFirst && input.firstPlayFault === "late"
            ? nativeResult.then(() => new Promise(done => setTimeout(done, 1000))) : nativeResult;
        };
      }
    }, options);
    const page = await context.newPage(), requests = [];
    page.on("request", request => { if (/\.mp4/.test(request.url())) requests.push(request.url()); });
    await page.goto(homeUrl);
    if (options.automatic === false) await page.waitForTimeout(1500);
    else await playing(page);
    await inspect({ page, requests });
  } finally {
    await context.close();
  }
}

// Share behavioral checks across the three connection/viewport combinations;
// seeking advances the actual media, and completion still comes from the clip.
async function inlineControls(page) {
  const initial = await state(page), primary = page.locator("#hero-replay");
  assert.equal(initial.mode, "video");
  assert.equal(initial.muted && initial.initiallyMuted && initial.inline && !initial.loop, true);
  assert.equal(await primary.isVisible(), true);
  const target = await primary.evaluate(control => {
    const box = control.getBoundingClientRect();
    return { height: box.height, hit: control.contains(document.elementFromPoint(
      box.x + box.width / 2, box.y + box.height / 2)) };
  });
  assert.ok(target.hit && target.height >= 44, "primary action has a clear touch target");
  await page.locator("#hero-video").evaluate(media => { media.currentTime = 3; });
  await page.waitForFunction(() => document.getElementById("hero-video").currentTime > 2);
  await primary.click();
  const paused = await state(page);
  assert.equal(paused.paused, true);
  assert.equal(paused.controlPlaying, "false");
  await enterPrimary(page);
  assert.ok((await state(page)).position >= paused.position, "manual resume retains position");
  await page.waitForFunction(() => document.getElementById("hero-replay").dataset.playing === "true");
  assert.equal((await state(page)).controlPlaying, "true");
}

test("desktop autoplay downloads media; pause survives resize and Enter resumes", async () => {
  await scenario({}, async ({ page, requests }) => {
    assert.equal((await state(page)).mode, "video");assert.ok(requests.length > 0);
    await page.locator("#hero-replay").click();
    assert.equal((await state(page)).paused, true);
    await page.setViewportSize({ width: 1400, height: 800 });
    assert.equal((await state(page)).paused, true);
    await enterPrimary(page);
  });
});

for (const [name, options] of [
  ["phone", { viewport: phone }],
  ["phone using3g", { viewport: phone, connection: "3g" }],
  ["desktop using2g", { viewport: desktop, connection: "2g" }],
]) {
  test(`${name}: muted inline single playback and primary pause/resume`, async () => {
    await scenario(options, async ({ page }) => {
      await inlineControls(page);
      if (name !== "phone") return;
      // A real ended condition, never a dispatched event or replaced media clock.
      await page.waitForFunction(() => document.getElementById("hero-video").ended,
        undefined, { timeout: 20000 });
      assert.equal((await state(page)).mode, "image");
      assert.equal(await page.locator("#hero-replay").isVisible(), true);
      await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }));
      await page.waitForTimeout(150);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(250);
      const ended = await state(page);assert.ok(ended.ended && ended.paused, "viewport re-entry does not replay a completed clip");
    });
  });
}

test("a delayed first play promise cannot undo a newer manual resume", async () => {
  await scenario({ viewport: phone, firstPlayFault: "late" }, async ({ page }) => {
    await page.locator("#hero-replay").click();await page.locator("#hero-replay").click();
    await page.waitForTimeout(1200);
    const resumed = await state(page);assert.ok(!resumed.paused && resumed.position > 0);
  });
});

test("browser denial preserves the poster and explicit replay recovers", async () => {
  await scenario({ viewport: phone, firstPlayFault: "denied", automatic: false }, async ({ page }) => {
    assert.equal((await state(page)).mode, "image");
    assert.equal(await page.locator("#hero-replay").isVisible(), true);
    await page.locator("#hero-replay").click();await playing(page);
  });
});

for (const [name, options] of [
  ["OS reduced motion", { osMotion: true }],
  ["stored site reduced motion", { viewport: phone, siteMotion: true }],
  ["Save-Data", { saveData: true }],
]) {
  test(`${name}: no automatic request; explicit playback retains poster framing`, async () => {
    await scenario({ ...options, automatic: false }, async ({ page, requests }) => {
      assert.equal((await state(page)).mode, "image");assert.equal(requests.length, 0);
      const primary = page.locator("#hero-replay");assert.equal(await primary.isVisible(), true);
      await primary.click();await playing(page);
      assert.equal((await state(page)).mode, "video");
      assert.equal(await page.locator("#hero-video").isVisible(), true);
      const framing = await page.locator(".hero__media").evaluate(container => {
        const box = container.getBoundingClientRect(), hero = container.closest(".hero").getBoundingClientRect();
        const poster = getComputedStyle(container.querySelector(".hero__bg--image"));
        const movie = getComputedStyle(container.querySelector("video"));
        return { fills: ["x", "y", "width", "height"].every(key => Math.abs(box[key] - hero[key]) < .5),
          poster: [poster.objectPosition, poster.transform], movie: [movie.objectPosition, movie.transform] };
      });
      assert.equal(framing.fills, true);assert.deepEqual(framing.poster, framing.movie);
    });
  });
}
