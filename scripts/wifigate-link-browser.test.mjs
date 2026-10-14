import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { demoGuestLink, readDemoToken } from "../js/host-demo-link.js";

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

// A demo guest link from the Host examples (ep=v1.demo_…) shows a preview
// and never builds a wifigate:// link, on the API page and on every page made
// from the same template.
test("a demo guest link shows an example preview and never opens the app", async () => {
  const startsAt = new Date(2026, 9, 14, 15, 0);
  const endsAt = new Date(2026, 9, 15, 12, 0);
  const link = demoGuestLink({ kind: "dual", startsAt, endsAt });
  const ep = new URL(link).searchParams.get("ep");
  const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 320, height: 640 }, isMobile: true });
    await context.addInitScript(() => {
      localStorage.setItem("wifigate-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, savedAt: Date.now() }));
      window.autoAttempts = 0;
      const schedule = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => {
        if (delay === 40) {
          window.autoAttempts += 1;
          return 0;
        }
        return schedule(callback, delay, ...args);
      };
    });
    const opened = [];
    context.on("request", (request) => {
      if (request.url().startsWith("wifigate:")) opened.push(request.url());
    });
    for (const [page, lang] of [
      ["../wifigate-api/index.html", "en"],
      ["../he/wifigate-api/index.html", "he"],
      ["../wifigate-link/index.html", "en"],
    ]) {
      const tab = await context.newPage();
      await tab.goto(`${new URL(page, import.meta.url).href}?ep=${encodeURIComponent(ep)}`, { waitUntil: "domcontentloaded" });
      await tab.locator("#demo-banner").waitFor();
      await tab.waitForTimeout(1100);
      assert.equal(await tab.locator("#main-content").getAttribute("data-demo"), "true");
      assert.equal(
        await tab.locator("#demo-banner").innerText(),
        lang === "he" ? "דוגמה: הקישור הזה לא פותח שער." : "Example: this link doesn't open a gate.",
      );
      assert.equal(await tab.locator(".demo-name").innerText(), "Example WIFIGATE Dual Control 212 🥂🍾");
      if (lang === "he") {
        // The Latin name keeps the Hebrew page's direction: it lines up on
        // the right with the GUEST badge under it.
        const [name, guest] = await tab.evaluate(() => {
          const range = document.createRange();
          range.selectNodeContents(document.querySelector(".demo-name"));
          return [range.getBoundingClientRect().right, document.querySelector(".demo-guest").getBoundingClientRect().right];
        });
        assert.ok(Math.abs(name - guest) <= 1, `example name right edge ${name}, badge ${guest}`);
      }
      assert.match(await tab.locator(".demo-icon img").getAttribute("src"), /assets\/host-icons\/dual-control-barrier-gate-small\.svg$/);
      const stay = await tab.locator("#demo-window").innerText();
      assert.match(stay, lang === "he" ? /15:00 ← .*12:00/ : /03:00 PM → .*12:00 PM/);
      assert.ok(
        await tab.evaluate(() => document.querySelectorAll("#demo-window .demo-when").length === 2 && [...document.querySelectorAll("#demo-window .demo-when")].every((part) => new Set([...part.getClientRects()].map((box) => Math.round(box.top))).size === 1)),
        "each end of the stay stays on one line; a narrow phone breaks at the arrow",
      );
      assert.equal(await tab.evaluate(() => window.autoAttempts), 0, "no automatic opening");
      assert.equal(await tab.locator("#open-app").count(), 0);
      assert.equal(
        await tab.evaluate(() => [...document.querySelectorAll("[href]")].some((element) => element.getAttribute("href").startsWith("wifigate:"))),
        false,
        "no wifigate:// link anywhere",
      );
      assert.ok(await tab.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "fits a 320px phone");
      if (process.env.WIFIGATE_SCREENSHOT && lang === "he") await tab.screenshot({ path: process.env.WIFIGATE_SCREENSHOT.replace(/\.png$/, "-demo.png") });
    }
    // A broken demo token is still a demo: an example message and no app.
    const broken = await context.newPage();
    await broken.goto(`${new URL("../wifigate-api/index.html", import.meta.url).href}?ep=v1.demo_not-json`, { waitUntil: "domcontentloaded" });
    await broken.locator("#demo-banner").waitFor();
    await broken.waitForTimeout(1100);
    assert.equal(await broken.locator("#status").innerText(), "This example link is incomplete.");
    assert.equal(await broken.evaluate(() => window.autoAttempts), 0);
    // A demo token inside ?link= never becomes the app link either.
    const direct = await context.newPage();
    await direct.goto(`${new URL("../wifigate-api/index.html", import.meta.url).href}?link=${encodeURIComponent(`wifigate://gate/invite?ep=${ep}`)}`, { waitUntil: "domcontentloaded" });
    await direct.locator("#demo-banner").waitFor();
    await direct.waitForTimeout(1100);
    assert.equal(await direct.evaluate(() => window.autoAttempts), 0);
    assert.deepEqual(opened, []);
    // The token carries the example and the stay only.
    assert.deepEqual(readDemoToken(ep), { k: "dual", ss: startsAt.getTime(), se: endsAt.getTime() });
    await context.close();
  } finally {
    await browser.close();
  }
});
