import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";
import { managerCsvTemplate } from "../js/manager-csv.js";

async function openFixture(browser, origin, { language = "en", collection = "USERS", capacity = 20, unknownCapacity = false } = {}) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.route(origin + "/csv-fixture", (route) => route.fulfill({
    contentType: "text/html",
    body: '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body><button id="launcher">Import</button></body></html>',
  }));
  await page.goto(origin + "/csv-fixture");
  await page.evaluate(async (options) => {
    const { createManagerCsvDialog } = await import("/js/manager-csv-dialog.js");
    window.calls = [];
    window.commits = 0;
    window.aborts = 0;
    window.csvDialog = createManagerCsvDialog({ language: options.language });
    document.getElementById("launcher").onclick = () => {
      window.outcome = "pending";
      void window.csvDialog.open({
        ...options,
        systemName: "Hadar 6",
        async onImport({ collection, mode, rows, confirmCommit, onProgress }) {
          window.calls.push({ collection, mode, rows });
          onProgress(25, 100);
          await new Promise((resolve) => { window.releaseUpload = resolve; });
          onProgress(100, 100);
          const confirmed = await confirmCommit(window.validation ?? { accepted: rows.length, rejected: 0, valid: true });
          if (!confirmed) { window.aborts++; return { cancelled: true }; }
          window.commits++;
          if (window.failCommit) throw new Error("CONFLICT");
          return { revision: 2, accepted: rows.length };
        },
      }).then((value) => { window.outcome = value; });
    };
  }, { language, collection, ...(unknownCapacity ? {} : { capacity }) });
  await page.locator("#launcher").click();
  return page;
}

async function selectCsv(page, content = managerCsvTemplate()) {
  await page.getByLabel(/Choose CSV file|בחירת קובץ CSV/).setInputFiles({ name: "residents.csv", mimeType: "text/csv", buffer: Buffer.from(content) });
}

test("CSV popup explains and downloads its format, previews safely, then requires device validation and explicit commit for users and admins", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const [language, collection] of [["en", "USERS"], ["he", "ADMINS"]]) {
    const page = await openFixture(browser, origin, { language, collection });
    try {
      const dialog = page.getByRole("dialog");
      assert.equal(await dialog.getAttribute("dir"), language === "he" ? "rtl" : "ltr");
      assert.match(await dialog.locator("pre").innerText(), /^Name,Email,Country,Local,Floor,Apt,Parking\n/);
      assert.equal(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth && el.getBoundingClientRect().right <= innerWidth), true);
      const downloadPromise = page.waitForEvent("download");
      await dialog.getByRole("button", { name: language === "he" ? "הורדת קובץ לדוגמה" : "Download example CSV" }).click();
      const download = await downloadPromise;
      assert.equal(download.suggestedFilename(), `WIFIGATE-${collection.toLowerCase()}-example.csv`);
      assert.equal((await readFile(await download.path())).toString("utf8"), managerCsvTemplate());
      await selectCsv(page);
      await dialog.getByRole("heading", { name: /2 .*20/ }).waitFor();
      assert.equal(await page.evaluate(() => window.calls.length), 0);
      await dialog.getByRole("button", { name: /Validate and prepare import|בדיקה והכנה לייבוא/ }).click();
      await page.waitForFunction(() => window.calls.length === 1);
      assert.equal(await dialog.locator("progress").getAttribute("value"), "25");
      assert.equal(await page.evaluate(() => window.commits), 0);
      await page.evaluate(() => window.releaseUpload());
      const save = dialog.getByRole("button", { name: /Save to system|שמירה במערכת/ });
      await save.waitFor();
      assert.equal(await page.evaluate(() => window.commits), 0);
      await save.click();
      await dialog.getByRole("heading", { name: /Import completed|הייבוא הושלם בהצלחה/ }).waitFor();
      assert.equal(await page.evaluate(() => window.commits), 1);
      assert.equal(await page.evaluate(() => window.calls[0].collection), collection);
      assert.equal(await page.evaluate(() => window.outcome), "pending");
      await dialog.getByRole("button", { name: /Close|סגירה/, exact: true }).click();
      await page.waitForFunction(() => window.outcome?.revision === 2);
      assert.equal(await page.locator("#launcher").evaluate((el) => el === document.activeElement), true);
    } finally { await page.close(); }
  }
});

