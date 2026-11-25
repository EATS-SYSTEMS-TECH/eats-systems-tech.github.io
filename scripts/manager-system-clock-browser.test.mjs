import test from "node:test";
import assert from "node:assert/strict";
import { startSite } from "./platform-test-fixtures.mjs";

// System clock card: the gate time in its time zone, the time zone, the state,
// and an update that moves the gate to the computer's time zone after asking.
test("the System clock card shows the gate clock and updates it from the computer", async t => {
  const { origin, browser } = await startSite(t);
  for (const language of ["he", "en"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
    try {
      await page.route(origin + "/clock", route => route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${language}" dir="${language === "he" ? "rtl" : "ltr"}"><head><meta charset="utf-8"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/manager-dashboard.css"></head><body class="platform-page" data-product="manager"><main class="platform-shell"><div id="root"></div></main></body></html>` }));
      await page.goto(origin + "/clock");
      const result = await page.evaluate(async language => {
        const { renderManagerSystemClock } = await import("/js/manager-system-clock.js");
        const sent = [];
        const base = Date.UTC(2026, 10, 25, 0, 30, 0) / 1000;
        const connection = {
          lastClock: null,
          async command(cmd, payload, timeout, options = {}) {
            sent.push([cmd, options.tz ?? null]);
            const tz = Number.isInteger(options.tz) ? options.tz : (this.lastClock?.tz ?? 120);
            this.lastClock = { set: true, utc: base, tz, receivedAtMs: Date.now() };
            return { data: {} };
          },
        };
        let asked = null;
        const card = renderManagerSystemClock({ root: document.querySelector("#root"), language, connection,
          confirm: async message => { asked = message; return true; }, computerOffset: () => 180 });
        await new Promise(r => setTimeout(r, 300));
        const read = () => [...card.querySelectorAll("dd")].map(dd => dd.textContent);
        const before = read();
        card.querySelector("button").click();
        await new Promise(r => setTimeout(r, 300));
        return { before, after: read(), sent, asked, status: card.querySelector("[role=status]").textContent, last: document.querySelector("#root").lastElementChild === card };
      }, language);
      const he = language === "he";
      assert.equal(result.last, true, "the card is last");
      assert.match(result.before[0], /25[./]11[./]2026/);
      assert.match(result.before[0], /02:30:0\d/, "gate local time = UTC + gate zone (UTC+02:00)");
      assert.equal(result.before[1], "UTC+02:00");
      assert.equal(result.before[2], he ? "מכוון" : "Set");
      assert.equal(result.before[3], "UTC+03:00");
      assert.ok(result.asked && result.asked.includes("UTC+03:00") && result.asked.includes("UTC+02:00"), "asks before changing the zone");
      assert.deepEqual(result.sent, [["ADMIN_PING", null], ["ADMIN_PING", 180]]);
      assert.equal(result.after[1], "UTC+03:00");
      assert.match(result.after[0], /03:30:0\d/);
      assert.equal(result.status, he ? "השעון בבקר עודכן לפי המחשב." : "The gate clock was updated from this computer.");
    } finally {
      await page.close();
    }
  }
});
