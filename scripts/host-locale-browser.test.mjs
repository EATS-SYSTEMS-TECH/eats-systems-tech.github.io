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
  t.after(() => new Promise((resolve) => server.close(resolve)));
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
      const organization={id:'fixture-org',name:'Properties',timezone:'UTC',membership:{role:'owner'}};
      profileApi.defaults.adapter=async config=>{
        const url=config.url;let data;
        if(url.startsWith('/api/v1/organizations?'))data={organizations:[organization],nextCursor:null};
        else if(url.includes('/properties?'))data={items:[{id:'property',name:'Calendar',timezone:'UTC'}],nextCursor:null};
        else if(url.includes('/rooms?'))data={items:[{id:'room',propertyId:'property',name:'Room',capacity:2}],nextCursor:null};
        else if(url.includes('/systems/icons'))data={icons:{}};
        else if(url.endsWith('/operations/preferences')){if(window.failOperations)throw Object.assign(new Error('simulated unavailable dependency'),{status:503});data={preferences:{locale:'en',alerts:{inApp:true,minimumSeverity:'info',events:[]},savedFilters:[]}};}
        else if(url.includes('/time-zone/resolve'))data={instant:JSON.parse(config.data).localTime+':00Z'};
        else if(url.includes('/reservations?')){const from=new URL(url,location.origin).searchParams.get('from');data={items:[{id:'reservation',propertyId:'property',roomId:'room',roomName:'Room',guest:{name:'Staff',phone:'+15555550123',email:'guest@example.test'},startsAt:new Date(Date.parse(from)+86400000).toISOString(),endsAt:new Date(Date.parse(from)+3*86400000).toISOString(),status:'confirmed',version:1,targetIds:[]}],nextCursor:null};}
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
    await page.locator(".reservation-chip").click();
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
    await page
      .getByRole("button", {
        name: language === "he" ? "סגירת ההזמנה" : "Close reservation",
        exact: true,
      })
      .click();
    await page.locator('button[data-view="Reservations"]').click();
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
    assert.equal(
      await page.locator(".reservation-chip strong").innerText(),
      "Staff",
    );
    await page.locator('button[data-view="Jobs Calendar"]').click();
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
      await page.locator("html").getAttribute("dir"),
      language === "he" ? "ltr" : "rtl",
    );
    assert.deepEqual(errors, []);
  }
});
