// /js/i18n.js
// Version: 1.3.0

var currentLang = "en";

var SITE_LANGUAGE_OPTIONS = [
  { code: "en", label: "English", flagType: "image", flagSrc: "flag-us.png", flagAlt: "US" },
  { code: "he", label: "עברית", flagType: "image", flagSrc: "flag-il.svg", flagAlt: "IL" },
  { code: "es", label: "Español", flagType: "image", flagSrc: "flag-es.svg", flagAlt: "ES" },
  { code: "fr", label: "Français", flagType: "image", flagSrc: "flag-fr.svg", flagAlt: "FR" },
  { code: "de", label: "Deutsch", flagType: "image", flagSrc: "flag-de.svg", flagAlt: "DE" },
  { code: "nl", label: "Nederlands", flagType: "image", flagSrc: "flag-nl.svg", flagAlt: "NL" },
  { code: "it", label: "Italiano", flagType: "image", flagSrc: "flag-it.svg", flagAlt: "IT" },
  { code: "pt", label: "Português", flagType: "image", flagSrc: "flag-pt.svg", flagAlt: "PT" },
  { code: "pl", label: "Polski", flagType: "image", flagSrc: "flag-pl.svg", flagAlt: "PL" },
  { code: "no", label: "Norsk", flagType: "image", flagSrc: "flag-no.svg", flagAlt: "NO" },
  { code: "cs", label: "Čeština", flagType: "image", flagSrc: "flag-cz.svg", flagAlt: "CZ" },
  { code: "ru", label: "Русский", flagType: "image", flagSrc: "flag-ru.svg", flagAlt: "RU" },
  { code: "uk", label: "Українська", flagType: "image", flagSrc: "flag-ua.svg", flagAlt: "UA" },
  { code: "tr", label: "Türkçe", flagType: "image", flagSrc: "flag-tr.svg", flagAlt: "TR" },
  { code: "ar", label: "العربية", flagType: "image", flagSrc: "flag-ae.svg", flagAlt: "AE" },
  { code: "hi", label: "हिन्दी", flagType: "image", flagSrc: "flag-in.svg", flagAlt: "IN" },
  { code: "bn", label: "বাংলা", flagType: "image", flagSrc: "flag-in.svg", flagAlt: "IN" },
  { code: "mr", label: "मराठी", flagType: "image", flagSrc: "flag-in.svg", flagAlt: "IN" },
  { code: "te", label: "తెలుగు", flagType: "image", flagSrc: "flag-in.svg", flagAlt: "IN" },
  { code: "zh-Hans", label: "简体中文", flagType: "image", flagSrc: "flag-cn.svg", flagAlt: "CN" },
  { code: "zh-Hant", label: "繁體中文", flagType: "image", flagSrc: "flag-tw.svg", flagAlt: "TW" },
  { code: "ja", label: "日本語", flagType: "image", flagSrc: "flag-jp.svg", flagAlt: "JP" },
  { code: "ko", label: "한국어", flagType: "image", flagSrc: "flag-kr.svg", flagAlt: "KR" },
  { code: "da", label: "Dansk", flagType: "image", flagSrc: "flag-dk.svg", flagAlt: "DK" },
  { code: "hu", label: "Magyar", flagType: "image", flagSrc: "flag-hu.svg", flagAlt: "HU" },
];

var SITE_LANGUAGE_OPTIONS_BY_CODE = Object.create(null);
var SITE_LANGUAGE_OPTIONS_BY_LOWER_CODE = Object.create(null);

SITE_LANGUAGE_OPTIONS.forEach((option) => {
  SITE_LANGUAGE_OPTIONS_BY_CODE[option.code] = option;
  SITE_LANGUAGE_OPTIONS_BY_LOWER_CODE[option.code.toLowerCase()] = option;
});

var SITE_LANGUAGE_ALIASES = {
  "ar-ae": "ar",
  "bn-in": "bn",
  "cs-cz": "cs",
  "da-dk": "da",
  "de-de": "de",
  "en-us": "en",
  "es-es": "es",
  "fr-fr": "fr",
  "he-il": "he",
  "hi-in": "hi",
  "hu-hu": "hu",
  "it-it": "it",
  "iw-il": "he",
  "ja-jp": "ja",
  "ko-kr": "ko",
  "mr-in": "mr",
  "nl-nl": "nl",
  "no-no": "no",
  "pl-pl": "pl",
  "pt-pt": "pt",
  "ru-ru": "ru",
  "te-in": "te",
  "tr-tr": "tr",
  "uk-ua": "uk",
  "zh-cn": "zh-Hans",
  "zh-hans": "zh-Hans",
  "zh-tw": "zh-Hant",
  "zh-hant": "zh-Hant",
};

function getLanguageOption(lang) {
  return SITE_LANGUAGE_OPTIONS_BY_CODE[lang] || null;
}

function resolveLanguage(lang = currentLang) {
  if (typeof lang !== "string") {
    return "en";
  }

  const trimmed = lang.trim();
  if (!trimmed) {
    return "en";
  }

  if (SITE_LANGUAGE_OPTIONS_BY_CODE[trimmed]) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();

  if (SITE_LANGUAGE_OPTIONS_BY_LOWER_CODE[normalized]) {
    return SITE_LANGUAGE_OPTIONS_BY_LOWER_CODE[normalized].code;
  }

  if (SITE_LANGUAGE_ALIASES[normalized]) {
    return SITE_LANGUAGE_ALIASES[normalized];
  }

  if (normalized.startsWith("iw")) {
    return "he";
  }

  if (normalized.startsWith("zh")) {
    return normalized.includes("tw") || normalized.includes("hant")
      ? "zh-Hant"
      : "zh-Hans";
  }

  const baseCode = normalized.split(/[-_]/)[0];
  if (SITE_LANGUAGE_OPTIONS_BY_CODE[baseCode]) {
    return baseCode;
  }

  return "en";
}

