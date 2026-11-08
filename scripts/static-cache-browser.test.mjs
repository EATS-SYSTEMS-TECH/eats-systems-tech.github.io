import assert from "node:assert/strict";
import { chromium } from "playwright-core";

// A real browser: the first visit installs and warms the worker, the next visit takes
// styles, scripts, fonts and images from the device while the page itself
// still comes from the network. Serve the site like GitHub Pages first:
// CACHE_CONTROL=max-age=600 PORT=8010 node scripts/serve.mjs
const origin = process.env.SITE_URL || "http://127.0.0.1:8010";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
try {
  for (const path of ["/he/", "/he/shop/wifigate/", "/he/login/"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin + path, { waitUntil: "load" });
    // The first visit hands the files it loaded to the worker.
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 15000 });
    let stored = -1;
    for (let round = 0; round < 30; round += 1) {
      const count = await page.evaluate(async () => (await (await caches.open("wifigate-static-v1-%2F")).keys()).length);
      if (count > 5 && count === stored) break;
      stored = count;
      await page.waitForTimeout(500);
    }
    const hits = [], documents = [];
    page.on("response", async (response) => {
      if (response.request().resourceType() === "document") documents.push(response.fromServiceWorker());
      if (response.headers()["x-wifigate-static-cache"] === "hit") hits.push(new URL(response.url()).pathname);
    });
    await page.reload({ waitUntil: "load" });
    await page.waitForTimeout(500);
    assert.ok(hits.some((hit) => hit.endsWith(".css")), `${path}: styles come from the device (${hits.join(", ")})`);
    assert.ok(hits.some((hit) => hit.endsWith(".js")), `${path}: scripts come from the device`);
    assert.ok(hits.some((hit) => /\.(?:webp|png|svg|woff2?)$/.test(hit)), `${path}: images or fonts come from the device`);
    assert.deepEqual(documents, [false], `${path}: the page itself always comes from the network`);
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log("Static cache: worker installs on public pages; repeat visits take styles, scripts, fonts and images from the device; pages stay network-fresh.");
} finally {
  await browser.close();
}
