import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import * as cheerio from "cheerio";
import { HOST_PAGE_KEY, getHostPageContent, appendHostMarketingDetails } from "./host-marketing-page.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { BENEFIT_ICONS } from "./benefit-icons.mjs";
const { installHomeHostPointShells } = await import("./host-marketing-page.mjs");

const copies = await Promise.all(SITE_LANGUAGES.map(async ({ code }) => ({
  locale: code,
  host: (await import(`./host-page-copy/${code}.mjs`)).default,
  home: (await import(`./homepage-copy/${code}.mjs`)).default,
})));

test("all 39 Host locales reuse existing hero, steps, benefits and SEO without new claims", () => {
  assert.equal(HOST_PAGE_KEY, "wifigate-host");
  assert.equal(copies.length, 39);
  for (const { locale, host, home } of copies) {
    const before = structuredClone({ host, home });
    const content = getHostPageContent(host, home);
    assert.equal(content.label, "WIFIGATE Host");
    assert.equal(content.eyebrow, host.marketing.hero.eyebrow, locale);
    assert.equal(content.title, host.marketing.hero.title, locale);
    assert.equal(content.heroLead, host.marketing.hero.lead, locale);
    assert.equal(content.imageAlt, home.automation.imageAlt, locale);
    assert.equal(content.seoTitle, host.metaTitle, locale);
    assert.equal(content.seoDescription, host.metaDescription, locale);
    assert.equal(content.benefitsTitle, host.marketing.benefits.title, locale);
    assert.equal(content.highlights.length, 3);
    content.highlights.forEach((item, index) => {
      assert.equal(item.title, host.marketing.steps[`s${index + 1}t`], locale);
      assert.equal(item.text, host.marketing.steps[`s${index + 1}x`], locale);
    });
    assert.equal(content.benefits.length, 6);
    content.benefits.forEach((item, index) => {
      assert.ok(BENEFIT_ICONS[item.icon], `${locale}: existing benefit icon`);
      assert.equal(item.title, host.marketing.benefits[`b${index + 1}t`], locale);
      assert.equal(item.text, host.marketing.benefits[`b${index + 1}x`], locale);
    });
    assert.deepEqual(content.faq, []);
    content.highlights[0].title = "changed";
    content.benefits[0].text = "changed";
    assert.deepEqual({ host, home }, before, `${locale}: source locale objects stay unchanged`);
  }
});

test("missing localized copy fails instead of publishing a partial page or a fallback", () => {
  const { host, home } = copies.find(item => item.locale === "he");
  const fields = ["marketing.hero.title", "marketing.steps.s2x", "marketing.benefits.b6t", "metaDescription"];
  for (const field of fields) {
    const incomplete = structuredClone(host), path = field.split("."), key = path.pop();
    path.reduce((object, segment) => object[segment], incomplete)[key] = " ";
    assert.throws(() => getHostPageContent(incomplete, home), /Missing localized WIFIGATE Host copy/);
  }
  assert.throws(() => getHostPageContent(host, {}), /homepage\.automation\.imageAlt/);
});

test("Host details preserve translated sections, plan prices and actions inside their own style scope", async () => {
  const legacy = cheerio.load(await fs.readFile(new URL("../templates/guest-invites-api.template.html", import.meta.url), "utf8"));
  // The caller supplies the translated document; preserve those exact nodes.
  legacy(".wa-secure__text").first().text("פרטי האירוח המקומיים נשמרים בדיוק");
  legacy(".wa-pricing__note").text("Localized pricing note");
  const selectors = "section.wa-audience, section.wa-secure, section.wa-pricing, section.wa-cta";
  const expected = legacy(selectors).toArray().map(node => legacy(node).toString());
  const original = legacy.html();
  const $ = cheerio.load('<html><body class="niche-page"><header id="shared-header"></header><main class="niche-main"><section class="niche-hero"><h1>Shared video hero</h1></section><section id="niche-highlights"></section><section id="niche-benefits"></section></main><footer></footer></body></html>');
  appendHostMarketingDetails($, { legacyTemplate: legacy });
  const wrapper = $("#niche-benefits + .wa-page.host-marketing-details");
  assert.equal(wrapper.length, 1);
  assert.deepEqual(wrapper.children("section").toArray().map(node => $(node).toString()), expected);
  assert.deepEqual(wrapper.find(".wa-plan__amount").map((_, node) => $(node).text()).get(), legacy(".wa-plan__amount").map((_, node) => legacy(node).text()).get());
  assert.deepEqual(wrapper.find("a").map((_, node) => $(node).attr("href")).get(), legacy(selectors).find("a").map((_, node) => legacy(node).attr("href")).get());
  assert.equal($(".wa-page header, .wa-page .niche-hero, .wa-page .wa-how, .wa-page .wa-benefits, .wa-page footer").length, 0);
  assert.equal($("body").hasClass("wa-page"), false);
  assert.equal($("h1").length, 1);
  assert.equal(legacy.html(), original, "the localized source document is not consumed or modified");
  const appended = $.html();
  assert.throws(() => appendHostMarketingDetails($, { legacyTemplate: legacy }), /already present/);
  assert.equal($.html(), appended);
});

test("missing detail sections fail before changing the shared page", () => {
  const $ = cheerio.load('<main><section id="niche-benefits"></section></main>');
  const legacy = cheerio.load('<main><section class="wa-audience"></section><section class="wa-pricing"></section><section class="wa-cta"></section></main>');
  const original = $.html();
  assert.throws(() => appendHostMarketingDetails($, { legacyTemplate: legacy }), /\.wa-secure section/);
  assert.equal($.html(), original);
});

test("homepage Host points retain three ordered translation slots and their decorative SVGs", async () => {
  const $ = cheerio.load(await fs.readFile(new URL("../templates/index.template.html", import.meta.url), "utf8"));
  installHomeHostPointShells?.($);
  const rows = $('#wifigate-automation .guest-invites__points > li');
  assert.equal(rows.length, 3);
  const shapes = [['rect', 'path'], ['circle', 'path'], ['rect', 'path']];
  rows.each((index, node) => {
    const row = $(node), icon = row.find('.guest-invites__point-icon'), svg = icon.find('svg');
    assert.equal(row.attr('class'), 'guest-invites__point');
    assert.equal(icon.attr('aria-hidden'), 'true');
    assert.equal(svg.attr('viewBox'), '0 0 24 24');
    assert.equal(svg.attr('fill'), 'none'); assert.equal(svg.attr('stroke'), 'currentColor');
    assert.deepEqual(svg.children().toArray().map(shape => shape.tagName), shapes[index]);
    for (const [selector, key] of [['title', 'Title'], ['text', 'Text']]) {
      const text = row.find(`.guest-invites__point-${selector}`);
      assert.equal(text.length, 1);
      assert.equal(text.attr('data-i18n'), `guestInvites.promo.point${index + 1}${key}`);
      assert.equal(text.attr('dir'), 'ltr');
    }
  });
});

test("homepage point installation leaves documents without the Host list unchanged", () => {
  const $ = cheerio.load('<main><h1>Unrelated page</h1><ul class="guest-invites__points"><li>Other list</li></ul></main>');
  const original = $.html(); installHomeHostPointShells?.($); assert.equal($.html(), original);
});
