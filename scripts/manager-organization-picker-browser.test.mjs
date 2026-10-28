import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

async function fixture(t, browser, origin, language, width, height = 900) {
  const page = await browser.newPage({ viewport: { width, height } });
  t.after(() => page.close());
  page.setDefaultTimeout(5000);
  await page.route(origin + "/picker-fixture", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html dir="${language === "he" ? "rtl" : "ltr"}" lang="${language}"><head><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><div class="manager-shell"><nav class="manager-nav" style="width:240px;box-sizing:border-box;margin:24px"><div id="root"></div><button id="outside" style="position:fixed;bottom:0;left:0;width:100px">Outside</button></nav></div></body></html>`,
    }),
  );
  await page.goto(origin + "/picker-fixture");
  await page.evaluate(async (language) => {
    const { createManagerOrganizationPicker } =
      await import("/js/manager-organization-picker.js");
    window.selections = [];
    window.picker = createManagerOrganizationPicker({
      language,
      selectedId: "home",
      organizations: [
        {
          id: "home",
          name: language === "he" ? "קהילת החוף" : "Harbor Community",
          role: "owner",
          example: true,
          logoAsset: "/assets/img/manager/example-organization-logo.png",
        },
        {
          id: "office",
          name: "WIFIGATE Office",
          role: "organization-admin",
          logoDataUrl: "https://invalid.example/logo.png",
        },
        {
          id: "long",
          name: "WIFIGATE Residential Community " + "Long name ".repeat(12),
          role: "organization-user",
        },
      ],
      onSelect: async (id) => {
        window.selections.push(id);
      },
    });
    document.querySelector("#root").append(window.picker.root);
  }, language);
  return page;
}

test("organization picker supports search, current identity and viewport-bounded RTL/LTR", async (t) => {
  const { browser, origin } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [320, 390, 1440])
      await t.test(`${language} ${width}`, async () => {
        const page = await fixture(t, browser, origin, language, width);
        const trigger = page.getByRole("button", {
          name: language === "he" ? "בחירת ארגון" : "Choose organization",
          exact: true,
        });
        assert.equal(await trigger.locator("img").count(), 1);
        await trigger.click();
        const panel = page.getByRole("dialog");
        const search = panel.getByRole("searchbox");
        assert.equal(
          await search.evaluate((el) => el === document.activeElement),
          true,
        );
        assert.equal(await panel.locator('[aria-current="true"]').count(), 1);
        assert.equal(await panel.locator('img[src^="https:"]').count(), 0);
        const box = await panel.boundingBox();
        assert.ok(box.x >= 15 && box.x + box.width <= width - 15);
        assert.ok(box.y >= 15 && box.y + box.height <= 885);
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        await search.fill("no-match");
        assert.equal(
          await panel.locator(".manager-organization-picker-empty").isVisible(),
          true,
        );
        await search.fill("office");
        assert.equal(
          await panel.locator(".manager-organization-option:visible").count(),
          1,
        );
        await panel.locator('[data-organization-id="office"]').click();
        assert.deepEqual(await page.evaluate(() => window.selections), [
          "office",
        ]);
        assert.equal(await trigger.getAttribute("aria-expanded"), "false");
        await trigger.click();
        assert.equal(await search.inputValue(), "");
        if (process.env.MANAGER_PICKER_SCREENSHOTS) {
          await mkdir(process.env.MANAGER_PICKER_SCREENSHOTS, {
            recursive: true,
          });
          await page.screenshot({
            path: `${process.env.MANAGER_PICKER_SCREENSHOTS}/picker-${language}-${width}.png`,
          });
        }
        await page.keyboard.press("Escape");
        assert.equal(
          await trigger.evaluate((el) => el === document.activeElement),
          true,
        );
        await trigger.click();
        await page.locator("#outside").click();
        assert.equal(await panel.isVisible(), false);
      });
});

test("organization picker arrows, Home/End, Tab and disposal preserve keyboard focus", async (t) => {
  const { browser, origin } = await startSite(t);
  const page = await fixture(t, browser, origin, "en", 390);
  const trigger = page.getByRole("button", {
    name: "Choose organization",
    exact: true,
  });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.organizationId),
    "home",
  );
  await page.keyboard.press("End");
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.organizationId),
    "long",
  );
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  assert.deepEqual(
    await page.evaluate(() => window.selections),
    [],
    "current organization does not issue another navigation",
  );
  assert.equal(
    await trigger.evaluate((el) => el === document.activeElement),
    true,
  );
  await trigger.click();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.dataset.organizationId),
    "home",
  );
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await trigger.click();
  await page.evaluate(() => window.picker.destroy());
  assert.equal(
    await page.locator(".manager-organization-picker-panel").count(),
    0,
  );
  await page.keyboard.press("Escape");
});

test("organization picker flips above a low anchor and clamps its scrollable results", async (t) => {
  const { browser, origin } = await startSite(t);
  const page = await fixture(t, browser, origin, "he", 390, 380);
  await page.locator(".manager-nav").evaluate((el) => {
    el.style.cssText =
      "position:fixed;bottom:0;top:auto;width:240px;padding:12px;";
  });
  await page.getByRole("button", { name: "בחירת ארגון", exact: true }).click();
  const box = await page.getByRole("dialog").boundingBox();
  assert.ok(box.y >= 15 && box.y + box.height <= 365);
  assert.equal(
    await page
      .locator('.manager-organization-option[data-organization-id="home"]')
      .isVisible(),
    true,
  );
});
