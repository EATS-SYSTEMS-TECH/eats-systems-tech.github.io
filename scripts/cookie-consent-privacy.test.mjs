import assert from "node:assert/strict";
import { after, test } from "node:test";
import { chromium } from "playwright-core";
import { analyticsFixture, configuredMeasurementId, fixtureMeasurementId } from "./analytics-test-fixture.mjs";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { AUTO_OPEN_PAGE_KEY } from "./auto-open-page.mjs";

const browser = await chromium.launch({ channel: "chrome", headless: true });
after(() => browser.close());
const accepted = () => ({ version: 1, analytics: true, savedAt: Date.now() });
const events = (snapshot) => snapshot.commands.filter(([command]) => command === "event");
const locales = SITE_LANGUAGES.map(({ code }) => code.toLowerCase());

test("unmodified production source follows the actual configured activation state", async () => {
  const fixture = await analyticsFixture(browser, { useUnmodifiedSource: true });
  try {
    await fixture.page.locator("[data-cookie-accept]").click();
    assert.equal(fixture.tagRequests.length, configuredMeasurementId ? 1 : 0);
    if (configuredMeasurementId) await fixture.page.waitForFunction(() => window.dataLayer?.some((command) => command[0] === "event"));
    assert.equal(events(await fixture.snapshot()).length, configuredMeasurementId ? 1 : 0);
  } finally { await fixture.context.close(); }
});

test("fresh and rejected preferences load no tag or events", async () => {
  const fixture = await analyticsFixture(browser);
  try {
    assert.equal(fixture.tagRequests.length, 0);
    assert.equal((await fixture.snapshot()).disabled, true);
    await fixture.page.locator("[data-cookie-reject]").click();
    assert.equal(fixture.tagRequests.length, 0);
    assert.equal((await fixture.snapshot()).commands.length, 0);
    await fixture.page.reload();
    assert.equal((await fixture.snapshot()).commands.length, 0);
  } finally { await fixture.context.close(); }
});

test("invalid, expired and future consent cannot enable collection", async () => {
  const values = ["not-json", { version: 2, analytics: true, savedAt: Date.now() },
    { version: 1, analytics: "true", savedAt: Date.now() },
    { version: 1, analytics: true, savedAt: Date.now() - 181 * 86400000 },
    { version: 1, analytics: true, savedAt: Date.now() + 86400000 },
    { version: 1, analytics: true, savedAt: -1 }];
  for (const consent of values) {
    const fixture = await analyticsFixture(browser, { consent });
    try {
      assert.equal(fixture.tagRequests.length, 0);
      assert.equal((await fixture.snapshot()).commands.length, 0);
      assert.equal(await fixture.page.getByRole("dialog").isVisible(), true);
    } finally { await fixture.context.close(); }
  }
});

test("blocked storage permits a page choice without persisting it", async () => {
  const fixture = await analyticsFixture(browser, { blockedStorage: true });
  try {
    assert.equal(fixture.tagRequests.length, 0);
    await fixture.page.locator("[data-cookie-accept]").click();
    assert.equal(fixture.tagRequests.length, 1);
    await fixture.page.reload();
    assert.equal((await fixture.snapshot()).commands.length, 0);
  } finally { await fixture.context.close(); }
});

