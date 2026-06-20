const LOCALE_STORAGE_KEY = "language";

function getAlternateLocaleUrlMap() {
  const map = new Map();

  document.querySelectorAll("link[rel='alternate'][hreflang]").forEach((link) => {
    const locale = link.getAttribute("hreflang");
    const href = link.getAttribute("href");

    if (!locale || !href || locale.toLowerCase() === "x-default") {
      return;
    }

    map.set(locale, href);
  });

  return map;
}

function normalizePathname(pathname) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function isBotUserAgent() {
  const userAgent = navigator.userAgent || "";
  return /(bot|crawler|spider|crawling)/i.test(userAgent);
}

function getSavedLocale(localeUrlMap) {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (!saved || !localeUrlMap.has(saved)) {
      return "";
    }

    return saved;
  } catch (error) {
    return "";
  }
}

function setSavedLocale(locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    // Ignore storage failures.
  }
}

function shouldHandleCurrentPage(localeUrlMap) {
  if (window.location.protocol !== "http:" && window.location.protocol !== "https:") {
    return false;
  }

  if (isBotUserAgent()) {
    return false;
  }

  const englishHref = localeUrlMap.get("en");
  if (!englishHref) {
    return false;
  }

  const currentPath = normalizePathname(window.location.pathname);
  const englishPath = normalizePathname(new URL(englishHref, window.location.href).pathname);

  return currentPath === englishPath;
}

function buildRedirectUrl(targetHref) {
  const targetUrl = new URL(targetHref, window.location.href);
  targetUrl.search = window.location.search;
  targetUrl.hash = window.location.hash;
  return targetUrl.toString();
}

function redirectToLocale(locale, localeUrlMap) {
  if (!locale || locale === "en") {
    return false;
  }

  const targetHref = localeUrlMap.get(locale);
  if (!targetHref) {
    return false;
  }

  window.location.replace(buildRedirectUrl(targetHref));
  return true;
}

function autoRedirectLocale() {
  const localeUrlMap = getAlternateLocaleUrlMap();
  if (!localeUrlMap.size || !shouldHandleCurrentPage(localeUrlMap)) {
    return;
  }

  const savedLocale = getSavedLocale(localeUrlMap);

  if (savedLocale && redirectToLocale(savedLocale, localeUrlMap)) {
    return;
  }

  setSavedLocale("en");
}

autoRedirectLocale();