import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import * as cheerio from "cheerio";

// Isolate original pure functions rather than importing the writing pipeline.
const source = await readFile(new URL("./build-localized-site.mjs", import.meta.url), "utf8");
const declaration = source.match(/^function buildRedirectPage\([^\n]*\) \{[\s\S]*?^\}/m)?.[0];
const trailing = source.match(/^function ensureTrailingNewline\([^\n]*\) \{[\s\S]*?^\}/m)?.[0];
const render = declaration
  ? runInNewContext(trailing + "\n" + declaration + "\nbuildRedirectPage;")
  : (await import("./redirect-page.mjs")).buildRedirectPage;

test("redirect aliases agree across canonical, refresh, JavaScript and fallback navigation", () => {
  for (const locale of ["en", "he", "fr", "ar"]) {
    const target = `/${locale}/hotels-airbnb/`;
    const canonical = `https://wifigate.io${target}`;
    const output = render(target, canonical), $ = cheerio.load(output);
    assert.equal($("html").attr("lang"), "en");
    assert.equal($("meta[charset]").attr("charset"), "UTF-8");
    assert.equal($("title").text(), "Redirecting...");
    assert.equal($("link[rel=canonical]").attr("href"), canonical);
    assert.equal($("meta[http-equiv=refresh]").attr("content"), `0; url=${target}`);
    const visits = [];
    runInNewContext($("script").text(), { window: { location: { replace: (value) => visits.push(value) } } });
    assert.deepEqual(visits, [target]);
    assert.equal($("body a").attr("href"), target);
    assert.equal($("body a").text(), target);
    assert.equal($("script[src]").length, 0);
    assert.ok(output.startsWith("<!DOCTYPE html>\n"));
    assert.ok(output.endsWith("</html>\n"));
    assert.equal(output.endsWith("\n\n"), false);
  }
});

test("existing query and fragment strings remain literal through all redirect channels", () => {
  const target = "/he/hotels-airbnb/?from=legacy&lang=he#entry";
  const $ = cheerio.load(render(target, "https://wifigate.io/he/hotels-airbnb/"));
  const visits = [];
  runInNewContext($("script").text(), { window: { location: { replace: (value) => visits.push(value) } } });
  assert.deepEqual(visits, [target]);
  assert.equal($("meta[http-equiv=refresh]").attr("content"), `0; url=${target}`);
  assert.equal($("body a").attr("href"), target);
});
