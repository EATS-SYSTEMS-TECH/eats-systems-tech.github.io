import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import * as cheerio from "cheerio";
import { homeSeoLocales } from "./home-seo-locales.mjs";
import { wifigateLinkLocales } from "./wifigate-link-locales.mjs";
import { NICHE_DEFINITIONS, NICHE_CHROME, NICHE_OVERRIDES } from "./niche-content.mjs";

const repoRoot = process.cwd();
const siteOrigin = "https://wifigate.io";
const defaultLocale = "en";
const nowDate = "2026-06-20";
const guestInvitesPageKey = "Automated-Guest-Invites-API";

const homeTemplatePath = path.join(repoRoot, "templates", "index.template.html");
const utilityTemplatePath = path.join(repoRoot, "templates", "wifigate-link.template.html");
const nicheTemplatePath = path.join(repoRoot, "templates", "niche.template.html");
const guestInvitesTemplatePath = path.join(repoRoot, "templates", "guest-invites-api.template.html");
const legalTemplatePaths = {
  cookies: path.join(repoRoot, "templates", "legal", "cookies.template.html"),
  "privacy-policy": path.join(repoRoot, "templates", "legal", "privacy-policy.template.html"),
  "terms-and-conditions": path.join(repoRoot, "templates", "legal", "terms-and-conditions.template.html"),
};

const homeDataFiles = [
  "js/translations.js",
  "js/translations-extra.js",
  "js/features-refresh.js",
  "js/guest-invites-home.js",
  "js/application-stories.js",
  "js/application-stories-extra.js",
  "js/i18n.js",
  "js/accessibility.js",
];

const legalDataFiles = {
  cookies: ["js/translations.js", "js/translations-extra.js", "js/cookies-translations.js", "js/cookies-translations-extra.js"],
  "privacy-policy": [
    "js/translations.js",
    "js/translations-extra.js",
    "js/privacy-translations.js",
    "js/privacy-translations-extra.js",
  ],
  "terms-and-conditions": [
    "js/translations.js",
    "js/translations-extra.js",
    "js/legal-translations.js",
    "js/legal-translations-extra.js",
  ],
};

const homeRuntimeScriptsToRemove = [
  "js/translations.js",
  "js/translations-extra.js",
  "js/features-refresh.js",
  "js/i18n.js",
  "js/application-stories.js",
  "js/application-stories-extra.js",
];

const legalRuntimeScriptsToRemove = [
  "js/translations.js",
  "js/translations-extra.js",
  "js/cookies-translations.js",
  "js/cookies-translations-extra.js",
  "js/privacy-translations.js",
  "js/privacy-translations-extra.js",
  "js/legal-translations.js",
  "js/legal-translations-extra.js",
  "js/i18n.js",
  "js/hero.js",
];

const homeRuntimeScriptsToAdd = [
  "/js/locale-redirect.js?v=20260620a",
  "/js/language-selector.js?v=20260620a",
];

const legalRuntimeScriptsToAdd = [
  "/js/locale-redirect.js?v=20260620a",
  "/js/language-selector.js?v=20260620a",
];

const nicheRuntimeScriptsToAdd = [
  "/js/locale-redirect.js?v=20260620a",
  "/js/language-selector.js?v=20260620a",
];

const pageImages = {
  home: "https://wifigate.io/assets/img/wifigate_homepage.webp",
  legal: "https://wifigate.io/assets/img/wifigate_homepage.webp",
  utility: "https://wifigate.io/logo-1024.png",
  niche: "https://wifigate.io/assets/img/wifigate_homepage.webp",
  guestInvites: "https://wifigate.io/assets/img/wifigate_homepage.webp",
};

function createSandbox() {
  const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    window: {},
    history: { pushState() {} },
    location: { hash: "", href: siteOrigin, pathname: "/" },
    navigator: {},
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {},
      removeItem() {},
    },
    document: {
      documentElement: {
        getAttribute(name) {
          if (name === "lang") return defaultLocale;
          return null;
        },
        setAttribute() {},
        classList: { toggle() {} },
      },
      body: { classList: { add() {}, remove() {}, toggle() {} } },
      addEventListener() {},
      removeEventListener() {},
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getElementById() {
        return null;
      },
    },
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    IntersectionObserver: class IntersectionObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    Element: class Element {},
    requestAnimationFrame(callback) {
      return callback();
    },
    cancelAnimationFrame() {},
    matchMedia() {
      return {
        matches: false,
        addEventListener() {},
        addListener() {},
      };
    },
  };

  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  sandbox.global = sandbox;
  return vm.createContext(sandbox);
}

