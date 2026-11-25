import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

// A held gate ignores normal opening: the overview says so and links to the
// Gate override tab; back to normal, the notice is gone.
test("the overview warns while the gate is held open or closed", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) {
    const he = language === "he", copy = (h, e) => (he ? h : e);
    const fixture = await scenario(browser, { manager: "active", enrolled: true, verified: true, viewport: { width: 390, height: 1000 } });
    t.after(() => fixture.context.close());
    const { page, context } = fixture;
    page.setDefaultTimeout(8000);
    await context.route("**/api/v1/manager/**", (route) => route.fulfill({
      json: new URL(route.request().url()).pathname.endsWith("/me")
        ? { role: "admin", roles: ["admin"], account: null, organizations: [] }
        : { items: [], nextCursor: null },
    }));
    await page.goto(origin + "/dashboard/manager/?lang=" + language);
    const reject = page.locator("[data-cookie-reject]");
    if (await reject.isVisible()) await reject.click();
    const workspace = page.locator('.manager-view[data-simulation="true"]');
    const content = workspace.locator("#manager-content");
    await page.locator(".manager-examples > summary").click();
    await page.locator('[data-example-system="example-manager-gate"]').getByRole("button", { name: copy("פתיחת סביבת ניהול", "Open workspace"), exact: true }).click();
    await content.locator(".manager-facts").waitFor();
    assert.equal(await content.locator(".manager-override-notice").count(), 0, "no notice in normal mode");
    const setMode = async (mode) => {
      await workspace.locator('[data-tab="override"]').click();
      await content.locator("select").waitFor();
      await content.locator("select").selectOption(mode);
      await content.getByRole("button", { name: copy("שמירת מצב השער", "Save gate mode"), exact: true }).click();
      await page.locator("dialog.manager-confirm-dialog").getByRole("button", { name: copy("אישור", "Confirm"), exact: true }).click();
      await page.waitForFunction(() => document.querySelector(".manager-view")?.getAttribute("aria-busy") === "false");
      await workspace.locator('[data-tab="overview"]').click();
      await content.locator(".manager-facts").waitFor();
    };
    await setMode("FORCE_NC");
    const notice = content.locator(".manager-override-notice");
    await notice.waitFor();
    assert.match(await notice.textContent(), he ? /סגור קבוע/ : /held closed/);
    await notice.getByRole("button", { name: copy("לשינוי מצב השער", "Change the gate mode"), exact: true }).click();
    await content.locator("select").waitFor();
    assert.equal(await content.locator("select").inputValue(), "FORCE_NC");
    await setMode("NORMAL");
    await page.waitForTimeout(500);
    assert.equal(await content.locator(".manager-override-notice").count(), 0, "the notice goes away in normal mode");
  }
});
