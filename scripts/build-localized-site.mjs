import * as cheerio from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { pathToFileURL } from "node:url";
import { NICHE_CHROME } from "./niche-content.mjs";
import { NICHE_DEFINITIONS, NICHE_PAGE_LOCALES, validateNichePageLocales } from "./niche-pages/index.mjs";
import { SITE_NAVIGATION } from "./site-navigation.mjs";
import { wifigateLinkLocales } from "./wifigate-link-locales.mjs";

const repoRoot = process.cwd();
const siteOrigin = "https://wifigate.io";
const defaultLocale = "en";
const nowDate = new Date().toISOString().slice(0, 10);
const guestInvitesPageKey = "automation";
const utilityPageKeys = ["wifigate-link", "wifigate-api"];

const homeTemplatePath = path.join(repoRoot, "templates", "index.template.html");
const homeCopyDirectory = path.join(repoRoot, "scripts", "homepage-copy");
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
  "js/translations-new-locales.js",
  "js/contact-footer-translations.js",
  "js/features-refresh.js",
  "js/guest-invites-home.js",
  "js/application-stories.js",
  "js/application-stories-extra.js",
  "js/i18n.js",
  "js/accessibility.js",
  "js/language-polish.js",
  "js/niche-split-overrides.js",
  "js/site-copy-overrides.js",
];

const legalDataFiles = {
  cookies: [
    "js/translations.js",
    "js/translations-extra.js",
    "js/contact-footer-translations.js",
    "js/cookies-translations.js",
    "js/cookies-translations-extra.js",
    "js/language-polish.js",
    "js/site-copy-overrides.js",
  ],
  "privacy-policy": [
    "js/translations.js",
    "js/translations-extra.js",
    "js/contact-footer-translations.js",
    "js/privacy-translations.js",
    "js/privacy-translations-extra.js",
    "js/language-polish.js",
    "js/site-copy-overrides.js",
  ],
  "terms-and-conditions": [
    "js/translations.js",
    "js/translations-extra.js",
    "js/contact-footer-translations.js",
    "js/legal-translations.js",
    "js/legal-translations-extra.js",
    "js/language-polish.js",
    "js/site-copy-overrides.js",
  ],
};

const homeRuntimeScriptsToRemove = [
  "js/translations.js",
  "js/translations-extra.js",
  "js/translations-new-locales.js",
  "js/contact-footer-translations.js",
  "js/features-refresh.js",
  "js/site-copy-overrides.js",
  "js/i18n.js",
  "js/application-stories.js",
  "js/application-stories-extra.js",
  "js/locale-redirect.js",
  "js/language-selector.js",
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
  "/js/language-selector.js?v=20260902a",
];

const legalRuntimeScriptsToAdd = [
  "/js/locale-redirect.js?v=20260620a",
  "/js/language-selector.js?v=20260902a",
];

