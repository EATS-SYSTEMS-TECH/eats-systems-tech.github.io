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
    // Dimensions show by default, inside the view, and the toggle hides them.
    const dimensions = await page.locator(".shop-3d__dimension").allTextContents();
    assert.deepEqual(dimensions.map((text) => Number.parseInt(text, 10)), path.includes("roller") ? [370, 155, 70] : [83, 81, 56]);
    assert.ok(await page.evaluate(() => { const view = document.querySelector(".shop-3d").getBoundingClientRect();
      return [...document.querySelectorAll(".shop-3d__dimension")].every((label) => { const box = label.getBoundingClientRect(); return box.left >= view.left && box.right <= view.right && box.top >= view.top && box.bottom <= view.bottom; }); }),
      `${path}: every dimension label sits inside the 3D view`);
    await page.locator(".shop-viewer__dimensions").click();
    assert.equal(await page.getAttribute(".shop-viewer__dimensions", "aria-pressed"), "false");
    await page.waitForFunction(() => [...document.querySelectorAll(".shop-3d__dimension")].every((label) => label.style.display === "none"));
    await page.locator(".shop-viewer__dimensions").click();
    assert.match(await page.locator(".shop-viewer__note").innerText(), path.startsWith("/he/") ? /להמחשה בלבד/ : /illustration only/i);
    assert.match(await page.locator(".shop-product-gallery__note").innerText(), path.startsWith("/he/") ? /להמחשה בלבד/ : /illustration only/i);
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

  // Ten open/close rounds and a close while loading leave no live 3D view.
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
    await page.goto(origin + "/he/shop/wifigate-roller-shutter/", { waitUntil: "load" });
    for (let round = 0; round < 10; round += 1) {
      await page.locator("[data-shop-3d]").click();
      await ready(page);
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector(".shop-3d, .shop-3d__canvas, .shop-3d__labels"));
    }
    await page.locator("[data-shop-3d]").click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(4000);
    assert.equal(await page.locator(".shop-3d, .shop-3d__canvas").count(), 0, "a view closed while loading never appears");
    assert.equal(await page.locator(".shop-viewer").evaluate((dialog) => dialog.open), false);
    await page.close();
  }

  // The site's worker would fetch the textures itself, outside page.route.
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block" });
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
  console.log("Shop 3D: on-demand three.js, both models with dimensions and toggle, illustration notes, keyboard turning, ten clean open/close rounds, close while loading, retry after a failed download.");
} finally {
  await browser.close();
}
