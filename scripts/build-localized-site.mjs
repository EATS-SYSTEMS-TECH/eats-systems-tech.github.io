import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { NICHE_CHROME } from "./niche-content.mjs";
import { NICHE_DEFINITIONS, NICHE_PAGE_LOCALES, validateNichePageLocales } from "./niche-pages/index.mjs";
import { SITE_LOGIN_LABELS, SITE_NAVIGATION } from "./site-navigation.mjs";
import { RTL_LANGUAGES, SITE_LANGUAGES } from "./site-languages.mjs";
import { accessibilityLinkLabels } from "./legal/footer-labels.mjs";
import { wifigateLinkLocales } from "./wifigate-link-locales.mjs";
import { buildLlmsTxt } from "./llms-txt.mjs";
import { LEGAL_PAGES, legalBundles, renderLegalMain } from "./legal/legal-pages.mjs";
import { buildNotFoundPage } from "./not-found-page.mjs";
import { BRAND_ID, ORGANIZATION_ID, SITE_ORIGIN, breadcrumbNode, faqNode, setPageMeta, webPageNode } from "./seo.mjs";

const repoRoot = process.cwd();
const siteOrigin = SITE_ORIGIN;
const defaultLocale = "en";
const nowDate = new Date().toISOString().slice(0, 10);
const guestInvitesPageKey = "automation";
const utilityPageKeys = ["wifigate-link", "wifigate-api"];
const COOKIE_CONSENT_VERSION = "20261007c";

const homeTemplatePath = path.join(repoRoot, "templates", "index.template.html");
const homeCopyDirectory = path.join(repoRoot, "scripts", "homepage-copy");
const utilityTemplatePath = path.join(repoRoot, "templates", "wifigate-link.template.html");
const nicheTemplatePath = path.join(repoRoot, "templates", "niche.template.html");
const guestInvitesTemplatePath = path.join(repoRoot, "templates", "guest-invites-api.template.html");
const legalTemplatePath = path.join(repoRoot, "templates", "legal.template.html");


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
    ...localeOptions.map((option) => ({ hreflang: option.code, href: buildPageUrl(option.code, pageKey) })),
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
      statusOpening: copy.statusOpening,
      statusMissing: copy.statusMissing,
      statusFallback: copy.statusFallback,
      copyButton: copy.copyButton,
      copiedButton: copy.copiedButton,
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

  // The h1 opens with the brand, both of its spellings and the category in
  // the page language (the homepage SEO title), above the headline.
  const category = getNichePageContent(locale).home.seoTitle.replace(/^WIFIGATE \| /, "");
  // One inline run (the eyebrow is a flex row with its accent line); the Latin
  // brand is isolated so it never reorders the words of a right-to-left line.
  const brand = $("<bdi>").text("WIFIGATE (WiFi Gate)");
  const words = $("<span>").text(category);
  const line = $("<span>");
  if (isRtl(locale)) line.append(words, " · ", brand);
  else line.append(brand, " · ", words);
  $("#hero-title .hero__eyebrow").empty().attr("dir", isRtl(locale) ? "rtl" : "ltr").append(line);
  setLocalizedLines($, "#hero-title .hero__title-lines", copy.hero.titleLines, locale);
  setLocalizedLines($, "#hero-subtitle", splitHeroSubtitleLines(copy.hero.subtitle), locale);
  setLocalizedText($, ".hero__btn-primary", copy.hero.primaryCta, locale);
  setLocalizedText($, ".hero__btn-secondary", copy.hero.secondaryCta, locale);
  $(".hero__proof").attr("aria-label", copy.hero.proofLabel).attr("dir", dir);
  $(".hero__proof li").each((index, element) => $(element).text(copy.hero.proof[index]));

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

  $("a[href='../index.html']").attr("href", home);
  $("a[href^='../index.html']").each((_, element) => {
    const href = $(element).attr("href") || "";
    const hashIndex = href.indexOf("#");
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    $(element).attr("href", `${home}${hash}`);
  });
  rewriteFooterLegalLinks($, locale);
  // Legal pages also cross-link each other from inside the body copy.
  $("a[href='../terms-and-conditions/']").attr("href", buildPagePath(locale, "terms-and-conditions"));
  $("a[href='../privacy-policy/']").attr("href", buildPagePath(locale, "privacy-policy"));
  $("a[href='../cookies/']").attr("href", buildPagePath(locale, "cookies"));

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
      .attr("href", home + "#" + item.hash);
    if (item.key === "contact") link.addClass("nav__contact-link");
    setLocalizedText($, link, copy[item.key], locale);
    menu.append(link);
  }
  $(".nav").attr("aria-label", copy.ariaLabel);
  $(".nav__logo-link").attr({ href: home + "#home", "aria-label": "WIFIGATE" });
  $(".nav__toggle").attr("aria-label", copy.toggleLabel);
  const loginLabel = SITE_LOGIN_LABELS[locale];
  if (!loginLabel) throw new Error(`No header login label for ${locale}`);
  setLocalizedText($, $(".site-login__trigger"), loginLabel, locale);
  $("#language-button").attr("aria-label", copy.selectLanguageLabel);
  setLanguageSelector($, homeData.localeOptions, locale, pageKey);
  const prefix = buildAssetPrefix(locale, pageKey);
  $("head").append('<link rel="stylesheet" href="' + prefix + 'css/site-header.css?v=20261007c">');
  $("script[src*='js/navigation.js']").attr("src", prefix + "js/navigation.js?v=20261007a");
}

