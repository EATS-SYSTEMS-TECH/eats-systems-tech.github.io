import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const source = await readFile(path.resolve("js/cookie-consent.js"), "utf8");
const declaration = /^const GA_MEASUREMENT_ID = "([^\"]*)";$/m;
const match = source.match(declaration);
if (!match || (match[1] && !/^G-[A-Z0-9]+$/.test(match[1]))) {
  throw new Error("Expected one empty or valid public GA measurement ID declaration");
}
export const configuredMeasurementId = match[1];
// Retain the existing isolated test ID only when collection is unconfigured.
// A real configured ID is tested as-is. Every external request is intercepted.
export const fixtureMeasurementId = configuredMeasurementId || "G-TEST12345";
const fixtureSource = source.replace(declaration, `const GA_MEASUREMENT_ID = "${fixtureMeasurementId}";`);
const sandbox = { window: {} };
vm.runInNewContext(await readFile(path.resolve("js/cookie-consent-copy.js"), "utf8"), sandbox);
const copy = sandbox.window.WIFIGATE_COOKIE_COPY.en;
const html = `<!doctype html><html lang="en"><head><title>private-title-sentinel</title></head><body>
<button data-cookie-settings>Cookie settings</button>
<script>window.WIFIGATE_COOKIE_COPY = ${JSON.stringify({ en: copy }).replace(/</g, "\\u003c")};</script>
<script src="/js/cookie-consent.js" defer></script></body></html>`;

export async function analyticsFixture(browser, {
  url = "https://wifigate.io/",
  consent,
  blockedStorage = false,
  useUnmodifiedSource = false,
  referrer,
  rawReferrer,
} = {}) {
  const context = await browser.newContext();
  const tagRequests = [];
  const blockedRequests = [];
  await context.route("**/*", (route) => {
    const request = route.request();
    const parsed = new URL(request.url());
    if (request.resourceType() === "document") return route.fulfill({ contentType: "text/html", body: html });
    if (parsed.pathname === "/js/cookie-consent.js") return route.fulfill({ contentType: "text/javascript", body: useUnmodifiedSource ? source : fixtureSource });
    if (parsed.origin === "https://www.googletagmanager.com" && parsed.pathname === "/gtag/js") {
      tagRequests.push(request.url());
      return route.fulfill({ contentType: "text/javascript", body: "" });
    }
    blockedRequests.push(request.url());
    return route.abort("blockedbyclient");
  });
  await context.addInitScript(({ consent, blockedStorage, rawReferrer }) => {
    if (rawReferrer !== undefined) Object.defineProperty(document, "referrer", { get: () => rawReferrer });
    if (consent !== undefined && !sessionStorage.getItem("analytics-fixture-seeded")) {
      localStorage.setItem("wifigate-cookie-consent-v1", typeof consent === "string" ? consent : JSON.stringify(consent));
      sessionStorage.setItem("analytics-fixture-seeded", "1");
    }
    if (blockedStorage) {
      for (const method of ["getItem", "setItem", "removeItem"]) {
        Storage.prototype[method] = () => { throw new DOMException("Blocked", "SecurityError"); };
      }
    }
  }, { consent, blockedStorage, rawReferrer });
  const page = await context.newPage();
  await page.goto(url, referrer ? { referer: referrer } : undefined);
  await page.waitForFunction(() => document.querySelector("[data-cookie-reject]"));
  return {
    context, page, tagRequests, blockedRequests,
    async snapshot() {
      return page.evaluate((id) => ({
        disabled: window[`ga-disable-${id}`],
        commands: (window.dataLayer || []).map((command) => Array.from(command)),
        scriptCount: document.querySelectorAll("script[src*='googletagmanager.com']").length,
      }), fixtureMeasurementId);
    },
  };
}
