import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import * as cheerio from "cheerio";
import { HOST_PAGE_KEY, getHostPageContent, appendHostMarketingDetails, installHostPricingShells, installHostDetailShells, installSubscriptionFlow, installAudienceList, AUDIENCE_ART_VERSION } from "./host-marketing-page.mjs";
import { AUDIENCE_ART, AUDIENCE_ART_NAMES, AUDIENCE_ART_SIZE, audienceArtPath, renderAudienceArt } from "./audience-art.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { BENEFIT_ICONS } from "./benefit-icons.mjs";

// A step may mark its sign-in link as [[words]]; questions and answers always read as plain text.
const unmarked = text => text.replace(/\[\[(.+?)\]\]/g, "$1");

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
    assert.equal(content.faq.length, 8);
    content.faq.forEach((item, index) => {
      assert.equal(item.question, host.marketing.faq[`q${index + 1}`], locale);
      assert.equal(item.answer, unmarked(host.marketing.faq[`a${index + 1}`]), `${locale}: answer ${index + 1}`);
      assert.doesNotMatch(item.answer, /\[\[|\]\]/, `${locale}: no link markers in an answer`);
    });
    assert.match(host.marketing.pricing.note, /\$6/, `${locale}: the documented account minimum`);
    assert.deepEqual(content.audiences, home.automation.audiences, `${locale}: the localized customer types, ending open`);
    assert.notEqual(content.audiences, home.automation.audiences, `${locale}: a copy, not the source array`);
    assert.deepEqual(content.stepsHeading, { eyebrow: host.marketing.steps.eyebrow, title: host.marketing.steps.title, subtitle: host.marketing.steps.subtitle }, locale);
    assert.equal(content.benefitsEyebrow, host.marketing.benefits.eyebrow, locale);
    for (const key of ["title", "text", "button"]) assert.ok(host.marketing.shop[key]?.trim(), `${locale}: shop.${key}`);
    content.highlights[0].title = "changed";
    content.benefits[0].text = "changed";
    assert.deepEqual({ host, home }, before, `${locale}: source locale objects stay unchanged`);
  }
});

test("all 39 Manager locales supply the shared page layout with the Manager plans and photo", async () => {
  for (const { locale, home } of copies) {
    const manager = (await import(`./manager-page-copy/${locale}.mjs`)).default;
    const content = getHostPageContent(manager, home, "manager");
    assert.equal(content.label, "WIFIGATE Manager");
    assert.equal(content.eyebrow, "WIFIGATE Manager", locale);
    assert.equal(content.imageAlt, home.automation.manager.imageAlt, locale);
    assert.equal(content.highlights.length, 3);
    assert.equal(content.benefits.length, 6);
    content.benefits.forEach((item) => assert.ok(BENEFIT_ICONS[item.icon], `${locale}: existing benefit icon`));
    for (const plan of ["systems", "organizations", "example"]) {
      for (const key of ["Name", "Per", "Range", "Desc", "F1", "F2", "F3", "F4"]) assert.ok(manager.marketing.pricing[`${plan}${key}`]?.trim(), `${locale}: ${plan}${key}`);
    }
    assert.match(manager.marketing.pricing.exampleDesc, /\$1\.90/, `${locale}: the documented USD price`);
    assert.equal(content.faq.length, 8);
    content.faq.forEach((item, index) => {
      assert.equal(item.question, manager.marketing.faq[`q${index + 1}`], locale);
      assert.equal(item.answer, unmarked(manager.marketing.faq[`a${index + 1}`]), `${locale}: answer ${index + 1}`);
    });
    // An activated Manager subscription has a monthly minimum of one system, even with no linked system.
    for (const key of ["systemsF3", "note"]) assert.match(manager.marketing.pricing[key], /\$1\.90/, `${locale}: ${key} states the $1.90 minimum`);
    assert.match(manager.marketing.faq.a8, /\$1\.90/, `${locale}: the minimum answer`);
    assert.equal((manager.marketing.steps.s1x.match(/\[\[/g) || []).length, 1, `${locale}: one sign-in link in step 1`);
    assert.equal((manager.marketing.steps.s1x.match(/\]\]/g) || []).length, 1, `${locale}: one sign-in link in step 1`);
    assert.deepEqual(content.audiences, home.automation.manager.audiences, `${locale}: the localized customer types, ending open`);
    for (const key of ["title", "text", "button"]) assert.ok(manager.marketing.shop[key]?.trim(), `${locale}: shop.${key}`);
  }
  const $ = cheerio.load(await fs.readFile(new URL("../templates/guest-invites-api.template.html", import.meta.url), "utf8"));
  installHostDetailShells($, "manager");
  assert.deepEqual($(".wa-plan__amount").map((_, node) => $(node).text()).get(), ["$1.90", "$1", "$21"]);
  assert.deepEqual($(".wa-chip").map((_, node) => $(node).attr("data-i18n")).get(), ["residential", "offices", "sports", "parking"].map(key => `guestInvites.marketing.audience.${key}`));
});