async function runFilesInSandbox(files) {
  const sandbox = createSandbox();

  for (const relativeFile of files) {
    const absoluteFile = path.join(repoRoot, relativeFile);
    const source = await fs.readFile(absoluteFile, "utf8");
    vm.runInContext(source, sandbox, { filename: absoluteFile });
  }

  return sandbox;
}

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

function normalizeLocalePath(locale) {
  return locale.toLowerCase();
}

function isRtl(locale) {
  return locale === "he" || locale === "ar";
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
              <img src="${toStaticAssetPath(`assets/img/flags/${option.flagSrc}`, assetPrefix)}" alt="${option.flagAlt}" width="50" height="33" />
            </span>
            <span class="language-selector__label" dir="${itemDir}">${option.label}</span>
          </a>`;
    })
    .join("");
}

function setLanguageSelector($, options, locale, pageKey) {
  const currentOption = options.find((option) => option.code === locale) || options[0];
  const assetPrefix = buildAssetPrefix(locale, pageKey);

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

function replaceAlternateLinks($, localeOptions, pageKey) {
  $("link[rel='alternate']").remove();

  const canonical = $("link[rel='canonical']").first();
  const links = [
    `<link rel="alternate" hreflang="x-default" href="${buildPageUrl(defaultLocale, pageKey)}" />`,
    ...localeOptions.map(
      (option) => `<link rel="alternate" hreflang="${option.code}" href="${buildPageUrl(option.code, pageKey)}" />`
    ),
  ].join("\n  ");

  if (canonical.length) {
    canonical.after(`\n  ${links}`);
  } else {
    $("head").append(`\n  ${links}`);
  }
}

function setMetaByName($, name, content) {
  let element = $(`meta[name='${name}']`).first();
  if (!element.length) {
    $("head").append(`\n  <meta name="${name}" content="" />`);
    element = $(`meta[name='${name}']`).first();
  }
  element.attr("content", content);
}

function setMetaByProperty($, property, content) {
  let element = $(`meta[property='${property}']`).first();
  if (!element.length) {
    $("head").append(`\n  <meta property="${property}" content="" />`);
    element = $(`meta[property='${property}']`).first();
  }
  element.attr("content", content);
}

function replaceStructuredData($, data) {
  $("script[type='application/ld+json']").remove();
  $("head").append(`\n  <script type="application/ld+json">\n${JSON.stringify(data, null, 2)}\n  </script>`);
}

function applyDataI18nTranslations($, bundle) {
  $("[data-i18n]").each((_, element) => {
    const key = $(element).attr("data-i18n");
    const translatedValue = key ? getNestedValue(bundle, key) : undefined;

    if (typeof translatedValue === "string") {
      $(element).text(translatedValue);
    }
  });
}

function updateAccessibilityMarkup($, accessibilityBundle) {
  $(".skip-link").text(accessibilityBundle.skipLink);
  $("#a11y-fab").attr("aria-label", accessibilityBundle.openButton);
  $("#a11y-fab").attr("title", accessibilityBundle.openButton);
  $("#a11y-eyebrow").text(accessibilityBundle.eyebrow);
  $("#a11y-close").attr("aria-label", accessibilityBundle.closeButton);
  $("#a11y-title").text(accessibilityBundle.title);
  $("#a11y-description").text(accessibilityBundle.description);
  $("#a11y-status").text(accessibilityBundle.statusDefault);
  $("#a11y-reset").text(accessibilityBundle.reset);
  $("#a11y-support-title").text(accessibilityBundle.siteSupportTitle);

  $(".a11y-option").each((_, element) => {
    const key = $(element).attr("data-a11y-setting");
    const optionCopy = key ? accessibilityBundle.options[key] : null;
    if (!optionCopy) {
      return;
    }

    $(element).find(".a11y-option__title").text(optionCopy.label);
    $(element).find(".a11y-option__description").text(optionCopy.description);
  });

  $(".a11y-support__item").each((index, element) => {
    const text = accessibilityBundle.siteSupport[index] || accessibilityBundle.siteSupport.at(-1) || "";
    $(element).text(text);
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

function getHomeSeoTitle(locale, bundle) {
  return homeSeoLocales[locale]?.title || (locale === defaultLocale
    ? "WIFIGATE - Smart Access Control System | Secure, No Subscriptions"
    : `WIFIGATE | ${bundle.footer.tagline}`);
}

function buildHomeMeta(bundle, locale) {
  const title = getHomeSeoTitle(locale, bundle);
  const description = bundle.action.subtitle || bundle.hero.subtitle;

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    keywords: [
      "WIFIGATE",
      bundle.applications?.electricGates,
      bundle.applications?.privateHomes,
      bundle.applications?.residentialComplexes,
      bundle.applications?.officeBuildings,
      bundle.applications?.magneticLocks,
    ]
      .filter(Boolean)
      .join(", "),
  };
}

function buildLanguageSchemaTitle(locale, bundle) {
  return locale === defaultLocale
    ? "WIFIGATE - Smart Access Control System"
    : `WIFIGATE | ${bundle.footer.tagline}`;
}

function setHomeMeta($, bundle, locale, localeOptions) {
  const meta = buildHomeMeta(bundle, locale);
  const url = buildPageUrl(locale, "home");

  $("title").text(meta.title);
  setMetaByName($, "description", meta.description);
  setMetaByName($, "keywords", meta.keywords);
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, localeOptions, "home");

  setMetaByProperty($, "og:type", "website");
  setMetaByProperty($, "og:url", url);
  setMetaByProperty($, "og:title", meta.ogTitle);
  setMetaByProperty($, "og:description", meta.ogDescription);
  setMetaByProperty($, "og:image", pageImages.home);
  setMetaByProperty($, "twitter:card", "summary_large_image");
  setMetaByProperty($, "twitter:url", url);
  setMetaByProperty($, "twitter:title", meta.ogTitle);
  setMetaByProperty($, "twitter:description", meta.ogDescription);
  setMetaByProperty($, "twitter:image", pageImages.home);

  replaceStructuredData($, {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "WIFIGATE",
    description: meta.description,
    inLanguage: locale,
    url,
    image: pageImages.home,
    brand: {
      "@type": "Brand",
      name: "EATS SYSTEMS TECH",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "EATS SYSTEMS TECH",
      },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "5",
      reviewCount: "1",
    },
  });

  return meta;
}

function setLegalMeta($, locale, pageKey, localeOptions, legalBundle) {
  const metaTags = legalBundle.legal?.metaTags || {};
  const title = metaTags.title || "WIFIGATE";
  const description = metaTags.description || "";
  const url = buildPageUrl(locale, pageKey);

  $("title").text(title);
  setMetaByName($, "description", description);
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, localeOptions, pageKey);

  setMetaByProperty($, "og:type", "article");
  setMetaByProperty($, "og:url", url);
  setMetaByProperty($, "og:title", title);
  setMetaByProperty($, "og:description", description);
  setMetaByProperty($, "og:image", pageImages.legal);
  setMetaByProperty($, "twitter:card", "summary_large_image");
  setMetaByProperty($, "twitter:url", url);
  setMetaByProperty($, "twitter:title", title);
  setMetaByProperty($, "twitter:description", description);
  setMetaByProperty($, "twitter:image", pageImages.legal);

  replaceStructuredData($, {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    inLanguage: locale,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "WIFIGATE",
      url: siteOrigin,
    },
  });
}

function getUtilityLocaleCopy(locale) {
  return wifigateLinkLocales[locale] || wifigateLinkLocales[defaultLocale];
}

function setUtilityMeta($, locale, localeOptions, copy) {
  const pageKey = "wifigate-link";
  const url = buildPageUrl(locale, pageKey);
  const title = copy.socialTitle || copy.pageTitle;

  $("title").text(title);
  setMetaByName($, "description", copy.description);
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, localeOptions, pageKey);

  setMetaByProperty($, "og:type", "website");
  setMetaByProperty($, "og:url", url);
  setMetaByProperty($, "og:title", copy.socialTitle);
  setMetaByProperty($, "og:description", copy.description);
  setMetaByProperty($, "og:image", pageImages.utility);
  setMetaByProperty($, "twitter:card", "summary_large_image");
  setMetaByProperty($, "twitter:url", url);
  setMetaByProperty($, "twitter:title", copy.socialTitle);
  setMetaByProperty($, "twitter:description", copy.description);
  setMetaByProperty($, "twitter:image", pageImages.utility);

  replaceStructuredData($, {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: copy.description,
    inLanguage: locale,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: "WIFIGATE",
      url: siteOrigin,
    },
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

function updateHomeStaticUi($, bundle, accessibilityBundle, homeData, locale) {
  $(".nav__toggle").attr("aria-label", "Toggle navigation menu");
  $("#language-button").attr("aria-label", "Select language");
  $("#hero-rotator").text(bundle.hero.rotator.phrases[0]);
  $("#hero-mute-toggle").attr("aria-label", bundle.hero.media.unmute);
  $("#hero-mute-toggle").attr("title", bundle.hero.media.unmute);
  $("#hero-replay span").text(bundle.hero.media.replay);
  $("#hero-replay").attr("aria-label", bundle.hero.media.replay);
  $("#hero-replay").attr("title", bundle.hero.media.replay);

  updateAccessibilityMarkup($, accessibilityBundle);
}

function rewriteHomeNicheLinks($, locale) {
  NICHE_DEFINITIONS.forEach((niche) => {
    $(`.where-list__link[href='where-story-${niche.slug}/']`).attr("href", buildPagePath(locale, niche.key));
  });
}

function rewriteHomeGuestInvitesLink($, locale) {
  $(`a[href='${guestInvitesPageKey}/']`).attr("href", buildPagePath(locale, guestInvitesPageKey));
}

function insertPageDataScript($, scriptId, data, anchorSelector) {
  $(anchorSelector).before(
    `\n  <script id="${scriptId}" type="application/json">${JSON.stringify(data)}</script>`
  );
}

function rewriteHomeInternalLinks($, locale) {
  $("a[href='terms-and-conditions/']").attr("href", buildPagePath(locale, "terms-and-conditions"));
  $("a[href='privacy-policy/']").attr("href", buildPagePath(locale, "privacy-policy"));
  $("a[href='cookies/']").attr("href", buildPagePath(locale, "cookies"));
}

function rewriteLegalInternalLinks($, locale, pageKey) {
  $(".nav__logo-link").attr("href", `${buildPagePath(locale, "home")}#home`);
  $("a[href='../index.html']").attr("href", buildPagePath(locale, "home"));
  $("a[href='../index.html#home']").attr("href", `${buildPagePath(locale, "home")}#home`);
  $("a[href='../terms-and-conditions/']").attr("href", buildPagePath(locale, "terms-and-conditions"));
  $("a[href='../privacy-policy/']").attr("href", buildPagePath(locale, "privacy-policy"));
  $("a[href='../cookies/']").attr("href", buildPagePath(locale, "cookies"));

  $(".btn.btn--ghost").each((_, element) => {
    const href = $(element).attr("href");
    if (href === "../index.html") {
      $(element).attr("href", buildPagePath(locale, "home"));
    }
  });

  $("#language-button").attr("aria-label", "Select language");
  $(".nav__logo-link").attr("aria-label", "Back to WIFIGATE home page");
}

