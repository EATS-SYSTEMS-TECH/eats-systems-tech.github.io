import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";
import { HOST_PAGE_KEY } from "./host-marketing-page.mjs";

const source = await readFile(new URL("./build-localized-site.mjs", import.meta.url), "utf8");
const declaration = name => source.match(new RegExp(`^async function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, "m"))?.[0];
const imported = source.includes('from "./niche-publication.mjs"') ? await import("./niche-publication.mjs") : {};

// Run the shipped page coordinators. Surrounding rendering is controlled here;
// full private generation separately verifies the real renderer and outputs.
function fixture({ definitions = [{ key: "one", legacyKeys: ["old", "older"] }], locales = ["en"], write, serializeError, scene = true, shellFailureAt } = {}) {
  const trace = [], writes = [], shell = [];
  const operation = (...entry) => { shell.push(entry); if (entry[0] === shellFailureAt) throw Error("shell " + shellFailureAt); };
  const dom = () => {
    const $ = () => ({ addClass(name) { operation("class", name); return this; }, remove() { return this; }, after() { return this; } });
    return $;
  };
  const boundary = {
    ...imported, NICHE_DEFINITIONS: definitions, nicheTemplatePath: "niche", guestInvitesTemplatePath: "host",
    guestInvitesPageKey: HOST_PAGE_KEY, HOST_PAGE_KEY, defaultLocale: "en", siteOrigin: "https://example.test", ORGANIZATION_ID: "org", BRAND_ID: "brand",
    nicheRuntimeScriptsToAdd: [], cheerio: { load: dom },
    async readHtmlTemplate(name) { trace.push(["template", name]); return name; },
    buildNicheContext(data, niche, locale) { trace.push(["context", locale, niche.key]); return { content: {}, chrome: {} }; },
    getBundle: () => ({}), setBodyDirection($, locale) { operation("direction", locale); $.__locale = locale; },
    rewriteStaticAssets($, locale, key) { operation("assets", locale, key); },
    appendScripts($, scripts, anchor, locale, key) { operation("scripts", anchor, locale, key); },
    applyNicheSceneMedia() {}, updateFooterStaticUi() {}, rewriteNicheInternalLinks() {}, setUseCaseMeta() {},
    updateNicheStaticUi($, ctx, niche) { $.__key = niche.key; },
    fillUseCaseBody($, values) { $.__key = values.pageKey; }, setUseCaseNavigation() {},
    buildAssetPrefix: () => "../", getNicheChrome: () => ({}),
    async loadHostPageCopy() { return { marketing: {}, metaDescription: "Host" }; },
    // Observe composition before translation within the publication fixture's
    // controlled DOM boundary; component checks cover the actual plan renderer.
    installHostPricingShells() { trace.push(["pricing"]); },
    getHostPageContent: () => ({}), applyDataI18nTranslations() { trace.push(["translation"]); },
    appendHostMarketingDetails() { trace.push(["details"]); },
    buildOutputFilePath(locale, key) { trace.push(["output", locale, key]); return `${locale}/${key}.html`; },
    buildPagePath(locale, key) { trace.push(["path", locale, key]); return `/${locale}/${key}/`; },
    buildPageUrl(locale, key) { trace.push(["url", locale, key]); return `https://example.test/${locale}/${key}/`; },
    serialize($) { trace.push(["serialize", $.__locale, $.__key]); if (serializeError) throw serializeError; return `page:${$.__locale}/${$.__key}`; },
    buildRedirectPage(path, url) { trace.push(["redirect", path, url]); return `redirect:${path}|${url}`; },
    async writeOutputFile(file, content) {
      trace.push(["begin", file]); if (write) await write(file, content);
      writes.push([file, content]); trace.push(["finish", file]);
    },
  };
  const sharedShell = source.match(/^function prepareUseCaseShell\([^\n]*\) \{[\s\S]*?^\}/m)?.[0] || "";
  const api = runInNewContext(sharedShell + "\n" + ["buildNichePages", "buildGuestInvitesPages"].map(declaration).join("\n") + "\n({buildNichePages,buildGuestInvitesPages});", boundary);
  const homeData = { localeOptions: locales.map(code => ({ code })), accessibilityCopy: {}, sceneMedia: new Map(scene ? [["hotels-airbnb", { poster: { path: "poster.webp" }, width: 1200, height: 630 }]] : []), homepageCopies: Object.fromEntries(locales.map(code => [code, { hero: { media: {} }, footer: {} }])) };
  return { trace, writes, shell, niches: () => api.buildNichePages(homeData), host: () => api.buildGuestInvitesPages(homeData) };
}

// Observe the real callers before and after consolidating their shared shell.
// Direction precedes an optional page skin; assets precede script insertion.
test("use-case shell preserves direction, page class, asset and script ordering", async () => {
  const niche = fixture({ locales: ["en", "he"] }); await niche.niches();
  assert.deepEqual(niche.shell, ["en", "he"].flatMap(locale => [
    ["direction", locale], ["assets", locale, "one"],
    ["scripts", "script[src*='js/accessibility.js']", locale, "one"],
  ]));
  const host = fixture(); await host.host();
  assert.deepEqual(host.shell.slice(0, 4), [["direction", "en"], ["class", "wifigate-host-page"],
    ["assets", "en", HOST_PAGE_KEY], ["scripts", "script[src*='js/accessibility.js']", "en", HOST_PAGE_KEY]]);
  assert.deepEqual(host.shell.slice(4), [["assets", "en", HOST_PAGE_KEY]]);
});

