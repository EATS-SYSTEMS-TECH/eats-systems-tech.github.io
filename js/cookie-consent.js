// Website analytics stays unloaded until the visitor makes an affirmative choice.
// Rejecting is as easy and as prominent as accepting: both buttons look the same.
// Set this to the site's GA4 measurement ID (G-...) when the property is connected.
const GA_MEASUREMENT_ID = "G-4GRM6RNH0C";
const CONSENT_KEY = "wifigate-cookie-consent-v1";
const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

(() => {
  // Only static consumer marketing pages are eligible. The same preference UI
  // is also used by portal and invitation pages, which must never load GA.
  const analyticsLocales = new Set([
    "es", "fr", "de", "he", "nl", "it", "pt", "pl", "no", "cs", "ru", "uk",
    "tr", "ar", "hi", "bn", "mr", "te", "zh-hans", "zh-hant", "ja", "ko",
    "da", "sv", "hu", "el", "ro", "hr", "fi", "bg", "sr", "sk", "sl",
    "id", "th", "vi", "ms", "fil",
  ]);
  const analyticsPages = new Set([
    "", "automation", "auto-open", "wifigate-host", "hotels-airbnb", "roller-shutters", "electric-gates",
    "garage-doors", "private-homes", "residential-buildings", "office-buildings",
    "entry-doors-magnetic-locks", "sports-facilities", "storage-lockers",
    "privacy-policy", "terms-and-conditions", "cookies", "accessibility", "contact-us",
  ]);

  function analyticsPage() {
    if (!["https://wifigate.io", "https://www.wifigate.io"].includes(location.origin)) return null;
    const pathname = location.pathname.replace(/\/index\.html$/, "/");
    if (!pathname.startsWith("/") || /\/\//.test(pathname)) return null;
    const parts = pathname.slice(1).replace(/\/$/, "").split("/");
    const locale = analyticsLocales.has(parts[0]) ? parts.shift() : "en";
    if (parts.length > 1 || !analyticsPages.has(parts[0] || "")) return null;
    const page = parts[0] || "";
    const canonicalPath = `${locale === "en" ? "/" : `/${locale}/`}${page ? `${page}/` : ""}`;
    let referrer = "";
    try {
      const url = new URL(document.referrer);
      if (["http:", "https:"].includes(url.protocol)) referrer = url.origin;
    } catch (_) { /* No usable referrer. */ }
    return {
      page_location: `https://wifigate.io${canonicalPath}`,
      page_referrer: referrer,
      page_title: `WIFIGATE | ${page || "home"} | ${locale}`,
    };
  }

  if (GA_MEASUREMENT_ID) window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
  const requestedLocale = document.documentElement.lang || "en";
  const copies = window.WIFIGATE_COOKIE_COPY;
  // A generated page embeds its own language only; the full file has them all.
  const pageLocale = Object.hasOwn(copies, requestedLocale) ? requestedLocale : Object.hasOwn(copies, "en") ? "en" : Object.keys(copies)[0];
  const copy = window.WIFIGATE_COOKIE_COPY[pageLocale];
  const isRtl = pageLocale === "he" || pageLocale === "ar";
  const locale = pageLocale === "en" ? "" : `/${pageLocale.toLowerCase()}`;
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
  const safe = Object.fromEntries(Object.entries(copy).map(([key, value]) => [key, escapeHtml(value)]));
  const consent = readConsent();
  let currentConsent = consent;
  let consentPersisted = consent !== null;
  let analyticsLoadState = "idle";
  let analyticsPrepared = false;
  let analyticsConfigured = false;
  let analyticsScript;
  let panel;
  let details;
  let analyticsInput;

  function syncBannerOffset() {
    const visible = panel && !panel.hidden;
    document.body.classList.toggle("has-cookie-banner", Boolean(visible));
    document.body.style.setProperty("--cookie-banner-height", visible ? `${Math.ceil(panel.getBoundingClientRect().height)}px` : "0px");
  }

  function validConsent(value) {
    return value?.version === 1 && typeof value.analytics === "boolean" &&
      Number.isFinite(value.savedAt) && value.savedAt >= 0 && value.savedAt <= Date.now() &&
      Date.now() - value.savedAt < CONSENT_MAX_AGE;
  }

  function readConsent() {
    try {
      const value = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
      if (validConsent(value)) return value;
    } catch (_) { /* Storage can be unavailable in private browsing. */ }
    return null;
  }

  function writeConsent(analytics) {
    const value = { version: 1, analytics, savedAt: Date.now() };
    consentPersisted = false;
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
      consentPersisted = true;
    } catch (_) { /* Keep this page's choice. */ }
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

  function applyConsent(analytics, explicitChoice = false) {
    if (!GA_MEASUREMENT_ID) return;
    const page = analyticsPage();
    let enabled = analytics && Boolean(page) && validConsent(currentConsent) && currentConsent.analytics;
    // A pending script can finish before another tab's storage event is handled.
    // Recheck a persisted choice before granting; private-browsing page-only
    // choices remain valid when their attempted storage write was unavailable.
    if (enabled && consentPersisted) {
      const stored = readConsent();
      if (!stored?.analytics) {
        currentConsent = stored;
        enabled = false;
      }
    }
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = !enabled;
    if (!enabled) removeAnalyticsCookies();
    if (!page) return;
    if (analyticsLoadState === "loaded") {
      window.gtag("consent", "update", { analytics_storage: enabled ? "granted" : "denied" });
      if (enabled && !analyticsConfigured) {
        analyticsConfigured = true;
        window.gtag("set", page);
        window.gtag("js", new Date());
        window.gtag("config", GA_MEASUREMENT_ID, {
          ...page,
          // Enhanced Measurement, including history changes, must stay OFF
          // in the web stream; send_page_view alone does not disable it.
          send_page_view: false,
          cookie_expires: 180 * 24 * 60 * 60,
          cookie_update: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
        });
        window.gtag("event", "page_view", page);
      }
      return;
    }
    if (!enabled) {
      if (analyticsPrepared) window.gtag("consent", "update", { analytics_storage: "denied" });
      return;
    }
    if (analyticsLoadState === "loading" || (analyticsLoadState === "failed" && !explicitChoice)) return;
    if (!analyticsPrepared) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag("consent", "default", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
      analyticsPrepared = true;
    }
    analyticsLoadState = "loading";
    const script = document.createElement("script");
    analyticsScript = script;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    script.onload = () => {
      if (analyticsScript !== script) return;
      script.onload = script.onerror = null;
      analyticsLoadState = "loaded";
      applyConsent(currentConsent?.analytics === true);
    };
    script.onerror = () => {
      if (analyticsScript !== script) return;
      script.onload = script.onerror = null;
      analyticsScript = undefined;
      analyticsLoadState = "failed";
      script.remove();
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      window.gtag("consent", "update", { analytics_storage: "denied" });
    };
    document.head.append(script);
  }

  function sharedConsentChanged(event) {
    if (event.key !== CONSENT_KEY && event.key !== null) return;
    try { if (event.storageArea !== localStorage) return; } catch (_) { return; }
    const stored = readConsent();
    // Propagate revocation immediately. A different tab cannot implicitly
    // enable a previously disabled document; its own accept or a normal reload
    // may apply a valid affirmative saved choice.
    if (stored?.analytics === true) return;
    currentConsent = stored;
    consentPersisted = stored !== null;
    applyConsent(false);
    if (analyticsInput) analyticsInput.checked = false;
    if (panel) {
      panel.querySelector("[data-cookie-close]").hidden = !currentConsent;
      if (!currentConsent) openPanel();
    }
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
    applyConsent(analytics, true);
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
    window.addEventListener("storage", sharedConsentChanged);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
