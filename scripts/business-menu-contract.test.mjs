import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { SITE_NAVIGATION } from "./site-navigation.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { buildPagePath } from "./localized-builder-document.mjs";

// Every generated page with the shared header carries the same "For Business"
// group: the section link, then WIFIGATE Manager and WIFIGATE Host in the
// page's language, as real links in the tab order (no ARIA menu roles).
const root = process.cwd();
const header = readFileSync(path.join(root, "templates/partials/site-header.template.html"), "utf8");
const pages = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", "*.html"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/).filter(file => file && !file.startsWith("templates/"))
  .filter(file => readFileSync(path.join(root, file), "utf8").includes('<header class="site-header"'));

test("navigation data lists Manager first, then Host, under For Business only", () => {
  const groups = SITE_NAVIGATION.filter(item => item.children);
  assert.deepEqual(groups.map(item => item.key), ["automation"]);
  assert.deepEqual(groups[0].children, [
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
    assert.equal(groups.length, 1, `${label}: one For Business group`);
    const group = groups.first();
    assert.equal(group.attr("data-nav-group"), "automation");
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
