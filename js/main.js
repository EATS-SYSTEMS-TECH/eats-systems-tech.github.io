// /js/main.js

// Utility: select helpers
const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupScrollSpy();
  setupRevealOnScroll();
  setupCenteredScroll();
  setupContactForm();
  setupHeroRotator();
  setupVideoAutoplay();
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
 * Centered scroll behavior for in-page anchors
 * - Intercepts clicks on `a[href^="#"]` and smoothly centers the target element
 * - Handles initial page load with a hash and focuses the target for accessibility
 */
function centerScrollToElement(el, smooth = true) {
  if (!el) return;
  
  // Special handling for features section - scroll to start
  if (el.id === 'features') {
    try {
      if ('scrollBehavior' in document.documentElement.style) {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start', inline: 'nearest' });
        return;
      }
    } catch (e) {
      // fall through to manual calculation
    }
    
    const rect = el.getBoundingClientRect();
    const elTop = rect.top + window.scrollY;
    try {
      window.scrollTo({ top: elTop, behavior: smooth ? 'smooth' : 'auto' });
    } catch (err) {
      window.scrollTo(0, elTop);
    }
    return;
  }
  
  // Default center behavior for other sections
  // Prefer scrollIntoView with block:center when available
  try {
    if ('scrollBehavior' in document.documentElement.style) {
      el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center', inline: 'nearest' });
      return;
    }
  } catch (e) {
    // fall through to manual calculation
  }

  const rect = el.getBoundingClientRect();
  const elTop = rect.top + window.scrollY;
  const targetScroll = Math.round(elTop - (window.innerHeight / 2) + (rect.height / 2));
  try {
    window.scrollTo({ top: targetScroll, behavior: smooth ? 'smooth' : 'auto' });
  } catch (err) {
    window.scrollTo(0, targetScroll);
  }
}

function setupCenteredScroll() {
  // Delegate clicks on same-page anchors
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    // ignore lone '#' anchors
    if (href === '#') return;

    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return; // allow normal behavior if target not found

    ev.preventDefault();

    // Close mobile nav if open to avoid layout shift
    const navWrapper = document.querySelector('.nav__links-wrapper');
    const toggle = document.querySelector('.nav__toggle');
    if (navWrapper && navWrapper.classList.contains('is-open')) {
      navWrapper.classList.remove('is-open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }

    centerScrollToElement(target, true);

    // Update history without triggering another jump
    try {
      if (history.pushState) {
        history.pushState(null, '', '#' + id);
      } else {
        location.hash = '#' + id;
      }
    } catch (e) {
      // ignore
    }

    // Move focus to the target for keyboard users without scrolling again
    try {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.removeAttribute('tabindex');
    } catch (err) {
      // ignore focus errors
    }
  });

  // If page loaded with a hash, center it (defer slightly to allow default jump)
  if (location.hash) {
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      setTimeout(() => {
        centerScrollToElement(target, false);
        try {
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
          target.removeAttribute('tabindex');
        } catch (err) {}
      }, 60);
    }
  }
}

/**
 * Hero title rotator: cycles between phrases every 2 seconds
 */
function setupHeroRotator() {
  const el = document.getElementById("hero-rotator");
  if (!el) return;

  const phrases = ["User Intuitive", "Full Privacy", "No Subscriptions"];
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

/**
 * Video autoplay on scroll into view
 */
function setupVideoAutoplay() {
  const video = document.getElementById('action-video');
  if (!video) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        video.play().catch(err => console.log('Video autoplay failed:', err));
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.5 });

  observer.observe(video);
}