function getResolvedLanguage(lang = currentLang) {
  const requestedLang = resolveLanguage(lang);
  return translations[requestedLang] ? requestedLang : "en";
}

function getTranslationBundle(lang = currentLang) {
  return translations[getResolvedLanguage(lang)];
}

function getLanguageFlagAssetBasePath(selectedFlag) {
  const existingFlagImage = selectedFlag?.querySelector("img");
  const rawSrc = existingFlagImage?.getAttribute("src");

  if (rawSrc) {
    return rawSrc.replace(/flag-[^/]+$/, "");
  }

  return "assets/img/flags/";
}

function getLanguageFlagMarkup(option, assetBasePath) {
  if (option.flagType === "image") {
    return `<img src="${assetBasePath}${option.flagSrc}" alt="${option.flagAlt}" width="50" height="33" />`;
  }

  return option.flagEmoji || "🌐";
}

function buildLanguageSelectorOptions(dropdown, assetBasePath) {
  dropdown.innerHTML = SITE_LANGUAGE_OPTIONS.map((option) => {
    const dir = RTL_LANGS.has(option.code) ? ' dir="rtl"' : ' dir="auto"';
    return `
      <div class="language-selector__option" data-lang="${option.code}">
        <span class="language-selector__flag" data-flag-type="${option.flagType}">${getLanguageFlagMarkup(
          option,
          assetBasePath
        )}</span>
        <span class="language-selector__label"${dir}>${option.label}</span>
      </div>
    `;
  }).join("");
}

function updateSelectedLanguageDisplay(option, selectedText, selectedFlag) {
  if (!option || !selectedText || !selectedFlag) {
    return;
  }

  const label = option.querySelector(".language-selector__label")?.textContent || "English";
  const flag = option.querySelector(".language-selector__flag");

  selectedText.textContent = label;
  selectedFlag.innerHTML = flag ? flag.innerHTML : "";
  selectedFlag.setAttribute(
    "data-flag-type",
    flag?.getAttribute("data-flag-type") || "image"
  );
}

function setupLanguageSelector() {
  const selector = document.querySelector(".language-selector");
  const button = document.getElementById("language-button");
  const dropdown = document.getElementById("language-dropdown");
  const selectedText = button?.querySelector(".language-selector__selected");
  const selectedFlag = document.getElementById("selected-flag");

  if (!selector || !button || !dropdown || !selectedText || !selectedFlag) {
    return;
  }

  buildLanguageSelectorOptions(dropdown, getLanguageFlagAssetBasePath(selectedFlag));

  const options = dropdown.querySelectorAll(".language-selector__option");

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    selector.classList.toggle("is-open");
  });

  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selector.classList.toggle("is-open");
    }
  });

  options.forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();

      const requestedLang = resolveLanguage(option.dataset.lang);

      options.forEach((item) => item.classList.remove("is-selected"));
      option.classList.add("is-selected");
      updateSelectedLanguageDisplay(option, selectedText, selectedFlag);
      selector.classList.remove("is-open");

      changeLanguage(requestedLang);
    });
  });

  document.addEventListener("click", (event) => {
    if (!selector.contains(event.target)) {
      selector.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      selector.classList.remove("is-open");
    }
  });

  const savedLang = resolveLanguage(
    localStorage.getItem("language") ||
      document.documentElement.getAttribute("data-selected-language") ||
      currentLang ||
      "en"
  );
  const selectedOption =
    dropdown.querySelector(`[data-lang="${savedLang}"]`) ||
    dropdown.querySelector('[data-lang="en"]');

  if (!selectedOption) {
    return;
  }

  selectedOption.classList.add("is-selected");
  updateSelectedLanguageDisplay(selectedOption, selectedText, selectedFlag);
}

function changeLanguage(lang) {
  const requestedLang = resolveLanguage(lang);
  const resolvedLang = getResolvedLanguage(requestedLang);

  if (!translations[resolvedLang]) {
    console.error("Language not found:", lang);
    return;
  }

  currentLang = requestedLang;
  window.currentLanguage = requestedLang;
  window.resolvedLanguage = resolvedLang;
  localStorage.setItem("language", requestedLang);
  document.documentElement.setAttribute("lang", resolvedLang);
  document.documentElement.setAttribute("data-selected-language", requestedLang);

  if (RTL_LANGS.has(requestedLang)) {
    document.documentElement.setAttribute("dir", "rtl");
    document.body.classList.add("rtl");
  } else {
    document.documentElement.setAttribute("dir", "ltr");
    document.body.classList.remove("rtl");
  }

  updateTranslations();
  updateHeroRotatorPhrase();
  document.dispatchEvent(
    new CustomEvent("site-language-change", {
      detail: {
        lang: requestedLang,
        resolvedLang,
      },
    })
  );
}

function updateTranslations() {
  const elements = document.querySelectorAll("[data-i18n]");
  const activeTranslations = getTranslationBundle();

  elements.forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const translation = getNestedTranslation(activeTranslations, key);

    if (translation) {
      element.textContent = translation;
    }
  });
}