// JSON safe to embed in an inline <script>.
function inlineJson(value) {
  return JSON.stringify(value).replace(/</g, "<");
}

function serialize($, homeData, locale, pageKey = "home") {
  updateSharedHeader($, homeData, locale, pageKey);
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
  $("body").append(`<script src="${prefix}js/cookie-consent.js?v=${COOKIE_CONSENT_VERSION}" defer></script>`);
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

function buildRedirectPage(targetPath, canonicalUrl) {
  return ensureTrailingNewline(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Redirecting...</title>
  <link rel="canonical" href="${canonicalUrl}" />
  <meta http-equiv="refresh" content="0; url=${targetPath}" />
  <script>window.location.replace(${JSON.stringify(targetPath)});</script>
</head>
<body>
  <p>Redirecting to <a href="${targetPath}">${targetPath}</a>...</p>
</body>
</html>
`);
}

// lastmod is the day a page's content last changed: today for a page this
// build rewrote, otherwise the date the previous sitemap gave it.
async function readPreviousLastmods() {
  const previous = await fs.readFile(path.join(repoRoot, "sitemap.xml"), "utf8").catch(() => "");
  return new Map([...previous.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map((m) => [m[1], m[2]]));
}

function pageFileForUrl(url) {
  return path.resolve(repoRoot, `.${new URL(url).pathname}`, "index.html");
}

function buildSitemap(urlEntries, previousLastmods) {
  for (const entry of urlEntries) {
    const changed = changedFiles.has(pageFileForUrl(entry.loc));
    entry.lastmod = entry.lastmod || (!changed && previousLastmods.get(entry.loc)) || nowDate;
  }
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries.map(
      (entry) => [
        "  <url>",
        `    <loc>${entry.loc}</loc>`,
        `    <lastmod>${entry.lastmod}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        "  </url>",
      ].join("\n")
    ),
    "</urlset>",
    "",
  ];

  return lines.join("\n");
}

