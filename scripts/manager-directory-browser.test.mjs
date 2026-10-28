import test from "node:test";
import assert from "node:assert/strict";
import { startSite, scenario } from "./platform-test-fixtures.mjs";

test("published Manager page wires the private profile into the header without duplicating account details", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const width of [320, 390, 1440])
    await t.test(`${width}px`, async (t) => {
      const fixture = await scenario(browser, {
        manager: "active",
        enrolled: true,
        verified: true,
        viewport: { width, height: 1000 },
      });
      t.after(() => fixture.context.close());
      const grants = [];
      await fixture.context.route("**/api/v1/manager/**", (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith('/admin/access') && route.request().method() === 'POST') grants.push(route.request().postDataJSON());
        return route.fulfill({
          json: path.endsWith("/me")
            ? {
                user: {
                  uid: "fixture-user",
                  name: "Manager operator",
                  email: "operator@example.test",
                },
                role: "admin",
                roles: ["admin"],
                account: null,
                organizations: [],
              }
            : path.includes('/admin/directory')
              ? {items:[{id:'fixture-user',uid:'fixture-user',email:'operator@example.test',role:'admin',status:'active'}],nextCursor:null}
              : path.endsWith('/overview')
                ? { admins: 1, users: 4, organizationAdmins: 2, organizations: 3 }
                : {items:[],nextCursor:null},
        });
      });
      const page = fixture.page;
      page.setDefaultTimeout(7000);
      await page.goto(origin + "/dashboard/manager/?lang=he");
      const platformEntry = page.locator(".manager-platform-entry");
      await platformEntry.waitFor();
      assert.equal(await page.locator(".manager-sidebar-roles").innerText(), "WIFIGATE Manager admin");
      const originalMenu = await page.locator('.manager-nav button').allTextContents();
      const entryBox = await platformEntry.boundingBox();
      assert.ok(entryBox.x + entryBox.width > width - 30, "Hebrew management entry is at the bottom right");
      assert.equal(await page.locator('.manager-platform-header').isVisible(), false);
      await platformEntry.click();
      await page.locator(".manager-overview-card").last().waitFor();
      const infoStyle = await page.locator('.manager-count-info').evaluate(el => { const s=getComputedStyle(el); return {width:s.width,height:s.height,background:s.backgroundColor,radius:s.borderRadius}; });
      assert.deepEqual(infoStyle, {width:'32px',height:'32px',background:'rgb(255, 255, 255)',radius:'50%'});
      assert.deepEqual(await page.locator('.manager-nav button').allTextContents(), originalMenu);
      assert.equal(await platformEntry.isHidden(), true);
      assert.match(page.url(), /\/dashboard\/manager\/platform\/\?lang=he$/);
      assert.equal(await page.locator('.manager-nav').isHidden(), true);
      assert.equal(await platformEntry.getAttribute('aria-current'), null);
      const tabs = page.locator('.manager-platform-tabs');
      assert.equal(await tabs.getByRole('button').count(), 3);
      assert.equal(await tabs.getByText('מנהלי ארגונים',{exact:true}).count(), 0);
      assert.equal(await tabs.locator('[aria-current="page"]').count(), 0);
      assert.equal(await page.locator('.manager-platform-home').getAttribute('aria-current'), 'page');
      assert.equal(await page.locator('.manager-platform-title').innerText(), 'ניהול פלטפורמה');
      assert.equal(await tabs.getByRole('button', {name:'סקירה',exact:true}).count(), 0);
      assert.equal(await page.getByText('תוכניות ועלויות משתמשי Manager',{exact:true}).count(), 0);
      await page.locator('.manager-overview-card').first().hover();
      assert.equal(await page.locator('.manager-overview-card').first().locator('strong').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
      await tabs.getByRole('button', {name:'מנהלי פלטפורמה',exact:true}).click();
      await page.locator('.manager-directory-row').last().waitFor();
      assert.equal(await tabs.locator('[aria-current="page"]').innerText(), 'מנהלי פלטפורמה');
      assert.equal(await tabs.locator('[aria-current="page"]').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(23, 27, 33)');
      assert.equal(await tabs.locator('[aria-current="page"]').evaluate(el => getComputedStyle(el).color), 'rgb(255, 255, 255)');
      assert.equal(await page.locator('.manager-platform-home').getAttribute('aria-current'), null);
      await page.locator('.manager-platform-home').focus();
      await page.keyboard.press('Enter');
      await page.locator('.manager-overview-card').last().waitFor();
      assert.equal(await tabs.locator('[aria-current="page"]').count(), 0);
      assert.equal(await page.locator('.manager-platform-home').getAttribute('aria-current'), 'page');
      await tabs.getByRole('button', {name:'מנהלי פלטפורמה',exact:true}).click();
      await page.locator('.manager-directory-row').last().waitFor();
      const createAdmin = page.getByRole('button', {name:'הוספת Manager admin',exact:true});
      assert.equal(await page.locator('.manager-view form').count(),0);
      const formBox = await createAdmin.boundingBox(), recordsBox = await page.locator('.manager-directory').boundingBox();
      assert.ok(formBox.y + formBox.height <= recordsBox.y, 'administrator creation button precedes records');
      await createAdmin.click();
      let grantDialog = page.getByRole('dialog',{name:'הוספת Manager admin',exact:true});
      await grantDialog.getByLabel('אימייל מנהל מאומת',{exact:true}).waitFor();
      await page.keyboard.press('Escape');
      assert.deepEqual(grants,[]);
      await createAdmin.click();
      grantDialog = page.getByRole('dialog',{name:'הוספת Manager admin',exact:true});
      await grantDialog.getByLabel('אימייל מנהל מאומת',{exact:true}).fill('new-admin@example.test');
      if (process.env.MANAGER_DIRECTORY_SCREENSHOTS)
        await page.screenshot({path:`${process.env.MANAGER_DIRECTORY_SCREENSHOTS}/manager-add-admin-${width}.png`,fullPage:true});
      await grantDialog.getByRole('button',{name:'הוספת Manager admin',exact:true}).click();
      // The isolated auth fixture has no auth_time, so exercise its normal step-up flow.
      await page.locator('#mfa-challenge input[name="code"]').fill('123456');
      await page.locator('#mfa-challenge button[type="submit"]').click();

      await grantDialog.waitFor({state:'hidden'});
      assert.deepEqual(grants,[{email:'new-admin@example.test',role:'admin',status:'active'}]);
      await page.locator('.manager-directory-row').last().waitFor();
      assert.deepEqual(await page.locator('.manager-nav button').allTextContents(), originalMenu);
      assert.equal(await platformEntry.isHidden(), true);
      await page.locator('.manager-workspace-back').click();
      await page.locator('.manager-nav').getByRole('button', {name:'הארגונים שלי',exact:true}).click();
      assert.equal(await page.locator('.manager-platform-header').isVisible(), false);
      await platformEntry.click();
      await page.locator('.manager-overview-card').last().waitFor();
      assert.equal(await page.locator(".platform-heading").isVisible(), false);
      assert.equal(await page.locator("#product-title").isVisible(), false);
      const switcher = page.locator("#product-switcher-button");
      assert.equal((await switcher.innerText()).trim(), "WIFIGATE Manager");
      assert.equal(
        await switcher.locator(".product-switcher__brand").isVisible(),
        true,
      );
      assert.equal(
        await switcher
          .locator(".product-switcher__name")
          .evaluate((el) => el.scrollWidth <= el.clientWidth),
        true,
      );
      await switcher.click();
      await page.locator("#product-switcher-list").waitFor();
      await page.keyboard.press("Escape");
      const reject = page.locator("[data-cookie-reject]");
      if (await reject.isVisible()) await reject.click();
      const panel = page.locator("#manager-profile-panel");
      assert.equal(await panel.isVisible(), false);
      assert.equal(await page.locator(".manager-identity").count(), 0);
      await page.locator("#manager-profile-button").click();
      await panel.getByText("Manager operator", { exact: true }).waitFor();
      await panel.getByText("operator@example.test", { exact: true }).waitFor();
      assert.equal(await panel.getByText("WIFIGATE Manager admin", {exact:true}).count(),0);
      assert.equal(await page.locator("#platform-sign-out").isEnabled(), true);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      if (process.env.MANAGER_DIRECTORY_SCREENSHOTS)
        await page.screenshot({
          path: `${process.env.MANAGER_DIRECTORY_SCREENSHOTS}/manager-profile-he-${width}.png`,
          fullPage: true,
        });
      await page.keyboard.press("Escape");
      assert.equal(await panel.isVisible(), false);
      if (process.env.MANAGER_DIRECTORY_SCREENSHOTS)
        await page.screenshot({
          path: `${process.env.MANAGER_DIRECTORY_SCREENSHOTS}/manager-header-he-${width}.png`,
          fullPage: true,
        });
      assert.deepEqual(fixture.errors, []);
    });
});

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
            body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"><link rel="stylesheet" href="/css/dashboard-header.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><header class="platform-header"><a class="brand"><img src="/assets/img/wifigate-horizontal-logo.webp" alt="WIFIGATE"></a><strong>WIFIGATE Manager</strong><div id="manager-profile" class="account-menu"></div></header><div class="portal-panel"><div id="root"></div></div></main></body></html>`,
          }),
        );
        await page.goto(origin + "/manager-directory-fixture");
        await page.evaluate(async (language) => {
          const { createManagerDashboard } =
            await import("/js/manager-dashboard.js");
          const { createManagerProfile } =
            await import("/js/manager-profile.js");
          window.profileMenu = createManagerProfile({
            root: document.querySelector("#manager-profile"),
            language,
          });
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
            if (path.startsWith("/admin/accounts?")) return { items: [], nextCursor: null };
            if (path === "/admin/accounts" && method === "POST") return {account:{email:body.email,status:body.status}};
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
            if (/^\/(admin\/)?organizations\/org-a$/.test(path)) return {organization:{id:'org-a',name:'Harbor Hotel',version:1,logoDataUrl:null},owner:{uid:'owner',email:'owner@example.test'},counts:{administrators:1+organizations[0].administrators.length,users:0,systems:3},permissions:{managePeople:true,manageLogo:true,openWorkspace:!path.startsWith('/admin')}};
            if (path.includes('/invitations?')) return {items:[],nextCursor:null};
            if (path.endsWith("/members?limit=100"))
              return {
                items: organizations[0].administrators.map((m) => ({
                  ...m,
                  role: "organization-admin",
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
              if (window.failOrganizationOnce) {
                window.failOrganizationOnce = false;
                throw new Error("NETWORK_ERROR");
              }
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
            if (path.startsWith("/organizations/org-a/systems?") || path.startsWith("/admin/organizations/org-a/systems?"))
              return { items: [], nextCursor: null };
            throw new Error("Unexpected request " + path);
          };
          window.mount = async (role) => {
            window.dashboard?.close();
            window.profileMenu.clear();
            window.mode = role;
            window.dashboard = createManagerDashboard({
              root: document.querySelector("#root"),
              user: { uid: "operator" },
              language,
              api,
              onProfile: (profile) => window.profileMenu.update(profile),
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
          .locator(".manager-platform-entry")
          .first()
          .click();
        await page
          .locator(".manager-overview-grid .manager-overview-card")
          .last()
          .waitFor();
        assert.equal(await page.locator(".manager-overview-card").count(), 3);
        assert.equal(await page.locator("button.manager-overview-card").count(), 3);
        const info = page.getByRole("button", {name: he ? "הסבר על הספירות" : "About these counts", exact:true});
        await info.click();
        const tooltip = page.getByRole("tooltip");
        await tooltip.waitFor();
        const tooltipBox = await tooltip.boundingBox();
        assert.ok(tooltipBox.x >= 15 && tooltipBox.x + tooltipBox.width <= width - 15);
        await page.keyboard.press("Escape");
        assert.equal(await tooltip.isVisible(), false);
        if (process.env.MANAGER_DIRECTORY_SCREENSHOTS)
          await page.screenshot({path:`${process.env.MANAGER_DIRECTORY_SCREENSHOTS}/manager-platform-overview-${language}-${width}.png`,fullPage:true});
        await page.locator("button.manager-overview-card").first().click();
        await page.locator(".manager-directory-row").last().waitFor();
        await page.locator(".manager-platform-home").click();
        await page.locator("button.manager-overview-card").last().waitFor();

        await page.locator('.manager-platform-tabs').getByRole('button',{name:he ? 'לקוחות' : 'Customers',exact:true}).click();
        const addCustomer = page.getByRole('button',{name:he ? 'הוספת לקוח' : 'Add customer',exact:true});
        await addCustomer.waitFor();
        assert.equal(await page.locator('.manager-view form').count(),0);
        assert.equal(await page.locator('.manager-action-panel').count(),0);
        await addCustomer.click();
        const customerDialog = page.getByRole('dialog',{name:he ? 'הוספת לקוח' : 'Add customer',exact:true});
        await customerDialog.getByLabel(he ? 'אימייל לקוח מאומת' : 'Verified customer email',{exact:true}).fill('customer@example.test');
        await page.keyboard.press('Escape');
        assert.equal(await page.evaluate(()=>window.calls.some(call=>call.path==='/admin/accounts' && call.method==='POST')),false);
        await addCustomer.click();
        await customerDialog.getByLabel(he ? 'אימייל לקוח מאומת' : 'Verified customer email',{exact:true}).fill('customer@example.test');
        if (process.env.MANAGER_DIRECTORY_SCREENSHOTS)
          await page.screenshot({path:`${process.env.MANAGER_DIRECTORY_SCREENSHOTS}/manager-add-customer-${language}-${width}.png`,fullPage:true});
        await customerDialog.getByRole('button',{name:he ? 'הוספת לקוח' : 'Add customer',exact:true}).click();
        await customerDialog.waitFor({state:'hidden'});
        await page.getByText(he ? 'חשבון הלקוח הופעל.' : 'Customer account enabled.',{exact:true}).waitFor();
        assert.deepEqual(await page.evaluate(()=>window.calls.filter(call=>call.path==='/admin/accounts' && call.method==='POST').map(call=>call.body)),[{email:'customer@example.test',status:'active'}]);
        await page.locator('.manager-platform-home').click();
        await page.locator('button.manager-overview-card').last().waitFor();

        const profileButton = page.locator("#manager-profile-button");
        const profilePanel = page.locator("#manager-profile-panel");
        assert.equal(await profilePanel.isVisible(), false);
        assert.equal(await nav.locator(".manager-identity").count(), 0);
        await page
          .getByRole("heading", {
            name: he ? "ניהול פלטפורמה" : "Platform management",
            exact: true,
          })
          .waitFor();
        await profileButton.click();
        assert.equal(await profileButton.getAttribute("aria-expanded"), "true");
        assert.equal(await profilePanel.locator(".dashboard-global-role").count(), 0, "product-only admin is not a global admin");
        await profilePanel
          .getByText("Manager operator", { exact: true })
          .waitFor();
        await page
          .locator("#manager-profile-email")
          .getByText("operator@example.test", { exact: true })
          .waitFor();
        assert.equal(await profilePanel.getByText("WIFIGATE Manager admin", {exact:true}).count(),0);
        await page.locator('.manager-platform-header > .manager-role-badge').getByText('WIFIGATE Manager admin',{exact:true}).waitFor();
        const panelBox = await profilePanel.boundingBox();
        assert(panelBox.x >= 16 && panelBox.x + panelBox.width <= width - 15);
        await page.keyboard.press("Escape");
        assert.equal(await profilePanel.isVisible(), false);
        assert.equal(
          await profileButton.evaluate((el) => el === document.activeElement),
          true,
        );
        await profileButton.click();
        await page.mouse.click(1, 1);
        assert.equal(await profilePanel.isVisible(), false);
        await page.locator('.manager-workspace-back').waitFor();
        await page.locator(".manager-platform-tabs")
          .getByRole("button", {
            name: he ? "ארגונים" : "Organizations",
            exact: true,
          })
          .click();
        await page.locator('[data-organization="org-b"]').waitFor();
        const first = page.locator('[data-organization="org-a"]');
        const createForm = page.getByRole('button', { name: he ? 'יצירת ארגון חדש' : 'Create new organization', exact: true });
        const formTop = await createForm.boundingBox(), listTop = await page.locator('.manager-org-columns').boundingBox();
        assert.ok(formTop.y + formTop.height <= listTop.y, 'new organization button precedes organization cards');
        assert.equal(
          await first.locator(".manager-org-count b").innerText(),
          "3",
        );
        await first.getByText("owner@example.test", { exact: true }).waitFor();
        assert.equal(await first.getByText("delegate@example.test", {exact:true}).count(),0);
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
        await first.getByRole('button',{name:he?'כניסה לארגון':'Open organization',exact:true}).click();
        await page.locator('.manager-organization-header h2').waitFor();
        assert.equal(await page.locator('.manager-platform-tabs [aria-current="page"]').innerText(), he ? 'ארגונים' : 'Organizations');
        await page.locator('[data-organization-disclosure="people"] > summary').click();
        await page.getByRole('button',{name:he?'הוספת מנהל':'Add admin',exact:true}).click();
        await page.getByRole('dialog').getByLabel(he?'כתובת אימייל':'Email address',{exact:true}).fill('new@example.test');
        await page.getByRole('dialog').getByRole('button',{name:he?'יצירת הזמנה':'Create invitation',exact:true}).click();
        await page.getByRole('dialog').waitFor({state:'hidden'});
        await page.getByRole('button',{name:he?'הסרת delegate@example.test':'Remove delegate@example.test',exact:true}).click();
        await page.getByRole('dialog').getByRole('button',{name:he?'אישור':'Confirm',exact:true}).click();
        await page
          .getByText("delegate@example.test", { exact: true })
          .waitFor({ state: "hidden" });
        await page.locator(".manager-platform-tabs")
          .getByRole("button", {
            name: he ? "ארגונים" : "Organizations",
            exact: true,
          })
          .click();
        await page
          .locator('[data-organization="org-b"]')
          .getByRole("button", {
            name: he ? "הסרת ארגון" : "Remove organization",
          })
          .click();
        await page.getByRole("dialog").getByRole("button", { name: he ? "אישור" : "Confirm", exact: true }).click();
        await page
          .locator('[data-organization="org-b"]')
          .waitFor({ state: "detached" });
        assert.equal(await page.getByLabel(he ? "שם ארגון חדש" : "New organization name", { exact: true }).count(), 0);
        await page.getByRole("button", { name: he ? "יצירת ארגון חדש" : "Create new organization", exact: true }).click();
        assert.match(await page.getByRole("dialog").innerText(), /\$1/);
        await page.keyboard.press("Escape");
        assert.equal(await page.getByRole("dialog").count(), 0);
        await page.getByRole("button", { name: he ? "יצירת ארגון חדש" : "Create new organization", exact: true }).click();
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
        if (process.env.MANAGER_DIRECTORY_SCREENSHOTS)
          await page.screenshot({ path: `${process.env.MANAGER_DIRECTORY_SCREENSHOTS}/manager-new-organization-${language}-${width}.png`, fullPage: true });
        await page.evaluate(() => { window.failOrganizationOnce = true; });
        await page.getByRole("dialog").getByRole("button", { name: he ? "יצירת ארגון" : "Create organization", exact: true }).click();
        await page.getByRole("dialog").getByRole("alert").waitFor();
        assert.equal(await page.getByLabel(he ? "שם ארגון חדש" : "New organization name", { exact: true }).inputValue(), "New organization");
        await page
          .getByRole("button", {
            name: he ? "יצירת ארגון" : "Create organization",
            exact: true,
          })
          .click();
        await page.locator('[data-organization="created"]').waitFor();
        const calls = await page.evaluate(() => window.calls);
        const creates = calls.filter(call => call.path === "/admin/organizations" && call.method === "POST");
        assert.equal(creates.length, 2);
        assert.equal(creates[0].body.requestId, creates[1].body.requestId, "retry preserves idempotency key");

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
        await profileButton.click();
        assert.equal(await profilePanel.locator('.manager-role-badge').count(),0);
        await nav.locator('.manager-sidebar-roles').getByText('WIFIGATE Manager organization admin',{exact:true}).waitFor();
        await page.keyboard.press("Escape");
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
            name: he ? "הארגונים שלי" : "My organizations",
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
              name: he ? "יצירת ארגון חדש" : "Create new organization",
              exact: true,
            })
            .count(),
          0,
        );
        assert.deepEqual(errors, []);
      });
});
