import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import vm from "node:vm";
import { chromium } from "playwright-core";

const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const sandbox = { window: {} };
  vm.runInNewContext(await readFile(path.resolve("js/cookie-consent-copy.js"), "utf8"), sandbox);
  const copies = sandbox.window.WIFIGATE_COOKIE_COPY;
  const locales = (await readdir(path.resolve("scripts/homepage-copy")))
    .filter((file) => file.endsWith(".mjs"))
    .map((file) => file.slice(0, -4));
  assert.deepEqual(Object.keys(copies).sort(), locales.sort(), "Every published locale needs cookie copy");
  const keys = Object.keys(copies.en);
  for (const locale of locales) {
    assert.deepEqual(Object.keys(copies[locale]), keys, `${locale}: missing copy key`);
    for (const key of keys) assert.ok(copies[locale][key]?.trim(), `${locale}: empty ${key}`);
    const file = path.resolve(locale === "en" ? "index.html" : `${locale.toLowerCase()}/index.html`);
    const html = await readFile(file, "utf8");
    assert.ok(html.includes("cookie-consent-copy.js"), `${locale}: copy script missing`);
    assert.ok(html.includes("data-cookie-settings"), `${locale}: settings entry missing`);
  }

  for (const locale of ["en", "he"]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const file = path.resolve(locale === "en" ? "index.html" : "he/index.html");
    await page.goto(pathToFileURL(file).href);
    const panel = page.getByRole("dialog", { name: copies[locale].title });
    await panel.waitFor();
    assert.equal(await panel.isVisible(), true);
    assert.equal(await panel.locator(".cookie-consent__description").innerText(), `${copies[locale].banner} ${copies[locale].privacy}`);
    assert.equal(await panel.locator("[data-cookie-settings-open]").count(), 0);
    if (process.env.CONSENT_SCREENSHOTS) await page.screenshot({ path: path.resolve(`.cookie-consent-${locale}.png`) });
    assert.equal(await page.evaluate(() => localStorage.getItem("wifigate-cookie-consent-v1")), null);
    await panel.getByRole("button", { name: copies[locale].reject }).click();
    assert.equal(await panel.isVisible(), false);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("wifigate-cookie-consent-v1")).analytics), false);
    await page.reload();
    assert.equal(await panel.isVisible(), false);
    await page.locator("[data-cookie-settings]").click();
    assert.equal(await panel.isVisible(), true);
    await panel.locator("[data-cookie-analytics]").check();
    await panel.locator("[data-cookie-save]").click();
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("wifigate-cookie-consent-v1")).analytics), true);
    await page.reload();
    assert.equal(await panel.isVisible(), false);
    await context.close();
  }
  for (const locale of locales.filter((name) => name !== "en" && name !== "he")) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.resolve(`${locale.toLowerCase()}/index.html`)).href, { waitUntil: "domcontentloaded" });
    const panel = page.getByRole("dialog", { name: copies[locale].title });
    await panel.waitFor();
    if (process.env.CONSENT_SCREENSHOTS && ["es", "ar", "zh-Hant"].includes(locale)) {
      await page.screenshot({ path: path.resolve(`.cookie-consent-${locale}.png`) });
    }
    assert.equal(await panel.getAttribute("dir"), locale === "ar" ? "rtl" : "ltr", `${locale}: direction`);
    assert.equal(await panel.getByRole("button", { name: copies[locale].accept }).count(), 1);
    assert.equal(await panel.getByRole("button", { name: copies[locale].accept }).evaluate((button) => getComputedStyle(button).backgroundColor), "rgb(17, 17, 17)");
    assert.equal(await page.locator("[data-cookie-settings]").innerText(), copies[locale].reopen);
    assert.equal(await panel.getByRole("link", { name: copies[locale].privacy }).getAttribute("href"), `/${locale.toLowerCase()}/privacy-policy/`);
    assert.equal(await panel.evaluate((element) => element.scrollWidth <= element.clientWidth + 1), true, `${locale}: horizontal overflow`);
    await context.close();
  }
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto(pathToFileURL(path.resolve("index.html")).href, { waitUntil: "domcontentloaded" });
  const desktopPanel = desktopPage.getByRole("dialog", { name: copies.en.title });
  await desktopPanel.waitFor();
  const bounds = await desktopPanel.boundingBox();
  assert.ok(bounds.x <= 1 && bounds.width >= 1439 && bounds.y + bounds.height >= 899, "Desktop banner spans the bottom edge");
  assert.ok(bounds.height < 130, "Desktop banner stays compact");
  const accessibilityButton = await desktopPage.locator(".a11y-fab").boundingBox();
  assert.ok(accessibilityButton.y + accessibilityButton.height < bounds.y, "Accessibility button stays above the banner");
  if (process.env.CONSENT_SCREENSHOTS) await desktopPage.screenshot({ path: path.resolve(".cookie-consent-desktop.png") });
  await desktopContext.close();
  // Every published page asks for consent; an instant redirect page has nothing to show.
  const pages = [];
  async function collectPages(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (["node_modules", "templates", "docs", ".git"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await collectPages(full);
      else if (entry.name.endsWith(".html")) pages.push(full);
    }
  }
  await collectPages(path.resolve("."));
  let consentPages = 0;
  for (const file of pages) {
    const html = await readFile(file, "utf8");
    const name = path.relative(process.cwd(), file);
    assert.doesNotMatch(html, /locale-redirect\.js/, `${name}: no remembered-language redirect`);
    if (/http-equiv="refresh"/i.test(html)) continue;
    assert.equal(html.match(/cookie-consent\.js/g)?.length, 1, `${name}: cookie consent script`);
    assert.equal(html.match(/cookie-consent-copy\.js/g)?.length, 1, `${name}: cookie consent copy`);
    consentPages += 1;
  }
  assert.ok(consentPages > 500, `only ${consentPages} pages ask for consent`);

  // The site keeps no language choice: the URL alone sets the language.
  for (const file of (await readdir(path.resolve("js"))).filter((name) => name.endsWith(".js"))) {
    const source = await readFile(path.resolve("js", file), "utf8");
    assert.doesNotMatch(source, /localStorage\.setItem\(\s*["']language["']/, `js/${file}: stores a language`);
  }
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await context.addInitScript(() => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("language", "fr");
        sessionStorage.setItem("seeded", "1");
      }
    });
    const page = await context.newPage();
    await page.goto(pathToFileURL(path.resolve("index.html")).href);
    await page.getByRole("dialog", { name: copies.en.title }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.lang), "en", "an English URL stays English");
    assert.equal(await page.evaluate(() => localStorage.getItem("language")), null, "an old language choice is cleared");

    // Rejecting is as prominent as accepting.
    const style = (selector) => page.locator(selector).evaluate((button) => {
      const s = getComputedStyle(button);
      return [s.backgroundColor, s.color, s.borderColor, s.fontWeight, button.offsetHeight].join("|");
    });
    assert.equal(await style("[data-cookie-reject]"), await style("[data-cookie-accept]"));

    // The invitation link page asks too, in its own language.
    await page.goto(pathToFileURL(path.resolve("he/wifigate-link/index.html")).href);
    const panel = page.getByRole("dialog", { name: copies.he.title });
    await panel.waitFor();
    assert.equal(await panel.getAttribute("dir"), "rtl");
    await context.close();
  }

  const context = await browser.newContext();
  const source = (await readFile(path.resolve("js/cookie-consent.js"), "utf8"))
    .replace('const GA_MEASUREMENT_ID = "";', 'const GA_MEASUREMENT_ID = "G-TEST12345";');
  let googleRequests = 0;
  await context.route(/cookie-consent\.js/, (route) => route.fulfill({ body: source, contentType: "text/javascript" }));
  await context.route("https://www.googletagmanager.com/**", (route) => {
    googleRequests += 1;
    return route.fulfill({ body: "", contentType: "text/javascript" });
  });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.resolve("index.html")).href);
  assert.equal(googleRequests, 0, "Analytics must not load before consent");
  await page.locator("[data-cookie-accept]").click();
  assert.equal(googleRequests, 1, "Analytics loads after consent");
  assert.equal(await page.evaluate(() => window["ga-disable-G-TEST12345"]), false);
  await page.locator("[data-cookie-settings]").click();
  await page.locator("[data-cookie-reject]").click();
  assert.equal(await page.evaluate(() => window["ga-disable-G-TEST12345"]), true);
  await context.close();
  console.log("Cookie consent localization, choice, persistence, reopening and analytics gating passed.");
} finally {
  await browser.close();
}
