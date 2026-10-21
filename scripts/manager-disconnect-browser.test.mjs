import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("platform Manager admin can browse customer metadata and deliberately disconnect without opening a gate session", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["en", "he"])
    for (const width of [390, 1440]) {
      await t.test(`${language} ${width}px`, async () => {
        const page = await browser.newPage({
          viewport: { width, height: 950 },
        });
        t.after(() => page.close());
        await page.route(origin + "/manager-admin-fixture", (route) =>
          route.fulfill({
            contentType: "text/html",
            body: `<html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body data-product="manager" class="platform-page"><main class="platform-shell"><div id="root"></div></main></body></html>`,
          }),
        );
        await page.goto(origin + "/manager-admin-fixture");
        await page.evaluate(async (language) => {
          window.removals = [];
          window.connections = 0;
          window.recentCalls = 0;
          let removed = false;
          const { createManagerDashboard } =
            await import("/js/manager-dashboard.js");
          const api = async (path, method, body) => {
            if (path === "/me")
              return { role: "admin", account: null, organizations: [] };
            if (path.startsWith("/invitations?"))
              return { items: [], nextCursor: null };
            if (path.startsWith("/admin/accounts?"))
              return {
                items: path.includes("status=blocked")
                  ? []
                  : [
                      {
                        id: "customer-one",
                        email: "customer@example.test",
                        status: "active",
                      },
                    ],
                nextCursor: null,
              };
            if (path.startsWith("/admin/accounts/customer-one/systems?"))
              return {
                items: removed
                  ? []
                  : [
                      {
                        id: "system-one",
                        name: "Customer gate",
                        type: "gate",
                        systemIds: ["gate-one"],
                        version: 7,
                        status: "active",
                      },
                    ],
                nextCursor: null,
              };
            if (path === "/systems/system-one/remove" && method === "POST") {
              window.removals.push(body);
              removed = true;
              return {
                removed: true,
                networkStopPending: ["gate-one"],
                retainedSharedGates: ["shared-gate"],
              };
            }
            throw new Error("Unexpected API request " + path);
          };
          class Connection {
            constructor() {
              window.connections++;
              throw new Error(
                "No gate session is authorized for account inspection",
              );
            }
          }
          window.dashboard = createManagerDashboard({
            root: document.querySelector("#root"),
            user: { uid: "operator" },
            language,
            api,
            Connection,
            ensureRecent: async () => {
              window.recentCalls++;
            },
          });
          await window.dashboard.ready;
        }, language);
        const he = language === "he";
        await page
          .getByRole("button", {
            name: he ? "חשבונות לקוח" : "Customer accounts",
            exact: true,
          })
          .click();
        await page
          .getByText("customer@example.test", { exact: true })
          .waitFor();
        await page
          .getByRole("button", {
            name: he ? "לקוחות חסומים" : "Blocked customers",
            exact: true,
          })
          .click();
        await page
          .getByText(
            he
              ? "אין לקוחות להצגה במצב הזה."
              : "There are no customers with this status.",
            { exact: true },
          )
          .waitFor();
        await page
          .getByRole("button", {
            name: he ? "לקוחות פעילים" : "Active customers",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", {
            name: he ? "מערכות הלקוח" : "Customer systems",
            exact: true,
          })
          .click();
        const disconnect = page.getByRole("button", {
          name: he ? "ניתוק מ־Manager" : "Disconnect from Manager",
          exact: true,
        });
        await disconnect.waitFor();
        assert.equal(
          await page
            .getByRole("button", {
              name: he ? "פתיחת סביבת ניהול" : "Open workspace",
              exact: true,
            })
            .count(),
          0,
        );
        page.once("dialog", (d) => d.dismiss());
        await disconnect.click();
        assert.equal(await page.evaluate(() => window.removals.length), 0);
        page.once("dialog", (d) => {
          assert.match(d.message(), /Bluetooth/);
          return d.accept();
        });
        await disconnect.click();
        await page
          .getByRole("status")
          .getByText(he ? "בקשת הניתוק נשמרה." : "Disconnect request saved.", {
            exact: false,
          })
          .waitFor();
        await page
          .getByRole("status")
          .getByText(he ? "שערים משותפים ממשיכים" : "Shared gates remain", {
            exact: false,
          })
          .waitFor();
        assert.deepEqual(await page.evaluate(() => window.removals), [
          { expectedVersion: 7 },
        ]);
        assert.equal(await page.evaluate(() => window.recentCalls), 1);
        assert.equal(await page.evaluate(() => window.connections), 0);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      });
    }
});
