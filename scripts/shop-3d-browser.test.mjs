import assert from "node:assert/strict";
import { chromium } from "playwright-core";

// The 3D product view on both product pages: three.js loads only on demand,
// the model mounts and closes cleanly, the keyboard can turn it, and a failed
// download offers a retry without holding a WebGL context.
const origin = process.env.SITE_URL || "http://127.0.0.1:8000";
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || "msedge",
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const ready = (page) => page.waitForFunction(() => !document.querySelector(".shop-viewer__reset").hidden, null, { timeout: 60000 });

try {
  for (const path of ["/he/shop/wifigate/", "/shop/wifigate-roller-shutter/"]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    const errors = [], bundles = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { if (request.url().includes("shop-3d.bundle.js")) bundles.push(request.url()); });
    await page.goto(origin + path, { waitUntil: "load" });
    assert.equal(bundles.length, 0, `${path}: three.js is not loaded with the page`);
    await page.locator("[data-shop-3d]").click();
    await ready(page);
    assert.equal(bundles.length, 1, `${path}: the 3D bundle loads on demand`);
    const canvas = page.locator(".shop-3d__canvas");
    assert.equal(await canvas.count(), 1);
    assert.equal(await canvas.getAttribute("tabindex"), "0");
    assert.match(await canvas.getAttribute("aria-label"), /WIFIGATE/);
    assert.equal(await page.locator(".shop-viewer__nav:visible").count(), 0, "photo arrows are hidden in 3D");
    await canvas.focus();
    const before = await canvas.screenshot();
    for (let turn = 0; turn < 4; turn += 1) await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(400);
    assert.notEqual(Buffer.compare(before, await canvas.screenshot()), 0, `${path}: arrow keys turn the model`);
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector(".shop-3d__canvas"));
    assert.deepEqual(errors, []);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    window.__webglContexts = 0;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      const context = getContext.call(this, type, ...rest);
      if (context && /webgl/.test(type) && !this.__counted) { this.__counted = true; window.__webglContexts += 1; }
      return context;
    };
  });
  let blocked = true;
  await page.route("**/assets/img/shop/3d/*", (route) => (blocked ? route.abort() : route.continue()));
  await page.goto(origin + "/shop/wifigate/", { waitUntil: "load" });
  await page.locator("[data-shop-3d]").click();
  await page.waitForFunction(() => /try again/i.test(document.querySelector(".shop-viewer__hint-text").textContent), null, { timeout: 30000 });
  assert.equal(await page.evaluate(() => window.__webglContexts), 0, "a failed download creates no WebGL context");
  await page.keyboard.press("Escape");
  blocked = false;
  await page.locator("[data-shop-3d]").click();
  await ready(page);
  await page.close();
  console.log("Shop 3D: on-demand three.js, both product models, keyboard turning, clean close, retry after a failed download.");
} finally {
  await browser.close();
}
