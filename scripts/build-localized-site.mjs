import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import * as cheerio from "cheerio";
import { wifigateLinkLocales } from "./wifigate-link-locales.mjs";
import { NICHE_CHROME } from "./niche-content.mjs";
import { NICHE_DEFINITIONS, NICHE_PAGE_LOCALES, validateNichePageLocales } from "./niche-pages/index.mjs";

const repoRoot = process.cwd();
const siteOrigin = "https://wifigate.io";
const defaultLocale = "en";
const nowDate = new Date().toISOString().slice(0, 10);
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
  "js/language-polish.js",
  "js/niche-split-overrides.js",
];

const legalDataFiles = {
  cookies: [
    "js/translations.js",
    "js/translations-extra.js",
    "js/cookies-translations.js",
    "js/cookies-translations-extra.js",
    "js/language-polish.js",
  ],
  "privacy-policy": [
    "js/translations.js",
    "js/translations-extra.js",
    "js/privacy-translations.js",
    "js/privacy-translations-extra.js",
    "js/language-polish.js",
  ],
  "terms-and-conditions": [
    "js/translations.js",
    "js/translations-extra.js",
    "js/legal-translations.js",
    "js/legal-translations-extra.js",
    "js/language-polish.js",
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
  guestInvites: "https://wifigate.io/assets/img/wifigate_homepage.webp",
};

const homeProductImageAlt = {
  en: "WIFIGATE device next to the mobile app gate list",
  he: "מכשיר WIFIGATE לצד מסך אפליקציה עם רשימת שערים",
  es: "Dispositivo WIFIGATE junto a la app móvil con lista de accesos",
  fr: "Boîtier WIFIGATE à côté de l'application mobile avec la liste des accès",
  de: "WIFIGATE Gerät neben der mobilen App mit Torliste",
  nl: "WIFIGATE apparaat naast de mobiele app met poortenlijst",
  it: "Dispositivo WIFIGATE accanto all'app mobile con elenco degli accessi",
  pt: "Dispositivo WIFIGATE junto à app móvel com lista de acessos",
  pl: "Urządzenie WIFIGATE obok aplikacji mobilnej z listą bram",
  no: "WIFIGATE-enhet ved siden av mobilappen med portliste",
  cs: "Zařízení WIFIGATE vedle mobilní aplikace se seznamem bran",
  ru: "Устройство WIFIGATE рядом с мобильным приложением со списком ворот",
  uk: "Пристрій WIFIGATE поруч із мобільним застосунком зі списком воріт",
  tr: "Kapı listesi gösteren mobil uygulamanın yanında WIFIGATE cihazı",
  ar: "جهاز WIFIGATE بجانب تطبيق الهاتف مع قائمة البوابات",
  hi: "गेट सूची दिखाने वाले मोबाइल ऐप के पास WIFIGATE डिवाइस",
  bn: "গেটের তালিকা দেখানো মোবাইল অ্যাপের পাশে WIFIGATE ডিভাইস",
  mr: "गेट यादी दाखवणाऱ्या मोबाइल अॅपजवळ WIFIGATE डिव्हाइस",
  te: "గేట్ల జాబితా చూపిస్తున్న మొబైల్ యాప్ పక్కన WIFIGATE పరికరం",
  "zh-Hans": "WIFIGATE 设备旁边显示门列表的手机应用",
  "zh-Hant": "WIFIGATE 裝置旁邊顯示大門列表的手機應用程式",
  ja: "ゲート一覧を表示するモバイルアプリの横にある WIFIGATE デバイス",
  ko: "게이트 목록을 보여주는 모바일 앱 옆의 WIFIGATE 장치",
  da: "WIFIGATE-enhed ved siden af mobilappen med portliste",
  hu: "WIFIGATE eszköz a kapulistát mutató mobilalkalmazás mellett",
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

  if (!localeOptions.length) {
    return;
  }

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

function setRobotsMeta($, robotsContent, googlebotContent = robotsContent) {
  setMetaByName($, "robots", robotsContent);
  setMetaByName($, "googlebot", googlebotContent);
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

function buildHomeMeta(locale) {
  const home = getNichePageContent(locale).home;
  const enHome = NICHE_PAGE_LOCALES[defaultLocale].home;
  const title = home.seoTitle;
  const description = home.seoDescription;

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    keywords: home.keywords || enHome.keywords,
  };
}

function setHomeMeta($, bundle, locale, localeOptions) {
  const meta = buildHomeMeta(locale);
  const url = buildPageUrl(locale, "home");
  const footerTagline =
    getNestedValue(bundle, "footer.tagline") ||
    "Smart. Secure. Private. No subscription. No compromises.";

  $("title").text(meta.title);
  setMetaByName($, "description", meta.description);
  setMetaByName($, "keywords", meta.keywords);
  setRobotsMeta($, "index, follow");
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, localeOptions, "home");

  setMetaByProperty($, "og:type", "website");
  setMetaByProperty($, "og:site_name", "WIFIGATE");
  setMetaByProperty($, "og:url", url);
  setMetaByProperty($, "og:title", meta.ogTitle);
  setMetaByProperty($, "og:description", meta.ogDescription);
  setMetaByProperty($, "og:image", pageImages.home);
  setMetaByProperty($, "twitter:card", "summary_large_image");
  setMetaByProperty($, "twitter:url", url);
  setMetaByProperty($, "twitter:title", meta.ogTitle);
  setMetaByProperty($, "twitter:description", meta.ogDescription);
  setMetaByProperty($, "twitter:image", pageImages.home);

  replaceStructuredData($, [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "WIFIGATE",
      alternateName: ["WiFiGate", "WiFi Gate"],
      url: siteOrigin,
      inLanguage: locale,
      description: meta.description,
      publisher: {
        "@type": "Organization",
        name: "EATS SYSTEMS TECH",
        url: siteOrigin,
        logo: {
          "@type": "ImageObject",
          url: "https://wifigate.io/assets/img/logo.png",
        },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "WIFIGATE",
      alternateName: ["WiFiGate", "WiFi Gate"],
      description: meta.description,
      category: "Access control system",
      inLanguage: locale,
      url,
      image: pageImages.home,
      slogan: footerTagline,
      brand: {
        "@type": "Brand",
        name: "WIFIGATE",
      },
      manufacturer: {
        "@type": "Organization",
        name: "EATS SYSTEMS TECH",
        url: siteOrigin,
      },
    },
  ]);

  return meta;
}

function setLegalMeta($, locale, pageKey, localeOptions, legalBundle) {
  const metaTags = legalBundle.legal?.metaTags || {};
  const title = metaTags.title || "WIFIGATE";
  const description = metaTags.description || "";
  const url = buildPageUrl(locale, pageKey);

  $("title").text(title);
  setMetaByName($, "description", description);
  setRobotsMeta($, "noindex, follow");
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, [], pageKey);

  setMetaByProperty($, "og:type", "article");
  setMetaByProperty($, "og:site_name", "WIFIGATE");
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
  setRobotsMeta($, "noindex, follow");
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, [], pageKey);

  setMetaByProperty($, "og:type", "website");
  setMetaByProperty($, "og:site_name", "WIFIGATE");
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
  const semanticHeroText = (bundle.action.subtitle || bundle.hero.subtitle || "WIFIGATE smart access control").trim();
  const normalizedHeroText = semanticHeroText.replace(/^wifigate[\s.:,-]*/i, "");

  $(".nav__toggle").attr("aria-label", "Toggle navigation menu");
  $("#language-button").attr("aria-label", "Select language");
  $("#hero-search-text").text(normalizedHeroText ? `WIFIGATE. ${normalizedHeroText}` : "WIFIGATE");
  $("#hero-rotator").text(bundle.hero.rotator.phrases[0]);
  $("#hero-mute-toggle").attr("aria-label", bundle.hero.media.unmute);
  $("#hero-mute-toggle").attr("title", bundle.hero.media.unmute);
  $("#hero-replay span").text(bundle.hero.media.replay);
  $("#hero-replay").attr("aria-label", bundle.hero.media.replay);
  $("#hero-replay").attr("title", bundle.hero.media.replay);

  updateAccessibilityMarkup($, accessibilityBundle);
}

