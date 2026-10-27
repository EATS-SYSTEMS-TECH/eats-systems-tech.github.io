import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
import { parseManagerCsv } from "../js/manager-csv.js";

test("Manager example gate, Dual Control and group use real workspace controls without physical access", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440])
      await t.test(`${language} ${width}px`, async (t) => {
        const he = language === "he",
          copy = (h, e) => (he ? h : e);
        const fixture = await scenario(browser, {
          manager: "active",
          enrolled: true,
          verified: true,
          viewport: { width, height: 1000 },
        });
        t.after(() => fixture.context.close());
        const { page, context } = fixture,
          calls = [];
        page.setDefaultTimeout(6000);
        let sockets = 0;
        page.on("websocket", () => sockets++);
        await context.route("**/api/v1/manager/**", (route) => {
          const url = new URL(route.request().url());
          calls.push({ path: url.pathname, method: route.request().method() });
          return route.fulfill({
            json: url.pathname.endsWith("/me")
              ? {
                  role: "admin",
                  roles: ["admin"],
                  account: null,
                  organizations: [],
                }
              : { items: [], nextCursor: null },
          });
        });
        await page.goto(origin + "/dashboard/manager/?lang=" + language);
        const reject = page.locator("[data-cookie-reject]");
        if (await reject.isVisible()) await reject.click();
        const nav = page.locator(".manager-nav"),
          workspace = page.locator('.manager-view[data-simulation="true"]');
        const content = workspace.locator("#manager-content");
        const open = async (id) => {
          await nav
            .getByRole("button", {
              name: copy("המערכות שלי", "My systems"),
              exact: true,
            })
            .click();
          await page.locator(".dashboard-examples > summary").click();
          const card = page.locator(
            `[data-example-system="example-manager-${id}"]`,
          );
          assert.equal(
            await card.getAttribute("class"),
            "manager-card manager-system",
          );
          assert.equal(await card.locator("button").count(), 1);
          await card
            .getByRole("button", {
              name: copy("פתיחת סביבת ניהול", "Open workspace"),
              exact: true,
            })
            .click();
          await workspace.locator(".manager-simulation-note").waitFor();
          await content.locator(".manager-facts").waitFor();
          assert.equal(await workspace.getByRole("tab").count(), 10);
        };
        const tab = async (key) => {
          await workspace.locator(`[data-tab="${key}"]`).click();
          await page.waitForFunction(
            (key) =>
              document
                .querySelector(`[data-tab="${key}"]`)
                ?.getAttribute("aria-selected") === "true" &&
              document
                .querySelector(".manager-view")
                ?.getAttribute("aria-busy") === "false" &&
              document.querySelector("#manager-content")?.childElementCount > 0,
            key,
          );
        };
        const confirm = () =>
          page
            .getByRole("dialog")
            .getByRole("button", {
              name: copy("אישור", "Confirm"),
              exact: true,
            })
            .click();
        await open("gate");
        if (process.env.MANAGER_EXAMPLE_SCREENSHOTS)
          await page.screenshot({
            path: `${process.env.MANAGER_EXAMPLE_SCREENSHOTS}/shared-workspace-${language}-${width}.png`,
            fullPage: true,
          });
        await content
          .getByRole("button", {
            name: copy("פתיחת שער", "Open gate"),
            exact: true,
          })
          .click();
        await confirm();
        await page
          .getByText(
            copy(
              "הפעולה בוצעה בסימולציה. לא הופעל שער פיזי.",
              "Action completed in the simulation. No physical gate was activated.",
            ),
            { exact: true },
          )
          .waitFor();
        await tab("settings");
        await content
          .getByLabel(copy("משך פולס ראשון (מילישניות)", "First pulse (ms)"), {
            exact: true,
          })
          .fill("1200");
        await content
          .getByRole("button", {
            name: copy("שמירת הגדרות", "Save settings"),
            exact: true,
          })
          .click();
        await confirm();
        await page.waitForFunction(
          () =>
            document.querySelector(
              '#manager-content [name="pulseWidth1Millis"]',
            )?.value === "1200",
        );
        await tab("users");
        await content
          .getByRole("button", {
            name: copy("טען עוד", "Load more"),
            exact: true,
          })
          .click();
        await page.waitForFunction(
          () =>
            document.querySelectorAll("#manager-content tbody tr").length ===
            30,
        );
        const downloadEvent = page.waitForEvent("download");
        await content
          .getByRole("button", {
            name: copy("ייצוא כל הרשומות", "Export all records"),
            exact: true,
          })
          .click();
        const download = await downloadEvent;
        assert.equal(
          parseManagerCsv(await readFile(await download.path(), "utf8")).length,
          30,
        );
        await content
          .getByLabel(
            copy("בחירת קובץ משתמשים לייבוא", "Select residents CSV to import"),
            { exact: true },
          )
          .setInputFiles({
            name: "sample.csv",
            mimeType: "text/csv",
            buffer: Buffer.from(
              "Name,Email,Country,Local,Floor,Apt,Parking\nAdded sample,added@example.test,972,509999999,0,0,0",
            ),
          });
        await content
          .getByRole("button", {
            name: copy("בדיקה וייבוא קובץ", "Validate and import file"),
            exact: true,
          })
          .click();
        await confirm();
        await content
          .getByRole("button", {
            name: copy("טען עוד", "Load more"),
            exact: true,
          })
          .click();
        await content.getByText("Added sample", { exact: true }).waitFor();
        await tab("admins");
        await content
          .getByRole("button", { name: copy("מחיקה", "Delete"), exact: true })
          .click();
        await confirm();
        await page
          .getByRole("alert")
          .filter({ hasText: copy("לא ניתן להסיר", "cannot be removed") })
          .waitFor();
        await tab("guests");
        await content.getByRole("button", { name: /20261027/ }).click();
        await content.getByText("Demo technician", { exact: true }).waitFor();
        await tab("events");
        assert.equal(
          await content
            .getByRole("button", {
              name: copy("מחיקת אירוע", "Delete event"),
              exact: true,
            })
            .count(),
          12,
        );
        await content
          .getByRole("button", {
            name: copy("מחיקת אירוע", "Delete event"),
            exact: true,
          })
          .first()
          .click();
        await confirm();
        await page.waitForFunction(
          () =>
            document.querySelectorAll("#manager-content .manager-row")
              .length === 11,
        );
        await tab("auto");
        await content
          .getByRole("button", {
            name: copy("כיבוי Auto Open", "Disable Auto Open"),
            exact: true,
          })
          .click();
        await tab("rf");
        await content
          .getByRole("button", {
            name: copy("לימוד שלט", "Learn remote"),
            exact: true,
          })
          .click();
        await confirm();
        await content
          .getByRole("button", {
            name: copy("בדיקת לימוד", "Check learning"),
            exact: true,
          })
          .click();
        await content
          .getByRole("button", { name: copy("שמירה", "Save"), exact: true })
          .click();
        await tab("system");
        await content.locator(".manager-facts").waitFor();
        await open("dual");
        const gatePicker = workspace.getByLabel(
          copy("בחירת שער", "Choose gate"),
          { exact: true },
        );
        assert.equal(await gatePicker.locator("option").count(), 2);
        await gatePicker.selectOption("DEMO-24982");
        await content.getByText("DEMO-24982", { exact: true }).waitFor();
        await open("group");
        assert.equal(await gatePicker.locator("option").count(), 4);
        await tab("settings");
        assert.equal(
          await content
            .getByLabel(
              copy("משך פולס ראשון (מילישניות)", "First pulse (ms)"),
              { exact: true },
            )
            .inputValue(),
          "1200",
        );
        await workspace.locator(".manager-system-menu summary").click();
        await workspace
          .getByRole("button", {
            name: copy("שיוך לארגון", "Assign organization"),
            exact: true,
          })
          .click();
        await workspace
          .getByLabel(copy("ארגון", "Organization"), { exact: true })
          .selectOption("");
        await workspace
          .getByRole("button", { name: copy("שמירה", "Save"), exact: true })
          .click();
        await workspace.locator("#manager-content .manager-facts").waitFor();
        assert.equal(
          calls.some(
            (call) =>
              call.method !== "GET" ||
              /identity|connection-requests|assign|remove/.test(call.path),
          ),
          false,
        );
        assert.equal(sockets, 0);
        assert.deepEqual(fixture.errors, []);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
        await nav
          .getByRole("button", {
            name: copy("הארגונים שלי", "My organizations"),
            exact: true,
          })
          .click();
        await page.locator(".dashboard-examples > summary").click();
        await page
          .locator("[data-example-organization]")
          .getByRole("button")
          .click();
        await page.locator(".dashboard-examples > summary").click();
        await page
          .locator('[data-example-system="example-manager-gate"]')
          .getByRole("button")
          .click();
        await workspace.locator("#manager-content .manager-facts").waitFor();
        await workspace
          .getByRole("button", {
            name: copy("סיום וחזרה", "End and return"),
            exact: true,
          })
          .click();
        await page
          .getByRole("heading", {
            name: "Example WIFIGATE Organization",
            exact: true,
          })
          .waitFor();
      });
});

