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

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupScrollSpy();
  setupRevealOnScroll();
  setupCenteredScroll();
  setupContactForm();
  setupHeroRotator();
  setupVideoAutoplay();
  setupLanguageSelector();
  setYear();

  const savedLang = localStorage.getItem("language") || "en";
  if (savedLang !== "en") {
    changeLanguage(savedLang);
  }
});
