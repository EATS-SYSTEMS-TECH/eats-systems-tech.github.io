// scripts/verify-site.mjs
// Post-build QA for the generated site. Run after `npm run build:locales`:
//   node scripts/verify-site.mjs
// Exits non-zero and lists every problem found. Checks, per locale:
//   - home + niche pages exist, have a single H1, unique title/description,
//     correct canonical, full hreflang cluster, index robots, lang/dir
//   - internal links and image references resolve to files on disk
//   - legacy niche routes exist and redirect to the right target
//   - sitemap entries resolve to generated pages
//   - no leftover "undefined" text in rendered pages
//   - invitation redirects preserve opaque protocol query parameters

import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";

const repoRoot = process.cwd();
const siteOrigin = "https://wifigate.io";
const problems = [];

const localeOptions = [
  "en", "es", "fr", "de", "he", "nl", "it", "pt", "pl", "no", "cs", "ru", "uk",
  "tr", "ar", "hi", "bn", "mr", "te", "zh-Hans", "zh-Hant", "ja", "ko", "da", "sv", "hu",
  "el", "ro", "hr", "fi", "bg", "sr", "sk", "sl", "id", "th", "vi", "ms", "fil",
];
const rtlLocales = new Set(["he", "ar"]);
const nicheKeys = NICHE_DEFINITIONS.map((n) => n.key);
const indexablePages = ["home", "automation", ...nicheKeys];
const interactivePages = [
  "home",
  "automation",
  ...nicheKeys,
  "cookies",
  "privacy-policy",
  "terms-and-conditions",
];

function pageSegments(locale, pageKey) {
  const segments = [];
  if (locale !== "en") segments.push(locale.toLowerCase());
  if (pageKey !== "home") segments.push(pageKey);
  return segments;
}

function pagePath(locale, pageKey) {
  const segments = pageSegments(locale, pageKey);
  return segments.length ? `/${segments.join("/")}/` : "/";
}

function pageFile(locale, pageKey) {
  return path.join(repoRoot, ...pageSegments(locale, pageKey), "index.html");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function resolveLinkTarget(fromFile, href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return null; // pure fragment/query
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.startsWith("//")) return null; // external
  const base = clean.startsWith("/") ? repoRoot : path.dirname(fromFile);
  let target = path.resolve(base, "." + (clean.startsWith("/") ? clean : `/${clean}`));
  if (clean.endsWith("/")) target = path.join(target, "index.html");
  return target;
}

async function checkResolvable($, fromFile, selector, attr, label) {
  for (const element of $(selector).toArray()) {
    const value = $(element).attr(attr);
    if (!value) continue;
    const target = resolveLinkTarget(fromFile, value);
    if (!target) continue;
    if (!(await fileExists(target))) {
      problems.push(`${path.relative(repoRoot, fromFile)}: broken ${label} "${value}"`);
    }
  }
}

