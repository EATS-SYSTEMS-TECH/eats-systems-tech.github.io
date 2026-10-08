import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";

const pageUrl = new URL("../wifigate-link/index.html", import.meta.url);
const appUrl = "https://example.test/open?ep=sample";

test("invitation handoff shows a stable fallback and copies its app link", async () => {
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 568 }, isMobile: true });
    await context.addInitScript(() => {
      localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }));
      window.copiedLinks = [];
      window.autoAttempts = 0;
      const schedule = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => {
        if (delay === 40) {
          window.autoAttempts += 1;
          return 0;
        }
        return schedule(callback, delay, ...args);
      };
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async (value) => { window.copiedLinks.push(value); } },
      });
    });
    const page = await context.newPage();
    let openAttempts = 0;
    await page.route("https://example.test/**", (route) => {
      openAttempts += 1;
      return route.abort();
    });

    await page.goto(`${pageUrl.href}?link=${encodeURIComponent(appUrl)}`, { waitUntil: "domcontentloaded" });
    assert.equal(await page.locator("#page-title").innerText(), "Opening WiFiGate…");
    assert.equal(await page.locator("#status").innerText(), "This should only take a moment.");
    assert.equal(await page.locator("#open-app").isVisible(), false);

    await page.waitForTimeout(1100);
    assert.equal(await page.evaluate(() => window.autoAttempts), 1, "automatic opening is scheduled once");
    assert.equal(await page.locator("#page-title").innerText(), "Continue in WiFiGate");
    assert.equal(await page.locator("#status").innerText(), "Didn't open automatically? Tap below to try again.");
    assert.equal(await page.locator("#open-app").getAttribute("href"), appUrl);
    assert.equal(await page.locator("#copy-link").innerText(), "Copy link");
    assert.equal(await page.locator("#spinner").isVisible(), false);

    const layout = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      buttons: ["#open-app", "#copy-link"].map((selector) => {
        const rect = document.querySelector(selector).getBoundingClientRect();
        return { width: rect.width, height: rect.height, right: rect.right };
      }),
    }));
    assert.ok(layout.scrollWidth <= 320, "no horizontal overflow on a narrow phone");
    for (const button of layout.buttons) {
      assert.ok(button.height >= 48 && button.width >= 200 && button.right <= 320, "touch targets fit the viewport");
    }

    if (process.env.WIFIGATE_SCREENSHOT) await page.screenshot({ path: process.env.WIFIGATE_SCREENSHOT });

    await page.locator("#open-app").focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement.id), "copy-link", "focus moves from opening to copying");

    await page.locator("#copy-link").click();
    assert.deepEqual(await page.evaluate(() => window.copiedLinks), [appUrl]);
    assert.equal(await page.locator("#feedback").innerText(), "Link copied!");
    assert.equal(await page.locator("#feedback").getAttribute("role"), "status");

    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async () => { throw new Error("Clipboard unavailable"); } },
      });
    });
    await page.locator("#copy-link").click();
    assert.equal(await page.locator("#feedback").innerText(), "Couldn't copy link. Please try again.");

    await page.locator("#open-app").click();
    await page.waitForTimeout(150);
    assert.equal(openAttempts, 1, "the button retries the same link once");

    const apiPage = await context.newPage();
    const apiUrl = new URL("../wifigate-api/index.html", import.meta.url);
    await apiPage.goto(`${apiUrl.href}?ep=sample`, { waitUntil: "domcontentloaded" });
    await apiPage.waitForTimeout(1000);
    assert.equal(
      await apiPage.locator("#open-app").getAttribute("href"),
      "wifigate://gate/invite?ep=sample&id=invite",
      "the API invitation keeps the existing deep-link parameters",
    );

    const missingPage = await context.newPage();
    await missingPage.goto(pageUrl.href, { waitUntil: "domcontentloaded" });
    assert.equal(await missingPage.locator("#open-app").isVisible(), false);
    assert.equal(await missingPage.locator("#spinner").isVisible(), false);
    await context.close();
  } finally {
    await browser.close();
  }
});