const nicheRuntimeScriptsToAdd = [
  "/js/locale-redirect.js?v=20260620a",
  "/js/language-selector.js?v=20260902a",
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
  sv: "WIFIGATE-enhet bredvid mobilappen med lista över grindar",
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

// Copy keys a locale may add on top of the English reference shape. The
// renderer already treats these as optional (see updateHomeCopy), so the
// validator must not reject a locale that supplies one.
const OPTIONAL_COPY_KEYS = new Set(["footer.taglineLines", "platform.subscriptionNote", "why.pointsNote"]);

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
// It is the single source of truth for footer wording on every page type; the
// older js/translations.js bundle is only a fallback, so the homepage and the
// inner pages can no longer disagree about the same footer.
function updateFooterStaticUi($, bundle, locale, footerCopy) {
  const footer = { ...(bundle.footer || {}), ...(footerCopy || {}) };
  const contact = bundle.contact || {};
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
  set(".site-footer__copy", `${String.fromCharCode(0xa9)} 2026 ${footer.copyright || "WIFIGATE. All rights reserved."}`);
  set("[data-i18n='contact.distributorTitle']", contact.distributorTitle);
  set("[data-i18n='contact.distributorText']", contact.distributorText);
  set("[data-i18n='contact.distributorButton']", contact.distributorButton);
  set("[data-i18n='contact.supportTitle']", contact.supportTitle);
  set("[data-i18n='contact.supportText']", contact.supportText);
  set("[data-i18n='contact.interestTitle']", contact.interestTitle);
  set("[data-i18n='contact.interestText']", contact.interestText);
  set("[data-i18n='contact.whatsappButton']", contact.whatsappButton);
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

function buildHomeMeta(locale, bundle) {
  const home = getNichePageContent(locale).home;
  const enHome = NICHE_PAGE_LOCALES[defaultLocale].home;
  const title = home.seoTitle;
  const bundleDescription = getNestedValue(bundle, "hero.subtitle") || home.seoDescription;
  const description =
    locale === defaultLocale
      ? "WIFIGATE (WiFi Gate) is smart access control for gates, buildings, parking entrances, and private homes. Secure, private, encrypted, and free of monthly fees."
      : bundleDescription;

  return {
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    keywords: home.keywords || enHome.keywords,
  };
}

function setHomeMeta($, bundle, locale, localeOptions, copy) {
  const meta = buildHomeMeta(locale, bundle);
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
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: copy.schema.monthlySubscription,
          value: copy.schema.subscriptionValue,
        },
        {
          "@type": "PropertyValue",
          name: copy.schema.simCard,
          value: copy.schema.notRequired,
        },
        {
          "@type": "PropertyValue",
          name: copy.schema.externalRouter,
          value: copy.schema.notRequired,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${url}#wifi-gate-faq`,
      inLanguage: locale,
      mainEntity: copy.faq.items.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
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

function setUtilityMeta($, locale, localeOptions, copy, pageKey) {
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

  $("#hero-search-text").text(normalizedHeroText ? `WIFIGATE. ${normalizedHeroText}` : "WIFIGATE");
  $("#hero-rotator").text(bundle.hero.rotator.phrases[0]);
  $("#hero-mute-toggle").attr("aria-label", bundle.hero.media.unmute);
  $("#hero-mute-toggle").attr("title", bundle.hero.media.unmute);
  $("#hero-replay span").text(bundle.hero.media.replay);
  $("#hero-replay").attr("aria-label", bundle.hero.media.replay);
  $("#hero-replay").attr("title", bundle.hero.media.replay);

  updateAccessibilityMarkup($, accessibilityBundle);
}

function splitHomeWhereSubtitle(value) {
  const subtitle = String(value || "").trim();
  const match = subtitle.match(/^(.+?[.!?。！？।])\s*(.+)$/su);

  return match ? [match[1].trim(), match[2].trim()] : [subtitle, ""];
}

function updateHomeWhereSection($, locale, bundle) {
  const content = getNichePageContent(locale);
  const subtitle = bundle?.action?.subtitle || content.where.subtitle;
  const [propertiesCopy, controlsCopy] = splitHomeWhereSubtitle(subtitle);
  const controlsItem = $("#where-intro-controls").closest(".where-intro__item");

  $("#where-title").text(bundle?.action?.title || content.where.title);
  $("#where-subtitle").attr("dir", isRtl(locale) ? "rtl" : "ltr");
  $("#where-intro-properties").text(propertiesCopy);
  $("#where-intro-controls").text(controlsCopy);
  if (controlsCopy) {
    controlsItem.removeAttr("hidden");
  } else {
    controlsItem.attr("hidden", "");
  }
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

  setLocalizedText($, ".hero__eyebrow", copy.hero.eyebrow, locale);
  setLocalizedLines($, "#hero-title", copy.hero.titleLines, locale);
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
    setLocalizedText($, $(element).find(".guest-invites__point-title"), copy.automation.points[index].title, locale);
    setLocalizedText($, $(element).find(".guest-invites__point-text"), copy.automation.points[index].text, locale);
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
  $("#language-button").attr("aria-label", copy.selectLanguageLabel);
  setLanguageSelector($, homeData.localeOptions, locale, pageKey);
  const prefix = buildAssetPrefix(locale, pageKey);
  $("head").append('<link rel="stylesheet" href="' + prefix + 'css/site-header.css?v=20260911b">');
  $("script[src*='js/navigation.js']").attr("src", prefix + "js/navigation.js?v=20260911a");
}

function serialize($, homeData, locale, pageKey = "home") {
  updateSharedHeader($, homeData, locale, pageKey);
  const html = $.html({ decodeEntities: false }).replace(/[ \t]+(?=\r?\n|$)/g, "");
  return ensureTrailingNewline(html);
}

async function writeOutputFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
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
  const template = await readHtmlTemplate(homeTemplatePath);
  const homepageCopies = homeData.homepageCopies;
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
    applyDataI18nTranslations($, bundle, locale);
    updateFooterStaticUi($, bundle, locale, homeData.homepageCopies[locale]?.footer);
    updateHomeStaticUi($, bundle, accessibilityBundle, homeData, locale);
    rewriteHomeInternalLinks($, locale);
    updateHomeWhereSection($, locale, bundle);
    applyHomepageCopy($, homepageCopies[locale], locale);
    rewriteHomeGuestInvitesLink($, locale);
    reorderHomeSections($);
    setHomeMeta($, bundle, locale, homeData.localeOptions, homepageCopies[locale]);
    insertPageDataScript(
      $,
      "hero-locale-data",
      { phrases: bundle.hero.rotator.phrases, media: bundle.hero.media },
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

async function buildLegalPages(homeData, legalCollections) {
  for (const [pageKey, templatePath] of Object.entries(legalTemplatePaths)) {
    const template = await readHtmlTemplate(templatePath);
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
      applyDataI18nTranslations($, bundle, locale);
      updateFooterStaticUi($, bundle, locale, homeData.homepageCopies[locale]?.footer);
      updateAccessibilityMarkup($, accessibilityBundle);
      rewriteLegalInternalLinks($, locale, pageKey);
      setLegalMeta($, locale, pageKey, homeData.localeOptions, bundle);

      const outputFile = buildOutputFilePath(locale, pageKey);
      await writeOutputFile(outputFile, serialize($, homeData, locale, pageKey));
    }
  }
  return [];
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
  const base = NICHE_CHROME[defaultLocale];
  const override = NICHE_CHROME[locale] || {};
  return { ...base, ...override };
}

function buildNicheContext(homeData, niche, locale) {
  const bundle = getBundle(homeData.translations, locale);
  const enBundle = homeData.translations[defaultLocale];
  const chrome = getNicheChrome(locale);
  // heroLead and highlights are authored ahead of translation. A locale that
  // does not carry them yet falls back to the English entry, so the section
  // renders in English rather than disappearing -- the same way NICHE_CHROME
  // already degrades.
  const localeContent = getNichePageContent(locale).niches[niche.key];
  const enContent = getNichePageContent(defaultLocale).niches[niche.key];
  const content = {
    ...localeContent,
    heroLead: localeContent.heroLead || enContent.heroLead,
    highlights: localeContent.highlights?.length ? localeContent.highlights : enContent.highlights,
  };
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
  const { bundle, enBundle, chrome, content, contact, footer } = ctx;
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
  $("#niche-hero-cta-label").text(contact.ctaButton || "Contact via WhatsApp");
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
  // No closing CTA section: the hero already carries the WhatsApp action and
  // the shared footer carries support + WhatsApp Business.

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
      updateFooterStaticUi($, ctx.bundle, locale, homeData.homepageCopies[locale]?.footer);
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
    copyError: pick("copyError", "Copy failed, select the URL and copy it manually."),
  };
}

function updateGuestInvitesStaticUi($, strings) {
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

  $("a[href^='../index.html']").each((_, element) => {
    const href = $(element).attr("href") || "";
    const hashIndex = href.indexOf("#");
    const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
    $(element).attr("href", `${home}${hash}`);
  });
  rewriteFooterLegalLinks($, locale);
}

function setGuestInvitesMeta($, locale, localeOptions, strings) {
  const url = buildPageUrl(locale, guestInvitesPageKey);
  const homeUrl = buildPageUrl(locale, "home");

  $("title").text(strings.metaTitle);
  setMetaByName($, "description", strings.metaDescription);
  setRobotsMeta($, "index, follow");
  $("link[rel='canonical']").attr("href", url);
  replaceAlternateLinks($, localeOptions, guestInvitesPageKey);

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
  const template = await readHtmlTemplate(guestInvitesTemplatePath);
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
    applyDataI18nTranslations($, bundle, locale);
    updateFooterStaticUi($, bundle, locale, homeData.homepageCopies[locale]?.footer);
    updateAccessibilityMarkup($, accessibilityBundle);
    updateGuestInvitesStaticUi($, strings);
    rewriteGuestInvitesInternalLinks($, locale);
    setGuestInvitesMeta($, locale, homeData.localeOptions, strings);

    const outputFile = buildOutputFilePath(locale, guestInvitesPageKey);
    await writeOutputFile(outputFile, serialize($, homeData, locale, guestInvitesPageKey));

    sitemapEntries.push({
      loc: buildPageUrl(locale, guestInvitesPageKey),
      changefreq: "monthly",
      priority: "0.9",
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
    // Loaded once here so every page type shares the same footer wording.
    homepageCopies: await loadHomeCopy(homeSandbox.SITE_LANGUAGE_OPTIONS),
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

  // writeOutputFile, not fs.writeFile: on Windows the dev server can hold this
  // file open and the bare write fails with EBUSY/UNKNOWN.
  await writeOutputFile(path.join(repoRoot, "sitemap.xml"), buildSitemap(sitemapEntries));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
