import fs from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";

const repoRoot = process.cwd();
const copyDirectory = path.join(repoRoot, "scripts", "homepage-copy");
const rtlLocales = new Set(["ar", "he"]);
const expectedSections = [
  "home",
  "advantages",
  "private-access",
  "where",
  "guest-invites-api",
  "tutorials",
  "one-tap-invite",
  "wifi-gate-faq",
  "why-wifigate",
  "contact",
];
const expectedTargets = [
  "platform",
  "solutions",
  "wifigate-automation",
  "product-guide",
  "get-in-touch",
];

const localeFiles = (await fs.readdir(copyDirectory))
  .filter((fileName) => fileName.endsWith(".mjs"))
  .sort();
const failures = [];

function report(locale, message) {
  failures.push(`${locale}: ${message}`);
}

function normalize(text) {
  return String(text || "").replace(/[\u200e\u200f]/g, "").replace(/\s+/g, " ").trim();
}

for (const localeFile of localeFiles) {
  const locale = localeFile.slice(0, -4);
  const normalizedLocale = locale.toLowerCase();
  const outputFile = locale === "en"
    ? path.join(repoRoot, "index.html")
    : path.join(repoRoot, normalizedLocale, "index.html");
  const source = await fs.readFile(outputFile, "utf8");
  const copy = (await import(`./homepage-copy/${localeFile}`)).default;
  const $ = cheerio.load(source, { decodeEntities: false });
  const expectedDir = rtlLocales.has(locale) ? "rtl" : "ltr";
  const homePath = locale === "en" ? "/" : `/${normalizedLocale}/`;

  if ($("html").attr("lang") !== locale) report(locale, "incorrect html lang");
  if ($("html").attr("dir") !== expectedDir) report(locale, "incorrect html direction");
  if (!$("body").hasClass("home-en")) report(locale, "missing redesigned body class");
  if ($("link[href*='home-en.css']").length !== 1) report(locale, "redesign stylesheet must appear once");
  if ($("script[src*='locale-redirect.js']").length !== 1) report(locale, "locale redirect script must appear once");
  if ($("script[src*='language-selector.js']").length !== 1) report(locale, "language selector script must appear once");

  const ids = $("[id]").map((_, element) => $(element).attr("id")).get();
  if (new Set(ids).size !== ids.length) report(locale, "contains duplicate IDs");
  expectedSections.forEach((id) => {
    if ($(`#${id}`).length !== 1) report(locale, `expected one #${id} section`);
  });
  expectedTargets.forEach((id) => {
    if ($(`#${id}`).length !== 1) report(locale, `expected one #${id} navigation target`);
  });

  const navTargets = $(".topbar-nav .nav__link")
    .map((_, element) => $(element).attr("href"))
    .get();
  const expectedNavTargets = expectedTargets.map((id) => `#${id}`);
  if (JSON.stringify(navTargets) !== JSON.stringify(expectedNavTargets)) {
    report(locale, `unexpected navigation targets: ${JSON.stringify(navTargets)}`);
  }

  const navLabels = $(".topbar-nav .nav__link").map((_, element) => normalize($(element).text())).get();
  const expectedNavLabels = [
    copy.navigation.platform,
    copy.navigation.solutions,
    copy.navigation.automation,
    copy.navigation.productGuide,
    copy.navigation.contact,
  ].map(normalize);
  if (JSON.stringify(navLabels) !== JSON.stringify(expectedNavLabels)) report(locale, "navigation copy mismatch");

  if ($("#language-dropdown .language-selector__option").length !== localeFiles.length) {
    report(locale, "language selector does not include every locale");
  }
  if ($("link[rel='alternate']").length !== localeFiles.length + 1) {
    report(locale, "hreflang cluster is incomplete");
  }
  if ($(".guest-invites__cta").attr("href") !== `${homePath}automation/`) {
    report(locale, "Automation CTA is not locale-aware");
  }
  if ($("#private-access .security-statement__link").attr("href") !== `${homePath}#home`) {
    report(locale, "private-access CTA is not locale-aware");
  }

  const heroSubtitle = $("#hero-subtitle");
  const heroSubtitleLines = (heroSubtitle.html() || "")
    .split(/<br\s*\/?>/iu)
    .map((line) => normalize(cheerio.load(line, null, false).text()));
  if (heroSubtitle.find("br").length !== 1 || heroSubtitleLines.length !== 2 || heroSubtitleLines.some((line) => !line)) {
    report(locale, "hero subtitle must contain exactly two non-empty lines");
  }
  const compactHeroSubtitle = (value) => normalize(value).replace(/\s+/gu, "");
  if (compactHeroSubtitle(heroSubtitleLines.join("")) !== compactHeroSubtitle(copy.hero.subtitle)) {
    report(locale, "hero subtitle copy mismatch");
  }

  const visibleFaq = $("#wifi-gate-faq .seo-faq__item")
    .map((_, element) => ({
      question: normalize($(element).find("summary").text()),
      answer: normalize($(element).find(".seo-faq__answer p").text()),
    }))
    .get();
  const expectedFaq = copy.faq.items.map((item) => ({
    question: normalize(item.question),
    answer: normalize(item.answer),
  }));
  if (JSON.stringify(visibleFaq) !== JSON.stringify(expectedFaq)) report(locale, "visible FAQ copy mismatch");

  const structuredData = $("script[type='application/ld+json']")
    .map((_, element) => {
      try {
        return JSON.parse($(element).text());
      } catch {
        report(locale, "invalid JSON-LD");
        return null;
      }
    })
    .get()
    .flat()
    .filter(Boolean);
  const faqSchema = structuredData.find((entry) => entry["@type"] === "FAQPage");
  const structuredFaq = (faqSchema?.mainEntity || []).map((item) => ({
    question: normalize(item.name),
    answer: normalize(item.acceptedAnswer?.text),
  }));
  if (JSON.stringify(visibleFaq) !== JSON.stringify(structuredFaq)) report(locale, "FAQ/schema mismatch");
  if (faqSchema?.inLanguage !== locale) report(locale, "FAQ schema language mismatch");

  if (/undefined|\[object Object\]|\uFFFD|(?:Ã.|Â.|â€)/u.test(source)) {
    report(locale, "contains unresolved or corrupted text");
  }
}

if (failures.length) {
  console.error(`FAILED: ${failures.length} localized homepage problems found`);
  failures.forEach((failure) => console.error(`  - ${failure}`));
  process.exit(1);
}

console.log(`Localized homepage redesign verified: ${localeFiles.length} locales`);
