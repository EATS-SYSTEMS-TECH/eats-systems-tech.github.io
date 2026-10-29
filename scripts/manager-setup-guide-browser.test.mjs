import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

test("My systems explains the app Export flow below Examples with accessible responsive help", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [320, 390, 1440])
      await t.test(`${language} ${width}px`, async (t) => {
        const f = await scenario(browser, {
          manager: "active",
          enrolled: true,
          verified: true,
          viewport: { width, height: 1000 },
        });
        t.after(() => f.context.close());
        const calls = [];
        await f.context.route("**/api/v1/manager/**", (route) => {
          calls.push({
            path: new URL(route.request().url()).pathname,
            method: route.request().method(),
          });
          return route.fulfill({
            json: route.request().url().endsWith("/me")
              ? {
                  role: "user",
                  roles: ["user"],
                  account: { id: "personal" },
                  organizations: [],
                }
              : { items: [], nextCursor: null },
          });
        });
        const page = f.page;
        await page.goto(origin + "/dashboard/manager/?lang=" + language);
        const reject = page.locator("[data-cookie-reject]");
        if (await reject.isVisible()) await reject.click();
        const guide = page.locator(".manager-setup-guide"),
          summary = guide.locator("summary");
        await guide.waitFor();
        assert.equal(await guide.getAttribute("open"), null);
        assert.equal(
          await summary.innerText(),
          language === "he" ? "איך מוסיפים מערכת?" : "How do I add a system?",
        );
        assert.equal(
          await guide.evaluate((node) =>
            node.previousElementSibling.matches(".manager-examples"),
          ),
          true,
        );
        const before = calls.length;
        await summary.focus();
        await page.keyboard.press("Enter");
        assert.equal(await guide.locator("ol > li:visible").count(), 5);
        assert.match(await guide.innerText(), /Export/);
        assert.match(await guide.innerText(), /Sync/);
        assert.match(await guide.innerText(), /Bluetooth/);
        if (process.env.MANAGER_GUIDE_SCREENSHOTS) {
          await mkdir(process.env.MANAGER_GUIDE_SCREENSHOTS, {
            recursive: true,
          });
          await page.screenshot({
            path: `${process.env.MANAGER_GUIDE_SCREENSHOTS}/guide-${language}-${width}.png`,
            fullPage: true,
          });
        }
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await page.keyboard.press("Space");
        assert.equal(await guide.getAttribute("open"), null);
        assert.equal(
          calls.length,
          before,
          "reading help makes no extra Manager API requests",
        );
        assert.equal(
          calls.some((call) => call.method !== "GET"),
          false,
        );
        assert.deepEqual(f.errors, []);
      });
});

test("My organizations explains purpose and team permissions directly below Examples without requests", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [320, 390, 1440])
      await t.test(`${language} ${width}px`, async (t) => {
        const f = await scenario(browser, {
          manager: "active",
          enrolled: true,
          verified: true,
          viewport: { width, height: 1100 },
        });
        t.after(() => f.context.close());
        const calls = [];
        await f.context.route("**/api/v1/manager/**", (route) => {
          calls.push({
            path: new URL(route.request().url()).pathname,
            method: route.request().method(),
          });
          return route.fulfill({
            json: route.request().url().endsWith("/me")
              ? {
                  role: "user",
                  roles: ["user"],
                  account: { id: "personal" },
                  organizations: [],
                }
              : { items: [], nextCursor: null },
          });
        });
        const page = f.page;
        await page.goto(origin + "/dashboard/manager/?lang=" + language);
        const reject = page.locator("[data-cookie-reject]");
        if (await reject.isVisible()) await reject.click();
        await page
          .getByRole("button", {
            name: language === "he" ? "הארגונים שלי" : "My organizations",
            exact: true,
          })
          .click();
        const guide = page.locator(".manager-organization-guide");
        await guide.waitFor();
        assert.equal(
          await guide.evaluate((el) =>
            el.previousElementSibling.matches(".manager-organization-examples"),
          ),
          true,
        );
        assert.equal(await guide.getAttribute("open"), null);
        assert.equal(
          await guide.locator("summary").innerText(),
          language === "he" ? "למה צריך ארגון?" : "Why use an organization?",
        );
        const before = calls.length;
        await guide.locator("summary").focus();
        await page.keyboard.press("Enter");
        assert.equal(await guide.locator("ul > li:visible").count(), 3);
        assert.equal(await guide.locator("li .manager-organization-benefit-icon svg[aria-hidden=true]").count(), 3);
        assert.match(
          await guide.innerText(),
          language === "he" ? /מהחשבון שלו/ : /their own account/,
        );
        assert.match(
          await guide.innerText(),
          language === "he"
            ? /ללא ניהול אנשי הארגון/
            : /without managing organization members/,
        );
        assert.equal(await guide.getByRole("button").count(), 0);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        if (process.env.MANAGER_GUIDE_SCREENSHOTS) {
          await mkdir(process.env.MANAGER_GUIDE_SCREENSHOTS, {
            recursive: true,
          });
          await page.screenshot({
            path: `${process.env.MANAGER_GUIDE_SCREENSHOTS}/organization-guide-${language}-${width}.png`,
            fullPage: true,
          });
        }
        await page.keyboard.press("Space");
        assert.equal(await guide.getAttribute("open"), null);
        assert.equal(calls.length, before);
        assert.equal(
          calls.some((call) => call.method !== "GET"),
          false,
        );
        assert.deepEqual(f.errors, []);
      });
});
