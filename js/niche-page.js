// /js/niche-page.js
// Shared initializer for generated niche/use-case pages.

document.addEventListener("DOMContentLoaded", () => {
  if (typeof setupAccessibilityWidget === "function") {
    setupAccessibilityWidget();
  }

  if (typeof setupNav === "function") {
    setupNav();
  }

  if (typeof setupLanguageSelector === "function") {
    setupLanguageSelector();
  }
});