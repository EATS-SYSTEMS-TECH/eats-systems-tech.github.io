import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("real and simulated Manager systems render identical cards and all ten workspace tabs", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      try {
        await page.route(origin + "/example-parity", (route) =>
          route.fulfill({
            contentType: "text/html",
            body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body data-product="manager" class="platform-page"><main class="platform-shell"><div id="root"></div></main></body></html>`,
          }),
        );
        await page.goto(origin + "/example-parity");
        await page.evaluate(async (language) => {
          const { createManagerDashboard } =
            await import("/js/manager-dashboard.js");
          const { ManagerExampleConnection } =
            await import("/js/manager-example-connection.js");
          const { createManagerExampleData, managerExampleSystems } =
            await import("/js/manager-example-data.js");
          window.realConnections = 0;
          window.reauthentications = 0;
          class FixtureConnection extends ManagerExampleConnection {
            constructor(options) {
              super({
                data: createManagerExampleData(),
                system: managerExampleSystems[0],
                onState: options.onState,
              });
              window.realConnections++;
            }
            open() {
              return super.open("DEMO-24980");
            }
          }
          window.dashboard = createManagerDashboard({
            root: document.querySelector("#root"),
            user: {},
            language,
            Connection: FixtureConnection,
            ensureRecent: async () => {
              window.reauthentications++;
            },
            api: async (path) =>
              path === "/me"
                ? {
                    role: "user",
                    account: { id: "fixture-account" },
                    organizations: [],
                  }
                : {
                    items: path.startsWith("/systems?")
                      ? [
                          {
                            ...managerExampleSystems[0],
                            id: "fixture-real-gate",
                            example: true,
                            status: "active",
                          },
                        ]
                      : [],
                    nextCursor: null,
                  },
          });
          await window.dashboard.ready;
        }, language);
        const real = page.locator(
          ".manager-view > .manager-grid .manager-system",
        );
        const example = page.locator(
          '[data-example-system="example-manager-gate"]',
        );
        await page.locator(".manager-examples > summary").click();
        const normalizeCard = (node) => {
          const clone = node.cloneNode(true);
          clone.querySelector(".manager-example-badge")?.remove();
          delete clone.dataset.exampleSystem;
          return clone.outerHTML;
        };
        assert.equal(
          await real.evaluate(normalizeCard),
          await example.evaluate(normalizeCard),
          `${language} ${width} card markup`,
        );
        const style = (node) => {
          const css = getComputedStyle(node);
          return [
            css.display,
            css.backgroundImage,
            css.padding,
            css.borderRadius,
            css.gap,
          ];
        };
        assert.deepEqual(
          await real.evaluate(style),
          await example.evaluate(style),
        );
        await real.getByRole("button").click();
        const tabs = [
          "overview",
          "users",
          "admins",
          "guests",
          "auto",
          "settings",
          "events",
          "history",
          "rf",
          "system",
        ];
        const snapshot = async () => {
          const contents = {};
          for (const key of tabs) {
            await page.locator(`[data-tab="${key}"]`).click();
            await page.waitForFunction(
              () =>
                document
                  .querySelector(".manager-view")
                  ?.getAttribute("aria-busy") === "false" &&
                document.querySelector("#manager-content")?.childElementCount >
                  0,
            );
            contents[key] = await page.locator("#manager-content").innerHTML();
          }
          return contents;
        };
        await page.locator("#manager-content .manager-facts").waitFor();
        const reference = await snapshot();
        await page
          .getByRole("button", {
            name: language === "he" ? "סיום וחזרה" : "End and return",
            exact: true,
          })
          .click();
        await page.locator(".manager-examples > summary").click();
        await example.getByRole("button").click();
        await page.locator(".manager-simulation-note").waitFor();
        await page.locator("#manager-content .manager-facts").waitFor();
        const simulated = await snapshot();
        assert.deepEqual(
          simulated,
          reference,
          `${language} ${width}: every tab uses identical forms, actions, tables and facts`,
        );
        assert.equal(
          await page.evaluate(() => window.realConnections),
          1,
          "examples never construct the physical connection",
        );
        assert.equal(
          await page.evaluate(() => window.reauthentications),
          1,
          "example controls never start real reauthentication",
        );
        await page
          .getByRole("button", {
            name: language === "he" ? "סיום וחזרה" : "End and return",
            exact: true,
          })
          .click();
        await real.getByRole("button").click();
        await page.locator("#manager-content .manager-facts").waitFor();
        assert.equal(await page.locator(".manager-simulation-note").count(), 0);
        assert.equal(
          await page.evaluate(() => window.realConnections),
          2,
          "returning to a real system restores the physical transport",
        );
        assert.equal(
          await page.evaluate(() => window.reauthentications),
          2,
          "real reauthentication remains required after a simulation",
        );
        assert.deepEqual(errors, []);
        await page.evaluate(() => window.dashboard.close());
        assert.equal(
          await page.locator(".manager-confirm-dialog, .manager-shell").count(),
          0,
        );
      } finally {
        await page.close();
      }
    }
});
