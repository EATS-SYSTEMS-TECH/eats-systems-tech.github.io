// /js/language-selector.js
// Version: 1.0.0

function setupLanguageSelector() {
  const selector = document.querySelector(".language-selector");
  const button = document.getElementById("language-button");
  const dropdown = document.getElementById("language-dropdown");

  if (!selector || !button || !dropdown) {
    return;
  }

  const closeSelector = () => selector.classList.remove("is-open");

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    selector.classList.toggle("is-open");
  });

  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selector.classList.toggle("is-open");
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