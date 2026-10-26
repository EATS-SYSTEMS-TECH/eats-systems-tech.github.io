import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { NICHE_CHROME } from "./niche-content.mjs";
import { benefitIconSvg } from "./benefit-icons.mjs";
import { NICHE_DEFINITIONS, NICHE_PAGE_LOCALES, validateNichePageLocales } from "./niche-pages/index.mjs";
import { LANDING_PAGES, LANDING_PAGE_LOCALES, validateLandingPageLocales } from "./landing-pages/index.mjs";
import { AUTO_OPEN_PAGE_KEY, getAutoOpenPageContent, validateAutoOpenPageLocales } from "./auto-open-page.mjs";
import { HOST_PAGE_KEY, getHostPageContent, appendHostMarketingDetails, installHomeHostPointShells, installHostPricingShells } from "./host-marketing-page.mjs";
import { SITE_LOGIN_LABELS, SITE_NAVIGATION } from "./site-navigation.mjs";
import { RTL_LANGUAGES, SITE_LANGUAGES } from "./site-languages.mjs";
import { accessibilityLinkLabels } from "./legal/footer-labels.mjs";
import { wifigateLinkLocales } from "./wifigate-link-locales.mjs";
import { buildLlmsTxt } from "./llms-txt.mjs";
import { LEGAL_PAGES, legalBundles, renderLegalMain } from "./legal/legal-pages.mjs";
import { buildNotFoundPage } from "./not-found-page.mjs";
import { buildLoginPages } from "./login-pages.mjs";
import { BRAND_ID, ORGANIZATION_ID, SITE_ORIGIN, breadcrumbNode, faqNode, hreflangCode, setPageMeta, webPageNode } from "./seo.mjs";
import { readSceneManifest, applyNicheSceneMedia, applyHomeSceneMedia } from "./scene-media.mjs";
import { applyMediaWatermarks } from "./media-watermark.mjs";
// Keep optional proof-list rendering independent from the page build pipeline.
import { setNicheList } from "./niche-text-list.mjs";
import { rewriteNicheHomeAnchors } from "./niche-links.mjs";
import { buildRedirectPage } from "./redirect-page.mjs";
import { previousSitemapDates, sitemapDocument } from "./sitemap.mjs";
import { circularNiches, setNichePager } from "./niche-navigation.mjs";
import { publishNicheVariant } from "./niche-publication.mjs";

const repoRoot = process.cwd();
const siteOrigin = SITE_ORIGIN;
const defaultLocale = "en";
const nowDate = new Date().toISOString().slice(0, 10);
const guestInvitesPageKey = HOST_PAGE_KEY;
const utilityPageKeys = ["wifigate-link", "wifigate-api"];
const COOKIE_CONSENT_VERSION = "20261016a";

const homeTemplatePath = path.join(repoRoot, "templates", "index.template.html");
const homeCopyDirectory = path.join(repoRoot, "scripts", "homepage-copy");
const utilityTemplatePath = path.join(repoRoot, "templates", "wifigate-link.template.html");
const nicheTemplatePath = path.join(repoRoot, "templates", "niche.template.html");
const guestInvitesTemplatePath = path.join(repoRoot, "templates", "guest-invites-api.template.html");
const legalTemplatePath = path.join(repoRoot, "templates", "legal.template.html");
const shopTemplatePath = path.join(repoRoot, "templates", "shop.template.html");


const homeRuntimeScriptsToRemove = ["js/language-selector.js"];


const homeRuntimeScriptsToAdd = [
  "/js/language-selector.js?v=20261006a",
];

const legalRuntimeScriptsToAdd = [
  "/js/language-selector.js?v=20261006a",
];

const nicheRuntimeScriptsToAdd = [
  "/js/language-selector.js?v=20261006a",
];

// Social share images (Open Graph / Twitter), at the sizes the platforms crop to.
const shareImage = { url: `${SITE_ORIGIN}/assets/img/wifigate-share.jpg`, width: 1200, height: 630, alt: "WIFIGATE" };
const pageImages = {
  home: shareImage,
  legal: shareImage,
  utility: { url: `${SITE_ORIGIN}/logo-1024.png`, width: 1024, height: 1024, alt: "WIFIGATE" },
  guestInvites: shareImage,
};

function getNestedValue(source, keyPath) {
  return keyPath.split(".").reduce((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return value[key];
    }

    return undefined;
  }, source);
}

function getBundle(collection, locale) {
  return collection[locale] || collection[defaultLocale];
}

// Copy keys a locale may add on top of the English reference shape. The
// renderer already treats these as optional (see updateHomeCopy), so the
// validator must not reject a locale that supplies one.
const OPTIONAL_COPY_KEYS = new Set([
  "hero.statement",
  "footer.taglineLines",
  "platform.subscriptionNote",
  "why.pointsNote",
  "automation.points.0.icon",
  "automation.points.1.icon",
  "automation.points.2.icon",
]);

// The homepage template ships one icon per automation point, shared by every
// locale. A locale that rewrites a point into a different message can name a
// replacement icon here rather than forcing the swap on all 38 locales.
const AUTOMATION_POINT_ICONS = {
  team: [
    '<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"></path>',
    '<circle cx="10" cy="8" r="3.5"></circle>',
    '<path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4"></path>',
    '<path d="M15 5.1a3.5 3.5 0 0 1 0 5.8"></path>',
  ].join(""),
};

function validateCopyShape(reference, candidate, pathSegments = []) {
  const keyPath = pathSegments.join(".") || "homepage copy";

  if (Array.isArray(reference)) {
    if (!Array.isArray(candidate) || candidate.length !== reference.length) {
      throw new Error(`${keyPath} must contain exactly ${reference.length} items`);
    }

    reference.forEach((value, index) => validateCopyShape(value, candidate[index], [...pathSegments, String(index)]));
    return;
  }

  if (reference && typeof reference === "object") {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error(`${keyPath} must be an object`);
    }

    // Optional keys are excluded from the shape comparison on BOTH sides: the
    // reference is English, so a key present there would otherwise become
    // mandatory for every locale, which is the opposite of optional.
    const isOptional = (key) => OPTIONAL_COPY_KEYS.has([...pathSegments, key].join("."));
    const referenceKeys = Object.keys(reference).filter((key) => !isOptional(key));
    const candidateKeys = Object.keys(candidate).filter((key) => !isOptional(key));
    if (referenceKeys.length !== candidateKeys.length || referenceKeys.some((key) => !candidateKeys.includes(key))) {
      throw new Error(`${keyPath} must have keys: ${referenceKeys.join(", ")}`);
    }

    referenceKeys.forEach((key) => validateCopyShape(reference[key], candidate[key], [...pathSegments, key]));

    // An optional key that a locale does supply still has to be well formed.
    Object.keys(candidate)
      .filter((key) => isOptional(key) && key in reference)
      .forEach((key) => validateCopyShape(reference[key], candidate[key], [...pathSegments, key]));
    return;
  }

  if (typeof candidate !== typeof reference || (typeof candidate === "string" && !candidate.trim())) {
    throw new Error(`${keyPath} must be a non-empty ${typeof reference}`);
  }
}

async function loadHomeCopy(localeOptions) {
  const copies = {};

  for (const option of localeOptions) {
    const fileUrl = pathToFileURL(path.join(homeCopyDirectory, `${option.code}.mjs`));
    copies[option.code] = (await import(fileUrl.href)).default;
  }

  const reference = copies[defaultLocale];
  for (const option of localeOptions) {
    try {
      validateCopyShape(reference, copies[option.code]);
    } catch (error) {
      throw new Error(`Invalid homepage copy for ${option.code}: ${error.message}`);
    }
  }

  // The header's account menu keeps no English on a non-English page.
  const englishAccount = reference.navigation.account;
  for (const option of localeOptions) {
    if (option.code === defaultLocale) continue;
    for (const [key, value] of Object.entries(copies[option.code].navigation.account)) {
      if (value.trim().toLowerCase() === englishAccount[key].trim().toLowerCase()) {
        throw new Error(`Invalid homepage copy for ${option.code}: navigation.account.${key} is still English ("${value}")`);
      }
    }
  }

  return copies;
}

function normalizeLocalePath(locale) {
  return locale.toLowerCase();
}

function isRtl(locale) {
  return RTL_LANGUAGES.has(locale);
}

function getOutputSegments(locale, pageKey = "home") {
  const segments = [];

  if (locale !== defaultLocale) {
    segments.push(normalizeLocalePath(locale));
  }

  if (pageKey !== "home") {
    segments.push(pageKey);
  }

  return segments;
}

function buildPagePath(locale, pageKey = "home") {
  const segments = getOutputSegments(locale, pageKey);
  return segments.length ? `/${segments.join("/")}/` : "/";
}

function buildPageUrl(locale, pageKey = "home") {
  return `${siteOrigin}${buildPagePath(locale, pageKey)}`;
}

function getNichePageContent(locale) {
  return NICHE_PAGE_LOCALES[locale] || NICHE_PAGE_LOCALES[defaultLocale];
}

function buildOutputFilePath(locale, pageKey = "home") {
  return path.join(repoRoot, ...getOutputSegments(locale, pageKey), "index.html");
}

function buildAssetPrefix(locale, pageKey = "home") {
  return "../".repeat(getOutputSegments(locale, pageKey).length);
}

