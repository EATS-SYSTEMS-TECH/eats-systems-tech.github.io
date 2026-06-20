// /js/legal-page.js
// Version: 2.0.0

const DEFAULT_LEGAL_PAGE_LANGUAGE = "en"

function getStaticLegalLanguage() {
  const lang = document.documentElement.getAttribute("lang") || DEFAULT_LEGAL_PAGE_LANGUAGE
  return typeof lang === "string" && lang.trim() ? lang.trim() : DEFAULT_LEGAL_PAGE_LANGUAGE
}

function getStaticLegalDirection(lang) {
  return lang === "he" || lang === "ar" ? "rtl" : "ltr"
}

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
  const pageLang = getStaticLegalLanguage()
  const pageDir = document.documentElement.getAttribute("dir") || getStaticLegalDirection(pageLang)
  const savedLang = localStorage.getItem("language") || pageLang
  const initialLang =
    typeof resolveLanguage === "function"
      ? resolveLanguage(savedLang)
      : savedLang

  if (typeof changeLanguage === "function") {
    changeLanguage(initialLang)
  } else {
    window.currentLanguage = pageLang
    document.documentElement.setAttribute("lang", pageLang)
    document.documentElement.setAttribute("dir", pageDir)
    document.body.classList.toggle("rtl", pageDir === "rtl")
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
