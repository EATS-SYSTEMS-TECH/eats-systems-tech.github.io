import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

// Records written before the gate's clock was set live in its no-clock day
// file. Manager labels that file instead of showing its date as their day,
// the same way the app does.
test("the gate's no-clock day is labelled, not shown as a date", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    try {
      await page.route(origin + "/no-clock", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><div id="root"></div></main></body></html>` }));
      await page.goto(origin + "/no-clock");
      const result = await page.evaluate(async language => {
        const { renderManagerHistoryDays, renderManagerHistoryRecords } = await import("/js/manager-history-workspace.js");
        const root = document.querySelector("#root");
        const createButton = (label, action) => Object.assign(document.createElement("button"), { textContent: label, onclick: action });
        renderManagerHistoryDays(root, { days: [["20261125", 2], ["20261123", 5]], noClockDay: "20261123", language, createButton, onDay: () => {} });
        const days = [...root.querySelectorAll(".manager-history-day")].map(b => [b.dataset.historyDay, b.dataset.noClock ?? null, b.querySelector("strong").textContent, b.querySelector(".manager-history-day-label").textContent]);
        const records = document.createElement("div");
        renderManagerHistoryRecords(records, { rows: [], language, day: "20261123", noClock: true, backButton: createButton("back"), exportButton: createButton("export") });
        return { days, recordHeading: records.querySelector(".manager-history-header")?.textContent ?? records.textContent };
      }, language);
      const he = language === "he";
      assert.equal(result.days[0][1], null);
      assert.notEqual(result.days[0][2], he ? "לפני כיוון השעון" : "Before the clock was set");
      assert.deepEqual(result.days[1], ["20261123", "true", he ? "לפני כיוון השעון" : "Before the clock was set", he ? "ללא שעה" : "No time"]);
      assert.match(result.recordHeading, he ? /לפני כיוון השעון/ : /Before the clock was set/);
    } finally {
      await page.close();
    }
  }
});