function toStaticAssetPath(assetPath, assetPrefix) {
  if (!assetPath || /^[a-z][a-z0-9+.-]*:/i.test(assetPath) || assetPath.startsWith("//") || assetPath.startsWith("#")) {
    return assetPath;
  }

  let normalized = assetPath.replace(/^\/+/, "");
  while (normalized.startsWith("../")) {
    normalized = normalized.slice(3);
  }
  if (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  return `${assetPrefix}${normalized}`;
}

function buildLanguageSelectorMarkup(options, locale, pageKey, assetPrefix) {
  return options
    .map((option) => {
      const isSelected = option.code === locale;
      const itemDir = isRtl(option.code) ? "rtl" : "auto";
      const currentAttr = isSelected ? ' aria-current="true"' : "";
      const selectedClass = isSelected ? " is-selected" : "";
      return `
          <a class="language-selector__option${selectedClass}" href="${buildPagePath(option.code, pageKey)}" data-lang="${option.code}"${currentAttr}>
            <span class="language-selector__flag">
              <img src="${toStaticAssetPath(`assets/img/flags/${option.flagSrc}`, assetPrefix)}" alt="${option.flagAlt}" width="50" height="33" loading="lazy" decoding="async" />
            </span>
            <span class="language-selector__label" dir="${itemDir}">${option.label}</span>
          </a>`;
    })
    .join("");
}

function setLanguageSelector($, options, locale, pageKey) {
  const currentOption = options.find((option) => option.code === locale) || options[0];
  const assetPrefix = buildAssetPrefix(locale, pageKey);

  $("#language-button").attr({
    "aria-controls": "language-dropdown",
    "aria-haspopup": "true",
    "aria-expanded": "false",
  });

  $("#selected-flag").html(
    `<img src="${toStaticAssetPath(`assets/img/flags/${currentOption.flagSrc}`, assetPrefix)}" alt="${currentOption.flagAlt}" width="50" height="33" />`
  );
  $(".language-selector__selected").text(currentOption.label);
  $("#language-dropdown").html(buildLanguageSelectorMarkup(options, locale, pageKey, assetPrefix));
}

function rewriteStaticAssets($, locale, pageKey) {
  const assetPrefix = buildAssetPrefix(locale, pageKey);

  $("script[src]").each((_, element) => {
    const src = $(element).attr("src");
    if (!src) {
      return;
    }

    $(element).attr("src", toStaticAssetPath(src, assetPrefix));
  });

  $("img[src], source[src]").each((_, element) => {
    const attrName = element.tagName === "source" ? "src" : "src";
    const value = $(element).attr(attrName);
    if (!value) {
      return;
    }

    $(element).attr(attrName, toStaticAssetPath(value, assetPrefix));
  });

  $("video[poster]").each((_, element) => {
    const poster = $(element).attr("poster");
    if (!poster) {
      return;
    }

    $(element).attr("poster", toStaticAssetPath(poster, assetPrefix));
  });

  $("link[href]").each((_, element) => {
    const rel = ($(element).attr("rel") || "").toLowerCase();
    const href = $(element).attr("href");

    if (
      !href ||
      rel === "canonical" ||
      rel === "alternate" ||
      rel === "preconnect"
    ) {
      return;
    }

    $(element).attr("href", toStaticAssetPath(href, assetPrefix));
  });
}

function removeScripts($, scriptList) {
  $("script[src]").each((_, element) => {
    const src = $(element).attr("src") || "";
    if (scriptList.some((entry) => src.includes(entry))) {
      $(element).remove();
    }
  });
}

function appendScripts($, scriptList, anchorSelector, locale, pageKey) {
  const anchor = $(anchorSelector).first();
  if (!anchor.length) {
    return;
  }

  const assetPrefix = buildAssetPrefix(locale, pageKey);

  scriptList.forEach((src) => {
    anchor.before(`\n  <script src="${toStaticAssetPath(src, assetPrefix)}" defer></script>`);
  });
}

// The hreflang cluster of a page: x-default (English) plus every locale given.
function alternatesFor(localeOptions, pageKey) {
  if (!localeOptions.length) return [];
  return [
    { hreflang: "x-default", href: buildPageUrl(defaultLocale, pageKey) },
    ...localeOptions.map((option) => ({
      hreflang: hreflangCode(option.code),
      href: buildPageUrl(option.code, pageKey),
      locale: option.code,
    })),
  ];
}

function formatTextForLocaleDirection(text, locale) {
  if (typeof text !== "string" || !isRtl(locale)) {
    return text;
  }

  const trimmed = text.trimEnd();
  if (!trimmed || /[\u200e\u200f]$/.test(trimmed)) {
    return text;
  }

  return /[?!:;.,]$/.test(trimmed) ? `${text}\u200f` : text;
}

function applyDataI18nTranslations($, bundle, locale) {
  const dir = isRtl(locale) ? "rtl" : "ltr";

  $("[data-i18n]").each((_, element) => {
    const key = $(element).attr("data-i18n");
    const translatedValue = key ? getNestedValue(bundle, key) : undefined;

    if (typeof translatedValue === "string") {
      $(element)
        .attr("dir", dir)
        .text(formatTextForLocaleDirection(translatedValue, locale));
    }
  });
}

// `footerCopy` is the curated footer block from scripts/homepage-copy/<locale>.mjs.
// It is the single source of truth for footer wording on every page type.
function updateFooterStaticUi($, locale, footer) {
  const dir = isRtl(locale) ? "rtl" : "ltr";
  // These wrappers are authored dir="rtl" (Hebrew-first source). Flip them to
  // match the page locale so LTR languages (English, etc.) are not mirrored.
  $(".site-footer").attr("dir", dir);
  $(".contact-options, .contact-options__header").attr("dir", dir);
  const set = (selector, value) => {
    if (typeof value === "string") {
      $(selector).attr("dir", dir).text(formatTextForLocaleDirection(value, locale));
    }
  };

  if (Array.isArray(footer.taglineLines)) {
    setLocalizedLines($, ".site-footer__brand-copy", footer.taglineLines, locale);
  } else if (typeof footer.tagline === "string" && footer.tagline.includes("\n")) {
    setLocalizedLines($, ".site-footer__brand-copy", footer.tagline.split("\n"), locale);
  } else {
    set(".site-footer__brand-copy", footer.tagline);
  }
  const headings = $(".site-footer__heading");
  [footer.legalTitle, footer.appSupportTitle, footer.socialTitle].forEach((value, index) => {
    if (typeof value === "string" && headings.eq(index).length) {
      headings.eq(index).attr("dir", dir).text(formatTextForLocaleDirection(value, locale));
    }
  });
  set(".site-footer__link:nth-child(1)", footer.terms);
  set(".site-footer__link:nth-child(2)", footer.privacy);
  set(".site-footer__link:nth-child(3)", footer.cookies);
  set(".site-footer__copy", `${String.fromCharCode(0xa9)} 2026 ${footer.copyright || "WIFIGATE · EATS SYSTEMS TECH. All rights reserved."}`);
}

function updateAccessibilityMarkup($, accessibilityBundle, locale) {
  const copy = accessibilityBundle;
  $(".skip-link").text(copy.skipLink);
  $("#a11y-fab").attr({ "aria-label": copy.openButton, title: copy.openButton });
  $("#a11y-eyebrow").text(copy.eyebrow);
  $("#a11y-close").attr("aria-label", copy.closeButton);
  $("#a11y-title").text(copy.title);
  $("#a11y-description").text(copy.description);
  $("#a11y-status").text(copy.statusDefault);
  $("#a11y-reset").text(copy.reset);
  $("#a11y-text-size-title").text(copy.textSize.label);
  $("#a11y-text-size-description").text(copy.textSize.description);
  $("#a11y-text-smaller").attr({ "aria-label": copy.textSize.decrease, title: copy.textSize.decrease });
  $("#a11y-text-larger").attr({ "aria-label": copy.textSize.increase, title: copy.textSize.increase });
  $("#a11y-statement").text(copy.statementLink).attr("href", buildPagePath(locale, "accessibility"));

  $(".a11y-option").each((_, element) => {
    const key = $(element).attr("data-a11y-setting");
    const optionCopy = key ? copy.options[key] : null;
    if (!optionCopy) {
      throw new Error(`${locale}: no accessibility copy for ${key}`);
    }
    $(element).find(".a11y-option__title").text(optionCopy.label);
    $(element).find(".a11y-option__description").text(optionCopy.description);
  });
}

function setBodyDirection($, locale) {
  $("html").attr("lang", locale);
  $("html").attr("dir", isRtl(locale) ? "rtl" : "ltr");

  const body = $("body");
  if (isRtl(locale)) {
    body.addClass("rtl");
  } else {
    body.removeClass("rtl");
  }
}

function buildHomeMeta(locale) {
  const home = getNichePageContent(locale).home;
  return {
    title: home.seoTitle,
    description: home.seoDescription,
    keywords: home.keywords || NICHE_PAGE_LOCALES[defaultLocale].home.keywords,
  };
}

function setHomeMeta($, locale, localeOptions, copy) {
  const meta = buildHomeMeta(locale);
  const url = buildPageUrl(locale, "home");

  $("meta[name='keywords']").remove();
  if (meta.keywords) $("head").append(`\n  <meta name="keywords" content="${meta.keywords}" />`);
  setPageMeta($, {
    locale,
    url,
    title: meta.title,
    description: meta.description,
    alternates: alternatesFor(localeOptions, "home"),
    image: pageImages.home,
    // The slogan is the tagline the footer shows on this page.
    brand: { description: meta.description, slogan: copy.footer.tagline },
    graph: [
      webPageNode({ url, title: meta.title, description: meta.description, locale, image: pageImages.home }),
      faqNode(url, locale, copy.faq.items),
    ],
  });

  return meta;
}

// All public legal pages may be indexed. Only English and Hebrew have
// translated legal text, so only those versions form a hreflang cluster.
const LEGAL_TRANSLATED_LOCALES = ["en", "he"];

function setLegalMeta($, locale, pageKey, localeOptions, legalBundle) {
  const metaTags = legalBundle.legal?.metaTags || {};
  const title = metaTags.title || "WIFIGATE";
  const description = metaTags.description || "";
  const url = buildPageUrl(locale, pageKey);
  const translated = LEGAL_TRANSLATED_LOCALES.includes(locale);
  const types = { "privacy-policy": "WebPage", "terms-and-conditions": "WebPage", cookies: "WebPage", accessibility: "WebPage" };

  setPageMeta($, {
    locale,
    url,
    title,
    description,
    robots: "index, follow",
    alternates: translated
      ? alternatesFor(localeOptions.filter((option) => LEGAL_TRANSLATED_LOCALES.includes(option.code)), pageKey)
      : [],
    ogType: "article",
    image: pageImages.legal,
    graph: [webPageNode({ type: types[pageKey], url, title, description, locale })],
  });
}

function getUtilityLocaleCopy(locale) {
  return wifigateLinkLocales[locale] || wifigateLinkLocales[defaultLocale];
}

function setUtilityMeta($, locale, localeOptions, copy, pageKey) {
  const url = buildPageUrl(locale, pageKey);
  const title = copy.socialTitle || copy.pageTitle;

  setPageMeta($, {
    locale,
    url,
    title,
    description: copy.description,
    robots: "noindex, follow",
    image: pageImages.utility,
    graph: [webPageNode({ url, title, description: copy.description, locale })],
  });
}

function updateUtilityPageStaticUi($, copy) {
  $("#page-title").text(copy.heading);
  $("#status").text(copy.statusOpening);
  $("#open-app").text(copy.openButton);
  $("#copy-link").text(copy.copyButton);
  $("#wifigate-link-copy").text(
    JSON.stringify({
      headingFallback: copy.headingFallback || copy.openButton,
      headingMissing: copy.headingMissing || copy.openButton,
      statusMissing: copy.statusMissing,
      statusFallback: copy.statusFallback,
      copyButton: copy.copyButton,
      copiedButton: copy.copiedButton,
      copyError: copy.copyError || wifigateLinkLocales[defaultLocale].copyError,
    })
  );
}

function updateHomeStaticUi($, copy, accessibilityBundle, locale) {
  const media = copy.hero.media;
  $("#hero-mute-toggle").attr({ "aria-label": media.unmute, title: media.unmute });
  $("#hero-pause-toggle").attr({ "aria-label": media.pause, title: media.pause });
  $("#hero-replay span").text(media.replay);
  $("#hero-replay").attr({ "aria-label": media.replay, title: media.replay });

  updateAccessibilityMarkup($, accessibilityBundle, locale);
}

function splitHomeWhereSubtitle(value) {
  const subtitle = String(value || "").trim();
  const match = subtitle.match(/^(.+?[.!?。！？।])\s*(.+)$/su);

  return match ? [match[1].trim(), match[2].trim()] : [subtitle, ""];
}

// The use-case links of the homepage list, in the page language.
function updateHomeWhereLinks($, locale) {
  const content = getNichePageContent(locale);
  for (const niche of NICHE_DEFINITIONS) {
    $(`.where-list__link[data-niche-key='${niche.key}']`)
      .attr("href", buildPagePath(locale, niche.key))
      .text(content.niches[niche.key].label);
  }
}

function setLocalizedText($, target, value, locale) {
  const element = typeof target === "string" ? $(target) : target;
  element
    .attr("dir", isRtl(locale) ? "rtl" : "ltr")
    .text(formatTextForLocaleDirection(value, locale));
}

function setLocalizedLines($, selector, lines, locale) {
  const element = $(selector);
  element.attr("dir", isRtl(locale) ? "rtl" : "ltr");
  element.empty();
  lines.forEach((line, index) => {
    if (index > 0) element.append("<br>");
    element.append(formatTextForLocaleDirection(line, locale));
  });
}

function splitHeroSubtitleLines(subtitle) {
  const text = subtitle.trim();
  const sentenceBoundary = text.match(/^(.+?[.!?。！？।])(?:\s+|(?=\S))(.+)$/u);

  if (sentenceBoundary) {
    return [sentenceBoundary[1].trim(), sentenceBoundary[2].trim()];
  }

  const commaBoundaries = [...text.matchAll(/[,，]\s*/gu)];
  if (commaBoundaries.length) {
    const midpoint = text.length / 2;
    const boundary = commaBoundaries.reduce((closest, candidate) =>
      Math.abs(candidate.index - midpoint) < Math.abs(closest.index - midpoint) ? candidate : closest
    );
    const splitAt = boundary.index + boundary[0].length;
    return [text.slice(0, splitAt).trim(), text.slice(splitAt).trim()];
  }

  const words = text.split(/\s+/u);
  const splitAt = Math.ceil(words.length / 2);
  return [words.slice(0, splitAt).join(" "), words.slice(splitAt).join(" ")];
}

function applyHomepageCopy($, copy, locale) {
  const dir = isRtl(locale) ? "rtl" : "ltr";

  if (copy.hero.statement) {
    $(".hero").addClass("hero--statement");
    const title = $("#hero-title").empty().attr("dir", dir);
    copy.hero.titleLines.forEach((line, index) => {
      if (index) title.append(" ");
      title.append($("<span>").addClass("hero__title-line").text(formatTextForLocaleDirection(line, locale)));
    });
    setLocalizedText($, "#hero-subtitle", copy.hero.statement, locale);
    $(".hero__proof").remove();
  } else {
    // Other locales retain their existing headline and translated benefits.
    const category = getNichePageContent(locale).home.seoTitle.replace(/^WIFIGATE \| /, "");
    const brand = $("<bdi>").text("WIFIGATE (WiFi Gate)");
    const words = $("<span>").text(category);
    const line = $("<span>");
    if (isRtl(locale)) line.append(words, " · ", brand);
    else line.append(brand, " · ", words);
    $("#hero-title .hero__eyebrow").empty().attr("dir", dir).append(line);
    setLocalizedLines($, "#hero-title .hero__title-lines", copy.hero.titleLines, locale);
    setLocalizedLines($, "#hero-subtitle", splitHeroSubtitleLines(copy.hero.subtitle), locale);
    $(".hero__proof").attr("aria-label", copy.hero.proofLabel).attr("dir", dir);
    $(".hero__proof li").each((index, element) => $(element).text(copy.hero.proof[index]));
  }
  setLocalizedText($, ".hero__btn-primary", copy.hero.primaryCta, locale);
  setLocalizedText($, ".hero__btn-secondary", copy.hero.secondaryCta, locale);

  setLocalizedText($, "#how-it-works .section__eyebrow", copy.platform.eyebrow, locale);
  setLocalizedText($, "#features-title", copy.platform.title, locale);
  setLocalizedText($, "#how-it-works .section__subtitle", copy.platform.subtitle, locale);
  $("#how-it-works .feature-card").each((index, element) => {
    setLocalizedText($, $(element).find(".feature-card__title"), copy.platform.features[index].title, locale);
    setLocalizedText($, $(element).find(".feature-card__text"), copy.platform.features[index].text, locale);
  });

  // Optional small print under the no-subscription card. Locales that do not
  // supply it keep the exception inline in the card text instead, so the
  // qualification is never dropped.
  const subscriptionNote = $("#subscription-note");
  if (subscriptionNote.length) {
    if (copy.platform.subscriptionNote) {
      subscriptionNote.removeAttr("hidden");
      setLocalizedText($, subscriptionNote, copy.platform.subscriptionNote, locale);
    } else {
      subscriptionNote.remove();
    }
  }

  setLocalizedText($, "#private-access .security-statement__eyebrow", copy.privateAccess.eyebrow, locale);
  setLocalizedText($, "#private-access-title", copy.privateAccess.title, locale);
  setLocalizedText($, "#private-access .security-statement__copy p", copy.privateAccess.description, locale);

  setLocalizedText($, "#use-cases .section__eyebrow", copy.solutions.eyebrow, locale);
  setLocalizedLines($, "#where-title", copy.solutions.titleLines, locale);
  setLocalizedText($, "#where-subtitle", copy.solutions.subtitle, locale);
  $("#where-product-image").attr("alt", copy.solutions.imageAlt);
  $("img[src*='private-access-arrival']").attr("alt", copy.privateAccess.imageAlt);
  $("img[src*='one-tap-invite-map']").attr("alt", copy.oneTapInvite.imageAlt);
  $("img.product-overview__image").attr("alt", copy.productGuide.imageAlt);

  setLocalizedText($, "#wifigate-automation .guest-invites__eyebrow", copy.automation.eyebrow, locale);
  setLocalizedLines($, "#guest-invites-title", copy.automation.titleLines, locale);
  $("#wifigate-automation .automation-audiences").attr("aria-label", copy.automation.audienceLabel).attr("dir", dir);
  $("#wifigate-automation .automation-audiences li").each((index, element) => {
    $(element).text(copy.automation.audiences[index]);
  });
  setLocalizedText($, "#wifigate-automation .automation-promise", copy.automation.promise, locale);
  setLocalizedText($, "#wifigate-automation .guest-invites__subtitle", copy.automation.subtitle, locale);
  setLocalizedText($, "#wifigate-automation .guest-invites__cta span", copy.automation.cta, locale);
  $("#wifigate-automation .automation-stay img").attr("alt", copy.automation.imageAlt);
  setLocalizedText($, "#wifigate-automation .automation-stay__label", copy.automation.stayCaption, locale);
  $("#wifigate-automation .automation-stay__steps li").each((index, element) => {
    $(element).text(copy.automation.staySteps[index]);
  });
  $("#wifigate-automation .guest-invites__point").each((index, element) => {
    const point = copy.automation.points[index];
    setLocalizedText($, $(element).find(".guest-invites__point-title"), point.title, locale);
    setLocalizedText($, $(element).find(".guest-invites__point-text"), point.text, locale);
    if (point.icon) {
      const iconMarkup = AUTOMATION_POINT_ICONS[point.icon];
      if (!iconMarkup) {
        throw new Error(`${locale}: automation.points.${index}.icon references unknown icon "${point.icon}"`);
      }

      $(element).find(".guest-invites__point-icon svg").html(iconMarkup);
    }
  });

  setLocalizedText($, "#tutorial-videos .section__eyebrow", copy.productGuide.eyebrow, locale);
  setLocalizedText($, "#tutorials-title", copy.productGuide.title, locale);
  setLocalizedText($, "#tutorial-videos .section__subtitle", copy.productGuide.subtitle, locale);
  $("#tutorial-videos .tutorial-card").each((index, element) => {
    setLocalizedText($, $(element).find(".tutorial-card__title"), copy.productGuide.items[index], locale);
    setLocalizedText($, $(element).find(".tutorial-card__status"), copy.productGuide.status, locale);
  });

  setLocalizedText($, "#one-tap-invite .security-statement__eyebrow", copy.oneTapInvite.eyebrow, locale);
  setLocalizedText($, "#one-tap-invite-title", copy.oneTapInvite.title, locale);
  setLocalizedText($, "#one-tap-invite .security-statement__copy p", copy.oneTapInvite.description, locale);

  setLocalizedText($, "#wifi-gate-faq .section__eyebrow", copy.faq.eyebrow, locale);
  setLocalizedText($, "#wifi-gate-faq-title", copy.faq.title, locale);
  setLocalizedText($, "#wifi-gate-faq .section__subtitle", copy.faq.subtitle, locale);
  $("#wifi-gate-faq .seo-faq__item").each((index, element) => {
    setLocalizedText($, $(element).find("summary"), copy.faq.items[index].question, locale);
    setLocalizedText($, $(element).find(".seo-faq__answer p"), copy.faq.items[index].answer, locale);
  });

  setLocalizedText($, "#why-wifigate .security-statement__eyebrow", copy.why.eyebrow, locale);
  setLocalizedText($, "#why-wifigate-title", copy.why.title, locale);
  setLocalizedText($, "#why-wifigate .security-statement__copy p", copy.why.description, locale);
  $("#why-wifigate .entry-point__label").each((index, element) => {
    const label = copy.why.points[index];
    if (label) setLocalizedText($, $(element), label, locale);
  });

  const pointsNote = $("#entry-points-note");
  if (pointsNote.length) {
    if (copy.why.pointsNote) {
      pointsNote.removeAttr("hidden");
      setLocalizedText($, pointsNote, copy.why.pointsNote, locale);
    } else {
      pointsNote.remove();
    }
  }

  setLocalizedText($, "#get-in-touch .section__eyebrow", copy.contact.eyebrow, locale);
  setLocalizedText($, "#contact-title", copy.contact.title, locale);
  setLocalizedText($, "#contact-description", copy.contact.subtitle, locale);
  setLocalizedText($, "[data-i18n='contact.distributorTitle']", copy.contact.distributorTitle, locale);
  setLocalizedText($, "[data-i18n='contact.distributorText']", copy.contact.distributorText, locale);
  setLocalizedText($, "[data-i18n='contact.distributorButton']", copy.contact.distributorButton, locale);
  setLocalizedText($, "[data-i18n='contact.supportTitle']", copy.contact.supportTitle, locale);
  setLocalizedText($, "[data-i18n='contact.supportText']", copy.contact.supportText, locale);
  setLocalizedText($, "[data-i18n='contact.interestTitle']", copy.contact.interestTitle, locale);
  setLocalizedText($, "[data-i18n='contact.interestText']", copy.contact.interestText, locale);
  setLocalizedText($, "[data-i18n='contact.whatsappButton']", copy.contact.whatsappButton, locale);

  // The footer is written once, for every page type, by updateFooterStaticUi().
}

function rewriteHomeGuestInvitesLink($, locale) {
  $(".guest-invites__cta").attr("href", buildPagePath(locale, guestInvitesPageKey));
}

function reorderHomeSections($) {
  const main = $("#main-content");
  const sectionIds = [
    "home",
    "advantages",
    "private-access",
    "where",
    "guest-invites-api",
    "tutorials",
    "one-tap-invite",
    "wifi-gate-faq",
    "why-wifigate",
    "system-overview",
    "contact",
  ];

  sectionIds.forEach((id) => {
    const section = main.children(`#${id}`);
    if (section.length) {
      main.append(section);
    }
  });
}

function insertPageDataScript($, scriptId, data, anchorSelector) {
  $(`#${scriptId}`).remove();
  $(anchorSelector).before(
    `\n  <script id="${scriptId}" type="application/json">${JSON.stringify(data)}</script>`
  );
}

// The footer comes from a shared partial, so its legal links are rewritten in
// one place for every page type instead of once per page builder.
function rewriteFooterLegalLinks($, locale) {
  $(".site-footer__link[href*='terms-and-conditions/']").attr("href", buildPagePath(locale, "terms-and-conditions"));
  $(".site-footer__link[href*='privacy-policy/']").attr("href", buildPagePath(locale, "privacy-policy"));
  $(".site-footer__link[href*='cookies/']").attr("href", buildPagePath(locale, "cookies"));
  $(".site-footer__link[href*='accessibility/']")
    .attr("href", buildPagePath(locale, "accessibility"))
    .text(accessibilityLinkLabels[locale] || accessibilityLinkLabels.en);
}

function rewriteHomeInternalLinks($, locale) {
  rewriteFooterLegalLinks($, locale);
}

function rewriteLegalInternalLinks($, locale, pageKey) {
  const home = buildPagePath(locale, "home");

  // Keep the exact-home pass first, then apply the shared literal-fragment
  // policy before footer and body links. No URL/query normalization is added.
  $("a[href='../index.html']").attr("href", home);
  rewriteNicheHomeAnchors($, home);
  rewriteFooterLegalLinks($, locale);
  // Body cross-links follow source order. Resolve each destination immediately
  // before its write, so a path failure retains only earlier completed changes.
  for (const destination of ["terms-and-conditions", "privacy-policy", "cookies"]) {
    $(`a[href='../${destination}/']`).attr("href", buildPagePath(locale, destination));
  }

  // Retain the final ghost-button pass after all legal destinations.
  $(".btn.btn--ghost").each((_, element) => {
    const href = $(element).attr("href");
    if (href === "../index.html") {
      $(element).attr("href", buildPagePath(locale, "home"));
    }
  });

}

function ensureTrailingNewline(source) {
  return source.endsWith("\n") ? source : `${source}\n`;
}

// Shared markup that every page template pulls in via
// `<div data-partial="NAME"></div>`. Keeping the footer here is what stops it
// from drifting between page types.
const partialPaths = {
  "site-header": path.join(repoRoot, "templates", "partials", "site-header.template.html"),
  "site-footer": path.join(repoRoot, "templates", "partials", "site-footer.template.html"),
  "accessibility-widget": path.join(repoRoot, "templates", "partials", "accessibility-widget.template.html"),
};
const partialCache = new Map();

async function readPartial(name) {
  if (partialCache.has(name)) {
    return partialCache.get(name);
  }

  const partialPath = partialPaths[name];
  if (!partialPath) {
    throw new Error(`Unknown template partial "${name}"`);
  }

  const source = await fs.readFile(partialPath, "utf8");
  // Drop the leading authoring comment so it does not ship on every page.
  const markup = source.replace(/^\uFEFF/, "").replace(/^\s*<!--[\s\S]*?-->\s*/, "").trim();
  if (!markup) {
    throw new Error(`Template partial "${name}" is empty`);
  }

  partialCache.set(name, markup);
  return markup;
}

async function injectPartials(source, filePath) {
  const placeholder = /^([ \t]*)<div data-partial="([a-z-]+)"><\/div>[ \t]*$/gm;
  const names = [...source.matchAll(placeholder)].map((match) => match[2]);
  if (!names.length) {
    return source;
  }

  const markup = new Map();
  for (const name of new Set(names)) {
    markup.set(name, await readPartial(name));
  }

  return source.replace(placeholder, (_match, indent, name) => {
    const partial = markup.get(name);
    if (!partial) {
      throw new Error(`Missing partial "${name}" required by ${filePath}`);
    }
    // Re-indent so the generated HTML keeps the host template's shape.
    return partial
      .split("\n")
      .map((line) => (line.trim() ? `${indent}${line}` : line))
      .join("\n");
  });
}

async function readHtmlTemplate(filePath) {
  const source = await fs.readFile(filePath, "utf8");
  return injectPartials(source.replace(/^\uFEFF/, ""), filePath);
}

function updateSharedHeader($, homeData, locale, pageKey) {
  if (!$(".site-header").length) return;
  const copy = homeData.homepageCopies[locale].navigation;
  const home = buildPagePath(locale, "home");
  const menu = $(".topbar-nav").empty();
  for (const item of SITE_NAVIGATION) {
    const link = $("<a>").addClass("nav-link nav__link")
      .attr("href", item.pageKey ? buildPagePath(locale, item.pageKey) : home + "#" + item.hash);
    if (item.key === "contact") link.addClass("nav__contact-link");
    setLocalizedText($, link, item.key === "shop" ? (locale === "he" ? "חנות" : "Shop") : copy[item.key], locale);
    if (item.key === "shop" && locale !== "he") link.attr("lang", "en");
    menu.append(link);
  }
  $(".nav").attr("aria-label", copy.ariaLabel);
  $(".nav__logo-link").attr({ href: home + "#home", "aria-label": "WIFIGATE" });
  $(".nav__toggle").attr("aria-label", copy.toggleLabel);
  const loginLabel = SITE_LOGIN_LABELS[locale];
  if (!loginLabel) throw new Error(`No header login label for ${locale}`);
  setLocalizedText($, $(".site-login__label"), loginLabel, locale);
  $(".site-login__trigger").attr({ href: buildPagePath(locale, "login"), "aria-label": loginLabel });
  $("#language-button").attr("aria-label", copy.selectLanguageLabel);
  setLanguageSelector($, homeData.localeOptions, locale, pageKey);
  // The signed-in account menu (js/site-account.js). The dashboard speaks
  // English and Hebrew; every other language opens it in English.
  const account = copy.account;
  $("#account-button").attr("aria-label", account.menu);
  // The phone header keeps a left-to-right layout; the menu reads in the page
  // language.
  $(".site-account__identity, .site-account__menu").attr("dir", isRtl(locale) ? "rtl" : "ltr");
  setLocalizedText($, $(".site-account__label"), account.signedInAs, locale);
  setLocalizedText($, $("[data-account-dashboard]"), account.dashboard, locale);
  $("[data-account-dashboard]").attr("href", locale === "he" ? "/dashboard/?lang=he" : "/dashboard/");
  setLocalizedText($, $("[data-account-sign-out]"), account.signOut, locale);
  const cartCopy = locale === "he" ? {
    trigger: "סל קניות", title: "סל הקניות", close: "סגירת סל הקניות", empty: "סל הקניות ריק כרגע.",
    subtotal: "סכום ביניים משוער", checkout: "התשלום יהיה זמין בקרוב", note: "הקנייה באתר תהיה זמינה בקרוב.",
  } : {
    trigger: "Shopping cart", title: "Your cart", close: "Close cart", empty: "Your cart is empty.",
    subtotal: "Estimated subtotal", checkout: "Checkout coming soon", note: "Online shopping will be available soon.",
  };
  $(".site-cart__trigger").attr("aria-label", cartCopy.trigger);
  $("#site-cart-title").text(cartCopy.title);
  $(".site-cart__close").attr("aria-label", cartCopy.close);
  $(".site-cart__empty").text(cartCopy.empty);
  $(".site-cart__subtotal span").text(cartCopy.subtotal);
  $(".site-cart__checkout").text(cartCopy.checkout);
  $(".site-cart__note").text(cartCopy.note);
  $(".site-cart__drawer").attr("data-cart-copy", JSON.stringify({
    trigger: cartCopy.trigger,
    remove: locale === "he" ? "הסרת פריט" : "Remove item",
    decrease: locale === "he" ? "הפחתת כמות" : "Decrease quantity",
    increase: locale === "he" ? "הגדלת כמות" : "Increase quantity",
  }));
  if (locale !== "he") $(".site-cart__drawer").attr("lang", "en");
  const prefix = buildAssetPrefix(locale, pageKey);
  $("head").append('<link rel="stylesheet" href="' + prefix + siteHeaderStylesheet + '">');
  $("head").append('<link rel="stylesheet" href="' + prefix + 'css/site-cart.css?v=20261020b">');
  $("script[src*='js/site-account.js']").remove();
  $("script[src*='js/navigation.js']")
    .attr("src", prefix + "js/navigation.js?v=20261022outside1")
    .after('\n  <script src="' + prefix + 'js/site-account.js?v=20261022day1" defer></script>');
  $("body").append('<script src="' + prefix + 'js/site-cart.js?v=20261016a" defer></script>');
}

const siteHeaderStylesheet = "css/site-header.css?v=20261022a";

// A landing page keeps the header's look and the logo, and nothing that leads
// into the site: no menu, no logo link, no sign-in, account or language menu.
function setStandaloneHeader($, locale, pageKey) {
  $(".site-header script, .nav__toggle, .nav__links-wrapper, .site-login__trigger, .site-account, .site-cart__trigger, .site-cart__backdrop, .site-cart__drawer, .language-selector").remove();
  const logo = $(".nav__logo-link");
  logo.replaceWith($("<span>").addClass(logo.attr("class")).append(logo.contents()));
  const nav = $(".site-header .nav");
  nav.replaceWith($("<div>").addClass(nav.attr("class")).append(nav.contents()));
  $("script[src*='js/navigation.js'], script[src*='js/site-account.js']").remove();
  $("head").append('<link rel="stylesheet" href="' + buildAssetPrefix(locale, pageKey) + siteHeaderStylesheet + '">');
}

// JSON safe to embed in an inline <script>.
function inlineJson(value) {
  return JSON.stringify(value).replace(/</g, "<");
}

function serialize($, homeData, locale, pageKey = "home") {
  updateSharedHeader($, homeData, locale, pageKey);
  applyMediaWatermarks($, { assetPrefix: buildAssetPrefix(locale, pageKey) });
  // Every published page asks for cookie consent in its own language; the
  // footer's "Cookie settings" button reopens the choice.
  const settingsLabel = homeData.cookieCopy[locale].reopen;
  $(".cookie-settings-trigger")
    .text(settingsLabel)
    .attr({ "aria-label": settingsLabel, dir: isRtl(locale) ? "rtl" : "ltr" });
  const prefix = buildAssetPrefix(locale, pageKey);
  $("head").append(`<link rel="stylesheet" href="${prefix}css/cookie-consent.css?v=${COOKIE_CONSENT_VERSION}">`);
  // A page carries the copy of its own language only; js/cookie-consent-copy.js
  // and js/accessibility-copy.js stay the single source.
  $("body").append(`<script>window.WIFIGATE_COOKIE_COPY = ${inlineJson({ [locale]: homeData.cookieCopy[locale] })};</script>`);
  $("script[src*='js/accessibility-copy.js']").replaceWith(
    `<script>window.accessibilityCopy = ${inlineJson({ [locale]: homeData.accessibilityCopy[locale] })};</script>`
  );
  const consentScriptVersion = pageKey === HOST_PAGE_KEY ? "20261018host1" : pageKey === AUTO_OPEN_PAGE_KEY ? "20261018ao1" : COOKIE_CONSENT_VERSION;
  $("body").append(`<script src="${prefix}js/cookie-consent.js?v=${consentScriptVersion}" defer></script>`);
  const html = $.html({ decodeEntities: false }).replace(/[ \t]+(?=\r?\n|$)/g, "");
  return ensureTrailingNewline(html);
}

// Pages whose generated content changed in this build; the sitemap dates them
// today and keeps the previous lastmod of every other page.
const changedFiles = new Set();

async function writeOutputFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const previous = await fs.readFile(filePath, "utf8").catch(() => null);
  if (previous !== null && previous.replace(/\r\n/g, "\n") === content.replace(/\r\n/g, "\n")) return;
  changedFiles.add(path.resolve(filePath));
  const retryableCodes = new Set(["EACCES", "EBUSY", "EPERM", "UNKNOWN"]);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await fs.writeFile(filePath, content, "utf8");
      return;
    } catch (error) {
      const shouldRetry = retryableCodes.has(error?.code) && attempt < 4;
      if (!shouldRetry) throw error;
      await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
    }
  }
}