function ensureTrailingNewline(source) {
  return source.endsWith("\n") ? source : `${source}\n`;
}

function serialize($) {
  return ensureTrailingNewline($.html({ decodeEntities: false }));
}

async function writeOutputFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

function buildSitemap(urlEntries) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries.map(
      (entry) => [
        "  <url>",
        `    <loc>${entry.loc}</loc>`,
        `    <lastmod>${nowDate}</lastmod>`,
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
  const template = await fs.readFile(homeTemplatePath, "utf8");
  const sitemapEntries = [];

  for (const localeOption of homeData.localeOptions) {
    const locale = localeOption.code;
    const bundle = getBundle(homeData.translations, locale);
    const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
    const $ = cheerio.load(template, { decodeEntities: false });

    setBodyDirection($, locale);
    rewriteStaticAssets($, locale, "home");
    removeScripts($, homeRuntimeScriptsToRemove);
    appendScripts($, homeRuntimeScriptsToAdd, "script[src*='js/main.js']", locale, "home");
    applyDataI18nTranslations($, bundle);
    setLanguageSelector($, homeData.localeOptions, locale, "home");
    updateHomeStaticUi($, bundle, accessibilityBundle, homeData, locale);
    rewriteHomeInternalLinks($, locale);
    rewriteHomeNicheLinks($, locale);
    rewriteHomeGuestInvitesLink($, locale);
    setHomeMeta($, bundle, locale, homeData.localeOptions);
    insertPageDataScript(
      $,
      "hero-locale-data",
      { phrases: bundle.hero.rotator.phrases, media: bundle.hero.media },
      "script[src*='js/main.js']"
    );

    const outputFile = buildOutputFilePath(locale, "home");
    await writeOutputFile(outputFile, serialize($));

    sitemapEntries.push({
      loc: buildPageUrl(locale, "home"),
      changefreq: "monthly",
      priority: locale === defaultLocale ? "1.0" : "0.9",
    });
  }

  return sitemapEntries;
}

async function buildLegalPages(homeData, legalCollections) {
  const sitemapEntries = [];

  for (const [pageKey, templatePath] of Object.entries(legalTemplatePaths)) {
    const template = await fs.readFile(templatePath, "utf8");
    const translations = legalCollections[pageKey];

    for (const localeOption of homeData.localeOptions) {
      const locale = localeOption.code;
      const bundle = getBundle(translations, locale);
      const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
      const $ = cheerio.load(template, { decodeEntities: false });

      setBodyDirection($, locale);
      rewriteStaticAssets($, locale, pageKey);
      removeScripts($, legalRuntimeScriptsToRemove);
      appendScripts($, legalRuntimeScriptsToAdd, "script[src*='js/legal-page.js']", locale, pageKey);
      applyDataI18nTranslations($, bundle);
      setLanguageSelector($, homeData.localeOptions, locale, pageKey);
      updateAccessibilityMarkup($, accessibilityBundle);
      rewriteLegalInternalLinks($, locale, pageKey);
      setLegalMeta($, locale, pageKey, homeData.localeOptions, bundle);

      const outputFile = buildOutputFilePath(locale, pageKey);
      await writeOutputFile(outputFile, serialize($));

      sitemapEntries.push({
        loc: buildPageUrl(locale, pageKey),
        changefreq: "yearly",
        priority: locale === defaultLocale ? "0.7" : "0.6",
      });
    }
  }

  return sitemapEntries;
}

async function buildUtilityPages(homeData) {
  const template = await fs.readFile(utilityTemplatePath, "utf8");
  const sitemapEntries = [];

  for (const localeOption of homeData.localeOptions) {
    const locale = localeOption.code;
    const copy = getUtilityLocaleCopy(locale);
    const $ = cheerio.load(template, { decodeEntities: false });

    setBodyDirection($, locale);
    rewriteStaticAssets($, locale, "wifigate-link");
    updateUtilityPageStaticUi($, copy);
    setUtilityMeta($, locale, homeData.localeOptions, copy);

    const outputFile = buildOutputFilePath(locale, "wifigate-link");
    await writeOutputFile(outputFile, serialize($));

    sitemapEntries.push({
      loc: buildPageUrl(locale, "wifigate-link"),
      changefreq: "yearly",
      priority: locale === defaultLocale ? "0.6" : "0.5",
    });
  }

  return sitemapEntries;
}

function getNicheChrome(locale) {
  const base = NICHE_CHROME[defaultLocale];
  const override = NICHE_CHROME[locale] || {};
  return { ...base, ...override };
}

function getNicheOverride(locale, storyKey) {
  return (NICHE_OVERRIDES[locale] && NICHE_OVERRIDES[locale][storyKey]) || {};
}

function getNicheLabel(homeData, bundle, storyKey) {
  return (
    getNestedValue(bundle, `applications.${storyKey}`) ||
    getNestedValue(homeData.translations[defaultLocale], `applications.${storyKey}`) ||
    storyKey
  );
}

function buildNicheContext(homeData, niche, locale) {
  const storyKey = niche.storyKey;
  const bundle = getBundle(homeData.translations, locale);
  const enBundle = homeData.translations[defaultLocale];
  const ui = homeData.storyUi[locale] || homeData.storyUi[defaultLocale];
  const localizedStories = homeData.stories[locale] || {};
  const story = localizedStories[storyKey] || homeData.stories[defaultLocale][storyKey] || {};
  const chrome = getNicheChrome(locale);
  const override = getNicheOverride(locale, storyKey);
  const contact = bundle.contact || enBundle.contact;
  const footer = bundle.footer || enBundle.footer;
  const nicheLabel = getNicheLabel(homeData, bundle, storyKey);

  const heroHeadline = override.heroHeadline || nicheLabel;
  const heroSubline = override.heroSubline || story.pitch || chrome.comparisonLead || "";
  const metaTitle = override.metaTitle || `${nicheLabel} | WIFIGATE`;
  const metaDescription = override.metaDescription || story.pitch || nicheLabel;

  return {
    storyKey,
    bundle,
    enBundle,
    ui,
    story,
    chrome,
    contact,
    footer,
    nicheLabel,
    heroHeadline,
    heroSubline,
    metaTitle,
    metaDescription,
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

function setNicheComparison($, chrome) {
  const rows = $("#niche-comparison-rows");
  if (!rows.length) {
    return;
  }

  rows.empty();
  (chrome.rows || []).forEach((row) => {
    const oldCell = $("<div>")
      .addClass("niche-compare__cell niche-compare__old")
      .append($("<span>").addClass("niche-compare__tag").text(chrome.headTraditional))
      .append($("<p>").addClass("niche-compare__text").text(row.t));
    const newCell = $("<div>")
      .addClass("niche-compare__cell niche-compare__new")
      .append($("<span>").addClass("niche-compare__tag").text(chrome.headWifigate))
      .append($("<p>").addClass("niche-compare__text").text(row.w));
    rows.append($("<li>").addClass("niche-compare__row").append(oldCell).append(newCell));
  });
}

function updateNicheStaticUi($, ctx, accessibilityBundle) {
  const { bundle, enBundle, ui, story, chrome, contact, footer, nicheLabel } = ctx;
  const navText = (keyPath, fallback) =>
    getNestedValue(bundle, keyPath) || getNestedValue(enBundle, keyPath) || fallback;

  $(".nav__toggle").attr("aria-label", "Toggle navigation menu");
  $("#language-button").attr("aria-label", "Select language");
  $("#niche-nav-home").text(navText("nav.home", "Home"));
  $("#niche-nav-features").text(navText("nav.features", "Features"));
  $("#niche-nav-where").text(navText("tabs.where", "Where"));
  $("#niche-nav-tutorials").text(navText("nav.about", "Tutorials"));
  $("#niche-nav-contact").text(navText("nav.contact", "Contact Us"));

  $("#niche-breadcrumb-home").text(chrome.homeLabel);
  $("#niche-breadcrumb-current").text(nicheLabel);

  $("#niche-eyebrow").text(chrome.eyebrow);
  $("#niche-title").text(ctx.heroHeadline);
  $("#niche-subline").text(ctx.heroSubline);
  $("#niche-hero-cta-label").text(contact.ctaButton || "Contact via WhatsApp");
  $("#niche-hero-back").text(chrome.backLabel);
  setNicheList($, "#niche-badges", ui.badges, "niche-chip");

  $("#niche-problem-title").text(chrome.problemTitle);
  $("#niche-problem-body").text(story.problem || ctx.heroSubline);
  $("#niche-better-title").text(chrome.betterTitle);
  $("#niche-better-body").text(story.solution || story.value || "");

  $("#niche-benefits-title").text(chrome.benefitsTitle);
  $("#niche-benefits-lead").text(story.value || story.pitch || "");
  setNicheList($, "#niche-benefits-list", ui.badges, "niche-benefit");

  $("#niche-comparison-title").text(chrome.comparisonTitle);
  $("#niche-comparison-lead").text(chrome.comparisonLead);
  setNicheComparison($, chrome);

  $("#niche-video-title").text(chrome.videoTitle);
  $("#niche-video-label").text(ui.videoLabel);
  $("#niche-video-status").text(ui.videoStatus);
  $("#niche-video-note").text(ui.videoNote);

  $("#niche-cta-title").text(contact.ctaTitle || "Interested in WIFIGATE?");
  $("#niche-cta-text").text(contact.ctaText || "");
  $("#niche-cta-button").text(contact.ctaButton || "Contact via WhatsApp");

  $("#js-year").text(nowDate.slice(0, 4));
  $("#footer-copyright").text(footer.copyright || "WIFIGATE. All rights reserved.");
  $("#footer-terms").text(footer.terms || "Terms & Conditions");
  $("#footer-privacy").text(footer.privacy || "Privacy Policy");
  $("#footer-cookies").text(footer.cookies || "Cookies");
  $("#footer-tagline").text(footer.tagline || "");

  updateAccessibilityMarkup($, accessibilityBundle);
}

function rewriteNicheInternalLinks($, locale) {
  const home = buildPagePath(locale, "home");

  $(".nav__logo-link").attr("href", `${home}#home`);
  $("a[href^='../index.html']").each((_, element) => {
    const href = $(element).attr("href") || "";
    const hashIndex = href.indexOf("#");
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    $(element).attr("href", `${home}${hash}`);
  });
  $("a[href='../terms-and-conditions/']").attr("href", buildPagePath(locale, "terms-and-conditions"));
  $("a[href='../privacy-policy/']").attr("href", buildPagePath(locale, "privacy-policy"));
  $("a[href='../cookies/']").attr("href", buildPagePath(locale, "cookies"));
  $(".nav__logo-link").attr("aria-label", "Back to WIFIGATE home page");
}

function setNicheMeta($, ctx, niche, locale, localeOptions) {
  const url = buildPageUrl(locale, niche.key);
  const homeUrl = buildPageUrl(locale, "home");

  $("title").text(ctx.metaTitle);
  setMetaByName($, "description", ctx.metaDescription);
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, localeOptions, niche.key);

  setMetaByProperty($, "og:type", "article");
  setMetaByProperty($, "og:url", url);
  setMetaByProperty($, "og:title", ctx.metaTitle);
  setMetaByProperty($, "og:description", ctx.metaDescription);
  setMetaByProperty($, "og:image", pageImages.niche);
  setMetaByProperty($, "twitter:card", "summary_large_image");
  setMetaByProperty($, "twitter:url", url);
  setMetaByProperty($, "twitter:title", ctx.metaTitle);
  setMetaByProperty($, "twitter:description", ctx.metaDescription);
  setMetaByProperty($, "twitter:image", pageImages.niche);

  replaceStructuredData($, [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: ctx.metaTitle,
      description: ctx.metaDescription,
      inLanguage: locale,
      url,
      isPartOf: {
        "@type": "WebSite",
        name: "WIFIGATE",
        url: siteOrigin,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: pageImages.niche,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: ctx.chrome.homeLabel, item: homeUrl },
        { "@type": "ListItem", position: 2, name: ctx.nicheLabel, item: url },
      ],
    },
  ]);
}

