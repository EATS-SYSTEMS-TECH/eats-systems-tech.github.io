import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { startSite, scenario } from "./platform-test-fixtures.mjs";
import { parseManagerCsv } from "../js/manager-csv.js";

test("Manager personal navigation and complete sample workspaces never request real gate access", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [390, 1440])
      await t.test(`${language} ${width}px`, async (t) => {
        const he = language === "he",
          fixture = await scenario(browser, {
            manager: "active",
            enrolled: true,
            verified: true,
            viewport: { width, height: 1000 },
          });
        t.after(() => fixture.context.close());
        const { page, context } = fixture,
          calls = [];
        let sockets = 0;
        page.setDefaultTimeout(6000);
        page.on("websocket", () => sockets++);
        await context.route("**/api/v1/manager/**", (route) => {
          const url = new URL(route.request().url());
          calls.push({ path: url.pathname, method: route.request().method() });
          return route.fulfill({
            json: url.pathname.endsWith("/me")
              ? {
                  user: {
                    name: "Example operator",
                    email: "operator@example.test",
                  },
                  role: "admin",
                  roles: ["admin"],
                  account: null,
                  organizations: [],
                }
              : { items: [], nextCursor: null },
          });
        });
        await page.goto(
          origin + "/dashboard/manager/" + (he ? "?lang=he" : ""),
        );
        const nav = page.locator(".manager-nav"),
          mySystems = nav.getByRole("button", {
            name: he ? "המערכות שלי" : "My systems",
            exact: true,
          }),
          myOrgs = nav.getByRole("button", {
            name: he ? "הארגונים שלי" : "My organizations",
            exact: true,
          });
        await page.locator(".dashboard-examples > summary").waitFor();
        assert.equal(await page.locator(".manager-hero, .manager-metrics, .manager-workspace-head").count(), 0);
        await page.getByRole("heading", { name: he ? "אין מערכות להצגה כרגע." : "No systems to display yet.", exact: true }).waitFor();

        assert.equal(await page.locator(".dashboard-examples").getAttribute("open"), null);
        assert.equal(await page.locator(".dashboard-examples").evaluate(el => el.parentElement.firstElementChild === el), true);
        if (process.env.MANAGER_EXAMPLE_SCREENSHOTS)
          await page.screenshot({ path: `${process.env.MANAGER_EXAMPLE_SCREENSHOTS}/manager-examples-dropdown-${language}-${width}.png`, fullPage: true });
        await page.locator(".dashboard-examples > summary").click();
        await page.locator("[data-example-system]").last().waitFor();
        const reject = page.locator("[data-cookie-reject]");
        if (await reject.isVisible()) await reject.click();
        assert.equal(await mySystems.getAttribute("aria-current"), "page");
        const names = await nav.getByRole("button").allTextContents();
        assert.deepEqual(
          names.slice(0, 2),
          he
            ? ["המערכות שלי", "הארגונים שלי"]
            : ["My systems", "My organizations"],
        );
        assert.match(
          names.at(-1),
          he ? /ניהול פלטפורמה/ : /Platform management/,
        );
        assert.equal(await page.locator("[data-example-system]").count(), 3);
        const icons = page.locator("[data-example-system] .manager-icon img");
        assert.deepEqual(await icons.evaluateAll(images => images.map(image => image.getAttribute("src"))), [
          "/assets/host-icons/gate-barrier-gate-small.svg",
          "/assets/host-icons/dual-control-garage-small.svg",
          "/assets/host-icons/group-folder.svg",
        ]);
        await icons.evaluateAll(images => Promise.all(images.map(image => image.decode())));

        await page.evaluate(() => document.fonts.ready);
        for (const layoutWidth of [320, 1024, 1440]) {
          await page.setViewportSize({width: layoutWidth, height:1000});
          const cards = await page.locator('.manager-example-grid > [data-example-system]').evaluateAll(elements => elements.map(card => ({
            top: card.getBoundingClientRect().top,
            height: card.getBoundingClientRect().height,
            tracks: [...card.children].map(child => child.getBoundingClientRect().top),
            facts: [...card.querySelectorAll('.manager-facts > *')].map(child => child.getBoundingClientRect().top),
          })));
          for (const card of cards) for (const other of cards.filter(other => Math.abs(other.top - card.top) < 1)) {
            assert.ok(Math.abs(card.height - other.height) < 1, 'neighboring example cards have equal height');
            card.tracks.forEach((y,i) => assert.ok(Math.abs(y - other.tracks[i]) < 1, `example content track ${i} aligns at ${layoutWidth}px`));
            card.facts.forEach((y,i) => assert.ok(Math.abs(y - other.facts[i]) < 1, `example fact ${i} aligns at ${layoutWidth}px`));
          }
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),false);
          if (process.env.MANAGER_EXAMPLE_SCREENSHOTS && width === 1440) await page.screenshot({path:`${process.env.MANAGER_EXAMPLE_SCREENSHOTS}/aligned-example-cards-${language}-${layoutWidth}.png`,fullPage:true});
        }
        await page.setViewportSize({width,height:1000});
        assert.deepEqual(
          calls.map((c) => c.path),
          ["/api/v1/manager/me"],
        );
        await page
          .locator('[data-example-system="example-manager-gate"]')
          .getByRole("button")
          .click();
        const workspace = page.locator(".manager-example-workspace"),
          content = workspace.locator(".manager-example-content"),
          status = workspace.locator(".manager-status");
        const tab = async (key) => {
          await workspace.locator(`[data-example-tab="${key}"]`).click();
          const order = await content.evaluate(root => {
            const panel = root.querySelector(':scope > .manager-action-panel');
            const records = [...root.children].filter(child => child.matches('.manager-table-wrap, .manager-facts, .manager-example-metrics, .manager-example-week'));
            return {unplaced: [...root.children].some(child => child.matches('form,input,label,button,.manager-actions')), aligned: !panel || records.every(child => panel.getBoundingClientRect().bottom <= child.getBoundingClientRect().top)};
          });
          assert.equal(order.unplaced, false, `all ${key} controls are above results`);
          assert.equal(order.aligned, true, `${key} actions precede data`);
        };
        await content.getByText("30/5000", { exact: true }).waitFor();
        await content.getByText("1/20", { exact: true }).waitFor();
        assert.equal(await workspace.locator("[data-example-tab]").count(), 10);
        if (process.env.MANAGER_EXAMPLE_SCREENSHOTS)
          await page.screenshot({
            path: `${process.env.MANAGER_EXAMPLE_SCREENSHOTS}/manager-example-overview-${language}-${width}.png`,
            fullPage: true,
          });
        page.once("dialog", (d) => d.accept());
        await content
          .getByRole("button", {
            name: he ? "הדמיית פתיחה" : "Simulate opening",
            exact: true,
          })
          .click();
        assert.match(
          await status.innerText(),
          he ? /לא הופעל ממסר/ : /No physical relay/,
        );
        await tab("settings");
        await content
          .getByLabel(he ? "פולס ראשון (מילישניות)" : "First pulse (ms)", {
            exact: true,
          })
          .fill("1200");
        await content
          .getByRole("button", {
            name: he ? "שמירת הגדרות בדוגמה" : "Save example settings",
            exact: true,
          })
          .click();
        assert.equal(
          await content
            .getByLabel(he ? "פולס ראשון (מילישניות)" : "First pulse (ms)", {
              exact: true,
            })
            .inputValue(),
          "1200",
        );
        await tab("users");
        await content.getByRole("searchbox").fill("Demo resident 30");
        assert.equal(await content.locator("tbody tr").count(), 1);
        await content.getByRole("searchbox").fill("");
        const exported = page.waitForEvent("download");
        await content
          .getByRole("button", {
            name: he ? "ייצוא CSV לדוגמה" : "Export sample CSV",
            exact: true,
          })
          .click();
        const download = await exported;
        assert.equal(
          parseManagerCsv(await readFile(await download.path(), "utf8")).length,
          30,
        );
        page.once("dialog", (d) => d.accept());
        await content
          .getByLabel(he ? "ייבוא CSV לדוגמה" : "Import sample CSV", {
            exact: true,
          })
          .setInputFiles({
            name: "example.csv",
            mimeType: "text/csv",
            buffer: Buffer.from(
              "Name,Email,Country,Local,Floor,Apt,Parking\nDemo added,added@example.test,972,509999999,0,0,0",
            ),
          });
        await content.getByRole("heading", { name: /31\/5000/ }).waitFor();
        await tab("admins");
        await content
          .getByRole("button", {
            name: he ? "מחיקה בהדגמה" : "Delete in example",
            exact: true,
          })
          .click();
        assert.match(await status.innerText(), he ? /האצלת/ : /delegation/);
        await tab("guests");
        await content.getByText("Demo technician", { exact: true }).waitFor();
        await tab("auto");
        assert.equal(await content.locator("tbody tr").count(), 10);
        await content
          .getByRole("button", {
            name: he ? "מפתחות נוספים" : "More keys",
            exact: true,
          })
          .click();
        assert.equal(await content.locator("tbody tr").count(), 10);
        await tab("events");
        assert.equal(
          await content.locator(".manager-example-week > section").count(),
          7,
        );
        await tab("history");
        assert((await content.locator("tbody tr").count()) >= 3);
        await tab("rf");
        for (const name of he
          ? [
              "פתיחת חלון לימוד לדוגמה",
              "הדמיית לחיצה ליד השער",
              "שמירת שלט בדוגמה",
            ]
          : [
              "Start example learning",
              "Simulate nearby remote press",
              "Save sample remote",
            ])
          await content.getByRole("button", { name, exact: true }).click();
        await tab("system");
        assert.equal(
          await content
            .getByRole("button", { name: "Factory reset", exact: true })
            .isDisabled(),
          true,
        );
        await content
          .getByRole("button", {
            name: he ? "התחלת עדכון מדומה" : "Start simulated update",
            exact: true,
          })
          .click();
        for (let i = 0; i < 4; i++)
          await content
            .getByRole("button", {
              name: he ? "המשך העברה מדומה" : "Advance simulated transfer",
              exact: true,
            })
            .click();
        assert.equal(
          await content.getByRole("progressbar").getAttribute("value"),
          "100",
        );
        page.once("dialog", (d) => d.accept());
        await content
          .getByRole("button", {
            name: he
              ? "הדמיית התקנה ואישור"
              : "Simulate install and confirmation",
            exact: true,
          })
          .click();
        await content.getByText("confirmed", { exact: true }).waitFor();
        await workspace
          .getByRole("button", {
            name: he ? "הדמיית ניתוק / חיבור" : "Simulate offline / online",
            exact: true,
          })
          .click();
        assert.equal(await content.locator("table,form,progress").count(), 0);
        assert.match(
          await content.innerText(),
          he ? /אין תקשורת/ : /No communication/,
        );
        await workspace
          .getByRole("button", {
            name: he ? "הדמיית ניתוק / חיבור" : "Simulate offline / online",
            exact: true,
          })
          .click();
        assert.deepEqual(
          calls.map((c) => c.path),
          ["/api/v1/manager/me"],
        );
        assert.equal(sockets, 0);
        await mySystems.click();
        await page.locator(".dashboard-examples > summary").click();
        await page
          .locator('[data-example-system="example-manager-dual"]')
          .getByRole("button")
          .click();
        assert.equal(
          await workspace
            .getByLabel(he ? "בחירת שער" : "Choose gate", { exact: true })
            .locator("option")
            .count(),
          2,
        );
        await workspace
          .getByLabel(he ? "בחירת שער" : "Choose gate", { exact: true })
          .selectOption("DEMO-24981");
        await content.getByText("438/1000", { exact: true }).waitFor();
        await myOrgs.click();
        await page.getByRole('heading', {name:he ? 'אין ארגונים להצגה כרגע.' : 'No organizations to display yet.',exact:true}).waitFor();
        await page.getByText(he ? 'הארגונים המשויכים לחשבון שלכם יופיעו כאן.' : 'Organizations linked to your account will appear here.',{exact:true}).waitFor();
        assert.equal(await page.locator('.manager-empty-organizations img, .manager-empty-organizations svg').count(),0);
        await page.getByRole('button',{name:he ? 'יצירת ארגון חדש' : 'Create new organization',exact:true}).click();
        await page.getByRole('dialog').getByLabel(he ? 'אימייל בעל הארגון · Manager user' : 'Organization owner email · Manager user',{exact:true}).waitFor();
        await page.keyboard.press('Escape');
        assert.equal(calls.some(call=>call.method==='POST'),false,'opening or cancelling organization creation performs no write');

        if (process.env.MANAGER_EXAMPLE_SCREENSHOTS)
          await page.screenshot({path:`${process.env.MANAGER_EXAMPLE_SCREENSHOTS}/empty-organizations-${language}-${width}.png`,fullPage:true});

        await page.locator(".dashboard-examples > summary").click();
        await page
          .locator("[data-example-organization]")
          .getByRole("button")
          .click();
        assert.equal(
          await workspace.locator("[data-example-system]").count(),
          3,
        );
        await workspace
          .getByRole("tab", {
            name: he ? "פעולות מרובות" : "Bulk operations",
            exact: true,
          })
          .click();
        await workspace
          .getByText(
            he
              ? "4 שערים פיזיים ייחודיים נבחרו"
              : "4 unique physical gates selected",
            { exact: true },
          )
          .waitFor();
        page.once("dialog", (d) => d.accept());
        await workspace
          .getByRole("button", {
            name: he
              ? "הפעלת הדגמה על השערים שנבחרו"
              : "Run example on selected gates",
            exact: true,
          })
          .click();
        assert.equal(await workspace.locator("tbody tr").count(), 4);
        assert.deepEqual(
          calls.map((c) => c.path),
          ["/api/v1/manager/me", "/api/v1/manager/organizations"],
        );
        assert.equal(sockets, 0);
        assert.deepEqual(fixture.errors, []);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          true,
        );
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