function updateHomeWhereSection($, locale) {
  const content = getNichePageContent(locale);

  $("#where-title").text(content.where.title);
  $("#where-subtitle").text(content.where.subtitle);
  $("#where-product-image").attr("alt", homeProductImageAlt[locale] || homeProductImageAlt[defaultLocale]);

  NICHE_DEFINITIONS.forEach((niche) => {
    const link = $(`.where-list__link[data-niche-key='${niche.key}']`);
    if (!link.length) {
      return;
    }

    const nicheContent = content.niches[niche.key];
    link.attr("href", buildPagePath(locale, niche.key));
    link.text(nicheContent.label);
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

function buildRedirectPage(targetPath, canonicalUrl) {
  return ensureTrailingNewline(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Redirecting...</title>
  <meta name="robots" content="noindex, follow" />
  <meta name="googlebot" content="noindex, follow" />
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

function buildSitemap(urlEntries) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries.map(
      (entry) => [
        "  <url>",
        `    <loc>${entry.loc}</loc>`,
        `    <lastmod>${entry.lastmod || nowDate}</lastmod>`,
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
    updateHomeWhereSection($, locale);
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
      priority: "1.0",
    });
  }

  return sitemapEntries;
}

async function buildLegalPages(homeData, legalCollections) {
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
    }
  }
  return [];
}

async function buildUtilityPages(homeData) {
  const template = await fs.readFile(utilityTemplatePath, "utf8");

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
  }

  return [];
}

