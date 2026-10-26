import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
import { passGateGame } from "./gate-game-helper.mjs";

test("five refused identities show the counter, disable both providers, persist on reload and reopen after cooldown", async (t) => {
  const { origin, browser } = await startSite(t);
  const fixture = await scenario(browser, { viewport: { width: 390, height: 844 }, signedIn: false, host: "no-plan", pay: "no-plan", manager: "no-plan" });
  t.after(() => fixture.context.close());
  const { page, calls } = fixture;
  await page.clock.install();
  await page.goto(origin + "/he/login/");
  await page.locator('[data-provider="google"]:enabled').waitFor();
  assert.equal(await page.locator("#login-attempt-count").innerText(), "0/5");
  const button = await passGateGame(page, "google");
  for (let count = 1; count <= 5; count++) {
    await button.click();
    await page.locator("#login-attempt-count", { hasText: `${count}/5` }).waitFor();
    if (count < 5) await page.locator('[data-provider="google"]:enabled').waitFor();
  }
  assert.equal(await page.locator('[data-provider="google"]').isDisabled(), true);
  assert.equal(await page.locator('[data-provider="apple"]').isDisabled(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  if (process.env.WIFIGATE_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.WIFIGATE_SCREENSHOT_DIR, "login-lockout-he.png"), fullPage: true });
  const attempts = calls.filter(call => call?.path === "/api/v1/platform/login").length;
  assert.equal(attempts, 5);
  await page.reload();
  await page.locator("#login-attempt-count", { hasText: "5/5" }).waitFor();
  assert.equal(await page.locator('[data-provider="google"]').isDisabled(), true);
  await page.clock.fastForward(15 * 60 * 1000 + 1000);
  await page.locator('[data-provider="google"]:enabled').waitFor();
  assert.equal(await page.locator("#login-attempt-count").innerText(), "0/5");
  assert.equal(calls.filter(call => call?.path === "/api/v1/platform/login").length, 5);
  assert.deepEqual(fixture.errors, []);
});