// lastmod is the day a page's content last changed: today for a page this
// build rewrote, otherwise the date the previous sitemap gave it.
async function readPreviousLastmods() {
  const previous = await fs.readFile(path.join(repoRoot, "sitemap.xml"), "utf8").catch(() => "");
  return previousSitemapDates(previous);
}

function buildSitemap(urlEntries, previousLastmods) {
  // Bind the existing build snapshot without changing its write/date policy.
  return sitemapDocument(urlEntries, previousLastmods, { repoRoot, changedFiles, nowDate });
}

async function buildHomePages(homeData) {
  const template = await readHtmlTemplate(homeTemplatePath);
  const homepageCopies = homeData.homepageCopies;
  const sitemapEntries = [];

  for (const localeOption of homeData.localeOptions) {
    const locale = localeOption.code;
    const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
    const $ = cheerio.load(template, { decodeEntities: false });

    // Install Host card shells before the existing translation and icon-override pipeline.
    installHomeHostPointShells($);
    setBodyDirection($, locale);
    rewriteStaticAssets($, locale, "home");
    removeScripts($, homeRuntimeScriptsToRemove);
    appendScripts($, homeRuntimeScriptsToAdd, "script[src*='js/main.js']", locale, "home");
    updateFooterStaticUi($, locale, homepageCopies[locale].footer);
    updateHomeStaticUi($, homepageCopies[locale], accessibilityBundle, locale);
    rewriteHomeInternalLinks($, locale);
    updateHomeWhereLinks($, locale);
    applyHomepageCopy($, homepageCopies[locale], locale);
    const autoOpenCard = $(".feature-card--auto-open");
    const autoOpenTitle = autoOpenCard.find(".feature-card__title");
    autoOpenCard.find(".feature-card__media").wrap($("<a>").attr({ href: buildPagePath(locale, AUTO_OPEN_PAGE_KEY), "aria-label": autoOpenTitle.text() }));
    autoOpenTitle.wrapInner($("<a>").attr("href", buildPagePath(locale, AUTO_OPEN_PAGE_KEY)));
    applyHomeSceneMedia($, { scene: homeData.sceneMedia.get("homepage-montage"), hotelScene: homeData.sceneMedia.get("hotels-airbnb"),
      assetPrefix: buildAssetPrefix(locale, "home"), copy: homepageCopies[locale].hero.media });
    rewriteHomeGuestInvitesLink($, locale);
    reorderHomeSections($);
    setHomeMeta($, locale, homeData.localeOptions, homepageCopies[locale]);
    insertPageDataScript(
      $,
      "hero-locale-data",
      { media: homepageCopies[locale].hero.media },
      "script[src*='js/main.js']"
    );

    const outputFile = buildOutputFilePath(locale, "home");
    await writeOutputFile(outputFile, serialize($, homeData, locale, "home"));

    sitemapEntries.push({
      loc: buildPageUrl(locale, "home"),
      changefreq: "monthly",
      priority: "1.0",
    });
  }

  return sitemapEntries;
}

