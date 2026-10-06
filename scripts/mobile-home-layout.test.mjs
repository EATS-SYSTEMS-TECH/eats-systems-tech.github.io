import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge", headless: true });
const consent = JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() });
const selectors = [
  ".site-header", ".nav__brand", ".site-login__trigger", ".language-selector__button", ".nav__toggle",
  ".hero", ".hero__text", ".hero__title", ".hero__subtitle", ".hero__actions", ".hero__proof", "#hero-replay", ".a11y-fab",
];
const overlaps = (a, b) => a.x < b.right && a.right > b.x && a.y < b.bottom && a.bottom > b.y;

try {
  for (const [locale, width, height, textScale = 100] of [
    ["", 412, 915], ["he/", 412, 915], ["", 412, 660], ["he/", 412, 660],
    ["", 320, 568], ["he/", 320, 568], ["", 412, 660, 125], ["he/", 412, 660, 125],
    ["", 320, 568, 125], ["he/", 320, 568, 125],
  ]) {
    const context = await browser.newContext({ viewport: { width, height }, isMobile: true, deviceScaleFactor: 2 });
    await context.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
    const page = await context.newPage();
    await page.goto(`${process.env.SITE_URL ?? "http://127.0.0.1:8000"}/${locale}`, { waitUntil: "networkidle" });
    if (textScale !== 100) await page.addStyleTag({ content: `html { font-size: ${textScale}%; }` });
    const result = await page.evaluate((items) => {
      const box = (selector) => {
        const element = document.querySelector(selector);
        const rect = element.getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
      };
      return { scrollWidth: document.documentElement.scrollWidth, boxes: Object.fromEntries(items.map((item) => [item, box(item)])) };
    }, selectors);
    const label = `${locale || "en"} ${width}×${height} at ${textScale}% text`;
    const box = result.boxes;
    assert.ok(result.scrollWidth <= width, `${label}: no horizontal page overflow`);
    assert.ok(box[".hero__title"].y >= box[".site-header"].bottom, `${label}: headline clears the header`);
    assert.ok(box[".hero__subtitle"].y >= box[".hero__title"].bottom, `${label}: subtitle clears the headline`);
    assert.ok(box[".hero__actions"].y >= box[".hero__subtitle"].bottom, `${label}: actions clear the subtitle`);
    assert.ok(box[".hero__proof"].y >= box[".hero__actions"].bottom, `${label}: benefits clear the actions`);
    assert.ok(box[".hero__proof"].bottom + 12 <= box["#hero-replay"].y, `${label}: video button clears the benefits`);
    assert.ok(box["#hero-replay"].bottom <= box[".hero"].bottom, `${label}: video button remains in the hero`);
    assert.ok(!overlaps(box[".hero__proof"], box[".a11y-fab"]), `${label}: accessibility button clears the benefits`);
    for (const first of [".nav__brand", ".site-login__trigger", ".language-selector__button"]) {
      for (const second of [".site-login__trigger", ".language-selector__button", ".nav__toggle"]) {
        if (first === second) continue;
        assert.ok(!overlaps(box[first], box[second]), `${label}: ${first} clears ${second}`);
      }
    }
    const bottomControls = await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      const hero = document.querySelector(".hero");
      window.scrollTo(0, hero.getBoundingClientRect().bottom + scrollY - innerHeight);
      const pick = (selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom };
      };
      return { replay: pick("#hero-replay"), accessibility: pick(".a11y-fab") };
    });
    assert.ok(!overlaps(bottomControls.replay, bottomControls.accessibility), `${label}: video and accessibility buttons clear each other`);
    await context.close();
  }
  console.log("Mobile homepage layout: English and Hebrew are clear at 412×915, 412×660 and 320×568, including enlarged text.");
} finally {
  await browser.close();
}
