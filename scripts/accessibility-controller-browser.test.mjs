import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import test from "node:test";
import { chromium } from "playwright-core";

// Serve the actual shared partial and scripts on an isolated local origin. The
// browser's real storage, event listeners and DOM exercise recovery paths that
// the normal complete-page menu/drag tests do not cover.
const [partial, styles, controller, copies] = await Promise.all([
  "../templates/partials/accessibility-widget.template.html", "../css/accessibility.css",
  "../js/accessibility.js", "../js/accessibility-copy.js",
].map(file => readFile(new URL(file, import.meta.url), "utf8")));

test("accessibility controller tolerates bad storage, delayed DOM/copy and repeat setup", async () => {
  const server = createServer((request, response) => {
    if (request.url === "/controller.js" || request.url === "/copies.js") {
      response.setHeader("Content-Type", "text/javascript; charset=utf-8");
      response.end(request.url === "/controller.js" ? controller : copies);
      return;
    }
    const delayed = request.url === "/delayed";
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end(`<!doctype html><html lang="unknown"><head><style>${styles}</style></head>
      <body>${delayed ? "" : partial}<script src="/copies.js"></script>
      ${delayed ? "<script>window.accessibilityCopy={}</script>" : ""}
      <script src="/controller.js"></script></body></html>`);
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const scenario of ["corrupt", "invalid", "denied"]) {
      const context = await browser.newContext();
      await context.addInitScript(kind => {
        if (kind === "denied") {
          for (const method of ["getItem", "setItem", "removeItem"]) Storage.prototype[method] = () => { throw new DOMException("Denied", "SecurityError"); };
        } else localStorage.setItem("wifigate-accessibility-settings-v2", kind === "corrupt" ? "{bad" :
          JSON.stringify({ textScale: 1000, highContrast: "true", grayscale: true, unknown: true }));
      }, scenario);
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.goto(origin);
      assert.equal(await page.locator("#a11y-text-size-value").textContent(), "100%", scenario);
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains("a11y-high-contrast")), false);
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains("a11y-grayscale")), scenario === "invalid");
      const label = await page.locator("#a11y-fab").getAttribute("aria-label");
      assert.equal(label, await page.evaluate(() => window.accessibilityCopy.en.openButton), "unknown locale falls back to English");
      await page.locator("#a11y-fab").click();
      await page.locator('[data-a11y-setting="highContrast"]').click();
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains("a11y-high-contrast")), true);
      await page.locator("#a11y-reset").click();
      assert.equal(await page.evaluate(() => document.documentElement.classList.contains("a11y-high-contrast")), false);
      assert.equal(await page.locator("#a11y-reset").isDisabled(), true);
      assert.deepEqual(errors, [], scenario);
      await context.close();
    }

    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(`${origin}/delayed`);
    await page.evaluate(() => { setupAccessibilityWidget(); setupAccessibilityWidget(); });
    assert.equal(await page.locator(".a11y-fab__dismiss").count(), 0);
    await page.addScriptTag({ content: copies });
    await page.evaluate(markup => {
      // A first-available-only language bundle exercises the final fallback.
      window.accessibilityCopy = { he: window.accessibilityCopy.he };
      document.body.insertAdjacentHTML("afterbegin", markup);
      setupAccessibilityWidget(); setupAccessibilityWidget();
    }, partial);
    assert.equal(await page.locator(".a11y-fab__dismiss").count(), 1, "repeat setup adds no second controller");
    assert.equal(await page.locator("#a11y-fab").getAttribute("aria-label"), await page.evaluate(() => window.accessibilityCopy.he.openButton));
    await page.locator("#a11y-fab").click();
    await page.locator('[data-a11y-setting="highContrast"]').click();
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("a11y-high-contrast")), true, "one click toggles once after repeat setup");
    assert.deepEqual(errors, []);
    await page.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