async function buildShopPages(homeData) {
  const template = await readHtmlTemplate(shopTemplatePath);
  for (const { code: locale } of homeData.localeOptions) {
    const $ = cheerio.load(template, { decodeEntities: false });
    setBodyDirection($, locale);
    rewriteStaticAssets($, locale, "shop");
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer);
    updateAccessibilityMarkup($, getBundle(homeData.accessibilityCopy, locale), locale);
    rewriteFooterLegalLinks($, locale);
    const he = locale === "he";
    const title = he ? "החנות של WIFIGATE — בקרוב" : "WIFIGATE Shop — Coming soon";
    const description = he ? "החנות המקוונת של WIFIGATE תיפתח בקרוב." : "The WIFIGATE online shop is coming soon.";
    $("title").text(title);
    $("meta[name='description']").attr("content", description);
    $("link[rel='canonical']").attr("href", buildPageUrl(locale, "shop"));
    $(".shop-main__content").attr({ lang: he ? "he" : "en", dir: he ? "rtl" : "ltr" });
    if (he) {
      $(".shop-main h1").text("חנות WIFIGATE תיפתח בקרוב.");
      $(".shop-main__link").text("חזרה ל WIFIGATE");
    }
    $(".shop-main__link").attr("href", buildPagePath(locale, "home"));
    await writeOutputFile(buildOutputFilePath(locale, "shop"), serialize($, homeData, locale, "shop"));
  }
}

