// Website analytics stays unloaded until the visitor makes an affirmative choice.
// Set this to the site's GA4 measurement ID (G-...) when the property is connected.
const GA_MEASUREMENT_ID = "";
const CONSENT_KEY = "wifigate-cookie-consent-v1";
const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

(() => {
  const pageLocale = document.documentElement.lang || "en";
  const copy = window.WIFIGATE_COOKIE_COPY?.[pageLocale] || window.WIFIGATE_COOKIE_COPY.en;
  const isRtl = pageLocale === "he" || pageLocale === "ar";
  const locale = pageLocale === "en" ? "" : `/${pageLocale.toLowerCase()}`;
  const consent = readConsent();
  let currentConsent = consent;
  let analyticsLoaded = false;
  let panel;
  let details;
  let analyticsInput;

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
    document.querySelector("[data-cookie-settings]")?.focus();
  }

  function save(analytics) {
    writeConsent(analytics);
    applyConsent(analytics);
    panel.hidden = true;
    details.hidden = true;
  }

  function openPanel(showDetails = false) {
    analyticsInput.checked = currentConsent?.analytics === true;
    details.hidden = !showDetails;
    panel.querySelector("[data-cookie-settings-open]").hidden = showDetails;
    panel.querySelector("[data-cookie-accept]").hidden = showDetails;
    panel.querySelector("[data-cookie-save]").hidden = !showDetails;
    panel.querySelector("[data-cookie-close]").hidden = !currentConsent;
    panel.hidden = false;
    panel.querySelector(showDetails ? "[data-cookie-save]" : "[data-cookie-settings-open]")?.focus();
  }

  function init() {
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
        <span class="cookie-consent__mark" aria-hidden="true">◈</span>
        <h2 id="cookie-consent-title">${copy.title}</h2>
        <button class="cookie-consent__close" type="button" data-cookie-close aria-label="${copy.close}" hidden>×</button>
      </div>
      <p class="cookie-consent__description">${copy.description}</p>
      <p class="cookie-consent__links"><a href="${locale}/privacy-policy/">${copy.privacy}</a><span aria-hidden="true">·</span><a href="${locale}/cookies/">${copy.cookies}</a></p>
      <div class="cookie-consent__details" data-cookie-details hidden>
        <div class="cookie-consent__category">
          <span><strong>${copy.necessary}</strong><small>${copy.necessaryHelp}</small></span>
          <span class="cookie-consent__always">${copy.alwaysOn}</span>
        </div>
        <label class="cookie-consent__category" for="cookie-analytics">
          <span><strong>${copy.analytics}</strong><small>${copy.analyticsHelp}</small></span>
          <input id="cookie-analytics" type="checkbox" data-cookie-analytics>
        </label>
      </div>
      <div class="cookie-consent__actions">
        <button type="button" class="cookie-consent__button cookie-consent__button--outline" data-cookie-reject>${copy.reject}</button>
        <button type="button" class="cookie-consent__button cookie-consent__button--outline" data-cookie-settings-open>${copy.settings}</button>
        <button type="button" class="cookie-consent__button cookie-consent__button--primary" data-cookie-accept>${copy.accept}</button>
        <button type="button" class="cookie-consent__button cookie-consent__button--primary" data-cookie-save hidden>${copy.save}</button>
      </div>`;
    document.body.append(panel);
    details = panel.querySelector("[data-cookie-details]");
    analyticsInput = panel.querySelector("[data-cookie-analytics]");
    const settingsButton = panel.querySelector("[data-cookie-settings-open]");
    const acceptButton = panel.querySelector("[data-cookie-accept]");
    const saveButton = panel.querySelector("[data-cookie-save]");
    const closeButton = panel.querySelector("[data-cookie-close]");

    settingsButton.addEventListener("click", () => {
      details.hidden = false;
      settingsButton.hidden = true;
      acceptButton.hidden = true;
      saveButton.hidden = false;
      analyticsInput.focus();
    });
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
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
