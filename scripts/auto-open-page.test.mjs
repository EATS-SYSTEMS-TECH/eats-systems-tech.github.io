import assert from "node:assert/strict";
import test from "node:test";
import { AUTO_OPEN_PAGE_KEY, getAutoOpenPageContent, validateAutoOpenPageLocales } from "./auto-open-page.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const copies = Object.fromEntries(await Promise.all(SITE_LANGUAGES.map(async ({ code }) => [code, (await import(`./homepage-copy/${code}.mjs`)).default])));
const locales = SITE_LANGUAGES.map(({ code }) => code);

test("every supported locale has its own complete arrival-only page and preserves the existing localized feature", () => {
  assert.equal(AUTO_OPEN_PAGE_KEY, "auto-open");
  assert.equal(locales.length, 39);
  assert.deepEqual(validateAutoOpenPageLocales(locales, copies), []);
  for (const locale of locales) {
    const content = getAutoOpenPageContent(locale, copies[locale]), feature = copies[locale].platform.features[4];
    assert.equal(content.label, feature.title);
    assert.equal(content.heroLead, feature.text);
    assert.equal(content.seoTitle, `${feature.title} | WIFIGATE`);
    assert.equal(content.seoDescription, feature.text);
    assert.equal(content.imageAlt, feature.text);
    assert.deepEqual(content.highlights, []);
    assert.deepEqual(content.benefits.map(item => item.icon), ["smartphone", "clock", "user-check"]);
    assert.ok(content.benefits.every(item => item.title.trim() && item.text.trim()));
    assert.deepEqual(content.faq, []);
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
  first.benefits[0].title = "changed";
  first.faq.push({ question: "changed", answer: "changed" });
  const second = getAutoOpenPageContent("he", copies.he);
  assert.notEqual(second.benefits[0].title, "changed");
  assert.deepEqual(second.faq, []);
});
