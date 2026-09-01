// /js/language-selector.js
// Version: 1.1.0

function setupLanguageSelector() {
  const selector = document.querySelector(".language-selector");
  const button = document.getElementById("language-button");
  const dropdown = document.getElementById("language-dropdown");

  if (!selector || !button || !dropdown) {
    return;
  }

  // Some page types also call this initializer from their page-specific
  // script. Keep the shared controller idempotent so self-initialization does
  // not register duplicate click handlers and immediately undo a toggle.
  if (selector.dataset.languageSelectorReady === "true") {
    return;
  }
  selector.dataset.languageSelectorReady = "true";

  button.setAttribute("aria-controls", dropdown.id);
  button.setAttribute("aria-haspopup", "true");
  button.setAttribute("aria-expanded", "false");

  const setSelectorOpen = (isOpen) => {
    selector.classList.toggle("is-open", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
  };

  const closeSelector = () => setSelectorOpen(false);
  const toggleSelector = () => setSelectorOpen(!selector.classList.contains("is-open"));

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSelector();
  });

  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSelector();
    }

    if (event.key === "Escape") {
      closeSelector();
    }
  });

  dropdown.querySelectorAll("a.language-selector__option").forEach((option) => {
    option.addEventListener("click", () => {
      try {
        localStorage.setItem("language", option.dataset.lang || "en");
      } catch (error) {
        // Ignore storage failures.
      }

      closeSelector();
    });
  });

  document.addEventListener("click", (event) => {
    if (!selector.contains(event.target)) {
      closeSelector();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeSelector();
    }
  });
}

function initializeLanguageSelector() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupLanguageSelector, { once: true });
    return;
  }

  setupLanguageSelector();
}

initializeLanguageSelector();