test("consent loads one tag and one sanitized pageview with ads denied", async () => {
  const fixture = await analyticsFixture(browser, {
    url: "https://www.wifigate.io/he/sports-facilities/?ep=private-query-sentinel#private-hash-sentinel",
    rawReferrer: "https://referrer.example/private-path-sentinel?secret=private-referrer-sentinel#private-hash-sentinel",
  });
  try {
    await fixture.page.locator("[data-cookie-accept]").click();
    await fixture.page.waitForFunction(() => window.dataLayer?.some((command) => command[0] === "event"));
    const snapshot = await fixture.snapshot();
    assert.equal(fixture.tagRequests.length, 1);
    assert.equal(new URL(fixture.tagRequests[0]).searchParams.get("id"), fixtureMeasurementId);
    assert.equal(snapshot.disabled, false);
    assert.equal(snapshot.scriptCount, 1);
    assert.deepEqual(snapshot.commands[0], ["consent", "default", {
      analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
    }]);
    assert.deepEqual(snapshot.commands[1], ["consent", "update", { analytics_storage: "granted" }]);
    const config = snapshot.commands.find(([command]) => command === "config");
    assert.equal(config[1], fixtureMeasurementId);
    assert.equal(config[2].send_page_view, false);
    assert.equal(config[2].allow_google_signals, false);
    assert.equal(config[2].allow_ad_personalization_signals, false);
    assert.equal(config[2].cookie_expires, 180 * 86400);
    assert.equal(config[2].cookie_update, false);
    const expectedMetadata = {
      page_location: "https://wifigate.io/he/sports-facilities/",
      page_referrer: "https://referrer.example",
      page_title: "WIFIGATE | sports-facilities | he",
    };
    assert.deepEqual(snapshot.commands.find(([command]) => command === "set"), ["set", expectedMetadata]);
    assert.deepEqual(Object.fromEntries(Object.keys(expectedMetadata).map((key) => [key, config[2][key]])), expectedMetadata);
    assert.deepEqual(events(snapshot), [["event", "page_view", expectedMetadata]]);
    assert.doesNotMatch(JSON.stringify(snapshot), /private-(?:query|hash|path|referrer|title)-sentinel/);
    await fixture.page.locator("[data-cookie-settings]").click();
    await fixture.page.locator("[data-cookie-save]").click();
    assert.equal(events(await fixture.snapshot()).length, 1);
    assert.equal(fixture.tagRequests.length, 1);
  } finally { await fixture.context.close(); }
});

test("withdrawal disables measurement and removes analytics cookies", async () => {
  const fixture = await analyticsFixture(browser, { consent: accepted() });
  try {
    await fixture.context.addCookies([
      { name: "_ga", value: "synthetic", domain: ".wifigate.io", path: "/" },
      { name: "_ga_TEST", value: "synthetic", domain: "wifigate.io", path: "/" },
      { name: "necessary-test", value: "preserved", domain: "wifigate.io", path: "/" },
    ]);
    await fixture.page.locator("[data-cookie-settings]").click();
    await fixture.page.locator("[data-cookie-reject]").click();
    const snapshot = await fixture.snapshot();
    assert.equal(snapshot.disabled, true);
    assert.deepEqual(snapshot.commands.at(-1), ["consent", "update", { analytics_storage: "denied" }]);
    assert.equal(events(snapshot).length, 1);
    assert.deepEqual((await fixture.context.cookies()).map(({ name }) => name), ["necessary-test"]);
    await fixture.page.reload();
    assert.equal((await fixture.snapshot()).commands.length, 0);
  } finally { await fixture.context.close(); }
});

test("withdrawal in another tab immediately denies an already accepted tab", async () => {
  const fixture = await analyticsFixture(browser, { consent: accepted(), useUnmodifiedSource: true });
  try {
    await fixture.page.evaluate(() => window.addEventListener("storage", (event) => {
      if (event.key === "wifigate-cookie-consent-v1") window.__consentStorageEvent = true;
    }));
    const other = await fixture.context.newPage();
    await other.goto("https://wifigate.io/cookies/");
    await other.locator("[data-cookie-settings]").click();
    await other.locator("[data-cookie-reject]").click();
    await fixture.page.waitForFunction(() => window.__consentStorageEvent === true);
    const snapshot = await fixture.snapshot();
    assert.equal(snapshot.disabled, true);
    assert.deepEqual(snapshot.commands.at(-1), ["consent", "update", { analytics_storage: "denied" }]);
    assert.equal(events(snapshot).length, 1);
    await fixture.page.locator("[data-cookie-settings]").click();
    assert.equal(await fixture.page.locator("[data-cookie-analytics]").isChecked(), false);
  } finally { await fixture.context.close(); }
});

