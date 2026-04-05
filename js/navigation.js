// /js/navigation.js
// Version: 1.2.0

function setupNav() {
  const toggle = $(".nav__toggle");
  const navWrapper = $(".nav__links-wrapper");
  if (!toggle || !navWrapper) return;

  toggle.addEventListener("click", () => {
    const isOpen = navWrapper.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  $$(".nav__link", navWrapper).forEach((link) => {
    link.addEventListener("click", () => {
      if (navWrapper.classList.contains("is-open")) {
        navWrapper.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

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

function centerScrollToElement(el, smooth = true) {
  if (!el) return;

  const shouldSmoothScroll = smooth && !(typeof isReducedMotionRequested === "function" && isReducedMotionRequested());

  if (el.id === "advantages") {
    try {
      if ("scrollBehavior" in document.documentElement.style) {
        el.scrollIntoView({ behavior: shouldSmoothScroll ? "smooth" : "auto", block: "start", inline: "nearest" });
        return;
      }
    } catch (error) {
      // Fall back to manual calculation.
    }

    const rect = el.getBoundingClientRect();
    const elTop = rect.top + window.scrollY;
    try {
      window.scrollTo({ top: elTop, behavior: shouldSmoothScroll ? "smooth" : "auto" });
    } catch (error) {
      window.scrollTo(0, elTop);
    }
    return;
  }

  try {
    if ("scrollBehavior" in document.documentElement.style) {
      el.scrollIntoView({ behavior: shouldSmoothScroll ? "smooth" : "auto", block: "center", inline: "nearest" });
      return;
    }
  } catch (error) {
    // Fall back to manual calculation.
  }

  const rect = el.getBoundingClientRect();
  const elTop = rect.top + window.scrollY;
  const targetScroll = Math.round(elTop - window.innerHeight / 2 + rect.height / 2);
  try {
    window.scrollTo({ top: targetScroll, behavior: shouldSmoothScroll ? "smooth" : "auto" });
  } catch (error) {
    window.scrollTo(0, targetScroll);
  }
}

function setupCenteredScroll() {
  document.addEventListener("click", (event) => {
    const anchor = event.target.closest && event.target.closest('a[href^="#"]');
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href || href.charAt(0) !== "#" || href === "#") return;

    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();

    const navWrapper = document.querySelector(".nav__links-wrapper");
    const toggle = document.querySelector(".nav__toggle");
    if (navWrapper && navWrapper.classList.contains("is-open")) {
      navWrapper.classList.remove("is-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    }

    centerScrollToElement(target, true);

    try {
      if (history.pushState) {
        history.pushState(null, "", `#${id}`);
      } else {
        location.hash = `#${id}`;
      }
    } catch (error) {
      // Ignore history update failures.
    }

    try {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      target.removeAttribute("tabindex");
    } catch (error) {
      // Ignore focus errors.
    }
  });

  if (location.hash) {
    const id = location.hash.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    setTimeout(() => {
      centerScrollToElement(target, false);
      try {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.removeAttribute("tabindex");
      } catch (error) {
        // Ignore focus errors.
      }
    }, 60);
  }
}
