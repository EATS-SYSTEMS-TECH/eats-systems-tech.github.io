// /js/navigation.js
// Version: 1.4.0

function setupNav() {
  // Published content pages predate localized login links. Keep their header
  // destination in the page language while they are regenerated over time.
  const locale = location.pathname.match(/^\/((?:[a-z]{2}|fil)(?:-[A-Za-z]{2,4})?)\//)?.[1];
  const loginPath = locale && locale !== "en" ? `/${locale}/login/` : "/login/";
  $$(".site-login__trigger[href]").forEach((link) => {
    const url = new URL(link.href, location.href);
    if (url.origin === location.origin && /\/(?:login)\/$/.test(url.pathname)) {
      url.pathname = loginPath;
      link.href = url.href;
    }
  });
  const toggle = $(".nav__toggle");
  const navWrapper = $(".nav__links-wrapper");
  if (!toggle || !navWrapper) return;

  const closeMenu = () => {
    navWrapper.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    navWrapper.querySelectorAll(".nav__group.is-expanded").forEach((group) => {
      group.classList.remove("is-expanded");
      group.querySelector(".nav__group-toggle")?.setAttribute("aria-expanded", "false");
    });
  };

  toggle.addEventListener("click", () => {
    const isOpen = navWrapper.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("pointerdown", (event) => {
    if (
      navWrapper.classList.contains("is-open") &&
      !navWrapper.contains(event.target) &&
      !toggle.contains(event.target)
    ) closeMenu();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navWrapper.classList.contains("is-open")) {
      closeMenu();
      toggle.focus();
    }
  });

  $$(".nav__link, .nav__sublink", navWrapper).forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  $$(".nav__group", navWrapper).forEach(setupNavGroup);
}

// The "Use Cases" and "For Business" panels in the full header
// (css/site-header.css). A mouse opens a panel on hover and it stays for a
// moment after the pointer leaves, so a diagonal move into the panel does not
// close it; entering the other group closes it at once. Touch taps keep the
// link's normal navigation; the collapsed menu lists the links.
function setupNavGroup(group) {
  const link = group.querySelector(".nav__group-link");
  const disclosure = group.querySelector(".nav__group-toggle");
  disclosure?.addEventListener("click", () => {
    const opening = !group.classList.contains("is-expanded");
    group.parentElement.querySelectorAll(".nav__group.is-expanded").forEach((other) => {
      other.classList.remove("is-expanded");
      other.querySelector(".nav__group-toggle")?.setAttribute("aria-expanded", "false");
    });
    group.classList.toggle("is-expanded", opening);
    disclosure.setAttribute("aria-expanded", String(opening));
  });
  let closeTimer = 0;
  const cancelClose = () => { clearTimeout(closeTimer); closeTimer = 0; };
  const close = () => { cancelClose(); group.classList.remove("is-open"); };

  group.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    cancelClose();
    group.parentNode.querySelectorAll(".nav__group.is-open").forEach((other) => { if (other !== group) other.classList.remove("is-open"); });
    if (!group.classList.contains("is-dismissed")) group.classList.add("is-open");
  });
  group.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    group.classList.remove("is-dismissed");
    cancelClose();
    closeTimer = setTimeout(close, 250);
  });
  group.addEventListener("focusin", (event) => {
    if (event.target !== link) group.classList.remove("is-dismissed");
  });
  group.addEventListener("focusout", (event) => {
    if (!group.contains(event.relatedTarget)) group.classList.remove("is-dismissed");
  });
  // Escape closes a panel opened by focus or by hover alike.
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || group.classList.contains("is-dismissed")) return;
    if (!window.matchMedia("(min-width: 1440px)").matches) return;
    const focused = group.contains(document.activeElement);
    if (!focused && !group.classList.contains("is-open") && !group.matches(":hover")) return;
    close();
    group.classList.add("is-dismissed");
    if (focused && link && document.activeElement !== link) link.focus();
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
        const id = entry.target.dataset.navTarget || entry.target.getAttribute("id");
        if (!id) return;

        navLinks.forEach((link) => {
          const url = new URL(link.href, location.href);
          if (url.pathname === location.pathname && url.hash === `#${id}`) {
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

// Header destinations open with their section label (eyebrow) right below the
// sticky bar, on desktop and mobile alike. #wifigate-automation is the former
// For Business anchor, kept for shared links.
const SECTION_ANCHORS = new Set(["advantages", "how-it-works", "use-cases", "wifigate-for-business", "wifigate-automation", "tutorial-videos", "get-in-touch"]);
const SECTION_LABEL_GAP = 12;

function sectionScrollTop(el) {
  const section = el.id === "wifigate-automation" ? el.parentElement : el;
  const label = section.querySelector("[class*='eyebrow'], h2") || section;
  const bar = document.querySelector(".nav");
  const barBottom = bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0;
  return Math.max(0, Math.round(layoutTop(label) - barBottom - SECTION_LABEL_GAP));
}

// Document position from layout, so a reveal animation's pending transform
// (js-reveal starts slightly lower) does not shift the destination.
function layoutTop(el) {
  let top = 0;
  for (let node = el; node; node = node.offsetParent) top += node.offsetTop;
  return top;
}

function scrollToSectionStart(el, smooth) {
  const top = sectionScrollTop(el);
  window.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });

  // Lazy media above the section can still change height while scrolling;
  // settle once on the final position.
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    const corrected = sectionScrollTop(el);
    if (Math.abs(corrected - window.scrollY) > 2) window.scrollTo({ top: corrected, behavior: "auto" });
  };
  if (smooth && "onscrollend" in window) window.addEventListener("scrollend", settle, { once: true });
  setTimeout(settle, smooth ? 1500 : 250);
}

function centerScrollToElement(el, smooth = true) {
  if (!el) return;

  const shouldSmoothScroll = smooth && !(typeof isReducedMotionRequested === "function" && isReducedMotionRequested());

  if (SECTION_ANCHORS.has(el.id)) {
    scrollToSectionStart(el, shouldSmoothScroll);
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
    const anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor) return;

    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search || !url.hash) return;
    const href = url.hash;

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
