// /js/legal-page.js
// The legal pages are generated in their language; this only starts the shared
// header controls (menu and language selector).

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.toggle("rtl", document.documentElement.getAttribute("dir") === "rtl")
  if (typeof setupNav === "function") setupNav()
  if (typeof setupLanguageSelector === "function") setupLanguageSelector()
})
