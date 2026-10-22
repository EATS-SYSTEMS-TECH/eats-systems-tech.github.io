import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

test("every dashboard shares a flag selector and profile entry into My profile", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [320, 1440]) {
      for (const product of ["manager", "host", "pay", ""])
        await t.test(
          `${language} ${width}px ${product || "profile"}`,
          async (t) => {
            const fixture = await scenario(browser, {
              admin: true,
              enrolled: true,
              verified: true,
              manager: "active",
              pay: "active",
              viewport: { width, height: 1000 },
              userMetadata: {
                creationTime: "Mon, 15 Jan 2024 12:00:00 GMT",
                lastSignInTime: "invalid",
              },
            });
            t.after(() => fixture.context.close());
            const { page, context } = fixture;
            page.setDefaultTimeout(7000);
            await context.route("**/api/v1/manager/**", (route) =>
              route.fulfill({
                json: new URL(route.request().url()).pathname.endsWith("/me")
                  ? {
                      user: {
                        name: "Fixture User",
                        email: "fixture@example.test",
                      },
                      role: "admin",
                      roles: ["admin"],
                      organizations: [],
                      account: null,
                    }
                  : {
                      admins: 1,
                      users: 1,
                      organizationAdmins: 0,
                      organizations: 0,
                    },
              }),
            );
            const query = language === "he" ? "?lang=he" : "";
            await page.goto(
              origin + `/dashboard/${product ? product + "/" : ""}` + query,
            );
            await page.locator("#product-switcher-button").waitFor();
            const reject = page.locator("[data-cookie-reject]");
            if (await reject.isVisible()) await reject.click();
            const header = page.locator(
              product === "host" ? ".host-topbar" : ".platform-header",
            );
            assert.equal(await header.locator("a.brand").isVisible(), true);
            const flag = header.locator(".platform-language__button");
            assert.equal(await flag.innerText(), "");
            assert.equal(await flag.locator("img").isVisible(), true);
            assert.match(
              await flag.getAttribute("aria-label"),
              language === "he" ? /עברית/ : /English/,
            );
            await flag.click();
            const languages = page.locator("#platform-language-options");
            await languages.waitFor();
            const other = languages.locator(
              `[lang="${language === "he" ? "en" : "he"}"]`,
            );
            assert.equal(
              new URL(await other.getAttribute("href")).pathname,
              `/dashboard/${product ? product + "/" : ""}`,
            );
            await page.keyboard.press("Escape");
            const profile = header.locator(".dashboard-profile-button");
            assert.deepEqual(
              await profile
                .boundingBox()
                .then(({ width, height }) => [width, height]),
              [44, 44],
            );
            await profile.click();
            const panel = header.locator(".dashboard-profile-panel");
            assert.equal(
              await panel.locator(".dashboard-profile-eyebrow").count(),
              0,
            );
            assert.equal(
              await panel.getAttribute("aria-label"),
              language === "he" ? "הפרופיל שלי" : "My profile",
            );
            await panel
              .getByText("fixture@example.test", { exact: true })
              .waitFor();
            if (product === "manager")
              assert.equal(
                await panel
                  .locator(".manager-role-badge")
                  .evaluate((el) => getComputedStyle(el).textAlign),
                "center",
              );
            assert.equal(
              await panel
                .locator("a.dashboard-profile-identity")
                .getAttribute("href"),
              "/dashboard/" + query,
            );
            assert.equal(
              await page.evaluate(
                () => document.documentElement.scrollWidth <= innerWidth,
              ),
              true,
            );
            if (process.env.DASHBOARD_PREVIEW_DIR)
              await page.screenshot({
                path: `${process.env.DASHBOARD_PREVIEW_DIR}/shared-header-${product || "profile"}-${language}-${width}.png`,
                fullPage: true,
              });
            await panel.locator("a.dashboard-profile-identity").click();
            await page.waitForURL(origin + "/dashboard/" + query);
            await page
              .getByRole("heading", {
                name: language === "he" ? "הפרופיל שלי" : "My profile",
                exact: true,
              })
              .waitFor();
            await page
              .locator("#profile-details")
              .getByText("fixture@example.test", { exact: true })
              .waitFor();
            assert.equal(
              await page.locator("#profile-subscriptions .product-tile").count(),
              3,
            );
            const details = page.locator("#profile-details");
            assert.match(await details.innerText(), /2024/);
            assert.match(
              await details.innerText(),
              language === "he" ? /לא זמין כרגע/ : /Not available/,
            );
            const subscriptions = page.locator("#profile-subscriptions");
            assert.equal(
              await subscriptions.getAttribute("data-billing-mode"),
              "preview",
            );
            assert.equal(
              await subscriptions.locator("[data-subscription]").count(),
              3,
            );
            for (const productId of ["host", "pay", "manager"]) {
              const card = subscriptions.locator(`[data-product="${productId}"]`);
              assert.equal(await card.locator(".product-state").count(), 1);
              assert.equal(await card.locator(".profile-product-role").count(), 1);
              assert.equal(await card.locator(".profile-product-billing").count(), 1);
              assert.equal(await card.locator(".product-actions a").count(), 1);
            }
            for (const count of await subscriptions
              .locator('[data-subscription-value="active"]')
              .allTextContents())
              assert.equal(count, "0");
            for (const amount of await subscriptions
              .locator(
                '[data-subscription-value="monthly"], #profile-subscription-total',
              )
              .allTextContents()) {
              assert.match(amount, /0/);
              assert.match(amount, /₪/);
            }
            if (process.env.DASHBOARD_PREVIEW_DIR)
              await page.screenshot({
                path: `${process.env.DASHBOARD_PREVIEW_DIR}/profile-subscriptions-${language}-${width}.png`,
                fullPage: true,
              });
            assert.deepEqual(fixture.errors, []);
          },
        );
    }
});