async function buildNichePages(homeData) {
  const template = await fs.readFile(nicheTemplatePath, "utf8");
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
      setLanguageSelector($, homeData.localeOptions, locale, niche.key);
      updateNicheStaticUi($, ctx, accessibilityBundle);
      rewriteNicheInternalLinks($, locale);
      setNicheMeta($, ctx, niche, locale, homeData.localeOptions);

      const outputFile = buildOutputFilePath(locale, niche.key);
      await writeOutputFile(outputFile, serialize($));

      sitemapEntries.push({
        loc: buildPageUrl(locale, niche.key),
        changefreq: "monthly",
        priority: locale === defaultLocale ? "0.8" : "0.7",
      });
    }
  }

  return sitemapEntries;
}

function getGuestInvitesStrings(homeData, locale) {
  const bundle = getBundle(homeData.translations, locale);
  const enBundle = homeData.translations[defaultLocale];
  const gen = (bundle && bundle.guestInvites && bundle.guestInvites.generator) || {};
  const enGen = (enBundle && enBundle.guestInvites && enBundle.guestInvites.generator) || {};
  const pick = (key, fallback) => gen[key] || enGen[key] || fallback;

  return {
    metaTitle: pick("metaTitle", "Automated Guest Invites API | WIFIGATE"),
    metaDescription: pick(
      "metaDescription",
      "Build and preview a WIFIGATE guest invitation API request, then copy the ready-to-use URL."
    ),
    copyButton: pick("copyButton", "Copy URL"),
    copiedButton: pick("copiedButton", "Copied!"),
    copyError: pick("copyError", "Copy failed \u2014 select the URL and copy it manually."),
  };
}