async function buildHomePages(homeData) {
  const template = await readHtmlTemplate(homeTemplatePath);
  const homepageCopies = homeData.homepageCopies;
  const sitemapEntries = [];

  for (const localeOption of homeData.localeOptions) {
    const locale = localeOption.code;
    const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
    const $ = cheerio.load(template, { decodeEntities: false });

    setBodyDirection($, locale);
    rewriteStaticAssets($, locale, "home");
    removeScripts($, homeRuntimeScriptsToRemove);
    appendScripts($, homeRuntimeScriptsToAdd, "script[src*='js/main.js']", locale, "home");
    updateFooterStaticUi($, locale, homepageCopies[locale].footer);
    updateHomeStaticUi($, homepageCopies[locale], accessibilityBundle, locale);
    rewriteHomeInternalLinks($, locale);
    updateHomeWhereLinks($, locale);
    applyHomepageCopy($, homepageCopies[locale], locale);
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

function setNicheList($, selector, items, className) {
  const list = $(selector);
  if (!list.length) {
    return;
  }

  list.empty();
  (items || []).forEach((item) => {
    list.append($("<li>").addClass(className).text(item));
  });
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

// The benefits grid is a 3x3 square: eight bullets around an inert tile in
// the middle cell, so the square reads as deliberately incomplete. Every niche
// carries exactly eight bullets -- verify-site.mjs enforces that -- and any
// other count simply renders as a plain grid instead of a broken square.
function setNicheBenefits($, bullets) {
  const list = $("#niche-benefits-list");
  if (!list.length) {
    return;
  }

  const items = Array.isArray(bullets) ? bullets : [];
  const centerGap = items.length === 8;

  list.empty();
  items.forEach((item, index) => {
    if (centerGap && index === 4) {
      list.append($("<li>").addClass("niche-benefit niche-benefit--gap").attr("aria-hidden", "true"));
    }
    list.append($("<li>").addClass("niche-benefit").text(item));
  });
}

function getCircularAdjacentNiches(currentKey) {
  const index = NICHE_DEFINITIONS.findIndex((entry) => entry.key === currentKey);
  if (index === -1) {
    return null;
  }

  const prevIndex = (index - 1 + NICHE_DEFINITIONS.length) % NICHE_DEFINITIONS.length;
  const nextIndex = (index + 1) % NICHE_DEFINITIONS.length;

  return {
    previous: NICHE_DEFINITIONS[prevIndex],
    next: NICHE_DEFINITIONS[nextIndex],
  };
}

function updateNicheStaticUi($, ctx, niche, locale, accessibilityBundle) {
  const { chrome, content } = ctx;
  const localeNicheContent = getNichePageContent(locale);
  const defaultNicheContent = getNichePageContent(defaultLocale);
  const assetPrefix = buildAssetPrefix(locale, niche.key);


  $("#niche-breadcrumb-home").text(chrome.homeLabel);
  $("#niche-breadcrumb-current").text(content.label);

  $("#niche-eyebrow").text(chrome.eyebrow);
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
  // `heroLead` that is it, and the bullets appear only in the benefits grid;
  // otherwise the first couple of bullets stand in as proof points, mirroring
  // the homepage hero. Never both, so no copy is repeated on the page.
  if (content.heroLead) {
    $("#niche-hero-proof").remove();
  } else {
    setNicheList($, "#niche-hero-proof", (content.bullets || []).slice(0, 2), "niche-hero__proof-item");
  }
  $("#niche-hero-cta-label").text("WhatsApp @WIFIGATE");
  $("#niche-hero-benefits").text(chrome.benefitsTitle);


  $("#niche-image")
    .attr("src", `${assetPrefix}${niche.image.hero}`)
    .attr("alt", content.imageAlt)
    .attr("width", String(niche.image.heroWidth))
    .attr("height", String(niche.image.heroHeight));

  const adjacentNiches = getCircularAdjacentNiches(niche.key);
  if (adjacentNiches) {
    const previousLabel = localeNicheContent?.niches?.[adjacentNiches.previous.key]?.label
      || defaultNicheContent?.niches?.[adjacentNiches.previous.key]?.label
      || adjacentNiches.previous.key;
    const nextLabel = localeNicheContent?.niches?.[adjacentNiches.next.key]?.label
      || defaultNicheContent?.niches?.[adjacentNiches.next.key]?.label
      || adjacentNiches.next.key;

    $("#niche-prev-link")
      .attr("href", buildPagePath(locale, adjacentNiches.previous.key))
      .attr("aria-label", previousLabel)
      .attr("title", previousLabel);

    $("#niche-next-link")
      .attr("href", buildPagePath(locale, adjacentNiches.next.key))
      .attr("aria-label", nextLabel)
      .attr("title", nextLabel);
  }

  $("#niche-benefits-title").text(chrome.benefitsTitle);
  setNicheBenefits($, content.bullets);

  // The questions people ask about this use case, answered on the page and
  // in its FAQPage data.
  $("#niche-faq-title").text(chrome.faqTitle);
  const faqList = $("#niche-faq-list").empty();
  for (const item of content.faq) {
    const entry = $("<details>").addClass("niche-faq__item");
    const question = $("<summary>").addClass("niche-faq__question");
    setLocalizedText($, question, item.question, locale);
    const answer = $("<p>").addClass("niche-faq__answer");
    setLocalizedText($, answer, item.answer, locale);
    faqList.append(entry.append(question, answer));
  }

  // Every other use case and WIFIGATE Host, so each page leads to the rest.
  $("#niche-related-title").text(chrome.relatedTitle);
  const related = $("#niche-related-list").empty();
  for (const other of NICHE_DEFINITIONS) {
    if (other.key === niche.key) continue;
    const link = $("<a>").addClass("niche-related__link").attr("href", buildPagePath(locale, other.key));
    setLocalizedText($, link, localeNicheContent.niches[other.key].label, locale);
    related.append($("<li>").append(link));
  }
  related.append($("<li>").append($("<a>").addClass("niche-related__link").attr("href", buildPagePath(locale, guestInvitesPageKey)).text("WIFIGATE Host")));
  // No closing CTA section: the hero already carries the WhatsApp action and
  // the shared footer carries support + WhatsApp Business.

  $("#js-year").text(nowDate.slice(0, 4));

  updateAccessibilityMarkup($, accessibilityBundle, locale);
}

function rewriteNicheInternalLinks($, locale) {
  const home = buildPagePath(locale, "home");

  $("a[href^='../index.html']").each((_, element) => {
    const href = $(element).attr("href") || "";
    const hashIndex = href.indexOf("#");
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    $(element).attr("href", `${home}${hash}`);
  });
  rewriteFooterLegalLinks($, locale);
}

function setNicheMeta($, ctx, niche, locale, localeOptions) {
  const url = buildPageUrl(locale, niche.key);
  const { content } = ctx;
  const image = {
    url: `${siteOrigin}/${niche.image.og}`,
    width: 1200,
    height: 630,
    alt: content.imageAlt,
  };
  const breadcrumb = breadcrumbNode(url, [
    { name: ctx.chrome.homeLabel, url: buildPageUrl(locale, "home") },
    { name: content.label, url },
  ]);

  setPageMeta($, {
    locale,
    url,
    title: content.seoTitle,
    description: content.seoDescription,
    alternates: alternatesFor(localeOptions, niche.key),
    ogType: "article",
    image,
    graph: [
      webPageNode({ url, title: content.seoTitle, description: content.seoDescription, locale, image, breadcrumbId: breadcrumb["@id"] }),
      breadcrumb,
      faqNode(url, locale, content.faq),
    ],
  });
}

async function buildNichePages(homeData) {
  const template = await readHtmlTemplate(nicheTemplatePath);
  const sitemapEntries = [];

  for (const niche of NICHE_DEFINITIONS) {
    for (const localeOption of homeData.localeOptions) {
      const locale = localeOption.code;
      const ctx = buildNicheContext(homeData, niche, locale);
      const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
      const $ = cheerio.load(template, { decodeEntities: false });

      setBodyDirection($, locale);
      rewriteStaticAssets($, locale, niche.key);
      appendScripts($, nicheRuntimeScriptsToAdd, "script[src*='js/accessibility.js']", locale, niche.key);
      updateNicheStaticUi($, ctx, niche, locale, accessibilityBundle);
      updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer);
      rewriteNicheInternalLinks($, locale);
      setNicheMeta($, ctx, niche, locale, homeData.localeOptions);

      const outputFile = buildOutputFilePath(locale, niche.key);
      await writeOutputFile(outputFile, serialize($, homeData, locale, niche.key));

      for (const legacyKey of niche.legacyKeys || []) {
        const redirectFile = buildOutputFilePath(locale, legacyKey);
        await writeOutputFile(
          redirectFile,
          buildRedirectPage(buildPagePath(locale, niche.key), buildPageUrl(locale, niche.key))
        );
      }

      sitemapEntries.push({
        loc: buildPageUrl(locale, niche.key),
        changefreq: "monthly",
        priority: "0.8",
      });
    }
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

function rewriteGuestInvitesInternalLinks($, locale) {
  const home = buildPagePath(locale, "home");

  $("a[href^='../index.html']").each((_, element) => {
    const href = $(element).attr("href") || "";
    const hashIndex = href.indexOf("#");
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    $(element).attr("href", `${home}${hash}`);
  });
  rewriteFooterLegalLinks($, locale);
}

function reorderGuestInvitesSections($) {
  const hero = $(".wa-hero");
  const pricing = $(".wa-pricing");
  if (hero.length && pricing.length) {
    hero.after(pricing);
  }
}

function setGuestInvitesMeta($, locale, localeOptions, strings) {
  const url = buildPageUrl(locale, guestInvitesPageKey);
  const breadcrumb = breadcrumbNode(url, [
    { name: "WIFIGATE", url: buildPageUrl(locale, "home") },
    { name: "WIFIGATE Host", url },
  ]);

  setPageMeta($, {
    locale,
    url,
    title: strings.metaTitle,
    description: strings.metaDescription,
    alternates: alternatesFor(localeOptions, guestInvitesPageKey),
    image: pageImages.guestInvites,
    graph: [
      webPageNode({ url, title: strings.metaTitle, description: strings.metaDescription, locale, image: pageImages.guestInvites, breadcrumbId: breadcrumb["@id"] }),
      breadcrumb,
      // WIFIGATE Host: the commercial service that turns bookings into
      // time-limited guest access.
      {
        "@type": "Service",
        "@id": `${siteOrigin}/automation/#service`,
        name: "WIFIGATE Host",
        serviceType: "Automated guest access for hospitality",
        provider: { "@id": ORGANIZATION_ID },
        brand: { "@id": BRAND_ID },
        url: buildPageUrl(defaultLocale, guestInvitesPageKey),
        description: strings.metaDescription,
      },
    ],
  });
}

async function buildGuestInvitesPages(homeData) {
  const template = await readHtmlTemplate(guestInvitesTemplatePath);
  const sitemapEntries = [];

  for (const localeOption of homeData.localeOptions) {
    const locale = localeOption.code;
    const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
    const hostCopy = await loadHostPageCopy(locale);
    const $ = cheerio.load(template, { decodeEntities: false });

    setBodyDirection($, locale);
    rewriteStaticAssets($, locale, guestInvitesPageKey);
    appendScripts($, nicheRuntimeScriptsToAdd, "script[src*='js/accessibility.js']", locale, guestInvitesPageKey);
    applyDataI18nTranslations($, { nav: { home: getNicheChrome(locale).homeLabel }, guestInvites: { marketing: hostCopy.marketing } }, locale);
    updateFooterStaticUi($, locale, homeData.homepageCopies[locale].footer);
    updateAccessibilityMarkup($, accessibilityBundle, locale);
    rewriteGuestInvitesInternalLinks($, locale);
    reorderGuestInvitesSections($);
    setGuestInvitesMeta($, locale, homeData.localeOptions, hostCopy);

    const outputFile = buildOutputFilePath(locale, guestInvitesPageKey);
    await writeOutputFile(outputFile, serialize($, homeData, locale, guestInvitesPageKey));

    // Preserve the former public Host marketing URL discovered in Search Console.
    await writeOutputFile(
      buildOutputFilePath(locale, "Automated-Guest-Invites-API"),
      buildRedirectPage(buildPagePath(locale, guestInvitesPageKey), buildPageUrl(locale, guestInvitesPageKey))
    );

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

  const contentProblems = validateNichePageLocales(homeData.localeOptions.map((option) => option.code));
  if (contentProblems.length) {
    throw new Error(
      `Niche page content validation failed (${contentProblems.length} problems):\n  ${contentProblems.join("\n  ")}`
    );
  }

  const sitemapEntries = [];
  sitemapEntries.push(...(await buildHomePages(homeData)));
  sitemapEntries.push(...(await buildLegalPages(homeData, legalCollections)));
  sitemapEntries.push(...(await buildNichePages(homeData)));
  sitemapEntries.push(...(await buildGuestInvitesPages(homeData)));
  sitemapEntries.push(...(await buildUtilityPages(homeData)));
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
