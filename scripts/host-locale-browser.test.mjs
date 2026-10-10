import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
test("selected Host language controls layout, translated forms and history while preserving record names and API values", async (t) => {
  const server = createServer(async (req, res) => {
    try {
      const file = path.resolve(
        root,
        "." + new URL(req.url, "http://localhost").pathname,
      );
      if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
      res.setHeader(
        "Content-Type",
        file.endsWith(".js")
          ? "application/javascript"
          : file.endsWith(".css")
            ? "text/css"
            : "application/octet-stream",
      );
      res.end(await readFile(file));
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => {
    server.closeAllConnections();
    return new Promise((resolve) => server.close(resolve));
  });
  const browser = await chromium.launch({
    channel: process.env.WIFIGATE_BROWSER_CHANNEL ?? "chrome",
    headless: true,
  });
  t.after(() => browser.close());
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const language of ["he", "en"]) {
    const page = await browser.newPage({
      locale: language === "he" ? "en-US" : "he-IL",
      viewport: { width: 1440, height: 1000 },
    });
    t.after(() => page.close());
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("**/dashboard/host/**", async (route) => {
      let html = await readFile(
        path.join(root, "dashboard/host/index.html"),
        "utf8",
      );
      html = html.replace(/<script[\s\S]*?<\/script>/g, "");
      html = html.replace(
        "</body>",
        `<script type="module">
      import {initializeHostLocale,installHostLanguageSelector} from '/js/host-locale.js';
      import '/js/host-dashboard-navigation.js';
      import {profileApi} from '/js/api/index.js';
      import {loadHostManagement} from '/js/host-management.js';
      initializeHostLocale();installHostLanguageSelector();
      document.querySelector('#host-sidebar').hidden=false;document.querySelector('#dashboard-content').hidden=false;document.querySelector('#access-panel').hidden=true;document.querySelector('#account-details').hidden=false;
      const organization={id:'fixture-org',name:'Properties',timezone:'UTC',membership:{role:'owner'},workspace:{service:{state:'legacy-active'}}};
      window.fixtureRequests=[];
      profileApi.defaults.adapter=async config=>{
        window.fixtureRequests.push(config.url);
        const url=config.url;let data;
        if(url.startsWith('/api/v1/organizations?'))data={organizations:[organization,{...organization,id:'fixture-org-2',name:'Second organization'}],nextCursor:null};
        else if(url.includes('/properties?'))data={items:[{id:'property',name:'Calendar',timezone:'UTC'}],nextCursor:null};
        else if(url.includes('/rooms?'))data={items:[{id:'room',propertyId:'property',name:'Room',capacity:2}],nextCursor:null};
        else if(url.includes('/systems/icons'))data={icons:{}};
        else if(url.endsWith('/operations/preferences')){if(window.failOperations)throw Object.assign(new Error('simulated unavailable dependency'),{status:503});data={preferences:{locale:'en',alerts:{inApp:true,minimumSeverity:'info',events:[]},savedFilters:[]}};}
        else if(url.includes('/operations/reliability?'))data={api:{observedRequests:3,serverFailures:0,availabilityPercent:100,p95LatencyMs:12},automation:{observedJobs:0,dueJobs:0,oldestDueMs:0},delivery:{acceptedReceipts:0}};
        else if(url.includes('/time-zone/resolve'))data={instant:JSON.parse(config.data).localTime+':00Z'};
        else if(url.includes('/reservations?')){const from=new URL(url,location.origin).searchParams.get('from');data={items:[{id:'reservation',propertyId:'property',roomId:'room',roomName:'Room',guest:{name:window.fixtureGuestRedacted?'Guest details deleted':'Staff',phone:window.fixtureGuestRedacted?'':'+15555550123',email:window.fixtureGuestRedacted?'':'guest@example.test'},guestRedactedAt:window.fixtureGuestRedacted?'2026-10-10T12:00:00.000Z':null,startsAt:new Date(Date.parse(from)+86400000).toISOString(),endsAt:new Date(Date.parse(from)+3*86400000).toISOString(),status:window.fixtureGuestRedacted?'cancelled':'confirmed',version:1,targetIds:[]}],nextCursor:null};}
        else data={items:[],nextCursor:null};
        return {status:200,statusText:'OK',headers:{},config,data};
      };
      await loadHostManagement({uid:'fixture-user',getIdToken:async()=>'isolated-test'},{role:'user'});
      </script></body>`,
      );
      await route.fulfill({ contentType: "text/html", body: html });
    });
    await page.goto(
      origin + "/dashboard/host/" + (language === "he" ? "?lang=he" : ""),
    );
    await page
      .locator(".reservation-chip")
      .waitFor({ timeout: 10000 })
      .catch(async (error) => {
        throw new Error(
          JSON.stringify({
            errors,
            body: await page.locator("body").innerText(),
          }),
          { cause: error },
        );
      });
    assert.equal(await page.locator("html").getAttribute("lang"), language);
    assert.equal(
      await page.locator("html").getAttribute("dir"),
      language === "he" ? "rtl" : "ltr",
    );
    assert.equal(
      await page.locator('button[data-view="Calendar"]').innerText(),
      language === "he" ? "לוח שנה" : "Calendar",
    );
    assert.equal(
      await page
        .locator("#workspace-org-switcher select option")
        .first()
        .innerText(),
      "Properties",
    );
    assert.equal(
      await page
        .locator(
          '.calendar-controls select[name="propertyId"] option[value="property"]',
        )
        .innerText(),
      "Calendar",
    );
    assert.equal(
      await page.locator(".reservation-chip strong").innerText(),
      "Staff",
    );
    const accessibleReservation = await page
      .locator(".reservation-chip")
      .getAttribute("aria-label");
    assert.ok(accessibleReservation.includes("Staff"));
    assert.ok(accessibleReservation.includes("Room"));
    assert.ok(
      accessibleReservation.includes(
        language === "he" ? "מאושרת" : "confirmed",
      ),
    );
    assert.ok(accessibleReservation.includes("UTC"));
    assert.doesNotMatch(accessibleReservation, /\d{4}-\d{2}-\d{2}T/);
    assert.equal(
      await page.locator(".reservation-chip").getAttribute("title"),
      accessibleReservation,
    );
    await page.locator(".reservation-chip").click();
    assert.deepEqual(
      await page.locator("dialog .reservation-form legend").allTextContents(),
      language === "he"
        ? ["פרטי קשר של האורח", "פרטי השהייה ומצב ההזמנה", "מערכות גישה"]
        : ["Guest contact", "Stay and booking status", "Access systems"],
    );
    await page
      .getByText(
        language === "he"
          ? "בחירת מערכת אינה מאשרת מסירת הודעה, ייבוא אורח או פתיחה פיזית של שער."
          : "Selecting a system does not confirm delivery, guest import or a physical gate opening.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await page
        .locator("dialog .reservation-optional-fields summary")
        .innerText(),
      language === "he"
        ? "פרטי אורח נוספים והערות"
        : "Optional guest details and notes",
    );
    assert.equal(
      await page
        .locator('dialog .reservation-form input[name="name"]')
        .inputValue(),
      "Staff",
    );
    assert.equal(
      await page
        .locator('dialog .reservation-form select[name="status"]')
        .inputValue(),
      "confirmed",
    );
    assert.equal(
      await page
        .locator(
          'dialog .reservation-form select[name="status"] option[value="confirmed"]',
        )
        .innerText(),
      language === "he" ? "מאושרת" : "confirmed",
    );
    for (const viewport of [
      { width: 1440, height: 1000 },
      { width: 390, height: 844 },
      { width: 320, height: 568 },
    ]) {
      await page.setViewportSize(viewport);
      await page
        .locator("dialog .reservation-optional-fields")
        .evaluate((element) => {
          element.open = true;
        });
      for (const end of [false, true]) {
        await page
          .locator(".reservation-editor-body")
          .evaluate((element, end) => {
            element.scrollTop = end ? element.scrollHeight : 0;
          }, end);
        const geometry = await page
          .locator(".reservation-editor-actions")
          .evaluate((element) => ({
            top: element.getBoundingClientRect().top,
            bottom: element.getBoundingClientRect().bottom,
            viewport: innerHeight,
            buttons: [...element.querySelectorAll("button")].map((button) => ({
              top: button.getBoundingClientRect().top,
              bottom: button.getBoundingClientRect().bottom,
              height: button.getBoundingClientRect().height,
            })),
            contentBottom: document
              .querySelector(".reservation-editor-body")
              .getBoundingClientRect().bottom,
          }));
        assert.ok(
          geometry.top >= 0 && geometry.bottom <= geometry.viewport + 1,
          `${language} drawer actions outside ${viewport.width}px viewport`,
        );
        assert.ok(
          geometry.contentBottom <= geometry.top + 1,
          "scrolling fields must not cover reservation actions",
        );
        assert.ok(
          geometry.buttons.every(
            (button) =>
              button.height >= 44 &&
              button.top >= 0 &&
              button.bottom <= geometry.viewport + 1,
          ),
          `save and close must remain usable at both scroll boundaries: ${language} ${JSON.stringify(viewport)} ${JSON.stringify(geometry)}`,
        );
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page
      .getByRole("button", {
        name: language === "he" ? "סגירת ההזמנה" : "Close reservation",
        exact: true,
      })
      .click();
    await page.locator('button[data-view="Reservations"]').click();
    await page
      .locator(".host-resource-list")
      .getByText(
        language === "he" ? "מצב ההזמנה: מאושרת" : "Booking: confirmed",
        { exact: true },
      )
      .waitFor();
    assert.doesNotMatch(
      await page.locator(".host-resource-list").innerText(),
      /\d{4}-\d{2}-\d{2}T/,
    );
    await page
      .locator("#workspace-org-switcher select")
      .selectOption("fixture-org-2");
    await page.waitForFunction(
      () =>
        document.querySelector("#host-management").dataset.organizationId ===
          "fixture-org-2" &&
        document.querySelector("#host-management").dataset.loading === "false",
    );
    assert.equal(new URL(page.url()).searchParams.get("org"), "fixture-org-2");
    await page.goBack();
    await page.waitForFunction(
      () =>
        document.querySelector("#host-management").dataset.organizationId ===
          "fixture-org" &&
        document.querySelector("#host-management").dataset.loading === "false",
    );
    assert.equal(new URL(page.url()).searchParams.get("view"), "reservations");
    await page.goForward();
    await page.waitForFunction(
      () =>
        document.querySelector("#host-management").dataset.organizationId ===
          "fixture-org-2" &&
        document.querySelector("#host-management").dataset.loading === "false",
    );
    await page.locator('button[data-view="Reservations"]').click();
    await page.reload();
    await page.locator('[data-host-section="Reservations"]').waitFor();
    assert.equal(
      await page.locator("#workspace-org-switcher select").inputValue(),
      "fixture-org-2",
    );
    await page
      .locator('[data-host-section="Reservations"]')
      .getByRole("button", { name: "Staff", exact: true })
      .click();
    await page.locator("dialog[open]").waitFor();
    await page.keyboard.press("Escape");
    await page.evaluate(async () => {
      window.failOperations = true;
      const { loadHostManagement } = await import("/js/host-management.js");
      await loadHostManagement(
        { uid: "fixture-user", getIdToken: async () => "isolated-test" },
        { role: "user" },
      );
    });
    await page.locator('button[data-view="Calendar"]').click();
    assert.equal(
      await page.locator(".reservation-chip strong").innerText(),
      "Staff",
    );
    await page.locator('button[data-view="Operations"]').click();
    await page
      .locator('[data-operations-screen="jobs"][data-loaded="true"]')
      .waitFor();
    assert.deepEqual(
      await page.locator(".workspace-tabs button").allTextContents(),
      language === "he"
        ? ["משימות גישה", "התרעות ופעילות", "אירועי אינטגרציה", "בריאות השירות"]
        : [
            "Access jobs",
            "Alerts and activity",
            "Integration events",
            "Service health",
          ],
    );
    await page
      .getByRole("button", {
        name: language === "he" ? "התרעות ופעילות" : "Alerts and activity",
        exact: true,
      })
      .click();
    await page
      .getByText(
        language === "he"
          ? "לא ניתן לטעון את המסך הזה. שאר הממשק והעבודה שלכם נשארים זמינים."
          : "This section could not be loaded. Your other work remains available.",
        { exact: true },
      )
      .waitFor();
    await page.evaluate(() => {
      window.failOperations = false;
    });
    await page
      .getByRole("button", {
        name:
          language === "he" ? "ניסיון נוסף לטעינת המסך" : "Retry this section",
        exact: true,
      })
      .click();
    await page
      .getByText(
        language === "he" ? "נתוני התפעול נטענו." : "Operations loaded.",
        { exact: true },
      )
      .waitFor();
    await page
      .locator("summary")
      .filter({
        hasText: language === "he" ? "תצורת מערכות" : "System configuration",
      })
      .click();
    await page
      .getByRole("button", {
        name:
          language === "he"
            ? "בדיקת תצורת מערכות"
            : "Check system configuration",
        exact: true,
      })
      .click();
    await page
      .getByText(
        language === "he"
          ? "תצורת המערכות נבדקה."
          : "System configuration checked.",
        { exact: true },
      )
      .waitFor();
    await page
      .locator("summary")
      .filter({
        hasText:
          language === "he" ? "מדידות תפעול" : "Operational observations",
      })
      .click();
    await page
      .getByRole("button", {
        name: language === "he" ? "מדידת השעה האחרונה" : "Measure last hour",
        exact: true,
      })
      .click();
    await page
      .getByText(
        language === "he"
          ? "מדידות התפעול נטענו."
          : "Operational observations loaded.",
        { exact: true },
      )
      .waitFor({ timeout: 10000 })
      .catch(async (error) => {
        throw new Error(
          JSON.stringify({
            errors,
            requests: await page.evaluate(() =>
              window.fixtureRequests.slice(-10),
            ),
            body: await page
              .locator('[data-operations-screen="review"]')
              .innerText(),
          }),
          { cause: error },
        );
      });
    for (const view of [
      "properties",
      "systems",
      "team",
      "automation",
      "integrations",
      "billing",
      "support",
      "organization",
    ]) {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page
        .locator(`#host-section-navigation [data-view-id="${view}"]`)
        .click();
      await page
        .locator(`[data-workspace-view="${view}"][data-loaded="true"]`)
        .waitFor();
      if (view === "organization") {
        const settings = await page
          .locator('[data-workspace-view="organization"]')
          .innerText();
        assert.ok(
          settings.includes(
            language === "he" ? "אזור זמן: UTC" : "Timezone: UTC",
          ),
        );
        assert.ok(
          settings.includes(
            language === "he"
              ? "התפקיד שלכם בארגון: בעלים"
              : "Your organization role: owner",
          ),
        );
        assert.ok(
          settings.includes(
            language === "he"
              ? "מצב השירות: פעיל ותיק"
              : "Service state: legacy-active",
          ),
        );
      }
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          `${language} ${view} overflows at ${width}px`,
        );
        if (process.env.WIFIGATE_SCREENSHOT_DIR && width !== 320) {
          await mkdir(process.env.WIFIGATE_SCREENSHOT_DIR, { recursive: true });
          await page.screenshot({
            path: path.join(
              process.env.WIFIGATE_SCREENSHOT_DIR,
              `host-${language}-${view}-${width}.png`,
            ),
            fullPage: true,
          });
        }
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('button[data-view="Calendar"]').click();
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        `${language} viewport ${width} overflow`,
      );
    }
    if (process.env.WIFIGATE_SCREENSHOT_DIR) {
      await mkdir(process.env.WIFIGATE_SCREENSHOT_DIR, { recursive: true });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({
        path: path.join(
          process.env.WIFIGATE_SCREENSHOT_DIR,
          `host-${language}.png`,
        ),
        fullPage: true,
      });
    }
    await page.evaluate(async () => {
      window.fixtureGuestRedacted = true;
      const { loadHostManagement } = await import("/js/host-management.js");
      await loadHostManagement(
        { uid: "fixture-user", getIdToken: async () => "isolated-test" },
        { role: "user" },
      );
    });
    const removedName =
      language === "he" ? "פרטי האורח נמחקו" : "Guest details removed";
    await page
      .locator(".reservation-chip strong")
      .getByText(removedName, { exact: true })
      .waitFor();
    assert.ok(
      (
        await page.locator(".reservation-chip").getAttribute("aria-label")
      ).startsWith(removedName),
    );
    await page.locator(".reservation-chip").click();
    assert.equal(
      await page
        .getByLabel(language === "he" ? "שם האורח" : "Guest name", {
          exact: true,
        })
        .inputValue(),
      removedName,
    );
    assert.equal(
      await page
        .locator('.reservation-editor-actions button[type="submit"]')
        .count(),
      0,
    );
    await page.keyboard.press("Escape");
    const menu = page.locator(".workspace-menu-toggle");
    if (await menu.isVisible()) await menu.click();
    await page.locator('button[data-view="Reservations"]').click();
    await page
      .locator("#host-language")
      .selectOption(language === "he" ? "en" : "he");
    await page.waitForURL((url) =>
      language === "he"
        ? !url.searchParams.has("lang")
        : url.searchParams.get("lang") === "he",
    );
    await page.locator('[data-host-section="Reservations"]').waitFor();
    assert.equal(new URL(page.url()).searchParams.get("view"), "reservations");
    assert.equal(
      await page.locator("#workspace-org-switcher select").inputValue(),
      "fixture-org-2",
      "language changes preserve the authorized organization",
    );
    assert.equal(
      await page.locator("html").getAttribute("dir"),
      language === "he" ? "ltr" : "rtl",
    );
    const unauthorized = new URL(page.url());
    unauthorized.searchParams.set("org", "foreign-organization");
    await page.goto(unauthorized.href);
    await page.locator('[data-host-section="Reservations"]').waitFor();
    assert.equal(new URL(page.url()).searchParams.get("org"), "fixture-org");
    assert.equal(
      await page.evaluate(() =>
        window.fixtureRequests.some((url) =>
          url.includes("/organizations/foreign-organization"),
        ),
      ),
      false,
      "URL preferences never authorize another tenant",
    );
    assert.deepEqual(errors, []);
  }
});
