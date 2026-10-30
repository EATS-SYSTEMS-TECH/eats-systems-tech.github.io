import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { load } from "cheerio";
import { chromium } from "playwright-core";
import { NICHE_DEFINITIONS, NICHE_PAGE_LOCALES } from "./niche-pages/index.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const source = await readFile(new URL("./build-localized-site.mjs", import.meta.url), "utf8");
const declaration = name => source.match(new RegExp(`^function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, "m"))?.[0];
const imported = source.includes('from "./niche-navigation.mjs"') ? await import("./niche-navigation.mjs") : {};
const template = await readFile(new URL("../templates/niche.template.html", import.meta.url), "utf8");

test("pager shells preserve fallback routes, public IDs and accessible decorative arrows", () => {
  const $ = load(template), breadcrumb = $(".niche-breadcrumb").toString();
  imported.installUseCasePagerShells($);
  const expected = [
    ["prev", "../sports-facilities/", "Previous use case", "M14.5 5L8 12L14.5 19"],
    ["next", "../roller-shutters/", "Next use case", "M9.5 5L16 12L9.5 19"],
  ];
  assert.equal($(".niche-hero__pager > a").length, 2);
  for (const [direction, href, label, path] of expected) {
    const anchor = $(`#niche-${direction}-link`), svg = anchor.find("svg");
    assert.equal(anchor.attr("href"), href);
    assert.equal(anchor.attr("class"), `niche-hero__nav-button niche-hero__nav-button--${direction}`);
    assert.equal(anchor.attr("aria-label"), label); assert.equal(anchor.attr("title"), label);
    assert.deepEqual({ ...svg.attr() }, { class: "niche-hero__nav-icon", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" });
    assert.equal(svg.find("path").attr("d"), path);
  }
  assert.equal($(".niche-breadcrumb").toString(), breadcrumb);
});

test("invalid pager slots fail before any content replacement", () => {
  for (const markup of ["<main>Other page</main>", '<main><div class="niche-hero__pager">First</div><div class="niche-hero__pager">Second</div></main>']) {
    const $ = load(markup), original = $.html();
    assert.throws(() => imported.installUseCasePagerShells($), /requires one pager/);
    assert.equal($.html(), original);
  }
});

// Exercise the original page orchestration with real Cheerio nodes and actual
// locale data. Only the surrounding body renderer/path builder are boundaries.
function fixture(definitions = NICHE_DEFINITIONS, options = {}) {
  const trace = [], $ = load(template);
  imported.installUseCasePagerShells($);
  const pathFor = (locale, key) => `/${locale}/${key}/`;
  const functions = ["getCircularAdjacentNiches", "setUseCaseNavigation", "updateNicheStaticUi"].map(declaration).join("\n");
  const api = runInNewContext(functions + "\n({getCircularAdjacentNiches,updateNicheStaticUi});", {
    ...imported, NICHE_DEFINITIONS: definitions, defaultLocale: "en",
    getNichePageContent(locale) { trace.push(["copy", locale]); if (options.copyError) throw options.copyError; return (options.copy ?? NICHE_PAGE_LOCALES)[locale]; },
    fillUseCaseBody(dom, values) { trace.push(["body", values]); dom("#niche-title").text("Body installed"); },
    buildPagePath(locale, key) {
      trace.push(["path", locale, key]); if (key === options.failPath) throw Error("path failed"); return pathFor(locale, key);
    },
  });
  const render = (key, locale = "he") => api.updateNicheStaticUi($, {
    chrome: { homeLabel: "Localized home" }, content: { label: "Current label" },
  }, { key, image: { hero: "fixture.webp" } }, locale, { label: "accessibility" });
  return { ...api, $, trace, render, pathFor };
}

test("circular neighbors retain first strict match, wraparound, empty/missing and single-item behavior", () => {
  const first = { key: "a" }, duplicate = { key: "a" }, last = { key: "last" };
  const f = fixture([first, duplicate, last]);
  const a = f.getCircularAdjacentNiches("a"), end = f.getCircularAdjacentNiches("last");
  assert.equal(a.previous, last); assert.equal(a.next, duplicate);
  assert.equal(end.previous, duplicate); assert.equal(end.next, first);
  assert.equal(f.getCircularAdjacentNiches("absent"), null);
  assert.equal(fixture([]).getCircularAdjacentNiches("a"), null);
  const single = fixture([first]).getCircularAdjacentNiches("a"); assert.equal(single.previous, first); assert.equal(single.next, first);
  assert.equal(fixture([{ key: 7 }]).getCircularAdjacentNiches("7"), null);
});

test("all39 locales preserve neighbor labels, URLs, breadcrumb text and surrounding body ordering", () => {
  for (const { code } of SITE_LANGUAGES) for (const niche of NICHE_DEFINITIONS) {
    const f = fixture(); f.render(niche.key, code);
    const adjacent = f.getCircularAdjacentNiches(niche.key);
    for (const [selector, item] of [["#niche-prev-link", adjacent.previous], ["#niche-next-link", adjacent.next]]) {
      const label = NICHE_PAGE_LOCALES[code]?.niches?.[item.key]?.label || NICHE_PAGE_LOCALES.en?.niches?.[item.key]?.label || item.key;
      assert.equal(f.$(selector).attr("href"), f.pathFor(code, item.key));
      assert.equal(f.$(selector).attr("aria-label"), label); assert.equal(f.$(selector).attr("title"), label);
    }
    assert.equal(f.$("#niche-breadcrumb-home").text(), "Localized home"); assert.equal(f.$("#niche-breadcrumb-current").text(), "Current label");
    assert.deepEqual(f.trace.map(([name]) => name), ["copy", "copy", "body", "path", "path"]);
  }
});

test("label fallback retains truthiness and unknown pages leave the original pager untouched", () => {
  const f = fixture([{ key: "previous" }, { key: "current" }, { key: "next" }], {
    copy: { he: { niches: { previous: { label: "" }, next: { label: 0 } } }, en: { niches: { previous: { label: "English & label" } } } },
  });
  f.render("current");
  assert.equal(f.$("#niche-prev-link").attr("title"), "English & label"); assert.equal(f.$("#niche-next-link").attr("title"), "next");
  const unknown = fixture(); const previous = unknown.$("#niche-prev-link").toString(), next = unknown.$("#niche-next-link").toString();
  unknown.render("unknown");
  assert.equal(unknown.$("#niche-prev-link").toString(), previous); assert.equal(unknown.$("#niche-next-link").toString(), next);
  assert.deepEqual(unknown.trace.map(([name]) => name), ["copy", "copy", "body"]);
});

test("copy errors precede body changes;next-path errors retain the already installed previous link", () => {
  const error = Error("copy unavailable"), f = fixture(undefined, { copyError: error }), original = f.$.html();
  assert.throws(() => f.render("hotels-airbnb"), value => value === error); assert.equal(f.$.html(), original);
  const paths = fixture([{ key: "previous" }, { key: "current" }, { key: "next" }], { failPath: "next", copy: { he: {}, en: {} } });
  const next = paths.$("#niche-next-link").toString();
  assert.throws(() => paths.render("current"), /path failed/);
  assert.equal(paths.$("#niche-prev-link").attr("href"), "/he/previous/");
  assert.equal(paths.$("#niche-prev-link").attr("title"), "previous"); assert.equal(paths.$("#niche-next-link").toString(), next);
  assert.equal(paths.$("#niche-breadcrumb-current").text(), "Current label");
});

test("hero pager retains768px sizing, RTL icons and pointer/keyboard contrast", async () => {
  const styles = await readFile(new URL("../css/styles.css", import.meta.url), "utf8");
  const niche = await readFile(new URL("../css/niche.css", import.meta.url), "utf8");
  const $ = load(template);
  imported.installUseCasePagerShells($);
  const topbar = $.html($(".niche-hero__topbar"));
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const width of [375, 768, 769, 1440]) for (const dir of ["ltr", "rtl"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.route("**/*", route => route.abort());
        await page.setContent(`<html dir="${dir}"><head><style>${styles}\n${niche}</style></head><body class="niche-page"><section class="niche-hero"><div class="niche-hero__content container">${topbar}</div></section></body></html>`);
        const button = page.locator("#niche-prev-link"), icon = button.locator("svg");
        const geometry = await button.evaluate(el => { const css = getComputedStyle(el); return [parseFloat(css.width), parseFloat(css.height), css.transitionDuration]; });
        for (const size of geometry.slice(0, 2)) assert.ok(Math.abs(size - (width <= 768 ? 41.6 : 46.4)) < .02, `${width}/${dir}`);
        assert.equal(geometry[2], "0.18s, 0.18s");
        assert.equal(await icon.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).m11), dir === "rtl" ? -1 : 1);
        // The two transitions round at different frames; wait for both final
        // paint values before checking the accessible keyboard/pointer state.
        const settled = () => page.waitForFunction(() => {
          const css = getComputedStyle(document.querySelector("#niche-prev-link"));
          return css.backgroundColor === "rgba(10, 10, 10, 0.55)" && css.borderTopColor === "rgb(255, 255, 255)";
        });
        await button.hover(); await settled();
        await page.mouse.move(width - 1, 899); await page.locator("#niche-breadcrumb-home").focus(); await page.keyboard.press("Tab"); await settled();
        assert.equal(await button.evaluate(el => el.matches(":focus-visible")), true);
        assert.equal(await button.evaluate(el => getComputedStyle(el).borderTopColor), "rgb(255, 255, 255)");
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});
