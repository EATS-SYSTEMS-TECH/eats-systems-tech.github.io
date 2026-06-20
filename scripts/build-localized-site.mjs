import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import * as cheerio from "cheerio";
import { homeSeoLocales } from "./home-seo-locales.mjs";
import { wifigateLinkLocales } from "./wifigate-link-locales.mjs";

const repoRoot = process.cwd();
const siteOrigin = "https://wifigate.io";
const defaultLocale = "en";
const nowDate = "2026-06-20";

const homeTemplatePath = path.join(repoRoot, "templates", "index.template.html");
const utilityTemplatePath = path.join(repoRoot, "templates", "wifigate-link.template.html");
const legalTemplatePaths = {
  cookies: path.join(repoRoot, "templates", "legal", "cookies.template.html"),
  "privacy-policy": path.join(repoRoot, "templates", "legal", "privacy-policy.template.html"),
  "terms-and-conditions": path.join(repoRoot, "templates", "legal", "terms-and-conditions.template.html"),
};

const homeDataFiles = [
  "js/translations.js",
  "js/translations-extra.js",
  "js/features-refresh.js",
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
  "/js/where-stories-static.js?v=20260620a",
];

const legalRuntimeScriptsToAdd = [
  "/js/locale-redirect.js?v=20260620a",
  "/js/language-selector.js?v=20260620a",
];

const pageImages = {
  home: "https://wifigate.io/assets/img/wifigate_homepage.webp",
  legal: "https://wifigate.io/assets/img/wifigate_homepage.webp",
  utility: "https://wifigate.io/logo-1024.png",
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
  $("#where-story-video-label").text(homeData.storyUi[locale]?.videoLabel || homeData.storyUi.en.videoLabel);
  $("#where-story-video-status").text(homeData.storyUi[locale]?.videoStatus || homeData.storyUi.en.videoStatus);
  $("#where-story-video-note").text(homeData.storyUi[locale]?.videoNote || homeData.storyUi.en.videoNote);
  $("#where-story-label-problem").text(homeData.storyUi[locale]?.problem || homeData.storyUi.en.problem);
  $("#where-story-label-solution").text(homeData.storyUi[locale]?.solution || homeData.storyUi.en.solution);
  $("#where-story-win-label").text(homeData.storyUi[locale]?.winLabel || homeData.storyUi.en.winLabel);

  updateAccessibilityMarkup($, accessibilityBundle);
}

function buildWhereStoryPayload(homeData, bundle, locale) {
  const stories = {};
  const anchorToKey = {};

  Object.keys(homeData.storySlugs).forEach((storyKey) => {
    const localizedStories = homeData.stories[locale] || {};
    const story = localizedStories[storyKey] || homeData.stories.en[storyKey];

    if (!story) {
      return;
    }

    const anchorId = `where-story-${homeData.storySlugs[storyKey] || storyKey}`;

    stories[storyKey] = {
      anchorId,
      title: getNestedValue(bundle, `applications.${storyKey}`) || getNestedValue(homeData.translations.en, `applications.${storyKey}`) || storyKey,
      pitch: story.pitch,
      problem: story.problem,
      solution: story.solution,
      value: story.value,
    };

    anchorToKey[anchorId] = storyKey;
  });

  return {
    ui: homeData.storyUi[locale] || homeData.storyUi.en,
    stories,
    anchorToKey,
  };
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
    setHomeMeta($, bundle, locale, homeData.localeOptions);
    insertPageDataScript(
      $,
      "hero-locale-data",
      { phrases: bundle.hero.rotator.phrases, media: bundle.hero.media },
      "script[src*='js/main.js']"
    );
    insertPageDataScript($, "where-story-data", buildWhereStoryPayload(homeData, bundle, locale), "script[src*='js/main.js']");

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
  sitemapEntries.push(...(await buildUtilityPages(homeData)));

  await fs.writeFile(path.join(repoRoot, "sitemap.xml"), buildSitemap(sitemapEntries), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});