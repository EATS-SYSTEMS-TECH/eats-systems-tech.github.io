import assert from "node:assert/strict";
import test from "node:test";
import { AUTO_OPEN_LOCAL_DRAWINGS, AUTO_OPEN_PAGE_KEY, AUTO_OPEN_PAGE_LEADS, getAutoOpenPageContent, validateAutoOpenPageLocales } from "./auto-open-page.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { featurePageFaq } from "./feature-page-faq.mjs";

const copies = Object.fromEntries(await Promise.all(SITE_LANGUAGES.map(async ({ code }) => [code, (await import(`./homepage-copy/${code}.mjs`)).default])));
const locales = SITE_LANGUAGES.map(({ code }) => code);

test("every supported locale has its own complete arrival-only page and preserves the existing localized feature", () => {
  assert.equal(AUTO_OPEN_PAGE_KEY, "auto-open");
  assert.equal(locales.length, 39);
  assert.deepEqual(validateAutoOpenPageLocales(locales, copies), []);
  for (const locale of locales) {
    const content = getAutoOpenPageContent(locale, copies[locale]), feature = copies[locale].platform.features[4];
    const lead = AUTO_OPEN_PAGE_LEADS[locale] ?? feature.text;
    assert.equal(content.label, feature.title);
    assert.equal(content.heroLead, lead);
    assert.equal(content.seoTitle, `${feature.title} | WIFIGATE`);
    assert.equal(content.seoDescription, lead);
    assert.equal(content.imageAlt, lead);
    assert.deepEqual(content.highlights.map(item => item.icon), AUTO_OPEN_LOCAL_DRAWINGS[locale] ?? ["handsfree", "arrival", "users"]);
    assert.ok(content.highlights.every(item => item.title.trim() && item.text.trim()));
    assert.deepEqual(content.benefits, []);
    // Questions come from scripts/feature-page-faq.mjs, only for the locales that have them.
    assert.deepEqual(content.faq, featurePageFaq(AUTO_OPEN_PAGE_KEY, locale));
  }
});

test("unsupported or incomplete locales cannot silently publish an English fallback", () => {
  assert.throws(() => getAutoOpenPageContent("zz", copies.en), /Missing Auto Open page locale/);
  assert.throws(() => getAutoOpenPageContent("toString", copies.en), /Missing Auto Open page locale/);
  assert.throws(() => getAutoOpenPageContent("he", {}), /Missing localized homepage Auto Open feature/);
  const substituted = structuredClone(copies);
  substituted.he.platform.features[4] = copies.en.platform.features[4];
  assert.ok(validateAutoOpenPageLocales(["he"], substituted).some(problem => /still the English text/.test(problem)));
  assert.ok(validateAutoOpenPageLocales(["zz"], copies).some(problem => /Missing Auto Open page locale/.test(problem)));
});

test("public hero, metadata and image descriptions reject implementation disclosures", () => {
  for (const detail of ["Bluetooth", "BLE", "radio", "detection", "trigger", "range", "encryption", "פרוטוקול", "הצפנה", "טווח"]) {
    const changed = structuredClone(copies);
    changed.he.platform.features[4].text += ` ${detail}`;
    assert.ok(validateAutoOpenPageLocales(["he"], changed).some(problem => /implementation details/.test(problem)), detail);
  }
});

test("returned page objects cannot mutate another locale or a later render", () => {
  const first = getAutoOpenPageContent("he", copies.he);
  first.highlights[0].title = "changed";
  first.faq.push({ question: "changed", answer: "changed" });
  const second = getAutoOpenPageContent("he", copies.he);
  assert.notEqual(second.highlights[0].title, "changed");
  assert.deepEqual(second.faq, featurePageFaq(AUTO_OPEN_PAGE_KEY, "he"));
});