function updateGuestInvitesStaticUi($, strings) {
  $(".nav__toggle").attr("aria-label", "Toggle navigation menu");
  $("#language-button").attr("aria-label", "Select language");
  $("#js-year").text(nowDate.slice(0, 4));
  $("#giapi-copy-data").text(
    JSON.stringify({
      copyButton: strings.copyButton,
      copiedButton: strings.copiedButton,
      copyError: strings.copyError,
    })
  );
}

function rewriteGuestInvitesInternalLinks($, locale) {
  const home = buildPagePath(locale, "home");

  $(".nav__logo-link").attr("href", `${home}#home`);
  $("a[href^='../index.html']").each((_, element) => {
    const href = $(element).attr("href") || "";
    const hashIndex = href.indexOf("#");
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    $(element).attr("href", `${home}${hash}`);
  });
  $("a[href='../terms-and-conditions/']").attr("href", buildPagePath(locale, "terms-and-conditions"));
  $("a[href='../privacy-policy/']").attr("href", buildPagePath(locale, "privacy-policy"));
  $("a[href='../cookies/']").attr("href", buildPagePath(locale, "cookies"));
  $(".nav__logo-link").attr("aria-label", "Back to WIFIGATE home page");
}

function setGuestInvitesMeta($, locale, localeOptions, strings) {
  const url = buildPageUrl(locale, guestInvitesPageKey);
  const homeUrl = buildPageUrl(locale, "home");

  $("title").text(strings.metaTitle);
  setMetaByName($, "description", strings.metaDescription);
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, localeOptions, guestInvitesPageKey);

  setMetaByProperty($, "og:type", "website");
  setMetaByProperty($, "og:url", url);
  setMetaByProperty($, "og:title", strings.metaTitle);
  setMetaByProperty($, "og:description", strings.metaDescription);
  setMetaByProperty($, "og:image", pageImages.guestInvites);
  setMetaByProperty($, "twitter:card", "summary_large_image");
  setMetaByProperty($, "twitter:url", url);
  setMetaByProperty($, "twitter:title", strings.metaTitle);
  setMetaByProperty($, "twitter:description", strings.metaDescription);
  setMetaByProperty($, "twitter:image", pageImages.guestInvites);

  replaceStructuredData($, [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: strings.metaTitle,
      description: strings.metaDescription,
      inLanguage: locale,
      url,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Any",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      isPartOf: { "@type": "WebSite", name: "WIFIGATE", url: siteOrigin },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "WIFIGATE", item: homeUrl },
        { "@type": "ListItem", position: 2, name: strings.metaTitle, item: url },
      ],
    },
  ]);
}

