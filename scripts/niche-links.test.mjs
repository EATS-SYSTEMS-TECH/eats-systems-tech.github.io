import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import * as cheerio from "cheerio";

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
