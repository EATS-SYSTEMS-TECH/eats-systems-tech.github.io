import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

// Video replaces the original full-bleed hero image, with copy overlaid on it.
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
    if (!home) await page.locator("[data-scene-replay]").scrollIntoViewIfNeeded();
    const result = await page.evaluate((home) => {
      const hero = document.querySelector(home ? ".hero[data-hero-scene]" : ".niche-hero[data-scene-video]");
      const media = hero.querySelector(home ? ".hero__media" : ".niche-hero__media");
      const copy = hero.querySelector(home ? ".hero__content" : ".niche-hero__content");
      const control = hero.querySelector(home ? "#hero-replay" : "[data-scene-replay]");
      const image = media.querySelector("img"), video = media.querySelector("video");
      const box = (element) => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
      const point = box(control);
      const topElement = document.elementFromPoint(point.x + point.width / 2, point.y + point.height / 2);
      const overlay = hero.querySelector(home ? ".hero__overlay" : ".niche-hero__overlay");
      const title = hero.querySelector("h1");
      const controls = hero.querySelector(home ? "#hero-replay" : ".scene-video-controls");
      const attribute = home ? "data-hero-scene" : "data-scene-video";
      const value = hero.getAttribute(attribute);
      const controlStyle = controls.getAttribute("style");
      // The underlying styles are unchanged from the original image heroes.
      // Measure that base layout independently of accepted-media overrides.
      hero.removeAttribute(attribute);
      controls.style.setProperty("display", "none", "important");
      const originalBase = { hero: box(hero), media: box(media), copy: box(copy), title: box(title), titleFontSize: getComputedStyle(title).fontSize };
      hero.setAttribute(attribute, value);
      if (controlStyle === null) controls.removeAttribute("style"); else controls.setAttribute("style", controlStyle);
      const framing = (element) => { const css = getComputedStyle(element); return { fit: css.objectFit, position: css.objectPosition, transform: css.transform }; };
      return { hero: box(hero), media: box(media), copy: box(copy), control: box(control), image: box(image), video: box(video),
        title: box(title), titleFontSize: getComputedStyle(title).fontSize, originalBase,
        imageFraming: framing(image), videoFraming: framing(video),
        overlayVisible: getComputedStyle(overlay).display !== "none" && getComputedStyle(overlay).backgroundImage !== "none",
        accessibility: box(document.getElementById("a11y-fab")),
        navigation: [...hero.querySelectorAll(".niche-hero__nav-button")].map(box),
        controlHasName: Boolean(control.getAttribute("aria-label") || control.textContent.trim()),
        controlHitTarget: control === topElement || control.contains(topElement),
        primaryActionButtons: hero.querySelectorAll(".niche-hero__actions button").length,
        primaryActionLinks: hero.querySelectorAll(".niche-hero__actions a").length,
        scrollWidth: document.documentElement.scrollWidth, dir: document.documentElement.dir };
    }, home);
    const name = `${locale ? "he" : "en"}-${pageKey.replace(/\/$/, "") || "home"}-${width}`;
    assert.equal(result.dir, locale ? "rtl" : "ltr", `${name}: localized direction stays intact`);
    assert.ok(result.scrollWidth <= width, `${name}: no horizontal overflow`);
    assert.ok(overlaps(result.media, result.copy) && overlaps(result.media, result.title), `${name}: original copy is overlaid on the video`);
    assert.ok(result.overlayVisible, `${name}: original readability gradient stays visible`);
    for (const key of ["x", "y", "width", "height"]) {
      assert.ok(Math.abs(result.hero[key] - result.media[key]) < .5, `${name}: media fills the original hero edge to edge`);
      for (const part of ["hero", "media", "copy", "title"]) assert.ok(Math.abs(result[part][key] - result.originalBase[part][key]) < .5, `${name}: original ${part} ${key} is preserved`);
    }
    assert.equal(result.titleFontSize, result.originalBase.titleFontSize, `${name}: original typography stays intact`);
    assert.ok(contains(result.hero, result.media) && contains(result.hero, result.copy), `${name}: content stays inside the hero`);
    assert.ok(contains(result.media, result.control), `${name}: playback control stays inside its media`);
    assert.ok(!overlaps(result.control, result.accessibility), `${name}: playback clears the floating accessibility control`);
    for (const navigation of result.navigation) assert.ok(!overlaps(result.control, navigation), `${name}: playback clears previous/next navigation`);
    assert.ok(result.controlHasName && result.control.height >= 43.9 && result.controlHitTarget, `${name}: named touch target is visible and unobstructed`);
    if (home) assert.ok(result.control.bottom < result.media.y + result.media.height / 2, `${name}: home control stays in the upper corner`);
    else {
      assert.equal(result.primaryActionButtons, 1, `${name}: one replay CTA`);
      assert.equal(result.primaryActionLinks, 0, `${name}: former CTA links are absent`);
    }
    for (const key of ["x", "y", "width", "height"]) assert.ok(Math.abs(result.image[key] - result.video[key]) < .5, `${name}: poster/video bounds match`);
    assert.deepEqual(result.videoFraming, result.imageFraming, `${name}: video and poster share the original image crop`);
    if (screenshotDirectory) await page.screenshot({ path: path.join(screenshotDirectory, `${name}.png`), fullPage: false });
    cases++;
    await context.close();
  }
  console.log(`Scene media layout: ${cases} Hebrew/English desktop/mobile cases passed; original edge-to-edge image geometry and text overlay, matching video crop, unobstructed controls.`);
} finally { await browser.close(); }