async function buildGuestInvitesPages(homeData) {
  const template = await fs.readFile(guestInvitesTemplatePath, "utf8");
  const sitemapEntries = [];

  for (const localeOption of homeData.localeOptions) {
    const locale = localeOption.code;
    const bundle = getBundle(homeData.translations, locale);
    const accessibilityBundle = getBundle(homeData.accessibilityCopy, locale);
    const strings = getGuestInvitesStrings(homeData, locale);
    const $ = cheerio.load(template, { decodeEntities: false });

    setBodyDirection($, locale);
    rewriteStaticAssets($, locale, guestInvitesPageKey);
    appendScripts($, nicheRuntimeScriptsToAdd, "script[src*='js/accessibility.js']", locale, guestInvitesPageKey);
    applyDataI18nTranslations($, bundle);
    setLanguageSelector($, homeData.localeOptions, locale, guestInvitesPageKey);
    updateAccessibilityMarkup($, accessibilityBundle);
    updateGuestInvitesStaticUi($, strings);
    rewriteGuestInvitesInternalLinks($, locale);
    setGuestInvitesMeta($, locale, homeData.localeOptions, strings);

    const outputFile = buildOutputFilePath(locale, guestInvitesPageKey);
    await writeOutputFile(outputFile, serialize($));

    sitemapEntries.push({
      loc: buildPageUrl(locale, guestInvitesPageKey),
      changefreq: "monthly",
      priority: locale === defaultLocale ? "0.8" : "0.7",
    });
  }

  return sitemapEntries;
}

async function main() {
  const homeSandbox = await runFilesInSandbox(homeDataFiles);
  const legalCollections = {};

  for (const [pageKey, files] of Object.entries(legalDataFiles)) {
    const sandbox = await runFilesInSandbox(files);
    legalCollections[pageKey] = sandbox.translations;
  }

  const homeData = {
    localeOptions: homeSandbox.SITE_LANGUAGE_OPTIONS,
    translations: homeSandbox.translations,
    accessibilityCopy: homeSandbox.accessibilityCopy,
    storyUi: homeSandbox.APPLICATION_STORY_UI,
    stories: homeSandbox.APPLICATION_STORIES,
    storySlugs: homeSandbox.APPLICATION_STORY_SLUGS,
  };

  const sitemapEntries = [];
  sitemapEntries.push(...(await buildHomePages(homeData)));
  sitemapEntries.push(...(await buildLegalPages(homeData, legalCollections)));
  sitemapEntries.push(...(await buildNichePages(homeData)));
  sitemapEntries.push(...(await buildGuestInvitesPages(homeData)));
  sitemapEntries.push(...(await buildUtilityPages(homeData)));

  await fs.writeFile(path.join(repoRoot, "sitemap.xml"), buildSitemap(sitemapEntries), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});