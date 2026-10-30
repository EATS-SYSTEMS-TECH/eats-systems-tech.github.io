import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

test("organization example shares the real card and organization workspace with isolated people actions", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440])
      await t.test(`${language} ${width}px`, async () => {
        const page = await browser.newPage({
          viewport: { width, height: 1100 },
        });
        try {
          page.setDefaultTimeout(6000);
          const he = language === "he",
            copy = (h, e) => (he ? h : e);
          await page.route(origin + "/org-parity", (route) =>
            route.fulfill({
              contentType: "text/html; charset=utf-8",
              body: `<!doctype html><html lang="${language}" dir="${he ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/dashboard-header.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><div class="portal-panel"><div class="manager-shell"><nav class="manager-nav">WIFIGATE Manager</nav><div class="manager-main"><section id="root" class="manager-view"></section></div></div></div></main></body></html>`,
            }),
          );
          await page.goto(origin + "/org-parity");
          let networkWrites = 0,
            sockets = 0;
          page.on("request", (request) => {
            if (request.method() !== "GET") networkWrites++;
          });
          page.on("websocket", () => sockets++);
          await page.evaluate(async (language) => {
            const { createManagerExamples } =
              await import("/js/manager-examples.js");
            const { createManagerOrganizationCard } =
              await import("/js/manager-organization-card.js");
            const root = document.querySelector("#root");
            const listing = () => {
              window.examples.closeView();
              root.replaceChildren();
              const heading = document.createElement("h2");
              heading.textContent =
                language === "he" ? "הארגונים שלי" : "My organizations";
              root.append(heading);
              const grid = document.createElement("div");
              grid.className = "manager-org-columns";
              const actions = document.createElement("div");
              actions.className = "manager-org-actions";
              const open = document.createElement("button");
              open.className = "manager-button";
              open.textContent =
                language === "he" ? "כניסה לארגון" : "Open organization";
              actions.append(open);
              grid.append(
                createManagerOrganizationCard({
                  organization: {
                    id: "real-org",
                    name: "Harbor Residence",
                    owner: { email: "owner@example.test" },
                    linkedSystemCount: 1,
                  },
                  language,
                  actions,
                }),
              );
              root.append(grid);
              window.examples.renderOrganizationCard(root);
            };
            window.examples = createManagerExamples({
              language,
              onOpen: () => {},
              onOpenOrganization: (organizationId) =>
                window.examples.renderOrganization(root, {
                  onBack: listing,
                  organizationId,
                }),
            });
            listing();
          }, language);
          await page
            .locator(".manager-organization-examples > summary")
            .click();
          const cards = page.locator(".manager-org-column");
          assert.equal(await cards.count(), 3);
          assert.equal(
            await page.locator("[data-example-organization]").count(),
            2,
          );
          assert.equal(
            await page
              .locator(".manager-organization-examples > summary")
              .innerText(),
            copy("דוגמאות", "Examples"),
          );
          assert.equal(
            await page
              .locator("#root")
              .evaluate((root) =>
                root.firstElementChild.matches(
                  ".manager-organization-examples",
                ),
              ),
            true,
          );
          for (const logo of await page
            .locator("[data-example-organization] .manager-org-avatar img")
            .all()) {
            assert.equal(
              await logo.evaluate(async (image) => {
                await image.decode();
                return (
                  image.naturalWidth > 0 &&
                  getComputedStyle(image).objectFit === "contain"
                );
              }),
              true,
            );
          }
          const cardShape = await cards
            .first()
            .evaluate((card) =>
              [...card.children].map((child) => child.className),
            );
          assert.deepEqual(
            await cards.evaluateAll((cards) =>
              cards.map((card) =>
                [...card.children].map((child) => child.className),
              ),
            ),
            [cardShape, cardShape, cardShape],
          );
          if (process.env.MANAGER_ORG_UX_SCREENSHOTS) {
            await mkdir(process.env.MANAGER_ORG_UX_SCREENSHOTS, {
              recursive: true,
            });
            await page.screenshot({
              path: `${process.env.MANAGER_ORG_UX_SCREENSHOTS}/cards-${language}-${width}.png`,
              fullPage: true,
            });
          }
          await page
            .locator("[data-example-organization]")
            .first()
            .getByRole("button", {
              name: copy("כניסה לארגון", "Open organization"),
              exact: true,
            })
            .click();
          await page.locator(".manager-organization-header h2").waitFor();
          assert.equal(
            await page
              .locator(".manager-organization-disclosure[open]")
              .count(),
            0,
          );
          await page
            .locator('[data-organization-disclosure="branding"] > summary')
            .click();
          await page
            .locator('[data-organization-disclosure="people"] > summary')
            .click();
          assert.deepEqual(
            await page
              .locator(".manager-organization-metrics strong")
              .allTextContents(),
            ["3", "1", "0", "3"],
          );
          assert.equal(
            await page.locator(".manager-organization-person-column").count(),
            3,
          );
          assert.equal(
            await page
              .getByRole("button", { name: /owner@example.test/ })
              .count(),
            0,
          );
          const search = page.getByRole("searchbox");
          await search.fill("resident@example.test");
          assert.equal(
            await page
              .locator(
                ".manager-organization-person-column .manager-organization-person:visible",
              )
              .count(),
            1,
          );
          await search.fill("no-match");
          assert.equal(
            await page
              .locator(".manager-organization-search-empty:visible")
              .count(),
            3,
          );
          await search.fill("");
          if (process.env.MANAGER_ORG_UX_SCREENSHOTS)
            await page.screenshot({
              path: `${process.env.MANAGER_ORG_UX_SCREENSHOTS}/workspace-${language}-${width}.png`,
              fullPage: true,
            });
          await page
            .getByRole("button", {
              name: copy("הוספת צוות", "Add staff"),
              exact: true,
            })
            .click();
          const dialog = page.getByRole("dialog");
          assert.match(
            await dialog.innerText(),
            /סימולציה בלבד|Simulation only/,
          );
          await dialog.getByRole("textbox").fill("invited@example.test");
          await dialog
            .getByRole("button", {
              name: copy("יצירת הזמנה", "Create invitation"),
              exact: true,
            })
            .click();
          await page.locator(".manager-organization-pending").waitFor();
          assert.equal(
            await page
              .locator(
                ".manager-organization-person-column .manager-organization-person",
              )
              .count(),
            4,
          );
          await page
            .getByRole("button", {
              name: copy("ביטול הזמנה", "Cancel invitation"),
              exact: true,
            })
            .click();
          await page
            .getByRole("dialog")
            .getByRole("button", {
              name: copy("אישור", "Confirm"),
              exact: true,
            })
            .click();
          await page
            .locator(".manager-organization-pending")
            .waitFor({ state: "detached" });
          await page
            .getByRole("button", {
              name: copy(
                "הסרת resident@example.test",
                "Remove resident@example.test",
              ),
              exact: true,
            })
            .click();
          await page
            .getByRole("dialog")
            .getByRole("button", {
              name: copy("אישור", "Confirm"),
              exact: true,
            })
            .click();
          await page.waitForFunction(
            () =>
              document.querySelectorAll(
                ".manager-organization-person-column .manager-organization-person",
              ).length === 3,
          );
          assert.deepEqual(
            await page
              .locator(".manager-organization-metrics strong")
              .allTextContents(),
            ["3", "0", "0", "3"],
          );
          assert.equal(
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth,
            ),
            false,
          );
          assert.equal(networkWrites, 0);
          assert.equal(sockets, 0);
          await page
            .getByRole("button", {
              name: copy("כל הארגונים", "All organizations"),
              exact: true,
            })
            .click();
          await page
            .locator(".manager-organization-examples > summary")
            .click();
          await page
            .locator("[data-example-organization]")
            .nth(1)
            .getByRole("button")
            .click();
          await page
            .getByRole("heading", {
              name: "Example WIFIGATE Office",
              exact: true,
            })
            .waitFor();
          assert.deepEqual(
            await page
              .locator(".manager-organization-metrics strong")
              .allTextContents(),
            ["3", "1", "0", "0"],
          );
          assert.equal(
            await page
              .locator('[data-organization-disclosure="people"]')
              .getAttribute("open"),
            null,
            "another organization has its own disclosure state",
          );
          await page
            .locator('[data-organization-disclosure="branding"] > summary')
            .click();
          assert.equal(
            await page.locator(".manager-organization-logo img").count(),
            1,
          );
          await page
            .getByRole("button", {
              name: copy("הסרת לוגו", "Remove logo"),
              exact: true,
            })
            .click();
          await page
            .getByRole("dialog")
            .getByRole("button", {
              name: copy("אישור", "Confirm"),
              exact: true,
            })
            .click();
          await page
            .locator(".manager-organization-logo img")
            .waitFor({ state: "detached" });
          await page
            .getByRole("button", {
              name: copy("כל הארגונים", "All organizations"),
              exact: true,
            })
            .click();
          await page
            .locator(".manager-organization-examples > summary")
            .click();
          assert.equal(
            await page
              .locator("[data-example-organization]")
              .first()
              .locator("img")
              .count(),
            1,
          );
          assert.equal(
            await page
              .locator("[data-example-organization]")
              .nth(1)
              .locator("img")
              .count(),
            0,
          );
          await page.evaluate(async () => {
            const { managerExampleSystems } =
              await import("/js/manager-example-data.js");
            window.examples.assign(
              managerExampleSystems[0],
              "example-manager-office",
            );
            window.assignment = window.examples.assignment(
              managerExampleSystems[0],
            );
          });
          assert.equal(
            await page.evaluate(() => window.assignment),
            "example-manager-office",
          );
          assert.equal(networkWrites, 0);
          assert.equal(sockets, 0);
          await page.evaluate(() => window.examples.close());
        } finally {
          await page.close();
        }
      });
});
