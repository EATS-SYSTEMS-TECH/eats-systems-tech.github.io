import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const origin = process.env.SITE_URL || "http://127.0.0.1:8000";
const screenshots = process.env.SCREENSHOT_DIR;
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "chrome", headless: true });
const overlaps = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;
let cases = 0;
// Start with the accepted-review regression: RTL use-case actions are siblings
// of the media layer, and can reach its lower-right corner on desktop.
const scenarios = [];
for (const locale of ["he/", ""]) for (const width of [1280, 390]) scenarios.push({ locale, route: "roller-shutters/", width, height: 900 });
for (const locale of ["", "he/"]) for (const route of ["roller-shutters/", "shabbat-clock-electric-gate/"]) for (const width of [390, 1280]) for (const height of [700, 600]) scenarios.push({ locale, route, width, height });
for (const locale of ["", "he/"]) for (const route of ["", "hotels-airbnb/", "shabbat-clock-electric-gate/", "wifigate-host/", "auto-open/"]) for (const width of [320, 390, 1280]) scenarios.push({ locale, route, width, height: width < 769 ? 844 : 900 });
try {
  if (screenshots) await fs.mkdir(screenshots, { recursive: true });
  for (const { locale, route, width, height } of scenarios) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.addInitScript(() => {
      localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }));
      Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true } });
    });
    const page = await context.newPage();
    await page.goto(`${origin}/${locale}${route}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const frameCount = await page.locator("[data-media-watermark-frame]").count();
    assert.equal(frameCount, route ? 1 : 6);
    for (let index = 0; index < frameCount; index++) {
      const frame = page.locator("[data-media-watermark-frame]").nth(index);
      await frame.scrollIntoViewIfNeeded();
      await frame.locator("img").first().evaluate(async image => {
        // Scrolling can make the responsive runtime select a lazy source while
        // decode() still refers to its previous URL. Await its actual load.
        if (!image.complete) await new Promise((resolve, reject) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", () => reject(new Error("Media image failed to load")), { once: true });
        });
        if (!image.naturalWidth) throw new Error("Media image has no decoded pixels");
      });
      const result = await frame.evaluate(element => {
        const box = node => { const r = node.getBoundingClientRect(); return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; };
        const mark = element.querySelector(":scope > [data-media-watermark]");
        const style = getComputedStyle(mark), bounds = box(mark);
        const heroElement = element.closest(".hero, .niche-hero");
        const owner = heroElement || element;
        const visible = node => { const s = getComputedStyle(node), r = node.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0; };
        const namedBox = node => ({ ...box(node), name: (node.getAttribute("aria-label") || node.textContent || node.tagName).trim().slice(0, 80) });
        // Primary hero actions live outside the media frame. Include all of
        // them, plus copy blocks, rather than checking only video controls.
        const controls = [...owner.querySelectorAll("button,a,input")].filter(visible).map(namedBox);
        const text = heroElement ? [...heroElement.querySelectorAll("h1,h2,p,.hero__proof,.niche-hero__eyebrow,.niche-hero__breadcrumb")].filter(visible).map(namedBox) : [];
        const hit = document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        const hero = element.matches(".hero__media, .niche-hero__media");
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const expectedRight = hero && document.documentElement.dir !== "rtl"
          ? Math.min(Math.max(rootSize, innerWidth * .02 + rootSize * .8), rootSize * 1.75) + rootSize * 3.75 + 12 : 12;
        const niche = element.matches(".niche-hero__media");
        return { frame: box(element), mark: bounds, pointer: style.pointerEvents, opacity: Number(style.opacity), background: style.backgroundImage, ariaHidden: mark.getAttribute("aria-hidden"), markHit: hit === mark, controls, text, hero, niche, expectedRight, expectedBottom: niche ? 8 : 12, accessibility: box(document.getElementById("a11y-fab")) };
      });
      const name = `${locale || "en"}/${route || "home"}/${width}x${height}/${index}`;
      assert.equal(result.pointer, "none", `${name}: layer cannot intercept clicks`);
      assert.equal(result.ariaHidden, "true");
      assert.equal(result.markHit, false);
      assert.match(result.background, /wifigate-watermark\.png\?v=d4e6db34dc50/);
      assert.ok(result.opacity > 0 && result.opacity < 1);
      for (const control of result.controls) assert.equal(overlaps(result.mark, control), false, `${name}: watermark clears the whole hero action: ${control.name}`);
      for (const block of result.text) assert.equal(overlaps(result.mark, block), false, `${name}: watermark clears hero copy: ${block.name}`);
      assert.ok(result.mark.width >= (result.niche ? 27.9 : 39.9) && result.mark.width <= (result.niche ? 38.1 : 96.1));
      assert.ok(Math.abs(result.frame.right - result.mark.right - result.expectedRight) < 1.1, `${name}: mark stays at physical right with the LTR hero's accessibility clearance`);
      assert.ok(Math.abs(result.frame.bottom - result.mark.bottom - result.expectedBottom) < 1.1, `${name}: mark stays at bottom`);
      assert.ok(result.mark.x >= result.frame.x && result.mark.y >= result.frame.y);
      if (result.hero) assert.equal(overlaps(result.mark, result.accessibility), false, `${name}: watermark clears the default floating accessibility button`);
    }
    await page.locator("main").scrollIntoViewIfNeeded();
    const geometry = await page.evaluate(() => {
      const images = [...document.querySelectorAll("main img")].filter(image => /\.(?:webp|png|jpe?g|avif)(?:\?|$)/i.test(image.getAttribute("src") || ""));
      const targets = [...images, ...document.querySelectorAll("main h1,main h2,main button")];
      const measure = () => targets.map(element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
      const withLayer = measure();
      document.querySelectorAll("[data-media-watermark]").forEach(element => element.remove());
      document.querySelectorAll(".media-watermark-image").forEach(frame => {
        const image = frame.querySelector("img");
        image.className = frame.className.replace(/\s*media-watermark-image\b/, "");
        frame.replaceWith(image);
      });
      document.querySelector("link[data-media-watermark-style]").remove();
      return { withLayer, original: measure(), scrollWidth: document.documentElement.scrollWidth };
    });
    assert.ok(geometry.scrollWidth <= width);
    for (let index = 0; index < geometry.original.length; index++) for (const key of ["x", "y", "width", "height"]) assert.ok(Math.abs(geometry.original[index][key] - geometry.withLayer[index][key]) < .6, `${locale}${route}/${width}: original layout ${index}/${key} is preserved`);
    if (screenshots) {
      await page.reload({ waitUntil: "networkidle" });
      await page.screenshot({ path: path.join(screenshots, `${locale ? "he" : "en"}-${route.replace(/\/$/, "") || "home"}-${width}x${height}.png`), fullPage: !route });
    }
    cases++;
    await context.close();
  }
  console.log(`Media watermark: ${cases} Hebrew/English desktop/mobile cases passed; all displayed media covered, physical bottom-right, no pointer/controls collision and original layout preserved.`);
} finally { await browser.close(); }
