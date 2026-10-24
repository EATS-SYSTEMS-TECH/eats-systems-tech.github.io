import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("Manager confirmations support keyboard, backdrop cancellation, navigation and mobile RTL", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["en", "he"]) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    t.after(() => page.close());
    await page.route(origin + "/dialog-fixture", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: '<html><head><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body><button id="launcher">Settings</button></body></html>',
      }),
    );
    await page.goto(origin + "/dialog-fixture");
    await page.evaluate(async (language) => {
      const { createManagerDialog } = await import("/js/manager-dialog.js");
      window.dialogs = createManagerDialog({ language });
      window.result = "pending";
      document.querySelector("#launcher").onclick = () => {
        window.result = "pending";
        void window.dialogs
          .confirm(
            language === "he"
              ? "לשנות את הגדרות השער?"
              : "Change gate settings?",
          )
          .then((value) => {
            window.result = value;
          });
      };
    }, language);
    const launch = page.locator("#launcher");
    const modal = page.getByRole("dialog");
    const cancel = modal.getByRole("button", {
      name: language === "he" ? "ביטול" : "Cancel",
      exact: true,
    });
    await launch.click();
    assert.equal(
      await cancel.evaluate((el) => el === document.activeElement),
      true,
    );
    await page.keyboard.press("Shift+Tab");
    assert.equal(
      await page.evaluate(() =>
        document.querySelector("dialog").contains(document.activeElement),
      ),
      true,
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.result === false);
    assert.equal(
      await launch.evaluate((el) => el === document.activeElement),
      true,
    );
    await launch.click();
    await page.mouse.click(2, 2);
    await page.waitForFunction(() => window.result === false);
    await launch.click();
    await page.evaluate(() => window.dialogs.cancel());
    await page.waitForFunction(() => window.result === false);
    await launch.click();
    assert.equal(
      await modal.evaluate(
        (el) =>
          el.scrollWidth <= el.clientWidth &&
          el.getBoundingClientRect().right <= innerWidth,
      ),
      true,
    );
    await modal
      .getByRole("button", {
        name: language === "he" ? "אישור" : "Confirm",
        exact: true,
      })
      .click();
    await page.waitForFunction(() => window.result === true);
    await page.evaluate(() => {
      window.choice = window.dialogs.chooseState();
    });
    await modal.getByRole("button", { name: "OFF", exact: true }).click();
    assert.equal(await page.evaluate(() => window.choice), "OFF");
    await page.evaluate(() => {
      window.choice = window.dialogs.chooseState();
    });
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => window.choice), null);
  }
});