function getNicheChrome(locale) {
  const base = NICHE_CHROME[defaultLocale];
  const override = NICHE_CHROME[locale] || {};
  return { ...base, ...override };
}

function buildNicheContext(homeData, niche, locale) {
  const bundle = getBundle(homeData.translations, locale);
  const enBundle = homeData.translations[defaultLocale];
  const chrome = getNicheChrome(locale);
  const content = getNichePageContent(locale).niches[niche.key];
  const contact = bundle.contact || enBundle.contact;
  const footer = bundle.footer || enBundle.footer;

  return {
    bundle,
    enBundle,
    chrome,
    content,
    contact,
    footer,
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

function updateNicheStaticUi($, ctx, niche, locale, accessibilityBundle) {
  const { bundle, enBundle, chrome, content, contact, footer } = ctx;
  const navText = (keyPath, fallback) =>
    getNestedValue(bundle, keyPath) || getNestedValue(enBundle, keyPath) || fallback;
  const assetPrefix = buildAssetPrefix(locale, niche.key);

  $(".nav__toggle").attr("aria-label", "Toggle navigation menu");
  $("#language-button").attr("aria-label", "Select language");
  $("#niche-nav-home").text(navText("nav.home", "Home"));
  $("#niche-nav-features").text(navText("nav.features", "Features"));
  $("#niche-nav-where").text(navText("tabs.where", "Where"));
  $("#niche-nav-tutorials").text(navText("nav.about", "Tutorials"));
  $("#niche-nav-contact").text(navText("nav.contact", "Contact Us"));

  $("#niche-breadcrumb-home").text(chrome.homeLabel);
  $("#niche-breadcrumb-current").text(content.label);

  $("#niche-eyebrow").text(chrome.eyebrow);
  $("#niche-title").text(content.title);
  $("#niche-intro").text(content.paragraph);
  $("#niche-hero-cta-label").text(contact.ctaButton || "Contact via WhatsApp");
  $("#niche-hero-back").text(chrome.backLabel);

  $("#niche-image")
    .attr("src", `${assetPrefix}${niche.image.hero}`)
    .attr("alt", content.imageAlt)
    .attr("width", String(niche.image.heroWidth))
    .attr("height", String(niche.image.heroHeight));

  $("#niche-benefits-title").text(chrome.benefitsTitle);
  setNicheList($, "#niche-benefits-list", content.bullets, "niche-benefit");

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
  const { content } = ctx;
  const socialImage = `${siteOrigin}/${niche.image.og}`;

  $("title").text(content.seoTitle);
  setMetaByName($, "description", content.seoDescription);
  setRobotsMeta($, "index, follow");
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, localeOptions, niche.key);

  setMetaByProperty($, "og:type", "article");
  setMetaByProperty($, "og:site_name", "WIFIGATE");
  setMetaByProperty($, "og:url", url);
  setMetaByProperty($, "og:title", content.seoTitle);
  setMetaByProperty($, "og:description", content.seoDescription);
  setMetaByProperty($, "og:image", socialImage);
  setMetaByProperty($, "twitter:card", "summary_large_image");
  setMetaByProperty($, "twitter:url", url);
  setMetaByProperty($, "twitter:title", content.seoTitle);
  setMetaByProperty($, "twitter:description", content.seoDescription);
  setMetaByProperty($, "twitter:image", socialImage);

  replaceStructuredData($, [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: content.seoTitle,
      description: content.seoDescription,
      inLanguage: locale,
      url,
      isPartOf: {
        "@type": "WebSite",
        name: "WIFIGATE",
        url: siteOrigin,
      },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: socialImage,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: ctx.chrome.homeLabel, item: homeUrl },
        { "@type": "ListItem", position: 2, name: content.label, item: url },
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
      updateNicheStaticUi($, ctx, niche, locale, accessibilityBundle);
      rewriteNicheInternalLinks($, locale);
      setNicheMeta($, ctx, niche, locale, homeData.localeOptions);

      const outputFile = buildOutputFilePath(locale, niche.key);
      await writeOutputFile(outputFile, serialize($));

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
  setRobotsMeta($, "noindex, follow");
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, [], guestInvitesPageKey);

  setMetaByProperty($, "og:type", "website");
  setMetaByProperty($, "og:site_name", "WIFIGATE");
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
  }

  return [];
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
  };

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

  await fs.writeFile(path.join(repoRoot, "sitemap.xml"), buildSitemap(sitemapEntries), "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
