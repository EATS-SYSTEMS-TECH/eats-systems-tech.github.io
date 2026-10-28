import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("connection popup has real stage progress, honest timing, keyboard cancellation and responsive RTL/LTR", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [320, 390, 1440]) {
      const height = width === 320 ? 640 : 900;
      const page = await browser.newPage({ viewport: { width, height } });
      try {
        await page.route(origin + "/connection-popup-test", (route) =>
          route.fulfill({
            contentType: "text/html",
            body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body><button id="return">Return target</button></body></html>`,
          }),
        );
        await page.goto(origin + "/connection-popup-test");
        await page.clock.install();
        await page.evaluate(async (language) => {
          const { createManagerConnectionDialog } =
            await import("/js/manager-connection-dialog.js");
          window.cancelled = 0;
          window.dismissed = 0;
          window.retried = 0;
          window.popup = createManagerConnectionDialog({ language });
          window.show = () =>
            window.popup.open({
              systemName: "Example system · מערכת לדוגמה",
              gate: "72488",
              returnFocus: document.querySelector("#return"),
              onCancel: () => window.cancelled++,
              onDismiss: () => window.dismissed++,
              onRetry: () => {
                window.retried++;
                window.show();
              },
            });
          window.show();
        }, language);
        const dialog = page.locator(".manager-connection-dialog"),
          bar = dialog.getByRole("progressbar");
        assert.equal(
          await dialog.getAttribute("dir"),
          language === "he" ? "rtl" : "ltr",
        );
        assert.equal(await bar.getAttribute("aria-valuenow"), "0");
        assert.doesNotMatch(await dialog.innerText(), /פעם בדקה|once a minute|90/);
        assert.equal(
          await dialog.locator(".manager-connection-dialog__timing").isVisible(),
          false,
        );
        assert.equal(
          await dialog.evaluate((node) =>
            node.contains(document.activeElement),
          ),
          true,
        );
        for (let i = 0; i < 4; i++) {
          await page.keyboard.press("Tab");
          assert.equal(
            await dialog.evaluate((node) =>
              node.contains(document.activeElement),
            ),
            true,
          );
        }
        const box = await dialog.boundingBox();
        assert.ok(
          box.x >= 0 &&
            box.x + box.width <= width &&
            box.y >= 0 &&
            box.y + box.height <= height,
        );
        assert.equal(
          await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth),
          true,
        );
        assert.equal(
          await dialog
            .locator("button")
            .evaluateAll((nodes) =>
              nodes
                .filter((n) => !n.hidden)
                .every((n) => n.getBoundingClientRect().height >= 44),
            ),
          true,
        );
        if (process.env.MANAGER_POPUP_SCREENSHOTS)
          await page.screenshot({
            path: `${process.env.MANAGER_POPUP_SCREENSHOTS}/popup-waiting-${language}-${width}.png`,
          });
        await page.clock.fastForward(61000);
        assert.equal(
          await bar.getAttribute("aria-valuenow"),
          "0",
          "elapsed time never invents stage completion",
        );
        assert.equal(await dialog.getAttribute("data-extended"), "true");
        assert.match(
          await dialog
            .locator(".manager-connection-dialog__timing")
            .innerText(),
          language === "he" ? /יותר זמן מהרגיל/ : /longer than usual/,
        );
        await page.evaluate(() => window.popup.setStage("connecting"));
        assert.equal(await bar.getAttribute("aria-valuenow"), "1");
        await page.evaluate(() => window.popup.setStage("loading"));
        assert.equal(await bar.getAttribute("aria-valuenow"), "2");
        await page.evaluate(() => window.popup.setStage("waiting"));
        assert.equal(
          await bar.getAttribute("aria-valuenow"),
          "2",
          "late stages do not reverse progress",
        );
        await page.evaluate(() => window.popup.complete());
        assert.equal(await bar.getAttribute("aria-valuenow"), "3");
        await dialog
          .getByRole("button", {
            name: language === "he" ? "פתיחת סביבת הניהול" : "Enter workspace",
            exact: true,
          })
          .click();
        assert.equal(
          await page.evaluate(() => window.cancelled),
          0,
          "entering a completed workspace never cancels the connection",
        );
        assert.equal(await dialog.count(), 0);
        assert.equal(await page.evaluate(() => window.dismissed), 0, "success does not navigate to the origin list");
        await page.evaluate(() => window.show());
        await page.keyboard.press("Escape");
        assert.equal(await page.evaluate(() => window.cancelled), 1);
        assert.equal(await dialog.count(), 0);
        await page.evaluate(() => {
          window.show();
          window.popup.fail("Example connection failure");
        });
        assert.equal(await dialog.getAttribute("data-state"), "error");
        await dialog
          .getByRole("button", {
            name:
              language === "he" ? "ניסיון חיבור נוסף" : "Try connecting again",
            exact: true,
          })
          .click();
        assert.equal(await page.evaluate(() => window.retried), 1);
        assert.equal(await page.evaluate(() => window.dismissed), 0, "retry does not dismiss to the origin list");
        assert.equal(await dialog.getAttribute("data-state"), "pending");
        await page.evaluate(() =>
          window.popup.fail("Example connection failure"),
        );
        if (process.env.MANAGER_POPUP_SCREENSHOTS)
          await page.screenshot({
            path: `${process.env.MANAGER_POPUP_SCREENSHOTS}/popup-error-${language}-${width}.png`,
          });
        await dialog
          .getByRole("button", {
            name: language === "he" ? "סגירה וחזרה" : "Close and return",
            exact: true,
          })
          .click();
        assert.equal(
          await page.evaluate(() => window.cancelled),
          1,
          "error dismissal is separate from pending cancellation",
        );
        assert.equal(await page.evaluate(() => window.dismissed), 1, "the error footer returns to its origin");
        await page.evaluate(() => {
          window.show();
          window.popup.complete();
          window.show();
        });
        await page.clock.fastForward(1000);
        assert.equal(
          await dialog.getAttribute("data-state"),
          "pending",
          "a previous success timer cannot close a new connection attempt",
        );
        await page.emulateMedia({ reducedMotion: "reduce" });
        assert.equal(
          await bar.evaluate(
            (node) => getComputedStyle(node, "::after").animationName,
          ),
          "none",
        );
        await page.evaluate(() => window.popup.close());
        assert.equal(await page.evaluate(() => window.cancelled), 1, "programmatic close does not cancel or navigate");
        assert.equal(await page.evaluate(() => window.dismissed), 1, "replacing a popup and programmatic close do not dismiss to origin");
        await page.clock.fastForward(120000);
        assert.equal(await dialog.count(), 0);
      } finally {
        await page.close();
      }
    }
});
