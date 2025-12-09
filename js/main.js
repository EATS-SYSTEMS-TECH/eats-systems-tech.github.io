// /js/main.js

// Utility: select helpers
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupScrollSpy();
  setupRevealOnScroll();
  setupContactForm();
  setupHeroRotator();
  setYear();
});

/**
 * Mobile navigation toggle
 */
function setupNav() {
  const toggle = $(".nav__toggle");
  const navWrapper = $(".nav__links-wrapper");
  if (!toggle || !navWrapper) return;

  toggle.addEventListener("click", () => {
    const isOpen = navWrapper.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close menu when a link is clicked (mobile)
  $$(".nav__link", navWrapper).forEach((link) => {
    link.addEventListener("click", () => {
      if (navWrapper.classList.contains("is-open")) {
        navWrapper.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

/**
 * Scroll spy: highlight nav link for current section
 */
function setupScrollSpy() {
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__link");

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.getAttribute("id");
        if (!id) return;

        navLinks.forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (href === `#${id}`) {
            link.classList.add("nav__link--active");
          } else {
            link.classList.remove("nav__link--active");
          }
        });
      });
    },
    {
      threshold: 0.4,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/**
 * Reveal-on-scroll animation using IntersectionObserver
 */
function setupRevealOnScroll() {
  const revealEls = $$(".js-reveal");
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target); // animate once
        }
      });
    },
    {
      threshold: 0.22,
    }
  );

  revealEls.forEach((el) => observer.observe(el));
}

/**
 * Simple contact form success message
 */
function setupContactForm() {
  const form = $(".contact-form");
  if (!form) return;

  const statusEl = $(".contact-form__status", form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // basic front-end validation
    const name = $("#name", form);
    const email = $("#email", form);
    const message = $("#message", form);

    if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
      updateStatus("Please fill out all fields before sending.", "error", statusEl);
      return;
    }

    // Here you could integrate with a backend or email service.
    form.reset();
    updateStatus("Thank you! Your message has been sent.", "success", statusEl);
  });
}

/**
 * Update contact form status text
 */
function updateStatus(text, type, el) {
  if (!el) return;
  el.textContent = text;
  el.style.color = type === "success" ? "#15803d" : "#b91c1c";
}

/**
 * Set current year in footer
 */
function setYear() {
  const yearEl = $("#js-year");
  if (!yearEl) return;
  yearEl.textContent = new Date().getFullYear();
}

/**
 * Hero title rotator: cycles between phrases every 2 seconds
 */
function setupHeroRotator() {
  const el = document.getElementById("hero-rotator");
  if (!el) return;

  const phrases = ["User Intuitive", "Secure Architecture", "No Subscriptions"];
  let idx = 0;

  // Ensure initial phrase is set
  el.textContent = phrases[0];

  const interval = 3000; // change every 3s
  const fadeClass = 'is-fading';

  // helper to perform a single fade swap
  function swapNext() {
    const nextIdx = (idx + 1) % phrases.length;

    // Prefer Web Animations API for reliable fades; fall back to CSS class if unavailable
    const animMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rotator-duration')) || 420;

    if (el.animate) {
      // fade out
      const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: animMs, easing: 'ease', fill: 'forwards' });
      out.onfinish = () => {
        el.textContent = phrases[nextIdx];
        // fade in
        const _in = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: animMs, easing: 'ease', fill: 'forwards' });
        _in.onfinish = () => {
          idx = nextIdx;
        };
      };
    } else {
      // fallback: use CSS class toggle + timeout (existing approach)
      const onTransitionEnd = (ev) => {
        if (ev && ev.propertyName && ev.propertyName !== 'opacity') return;
        el.removeEventListener('transitionend', onTransitionEnd);
        el.textContent = phrases[nextIdx];
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove(fadeClass)));
        idx = nextIdx;
        if (fallbackTimer) {
          clearTimeout(fallbackTimer);
        }
      };
      el.addEventListener('transitionend', onTransitionEnd);
      el.classList.add(fadeClass);
      const fallbackTimer = setTimeout(() => onTransitionEnd({ propertyName: 'opacity' }), animMs + 80);
    }
  }

  // Kick off the interval
  setInterval(swapNext, interval);
}
