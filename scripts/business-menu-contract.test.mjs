import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { SITE_NAVIGATION, USE_CASE_MENU } from "./site-navigation.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { buildPagePath } from "./localized-builder-document.mjs";

// Every generated page with the shared header carries the same "For Business"
// group: the section link, then WIFIGATE Manager and WIFIGATE Host in the
// page's language, as real links in the tab order (no ARIA menu roles).
// "Use Cases" is a group of the same kind: the section link, then the
// use-case pages in the order of the homepage list, named in the page's language.
const root = process.cwd();
const header = readFileSync(path.join(root, "templates/partials/site-header.template.html"), "utf8");
const pages = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", "*.html"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/).filter(file => file && !file.startsWith("templates/"))
  .filter(file => readFileSync(path.join(root, file), "utf8").includes('<header class="site-header"'));

test("navigation data lists the use-case pages under Use Cases, and Manager, then Host, under For Business", () => {
  const groups = SITE_NAVIGATION.filter(item => item.children);
  assert.deepEqual(groups.map(item => item.key), ["solutions", "automation"]);
  assert.deepEqual(groups[0].children, USE_CASE_MENU.map(pageKey => ({ pageKey })));
  const homepage = cheerio.load(readFileSync(path.join(root, "templates/index.template.html"), "utf8"));
  assert.deepEqual([...USE_CASE_MENU], homepage(".where-list__link[data-niche-key]").map((_, link) => homepage(link).attr("data-niche-key")).get(), "the menu follows the homepage list");
  assert.deepEqual(groups[1].children, [
    { label: "WIFIGATE Manager", pageKey: "wifigate-manager" },
    { label: "WIFIGATE Host", pageKey: "wifigate-host" },
  ]);
  assert.match(header, /<div class="topbar-nav"><\/div>/, "the partial leaves the menu to the builder");
});

test("every shared-header page renders the For Business product links", () => {
  const codes = new Map(SITE_LANGUAGES.map(({ code }) => [code.toLowerCase(), code]));
  const perLocale = new Map();
  assert.ok(pages.length >= 800, `expected the generated site, found ${pages.length} header pages`);
  for (const file of pages) {
    const $ = cheerio.load(readFileSync(path.join(root, file), "utf8"));
    const locale = codes.get(($("html").attr("lang") || "").toLowerCase());
    assert.ok(locale, `${file}: page language is a published locale`);
    const segments = file.split("/").slice(0, -1);
    const pageKey = (locale === "en" ? segments : segments.slice(1)).join("/") || "home";
    const label = `${file} (${locale})`;
    const groups = $(".topbar-nav > .nav__group");
    assert.deepEqual(groups.map((_, node) => $(node).attr("data-nav-group")).get(), ["solutions", "automation"], `${label}: Use Cases, then For Business`);
    const cases = groups.first();
    assert.equal(cases.index(), 1, `${label}: Use Cases keeps the second menu position`);
    const casesLink = cases.children("a.nav__link.nav__group-link");
    assert.equal(casesLink.attr("href"), `${buildPagePath(locale)}#use-cases`, `${label}: Use Cases still opens the homepage section`);
    const casesList = cases.find(".nav__submenu > ul.nav__submenu-list");
    assert.equal(casesList.attr("aria-label"), casesLink.text().replace(/\u200f/g, ""), `${label}: list is named after Use Cases`);
    assert.equal(casesList.attr("dir"), $("html").attr("dir"), `${label}: list follows the page direction`);
    assert.equal(cases.find("[role]").length, 0, `${label}: disclosure links, not an ARIA menu`);
    const caseItems = casesList.find("> li > a.nav__sublink").map((_, item) => ({ text: $(item).text().trim(), href: $(item).attr("href"), current: $(item).attr("aria-current"), translate: $(item).attr("translate") })).get();
    assert.deepEqual(caseItems.map(item => item.href), USE_CASE_MENU.map(key => buildPagePath(locale, key)), `${label}: use-case pages in the page language, in homepage order`);
    assert.equal(new Set(caseItems.map(item => item.text)).size, USE_CASE_MENU.length, `${label}: every use case has its own name`);
    for (const item of caseItems) {
      assert.ok(item.text, `${label}: ${item.href} is named`);
      assert.equal(item.translate, undefined, `${label}: use-case names are ordinary localized text`);
      assert.ok(existsSync(path.join(root, ...item.href.split("/").filter(Boolean), "index.html")), `${label}: ${item.href} exists`);
    }
    assert.deepEqual(caseItems.map(item => item.current), USE_CASE_MENU.map(key => key === pageKey ? "page" : undefined), `${label}: current use-case page is marked`);
    const group = groups.last();
    assert.equal(group.index(), 2, `${label}: group keeps the third menu position`);
    const link = group.children("a.nav__link.nav__group-link");
    assert.equal(link.attr("href"), `${buildPagePath(locale)}#wifigate-for-business`, `${label}: For Business still opens the homepage section`);
    assert.equal($(".topbar-nav .nav__link").length, 6, `${label}: six top-level links`);
    const list = group.find(".nav__submenu > ul.nav__submenu-list");
    assert.equal(list.attr("aria-label"), link.text().replace(/\u200f/g, ""), `${label}: list is named after For Business`);
    assert.equal(list.attr("dir"), $("html").attr("dir"), `${label}: list follows the page direction`);
    assert.equal(group.find("[role]").length, 0, `${label}: disclosure links, not an ARIA menu`);
    const items = list.find("> li > a.nav__sublink").map((_, item) => ({
      text: $(item).text(), href: $(item).attr("href"), lang: $(item).attr("lang"), current: $(item).attr("aria-current"), translate: $(item).attr("translate"),
    })).get();
    assert.deepEqual(items.map(item => item.text), ["WIFIGATE Manager", "WIFIGATE Host"], `${label}: Manager, then Host`);
    assert.deepEqual(items.map(item => item.href), [buildPagePath(locale, "wifigate-manager"), buildPagePath(locale, "wifigate-host")], `${label}: product pages in the page language`);
    for (const item of items) {
      assert.equal(item.translate, "no", `${label}: product names are not translated`);
      assert.equal(item.lang, locale === "en" ? undefined : "en", `${label}: product names are marked as English`);
      assert.ok(existsSync(path.join(root, ...item.href.split("/").filter(Boolean), "index.html")), `${label}: ${item.href} exists`);
    }
    assert.deepEqual(items.map(item => item.current), ["wifigate-manager", "wifigate-host"].map(key => key === pageKey ? "page" : undefined), `${label}: current product page is marked`);
    perLocale.set(locale, (perLocale.get(locale) || 0) + 1);
  }
  assert.equal(perLocale.size, SITE_LANGUAGES.length, "every published locale is covered");
  const counts = new Set(perLocale.values());
  assert.equal(counts.size, 1, `every locale has the same header page count: ${JSON.stringify(Object.fromEntries(perLocale))}`);
});
