import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

// Accepted video scenes keep the full action separate from localized copy.
// Native playback, network policy and motion are qualified by other checks.
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
const origin = process.env.SITE_URL || "http://127.0.0.1:8000";
const screenshotDirectory = process.env.SCREENSHOT_DIR;
const overlaps = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
const contains = (outer, inner) => inner.x >= outer.x - .5 && inner.right <= outer.right + .5 && inner.y >= outer.y - .5 && inner.bottom <= outer.bottom + .5;
let cases = 0;
try {
  if (screenshotDirectory) await fs.mkdir(screenshotDirectory, { recursive: true });
  for (const locale of ["", "he/"]) for (const pageKey of ["", "sports-facilities/", "storage-lockers/"]) for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    await context.addInitScript(() => {
      localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }));
      // Save-Data keeps the real poster/control state stable for layout checks.
      Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
    });
    const page = await context.newPage();
    await page.goto(`${origin}/${locale}${pageKey}`, { waitUntil: "networkidle" });
    const home = !pageKey;
    const result = await page.evaluate((home) => {
      const hero = document.querySelector(home ? ".hero[data-hero-scene]" : ".niche-hero[data-scene-video]");
      const media = hero.querySelector(home ? ".hero__media" : ".niche-hero__media");
      const copy = hero.querySelector(home ? ".hero__content" : ".niche-hero__content");
      const control = hero.querySelector(home ? "#hero-replay" : "[data-scene-play]");
      const image = media.querySelector("img"), video = media.querySelector("video");
      const box = (element) => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
      const point = box(control);
      const topElement = document.elementFromPoint(point.x + point.width / 2, point.y + point.height / 2);
      return { hero: box(hero), media: box(media), copy: box(copy), control: box(control), image: box(image), video: box(video),
        accessibility: box(document.getElementById("a11y-fab")),
        pager: hero.querySelector(".niche-hero__pager") ? box(hero.querySelector(".niche-hero__pager")) : null,
        controlHasName: Boolean(control.getAttribute("aria-label") || control.textContent.trim()),
        controlHitTarget: control === topElement || control.contains(topElement),
        scrollWidth: document.documentElement.scrollWidth, dir: document.documentElement.dir };
    }, home);
    const name = `${locale ? "he" : "en"}-${pageKey.replace(/\/$/, "") || "home"}-${width}`;
    assert.equal(result.dir, locale ? "rtl" : "ltr", `${name}: localized direction stays intact`);
    assert.ok(result.scrollWidth <= width, `${name}: no horizontal overflow`);
    assert.ok(!overlaps(result.media, result.copy), `${name}: copy cannot obscure the person, door or gate`);
    assert.ok(Math.abs(result.media.width / result.media.height - 16 / 9) < .005, `${name}: complete landscape action remains visible`);
    assert.ok(contains(result.hero, result.media) && contains(result.hero, result.copy), `${name}: content stays inside the hero`);
    assert.ok(contains(result.media, result.control), `${name}: playback control stays inside its media`);
    assert.ok(!overlaps(result.control, result.accessibility), `${name}: playback clears the floating accessibility control`);
    if (result.pager) assert.ok(!overlaps(result.control, result.pager), `${name}: playback clears previous/next navigation`);
    assert.ok(result.controlHasName && result.control.height >= 43.9 && result.controlHitTarget, `${name}: named touch target is visible and unobstructed`);
    assert.ok(result.control.bottom < result.media.y + result.media.height / 2, `${name}: control stays in the upper corner, clear of the central action`);
    for (const key of ["x", "y", "width", "height"]) assert.ok(Math.abs(result.image[key] - result.video[key]) < .5, `${name}: poster/video bounds match`);
    if (width < 769) assert.ok(result.media.bottom <= result.copy.y, `${name}: mobile media precedes copy`);
    else assert.ok(Math.abs(result.media.y + result.media.height / 2 - result.copy.y - result.copy.height / 2) < 1, `${name}: desktop panels align beside each other`);
    if (screenshotDirectory) await page.screenshot({ path: path.join(screenshotDirectory, `${name}.png`), fullPage: false });
    cases++;
    await context.close();
  }
  console.log(`Scene media layout: ${cases} Hebrew/English desktop/mobile cases passed; full action beside or above copy, matching poster, unobstructed corner controls.`);
} finally { await browser.close(); }
