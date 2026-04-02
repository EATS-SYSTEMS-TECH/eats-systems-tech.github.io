// /js/main.js
// Version: 1.2.0

function setupRevealOnScroll() {
  const revealEls = $$(".js-reveal");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.22,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}

function setupContactForm() {
  const form = $(".contact-form");
  if (!form) return;

  const statusEl = $(".contact-form__status", form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("#name", form);
    const email = $("#email", form);
    const message = $("#message", form);

    if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
      updateStatus("Please fill out all fields before sending.", "error", statusEl);
      return;
    }

    form.reset();
    updateStatus("Thank you! Your message has been sent.", "success", statusEl);
  });
}

function updateStatus(text, type, el) {
  if (!el) return;

  el.textContent = text;
  el.style.color = type === "success" ? "#15803d" : "#b91c1c";
}

function setYear() {
  const yearEl = $("#js-year");
  if (!yearEl) return;

  yearEl.textContent = new Date().getFullYear();
}

function setupTabNavigation() {
  const tabButtons = $$(".tab-button, .tab-dot");
  const tabPanes = $$(".tab-pane");

  if (!tabButtons.length || !tabPanes.length) return;

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTab = button.getAttribute("data-tab");

      // Remove active class from all controls and panes
      tabButtons.forEach((btn) => {
        btn.classList.remove("tab-button--active");
        btn.classList.remove("tab-dot--active");
        if (btn.matches(".tab-dot")) {
          btn.setAttribute("aria-selected", "false");
        }
      });
      tabPanes.forEach((pane) => pane.classList.remove("tab-pane--active"));

      // Add active marker to clicked control and corresponding pane
      if (button.matches(".tab-dot")) {
        button.classList.add("tab-dot--active");
        button.setAttribute("aria-selected", "true");
      } else {
        button.classList.add("tab-button--active");
      }

      const targetPane = $("#" + targetTab + "-tab");
      if (targetPane) {
        targetPane.classList.add("tab-pane--active");
      }

      const title = $("#action-title");
      if (title && targetTab) {
        title.textContent = targetTab === "why" ? (i18n[window.currentLanguage || "en"].action.title || "Why WIFIGATE?") : (i18n[window.currentLanguage || "en"].action.title || "Where WIFIGATE?");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupScrollSpy();
  setupRevealOnScroll();
  setupCenteredScroll();
  setupContactForm();
  setupHeroRotator();
  setupVideoAutoplay();
  setupLanguageSelector();
  setupTabNavigation();
  setYear();

  const savedLang = localStorage.getItem("language") || "en";
  if (savedLang !== "en") {
    changeLanguage(savedLang);
  }
});
