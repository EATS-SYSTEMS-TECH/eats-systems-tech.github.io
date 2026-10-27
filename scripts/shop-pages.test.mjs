import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import * as cheerio from "cheerio";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { getShopPageContent } from "./shop-pages.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const origin = "https://wifigate.io";
const products = ["wifigate", "wifigate-roller-shutter"];
const routes = [null, ...products];
const hrefLang = (locale) => locale === "fil" ? "tl" : locale;
const routePath = (locale, product = null) => `${locale === "en" ? "" : `/${locale.toLowerCase()}`}/shop/${product ? `${product}/` : ""}`;
const expectedName = (product) => product === "wifigate" ? "WIFIGATE" : "WIFIGATE Roller shutter";

async function assertLocalTarget(reference, pageUrl, label) {
  if (!reference || reference.startsWith("#")) return;
  const url = new URL(reference, pageUrl);
  if (url.origin !== origin) return;
  const pathname = decodeURIComponent(url.pathname);
  const relativePath = pathname.replace(/^\/+/, "");
  let target = path.resolve(root, relativePath);
  const relativeTarget = path.relative(root, target);
  assert.ok(!relativeTarget.startsWith("..") && !path.isAbsolute(relativeTarget), `${label}: local reference stays in the site`);
  if (pathname.endsWith("/")) target = path.join(target, "index.html");
  assert.ok((await stat(target)).isFile(), `${label}: ${reference} resolves from its actual nested route`);
}

function assertUnavailable($, main, locale, product) {
  const stock = locale === "he" ? "אזל מהמלאי" : "Out of stock";
  assert.equal(main.find(".shop-stock").length, 2, "Every displayed product has a visible availability label");
  main.find(".shop-stock").each((_, element) => assert.equal($(element).text().trim(), stock));
  main.find(".shop-product-card__link").each((_, element) => assert.ok($(element).attr("aria-label").includes(stock), "Screen readers hear product availability before opening details"));
  assert.equal(main.find(".shop-purchase").length, product ? 1 : 0,
    "Catalog cards browse details; the detail has one unavailable purchase control");
  main.find(".shop-purchase").each((_, element) => {
    assert.equal(element.tagName, "button");
    assert.ok($(element).is("[disabled]"), "Unavailable products cannot be purchased");
    assert.equal($(element).attr("type"), "button", "The unavailable button cannot submit a form");
    assert.equal($(element).text().trim(), stock);
    assert.equal($(element).attr("onclick"), undefined);
  });
  assert.equal(main.find("form, [data-add-to-cart], [data-buy-now]").length, 0,
    "The unavailable catalog exposes no order submission or purchase handler");
  assert.equal(main.find('a[href*="reservations"], a[href*="checkout"]').length, 0,
    "Unavailable products do not lead into a reservation or checkout flow");
  assert.doesNotMatch(main.text(), /[$€₪£¥]\s*\d|\d[\d.,]*\s*[$€₪£¥]|\b(?:USD|ILS|EUR|GBP)\b/,
    "No unverified price or currency is shown");
  assert.doesNotMatch(main.text(), /\u2014/, "The shop copy does not use em dash placeholders");
}

test("shop renderer provides usable catalog and product content before any JavaScript runs", () => {
  assert.equal(SITE_LANGUAGES.length, 39, "The published language inventory remains explicit");
  for (const { code: locale } of SITE_LANGUAGES) {
    for (const product of routes) {
      const content = getShopPageContent(locale, product);
      const $ = cheerio.load(`<main>${content.main}</main>`);
      const main = $("main");
      assert.equal(content.contentLang, locale === "he" ? "he" : "en");
      assert.ok(content.title.trim() && content.description.trim());
      assert.equal(main.find("h1").length, 1);
      assert.equal(main.find("script").length, 0, "Product information and links are server-rendered HTML");
      assert.equal(main.find(".shop-product-card").length, product ? 1 : 2);
      assert.ok(main.find(`a[href='${locale === "en" ? "/" : `/${locale.toLowerCase()}/`}#get-in-touch']`).length);
      assertUnavailable($, main, locale, product);
    }
  }
  assert.throws(() => getShopPageContent("en", "nonexistent-product"), /Unknown shop product/);
});

