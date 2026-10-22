import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

test("dashboard language menu supports keyboard use and keeps the current route", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const mobile of [false, true]) {
    for (const language of ["he", "en"]) {
      const fixture = await scenario(browser, { mobile, enrolled: true, verified: true });
      const { page, context, errors } = fixture;
      try {
        await page.goto(`${origin}/dashboard/?view=products&lang=${language}#workspaces`);
        await page.locator(".product-tile").first().waitFor();
        const button = page.locator("#platform-language");
        const menu = page.locator("#platform-language-options");
        await button.focus();
        await button.press("ArrowDown");
        assert.equal(await button.getAttribute("aria-expanded"), "true");
        const selected = menu.locator('[aria-current="true"]');
        assert.equal(await selected.getAttribute("lang"), language);
        assert.equal(await selected.evaluate((node) => node === document.activeElement), true);
        for (const lang of ["he", "en"]) {
          const url = new URL(await menu.locator(`[lang="${lang}"]`).getAttribute("href"));
          assert.equal(url.pathname, "/dashboard/");
          assert.equal(url.searchParams.get("view"), "products");
          assert.equal(url.searchParams.get("lang"), lang === "he" ? "he" : null);
          assert.equal(url.hash, "#workspaces");
        }
        const bounds = await menu.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= page.viewportSize().width);
        if (process.env.DASHBOARD_PREVIEW_DIR) {
          await page.screenshot({ path: `${process.env.DASHBOARD_PREVIEW_DIR}/dashboard-${language}-${mobile ? "mobile" : "desktop"}.png`, fullPage: true });
        }
        await selected.press("Escape");
        assert.equal(await menu.isVisible(), false);
        assert.equal(await button.evaluate((node) => node === document.activeElement), true);
        await button.click();
        await page.locator(".platform-heading h1").click();
        assert.equal(await menu.isVisible(), false);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
        assert.deepEqual(errors, []);
      } finally {
        await context.close();
      }
    }
  }
});
