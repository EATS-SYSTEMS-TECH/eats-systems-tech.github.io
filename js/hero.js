// /js/hero.js
// Version: 1.2.0

function setupHeroRotator() {
  const el = document.getElementById("hero-rotator");
  if (!el) return;

  let idx = 0;

  updateHeroRotatorPhrase();

  const interval = 3000;
  const fadeClass = "is-fading";

  function swapNext() {
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

  setInterval(swapNext, interval);
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play().catch((error) => console.log("Video autoplay failed:", error));
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.5 }
  );

  observer.observe(video);
}