test("cleared or invalid shared consent revokes collection; unrelated storage does not", async () => {
  for (const replacement of [null, "not-json", JSON.stringify({ version: 1, analytics: true, savedAt: Date.now() + 86400000 })]) {
    const fixture = await analyticsFixture(browser, { consent: accepted(), useUnmodifiedSource: true });
    try {
      const other = await fixture.context.newPage();
      await other.goto("https://wifigate.io/cookies/");
      await fixture.page.evaluate(() => window.addEventListener("storage", () => { window.__consentStorageEvent = true; }));
      await other.evaluate(() => localStorage.setItem("unrelated-setting", "synthetic"));
      await fixture.page.waitForFunction(() => window.__consentStorageEvent === true);
      assert.equal((await fixture.snapshot()).disabled, false);
      await fixture.page.evaluate(() => { window.__consentStorageEvent = false; });
      await other.evaluate((value) => {
        if (value === null) localStorage.clear();
        else localStorage.setItem("wifigate-cookie-consent-v1", value);
      }, replacement);
      await fixture.page.waitForFunction(() => window.__consentStorageEvent === true);
      assert.equal((await fixture.snapshot()).disabled, true);
      assert.deepEqual((await fixture.snapshot()).commands.at(-1), ["consent", "update", { analytics_storage: "denied" }]);
    } finally { await fixture.context.close(); }
  }
});

test("another tab cannot implicitly grant collection in a previously disabled document", async () => {
  const fixture = await analyticsFixture(browser, { useUnmodifiedSource: true });
  try {
    await fixture.page.evaluate(() => window.addEventListener("storage", (event) => {
      if (event.key === "wifigate-cookie-consent-v1") window.__consentStorageEvent = true;
    }));
    const other = await fixture.context.newPage();
    await other.goto("https://wifigate.io/cookies/");
    await other.locator("[data-cookie-accept]").click();
    await fixture.page.waitForFunction(() => window.__consentStorageEvent === true);
    assert.equal((await fixture.snapshot()).disabled, true);
    assert.equal((await fixture.snapshot()).commands.length, 0);
    assert.equal(fixture.tagRequests.length, 1);
    await fixture.page.locator("[data-cookie-accept]").click();
    await fixture.page.waitForFunction(() => window.dataLayer?.some((command) => command[0] === "event"));
    assert.equal(events(await fixture.snapshot()).length, 1);
    assert.equal(fixture.tagRequests.length, 2);
  } finally { await fixture.context.close(); }
});

test("a failed tag download retries only after an explicit new acceptance", async () => {
  const fixture = await analyticsFixture(browser, { useUnmodifiedSource: true });
  let attempts = 0;
  try {
    await fixture.context.route("https://www.googletagmanager.com/gtag/js?*", (route) => {
      attempts += 1;
      return attempts === 1 ? route.abort("failed") : route.fulfill({ contentType: "text/javascript", body: "" });
    });
    const failed = fixture.page.waitForEvent("requestfailed", (request) => request.url().startsWith("https://www.googletagmanager.com/gtag/js"));
    await fixture.page.locator("[data-cookie-accept]").click();
    await failed;
    await fixture.page.locator("[data-cookie-settings]").click();
    await fixture.page.locator("[data-cookie-reject]").click();
    assert.equal(attempts, 1);
    assert.equal(events(await fixture.snapshot()).length, 0);
    await fixture.page.locator("[data-cookie-settings]").click();
    await fixture.page.locator("[data-cookie-analytics]").check();
    await fixture.page.locator("[data-cookie-save]").click();
    assert.equal(attempts, 2);
    await fixture.page.waitForFunction(() => window.dataLayer?.some((command) => command[0] === "event"));
    assert.equal(events(await fixture.snapshot()).length, 1);
    assert.equal((await fixture.snapshot()).scriptCount, 1);
    await fixture.page.locator("[data-cookie-settings]").click();
    await fixture.page.locator("[data-cookie-save]").click();
    assert.equal(attempts, 2);
    assert.equal(events(await fixture.snapshot()).length, 1);
  } finally { await fixture.context.close(); }
});

test("withdrawal during a pending tag download prevents late grant or pageview", async () => {
  const fixture = await analyticsFixture(browser, { useUnmodifiedSource: true });
  let pending;
  try {
    await fixture.context.route("https://www.googletagmanager.com/gtag/js?*", (route) => { pending = route; });
    await fixture.page.locator("[data-cookie-accept]").click();
    assert.ok(pending);
    await fixture.page.locator("[data-cookie-settings]").click();
    await fixture.page.locator("[data-cookie-reject]").click();
    await pending.fulfill({ contentType: "text/javascript", body: "window.__ownedTagDownloadCompleted = true;" });
    await fixture.page.waitForFunction(() => window.__ownedTagDownloadCompleted === true);
    const snapshot = await fixture.snapshot();
    assert.equal(snapshot.disabled, true);
    assert.equal(snapshot.commands.filter(([command]) => command === "config").length, 0);
    assert.equal(events(snapshot).length, 0);
    assert.deepEqual(snapshot.commands.at(-1), ["consent", "update", { analytics_storage: "denied" }]);
    await fixture.page.locator("[data-cookie-settings]").click();
    await fixture.page.locator("[data-cookie-analytics]").check();
    await fixture.page.locator("[data-cookie-save]").click();
    assert.equal(events(await fixture.snapshot()).length, 1);
    assert.equal((await fixture.snapshot()).scriptCount, 1);
  } finally { await fixture.context.close(); }
});

