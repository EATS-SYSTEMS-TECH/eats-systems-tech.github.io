import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

const estimate = (amounts, quantities) => ({kind: "monthly-estimate", currency: "USD", monthlyCents: amounts.reduce((a,b) => a+b,0), lines: Object.fromEntries(["gates", "dualControls", "groups", "organizations"].map((key,i) => [key,{amountCents: amounts[i], quantity: quantities[i]}]))});

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
              productFinancials: {
                host: estimate([8000, 2000, 0, 0], [16,2,0,1]),
                manager: estimate([7540, 2320, 0, 0], [26,4,0,2]),
                pay: {kind: "revenue", revenue: {currency: "ILS", amountCents: 12550}},
              },
              personalSummaries: {
                host: { gates: 7, dualControls: 2, groups: 3, organizations: 1 },
                manager: { gates: 11, dualControls: 4, groups: 5, organizations: 2 },
              },
              viewport: { width, height: 1000 },
              hasTouch: width === 320,
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
            if (!product && width >= 651) {
              const switcher = header.locator("#product-switcher-button");
              await switcher.click();
              const switcherBox = await switcher.boundingBox();
              const menuBox = await page.locator(".product-switcher__popover").boundingBox();
              assert.equal(switcherBox.width, menuBox.width);
              assert.ok(Math.abs(switcherBox.x - menuBox.x) < 1);
              await page.keyboard.press("Escape");
            }
            const flag = header.locator(".platform-language__button");
            assert.equal(await flag.innerText(), "");
            assert.equal(await flag.locator("img").isVisible(), true);
            const flagButtonBox = await flag.boundingBox();
            const flagImageBox = await flag.locator("img").boundingBox();
            assert.ok(Math.abs(flagButtonBox.x + flagButtonBox.width / 2 - flagImageBox.x - flagImageBox.width / 2) < 1);
            assert.ok(Math.abs(flagButtonBox.y + flagButtonBox.height / 2 - flagImageBox.y - flagImageBox.height / 2) < 1);
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
            assert.equal(
              await panel.getByText("fixture@example.test", { exact: true })
                .evaluate((el) => getComputedStyle(el).textAlign),
              language === "he" ? "right" : "left",
            );
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
            const email = details.getByText("fixture@example.test", { exact: true });
            assert.deepEqual(
              await email.evaluate((el) => ({
                align: getComputedStyle(el).textAlign,
                direction: getComputedStyle(el).direction,
              })),
              { align: language === "he" ? "right" : "left", direction: "ltr" },
            );
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
              assert.deepEqual(
                await card.locator("[data-personal-count]").allTextContents(),
                productId === "host" ? ["16", "2", "1"]
                  : productId === "manager" ? ["26", "4", "2"]
                  : [],
              );
              assert.equal(await card.locator('[data-personal-count="groups"]').count(), 0);
              if (productId !== "pay") {
                const info = card.locator('.info-tip__button');
                if (width === 320) await info.tap();
                else await info.click();
                assert.equal(await info.getAttribute('aria-expanded'), 'true');
                const bubble = card.locator('[role="tooltip"]');
                assert.equal(await bubble.isVisible(), true);
                assert.match(await bubble.innerText(), productId === "host" ? /\$6/ : /\$2\.90/);
                const box = await bubble.boundingBox();
                assert.ok(box.x >= 0 && box.x + box.width <= width);
                if (process.env.DASHBOARD_PREVIEW_DIR && !product) await page.screenshot({path:`${process.env.DASHBOARD_PREVIEW_DIR}/cost-tooltip-${productId}-${language}-${width}.png`});
                if (width === 320) {
                  await card.locator('.product-state').tap();
                  assert.equal(await bubble.isVisible(), false);
                  await info.tap();
                  assert.equal(await bubble.isVisible(), true);
                }
                await page.keyboard.press('Escape');
                assert.equal(await bubble.isVisible(), false);
              }
              assert.equal(await card.locator(".product-actions a").count(), 3);
              assert.equal(await card.locator(".product-actions > *").count(), 3);
              assert.equal(await card.locator(".product-actions > button").count(), 0);
              assert.equal(await card.locator("[data-personal-cost]").count(), productId === "pay" ? 0 : 3);
              assert.equal(await card.locator(".product-actions > :first-child").textContent(), language === "he" ? "פתיחה" : "Open");
            }
            assert.equal(await subscriptions.locator('[data-subscription-value="status"]').count(), 0);
            assert.match(await subscriptions.locator('[data-product="host"] [data-subscription-value="monthly"]').innerText(), /100\.00/);
            assert.match(await subscriptions.locator('[data-product="manager"] [data-subscription-value="monthly"]').innerText(), /98\.60/);
            assert.equal(await subscriptions.locator('[data-product="pay"] [data-subscription-value="monthly"]').count(), 0);
            assert.match(await subscriptions.locator('[data-subscription-value="revenue"]').innerText(), /125\.50/);
            assert.match(await page.locator('#profile-subscription-total').innerText(), /198\.60/);
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
