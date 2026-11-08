import assert from "node:assert/strict";
import { chromium } from "playwright-core";

// Five misses lock the "I'm not a robot" check for 60 seconds. Reloading the
// page, or closing and reopening the check, must not lift the lock early.
const origin = process.env.SITE_URL || "http://127.0.0.1:8000";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
const secondsLeft = (text) => Number.parseInt(text.match(/\d+/)?.[0], 10);
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const openCheck = async () => {
    await page.locator("[data-provider]").first().click();
    await page.locator(".gate-game__car").waitFor({ state: "visible" });
  };
  await page.goto(origin + "/he/login/", { waitUntil: "load" });
  await openCheck();
  // Enter without moving the car is a miss.
  for (let miss = 0; miss < 5; miss += 1) {
    await page.locator(".gate-game__car").focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(450);
  }
  await page.waitForFunction(() => /\d/.test(document.querySelector(".gate-game__message").textContent));
  const locked = await page.locator(".gate-game__message").innerText();
  assert.match(locked, /יותר מדי ניסיונות/);
  const cookie = (await context.cookies()).find((entry) => entry.name === "wifigate-gate-check-v1");
  assert.ok(cookie, "the lockout is kept in a browser cookie");
  assert.equal(cookie.sameSite, "Strict");

  await page.waitForTimeout(2000);
  await page.reload({ waitUntil: "load" });
  await openCheck();
  const afterReload = await page.locator(".gate-game__message").innerText();
  assert.match(afterReload, /יותר מדי ניסיונות/, "a reload keeps the lock");
  const left = secondsLeft(afterReload);
  assert.ok(left <= 58 && left >= 50, `the countdown continues instead of restarting (${left}s left)`);
  assert.equal(await page.locator(".gate-game__car").getAttribute("aria-disabled"), "true");
  await page.locator(".gate-game__car").focus();
  await page.keyboard.press("ArrowUp");
  assert.match(await page.locator(".gate-game__message").innerText(), /יותר מדי ניסיונות/, "the car cannot be moved while locked");

  // Clearing localStorage alone does not lift it either.
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "load" });
  await openCheck();
  assert.match(await page.locator(".gate-game__message").innerText(), /יותר מדי ניסיונות/, "the cookie alone keeps the lock");
  await context.close();
  console.log("Login check lockout: kept across reloads and a cleared localStorage, countdown continues, car stays disabled.");
} finally {
  await browser.close();
}