test("all published locales and consumer niche routes are eligible", async () => {
  assert.equal(locales.length, 39);
  const fixture = await analyticsFixture(browser, { consent: accepted() });
  try {
    const paths = [...locales.map((locale) => locale === "en" ? "/" : `/${locale}/`),
      ...locales.map((locale) => `/${locale === "en" ? "" : `${locale}/`}${AUTO_OPEN_PAGE_KEY}/`),
      ...locales.map((locale) => `/${locale === "en" ? "" : `${locale}/`}wifigate-host/`),
      ...NICHE_DEFINITIONS.map(({ key }) => `/${key}/`),
      "/automation/", "/cookies/", "/privacy-policy/", "/terms-and-conditions/", "/accessibility/", "/contact-us/", "/he/index.html"];
    for (const pathname of paths) {
      await fixture.page.goto(`https://wifigate.io${pathname}`);
      await fixture.page.waitForFunction(() => window.dataLayer?.some((command) => command[0] === "event"));
      assert.equal(events(await fixture.snapshot()).length, 1, pathname);
    }
  } finally { await fixture.context.close(); }
});

test("Business, authenticated, invitation, API and unknown routes never collect", async () => {
  const excluded = ["dashboard", "login", "manager", "pay", "host", "admin", "wifigate-link", "wifigate-api", "api", "unknown-route"];
  const fixture = await analyticsFixture(browser, { consent: accepted(), url: "https://wifigate.io/dashboard/" });
  try {
    for (const locale of locales) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      for (const route of excluded) {
        const pathname = `${prefix}/${route}/?ep=private-query-sentinel#private-hash-sentinel`;
        await fixture.page.goto(`https://wifigate.io${pathname}`);
        await fixture.page.waitForFunction(() => document.querySelector("[data-cookie-settings]"));
        const snapshot = await fixture.snapshot();
        assert.equal(snapshot.commands.length, 0, pathname);
        assert.equal(snapshot.disabled, true, pathname);
      }
    }
    assert.equal(fixture.tagRequests.length, 0);
    await fixture.page.locator("[data-cookie-settings]").click();
    await fixture.page.locator("[data-cookie-save]").click();
    assert.equal((await fixture.snapshot()).commands.length, 0);
  } finally { await fixture.context.close(); }
});

test("foreign, insecure, local and alternate-port origins never collect", async () => {
  const fixture = await analyticsFixture(browser, { consent: accepted(), url: "https://preview.example/" });
  try {
    for (const origin of ["http://wifigate.io", "https://wifigate.io:8443", "https://wifigate.io.example", "https://preview.example", "http://localhost:4730", "http://127.0.0.1:4730"]) {
      await fixture.page.goto(`${origin}/`);
      await fixture.page.waitForFunction(() => document.querySelector("[data-cookie-reject]"));
      assert.equal((await fixture.snapshot()).commands.length, 0, origin);
    }
    assert.equal(fixture.tagRequests.length, 0);
  } finally { await fixture.context.close(); }
});

test("nested and encoded route lookalikes stay excluded", async () => {
  const fixture = await analyticsFixture(browser, { consent: accepted(), url: "https://wifigate.io/404.html" });
  try {
    for (const pathname of ["/sports-facilities/private/", "/he/dashboard/manager/", "/%68e/", "/sports-facilities%2Fprivate/", "/he//", "/en/", "/404.html"]) {
      await fixture.page.goto(`https://wifigate.io${pathname}`);
      await fixture.page.waitForFunction(() => document.querySelector("[data-cookie-reject]"));
      assert.equal((await fixture.snapshot()).commands.length, 0, pathname);
    }
    assert.equal(fixture.tagRequests.length, 0);
  } finally { await fixture.context.close(); }
});
