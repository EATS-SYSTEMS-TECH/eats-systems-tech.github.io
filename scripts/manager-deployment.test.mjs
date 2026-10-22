import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { startSite } from "./platform-test-fixtures.mjs";

test("Manager uses its dedicated deployment and preserves local API overrides", async (t) => {
  const { browser } = await startSite(t);
  const source = await readFile(new URL("../js/manager-api-config.js", import.meta.url), "utf8");
  const manager = "https://wifigate-manager-api-759449834452.us-central1.run.app";
  for (const [origin, localStaging, host, expected] of [
    ["https://wifigate.io", false, "https://api.wifigate.io", manager],
    ["https://www.wifigate.io", false, "https://api.wifigate.io", manager],
    ["http://localhost:8000", false, "http://127.0.0.1:8001", "http://127.0.0.1:8001"],
    ["http://127.0.0.1:8000", false, "http://127.0.0.1:8001", "http://127.0.0.1:8001"],
    ["http://127.0.0.1:8100", true, "http://127.0.0.1:8101", "http://127.0.0.1:8101"],
  ]) {
    const page = await browser.newPage();
    try {
      await page.route("**/*", (route) => {
        const pathname = new URL(route.request().url()).pathname;
        const body = pathname === "/js/manager-api-config.js" ? source
          : pathname === "/js/host-api-config.js" ? `export const hostApiBaseUrl=${JSON.stringify(host)};`
          : pathname === "/js/firebase-config.js" ? `export const isLocalStaging=${localStaging};`
          : "<!doctype html><html><body></body></html>";
        return route.fulfill({ contentType: pathname.endsWith(".js") ? "application/javascript" : "text/html", body });
      });
      await page.goto(origin + "/dashboard/manager/");
      assert.equal(await page.evaluate(async () => (await import("/js/manager-api-config.js")).managerApiBaseUrl), expected);
    } finally {
      await page.close();
    }
  }
});