// English and Hebrew carry the full legal text. Every other locale shows the
// English text (lang="en", left to right) under a note in its own language
// that the English version governs; English and Hebrew drop that note.
function applyLegalContentLanguage($, bundle, locale) {
  const legal = bundle.legal || {};
  const note = $('[data-i18n="legal.hero.languageNote"]');
  if (!legal.hero?.languageNote) {
    note.remove();
  } else {
    note.attr("lang", locale).attr("role", "note");
  }
  if (legal.contentLang !== "en") return;
  $('[data-i18n^="legal.s."], [data-i18n^="legal.company."], [data-i18n="legal.contents"], [data-i18n^="legal.hero."]').each((_, element) => {
    const key = $(element).attr("data-i18n");
    if (key === "legal.hero.languageNote" || key === "legal.hero.eyebrow") return;
    const value = getNestedValue(bundle, key);
    if (typeof value === "string") {
      $(element).attr("lang", "en").attr("dir", "ltr").text(value);
    }
  });
  $(".legal-card .legal-company, .legal-card .legal-toc, .legal-card .legal-section").attr("lang", "en").attr("dir", "ltr");
}

async function buildLegalPages(homeData, legalCollections) {
  const shell = await readHtmlTemplate(legalTemplatePath);
  for (const pageKey of LEGAL_PAGES) {
    const template = shell.replace('  <main class="legal-main" id="main-content"></main>', renderLegalMain(pageKey));
    const translations = legalCollections[pageKey];

    for (const localeOption of homeData.localeOptions) {
      const locale = localeOption.code;
      const bundle = translations[locale];
      const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
      const $ = cheerio.load(template, { decodeEntities: false });

      setBodyDirection($, locale);
      rewriteStaticAssets($, locale, pageKey);
      appendScripts($, legalRuntimeScriptsToAdd, "script[src*='js/legal-page.js']", locale, pageKey);
      applyDataI18nTranslations($, bundle, locale);
      applyLegalContentLanguage($, bundle, locale);
      updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer);
      updateAccessibilityMarkup($, accessibilityBundle, locale);
      rewriteLegalInternalLinks($, locale, pageKey);
      setLegalMeta($, locale, pageKey, homeData.localeOptions, bundle);

      const outputFile = buildOutputFilePath(locale, pageKey);
      await writeOutputFile(outputFile, serialize($, homeData, locale, pageKey));
    }
  }
  return LEGAL_PAGES.flatMap((pageKey) =>
    homeData.localeOptions.map(({ code: locale }) => ({ loc: buildPageUrl(locale, pageKey), changefreq: "yearly", priority: "0.3" }))
  );
}

async function buildUtilityPages(homeData) {
  const template = await readHtmlTemplate(utilityTemplatePath);

  for (const localeOption of homeData.localeOptions) {
    const locale = localeOption.code;
    const copy = getUtilityLocaleCopy(locale);

    for (const pageKey of utilityPageKeys) {
      const $ = cheerio.load(template, { decodeEntities: false });

      setBodyDirection($, locale);
      rewriteStaticAssets($, locale, pageKey);
      updateUtilityPageStaticUi($, copy);
      setUtilityMeta($, locale, homeData.localeOptions, copy, pageKey);

      const outputFile = buildOutputFilePath(locale, pageKey);
      await writeOutputFile(outputFile, serialize($, homeData, locale, pageKey));
    }
  }

  return [];
}

function getNicheChrome(locale) {
  const chrome = NICHE_CHROME[locale];
  if (!chrome) throw new Error(`No use-case page labels (scripts/niche-content.mjs) for ${locale}`);
  return chrome;
}

function buildNicheContext(homeData, niche, locale) {
  return {
    chrome: getNicheChrome(locale),
    content: getNichePageContent(locale).niches[niche.key],
  };
}

