import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { startSite } from "./platform-test-fixtures.mjs";
import { arrivalLinks } from "../js/manager-access-note.js";

test("arrival links accept text addresses and valid zero coordinates without accepting arbitrary providers", () => {
  for (const note of [
    {},
    { address: "   " },
    { addressLatitude: 91, addressLongitude: 181 },
  ])
    assert.deepEqual(arrivalLinks(note), []);
  for (const note of [
    { address: "123 Example Avenue, Example City" },
    { address: 'https://untrusted.example/?a="<script>' },
    { address: "Safe fallback", addressLatitude: 91, addressLongitude: 0 },
  ]) {
    const links = arrivalLinks(note);
    assert.deepEqual(
      links.map((link) => new URL(link.href).hostname),
      ["www.google.com", "www.waze.com"],
    );
    assert.equal(
      new URL(links[0].href).searchParams.get("query"),
      note.address,
    );
    assert.equal(new URL(links[1].href).searchParams.get("q"), note.address);
  }
  const zero = arrivalLinks({
    address: "Ignored when coordinates are valid",
    addressLatitude: 0,
    addressLongitude: 0,
  });
  assert.equal(new URL(zero[0].href).searchParams.get("query"), "0,0");
  assert.equal(new URL(zero[1].href).searchParams.get("ll"), "0,0");
});

test("access note is readable in Hebrew and English on narrow and desktop screens, keeps zero details and does not contact map providers", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"])
    for (const width of [320, 390, 1440])
      await t.test(`${language} ${width}px`, async () => {
        const page = await browser.newPage({
          viewport: { width, height: 1000 },
        });
        t.after(() => page.close());
        const external = [];
        page.on("request", (request) => {
          if (new URL(request.url()).origin !== origin)
            external.push(request.url());
        });
        await page.route(origin + "/access-note-fixture", (route) =>
          route.fulfill({
            contentType: "text/html",
            body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta name="viewport" content="width=device-width"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><div id="root"></div></main></body></html>`,
          }),
        );
        await page.goto(origin + "/access-note-fixture");
        await page.evaluate(async (language) => {
          const { createManagerDialog } = await import("/js/manager-dialog.js");
          const { accessNoteContent } =
            await import("/js/manager-access-note.js");
          const dialogs = createManagerDialog({language});
          void dialogs.info({
            title:
              language === "he" ? "פרטי גישה · 72488" : "Access Note · 72488",
            content: accessNoteContent(
              {
                residentName: "Example Resident",
                note: "Have a good day ;)",
                address: "123 Example Avenue, Example City",
                floorNumber: "0",
                apartmentNumber: "0",
                parkingNumber: "0",
              },
              language,
            ),
          });
        }, language);
        const dialog = page.getByRole("dialog");
        await dialog.waitFor();
        assert.equal(
          await dialog
            .locator(".manager-access-metrics dd")
            .allTextContents()
            .then((values) => values.join(",")),
          "0,0,0",
        );
        assert.equal(await dialog.getByRole("link").count(), 2);
        for (const link of await dialog.getByRole("link").all()) {
          assert.equal(await link.getAttribute("target"), "_blank");
          assert.match(await link.getAttribute("rel"), /noopener/);
          const box = await link.boundingBox();
          assert.ok(box.height >= 44);
          assert.ok(box.x >= 0 && box.x + box.width <= width);
          await link.locator("img").evaluate((img) => img.decode());
        }
        assert.equal(
          await page.evaluate(
            () => document.documentElement.scrollWidth > innerWidth,
          ),
          false,
        );
        assert.deepEqual(external, []);
        if (process.env.WIFIGATE_MANAGER_UI_EVIDENCE) {
          await mkdir(process.env.WIFIGATE_MANAGER_UI_EVIDENCE, {
            recursive: true,
          });
          await page.screenshot({
            path: path.join(
              process.env.WIFIGATE_MANAGER_UI_EVIDENCE,
              `access-note-${language}-${width}.png`,
            ),
          });
        }
      });
});