async function main() {
  const titlesByLocale = new Map();
  const descriptionsByLocale = new Map();
  const invitationTemplatePath = path.join(
    repoRoot,
    "templates",
    "wifigate-link.template.html",
  );
  const invitationTemplate = await fs.readFile(invitationTemplatePath, "utf8");
  const queryPassThroughCount = (
    invitationTemplate.match(/const query = params\.toString\(\);/g) || []
  ).length;

  if (queryPassThroughCount !== 3) {
    problems.push(
      `templates/wifigate-link.template.html: found ${queryPassThroughCount} query pass-through routes, expected 3`,
    );
  }
  if (/params\.delete\(["'](?:ep|ao)["']\)/.test(invitationTemplate)) {
    problems.push(
      "templates/wifigate-link.template.html: invitation protocol fields ep/ao must pass through unchanged",
    );
  }

  for (const locale of localeOptions) {
    for (const pageKey of indexablePages) {
      const filePath = pageFile(locale, pageKey);
      const rel = path.relative(repoRoot, filePath);

      if (!(await fileExists(filePath))) {
        problems.push(`${locale}/${pageKey}: page not generated (${rel})`);
        continue;
      }

      const html = await fs.readFile(filePath, "utf8");
      const $ = cheerio.load(html);

      const title = $("title").text().trim();
      const description = $("meta[name='description']").attr("content")?.trim() || "";
      const canonical = $("link[rel='canonical']").attr("href") || "";
      const robots = $("meta[name='robots']").attr("content") || "";
      const lang = $("html").attr("lang") || "";
      const dir = $("html").attr("dir") || "";
      const h1Count = $("h1").length;
      const hreflangCount = $("link[rel='alternate'][hreflang]").length;

      if (!title) problems.push(`${rel}: empty <title>`);
      if (!description) problems.push(`${rel}: empty meta description`);
      if (canonical !== `${siteOrigin}${pagePath(locale, pageKey)}`) {
        problems.push(`${rel}: canonical is "${canonical}", expected "${siteOrigin}${pagePath(locale, pageKey)}"`);
      }
      if (!/^index/.test(robots)) problems.push(`${rel}: robots is "${robots}", expected index`);
      if (lang !== locale) problems.push(`${rel}: html lang is "${lang}", expected "${locale}"`);
      const expectedDir = rtlLocales.has(locale) ? "rtl" : "ltr";
      if (dir !== expectedDir) problems.push(`${rel}: dir is "${dir}", expected "${expectedDir}"`);
      if (h1Count !== 1) problems.push(`${rel}: has ${h1Count} <h1> elements, expected 1`);
      // x-default + one per locale
      if (hreflangCount !== localeOptions.length + 1) {
        problems.push(`${rel}: ${hreflangCount} hreflang links, expected ${localeOptions.length + 1}`);
      }

      const titleKey = `${locale}:${title}`;
      if (titlesByLocale.has(titleKey)) {
        problems.push(`${rel}: duplicate title with ${titlesByLocale.get(titleKey)}: "${title}"`);
      } else {
        titlesByLocale.set(titleKey, rel);
      }
      const descriptionKey = `${locale}:${description}`;
      if (descriptionsByLocale.has(descriptionKey)) {
        problems.push(`${rel}: duplicate description with ${descriptionsByLocale.get(descriptionKey)}`);
      } else {
        descriptionsByLocale.set(descriptionKey, rel);
      }

      const bodyText = $("body").text();
      if (/\bundefined\b|\[object Object\]/.test(bodyText)) {
        problems.push(`${rel}: rendered page contains "undefined" or "[object Object]"`);
      }

      await checkResolvable($, filePath, "a[href]", "href", "link");
      await checkResolvable($, filePath, "img[src]", "src", "image");
      await checkResolvable($, filePath, "link[rel='stylesheet']", "href", "stylesheet");
      await checkResolvable($, filePath, "script[src]", "src", "script");

      if (nicheKeys.includes(pageKey)) {
        // The benefits grid is a 3x3 square: eight bullets plus one inert tile
        // in the middle cell. Any other count turns the square into a ragged
        // block, and the gap tile is what makes the hole deliberate.
        const bullets = $("#niche-benefits-list li").not(".niche-benefit--gap").length;
        if (bullets !== 8) problems.push(`${rel}: ${bullets} benefit bullets rendered, expected 8`);
        const gaps = $("#niche-benefits-list .niche-benefit--gap").length;
        if (gaps !== 1) problems.push(`${rel}: ${gaps} centre gap tiles, expected 1`);

        // Hero lead + exactly three icon highlights carry the page now that the
        // long overview paragraph is gone.
        if (!$("#niche-hero-lead").text().trim()) problems.push(`${rel}: hero lead is empty`);
        const highlights = $(".niche-highlight").length;
        if (highlights !== 3) problems.push(`${rel}: ${highlights} highlights, expected 3`);
        const highlightIcons = $(".niche-highlight__icon svg").length;
        if (highlightIcons !== 3) {
          problems.push(`${rel}: ${highlightIcons} highlight icons, expected 3`);
        }
        $(".niche-highlight").each((i, el) => {
          if (!$(el).find(".niche-highlight__title").text().trim()) {
            problems.push(`${rel}: highlight ${i + 1} has no title`);
          }
          if (!$(el).find(".niche-highlight__text").text().trim()) {
            problems.push(`${rel}: highlight ${i + 1} has no text`);
          }
        });
        if ($(".niche-overview").length) problems.push(`${rel}: overview section is back`);

        const alt = $("#niche-image").attr("alt") || "";
        if (!alt.trim()) problems.push(`${rel}: niche hero image has empty alt`);
      } else if (pageKey === "home") {
        const links = $(".where-list__link[data-niche-key]").length;
        if (links !== nicheKeys.length) {
          problems.push(`${rel}: ${links} where-list links, expected ${nicheKeys.length}`);
        }
        if (!($("#where-product-image").attr("alt") || "").trim()) {
          problems.push(`${rel}: homepage product image missing alt`);
        }
      }
    }

    // Every normal content page must carry the complete shared language and
    // accessibility controls. Redirect/deep-link utility pages are excluded
    // because they intentionally leave the website immediately.
    for (const pageKey of interactivePages) {
      const filePath = pageFile(locale, pageKey);
      const rel = path.relative(repoRoot, filePath);

      if (!(await fileExists(filePath))) {
        problems.push(`${locale}/${pageKey}: interactive page not generated (${rel})`);
        continue;
      }

      const html = await fs.readFile(filePath, "utf8");
      const $ = cheerio.load(html);
      const languageScript = $("script[src*='js/language-selector.js']");
      const accessibilityScript = $("script[src*='js/accessibility.js']");
      const languageButton = $("#language-button");
      const languageDropdown = $("#language-dropdown");
      const accessibilityOptions = $("[data-a11y-setting]");

      if (!/^<!DOCTYPE html>/i.test(html)) {
        problems.push(`${rel}: missing HTML doctype at the start of the document`);
      }
      if (html.includes("\uFEFF")) {
        problems.push(`${rel}: contains a stray UTF-8 BOM that can create a gap above the header`);
      }
      if (html.includes("\u2014")) {
        problems.push(`${rel}: contains a disallowed em dash in visible site content`);
      }
      if ($(".language-selector").length !== 1 || languageButton.length !== 1 || languageDropdown.length !== 1) {
        problems.push(`${rel}: incomplete or duplicated language selector markup`);
      }
      if (languageScript.length !== 1) {
        problems.push(`${rel}: expected one shared language-selector.js controller, found ${languageScript.length}`);
      }
      if (languageButton.attr("aria-controls") !== "language-dropdown") {
        problems.push(`${rel}: language button does not control language-dropdown`);
      }
      if (languageButton.attr("aria-expanded") !== "false") {
        problems.push(`${rel}: language button must start with aria-expanded=false`);
      }
      if ($("#a11y-fab").length !== 1 || $("#a11y-panel").length !== 1 || $("#a11y-backdrop").length !== 1) {
        problems.push(`${rel}: incomplete or duplicated accessibility widget markup`);
      }
      if (accessibilityScript.length !== 1) {
        problems.push(`${rel}: expected one accessibility.js controller, found ${accessibilityScript.length}`);
      }
      if ($("#a11y-fab").attr("aria-controls") !== "a11y-panel") {
        problems.push(`${rel}: accessibility button does not control a11y-panel`);
      }
      if ($("#a11y-fab").attr("aria-expanded") !== "false" || $("#a11y-panel").attr("aria-hidden") !== "true") {
        problems.push(`${rel}: accessibility widget has an invalid initial open/closed state`);
      }
      if (accessibilityOptions.length !== 5) {
        problems.push(`${rel}: found ${accessibilityOptions.length} accessibility options, expected 5`);
      }
    }

    // Legacy routes must redirect to the new locations.
    for (const niche of NICHE_DEFINITIONS) {
      for (const legacyKey of niche.legacyKeys || []) {
        const redirectFile = pageFile(locale, legacyKey);
        const rel = path.relative(repoRoot, redirectFile);
        if (!(await fileExists(redirectFile))) {
          problems.push(`${locale}/${legacyKey}: redirect page missing (${rel})`);
          continue;
        }
        const html = await fs.readFile(redirectFile, "utf8");
        const expectedTarget = pagePath(locale, niche.key);
        if (!html.includes(`url=${expectedTarget}`)) {
          problems.push(`${rel}: does not redirect to ${expectedTarget}`);
        }
        if (!html.includes("noindex")) {
          problems.push(`${rel}: redirect page is missing noindex`);
        }
      }
    }
  }

  // Nav + localised section copy. Both guard the same failure mode: the build
  // addresses homepage sections by id, and cheerio silently does nothing when a
  // selector stops matching, so renaming a section id can break anchors or drop
  // a locale's copy without failing the build.
  const rtlScript = /[֐-׿؀-ۿ]/;
  for (const locale of localeOptions) {
    const file = pageFile(locale, "home");
    let html;
    try {
      html = await fs.readFile(file, "utf8");
    } catch {
      continue; // Already reported above.
    }
    const $ = cheerio.load(html);

    // 1. Every in-page nav link must land on an element that exists.
    $(".topbar-nav .nav__link").each((_, el) => {
      const href = $(el).attr("href") || "";
      const hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;
      const id = href.slice(hashIndex + 1);
      if (!id || !/^[A-Za-z][\w-]*$/.test(id)) return;
      if (!$(`#${id}`).length) {
        problems.push(`${file}: nav link "${$(el).text().trim()}" points at #${id}, which does not exist`);
      }
    });

    // 2. In an RTL locale, a section heading still in Latin script means the
    //    build wrote the template's English default instead of the translation.
    if (rtlLocales.has(locale)) {
      $("#main-content .section__eyebrow, #main-content .guest-invites__eyebrow").each((_, el) => {
        const text = $(el).text().trim();
        if (!text || rtlScript.test(text)) return;
        // Brand names legitimately stay in Latin script.
        if (/^(WIFIGATE|WiFi Gate)[\w\s]*$/i.test(text)) return;
        const section = $(el).closest("section").attr("id") || "?";
        problems.push(`${locale}: section#${section} eyebrow is untranslated ("${text}")`);
      });
    }
  }

  // Footer: every page type in a locale must render the exact same footer.
  // It comes from templates/partials/site-footer.template.html, so any
  // difference here means a template stopped using the shared partial or a
  // builder is writing footer copy of its own.
  for (const locale of localeOptions) {
    const shapes = new Map();

    for (const pageKey of interactivePages) {
      const file = pageFile(locale, pageKey);
      let html;
      try {
        html = await fs.readFile(file, "utf8");
      } catch {
        continue; // Missing pages are already reported above.
      }

      const start = html.indexOf('<footer class="site-footer"');
      if (start === -1) {
        problems.push(`${file}: no site footer`);
        continue;
      }

      const footer = html.slice(start, html.indexOf("</footer>", start) + "</footer>".length);
      if (!footer.includes("site-footer__whatsapp")) {
        problems.push(`${file}: footer is missing the WhatsApp Business link`);
      }

      // Legal hrefs and the logo src legitimately vary with page depth.
      const shape = footer
        .replace(/href="[^"]*(?:terms-and-conditions|privacy-policy|cookies)\//g, 'href="LEGAL/')
        .replace(/src="[^"]*WIFIGATE_LOGO_NO_BG\.png"/g, 'src="LOGO"');

      if (!shapes.has(shape)) shapes.set(shape, []);
      shapes.get(shape).push(pageKey);
    }

    if (shapes.size > 1) {
      const groups = [...shapes.values()].map((keys) => keys.join("+")).join(" vs ");
      problems.push(`${locale}: footer differs between page types (${groups})`);
    }
  }

  // Sitemap: every URL must resolve to a generated page, and every indexable
  // home/niche page must be listed.
  const sitemap = await fs.readFile(path.join(repoRoot, "sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expectedUrls = new Set();
  for (const locale of localeOptions) {
    for (const pageKey of indexablePages) {
      expectedUrls.add(`${siteOrigin}${pagePath(locale, pageKey)}`);
    }
  }
  for (const url of sitemapUrls) {
    if (!expectedUrls.has(url)) problems.push(`sitemap.xml: unexpected URL ${url}`);
  }
  for (const url of expectedUrls) {
    if (!sitemapUrls.includes(url)) problems.push(`sitemap.xml: missing URL ${url}`);
  }
  const duplicateSitemapUrls = sitemapUrls.filter((url, i) => sitemapUrls.indexOf(url) !== i);
  duplicateSitemapUrls.forEach((url) => problems.push(`sitemap.xml: duplicate URL ${url}`));

  if (problems.length) {
    console.error(`FAILED: ${problems.length} problems found`);
    problems.forEach((p) => console.error(`  - ${p}`));
    process.exitCode = 1;
  } else {
    console.log(
      `OK: ${localeOptions.length} locales x ${indexablePages.length} pages verified, ` +
        `${localeOptions.length * interactivePages.length} interactive pages, ` +
        `${sitemapUrls.length} sitemap URLs, redirects in place`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