// Renders the optional three-message block above the overview. The section
// stays hidden for any niche/locale that does not supply `highlights`.
// Line icons for the three hero highlights on every niche page. Niche copy
// picks one by name (`icon: "roster"`); stroke, size and colour come from
// .niche-highlight__icon in css/niche.css, so the markup carries no styling.
const NICHE_HIGHLIGHT_ICONS = {
  phone: '<svg viewBox="0 0 24 24"><rect x="6.5" y="2.5" width="9" height="19" rx="2"/><path d="M10.5 18.5h3"/><path d="M18 8.5a5 5 0 0 1 0 7"/><path d="M20.5 6a8.5 8.5 0 0 1 0 12"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  roster: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3"/><path d="M2.8 19c0-3 2.3-5 5.2-5s5.2 2 5.2 5"/><path d="M16.5 8.5h4.7M16.5 12.5h4.7M16.5 16.5h4.7"/></svg>',
  invite: '<svg viewBox="0 0 24 24"><path d="M21.5 3 2.5 10.5l7.5 3 3 7.5L21.5 3Z"/><path d="m10 13.5 4.5-4.5"/></svg>',
  handsfree: '<svg viewBox="0 0 24 24"><path d="M5 20.5V4.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M2.5 20.5h14"/><circle cx="12.4" cy="12.3" r=".9"/><path d="M18.5 9.5a5 5 0 0 1 0 5"/><path d="M21.3 7.5a8.5 8.5 0 0 1 0 9"/></svg>',
  keyless: '<svg viewBox="0 0 24 24"><circle cx="8" cy="8" r="3.5"/><path d="m10.5 10.5 8 8"/><path d="m15.5 15.5-2 2"/><path d="M3 21 21 3"/></svg>',
  history: '<svg viewBox="0 0 24 24"><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1"/><path d="M3.5 4.5V10H9"/><path d="M12 8v4.5l3 1.8"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 2.8 4.5 6v6c0 4.4 3.1 7.9 7.5 9.2 4.4-1.3 7.5-4.8 7.5-9.2V6L12 2.8Z"/><path d="m8.8 12 2.2 2.2 4.2-4.2"/></svg>',
  gate: '<svg viewBox="0 0 24 24"><path d="M3 20.5V6M21 20.5V6"/><path d="M2 20.5h20"/><path d="M6 20.5V9.5h12v11"/><path d="M12 9.5v11"/><path d="M6 14.5h12"/></svg>',
  shutter: '<svg viewBox="0 0 24 24"><path d="M3 5.5h18"/><path d="M4.5 5.5v15M19.5 5.5v15"/><path d="M2.5 20.5h19"/><path d="M4.5 9.5h15M4.5 12.5h15M4.5 15.5h15"/></svg>',
  barrier: '<svg viewBox="0 0 24 24"><path d="M5 21v-11"/><circle cx="5" cy="7.5" r="1.75"/><path d="M3 21h4"/><path d="M7 8.75 21 13"/><path d="M11.5 10.1l-.9 2.8M16 11.5l-.9 2.8"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.2"/><path d="M2.8 19.5c0-3.2 2.8-5.6 6.2-5.6s6.2 2.4 6.2 5.6"/><path d="M16.5 6.2a3.2 3.2 0 0 1 0 6.1"/><path d="M17.8 14.4c2.1.6 3.6 2.4 3.6 5.1"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 2.8v4M16 2.8v4"/><path d="M8.5 14h3"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13.5 2 4.5 13.5h6L10 22l9.5-11.5h-6L13.5 2Z"/></svg>',
  default: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.4 2.4 4.6-4.8"/></svg>',
};

function setNicheHighlights($, highlights) {
  const section = $("#niche-highlights");
  const list = $("#niche-highlights-list");
  if (!section.length || !list.length) {
    return;
  }

  const entries = (Array.isArray(highlights) ? highlights : []).filter(
    (entry) => entry && entry.title && entry.text
  );

  list.empty();
  if (!entries.length) {
    section.remove();
    return;
  }

  section.removeAttr("hidden");
  entries.forEach((entry) => {
    const item = $("<article>").addClass("niche-highlight");
    item.append(
      $("<span>")
        .addClass("niche-highlight__icon")
        .attr("aria-hidden", "true")
        .html(NICHE_HIGHLIGHT_ICONS[entry.icon] || NICHE_HIGHLIGHT_ICONS.default)
    );
    item.append($("<h2>").addClass("niche-highlight__title").text(entry.title));
    item.append($("<p>").addClass("niche-highlight__text").text(entry.text));
    if (entry.ctaLabel && entry.ctaHref) {
      item.append(
        $("<a>")
          .addClass("btn btn--ghost btn--small niche-highlight__cta")
          .attr("href", entry.ctaHref)
          .text(entry.ctaLabel)
      );
    }
    list.append(item);
  });
}

// Key benefits as a bento grid (css/niche.css, "Key benefits: bento"). Each
// page supplies its own cards: { icon, title, text, tags?, visual? }. The
// first card leads (7 of 12 columns) and the second sits beside it (5 of 12);
// the rest run in rows of three, and a last row of one or two widens to fill
// the row, so no count leaves an empty cell.
function benefitSpans(count) {
  const spans = [];
  for (let index = 0; index < count; index += 1) {
    if (count >= 2 && index < 2) {
      spans.push(index === 0 ? "lead" : "feature");
      continue;
    }
    const rest = count - Math.min(count, 2);
    const position = index - Math.min(count, 2);
    const lastRow = rest % 3;
    const inLastRow = lastRow && position >= rest - lastRow;
    spans.push(count === 1 ? "full" : inLastRow ? (lastRow === 1 ? "full" : "half") : "third");
  }
  return spans;
}

const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });
const firstGrapheme = (text) => graphemes.segment(text)[Symbol.iterator]().next().value?.segment || "";

// Minutes of an "HH:MM" time, 24:00 included.
const minutesOf = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Small illustrations of the product inside a card. They repeat what the card
// says, so they are hidden from assistive technology, and nothing in them is
// interactive.
function renderBenefitVisual($, visual, locale) {
  const text = (className, value, tag = "span") => {
    const element = $(`<${tag}>`).addClass(className);
    setLocalizedText($, element, value, locale);
    return element;
  };
  const box = $("<div>").addClass(`bento-visual bento-visual--${visual.type}`).attr("aria-hidden", "true");
  const bar = $("<div>").addClass("bento-visual__bar").append(text("bento-visual__heading", visual.heading));
  if (visual.status) bar.append(text("bento-visual__status", visual.status));
  box.append(bar);

  const rows = $("<ul>").addClass("bento-visual__rows");
  if (visual.type === "roster") {
    for (const row of visual.rows) {
      rows.append($("<li>").addClass("bento-visual__row").append(
        $("<span>").addClass("bento-visual__avatar").text(firstGrapheme(row.name)),
        text("bento-visual__name", row.name),
        text("bento-visual__badge", row.badge)
      ));
    }
  } else if (visual.type === "history") {
    for (const row of visual.rows) {
      rows.append($("<li>").addClass("bento-visual__row").append(
        $("<span>").addClass("bento-visual__time").attr("dir", "ltr").text(row.time),
        text("bento-visual__name", row.name),
        text("bento-visual__badge", row.event)
      ));
    }
  } else if (visual.type === "invite") {
    rows.append(
      $("<li>").addClass("bento-visual__row bento-visual__row--guest").append(
        $("<span>").addClass("bento-visual__avatar").text(firstGrapheme(visual.guest)),
        text("bento-visual__name", visual.guest)
      ),
      $("<li>").addClass("bento-visual__row").append($("<span>").addClass("bento-visual__glyph").html(benefitIconSvg("clock")), text("bento-visual__detail", visual.when)),
      $("<li>").addClass("bento-visual__row").append($("<span>").addClass("bento-visual__glyph").html(benefitIconSvg("map-pin")), text("bento-visual__detail", visual.note))
    );
  } else if (visual.type === "schedule") {
    for (const row of visual.rows) {
      const [from, to] = row.range.match(/\d{1,2}:\d{2}/g).map(minutesOf);
      rows.append($("<li>").addClass("bento-visual__row").append(
        text("bento-visual__day", row.day),
        $("<span>").addClass("bento-visual__track").append(
          $("<span>").addClass("bento-visual__span").attr("style", `--from: ${(from / 1440) * 100}%; --to: ${(to / 1440) * 100}%;`)
        ),
        $("<span>").addClass("bento-visual__time").attr("dir", "ltr").text(row.range)
      ));
    }
  } else {
    throw new Error(`Unknown benefit visual "${visual.type}"`);
  }
  return box.append(rows);
}

function setNicheBenefits($, benefits, locale) {
  const list = $("#niche-benefits-list");
  if (!list.length) {
    return;
  }

  const spans = benefitSpans(benefits.length);
  const total = String(benefits.length).padStart(2, "0");
  list.empty().attr("data-count", String(benefits.length));
  benefits.forEach((benefit, index) => {
    const card = $("<li>").addClass(`bento-card bento-card--${spans[index]}`);
    const top = $("<div>").addClass("bento-card__top").append(
      $("<span>").addClass("bento-card__icon").attr("aria-hidden", "true").html(benefitIconSvg(benefit.icon)),
      $("<span>").addClass("bento-card__count").attr({ "aria-hidden": "true", dir: "ltr" })
        .text(`${String(index + 1).padStart(2, "0")} / ${total}`)
    );
    const title = $("<h3>").addClass("bento-card__title");
    setLocalizedText($, title, benefit.title, locale);
    const body = $("<div>").addClass("bento-card__body").append(title);
    const text = $("<p>").addClass("bento-card__text");
    setLocalizedText($, text, benefit.text, locale);
    body.append(text);
    if (benefit.tags?.length) {
      const tags = $("<ul>").addClass("bento-card__tags");
      for (const tag of benefit.tags) {
        const item = $("<li>").addClass("bento-tag");
        setLocalizedText($, item, tag, locale);
        tags.append(item);
      }
      body.append(tags);
    }
    card.append(top, body);
    if (benefit.visual) {
      card.addClass("bento-card--with-visual").append(renderBenefitVisual($, benefit.visual, locale));
    }
    list.append(card);
  });
}

function getCircularAdjacentNiches(currentKey) {
  // Read the current canonical order without caching or changing its records.
  return circularNiches(NICHE_DEFINITIONS, currentKey);
}

// The hero, highlights, benefits and FAQ of the use-case design, shared by the
// use-case pages and the landing pages (scripts/landing-pages/).
function fillUseCaseBody($, { chrome, content, image, locale, pageKey, accessibilityBundle }) {
  const assetPrefix = buildAssetPrefix(locale, pageKey);

  $("#niche-eyebrow").text(content.eyebrow || chrome.eyebrow);
  $("#niche-title").text(content.title);

  const heroLead = $("#niche-hero-lead");
  if (heroLead.length) {
    if (content.heroLead) {
      heroLead.removeAttr("hidden").text(content.heroLead);
    } else {
      heroLead.remove();
    }
  }
  setNicheHighlights($, content.highlights);

  // The hero carries exactly one supporting line. Where the niche supplies a
  // `heroLead` that is it, and the benefits appear only in their own section;
  // otherwise the first couple of benefit titles stand in as proof points, mirroring
  // the homepage hero. Never both, so no copy is repeated on the page.
  if (content.heroLead) {
    $("#niche-hero-proof").remove();
  } else {
    setNicheList($, "#niche-hero-proof", (content.benefits || []).slice(0, 2).map((benefit) => benefit.title), "niche-hero__proof-item");
  }
  $("#niche-hero-cta-label").text("WhatsApp @WIFIGATE");
  $("#niche-hero-benefits").text(chrome.benefitsTitle);


  $("#niche-image")
    .attr("src", `${assetPrefix}${image.hero}`)
    .attr("alt", content.imageAlt)
    .attr("width", String(image.heroWidth))
    .attr("height", String(image.heroHeight));

  $("#niche-benefits-title").text(content.benefitsTitle || chrome.benefitsTitle);
  setNicheBenefits($, content.benefits, locale);

  // The questions people ask about this use case, answered on the page and
  // in its FAQPage data.
  $("#niche-faq-title").text(content.faqTitle || chrome.faqTitle);
  const faqList = $("#niche-faq-list").empty();
  for (const item of content.faq) {
    const entry = $("<details>").addClass("seo-faq__item");
    const question = $("<summary>");
    setLocalizedText($, question, item.question, locale);
    const answer = $("<p>");
    setLocalizedText($, answer, item.answer, locale);
    faqList.append(entry.append(question, $("<div>").addClass("seo-faq__answer").append(answer)));
  }

  $("#js-year").text(nowDate.slice(0, 4));

  updateAccessibilityMarkup($, accessibilityBundle, locale);
}