for (const { code: locale } of SITE_LANGUAGES) {
  for (const product of routes) {
    const pathname = routePath(locale, product);
    test(`generated shop contract: ${pathname}`, async () => {
      const url = origin + pathname;
      const html = await readFile(path.join(root, pathname.slice(1), "index.html"), "utf8");
      const $ = cheerio.load(html);
      const main = $("main.shop-main");
      const contentLang = locale === "he" ? "he" : "en";
      const contentDir = locale === "he" ? "rtl" : "ltr";
      assert.equal(main.length, 1);
      assert.equal($("html").attr("lang"), locale);
      assert.equal($("html").attr("dir"), ["he", "ar"].includes(locale) ? "rtl" : "ltr");
      for (const content of [main, main.find(".shop-main__content"), ...(product ? [main.find(".shop-product-detail")] : [])]) {
        assert.equal(content.length, 1);
        assert.equal(content.attr("lang"), contentLang, "Fallback content declares its actual language");
        assert.equal(content.attr("dir"), contentDir, "English fallback retains readable LTR layout inside RTL pages");
      }
      assert.equal($("h1").length, 1);
      assert.ok(main.find("h1").text().trim());
      assert.equal($("title").length, 1);
      assert.ok($("title").text().trim());
      assert.ok($("meta[name='description']").attr("content")?.trim());
      assert.equal($("link[rel='canonical']").length, 1);
      assert.equal($("link[rel='canonical']").attr("href"), url);
      for (const name of ["robots", "googlebot"]) {
        const tokens = $("meta[name='" + name + "']").attr("content")?.split(/\s*,\s*/).sort();
        assert.deepEqual(tokens, ["follow", "noindex"], "Catalog preview has explicit noindex, follow metadata");
      }
      const alternates = $("link[rel='alternate'][hreflang]");
      assert.equal(alternates.length, SITE_LANGUAGES.length + 1);
      assert.equal(new Set(alternates.map((_, element) => $(element).attr("hreflang")).get()).size, alternates.length);
      assert.equal($("link[hreflang='x-default']").attr("href"), origin + routePath("en", product));
      for (const { code } of SITE_LANGUAGES) {
        assert.equal($("link[hreflang='" + hrefLang(code) + "']").attr("href"), origin + routePath(code, product));
        const languageLink = $(".language-selector__option[data-lang='" + code + "']");
        assert.equal(languageLink.length, 1);
        assert.equal(languageLink.attr("href"), routePath(code, product), "Changing language preserves the selected product");
      }
      const pageData = $("script[type='application/ld+json']").map((_, element) => JSON.parse($(element).text())).get();
      assert.ok(pageData.length);
      for (const data of pageData) {
        assert.doesNotMatch(JSON.stringify(data), /"(?:price|lowPrice|highPrice|priceCurrency)"\s*:/,
          "Structured data does not invent a product price");
      }
      assertUnavailable($, main, locale, product);
      const cards = main.find(".shop-product-card");
      assert.equal(cards.length, product ? 1 : 2);
      for (const expected of products.filter((id) => id !== product)) {
        const card = main.find(".shop-product-card[data-product='" + expected + "']");
        assert.equal(card.length, 1);
        assert.equal(card.find(".shop-product-card__name").text().trim(), expectedName(expected));
        assert.equal(card.find("a.shop-product-card__link").attr("href"), routePath(locale, expected));
        assert.equal(card.find("a a, a button").length, 0, "Whole-card links contain no nested interactive controls");
      }
      if (product) {
        const detail = main.find(".shop-product-detail");
        assert.equal(detail.attr("data-product"), product);
        assert.equal(detail.find("h1").text().trim(), expectedName(product));
        assert.ok(detail.find("details.shop-accordion").length >= 2, "Details expose meaningful native disclosure sections");
        detail.find("details.shop-accordion").each((_, element) => {
          assert.equal($(element).children("summary").length, 1);
          assert.ok($(element).children("summary").text().trim());
          assert.ok($(element).find(".shop-accordion__content").text().trim());
        });
      }
      const roller = main.find("[data-product='wifigate-roller-shutter']");
      if (roller.length) {
        assert.equal(roller.find(".shop-no-image").length, 1);
        assert.equal(roller.find("img, picture, svg, canvas, video, object, embed").length, 0,
          "Roller shutter has no product image or illustrative substitute");
      }
      if (product !== "wifigate-roller-shutter") {
        const controller = main.find("[data-product='wifigate']");
        assert.ok(controller.find("img").length, "WIFIGATE retains its real controller photo");
      }
      const contactLinks = main.find("a[href$='#get-in-touch']");
      assert.ok(contactLinks.length);
      contactLinks.each((_, element) => assert.equal($(element).attr("href"), `${locale === "en" ? "/" : `/${locale.toLowerCase()}/`}#get-in-touch`));
      for (const [selector, attribute] of [["script[src]", "src"], ["img[src], source[src], video[src]", "src"], ["video[poster]", "poster"], ["link[rel='stylesheet'], link[rel='icon']", "href"], [".shop-main a[href], .language-selector__option[href]", "href"]]) {
        for (const element of $(selector).toArray()) {
          await assertLocalTarget($(element).attr(attribute), url, `${pathname} ${selector}`);
        }
      }
    });
  }
}
