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
  assert.equal(main.find(".shop-stock").length, 0, "No waitlist label: orders go to WhatsApp");
  assert.doesNotMatch(main.text(), /waitlist|רשימת ההמתנה/i);
  main.find(".shop-product-card__link").each((_, element) => assert.match($(element).attr("aria-label"), /WIFIGATE/, "Details links name their product"));
  assert.equal(main.find(".shop-purchase").length, product ? 1 : 0,
    "Catalog cards browse details; the detail has one add-to-cart control");
  main.find(".shop-purchase").each((_, element) => {
    assert.equal(element.tagName, "button");
    assert.equal($(element).attr("data-shop-cart"), product, "The detail adds its own product to the cart");
    assert.equal($(element).attr("onclick"), undefined);
  });
  assert.equal(main.find(".shop-waitlist").length, 0);
  assert.equal(main.find(".shop-business-card").length, product ? 0 : 2, "Only the catalog presents the business subscriptions");
  const carts = main.find("[data-shop-cart]");
  assert.deepEqual(carts.map((_, element) => $(element).attr("data-shop-cart")).get(),
    product ? [product] : ["wifigate", "wifigate-roller-shutter", "wifigate-host", "wifigate-manager"],
    "Each product and subscription adds its own cart id");
  carts.each((_, element) => {
    assert.equal(element.tagName, "button");
    assert.equal($(element).attr("type"), "button", "Add to cart cannot submit a form");
    if (!product) assert.equal($(element).closest(".shop-actions").find(".shop-actions__details[href]").length, 1, "Add to cart sits beside a details link");
  });
  assert.equal(main.find("img[src*='assets/img/manager/']").length, 0, "Manager is illustrated without a dashboard screenshot");
  if (!product) {
    assert.equal(main.find(".shop-product-card__facts").length, 2, "Each controller card lists its short facts");
    main.find(".shop-business-card").each((_, element) => {
      assert.equal($(element).find(".shop-business-card__media .shop-business-card__name").length, 1, "The subscription name sits on its letter mark");
      assert.ok($(element).find(".shop-business-card__segments span").length >= 4, "Each subscription says who it is for");
    });
    assert.match(main.find("[data-business='manager'] .shop-business-card__segments span").last().text(), locale === "he" ? /ועוד/ : /And more/);
    main.find(".shop-actions").each((_, element) => assert.ok($(element).children().first().is(".shop-actions__cart"), "Add to cart leads each card's actions"));
  }
  assert.equal(main.find(".shop-related, .shop-contact").length, 0, "The removed related and contact sections stay removed");
  assert.equal(main.find("form, [data-add-to-cart], [data-buy-now]").length, 0,
    "The unavailable catalog exposes no order submission or purchase handler");
  assert.equal(main.find('a[href*="checkout"]').length, 0, "There is no online payment checkout");
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
      assert.equal(main.find(".shop-product-card").length, product ? 0 : 2);
      if (!product) assert.equal(main.find(`[data-business='manager'] a[href='${locale === "en" ? "" : `/${locale.toLowerCase()}`}/wifigate-manager/']`).length, 1);
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
      assert.equal($("link[rel='canonical']").attr("href"), origin + routePath(contentLang, product),
        "Untranslated catalog variants consolidate into the actual English content");
      for (const name of ["robots", "googlebot"]) {
        const tokens = $("meta[name='" + name + "']").attr("content")?.split(/\s*,\s*/).sort();
        assert.deepEqual(tokens, ["follow", "index"], "The public catalog is eligible for search while checkout stays disabled");
      }
      const alternates = $("link[rel='alternate'][hreflang]");
      assert.equal(alternates.length, 3, "Only translated English and Hebrew content participates in hreflang");
      assert.equal(new Set(alternates.map((_, element) => $(element).attr("hreflang")).get()).size, alternates.length);
      assert.equal($("link[hreflang='x-default']").attr("href"), origin + routePath("en", product));
      for (const code of ['en', 'he']) assert.equal($("link[hreflang='" + code + "']").attr("href"), origin + routePath(code, product));
      for (const { code } of SITE_LANGUAGES) {
        if (!['en', 'he'].includes(code)) assert.equal($("link[hreflang='" + hrefLang(code) + "']").length, 0);
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
      assert.equal(cards.length, product ? 0 : 2);
      for (const expected of product ? [] : products) {
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
        assert.ok(roller.find("img[src$='assets/img/shop/wifigate-roller-shutter.webp']").length, "Roller shutter shows its WIFIGATE panel photo");
        assert.equal(roller.find(".shop-no-image").length, 0);
      }
      if (product !== "wifigate-roller-shutter") {
        const controller = main.find("[data-product='wifigate']");
        assert.ok(controller.find("img[src$='assets/img/wifigate-product-v3.webp']").length, "WIFIGATE leads with the controller and app photo");
      }
      const contactLinks = main.find("a[href$='#get-in-touch']");
      contactLinks.each((_, element) => assert.equal($(element).attr("href"), `${locale === "en" ? "/" : `/${locale.toLowerCase()}/`}#get-in-touch`));
      for (const [selector, attribute] of [["script[src]", "src"], ["img[src], source[src], video[src]", "src"], ["video[poster]", "poster"], ["link[rel='stylesheet'], link[rel='icon']", "href"], [".shop-main a[href], .language-selector__option[href]", "href"]]) {
        for (const element of $(selector).toArray()) {
          await assertLocalTarget($(element).attr(attribute), url, `${pathname} ${selector}`);
        }
      }
    });
  }
}

test('sitemap includes all six translated catalog pages and no English fallback duplicates', async () => {
  const xml = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1]);
  for (const {code} of SITE_LANGUAGES) for (const product of routes) {
    assert.equal(urls.includes(origin + routePath(code, product)), ['en', 'he'].includes(code));
  }
});
