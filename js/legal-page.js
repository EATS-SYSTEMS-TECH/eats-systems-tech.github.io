// /js/legal-page.js
// Version: 2.0.0

const DEFAULT_LEGAL_PAGE_LANGUAGE = "en"

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
  const savedLang = localStorage.getItem("language") || DEFAULT_LEGAL_PAGE_LANGUAGE
  const initialLang =
    typeof resolveLanguage === "function"
      ? resolveLanguage(savedLang)
      : savedLang

  if (typeof changeLanguage === "function") {
    changeLanguage(initialLang)
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
  setLegalPageYear()
  applyLegalPageMeta()
  document.addEventListener("site-language-change", applyLegalPageMeta)
})