test("missing localized copy fails instead of publishing a partial page or a fallback", () => {
  const { host, home } = copies.find(item => item.locale === "he");
  const fields = ["marketing.hero.title", "marketing.steps.s2x", "marketing.steps.subtitle", "marketing.benefits.b6t", "marketing.benefits.eyebrow", "marketing.faq.q3", "marketing.faq.a8", "metaDescription"];
  for (const field of fields) {
    const incomplete = structuredClone(host), path = field.split("."), key = path.pop();
    path.reduce((object, segment) => object[segment], incomplete)[key] = " ";
    assert.throws(() => getHostPageContent(incomplete, home), /Missing localized WIFIGATE Host copy/);
  }
  assert.throws(() => getHostPageContent(host, {}), /homepage\.automation\.imageAlt/);
  assert.throws(() => getHostPageContent(host, { automation: { imageAlt: "Alt", audiences: ["Hotels"] } }), /homepage\.automation\.audiences/, "a closed one-entry list is refused");
});

test("Host details preserve translated sections, plan prices and actions inside their own style scope", async () => {
  const legacy = cheerio.load(await fs.readFile(new URL("../templates/guest-invites-api.template.html", import.meta.url), "utf8"));
  installHostDetailShells(legacy);
  // The caller supplies the translated document; preserve those exact nodes.
  legacy(".wa-shop .wa-lead").text("פרטי האירוח המקומיים נשמרים בדיוק");
  legacy(".wa-pricing__note").text("Localized pricing note");
  const selectors = "section.wa-audience, section.wa-shop";
  const expected = legacy("section.wa-audience").toArray().map(node => legacy(node).toString());
  const expectedClosing = legacy("section.wa-shop").toArray().map(node => legacy(node).toString());
  const expectedPricing = legacy("section.wa-pricing").toString();
  const original = legacy.html();
  const $ = cheerio.load('<html><body class="niche-page"><header id="shared-header"></header><main class="niche-main"><section class="niche-hero"><h1>Shared video hero</h1></section><section id="niche-highlights"></section><section id="niche-benefits"></section><section id="niche-faq"></section></main><footer></footer></body></html>');
  assert.throws(() => appendHostMarketingDetails($, { legacyTemplate: legacy, shopHref: " " }), /locale shop link/);
  appendHostMarketingDetails($, { legacyTemplate: legacy, shopHref: "/he/shop/" });
  const wrapper = $("#niche-benefits + .wa-page.host-marketing-details");
  const pricing = $(".niche-hero + .wa-page.host-marketing-pricing");
  const closing = $("#niche-faq + .wa-page.host-marketing-closing");
  assert.equal(wrapper.length, 1);
  assert.equal(pricing.length, 1, "the plans come first, right under the hero");
  assert.equal(closing.length, 1, "the shop section closes the page after the questions");
  assert.deepEqual(wrapper.children("section").toArray().map(node => $(node).toString()), expected);
  assert.deepEqual(closing.find("a").map((_, node) => $(node).attr("href")).get(), ["/he/shop/", "../index.html#contact"], "the shop link points at the locale shop");
  closing.find(".wa-shop__link").attr("href", "../shop/index.html");
  assert.deepEqual(closing.children("section").toArray().map(node => $(node).toString()), expectedClosing, "apart from that link the localized nodes are preserved exactly");
  assert.deepEqual(pricing.children("section").toArray().map(node => $(node).toString()), [expectedPricing]);
  assert.deepEqual(pricing.find(".wa-plan__amount").map((_, node) => $(node).text()).get(), ["$6", "$5", "$4"]);
  assert.deepEqual($(".host-marketing-details a, .host-marketing-closing a").map((_, node) => $(node).attr("href")).get(), legacy(selectors).find("a").map((_, node) => legacy(node).attr("href")).get());
  closing.find(".wa-shop__link").attr("href", "/he/shop/");
  assert.equal($(".wa-page header, .wa-page .niche-hero, .wa-page .wa-how, .wa-page .wa-benefits, .wa-page footer").length, 0);
  assert.equal($("body").hasClass("wa-page"), false);
  assert.equal($("h1").length, 1);
  assert.equal(legacy.html(), original, "the localized source document is not consumed or modified");
  const appended = $.html();
  assert.throws(() => appendHostMarketingDetails($, { legacyTemplate: legacy }), /already present/);
  assert.equal($.html(), appended);
});