test("CSV popup rejects duplicate phones, excess capacity and invalid formats before staging; data never becomes markup", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await openFixture(browser, origin, { capacity: 1 });
  t.after(() => page.close());
  const header = "Name,Email,Country,Local,Floor,Apt,Parking\n";
  for (const [content, message] of [
    [managerCsvTemplate(), /more records/],
    [header + "Dana,dana@example.com,972,501234567,0,0,0\nDana,dana@example.com,972,501234567,0,0,0", /Row 3: A phone number/],
    ["invalid header\nno", /CSV is invalid/],
  ]) {
    await selectCsv(page, content);
    await page.getByRole("alert").filter({ hasText: message }).waitFor();
    assert.equal(await page.getByRole("button", { name: "Validate and prepare import" }).isDisabled(), true);
  }
  await selectCsv(page, header + "<img src=x>,dana@example.com,972,501234567,0,0,0");
  await page.getByRole("cell", { name: "<img src=x>", exact: true }).waitFor();
  assert.equal(await page.locator("dialog img").count(), 0);
  assert.equal(await page.evaluate(() => window.calls.length), 0);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.outcome?.cancelled === true);
});

test("CSV popup cancels staged imports before commit and shows replace warnings and conflicts without reporting success", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await openFixture(browser, origin, { collection: "ADMINS" });
  t.after(() => page.close());
  const dialog = page.getByRole("dialog");
  await selectCsv(page);
  await dialog.getByLabel("Import mode").selectOption("REPLACE");
  assert.match(await dialog.locator(".manager-csv-warning").innerText(), /Replace removes every existing record.*active administrator/);
  const start = dialog.getByRole("button", { name: "Validate and prepare import" });
  await start.click();
  await page.waitForFunction(() => window.calls.length === 1);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.evaluate(() => window.releaseUpload());
  await page.waitForFunction(() => window.outcome?.cancelled === true);
  assert.equal(await page.evaluate(() => window.commits), 0);
  assert.equal(await page.evaluate(() => window.aborts), 1);
  await page.locator("#launcher").click();
  await selectCsv(page);
  await start.click();
  await page.waitForFunction(() => window.calls.length === 2);
  await page.evaluate(() => { window.failCommit = true; window.releaseUpload(); });
  await dialog.getByRole("button", { name: "Save to system" }).click();
  await dialog.getByRole("alert").filter({ hasText: /system data changed/ }).waitFor();
  assert.equal(await dialog.getByRole("heading", { name: "Import completed" }).count(), 0);
  assert.equal(await start.isEnabled(), true);
  await page.evaluate(() => window.csvDialog.cancel());
  await page.waitForFunction(() => window.outcome?.cancelled === true);
});

test("CSV popup leaves unknown capacity to the system and external navigation prevents late commit callbacks", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await openFixture(browser, origin, { unknownCapacity: true });
  t.after(() => page.close());
  await selectCsv(page);
  await page.getByText("The system will check capacity before saving can be confirmed.", { exact: true }).waitFor();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Validate and prepare import" }).click();
  await page.waitForFunction(() => window.calls.length === 1);
  await page.evaluate(() => window.csvDialog.cancel());
  await page.waitForFunction(() => window.outcome?.cancelled === true);
  await page.evaluate(() => window.releaseUpload());
  await page.waitForFunction(() => window.aborts === 1);
  assert.equal(await page.evaluate(() => window.commits), 0);
  assert.equal(await dialog.count(), 0);

  await page.locator("#launcher").click();
  await selectCsv(page);
  await dialog.getByRole("button", { name: "Validate and prepare import" }).click();
  await page.waitForFunction(() => window.calls.length === 2);
  await page.evaluate(() => window.releaseUpload());
  await dialog.getByRole("button", { name: "Save to system" }).waitFor();
  await page.evaluate(() => window.csvDialog.cancel());
  await page.waitForFunction(() => window.aborts === 2);
  assert.equal(await page.evaluate(() => window.commits), 0);
});

test("CSV popup never offers commit when system validation count or validity is inconsistent", async (t) => {
  const { origin, browser } = await startSite(t);
  const page = await openFixture(browser, origin);
  t.after(() => page.close());
  await selectCsv(page);
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Validate and prepare import" }).click();
  await page.waitForFunction(() => window.calls.length === 1);
  await page.evaluate(() => { window.validation = { accepted: 1, rejected: 0, valid: true }; window.releaseUpload(); });
  await dialog.getByRole("alert").filter({ hasText: /system rejected the import/ }).waitFor();
  assert.equal(await dialog.getByRole("button", { name: "Save to system" }).isVisible(), false);
  assert.equal(await page.evaluate(() => window.commits), 0);
  await page.evaluate(() => window.csvDialog.cancel());
});
