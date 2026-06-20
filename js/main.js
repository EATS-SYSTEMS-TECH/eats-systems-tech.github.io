// /js/main.js
// Version: 1.2.0

function resolveStaticPageLanguage() {
  const lang = document.documentElement.getAttribute("lang") || "en";
  return typeof lang === "string" && lang.trim() ? lang.trim() : "en";
}

function setupRevealOnScroll() {
  const revealEls = $$(".js-reveal");
  if (!revealEls.length) return;

  if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
    return;
  }

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

  document.addEventListener("site-accessibility-change", () => {
    if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    }
  });
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

    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const pageLang = resolveStaticPageLanguage();
  const pageDir =
    document.documentElement.getAttribute("dir") ||
    (pageLang === "he" || pageLang === "ar" ? "rtl" : "ltr");
  const savedLang = localStorage.getItem("language") || pageLang;

  if (typeof changeLanguage === "function") {
    changeLanguage(savedLang);
  } else {
    window.currentLanguage = pageLang;
    document.documentElement.setAttribute("lang", pageLang);
    document.documentElement.setAttribute("dir", pageDir);
    document.body.classList.toggle("rtl", pageDir === "rtl");
  }

  if (typeof setupAccessibilityWidget === "function") {
    setupAccessibilityWidget();
  }

  if (typeof setupNav === "function") setupNav();
  if (typeof setupScrollSpy === "function") setupScrollSpy();
  if (typeof setupRevealOnScroll === "function") setupRevealOnScroll();
  if (typeof setupCenteredScroll === "function") setupCenteredScroll();
  if (typeof setupContactForm === "function") setupContactForm();
  if (typeof setupHeroMedia === "function") setupHeroMedia();
  if (typeof setupHeroRotator === "function") setupHeroRotator();
  if (typeof setupVideoAutoplay === "function") setupVideoAutoplay();
  if (typeof setupLanguageSelector === "function") setupLanguageSelector();
  if (typeof setupTabNavigation === "function") setupTabNavigation();
  setYear();
});
