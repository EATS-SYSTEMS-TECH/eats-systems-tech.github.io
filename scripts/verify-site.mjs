// scripts/verify-site.mjs
// Post-build QA for the generated site. Run after `npm run build:locales`:
//   node scripts/verify-site.mjs
// Exits non-zero and lists every problem found. Checks, per locale:
//   - home + niche pages exist, have a single H1, unique title/description,
//     correct canonical, full hreflang cluster of ISO 639-1 codes, index
//     robots, lang/dir
//   - internal links and image references resolve to files on disk
//   - legacy niche routes exist and redirect to the right target
//   - sitemap entries resolve to generated pages
//   - no leftover "undefined" text in rendered pages
//   - invitation redirects preserve opaque protocol query parameters

import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { NICHE_DEFINITIONS } from "./niche-pages/index.mjs";
import { LANDING_PAGES } from "./landing-pages/index.mjs";
import { AUTO_OPEN_PAGE_KEY } from "./auto-open-page.mjs";
import { HOST_PAGE_KEY } from "./host-marketing-page.mjs";

const repoRoot = process.cwd();
const siteOrigin = "https://wifigate.io";
const problems = [];

const localeOptions = [
  "en", "es", "fr", "de", "he", "nl", "it", "pt", "pl", "no", "cs", "ru", "uk",
  "tr", "ar", "hi", "bn", "mr", "te", "zh-Hans", "zh-Hant", "ja", "ko", "da", "sv", "hu",
  "el", "ro", "hr", "fi", "bg", "sr", "sk", "sl", "id", "th", "vi", "ms", "fil",
];
const rtlLocales = new Set(["he", "ar"]);
// Google's hreflang: an ISO 639-1 language, optionally an ISO 15924 script and
// an ISO 3166-1 Alpha 2 region; three-letter codes such as "fil" are ignored.
const hreflangPattern = /^(x-default|[a-z]{2}(-[A-Z][a-z]{3})?(-[A-Z]{2})?)$/;
const nicheKeys = NICHE_DEFINITIONS.map((n) => n.key);
const legalPages = ["privacy-policy", "terms-and-conditions", "cookies", "accessibility"];
const landingKeys = LANDING_PAGES.map((page) => page.key);
const indexablePages = ["home", HOST_PAGE_KEY, AUTO_OPEN_PAGE_KEY, ...nicheKeys, ...landingKeys];
const interactivePages = [
  "home",
  HOST_PAGE_KEY,
  AUTO_OPEN_PAGE_KEY,
  ...nicheKeys,
  ...landingKeys,
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
  // Execute each real routing family instead of depending on three duplicated serializer statements.
  // Opaque payloads and duplicate protocol entries must reach the app unchanged.
  const invitationController = [...invitationTemplate.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(script => script.includes("function buildDeepLink("));
  if (!invitationController) problems.push("Invitation template is missing its handoff controller");
  else for (const [kind, field] of [["gate", "i"], ["group", "gid"], ["dual-control", "dcid"]]) {
    try {
      const href = `https://wifigate.io/wifigate-link/?${field}=synthetic&ep=opaque%2Bpayload&ep=second&ao=1&ao=0`;
      const actual = runInNewContext(invitationController + "\nbuildDeepLink();", {
        URL, URLSearchParams, atob, window: { location: { href } }, document: { addEventListener() {} },
      }, { timeout: 1000 });
      const expected = `wifigate://${kind}/synthetic?${field}=synthetic&ep=opaque%2Bpayload&ep=second&ao=1&ao=0&id=synthetic`;
      if (actual !== expected) problems.push(`Invitation ${kind} route failed opaque parameter preservation`);
    } catch (error) {
      problems.push(`Invitation ${kind} controller failed: ${error.message}`);
    }
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

      // Structured data parses, and a Product carries what Google requires:
      // an offer, a review or a rating (the site publishes none of them).
      $("script[type='application/ld+json']").each((_, element) => {
        let data;
        try {
          data = JSON.parse($(element).text());
        } catch {
          problems.push(`${rel}: invalid JSON-LD`);
          return;
        }
        const visit = (node) => {
          if (Array.isArray(node)) return node.forEach(visit);
          if (!node || typeof node !== "object") return;
          const types = [].concat(node["@type"] || []);
          if (types.includes("Product") && !node.offers && !node.review && !node.aggregateRating) {
            problems.push(`${rel}: Product without offers, review or aggregateRating`);
          }
          Object.values(node).forEach(visit);
        };
        visit(data);
      });

      const title = $("title").text().trim();
      const description = $("meta[name='description']").attr("content")?.trim() || "";
      const canonical = $("link[rel='canonical']").attr("href") || "";
      const lang = $("html").attr("lang") || "";
      const dir = $("html").attr("dir") || "";
      const h1Count = $("h1").length;
      const hreflangCount = $("link[rel='alternate'][hreflang]").length;

      if (!title) problems.push(`${rel}: empty <title>`);
      if (!description) problems.push(`${rel}: empty meta description`);
      if (canonical !== `${siteOrigin}${pagePath(locale, pageKey)}`) {
        problems.push(`${rel}: canonical is "${canonical}", expected "${siteOrigin}${pagePath(locale, pageKey)}"`);
      }
      for (const name of ["robots", "googlebot"]) {
        const directives = $(`meta[name='${name}']`).map((_, element) => $(element).attr("content") || "").get();
        if (directives.length !== 1 || directives[0] !== "index, follow") {
          problems.push(`${rel}: ${name} must have exactly one index, follow directive`);
        }
      }
      if (lang !== locale) problems.push(`${rel}: html lang is "${lang}", expected "${locale}"`);
      const expectedDir = rtlLocales.has(locale) ? "rtl" : "ltr";
      if (dir !== expectedDir) problems.push(`${rel}: dir is "${dir}", expected "${expectedDir}"`);
      if (h1Count !== 1) problems.push(`${rel}: has ${h1Count} <h1> elements, expected 1`);
      // x-default + one per locale
      if (hreflangCount !== localeOptions.length + 1) {
        problems.push(`${rel}: ${hreflangCount} hreflang links, expected ${localeOptions.length + 1}`);
      }
      const hreflangs = $("link[rel='alternate'][hreflang]").map((_, element) => $(element).attr("hreflang")).get();
      for (const hreflang of hreflangs) {
        if (!hreflangPattern.test(hreflang)) problems.push(`${rel}: hreflang "${hreflang}" is not an ISO 639-1 code`);
      }
      if (new Set(hreflangs).size !== hreflangs.length) problems.push(`${rel}: repeated hreflang value`);

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

      if (nicheKeys.includes(pageKey) || landingKeys.includes(pageKey)) {
        // Key benefits: a bento grid of cards, each with its own icon, an h3
        // title and a supporting line; the lead card carries an illustration.
        const cards = $("#niche-benefits-list > .bento-card");
        if (cards.length < 3) problems.push(`${rel}: ${cards.length} benefit cards, expected at least 3`);
        const icons = new Set();
        cards.each((i, card) => {
          const $card = $(card);
          if (!$card.find("h3.bento-card__title").text().trim()) problems.push(`${rel}: benefit card ${i + 1} has no title`);
          if (!$card.find(".bento-card__text").text().trim()) problems.push(`${rel}: benefit card ${i + 1} has no text`);
          const icon = $card.find(".bento-card__icon svg").html() || "";
          if (!icon) problems.push(`${rel}: benefit card ${i + 1} has no icon`);
          else if (icons.has(icon)) problems.push(`${rel}: benefit card ${i + 1} repeats an icon`);
          icons.add(icon);
        });
        if (!cards.first().find(".bento-visual").length) problems.push(`${rel}: the lead benefit card has no illustration`);
        if ($("#niche-related, .niche-related").length) problems.push(`${rel}: the related use cases section is back`);
        const faqItems = $("#niche-faq-list > details.seo-faq__item");
        if (faqItems.length < 3) problems.push(`${rel}: ${faqItems.length} FAQ questions, expected at least 3`);
        faqItems.each((i, item) => {
          if (!$(item).children("summary").text().trim() || !$(item).find(".seo-faq__answer p").text().trim()) {
            problems.push(`${rel}: FAQ question ${i + 1} needs a question and an answer`);
          }
        });

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

        // A landing page adds the definition, the setup steps, the facts table
        // and question headings in its FAQ.
        if (landingKeys.includes(pageKey)) {
          if (!$("#landing-intro .niche-section__title").text().trim() || !$(".landing-intro__text").text().trim()) {
            problems.push(`${rel}: landing definition is missing`);
          }
          if (!$(".landing-updated time[datetime]").length) problems.push(`${rel}: landing page has no updated date`);
          if ($("#landing-steps .landing-step").length < 3) problems.push(`${rel}: landing steps are missing`);
          const factRows = $("#landing-facts tbody tr").length;
          if (factRows < 4 || $("#landing-facts th[scope='row']").length !== factRows) {
            problems.push(`${rel}: landing facts table needs a row header in each of at least 4 rows`);
          }
          if ($(".landing-faq__heading").length !== $("#niche-faq-list .seo-faq__item").length) {
            problems.push(`${rel}: every landing FAQ question must be a heading`);
          }
        }
      } else if (pageKey === AUTO_OPEN_PAGE_KEY) {
        const benefits = $("#niche-benefits-list > .bento-card");
        if (benefits.length !== 3 || benefits.find(".bento-card__icon svg").length !== 3 || !$("#niche-benefits-title").text().trim()) problems.push(`${rel}: Auto Open needs a localized Key benefits section with three shared benefit cards`);
        if ($(".niche-highlight, #niche-faq, #niche-prev-link, #niche-next-link").length) problems.push(`${rel}: Auto Open has duplicate highlights, unrelated sections or navigation`);
        if ($(".niche-hero video[data-media-variants]").length !== 1 || $(".niche-hero [data-scene-replay]").length !== 1) problems.push(`${rel}: Auto Open video and replay are missing`);
      } else if (pageKey === "home") {
        const autoOpenCard = $(".feature-card--auto-open");
        if (autoOpenCard.find("video, picture, [data-scene-video], [data-media-watermark]").length || !autoOpenCard.find("img[src*='wifigate_features/auto_open.svg']").length) problems.push(`${rel}: Auto Open feature must display its original icon`);
        if (autoOpenCard.find("a").length !== 2 || autoOpenCard.find("a").toArray().some(element => $(element).attr("href") !== pagePath(locale, AUTO_OPEN_PAGE_KEY))) problems.push(`${rel}: Auto Open feature links must use the localized page`);
        const links = $(".where-list__link[data-niche-key]").length;
        if (links !== nicheKeys.length) {
          problems.push(`${rel}: ${links} where-list links, expected ${nicheKeys.length}`);
        }
        if (!($("#where-product-image").attr("alt") || "").trim()) {
          problems.push(`${rel}: homepage product image missing alt`);
        }
      }
    }

    // Public legal pages in every locale must stay eligible for indexing.
    for (const pageKey of legalPages) {
      const filePath = pageFile(locale, pageKey);
      const rel = path.relative(repoRoot, filePath);
      const $ = cheerio.load(await fs.readFile(filePath, "utf8"));
      for (const name of ["robots", "googlebot"]) {
        const directives = $(`meta[name='${name}']`).map((_, element) => $(element).attr("content") || "").get();
        if (directives.length !== 1 || directives[0] !== "index, follow") {
          problems.push(`${rel}: ${name} must have exactly one index, follow directive`);
        }
      }
      const canonicals = $("link[rel='canonical']");
      if (canonicals.length !== 1 || canonicals.attr("href") !== `${siteOrigin}${pagePath(locale, pageKey)}`) {
        problems.push(`${rel}: public legal page must have one self-referencing canonical`);
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
      if (accessibilityOptions.length !== 9) {
        problems.push(`${rel}: found ${accessibilityOptions.length} accessibility options, expected 9`);
      }
      if ($("#a11y-panel").attr("role") !== "dialog" || $("#a11y-text-smaller").length !== 1 || $("#a11y-text-larger").length !== 1) {
        problems.push(`${rel}: accessibility menu must be a dialog with text size controls`);
      }
      if ($("#a11y-statement").attr("href") !== pagePath(locale, "accessibility")) {
        problems.push(`${rel}: accessibility menu must link to the statement in its own language`);
      }
      if (!/window.accessibilityCopy = {"[^"]+":/.test(html)) {
        problems.push(`${rel}: the page must embed its accessibility copy`);
      }
    }

    // Legacy routes must redirect to the new locations.
    for (const alias of ["automation", "Automated-Guest-Invites-API"]) {
      const legacyFile = pageFile(locale, alias);
      const html = await fs.readFile(legacyFile, "utf8");
      const target = pagePath(locale, HOST_PAGE_KEY);
      if (html.includes("noindex") || !html.includes(`url=${target}`) || !html.includes(`rel="canonical" href="${siteOrigin}${target}"`)) {
        problems.push(`${locale}/${alias}: must redirect to ${target} without noindex`);
      }
    }
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
        // A 0-second refresh plus a canonical is a permanent redirect; noindex
        // would only blur that signal.
        if (html.includes("noindex") || !html.includes(`rel="canonical" href="${siteOrigin}${expectedTarget}"`)) {
          problems.push(`${rel}: redirect page must carry only a canonical to ${expectedTarget}`);
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
        .replace(/\r\n/g, "\n")
        .replace(/href="[^"]*(?:terms-and-conditions|privacy-policy|cookies)\//g, 'href="LEGAL/')
        .replace(/src="[^"]*wifigate-logo-footer.webp"/g, 'src="LOGO"');

      if (!shapes.has(shape)) shapes.set(shape, []);
      shapes.get(shape).push(pageKey);
    }

    if (shapes.size > 1) {
      const groups = [...shapes.values()].map((keys) => keys.join("+")).join(" vs ");
      problems.push(`${locale}: footer differs between page types (${groups})`);
    }
  }

  // Landing pages: no page of the site links to them. Only the other
  // language versions of a landing page do, through the language menu.
  const landingPaths = new Map();
  for (const key of landingKeys) {
    for (const locale of localeOptions) landingPaths.set(pagePath(locale, key), key);
  }
  for (const locale of localeOptions) {
    for (const pageKey of [...indexablePages, ...legalPages]) {
      let html;
      try {
        html = await fs.readFile(pageFile(locale, pageKey), "utf8");
      } catch {
        continue; // Already reported above.
      }
      const $ = cheerio.load(html);
      $("a[href]").each((_, element) => {
        const target = ($(element).attr("href") || "").replace(siteOrigin, "").split("#")[0].split("?")[0];
        const linked = landingPaths.get(target);
        if (linked && !(linked === pageKey && $(element).closest(".language-selector").length)) {
          problems.push(`${locale}/${pageKey}: links to the landing page ${target}`);
        }
      });
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
  // Public legal pages are indexed in every locale; Contact Us in English.
  for (const pageKey of legalPages) {
    for (const locale of localeOptions) expectedUrls.add(`${siteOrigin}${pagePath(locale, pageKey)}`);
  }
  expectedUrls.add(`${siteOrigin}/contact-us/`);
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
