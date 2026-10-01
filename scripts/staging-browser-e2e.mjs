import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const origin = "http://127.0.0.1:8100";
const headless = process.env.CI === "true" || process.env.STAGING_HEADLESS === "1";
const browser = await chromium.launch({ channel: "chrome", headless, slowMo: headless ? 0 : 250 });

async function login(context, provider, email, fromHome = false) {
  const page = await context.newPage();
  await page.goto(fromHome ? origin : `${origin}/login/`);
  if (fromHome) {
    const loginLink = page.locator(".site-login__trigger");
    await loginLink.waitFor({ state: "visible" });
    await loginLink.click();
    await page.waitForURL("**/login/");
  }
  assert.equal(new URL(page.url()).pathname, "/login/");
  const profileResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/v1/users/me") && response.request().method() === "PUT"
  );
  const popupPromise = page.waitForEvent("popup");
  await page.locator(`[data-provider="${provider}"]`).click();
  const popup = await popupPromise;
  await popup.waitForLoadState("networkidle");
  await popup.getByText(email, { exact: true }).click();
  assert.equal((await profileResponse).status(), 200);
  await page.waitForURL("**/dashboard/");
  return page;
}

try {
  const adminContext = await browser.newContext({ locale: "en-US" });
  const admin = await login(adminContext, "google", "admin-e2e@wifigate.test", true);
  await admin.locator("#clients-body tr").first().waitFor({ state: "visible" });
  assert.equal(await admin.locator("#clients-body tr").count(), 2);
  assert.equal(await admin.locator("#keys-section").isVisible(), false);
  await admin.reload();
  await admin.locator("#clients-body tr").first().waitFor({ state: "visible" });
  assert.equal(new URL(admin.url()).pathname, "/dashboard/");
  await admin.locator("#sign-out").click();
  await admin.waitForURL("**/login/");
  await admin.goto(`${origin}/dashboard/`);
  await admin.waitForURL("**/login/");
  await adminContext.close();

  const ownerContext = await browser.newContext();
  const owner = await login(ownerContext, "apple", "owner-e2e@grandplaza.test");
  await owner.locator("#keys-body tr").first().waitFor({ state: "visible" });
  assert.equal(await owner.locator("#keys-body tr").count(), 2);
  assert.equal(await owner.locator("#clients-section").isVisible(), false);
  await ownerContext.close();

  const memberContext = await browser.newContext();
  const member = await login(memberContext, "google", "member-e2e@grandplaza.test");
  await member.locator("#keys-body tr").first().waitFor({ state: "visible" });
  assert.equal(await member.locator("#keys-body tr").count(), 1);
  await memberContext.close();

  const strangerContext = await browser.newContext();
  const stranger = await login(strangerContext, "apple", "stranger-e2e@wifigate.test");
  await stranger.getByText("השרת לא אישר את הגישה", { exact: false }).waitFor({ state: "visible" });
  assert.equal(await stranger.locator("#dashboard-content").isVisible(), false);
  await strangerContext.close();

  console.log("Browser E2E passed: home → login → Google/Apple popup → role dashboard → sign-out → login.");
} finally {
  await browser.close();
}
