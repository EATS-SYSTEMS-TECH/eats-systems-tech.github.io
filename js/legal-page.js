// /js/legal-page.js
// Version: 2.0.0

const LEGAL_PAGE_LANGUAGE = "en"

function setLegalPageYear() {
  const yearEl = document.getElementById("js-year")
  if (!yearEl) return

  yearEl.textContent = new Date().getFullYear()
}

function applyLegalPageMeta() {
  if (typeof getTranslationBundle !== "function") return

  const bundle = getTranslationBundle()
  const legal = bundle && bundle.legal
  if (!legal) return

  if (legal.metaTags && legal.metaTags.title) {
    document.title = legal.metaTags.title
  }

  if (legal.metaTags && legal.metaTags.description) {
    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.setAttribute("content", legal.metaTags.description)
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("language") || LEGAL_PAGE_LANGUAGE

  if (typeof changeLanguage === "function") {
    // Keep the legal draft consistent on first load without overwriting
    // the visitor's preferred language for the rest of the site.
    changeLanguage(LEGAL_PAGE_LANGUAGE)
  }

  if (typeof setupAccessibilityWidget === "function") {
    setupAccessibilityWidget()
  }

  if (typeof setupNav === "function") {
    setupNav()
  }

  if (typeof setupLanguageSelector === "function") {
    setupLanguageSelector()
  }

  if (savedLang !== LEGAL_PAGE_LANGUAGE) {
    localStorage.setItem("language", savedLang)
  }

  setLegalPageYear()
  applyLegalPageMeta()
  document.addEventListener("site-language-change", applyLegalPageMeta)
})
