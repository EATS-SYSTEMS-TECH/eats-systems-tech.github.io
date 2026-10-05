// Website analytics stays unloaded until the visitor makes an affirmative choice.
// Rejecting is as easy and as prominent as accepting: both buttons look the same.
// Set this to the site's GA4 measurement ID (G-...) when the property is connected.
const GA_MEASUREMENT_ID = "";
const CONSENT_KEY = "wifigate-cookie-consent-v1";
const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

(() => {
  const requestedLocale = document.documentElement.lang || "en";
  const pageLocale = Object.hasOwn(window.WIFIGATE_COOKIE_COPY, requestedLocale) ? requestedLocale : "en";
  const copy = window.WIFIGATE_COOKIE_COPY[pageLocale];
  const isRtl = pageLocale === "he" || pageLocale === "ar";
  const locale = pageLocale === "en" ? "" : `/${pageLocale.toLowerCase()}`;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const safe = Object.fromEntries(Object.entries(copy).map(([key, value]) => [key, escapeHtml(value)]));
  const consent = readConsent();
  let currentConsent = consent;
  let analyticsLoaded = false;
  let panel;
  let details;
  let analyticsInput;

  function syncBannerOffset() {
    const visible = panel && !panel.hidden;
    document.body.classList.toggle("has-cookie-banner", Boolean(visible));
    document.body.style.setProperty("--cookie-banner-height", visible ? `${Math.ceil(panel.getBoundingClientRect().height)}px` : "0px");
  }

  function readConsent() {
    try {
      const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      if (value?.version === 1 && typeof value.analytics === "boolean" &&
          Number.isFinite(value.savedAt) && Date.now() - value.savedAt < CONSENT_MAX_AGE) {
        return value;
      }
    } catch (_) { /* Storage can be unavailable in private browsing. */ }
    return null;
  }

  function writeConsent(analytics) {
    const value = { version: 1, analytics, savedAt: Date.now() };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(value)); } catch (_) { /* Keep this page's choice. */ }
    currentConsent = value;
  }

  function removeAnalyticsCookies() {
    const names = document.cookie.split(";").map((cookie) => cookie.split("=")[0].trim());
    const host = location.hostname;
    for (const name of names) {
      if (!/^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name)) continue;
      for (const domain of ["", host, `.${host}`, "wifigate.io", ".wifigate.io"]) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax${domain ? `; domain=${domain}` : ""}`;
      }
    }
  }

  function applyConsent(analytics) {
    if (!GA_MEASUREMENT_ID) return;
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = !analytics;
    if (!analytics) removeAnalyticsCookies();
    if (analyticsLoaded) {
      window.gtag("consent", "update", { analytics_storage: analytics ? "granted" : "denied" });
      return;
    }
    if (!analytics) return;
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      cookie_expires: 180 * 24 * 60 * 60,
      cookie_update: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    document.head.append(script);
  }

  function closePanel() {
    if (!currentConsent || !panel) return;
    panel.hidden = true;
    details.hidden = true;
    panel.classList.remove("is-customizing");
    syncBannerOffset();
    document.querySelector("[data-cookie-settings]")?.focus();
  }

  function save(analytics) {
    writeConsent(analytics);
    applyConsent(analytics);
    panel.hidden = true;
    details.hidden = true;
    panel.classList.remove("is-customizing");
    syncBannerOffset();
  }

  function openPanel(showDetails = false) {
    analyticsInput.checked = currentConsent?.analytics === true;
    details.hidden = !showDetails;
    panel.classList.toggle("is-customizing", showDetails);
    panel.querySelector("[data-cookie-accept]").hidden = showDetails;
    panel.querySelector("[data-cookie-save]").hidden = !showDetails;
    panel.querySelector("[data-cookie-close]").hidden = !currentConsent;
    panel.hidden = false;
    syncBannerOffset();
    panel.querySelector(showDetails ? "[data-cookie-analytics]" : "[data-cookie-reject]")?.focus();
  }

  function init() {
    // The URL alone sets the language, so the site keeps no language choice.
    try { localStorage.removeItem("language"); } catch (_) { /* Nothing stored. */ }

    document.querySelectorAll("[data-cookie-settings]").forEach((button) => {
      button.textContent = copy.reopen;
      button.setAttribute("aria-label", copy.reopen);
      button.addEventListener("click", () => openPanel(true));
    });

    panel = document.createElement("section");
    panel.className = "cookie-consent";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "false");
    panel.setAttribute("aria-labelledby", "cookie-consent-title");
    panel.tabIndex = -1;
    panel.dir = isRtl ? "rtl" : "ltr";
    panel.hidden = true;
    panel.innerHTML = `
      <div class="cookie-consent__heading">
        <h2 id="cookie-consent-title">${safe.title}</h2>
        <button class="cookie-consent__close" type="button" data-cookie-close aria-label="${safe.close}" hidden>×</button>
      </div>
      <p class="cookie-consent__description">${safe.banner} <a href="${locale}/privacy-policy/">${safe.privacy}</a></p>
      <div class="cookie-consent__details" data-cookie-details hidden>
        <div class="cookie-consent__category">
          <span><strong>${safe.necessary}</strong><small>${safe.necessaryHelp}</small></span>
          <span class="cookie-consent__always">${safe.alwaysOn}</span>
        </div>
        <label class="cookie-consent__category" for="cookie-analytics">
          <span><strong>${safe.analytics}</strong><small>${safe.analyticsHelp}</small></span>
          <input id="cookie-analytics" type="checkbox" data-cookie-analytics>
        </label>
      </div>
      <div class="cookie-consent__actions">
        <button type="button" class="cookie-consent__button cookie-consent__button--primary" data-cookie-reject>${safe.reject}</button>
        <button type="button" class="cookie-consent__button cookie-consent__button--primary" data-cookie-accept>${safe.accept}</button>
        <button type="button" class="cookie-consent__button cookie-consent__button--primary" data-cookie-save hidden>${safe.save}</button>
      </div>`;
    document.body.append(panel);
    details = panel.querySelector("[data-cookie-details]");
    analyticsInput = panel.querySelector("[data-cookie-analytics]");
    const acceptButton = panel.querySelector("[data-cookie-accept]");
    const saveButton = panel.querySelector("[data-cookie-save]");
    const closeButton = panel.querySelector("[data-cookie-close]");

    panel.querySelector("[data-cookie-reject]").addEventListener("click", () => save(false));
    acceptButton.addEventListener("click", () => save(true));
    saveButton.addEventListener("click", () => save(analyticsInput.checked));
    closeButton.addEventListener("click", closePanel);
    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePanel();
    });

    if (currentConsent) applyConsent(currentConsent.analytics);
    else {
      panel.hidden = false;
      panel.focus({ preventScroll: true });
    }
    closeButton.hidden = !currentConsent;
    syncBannerOffset();
    window.addEventListener("resize", syncBannerOffset);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
