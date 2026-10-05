import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { chromium } from "playwright-core";

// The accessibility menu: every locale has complete copy, the menu is a
// keyboard-operable modal dialog, and every adjustment applies, persists and
// resets.
const sandbox = { window: {} };
vm.runInNewContext(await readFile(path.resolve("js/accessibility-copy.js"), "utf8"), sandbox);
const copies = sandbox.window.accessibilityCopy;
const locales = (await readdir(path.resolve("scripts/homepage-copy")))
  .filter((file) => file.endsWith(".mjs"))
  .map((file) => file.slice(0, -4));

const shape = (value) => (value && typeof value === "object"
  ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
  : typeof value);
assert.deepEqual(Object.keys(copies).sort(), locales.sort(), "accessibility copy for every published locale");
for (const locale of locales) {
  assert.deepEqual(shape(copies[locale]), shape(copies.en), `${locale}: accessibility copy keys`);
  const strings = JSON.stringify(copies[locale]);
  assert.doesNotMatch(strings, /""/, `${locale}: empty accessibility string`);
  assert.equal(copies[locale].statusActive.split("{count}").length, 2, `${locale}: {count}`);
  assert.equal(copies[locale].textSize.level.split("{percent}").length, 2, `${locale}: {percent}`);
}

const consent = JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() });
const browser = await chromium.launch({ channel: "chrome", headless: true });
const TOGGLES = {
  highContrast: "a11y-high-contrast",
  grayscale: "a11y-grayscale",
  underlineLinks: "a11y-underlined-links",
  readableFont: "a11y-readable-font",
  textSpacing: "a11y-text-spacing",
  highlightHeadings: "a11y-highlight-headings",
  bigCursor: "a11y-big-cursor",
  focusHighlight: "a11y-focus-highlight",
  reducedMotion: "a11y-reduced-motion",
};

try {
  for (const [locale, file] of [["en", "index.html"], ["he", "he/index.html"], ["el", "el/index.html"], ["ar", "ar/cookies/index.html"]]) {
    const copy = copies[locale];
    const context = await browser.newContext({ viewport: { width: 1280, height: 860 } });
    await context.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.resolve(file)).href);
    const fab = page.locator("#a11y-fab");
    const panel = page.locator("#a11y-panel");
    await fab.waitFor();

    // Localized, with the statement in the page's language.
    assert.equal(await fab.getAttribute("aria-label"), copy.openButton, `${locale}: button label`);
    assert.equal(await page.locator("#a11y-title").innerText(), copy.title, `${locale}: title`);
    assert.equal(await page.locator("#a11y-statement").getAttribute("href"), locale === "en" ? "/accessibility/" : `/${locale}/accessibility/`);

    // Keyboard: Enter opens a modal dialog, Tab stays inside, Esc closes and returns focus.
    await fab.focus();
    await page.keyboard.press("Enter");
    assert.equal(await panel.getAttribute("aria-hidden"), "false", `${locale}: opens from the keyboard`);
    assert.equal(await panel.getAttribute("role"), "dialog");
    assert.equal(await panel.getAttribute("aria-modal"), "true");
    await page.waitForFunction(() => document.activeElement?.id === "a11y-close");
    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press(i % 7 === 6 ? "Shift+Tab" : "Tab");
      assert.equal(await page.evaluate(() => document.getElementById("a11y-panel").contains(document.activeElement)), true, `${locale}: focus left the dialog`);
    }
    await page.keyboard.press("Escape");
    assert.equal(await panel.getAttribute("aria-hidden"), "true");
    assert.equal(await page.evaluate(() => document.activeElement.id), "a11y-fab", `${locale}: focus returns to the button`);

    if (locale !== "en") {
      await context.close();
      continue;
    }

    // Text size: four steps to 150%, then the larger button is disabled.
    await fab.click();
    const rootSize = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    const base = await rootSize();
    for (let i = 0; i < 3; i += 1) await page.locator("#a11y-text-larger").click();
    assert.equal(await rootSize(), base * 1.5);
    assert.equal(await page.locator("#a11y-text-larger").isDisabled(), true);
    assert.equal(await page.locator("#a11y-text-size-value").innerText(), "150%");

    // Every adjustment toggles its class and its pressed state.
    for (const [key, className] of Object.entries(TOGGLES)) {
      const option = page.locator(`[data-a11y-setting="${key}"]`);
      await option.click();
      assert.equal(await option.getAttribute("aria-pressed"), "true", `${key}: pressed`);
      assert.equal(await page.evaluate((name) => document.documentElement.classList.contains(name), className), true, `${key}: applied`);
    }
    assert.equal(await page.locator("#a11y-status").innerText(), copy.statusActive.replace("{count}", 10));
    assert.equal(await page.evaluate(() => [...document.querySelectorAll("video")].every((video) => video.paused)), true, "stop animations pauses video");

    // Kept on this device, and on other pages.
    await page.reload();
    assert.equal(await rootSize(), base * 1.5, "text size persists");
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("a11y-high-contrast")), true, "contrast persists");
    await page.goto(pathToFileURL(path.resolve("cookies/index.html")).href);
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("a11y-grayscale")), true, "applies on other pages");

    // Reset clears everything, including the stored settings.
    await page.locator("#a11y-fab").click();
    await page.locator("#a11y-reset").click();
    assert.equal(await rootSize(), base);
    for (const className of Object.values(TOGGLES)) {
      assert.equal(await page.evaluate((name) => document.documentElement.classList.contains(name), className), false, `${className}: reset`);
    }
    assert.equal(await page.evaluate(() => localStorage.getItem("wifigate-accessibility-settings-v2")), null);
    assert.equal(await page.locator("#a11y-reset").isDisabled(), true);
    await context.close();
  }
  console.log(`Accessibility menu: ${locales.length} locales, keyboard dialog, text size, 9 adjustments, persistence and reset passed.`);
} finally {
  await browser.close();
}
