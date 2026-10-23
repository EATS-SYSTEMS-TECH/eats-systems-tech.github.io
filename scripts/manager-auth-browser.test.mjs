import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

test("Manager authenticator keeps site styling, RTL, keyboard focus and formatted-code paste", async (t) => {
  const { origin, browser } = await startSite(t);
  const source = (await readFile(new URL("../dashboard/manager/index.html", import.meta.url), "utf8"))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
  for (const language of ["en", "he"]) for (const width of [390, 1440]) {
    await t.test(`${language} ${width}px`, async () => {
      const page = await browser.newPage({ viewport: { width, height: 740 } });
      t.after(() => page.close());
      await page.route(origin + "/js/site-auth.js*", (route) => route.fulfill({
        contentType: "application/javascript",
        body: `export async function resolveTotp(resolver, factor, code) {
          window.verifications.push({factor,code});
          if(code !== "123456") throw {code:"auth/invalid-verification-code"};
          return {user:{uid:"synthetic-user"}};
        }`,
      }));
      await page.route(origin + "/manager-auth-fixture", (route) => route.fulfill({
        contentType: "text/html; charset=utf-8",
        body: source.replace('lang="en" dir="ltr"', `lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"`),
      }));
      await page.goto(origin + "/manager-auth-fixture");
      await page.evaluate(async () => {
        const { requestMfaChallenge } = await import("/js/host-mfa-challenge.js");
        window.verifications = [];
        window.result = "pending";
        window.challenge = requestMfaChallenge({ hints: [{ factorId: "totp", uid: "fixture-factor" }] })
          .then(() => { window.result = "verified"; }, () => { window.result = "cancelled"; });
      });
      const code = page.locator('#mfa-challenge input[name="code"]');
      await code.waitFor({ state: "visible" });
      assert.equal(await code.evaluate((el) => document.activeElement === el), true);
      assert.equal(await code.evaluate((el) => getComputedStyle(el).direction), "ltr");
      assert.equal(await page.locator('#mfa-challenge select').isVisible(), false);
      assert.equal(await page.locator('.mfa-dialog__button--primary').evaluate((el) => getComputedStyle(el).backgroundColor), "rgb(0, 0, 0)");
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await code.fill("000000");
      await page.locator('#mfa-challenge button[type="submit"]').click();
      await page.locator('#mfa-challenge [data-tone="error"]').waitFor();
      assert.equal(await code.inputValue(), "");
      assert.equal(await code.evaluate((el) => document.activeElement === el), true);
      assert.equal(await page.evaluate(() => window.result), "pending");
      await code.evaluate((el) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData("text", "123 456");
        el.dispatchEvent(new ClipboardEvent("paste", { clipboardData, bubbles: true, cancelable: true }));
      });
      assert.equal(await code.inputValue(), "123456");
      // Paste prepares the code; only a deliberate submit verifies it.
      assert.equal(await page.evaluate(() => window.verifications.length), 1);
      await code.press("Enter");
      await page.locator('#mfa-challenge').waitFor({ state: "hidden" });
      assert.equal(await page.evaluate(() => window.result), "verified");
      assert.equal(await code.inputValue(), "");
    });
  }
});