// The breadcrumb: home, then this page.
function setUseCaseNavigation($, { chrome, content }) {
  $("#niche-breadcrumb-home").text(chrome.homeLabel);
  $("#niche-breadcrumb-current").text(content.label);
}

function updateNicheStaticUi($, ctx, niche, locale, accessibilityBundle) {
  const { chrome, content } = ctx;
  const localeNicheContent = getNichePageContent(locale);
  const defaultNicheContent = getNichePageContent(defaultLocale);

  fillUseCaseBody($, { chrome, content, image: niche.image, locale, pageKey: niche.key, accessibilityBundle });
  setUseCaseNavigation($, { chrome, content });

  // Body/breadcrumb installation retains its original position before pager
  // writes;both locale sources were already read before any body mutation.
  const adjacentNiches = getCircularAdjacentNiches(niche.key);
  setNichePager($, adjacentNiches, { localeNicheContent, defaultNicheContent, locale, buildPagePath });
}

function rewriteNicheInternalLinks($, locale) {
  const home = buildPagePath(locale, "home");

  // Localize home fragments before footer and legacy Host link adjustments.
  rewriteNicheHomeAnchors($, home);
  rewriteFooterLegalLinks($, locale);
  // Existing localized hospitality copy may retain its former public URL.
  $("a[href]").each((_, element) => {
    const link = $(element), href = link.attr("href");
    if (href === buildPagePath(locale, "automation")) link.attr("href", buildPagePath(locale, HOST_PAGE_KEY));
  });
}

function setUseCaseMeta($, { pageKey, content, chrome, image: pageImage, locale, localeOptions, published, modified, about, mentions, service }) {
  const url = buildPageUrl(locale, pageKey);
  const image = {
    url: `${siteOrigin}/${pageImage.og}`,
    width: pageImage.ogWidth || 1200,
    height: pageImage.ogHeight || 630,
    alt: content.imageAlt,
  };
  const breadcrumb = breadcrumbNode(url, [
    { name: chrome.homeLabel, url: buildPageUrl(locale, "home") },
    { name: content.label, url },
  ]);

  setPageMeta($, {
    locale,
    url,
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: alternatesFor(localeOptions, pageKey),
    ogType: "article",
    published,
    modified,
    image,
    graph: [
      webPageNode({ url, title: content.seoTitle, description: content.seoDescription, locale, image, breadcrumbId: breadcrumb["@id"], about, mentions, datePublished: published, dateModified: modified }),
      breadcrumb,
      ...(content.faq.length ? [faqNode(url, locale, content.faq)] : []),
      ...(service ? [service] : []),
    ],
  });
}

// Every use-case-derived document follows this initialization sequence. An
// optional page skin is applied after direction and before assets/scripts;
// each failure leaves the same earlier mutations and prevents publication.
function prepareUseCaseShell($, locale, pageKey, bodyClass = "") {
  setBodyDirection($, locale);
  if (bodyClass) $("body").addClass(bodyClass);
  rewriteStaticAssets($, locale, pageKey);
  appendScripts($, nicheRuntimeScriptsToAdd, "script[src*='js/accessibility.js']", locale, pageKey);
}

async function buildNichePages(homeData) {
  // Load the shared template once;each definition/locale gets a fresh DOM.
  const template = await readHtmlTemplate(nicheTemplatePath);
  const sitemapEntries = [];

  for (const niche of NICHE_DEFINITIONS) {
    for (const localeOption of homeData.localeOptions) {
      const locale = localeOption.code;
      const ctx = buildNicheContext(homeData, niche, locale);
      const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
      const $ = cheerio.load(template, { decodeEntities: false });

      // Initialize the shared document before localized body/media/metadata.
      prepareUseCaseShell($, locale, niche.key);
      updateNicheStaticUi($, ctx, niche, locale, accessibilityBundle);
      applyNicheSceneMedia($, { scene: homeData.sceneMedia.get(niche.key === "electric-gates" ? "electric-gates-barrier" : niche.key),
        assetPrefix: buildAssetPrefix(locale, niche.key), copy: homeData.homepageCopies[locale].hero.media });
      updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer);
      rewriteNicheInternalLinks($, locale);
      setUseCaseMeta($, { pageKey: niche.key, content: ctx.content, chrome: ctx.chrome, image: niche.image, locale, localeOptions: homeData.localeOptions });

      // Finish this canonical and its ordered redirects before the next
      // locale. Discover aliases only after the canonical write completes.
      await publishNicheVariant({
        locale, pageKey: niche.key,
        render: () => serialize($, homeData, locale, niche.key),
        legacyKeys: () => niche.legacyKeys || [],
      }, { buildOutputFilePath, writeOutputFile, buildPagePath, buildPageUrl, buildRedirectPage });

      // Redirects never appear in the sitemap;failed writes stop publication.
      sitemapEntries.push({
        loc: buildPageUrl(locale, niche.key),
        changefreq: "monthly",
        priority: "0.8",
      });
    }
  }

  return sitemapEntries;
}

// Landing pages (scripts/landing-pages/): a use-case page in every language
// that is not one of the use cases, so it has no place in the pager and no
// page of the site links to it. On top of the use-case sections it carries a
// definition, numbered setup steps and a facts table, and its FAQ questions
// are headings: short, self-contained passages that search and AI answers
// can quote.
function landingSection($, { id, title, background, locale }) {
  const heading = $("<h2>").addClass("niche-section__title").attr("id", `${id}-title`);
  setLocalizedText($, heading, title, locale);
  const container = $("<div>").addClass("container")
    .append($("<div>").addClass("niche-section__header").append(heading));
  const section = $("<section>")
    .addClass(`niche-section landing-section landing-section--${background}`)
    .attr({ id, "aria-labelledby": `${id}-title` })
    .append(container);
  return { section, container };
}

function fillLandingSections($, { content, locale, modified }) {
  const paragraph = (className, text) => {
    const element = $("<p>").addClass(className);
    setLocalizedText($, element, text, locale);
    return element;
  };

  const intro = landingSection($, { id: "landing-intro", title: content.intro.title, background: "soft", locale });
  // Gregorian year and ASCII digits, like every other number on the page.
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC", calendar: "gregory", numberingSystem: "latn" })
    .format(new Date(`${modified}T00:00:00Z`));
  const [before, after] = content.updatedLabel.split("{date}");
  intro.container.append(
    paragraph("landing-intro__text", content.intro.text),
    $("<p>").addClass("landing-updated").append(
      textSpan($, before), $("<time>").attr("datetime", modified).text(date), textSpan($, after)
    )
  );

  const steps = landingSection($, { id: "landing-steps", title: content.steps.title, background: "light", locale });
  const list = $("<ol>").addClass("landing-steps__list");
  for (const item of content.steps.items) {
    const step = $("<li>").addClass("landing-step");
    setLocalizedText($, step, item, locale);
    list.append(step);
  }
  steps.container.append(list, paragraph("landing-steps__note", content.steps.note));

  const facts = landingSection($, { id: "landing-facts", title: content.facts.title, background: "light", locale });
  const body = $("<tbody>");
  for (const row of content.facts.rows) {
    const label = $("<th>").attr("scope", "row");
    const value = $("<td>");
    setLocalizedText($, label, row.label, locale);
    setLocalizedText($, value, row.value, locale);
    body.append($("<tr>").append(label, value));
  }
  facts.container.append(
    $("<table>").addClass("landing-facts__table").attr("aria-labelledby", "landing-facts-title").append(body)
  );

  // Highlights, definition, steps, benefits, facts, FAQ: bands alternate.
  $("#niche-highlights").after(intro.section, steps.section);
  $("#niche-benefits").after(facts.section);

  // Each question is a heading inside its summary, with a stable anchor.
  $("#niche-faq-list summary").each((index, element) => {
    const question = $(element);
    const heading = $("<h3>").addClass("landing-faq__heading").append(question.contents());
    question.append(heading);
    question.closest(".seo-faq__item").attr("id", `faq-${index + 1}`);
  });
}

// Plain text around the date in the "updated" line.
function textSpan($, text) {
  return text ? $("<span>").text(text) : "";
}

async function buildLandingPages(homeData) {
  const template = await readHtmlTemplate(nicheTemplatePath);
  const sitemapEntries = [];

  for (const { key, image, published, modified, about, mentions } of LANDING_PAGES) {
    for (const { code: locale } of homeData.localeOptions) {
      const chrome = getNicheChrome(locale);
      const content = LANDING_PAGE_LOCALES[locale][key];
      const $ = cheerio.load(template, { decodeEntities: false });
      const prefix = buildAssetPrefix(locale, key);

      // Landing content keeps its existing stylesheet/body additions after shell setup.
      prepareUseCaseShell($, locale, key);
      $("link[href*='css/niche.css']").after(`
  <link rel="stylesheet" href="${prefix}css/landing.css?v=20261016a" />`);
      fillUseCaseBody($, { chrome, content, image, locale, pageKey: key, accessibilityBundle: getBundle(homeData.accessibilityCopy, locale) });
      fillLandingSections($, { content, locale, modified });
      setUseCaseNavigation($, { chrome, content });
      $(".niche-hero__pager").remove();
      updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer);
      rewriteNicheInternalLinks($, locale);
      setUseCaseMeta($, {
        pageKey: key, content, chrome, image, locale, localeOptions: homeData.localeOptions,
        published, modified,
        about: [{ "@type": "Thing", name: content.aboutName, sameAs: about }],
        mentions: [{ "@type": "Thing", name: content.mentionsName, sameAs: mentions }],
      });

      await writeOutputFile(buildOutputFilePath(locale, key), serialize($, homeData, locale, key));
      sitemapEntries.push({ loc: buildPageUrl(locale, key), lastmod: modified, changefreq: "monthly", priority: "0.8" });
    }
  }

  return sitemapEntries;
}

