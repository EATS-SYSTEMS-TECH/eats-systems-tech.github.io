import assert from "node:assert/strict";
import { chromium } from "playwright-core";
const origin = "http://127.0.0.1:8100";
const browser = await chromium.launch({ channel: "chrome", headless: true });
async function login(context, provider, email) {
  const page = await context.newPage(); await page.goto(origin + "/login/");
  const response = page.waitForResponse((r) => r.url().endsWith("/api/v1/users/me") && r.request().method() === "PUT");
  const popupPromise = page.waitForEvent("popup"); await page.locator('[data-provider="' + provider + '"]').click();
  const popup = await popupPromise; await popup.waitForLoadState("networkidle"); await popup.getByText(email, { exact: true }).click();
  assert.equal((await response).status(), 200); await page.waitForURL("**/dashboard/"); return page;
}
try {
  for (const scenario of [
    { provider: "google", email: "admin-e2e@wifigate.test", selector: "#mfa-enrollment" },
    { provider: "apple", email: "owner-e2e@grandplaza.test", selector: "#dashboard-content" },
    { provider: "apple", email: "stranger-e2e@wifigate.test", title: "Portal access denied" },
    { provider: "google", email: "pending-e2e@wifigate.test", title: "Approval pending" },
  ]) {
    const context = await browser.newContext(); const page = await login(context, scenario.provider, scenario.email);
    if (scenario.selector) await page.locator(scenario.selector).waitFor({ state: "visible" });
    else { await page.getByRole("heading", { name: scenario.title, exact: true }).waitFor(); assert.equal(await page.locator("#dashboard-content").isVisible(), false); }
    assert.equal(await page.locator("#admin-approval").isVisible(), false);
    await page.reload();
    if (scenario.selector) await page.locator(scenario.selector).waitFor({ state: "visible" });
    else await page.getByRole("heading", { name: scenario.title, exact: true }).waitFor();
    await page.locator("#sign-out").click(); await page.waitForURL("**/login/");
    await page.goto(origin + "/dashboard/"); await page.waitForURL("**/login/"); await context.close();
  }
  console.log("Staging browser passed: Google/Apple login, session restore, admin enrollment gate, approved/pending/denied users, logout and protected route.");
} finally { await browser.close(); }
