import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import * as cheerio from "cheerio";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const source = await readFile(new URL("./build-localized-site.mjs", import.meta.url), "utf8");
const declaration = source.match(/^function rewriteNicheInternalLinks\([^\n]*\) \{[\s\S]*?^\}/m)?.[0];
assert.ok(declaration, "the generator keeps its internal-link orchestration");
const helper = source.includes('from "./niche-links.mjs"')
  ? (await import("./niche-links.mjs")).rewriteNicheHomeAnchors : undefined;

function fixture(markup, locale) {
  const $ = cheerio.load(markup);
  let footerCalls = 0;
  const path = (language, key) => `/${language}/${key === "home" ? "" : key + "/"}`;
  const rewrite = runInNewContext(declaration + "\nrewriteNicheInternalLinks;", {
    buildPagePath: path, HOST_PAGE_KEY: "host", rewriteNicheHomeAnchors: helper,
    rewriteFooterLegalLinks(dom, language) {
      footerCalls++;
      dom("a[data-footer]").attr("href", path(language, "automation"));
    },
  });
  rewrite($, locale);
  return { $, footerCalls, path };
}

test("localized home anchors retain fragments and the original prefix matching behavior", () => {
  for (const locale of ["en", "he", "fr"]) {
    const f = fixture(`<a id="plain" href="../index.html">Home</a>
      <a id="fragment" href="../index.html#contact">Contact</a>
      <a id="query" href="../index.html?source=old#part?x=1">Query</a>
      <a id="encoded" href="../index.html?next=%23value">Encoded</a>
      <a id="prefix" href="../index.html-old#retained">Prefix</a>`, locale);
    assert.equal(f.$("#plain").attr("href"), `/${locale}/`);
    assert.equal(f.$("#fragment").attr("href"), `/${locale}/#contact`);
    assert.equal(f.$("#query").attr("href"), `/${locale}/#part?x=1`);
    assert.equal(f.$("#encoded").attr("href"), `/${locale}/`);
    assert.equal(f.$("#prefix").attr("href"), `/${locale}/#retained`);
    assert.equal(f.footerCalls, 1);
  }
});

test("unrelated URLs and non-href attributes remain literal", () => {
  const f = fixture(`<a id="external" href="https://example.test/../index.html#contact" target="_blank" rel="noreferrer">External</a>
    <a id="relative" href="./index.html#contact">Relative</a><a id="root" href="/index.html#contact">Root</a>
    <a id="none">No URL</a><div id="other" href="../index.html">Other tag</div>`, "he");
  assert.equal(f.$("#external").attr("href"), "https://example.test/../index.html#contact");
  assert.equal(f.$("#external").attr("target"), "_blank");
  assert.equal(f.$("#external").attr("rel"), "noreferrer");
  assert.equal(f.$("#relative").attr("href"), "./index.html#contact");
  assert.equal(f.$("#root").attr("href"), "/index.html#contact");
  assert.equal(f.$("#none").attr("href"), undefined);
  assert.equal(f.$("#other").attr("href"), "../index.html");
});

test("legacy Host mapping remains exact and runs after footer rewriting", () => {
  const f = fixture(`<a id="legacy" href="/he/automation/">Old Host</a>
    <a id="query" href="/he/automation/?keep=1">Query</a>
    <a id="hash" href="/he/automation/#keep">Hash</a>
    <a id="footer" data-footer href="../index.html#legal">Footer</a>`, "he");
  assert.equal(f.$("#legacy").attr("href"), "/he/host/");
  assert.equal(f.$("#query").attr("href"), "/he/automation/?keep=1");
  assert.equal(f.$("#hash").attr("href"), "/he/automation/#keep");
  assert.equal(f.$("#footer").attr("href"), "/he/host/");
  assert.equal(f.footerCalls, 1);
});