async function buildAutoOpenPages(homeData) {
  const template = await readHtmlTemplate(nicheTemplatePath);
  const scene = homeData.sceneMedia.get("auto-open-futuristic");
  if (!scene) throw new Error("Accepted Auto Open scene is required");
  const image = { hero: scene.poster.path, og: scene.poster.path, heroWidth: scene.width, heroHeight: scene.height, ogWidth: scene.width, ogHeight: scene.height };
  const sitemapEntries = [];
  for (const { code: locale } of homeData.localeOptions) {
    const content = getAutoOpenPageContent(locale, homeData.homepageCopies[locale]);
    const chrome = getNicheChrome(locale);
    const $ = cheerio.load(template, { decodeEntities: false });
    // This is the public marketing page shell, not app or native Auto Open logic.
    prepareUseCaseShell($, locale, AUTO_OPEN_PAGE_KEY, "auto-open-page");
    fillUseCaseBody($, { chrome, content, image, locale, pageKey: AUTO_OPEN_PAGE_KEY, accessibilityBundle: getBundle(homeData.accessibilityCopy, locale) });
    $("#niche-faq, #niche-prev-link, #niche-next-link").remove();
    $("script[src*='js/faq.js'], link[href*='css/faq.css']").remove();
    setUseCaseNavigation($, { chrome, content });
    applyNicheSceneMedia($, { scene, assetPrefix: buildAssetPrefix(locale, AUTO_OPEN_PAGE_KEY), copy: homeData.homepageCopies[locale].hero.media });
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer);
    rewriteNicheInternalLinks($, locale);
    setUseCaseMeta($, { pageKey: AUTO_OPEN_PAGE_KEY, content, chrome, image, locale, localeOptions: homeData.localeOptions });
    await writeOutputFile(buildOutputFilePath(locale, AUTO_OPEN_PAGE_KEY), serialize($, homeData, locale, AUTO_OPEN_PAGE_KEY));
    sitemapEntries.push({ loc: buildPageUrl(locale, AUTO_OPEN_PAGE_KEY), changefreq: "monthly", priority: "0.8" });
  }
  return sitemapEntries;
}

// The WIFIGATE Host page copy: scripts/host-page-copy/<locale>.mjs.
const hostPageCopyCache = new Map();
async function loadHostPageCopy(locale) {
  if (!hostPageCopyCache.has(locale)) {
    const file = path.join(repoRoot, "scripts", "host-page-copy", `${locale}.mjs`);
    const copy = await fs.access(file).then(() => import(pathToFileURL(file).href).then((m) => m.default), () => null);
    hostPageCopyCache.set(locale, copy);
  }
  return hostPageCopyCache.get(locale) || loadHostPageCopy(defaultLocale);
}

async function buildGuestInvitesPages(homeData) {
  const template = await readHtmlTemplate(nicheTemplatePath);
  const legacyTemplate = await readHtmlTemplate(guestInvitesTemplatePath);
  const scene = homeData.sceneMedia.get("hotels-airbnb");
  if (!scene) throw new Error("Accepted hospitality media is required for WIFIGATE Host");
  const image = { hero: scene.poster.path, og: scene.poster.path, heroWidth: scene.width, heroHeight: scene.height, ogWidth: scene.width, ogHeight: scene.height };
  const sitemapEntries = [];

  for (const localeOption of homeData.localeOptions) {
    const locale = localeOption.code;
    const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
    const hostCopy = await loadHostPageCopy(locale);
    const $ = cheerio.load(template, { decodeEntities: false });
    const legacy = cheerio.load(legacyTemplate, { decodeEntities: false });
    // Populate the shared plan structure before existing translation and link handling.
    installHostPricingShells(legacy);
    const content = getHostPageContent(hostCopy, homeData.homepageCopies[locale]);
    const chrome = getNicheChrome(locale);

    // Host details and legacy fragment translation follow the same shell boundary.
    prepareUseCaseShell($, locale, guestInvitesPageKey, "wifigate-host-page");
    fillUseCaseBody($, { chrome, content, image, locale, pageKey: guestInvitesPageKey, accessibilityBundle });
    $("#niche-faq, #niche-prev-link, #niche-next-link").remove();
    $("script[src*='js/faq.js'], link[href*='css/faq.css']").remove();
    setUseCaseNavigation($, { chrome, content });
    applyNicheSceneMedia($, { scene, assetPrefix: buildAssetPrefix(locale, guestInvitesPageKey), copy: homeData.homepageCopies[locale].hero.media });
    rewriteStaticAssets(legacy, locale, guestInvitesPageKey);
    applyDataI18nTranslations(legacy, { nav: { home: chrome.homeLabel }, guestInvites: { marketing: hostCopy.marketing } }, locale);
    appendHostMarketingDetails($, { legacyTemplate: legacy });
    $("link[href*='css/niche.css']").after(`<link rel="stylesheet" href="${buildAssetPrefix(locale, guestInvitesPageKey)}css/automation.css?v=20261007c" />`);
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer);
    rewriteNicheInternalLinks($, locale);
    setUseCaseMeta($, { pageKey: guestInvitesPageKey, content, chrome, image, locale, localeOptions: homeData.localeOptions,
      service: { "@type": "Service", "@id": `${siteOrigin}/${HOST_PAGE_KEY}/#service`, name: "WIFIGATE Host", serviceType: "Automated guest access for hospitality", provider: { "@id": ORGANIZATION_ID }, brand: { "@id": BRAND_ID }, url: buildPageUrl(defaultLocale, guestInvitesPageKey), description: hostCopy.metaDescription } });

    // Both historical marketing URLs go directly to the localized canonical,
    // after its completed write and before this locale's sitemap registration.
    await publishNicheVariant({
      locale, pageKey: guestInvitesPageKey,
      render: () => serialize($, homeData, locale, guestInvitesPageKey),
      legacyKeys: () => ["automation", "Automated-Guest-Invites-API"],
    }, { buildOutputFilePath, writeOutputFile, buildPagePath, buildPageUrl, buildRedirectPage });

    // Include the canonical Host URL with its existing monthly/0.9 policy.
    sitemapEntries.push({
      loc: buildPageUrl(locale, guestInvitesPageKey),
      changefreq: "monthly",
      priority: "0.9",
    });
  }

  return sitemapEntries;
}

async function main() {
  // The runtime copy files are plain scripts that set a window global.
  const readWindowGlobal = async (file, name) => {
    const sandbox = { window: {} };
    vm.runInNewContext(await fs.readFile(path.join(repoRoot, "js", file), "utf8"), sandbox);
    return sandbox.window[name];
  };
  const legalCollections = {};
  for (const pageKey of LEGAL_PAGES) {
    legalCollections[pageKey] = Object.fromEntries(
      Object.entries(legalBundles(pageKey)).map(([locale, legal]) => [locale, { legal }])
    );
  }

  const homeData = {
    sceneMedia: await readSceneManifest(repoRoot),
    localeOptions: SITE_LANGUAGES,
    accessibilityCopy: await readWindowGlobal("accessibility-copy.js", "accessibilityCopy"),
    // Loaded once here so every page type shares the same footer wording.
    homepageCopies: await loadHomeCopy(SITE_LANGUAGES),
    cookieCopy: await readWindowGlobal("cookie-consent-copy.js", "WIFIGATE_COOKIE_COPY"),
  };

  for (const localeOption of homeData.localeOptions) {
    if (!homeData.cookieCopy?.[localeOption.code]?.reopen) {
      throw new Error(`Missing cookie settings translation for ${localeOption.code}`);
    }
  }

  const localeCodes = homeData.localeOptions.map((option) => option.code);
  const contentProblems = [...validateNichePageLocales(localeCodes), ...validateLandingPageLocales(localeCodes), ...validateAutoOpenPageLocales(localeCodes, homeData.homepageCopies)];
  if (contentProblems.length) {
    throw new Error(
      `Niche page content validation failed (${contentProblems.length} problems):\n  ${contentProblems.join("\n  ")}`
    );
  }

  const sitemapEntries = [];
  sitemapEntries.push(...(await buildHomePages(homeData)));
  // A consumer media iteration need not regenerate product portals or sign-in.
  if (process.argv.includes("--scene-media-only")) {
    await buildNichePages(homeData);
    return;
  }
  // The shop is a preview and intentionally stays out of the sitemap.
  await buildShopPages(homeData);
  sitemapEntries.push(...(await buildLegalPages(homeData, legalCollections)));
  sitemapEntries.push(...(await buildNichePages(homeData)));
  sitemapEntries.push(...(await buildLandingPages(homeData)));
  sitemapEntries.push(...(await buildAutoOpenPages(homeData)));
  // Consent-runtime delivery updates consumer assets without regenerating
  // Business automation, invitation/API utilities or authentication pages.
  if (process.argv.includes("--consumer-consent-only")) {
    const niches = NICHE_DEFINITIONS.map((niche) => ({ key: niche.key, content: getNichePageContent(defaultLocale).niches[niche.key] }));
    await writeOutputFile(path.join(repoRoot, "404.html"), buildNotFoundPage({ niches, pageUrl: buildPageUrl, cookieConsentVersion: COOKIE_CONSENT_VERSION }));
    return;
  }
  sitemapEntries.push(...(await buildGuestInvitesPages(homeData)));
  sitemapEntries.push(...(await buildUtilityPages(homeData)));
  // Sign-in pages are noindex, so they stay out of the sitemap.
  await buildLoginPages(writeOutputFile);
  // Contact Us is written by hand (it serves the app too); it is dated by its
  // last commit.
  sitemapEntries.push({
    loc: `${siteOrigin}/contact-us/`,
    lastmod: execFileSync("git", ["log", "-1", "--format=%cs", "--", "contact-us/index.html"], { cwd: repoRoot, encoding: "utf8" }).trim() || nowDate,
    changefreq: "yearly",
    priority: "0.5",
  });
  const previousLastmods = await readPreviousLastmods();

  // writeOutputFile, not fs.writeFile: on Windows the dev server can hold this
  // file open and the bare write fails with EBUSY/UNKNOWN.
  await writeOutputFile(path.join(repoRoot, "sitemap.xml"), buildSitemap(sitemapEntries, previousLastmods));
  const englishNiches = NICHE_DEFINITIONS.map((niche) => ({ key: niche.key, content: getNichePageContent(defaultLocale).niches[niche.key] }));
  await writeOutputFile(
    path.join(repoRoot, "llms.txt"),
    buildLlmsTxt({
      homeCopy: homeData.homepageCopies[defaultLocale],
      homeSeo: getNichePageContent(defaultLocale).home,
      niches: englishNiches,
      pageUrl: buildPageUrl,
    })
  );
  await writeOutputFile(path.join(repoRoot, "404.html"), buildNotFoundPage({ niches: englishNiches, pageUrl: buildPageUrl, cookieConsentVersion: COOKIE_CONSENT_VERSION }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