test("missing detail sections fail before changing the shared page", () => {
  const $ = cheerio.load('<main><section class="niche-hero"></section><section id="niche-benefits"></section><section id="niche-faq"></section></main>');
  const legacy = cheerio.load('<main><section class="wa-audience"></section><section class="wa-pricing"></section><section class="wa-cta"></section></main>');
  const original = $.html();
  assert.throws(() => appendHostMarketingDetails($, { legacyTemplate: legacy }), /\.wa-shop section/);
  assert.equal($.html(), original);
  const complete = cheerio.load('<main><section class="wa-audience"></section><section class="wa-pricing"></section><section class="wa-shop"></section></main>');
  const withoutQuestions = cheerio.load('<main><section class="niche-hero"></section><section id="niche-benefits"></section></main>'), unchanged = withoutQuestions.html();
  assert.throws(() => appendHostMarketingDetails(withoutQuestions, { legacyTemplate: complete }), /shared questions section/);
  assert.equal(withoutQuestions.html(), unchanged);
});

test("homepage For Business section numbers each plan and keeps the Host destination", async () => {
  const $ = cheerio.load(await fs.readFile(new URL("../templates/index.template.html", import.meta.url), "utf8"));
  const plans = $("#wifigate-for-business .business-plan");
  assert.deepEqual(plans.map((_, node) => $(node).find(".business-plan__name").text()).get(), ["WIFIGATE Host", "WIFIGATE Manager"]);
  assert.deepEqual(plans.map((_, node) => $(node).find(".business-plan__number").text()).get(), ["01", "02"]);
  assert.equal(plans.first().find(".guest-invites__cta").attr("href"), "/wifigate-host/");
  assert.equal(plans.last().find(".business-plan__cta").attr("href"), "/wifigate-manager/");
  // Each plan shows its shop card artwork: the WIFIGATE label and the plan letter, no photo.
  assert.deepEqual(plans.map((_, node) => $(node).find(".business-plan__art[aria-hidden='true'] .business-plan__art-letter").text()).get(), ["H", "M"]);
  // The artwork opens the same page as the CTA but stays out of the tab order and accessibility tree.
  assert.deepEqual(plans.map((_, node) => $(node).find("a.business-plan__art[tabindex='-1']").attr("href")).get(), ["/wifigate-host/", "/wifigate-manager/"]);
  assert.equal($("#wifigate-for-business img, #wifigate-for-business .automation-stay").length, 0);
  assert.equal($(".guest-invites__points, .automation-stay__steps").length, 0);
});

