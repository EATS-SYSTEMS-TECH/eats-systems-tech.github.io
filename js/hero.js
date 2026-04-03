// /js/hero.js
// Version: 1.2.0

let heroRotatorIntervalId = null;

function setupHeroRotator() {
  const el = document.getElementById("hero-rotator");
  if (!el) return;

  let idx = 0;
  const interval = 3000;
  const fadeClass = "is-fading";

  function clearRotatorInterval() {
    if (!heroRotatorIntervalId) return;

    clearInterval(heroRotatorIntervalId);
    heroRotatorIntervalId = null;
  }

  function startRotatorInterval() {
    clearRotatorInterval();

    if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) {
      el.classList.remove(fadeClass);
      if (el.getAnimations) {
        el.getAnimations().forEach((animation) => animation.cancel());
      }
      return;
    }

    heroRotatorIntervalId = setInterval(swapNext, interval);
  }

  function swapNext() {
    if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) {
      clearRotatorInterval();
      el.classList.remove(fadeClass);
      return;
    }

    const phrases = getTranslationBundle().hero.rotator.phrases;
    const nextIdx = (idx + 1) % phrases.length;
    const animMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--rotator-duration")) || 420;

    if (el.animate) {
      const out = el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: animMs, easing: "ease", fill: "forwards" });
      out.onfinish = () => {
        el.textContent = phrases[nextIdx];
        const fadeIn = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: animMs, easing: "ease", fill: "forwards" });
        fadeIn.onfinish = () => {
          idx = nextIdx;
        };
      };
      return;
    }

    const onTransitionEnd = (event) => {
      if (event && event.propertyName && event.propertyName !== "opacity") return;
      el.removeEventListener("transitionend", onTransitionEnd);
      el.textContent = phrases[nextIdx];
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove(fadeClass)));
      idx = nextIdx;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };

    el.addEventListener("transitionend", onTransitionEnd);
    el.classList.add(fadeClass);
    const fallbackTimer = setTimeout(() => onTransitionEnd({ propertyName: "opacity" }), animMs + 80);
  }

  function syncRotator() {
    idx = 0;
    updateHeroRotatorPhrase();
    startRotatorInterval();
  }

  updateHeroRotatorPhrase();
  startRotatorInterval();

  document.addEventListener("site-language-change", syncRotator);
  document.addEventListener("site-accessibility-change", syncRotator);
}

function updateHeroRotatorPhrase() {
  const el = document.getElementById("hero-rotator");
  if (!el) return;

  const phrases = getTranslationBundle().hero.rotator.phrases;
  el.textContent = phrases[0];
}

function setupVideoAutoplay() {
  const video = document.getElementById("action-video");
  if (!video) return;

  function syncVideoPlayback() {
    if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) {
      video.pause();
      return;
    }

    const rect = video.getBoundingClientRect();
    const visibleHeight = Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top);
    const visibleRatio = rect.height > 0 ? visibleHeight / rect.height : 0;

    if (visibleRatio >= 0.5) {
      video.play().catch((error) => console.log("Video autoplay failed:", error));
    } else {
      video.pause();
    }
  }

  const observer = new IntersectionObserver(
    () => syncVideoPlayback(),
    { threshold: 0.5 }
  );

  observer.observe(video);
  document.addEventListener("site-accessibility-change", syncVideoPlayback);
}
