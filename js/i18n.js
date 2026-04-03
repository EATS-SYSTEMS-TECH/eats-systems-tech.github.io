// /js/i18n.js
// Version: 1.2.0

var currentLang = "en";

function getResolvedLanguage(lang = currentLang) {
  return translations[lang] ? lang : "en";
}

function getTranslationBundle(lang = currentLang) {
  return translations[getResolvedLanguage(lang)];
}

function setupLanguageSelector() {
  const selector = document.querySelector(".language-selector");
  const button = document.getElementById("language-button");
  const dropdown = document.getElementById("language-dropdown");
  const options = document.querySelectorAll(".language-selector__option");
  const selectedText = button?.querySelector(".language-selector__selected");
  const selectedFlag = document.getElementById("selected-flag");

  if (!selector || !button || !dropdown || !selectedText) return;

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

      const lang = option.dataset.lang;
      const flagHTML = option.querySelector(".language-selector__flag").innerHTML;
      const text = option.querySelector("span:not(.language-selector__flag)").textContent;

      selectedText.textContent = text;
      if (selectedFlag) {
        selectedFlag.innerHTML = flagHTML;
      }

      options.forEach((item) => item.classList.remove("is-selected"));
      option.classList.add("is-selected");
      selector.classList.remove("is-open");

      changeLanguage(lang);
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

  const savedLang = localStorage.getItem("language") || "en";
  const selectedOption = dropdown.querySelector(`[data-lang="${savedLang}"]`);
  if (!selectedOption) return;

  selectedOption.classList.add("is-selected");
  const text = selectedOption.querySelector("span:not(.language-selector__flag)").textContent;
  const flagHTML = selectedOption.querySelector(".language-selector__flag").innerHTML;
  selectedText.textContent = text;
  if (selectedFlag) {
    selectedFlag.innerHTML = flagHTML;
  }
}

function changeLanguage(lang) {
  const resolvedLang = getResolvedLanguage(lang);

  if (!translations[resolvedLang]) {
    console.error("Language not found:", lang);
    return;
  }

  currentLang = resolvedLang;
  window.currentLanguage = resolvedLang;
  localStorage.setItem("language", resolvedLang);
  document.documentElement.setAttribute("lang", resolvedLang);

  if (RTL_LANGS.has(resolvedLang)) {
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
        lang: resolvedLang,
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