test("Host pricing preserves ordered offers, localization slots, feature icons and contact actions", async () => {
  const $ = cheerio.load(await fs.readFile(new URL("../templates/guest-invites-api.template.html", import.meta.url), "utf8"));
  const otherSections = $("section:not(.wa-pricing)").toString();
  const heading = $(".wa-pricing .wa-head").toString(), note = $(".wa-pricing__note").toString();
  installHostPricingShells($);
  const plans = $(".wa-pricing__grid > .wa-plan");
  assert.deepEqual(plans.find(".wa-plan__name").map((_, node) => $(node).text()).get(), ["START", "GROWTH", "SCALE"]);
  assert.deepEqual(plans.find(".wa-plan__amount").map((_, node) => $(node).text()).get(), ["$6", "$5", "$4"], "documented USD prices");
  assert.equal(plans.find(".wa-plan__amount[dir='ltr']").length, 3);
  assert.equal(plans.filter(".wa-plan--featured").length, 1);
  assert.equal(plans.eq(1).hasClass("wa-plan--featured"), true);
  assert.equal(plans.find(".wa-plan__badge").attr("data-i18n"), "guestInvites.marketing.pricing.badge");
  assert.equal(plans.find(".wa-plan__per").length, 3);
  for (const [index, key] of ["start", "growth", "scale"].entries()) {
    const plan = plans.eq(index);
    assert.equal(plan.find(".wa-plan__desc").attr("data-i18n"), `guestInvites.marketing.pricing.${key}Desc`);
    assert.equal(plan.find(".wa-plan__range").attr("data-i18n"), `guestInvites.marketing.pricing.${key}Range`);
    assert.deepEqual(plan.find(".wa-plan__feature span").map((_, node) => $(node).attr("data-i18n")).get(),
      [1, 2, 3, 4].map(number => `guestInvites.marketing.pricing.${key}F${number}`));
    plan.find(".wa-plan__feature svg").each((_, node) => {
      assert.deepEqual({ ...$(node).attr() }, { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none",
        stroke: "currentColor", "stroke-width": "2.5", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" });
      assert.equal($(node).find("path").attr("d"), "m5 12 5 5L20 7");
    });
    const action = plan.find(".wa-plan__cta > a");
    assert.equal(action.attr("href"), "../index.html#contact");
    assert.equal(action.attr("class"), `btn btn--${index === 1 ? "primary" : "ghost"}`);
    assert.equal(action.attr("data-i18n"), "guestInvites.marketing.pricing.planCta");
  }
  assert.equal($("section:not(.wa-pricing)").toString(), otherSections);
  assert.equal($(".wa-pricing .wa-head").toString(), heading);
  assert.equal($(".wa-pricing__note").toString(), note);
});

test("missing or ambiguous pricing slots fail before mutating the fragment", () => {
  for (const markup of ["<main>Other content</main>", '<section class="wa-pricing"><div class="wa-pricing__grid">First</div><div class="wa-pricing__grid">Second</div></section>']) {
    const $ = cheerio.load(markup), original = $.html();
    assert.throws(() => installHostPricingShells($), /requires one plan grid/);
    assert.equal($.html(), original);
  }
});

test("Host detail composition retains the ordered audience slot and the closing shop section", async () => {
  const $ = cheerio.load(await fs.readFile(new URL("../templates/guest-invites-api.template.html", import.meta.url), "utf8"));
  const contact = $(".wa-shop").toString(), headings = $(".wa-head").toString();
  installHostDetailShells($);
  assert.deepEqual($(".wa-chip").map((_, node) => $(node).attr("data-i18n")).get(),
    ["hotels", "rentals", "guesthouses", "parking"].map(key => `guestInvites.marketing.audience.${key}`));
  assert.deepEqual($(".wa-chip").map((_, node) => $(node).text()).get(),
    ["Hotels", "Airbnb & short-term rentals", "Guesthouses", "Rental parking & garages"]);
  assert.equal($(".wa-audience__label").attr("data-i18n"), "guestInvites.marketing.audience.label");
  assert.equal($(".wa-secure, .wa-cta").length, 0, "the questions replace the security band and the shop replaces the contact box");
  assert.equal($(".wa-plan").length, 3);
  assert.equal($(".wa-shop").toString(), contact);
  assert.deepEqual($(".wa-shop [data-i18n]").map((_, node) => $(node).attr("data-i18n")).get(),
    ["shop.title", "shop.text", "shop.button", "cta.button"].map(key => `guestInvites.marketing.${key}`));
  assert.deepEqual($(".wa-shop__actions a").map((_, node) => $(node).attr("href")).get(), ["../shop/index.html", "../index.html#contact"]);
  assert.equal($(".wa-head").toString(), headings);
});

test("all Host detail slots are checked before any list or pricing mutation", async () => {
  const markup = await fs.readFile(new URL("../templates/guest-invites-api.template.html", import.meta.url), "utf8");
  for (const selector of [".wa-audience__row", ".wa-pricing__grid"]) {
    for (const mode of ["missing", "duplicate"]) {
      const $ = cheerio.load(markup), slot = $(selector);
      if (mode === "missing") slot.remove(); else slot.after(slot.clone());
      const original = $.html();
      assert.throws(() => installHostDetailShells($), /Host details require one audience row/);
      assert.equal($.html(), original, `${selector}/${mode}: no partial mutation`);
    }
  }
});

test("the three steps ride one wave that follows the page direction, with localized headings", () => {
  const { host, home } = copies.find(item => item.locale === "he");
  const content = getHostPageContent(host, home);
  const shell = (direction = "rtl") => cheerio.load(`<html dir="${direction}"><body><main><section hidden id="niche-highlights" class="niche-highlights"><div class="container"><div id="niche-highlights-list"></div></div></section><section id="niche-benefits"><div class="niche-section__header"><h2>Benefits</h2></div></section><section id="niche-faq"><div id="niche-faq-list"><details></details><details></details></div></section></main></body></html>`);
  const $ = shell();
  installSubscriptionFlow($, { content, productName: "host", assetPrefix: "../../" });
  assert.deepEqual($("#niche-faq-list details").map((_, node) => $(node).attr("open") !== undefined).get(), [true, false], "the first question starts open");
  const section = $("#niche-highlights");
  assert.equal(section.attr("hidden"), undefined);
  assert.equal(section.attr("aria-labelledby"), "wa-flow-title");
  assert.ok(section.hasClass("wa-flow") && section.hasClass("wa-page"));
  assert.equal(section.find(".wa-head--center .wa-eyebrow").text(), host.marketing.steps.eyebrow);
  assert.equal(section.find("#wa-flow-title").text(), host.marketing.steps.title);
  assert.equal(section.find(".wa-head--center .wa-lead").text(), host.marketing.steps.subtitle);
  assert.equal(section.find("img.wa-flow__wave").attr("src"), "../../assets/img/subscription-flow/wave-rtl.svg");
  const steps = section.find("ol#niche-highlights-list > li.wa-flow__step");
  assert.equal(steps.length, 3);
  steps.each((index, node) => {
    assert.equal($(node).find("img.wa-flow__art").attr("src"), `../../assets/img/subscription-flow/host-${index + 1}.svg`);
    assert.equal($(node).find("img.wa-flow__art").attr("alt"), "", "decorative art stays out of the accessibility tree");
    assert.equal($(node).find("h3.wa-flow__title").text(), host.marketing.steps[`s${index + 1}t`]);
    assert.equal($(node).find("p.wa-flow__desc").text(), host.marketing.steps[`s${index + 1}x`]);
  });
  assert.equal($("#niche-benefits .niche-section__header > .wa-eyebrow").text(), host.marketing.benefits.eyebrow);
  // A step's [[words]] become the sign-in link; without a path they read as plain text.
  const linked = shell(), marked = { ...content, highlights: content.highlights.map((step, index) => index ? step : { ...step, text: "Export to [[the dashboard]], linked to your account." }) };
  installSubscriptionFlow(linked, { content: marked, loginHref: "/he/login/" });
  const first = linked(".wa-flow__desc").first();
  assert.equal(first.text(), "Export to the dashboard, linked to your account.");
  assert.deepEqual(first.find("a").map((_, node) => [linked(node).attr("href"), linked(node).text()]).get(), ["/he/login/", "the dashboard"]);
  const unlinked = shell();
  installSubscriptionFlow(unlinked, { content: marked });
  assert.equal(unlinked(".wa-flow__desc").first().text(), "Export to the dashboard, linked to your account.");
  assert.equal(unlinked(".wa-flow__desc a").length, 0);
  assert.throws(() => installSubscriptionFlow(shell(), { content: marked, loginHref: " " }), /sign-in link must be a path/);
  const ltr = shell("ltr");
  installSubscriptionFlow(ltr, { content, productName: "manager" });
  assert.equal(ltr("img.wa-flow__wave").attr("src"), "assets/img/subscription-flow/wave-ltr.svg");
  assert.equal(ltr("img.wa-flow__art").first().attr("src"), "assets/img/subscription-flow/manager-1.svg");
  for (const broken of [{ ...content, highlights: content.highlights.slice(0, 2) }, { ...content, stepsHeading: { ...content.stepsHeading, title: "" } }]) {
    const page = shell(), original = page.html();
    assert.throws(() => installSubscriptionFlow(page, { content: broken, direction: "rtl" }), /step flow requires/);
    assert.equal(page.html(), original, "no partial mutation");
  }
  const page = shell(), original = page.html();
  assert.throws(() => installSubscriptionFlow(page, { content, direction: "up" }), /Unknown step flow direction/);
  assert.equal(page.html(), original);
});

test("the audience row lists the localized customer types and always ends open", () => {
  const page = () => cheerio.load('<main><div class="wa-page host-marketing-details"><section class="wa-audience"><div class="container wa-audience__row"><span class="wa-audience__label">Built for:</span><span class="wa-chip">Old</span><span class="wa-chip">Chips</span></div></section></div></main>');
  const $ = page();
  installAudienceList($, { items: ["Homes", "Offices", "Sports", "Parking", "And more…"], productName: "manager", assetPrefix: "../" });
  assert.equal($(".wa-audience__row > .wa-chip").length, 0, "the fixed chips give way to the localized list");
  assert.equal($(".wa-audience__row > .wa-audience__label").text(), "Built for:");
  assert.deepEqual($("ul.wa-audience__list > li").map((_, node) => [[$(node).attr("class"), $(node).text()]]).get(),
    [["wa-chip", "Homes"], ["wa-chip", "Offices"], ["wa-chip", "Sports"], ["wa-chip", "Parking"], ["wa-chip wa-chip--more", "And more…"]]);
  // Every entry carries its own decorative drawing above its name; the row knows how many cards it holds.
  assert.equal($("ul.wa-audience__list").attr("data-count"), "5");
  assert.deepEqual($("ul.wa-audience__list > li > img.wa-chip__art + span.wa-chip__text").map((_, node) => $(node).prev().attr("src")).get(),
    AUDIENCE_ART.manager.map(name => `../${audienceArtPath(name)}?v=${AUDIENCE_ART_VERSION}`));
  for (const image of $("ul.wa-audience__list img").toArray()) {
    assert.deepEqual([$(image).attr("alt"), $(image).attr("loading"), $(image).attr("width"), $(image).attr("height")], ["", "lazy", String(AUDIENCE_ART_SIZE.width), String(AUDIENCE_ART_SIZE.height)]);
  }
  // A list that does not match the product's drawings leaves the page untouched.
  const uneven = page(), before = uneven.html();
  assert.throws(() => installAudienceList(uneven, { items: ["Hotels", "And more…"] }), /one drawing per entry/);
  assert.equal(uneven.html(), before);
  for (const items of [undefined, [], ["Only one"], ["Hotels", " "], ["Hotels", 5]]) {
    const broken = page(), original = broken.html();
    assert.throws(() => installAudienceList(broken, { items }), /audience list requires/);
    assert.equal(broken.html(), original, "no partial mutation");
  }
  const missing = cheerio.load("<main></main>"), original = missing.html();
  assert.throws(() => installAudienceList(missing, { items: ["Hotels", "And more…"] }), /one audience row/);
  assert.equal(missing.html(), original);
});

test("committed audience drawings are exactly what scripts/audience-art.mjs draws, one per localized entry", async () => {
  for (const name of AUDIENCE_ART_NAMES) {
    const committed = await fs.readFile(new URL(`../${audienceArtPath(name)}`, import.meta.url), "utf8");
    assert.equal(committed.replace(/\r\n/g, "\n"), renderAudienceArt(name), name);
  }
  for (const [product, list] of [["host", "audiences"], ["manager", "manager.audiences"]]) {
    assert.ok(AUDIENCE_ART[product].every(name => AUDIENCE_ART_NAMES.includes(name)), product);
    assert.equal(AUDIENCE_ART[product].at(-1), "more", "the open ending keeps its dashed drawing");
    // Every locale lists the same customer types in the same order as the drawings.
    for (const { locale, home } of copies) {
      const entries = list.split(".").reduce((value, key) => value?.[key], home.automation);
      assert.equal(entries?.length, AUDIENCE_ART[product].length, `${locale} ${product}`);
    }
  }
});
