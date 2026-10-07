import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { passGateGame } from "./gate-game-helper.mjs";
const origin = "http://127.0.0.1:8100";
const browser = await chromium.launch({ channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome", headless: true });
async function login(context, provider, email) {
  const page = await context.newPage(); await page.goto(origin + "/login/");
  const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/platform/me") && r.request().method() === "GET");
  const button = await passGateGame(page, provider);
  const popupPromise = page.waitForEvent("popup"); await button.click();
  const popup = await popupPromise; await popup.waitForLoadState("networkidle"); await popup.getByText(email, { exact: true }).click();
  assert.equal((await response).status(), 200); await page.waitForURL("**/dashboard/"); return page;
}
try {
  const scenarios = [
    { provider: "google", email: "admin-e2e@wifigate.test", state: "mfa-required" },
    { provider: "apple", email: "owner-e2e@grandplaza.test", state: "active" },
    { provider: "apple", email: "stranger-e2e@wifigate.test", state: "no-plan" },
    { provider: "google", email: "pending-e2e@wifigate.test", state: "pending" },
  ];
  for (const scenario of scenarios) {
    const context = await browser.newContext(); const page = await login(context, scenario.provider, scenario.email);
    await page.locator('[data-product="host"][data-state="' + scenario.state + '"]').waitFor();
    assert.equal(await page.locator("#admin-approval").isVisible(), false);
    await page.reload();
    await page.locator('[data-product="host"][data-state="' + scenario.state + '"]').waitFor();
    await page.locator("#platform-sign-out").click(); await page.waitForURL("**/login/");
    await page.goto(origin + "/dashboard/"); await page.waitForURL(url => url.pathname === "/login/"); await context.close();
  }
  console.log("Staging browser passed: Google/Apple login, session restore, admin enrollment gate, approved/pending/denied users, logout and protected route.");
} finally { await browser.close(); }
