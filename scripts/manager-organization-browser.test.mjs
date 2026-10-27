import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { startSite } from "./platform-test-fixtures.mjs";
const png = process.env.MANAGER_ORG_LOGO_FILE
  ? await readFile(process.env.MANAGER_ORG_LOGO_FILE)
  : Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4n8LwHwAGLAJjSJjn0AAAAABJRU5ErkJggg==",
      "base64",
    );

async function fixture(t, browser, origin, language, width, viewer = false) {
  const page = await browser.newPage({ viewport: { width, height: 1100 } });
  t.after(() => page.close());
  page.setDefaultTimeout(7000);
  await page.route(origin + "/organization-fixture", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><div class="portal-panel"><div id="root"></div></div></main></body></html>`,
    }),
  );
  await page.goto(origin + "/organization-fixture");
  await page.evaluate(
    async ({ language, viewer }) => {
      const { createManagerDashboard } =
        await import("/js/manager-dashboard.js");
      const { ManagerExampleConnection } =
        await import("/js/manager-example-connection.js");
      const { createManagerExampleData, managerExampleSystems } =
        await import("/js/manager-example-data.js");
      window.writes = [];
      window.connections = 0;
      window.members = [
        {
          uid: "current",
          email: "admin@example.test",
          role: "organization-admin",
          status: "active",
        },
        {
          uid: "delegate",
          email: "delegate@example.test",
          role: "organization-admin",
          status: "active",
        },
        {
          uid: "user-one",
          email: "resident@example.test",
          role: "organization-user",
          status: "active",
        },
      ];
      let version = 1,
        logoDataUrl = null,
        pending = [];
      const api = async (p, method = "GET", body) => {
        if (method === "POST") window.writes.push({ path: p, body });
        if (p === "/me")
          return {
            role: "user",
            roles: ["user"],
            account: viewer ? null : { id: "personal" },
            organizations: [
              {
                id: "org-a",
                name: "Harbor Residence",
                role: viewer ? "organization-user" : "organization-admin",
              },
            ],
          };
        if (p.startsWith("/organizations?"))
          return {
            items: [
              {
                id: "org-a",
                name: "Harbor Residence",
                version: 1,
                owner: { uid: "owner", email: "owner@example.test" },
                administrators: [],
                linkedSystemCount: 1,
              },
            ],
            nextCursor: null,
          };
        if (p.startsWith("/systems?") || p.startsWith("/invitations?"))
          return { items: [], nextCursor: null };
        if (p === "/organizations/org-a")
          return {
            organization: {
              id: "org-a",
              name: language === "he" ? "כיכר החוף" : "Harbor Residence",
              version,
              logoDataUrl,
            },
            owner: { uid: "owner", email: "owner@example.test" },
            counts: {
              administrators: 3,
              users: window.members.filter(
                (m) => m.role === "organization-user" && m.status === "active",
              ).length,
              systems: 1,
            },
            permissions: {
              managePeople: !viewer,
              manageLogo: !viewer,
              openWorkspace: true,
            },
          };
        if (p.startsWith("/organizations/org-a/systems?"))
          return {
            items: [
              {
                id: "system-one",
                name: "Entrance gate",
                type: "gate",
                systemIds: ["one"],
                status: "active",
                version: 1,
                accessNote: {
                  residentName: "Example Resident",
                  note: "Welcome",
                  address: "Example Street 1",
                },
              },
            ],
            nextCursor: null,
          };
        if (p.startsWith("/organizations/org-a/members?"))
          return { items: window.members, nextCursor: null };
        if (p.startsWith("/organizations/org-a/invitations?"))
          return { items: pending, nextCursor: null };
        if (p === "/organizations/org-a/logo") {
          logoDataUrl = body.logoDataUrl;
          version++;
          return { organization: { version, logoDataUrl } };
        }
        if (p === "/organizations/org-a/invitations") {
          pending.push({
            id: "invitation-one",
            email: body.email,
            role: body.role,
          });
          return { invitation: pending.at(-1) };
        }
        if (p.endsWith("/invitations/invitation-one/cancel")) {
          pending = [];
          return { cancelled: true };
        }
        if (p.endsWith("/members/user-one/remove")) {
          window.members = window.members.filter((m) => m.uid !== "user-one");
          return { removed: true };
        }
        throw new Error("Unexpected fixture request " + p);
      };
      window.dashboard = createManagerDashboard({
        root: document.querySelector("#root"),
        language,
        user: { uid: "current" },
        api,
        Connection: class extends ManagerExampleConnection {
          constructor(options) {
            super({
              data: createManagerExampleData(),
              system: managerExampleSystems[0],
              onState: options.onState,
            });
            window.connections++;
            if (!viewer)
              throw new Error("No hardware operation in metadata tests");
          }
          open() {
            return super.open("DEMO-24980");
          }
        },
      });
      await window.dashboard.ready;
    },
    { language, viewer },
  );
  return page;
}

test("selected organization contains branding, people and systems; invitation/removal dialogs stay scoped and responsive", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [320, 390, 1440])
      await t.test(`${language} ${width}px`, async () => {
        const page = await fixture(t, browser, origin, language, width);
        const he = language === "he";
        assert.equal(
          await page.locator(".manager-organization-workspace").count(),
          0,
        );
        assert.equal(
          await page
            .locator(".manager-nav")
            .getByRole("button", {
              name: he ? "מנהלי ארגון" : "Organization administrators",
              exact: true,
            })
            .count(),
          0,
        );
        await page
          .getByLabel(he ? "בחירת ארגון" : "Choose organization", {
            exact: true,
          })
          .selectOption("org-a");
        await page.locator(".manager-organization-header h2").waitFor();
        assert.deepEqual(
          await page
            .locator(".manager-organization-metrics strong")
            .allTextContents(),
          ["3", "1", "1"],
        );
        assert.equal(
          await page
            .locator(".manager-system .manager-system-actions button")
            .count(),
          1,
        );
        assert.equal(
          await page.locator(".manager-organization-person-column").count(),
          2,
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: he
                ? "הסרת owner@example.test"
                : "Remove owner@example.test",
              exact: true,
            })
            .count(),
          0,
        );
        assert.equal(
          await page
            .getByRole("button", {
              name: he
                ? "הסרת admin@example.test"
                : "Remove admin@example.test",
              exact: true,
            })
            .count(),
          0,
        );
        const upload = page.getByLabel(
          he ? "בחירת קובץ לוגו" : "Choose logo file",
          { exact: true },
        );
        await upload.setInputFiles({
          name: "organization.png",
          mimeType: "image/png",
          buffer: png,
        });
        await page.getByRole("dialog").waitFor();
        await page.keyboard.press("Escape");
        assert.deepEqual(await page.evaluate(() => window.writes), []);
        await upload.setInputFiles({
          name: "organization.png",
          mimeType: "image/png",
          buffer: png,
        });
        await page
          .getByRole("dialog")
          .getByRole("button", {
            name: he ? "שמירת לוגו" : "Save logo",
            exact: true,
          })
          .click();
        await page.getByRole("dialog").waitFor({ state: "hidden" });
        await page.locator(".manager-organization-logo img").waitFor();
        if (process.env.MANAGER_ORG_SCREENSHOTS) {
          await mkdir(process.env.MANAGER_ORG_SCREENSHOTS, { recursive: true });
          await page.screenshot({
            path: path.join(
              process.env.MANAGER_ORG_SCREENSHOTS,
              `organization-${language}-${width}.png`,
            ),
            fullPage: true,
          });
        }
        assert.equal(
          (await page.evaluate(() => window.writes[0])).body.expectedVersion,
          1,
        );
        await page
          .getByRole("button", {
            name: he ? "הוספת משתמש" : "Add user",
            exact: true,
          })
          .click();
        await page
          .getByRole("dialog")
          .getByLabel(he ? "כתובת אימייל" : "Email address", { exact: true })
          .fill("invited@example.test");
        await page
          .getByRole("dialog")
          .getByRole("button", {
            name: he ? "יצירת הזמנה" : "Create invitation",
            exact: true,
          })
          .click();
        await page.locator(".manager-organization-pending").waitFor();
        assert.deepEqual(
          (
            await page.evaluate(() =>
              window.writes.find((w) => w.path.endsWith("/invitations")),
            )
          ).body,
          { email: "invited@example.test", role: "organization-user" },
        );
        await page
          .getByRole("button", {
            name: he ? "ביטול הזמנה" : "Cancel invitation",
            exact: true,
          })
          .click();
        await page
          .getByRole("dialog")
          .getByRole("button", { name: he ? "אישור" : "Confirm", exact: true })
          .click();
        await page
          .locator(".manager-organization-pending")
          .waitFor({ state: "hidden" });
        await page
          .getByRole("button", {
            name: he
              ? "הסרת resident@example.test"
              : "Remove resident@example.test",
            exact: true,
          })
          .click();
        assert.match(
          await page.getByRole("dialog").innerText(),
          he
            ? /החשבון והגישה לארגונים אחרים/
            : /Their account and access to other organizations/,
        );
        await page.keyboard.press("Escape");
        assert.equal(
          await page.evaluate(() =>
            window.writes.some((w) => w.path.endsWith("/remove")),
          ),
          false,
        );
        await page
          .getByRole("button", {
            name: he
              ? "הסרת resident@example.test"
              : "Remove resident@example.test",
            exact: true,
          })
          .click();
        await page
          .getByRole("dialog")
          .getByRole("button", { name: he ? "אישור" : "Confirm", exact: true })
          .click();
        await page.waitForFunction(() =>
          document
            .querySelector(".manager-organization-metrics")
            .textContent.includes("0"),
        );
        assert.equal(await page.evaluate(() => window.connections), 0);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
      });
});

test("organization users can open system workspaces without organization people or branding controls", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await fixture(t, browser, origin, "he", 390, true);
  await page.getByLabel("בחירת ארגון", { exact: true }).selectOption("org-a");
  await page.locator(".manager-organization-header h2").waitFor();
  assert.equal(
    await page
      .locator(
        "input[type=file], .manager-organization-remove, .manager-organization-people-head button",
      )
      .count(),
    0,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "פתיחת סביבת ניהול", exact: true })
      .count(),
    1,
  );
  assert.equal(
    await page.getByText("משתמש · צפייה בלבד", { exact: true }).count(),
    0,
  );
  assert.deepEqual(await page.evaluate(() => window.writes), []);
  assert.equal(await page.evaluate(() => window.connections), 0);
  await page
    .getByRole("button", { name: "פתיחת סביבת ניהול", exact: true })
    .click();
  await page.locator("#manager-content .manager-facts").waitFor();
  assert.equal(await page.evaluate(() => window.connections), 1);
  assert.equal(await page.getByRole("tab").count(), 10);
  assert.deepEqual(await page.evaluate(() => window.writes), []);
  await page.evaluate(() => window.dashboard.close());
});
