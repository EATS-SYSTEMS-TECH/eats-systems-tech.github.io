import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const locale of ["en", "he"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const file = path.resolve(locale === "en" ? "index.html" : "he/index.html");
    await page.goto(pathToFileURL(file).href);
    const panel = page.getByRole("dialog", { name: locale === "he" ? "העדפות פרטיות ועוגיות" : "Privacy and cookie preferences" });
    await panel.waitFor();
    assert.equal(await panel.isVisible(), true);
    if (process.env.CONSENT_SCREENSHOTS) await page.screenshot({ path: path.resolve(`.cookie-consent-${locale}.png`) });
    assert.equal(await page.evaluate(() => localStorage.getItem("wifigate-cookie-consent-v1")), null);
    await panel.getByRole("button", { name: locale === "he" ? "רק הכרחי" : "Essential only" }).click();
    assert.equal(await panel.isVisible(), false);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("wifigate-cookie-consent-v1")).analytics), false);
    await page.reload();
    assert.equal(await panel.isVisible(), false);
    await page.locator("[data-cookie-settings]").click();
    assert.equal(await panel.isVisible(), true);
    await panel.locator("[data-cookie-analytics]").check();
    await panel.locator("[data-cookie-save]").click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("wifigate-cookie-consent-v1")).analytics), true);
    await page.reload();
    assert.equal(await panel.isVisible(), false);
    await context.close();
  }
  const context = await browser.newContext();
  const source = (await readFile(path.resolve("js/cookie-consent.js"), "utf8"))
    .replace('const GA_MEASUREMENT_ID = "";', 'const GA_MEASUREMENT_ID = "G-TEST12345";');
  let googleRequests = 0;
  await context.route(/cookie-consent\.js/, (route) => route.fulfill({ body: source, contentType: "text/javascript" }));
  await context.route("https://www.googletagmanager.com/**", (route) => {
    googleRequests += 1;
    return route.fulfill({ body: "", contentType: "text/javascript" });
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.resolve("index.html")).href);
  assert.equal(googleRequests, 0, "Analytics must not load before consent");
  await page.locator("[data-cookie-accept]").click();
  assert.equal(googleRequests, 1, "Analytics loads after consent");
  assert.equal(await page.evaluate(() => window["ga-disable-G-TEST12345"]), false);
  await page.locator("[data-cookie-settings]").click();
  await page.locator("[data-cookie-reject]").click();
  assert.equal(await page.evaluate(() => window["ga-disable-G-TEST12345"]), true);
  await context.close();
  console.log("Cookie consent choice, persistence, reopening and analytics gating passed.");
} finally {
  await browser.close();
}