test("Manager users and organization administrators never receive platform navigation", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const role of ["user", "organization-admin"])
    await t.test(role, async (t) => {
      const fixture = await scenario(browser, {
        manager: "active",
        enrolled: true,
        verified: true,
      });
      t.after(() => fixture.context.close());
      await fixture.context.route("**/api/v1/manager/**", (route) =>
        route.fulfill({
          json: new URL(route.request().url()).pathname.endsWith("/me")
            ? {
                role,
                roles: [role],
                account:
                  role === "user" ? { id: "account", status: "active" } : null,
                organizations: [],
              }
            : { items: [], nextCursor: null },
        }),
      );
      await fixture.page.goto(origin + "/dashboard/manager/");
      await fixture.page
        .locator(".manager-nav")
        .getByRole("button", { name: "My organizations", exact: true })
        .click();
      await fixture.page.locator(".dashboard-examples > summary").click();
      await fixture.page.locator("[data-example-organization]").waitFor();
      assert.equal(
        await fixture.page.locator(".manager-platform-nav").count(),
        0,
      );
      assert.equal(
        await fixture.page
          .locator(".manager-nav")
          .getByText("WIFIGATE Manager admin platform", { exact: true })
          .count(),
        0,
      );
      assert.deepEqual(fixture.errors, []);
    });
});