// Legal pages share the legacy relative-home spelling but retain a different
// footer/body rewrite sequence. Exercise the actual generator entry directly.
const legalDeclaration = source.match(/^function rewriteLegalInternalLinks\([^\n]*\) \{[\s\S]*?^\}/m)?.[0];
assert.ok(legalDeclaration);
function legalFixture(markup, locale, { home, failBody } = {}) {
  const $ = cheerio.load(markup), events = [];
  const path = (language, key) => {
    events.push(['path', key]);
    if (key === failBody) throw Error('fixture path failure');
    return key === 'home' ? home ?? `/${language}/` : `/${language}/${key}/`;
  };
  const rewrite = runInNewContext(legalDeclaration + '\nrewriteLegalInternalLinks;', {
    buildPagePath: path, rewriteNicheHomeAnchors: helper,
    rewriteFooterLegalLinks(dom) {
      events.push(['footer', dom('#fragment').attr('href')]);
      dom('#footer').attr('href', '../cookies/');
    },
  });
  return { $, events, run: () => rewrite($, locale, 'privacy-policy') };
}

test('legal links localize literal home fragments and body paths in all39 locales', () => {
  const locales = SITE_LANGUAGES.map(({ code }) => code);
  assert.equal(locales.length, 39);
  for (const locale of locales) {
    const f = legalFixture(`<a id="plain" href="../index.html">Home</a>
      <a id="fragment" href="../index.html?source=old#contact?keep=1">Contact</a>
      <a id="prefix" href="../index.html-other#literal">Old</a><a id="encoded" href="../index.html?next=%23hash">Encoded</a>
      <a id="terms" href="../terms-and-conditions/">Terms</a><a id="privacy" href="../privacy-policy/">Privacy</a>
      <a id="footer" href="unused">Footer</a><a id="external" href="https://example.test/../index.html#x" target="_blank">Other</a>
      <a id="btn" class="btn btn--ghost" href="../index.html#btn">Button</a><a id="none">No URL</a>`, locale);
    f.run();
    assert.equal(f.$('#plain').attr('href'), `/${locale}/`);
    assert.equal(f.$('#fragment').attr('href'), `/${locale}/#contact?keep=1`);
    assert.equal(f.$('#prefix').attr('href'), `/${locale}/#literal`);
    assert.equal(f.$('#encoded').attr('href'), `/${locale}/`);
    assert.equal(f.$('#terms').attr('href'), `/${locale}/terms-and-conditions/`);
    assert.equal(f.$('#privacy').attr('href'), `/${locale}/privacy-policy/`);
    assert.equal(f.$('#footer').attr('href'), `/${locale}/cookies/`);
    assert.equal(f.$('#external').attr('href'), 'https://example.test/../index.html#x');
    assert.equal(f.$('#external').attr('target'), '_blank');
    assert.equal(f.$('#none').attr('href'), undefined);
    assert.equal(f.$('#btn').attr('href'), `/${locale}/#btn`);
    assert.deepEqual(f.events.map(([kind]) => kind), ['path', 'footer', 'path', 'path', 'path']);
    assert.equal(f.events[1][1], `/${locale}/#contact?keep=1`);
  }
});

test('legal exact-home pass precedes prefix processing even for a legacy-shaped destination', () => {
  const f = legalFixture('<a id="plain" href="../index.html">Home</a><a id="fragment" href="../index.html#part">Part</a>', 'he', { home: '../index.html?new#base' });
  f.run();
  assert.equal(f.$('#plain').attr('href'), '../index.html?new#base#base');
  assert.equal(f.$('#fragment').attr('href'), '../index.html?new#base#part');
});

test('legal path failure retains earlier home/footer/body writes and propagates immediately', () => {
  const f = legalFixture('<a id="fragment" href="../index.html#contact">Home</a><a id="terms" href="../terms-and-conditions/">Terms</a><a id="privacy" href="../privacy-policy/">Privacy</a><a id="footer">Footer</a>', 'he', { failBody: 'privacy-policy' });
  assert.throws(f.run, /fixture path failure/);
  assert.equal(f.$('#fragment').attr('href'), '/he/#contact');
  assert.equal(f.$('#terms').attr('href'), '/he/terms-and-conditions/');
  assert.equal(f.$('#privacy').attr('href'), '../privacy-policy/');
  assert.equal(f.$('#footer').attr('href'), '../cookies/');
  assert.deepEqual(f.events.map(row => row[0]), ['path', 'footer', 'path', 'path']);
});
