import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

// The accessibility button: a long press anywhere on the circle drags it, the
// X that appears hides it until the page loads again, and a plain press opens
// the panel.
const browser = await chromium.launch({ channel: "chrome", headless: true });
const consent = JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() });

async function openPage(context, page = "he/index.html") {
  const tab = await context.newPage();
  await tab.goto(pathToFileURL(path.resolve(page)).href);
  await tab.locator("#a11y-fab").waitFor();
  return tab;
}

async function center(locator) {
  const box = await locator.boundingBox();
  return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
}

try {
  for (const page of ["index.html", "he/index.html", "he/cookies/index.html", "he/electric-gates/index.html"]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
    const tab = await openPage(context, page);
    const fab = tab.locator("#a11y-fab");
    assert.equal(await tab.locator("#a11y-fab img").count(), 0, `${page}: no image to drag natively`);
    assert.equal(await tab.locator("#a11y-fab svg").evaluate((svg) => getComputedStyle(svg).pointerEvents), "none");

    // Long press on the very center, then drag.
    const start = await center(fab);
    await tab.mouse.move(start.x, start.y);
    await tab.mouse.down();
    await tab.waitForTimeout(750);
    assert.equal(await fab.evaluate((button) => button.classList.contains("is-arranging")), true, `${page}: center long press arranges`);
    const target = { x: 640, y: 400 };
    await tab.mouse.move(target.x, target.y, { steps: 12 });
    await tab.mouse.up();
    await tab.waitForTimeout(300);
    const moved = await center(fab);
    assert.ok(Math.abs(moved.x - target.x) < 4 && Math.abs(moved.y - target.y) < 4, `${page}: dragged from the center ${JSON.stringify({ start, moved })}`);
    assert.equal(await tab.locator("#a11y-panel").getAttribute("aria-hidden"), "true", `${page}: a drag does not open the panel`);

    // The X hides the button completely, until the page loads again.
    const dismiss = tab.locator(".a11y-fab__dismiss");
    assert.equal(await dismiss.isVisible(), true);
    await dismiss.click();
    assert.equal(await fab.isVisible(), false, `${page}: X hides the button`);
    assert.equal(await dismiss.isVisible(), false);
    await tab.reload();
    assert.equal(await tab.locator("#a11y-fab").isVisible(), true, `${page}: back after a reload`);
    assert.equal(await tab.evaluate(() => Object.keys(sessionStorage).length), 0, `${page}: nothing kept for the hidden button`);
    await context.close();
  }

  // A plain press opens the panel.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await context.addInitScript((value) => localStorage.setItem("wifigate-cookie-consent-v1", value), consent);
  const tab = await openPage(context);
  const fab = tab.locator("#a11y-fab");
  assert.equal(await fab.isVisible(), true);
  const { x, y } = await center(fab);
  await tab.touchscreen.tap(x, y);
  assert.equal(await tab.locator("#a11y-panel").getAttribute("aria-hidden"), "false", "a tap opens the panel");
  await context.close();
  console.log("Accessibility button: center long press drags, X hides it until a reload, tap opens the panel.");
} finally {
  await browser.close();
}