test("shell initialization failures stop at their original boundary before publication", async () => {
  for (const stage of ["direction", "class", "assets", "scripts"]) {
    const h = fixture({ shellFailureAt: stage });
    await assert.rejects(h.host(), new RegExp("shell " + stage));
    assert.equal(h.shell.at(-1)[0], stage); assert.deepEqual(h.writes, []);
    assert.equal(h.trace.some(([kind]) => kind === "serialize"), false);
  }
});

test("canonical niche pages precede aliases in definition/locale order across39 locales", async () => {
  const locales = SITE_LANGUAGES.map(({ code }) => code), f = fixture({ definitions: NICHE_DEFINITIONS, locales });
  const entries = await f.niches(), expected = [], sitemap = [];
  for (const niche of NICHE_DEFINITIONS) for (const locale of locales) {
    expected.push([`${locale}/${niche.key}.html`, `page:${locale}/${niche.key}`]);
    for (const alias of niche.legacyKeys || []) expected.push([`${locale}/${alias}.html`, `redirect:/${locale}/${niche.key}/|https://example.test/${locale}/${niche.key}/`]);
    sitemap.push({ loc: `https://example.test/${locale}/${niche.key}/`, changefreq: "monthly", priority: "0.8" });
  }
  assert.deepEqual(f.writes, expected); assert.deepEqual(JSON.parse(JSON.stringify(entries)), sitemap);
  assert.deepEqual(f.trace.filter(([kind]) => kind === "template"), [["template", "niche"]]);
  for (let i = 0; i < f.trace.length; i++) if (f.trace[i][0] === "begin") assert.equal(f.trace[i + 1][0], "finish");
});

test("canonical completion precedes alias discovery;every alias is awaited before the next", async () => {
  const pending = [], niche = { key: "one", legacyKeys: ["before"] };
  const f = fixture({ definitions: [niche], write: file => new Promise(resolve => pending.push({ file, resolve })) });
  const result = f.niches(); await new Promise(setImmediate);
  assert.deepEqual(pending.map(p => p.file), ["en/one.html"]); assert.deepEqual(f.writes, []);
  niche.legacyKeys = ["after", "last"]; pending[0].resolve(); await new Promise(setImmediate);
  assert.deepEqual(pending.map(p => p.file), ["en/one.html", "en/after.html"]);
  assert.equal(f.trace.filter(([kind]) => kind === "url").length, 1);
  pending[1].resolve(); await new Promise(setImmediate);
  assert.equal(pending[2].file, "en/last.html"); pending[2].resolve();
  assert.equal((await result).length, 1); assert.deepEqual(f.writes.map(([file]) => file), ["en/one.html", "en/after.html", "en/last.html"]);
  assert.deepEqual(f.trace.at(-1), ["url", "en", "one"]);
});

test("render and write failures reject unchanged,retaining only already completed outputs", async () => {
  const failure = Error("expected output failure");
  for (const failFile of ["en/one.html", "en/old.html", "en/older.html"]) {
    const f = fixture({ write: file => { if (file === failFile) throw failure; } });
    await assert.rejects(f.niches(), error => error === failure);
    const paths = ["en/one.html", "en/old.html", "en/older.html"];
    assert.deepEqual(f.writes.map(([file]) => file), paths.slice(0, paths.indexOf(failFile)));
    assert.deepEqual(f.trace.at(-1), ["begin", failFile]);
  }
  const f = fixture({ serializeError: failure }); await assert.rejects(f.niches(), error => error === failure);
  assert.deepEqual(f.writes, []); assert.deepEqual(f.trace.at(-1), ["serialize", "en", "one"]);
});

test("Host emits the two historical aliases directly to each localized canonical and excludes them from sitemap", async () => {
  const f = fixture({ locales: ["en", "he"] }), entries = await f.host();
  assert.deepEqual(f.trace.filter(([kind]) => ["pricing", "translation", "details"].includes(kind)),
    ["en", "he"].flatMap(() => [["pricing"], ["translation"], ["details"]]));
  const expected = [];
  for (const locale of ["en", "he"]) {
    expected.push([`${locale}/${HOST_PAGE_KEY}.html`, `page:${locale}/${HOST_PAGE_KEY}`]);
    for (const alias of ["automation", "Automated-Guest-Invites-API"]) expected.push([`${locale}/${alias}.html`, `redirect:/${locale}/${HOST_PAGE_KEY}/|https://example.test/${locale}/${HOST_PAGE_KEY}/`]);
  }
  assert.deepEqual(f.writes, expected);
  assert.deepEqual(JSON.parse(JSON.stringify(entries)), ["en", "he"].map(locale => ({ loc: `https://example.test/${locale}/${HOST_PAGE_KEY}/`, changefreq: "monthly", priority: "0.9" })));
  const absent = fixture({ scene: false }); await assert.rejects(absent.host(), /Accepted hospitality media/); assert.deepEqual(absent.writes, []);
});
