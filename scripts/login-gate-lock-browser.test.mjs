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

  // A check already open in a second tab is taken over by a lockout set in the first.
  {
    const shared = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const [first, second] = [await shared.newPage(), await shared.newPage()];
    const open = async (tab) => { await tab.locator("[data-provider]").first().click(); await tab.locator(".gate-game__car").waitFor({ state: "visible" }); };
    await second.goto(origin + "/he/login/", { waitUntil: "load" });
    await open(second);
    await first.goto(origin + "/he/login/", { waitUntil: "load" });
    await open(first);
    for (let miss = 0; miss < 5; miss += 1) { await first.locator(".gate-game__car").focus(); await first.keyboard.press("Enter"); await first.waitForTimeout(450); }
    await first.waitForFunction(() => /\d/.test(document.querySelector(".gate-game__message").textContent));
    await second.bringToFront();
    await second.waitForFunction(() => /\d/.test(document.querySelector(".gate-game__message").textContent), null, { timeout: 5000 });
    assert.match(await second.locator(".gate-game__message").innerText(), /יותר מדי ניסיונות/, "the other tab is locked too");
    await second.locator(".gate-game__car").focus();
    await second.keyboard.press("ArrowUp");
    await second.keyboard.press("Enter");
    assert.match(await second.locator(".gate-game__message").innerText(), /יותר מדי ניסיונות/, "the other tab cannot pass during the lockout");
    await first.reload({ waitUntil: "load" });
    await open(first);
    assert.match(await first.locator(".gate-game__message").innerText(), /יותר מדי ניסיונות/, "the second tab did not wipe the stored lockout");
    await shared.close();
  }
  console.log("Login check lockout: kept across reloads, a cleared localStorage and a second open tab; countdown continues, car stays disabled.");
} finally {
  await browser.close();
}
