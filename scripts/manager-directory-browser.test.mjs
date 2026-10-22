import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

test("Manager identity, platform overview and organization columns support scoped administration in Hebrew and English", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440])
      await t.test(`${language} ${width}px`, async () => {
        const page = await browser.newPage({
          viewport: { width, height: 1000 },
        });
        t.after(() => page.close());
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.route(origin + "/manager-directory-fixture", (r) =>
          r.fulfill({
            contentType: "text/html",
            body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><header class="platform-header"><a class="brand"><img src="/assets/img/wifigate-horizontal-logo.webp" alt="WIFIGATE"></a><strong>WIFIGATE Manager</strong></header><div id="root"></div></main></body></html>`,
          }),
        );
        await page.goto(origin + "/manager-directory-fixture");
        await page.evaluate(async (language) => {
          const { createManagerDashboard } =
            await import("/js/manager-dashboard.js");
          window.calls = [];
          window.recent = 0;
          window.mode = "admin";
          const organizations = [
            {
              id: "org-a",
              name: "Harbor Hotel",
              version: 1,
              owner: {
                id: "owner-a",
                email: "owner@example.test",
                role: "user",
              },
              administrators: [
                { uid: "delegate", email: "delegate@example.test" },
              ],
              linkedSystemCount: 3,
            },
            {
              id: "org-b",
              name: "Garden Office",
              version: 1,
              owner: {
                id: "owner-b",
                email: "second@example.test",
                role: "user",
              },
              administrators: [],
              linkedSystemCount: 0,
            },
          ];
          const api = async (path, method = "GET", body) => {
            window.calls.push({ path, method, body });
            if (path === "/me")
              return {
                user: {
                  uid: "operator",
                  email: "operator@example.test",
                  name: "Manager operator",
                },
                role: window.mode,
                roles: [window.mode],
                account: window.mode === "user" ? { id: "owner-a" } : null,
                organizations:
                  window.mode === "admin"
                    ? []
                    : [
                        {
                          id: "org-a",
                          name: "Harbor Hotel",
                          role:
                            window.mode === "user"
                              ? "owner"
                              : "organization-admin",
                        },
                      ],
              };
            if (path === "/admin/overview")
              return {
                admins: 1,
                users: 2,
                organizationAdmins: 1,
                organizations: organizations.length,
              };
            if (path.startsWith("/admin/directory?"))
              return {
                items: [
                  {
                    id: "operator",
                    uid: "operator",
                    email: "operator@example.test",
                    role: "admin",
                    status: "active",
                  },
                ],
                nextCursor: null,
              };
            if (
              path.startsWith("/admin/organizations?") ||
              path.startsWith("/organizations?")
            )
              return {
                items:
                  window.mode === "admin"
                    ? organizations
                    : organizations.slice(0, 1),
                nextCursor: null,
              };
            if (path.endsWith("/members?limit=100"))
              return {
                items: organizations[0].administrators.map((m) => ({
                  ...m,
                  status: "active",
                })),
                nextCursor: null,
              };
            if (path.endsWith("/invitations") && method === "POST")
              return { invitation: { email: body.email } };
            if (path.endsWith("/members/delegate/remove")) {
              organizations[0].administrators = [];
              return { removed: true };
            }
            if (path === "/admin/organizations/org-b/archive") {
              organizations.splice(1, 1);
              return { archived: true };
            }
            if (path === "/admin/organizations" && method === "POST") {
              organizations.push({
                id: "created",
                name: body.name,
                version: 1,
                owner: { id: "owner-a", email: body.email, role: "user" },
                administrators: [],
                linkedSystemCount: 0,
              });
              return { organization: organizations.at(-1) };
            }
            if (path.startsWith("/organizations/org-a/systems?"))
              return { items: [], nextCursor: null };
            throw new Error("Unexpected request " + path);
          };
          window.mount = async (role) => {
            window.dashboard?.close();
            window.mode = role;
            window.dashboard = createManagerDashboard({
              root: document.querySelector("#root"),
              user: { uid: "operator" },
              language,
              api,
              ensureRecent: async () => {
                window.recent++;
              },
            });
            await window.dashboard.ready;
          };
          await window.mount("admin");
        }, language);
        const he = language === "he",
          nav = page.locator(".manager-nav");
        await page
          .locator(".manager-overview-grid .manager-overview-card")
          .last()
          .waitFor();
        assert.equal(await page.locator(".manager-overview-card").count(), 4);
        await page
          .locator(".manager-identity-email")
          .getByText("operator@example.test", { exact: true })
          .waitFor();
        await nav
          .getByText(he ? "ניהול פלטפורמה" : "Platform management", {
            exact: true,
          })
          .waitFor();
        await nav
          .getByRole("button", {
            name: he ? "ארגונים" : "Organizations",
            exact: true,
          })
          .click();
        await page.locator('[data-organization="org-b"]').waitFor();
        const first = page.locator('[data-organization="org-a"]');
        assert.equal(
          await first.locator(".manager-org-count b").innerText(),
          "3",
        );
        await first.getByText("owner@example.test", { exact: true }).waitFor();
        await first
          .getByText("delegate@example.test", { exact: true })
          .waitFor();
        if (width === 1440) {
          const boxes = await page
            .locator(".manager-org-column")
            .evaluateAll((rows) =>
              rows.map((r) => r.getBoundingClientRect().toJSON()),
            );
          assert.equal(boxes[0].top, boxes[1].top);
          assert.notEqual(boxes[0].left, boxes[1].left);
        }
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        if (process.env.MANAGER_DIRECTORY_SCREENSHOTS)
          await page.screenshot({
            path: `${process.env.MANAGER_DIRECTORY_SCREENSHOTS}/manager-organizations-${language}-${width}.png`,
            fullPage: true,
          });
        await first
          .getByRole("button", {
            name: he
              ? "ניהול מנהלי הארגון"
              : "Manage organization administrators",
          })
          .click();
        await page
          .getByLabel(
            he ? "אימייל מנהל הארגון" : "Organization administrator email",
            { exact: true },
          )
          .fill("new@example.test");
        await page
          .getByRole("button", {
            name: he ? "יצירת הזמנה" : "Create invitation",
            exact: true,
          })
          .click();
        await page
          .locator(".manager-status")
          .getByText(
            he
              ? "ההזמנה ממתינה בחשבון של כתובת האימייל שהוזנה."
              : "The invitation is waiting in the invited email account.",
            { exact: true },
          )
          .waitFor();
        page.once("dialog", (d) => d.accept());
        await page
          .getByRole("button", {
            name: he ? "ביטול גישה" : "Revoke access",
            exact: true,
          })
          .click();
        await page
          .getByText("delegate@example.test", { exact: true })
          .waitFor({ state: "hidden" });
        await nav
          .getByRole("button", {
            name: he ? "ארגונים" : "Organizations",
            exact: true,
          })
          .click();
        page.once("dialog", (d) => d.accept());
        await page
          .locator('[data-organization="org-b"]')
          .getByRole("button", {
            name: he ? "הסרת ארגון" : "Remove organization",
          })
          .click();
        await page
          .locator('[data-organization="org-b"]')
          .waitFor({ state: "detached" });
        await page
          .getByLabel(he ? "שם ארגון חדש" : "New organization name", {
            exact: true,
          })
          .fill("New organization");
        await page
          .getByLabel(
            he
              ? "אימייל בעל הארגון · Manager user"
              : "Organization owner email · Manager user",
            { exact: true },
          )
          .fill("owner@example.test");
        await page
          .getByRole("button", {
            name: he ? "יצירת ארגון" : "Create organization",
            exact: true,
          })
          .click();
        await page.locator('[data-organization="created"]').waitFor();
        const calls = await page.evaluate(() => window.calls);
        assert(
          calls.some(
            (c) => c.path === "/admin/organizations" && c.body.requestId,
          ),
        );
        assert(
          calls.some(
            (c) =>
              c.path === "/admin/organizations/org-a/invitations" &&
              c.body.email === "new@example.test",
          ),
        );
        assert(calls.some((c) => c.path.endsWith("/members/delegate/remove")));
        assert((await page.evaluate(() => window.recent)) >= 4);
        await page.evaluate(() => window.mount("organization-admin"));
        await nav
          .locator(".manager-role-badge")
          .getByText("WIFIGATE Manager organization admin", { exact: true })
          .waitFor();
        assert.equal(
          await nav
            .getByText(he ? "ניהול פלטפורמה" : "Platform management", {
              exact: true,
            })
            .count(),
          0,
        );
        await nav
          .getByRole("button", {
            name: he ? "ארגונים" : "Organizations",
            exact: true,
          })
          .click();
        await page.locator('[data-organization="org-a"]').waitFor();
        assert.equal(
          await page
            .getByRole("button", {
              name: he ? "הסרת ארגון" : "Remove organization",
              exact: true,
            })
            .count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: he ? "יצירת ארגון" : "Create organization",
              exact: true,
            })
            .count(),
          0,
        );
        assert.deepEqual(errors, []);
      });
});
