// /js/hero.js
// Version: 1.3.0

let heroRotatorIntervalId = null;

const HERO_MEDIA_FALLBACK_COPY = {
  replay: "Play Video Again",
  mute: "Mute video",
  unmute: "Unmute video",
};

function getHeroMediaCopy() {
  const bundle = typeof getTranslationBundle === "function" ? getTranslationBundle() : null;

  return {
    ...HERO_MEDIA_FALLBACK_COPY,
    ...(bundle?.hero?.media || {}),
  };
}

function setupHeroMedia() {
  const hero = document.querySelector(".hero");
  const video = document.getElementById("hero-video");
  const backdropVideo = document.getElementById("hero-video-backdrop");
  const muteButton = document.getElementById("hero-mute-toggle");
  const replayButton = document.getElementById("hero-replay");
  const replayLabel = replayButton?.querySelector("span");
  let heroIsInView = true;

  if (!hero || !video || !muteButton || !replayButton || !replayLabel) return;

  video.muted = true;
  video.defaultMuted = true;
  if (backdropVideo) {
    backdropVideo.muted = true;
    backdropVideo.defaultMuted = true;
  }

  function syncBackdropTime(force = false) {
    if (!backdropVideo) return;

    try {
      const drift = Math.abs((backdropVideo.currentTime || 0) - (video.currentTime || 0));
      if (force || drift > 0.2) {
        backdropVideo.currentTime = video.currentTime || 0;
      }
    } catch (error) {
      // Ignore seek failures while media metadata is loading.
    }
  }

  function playBackdropVideo() {
    if (!backdropVideo) return;

    backdropVideo.muted = video.muted;
    syncBackdropTime(true);

    const backdropPlayPromise = backdropVideo.play();
    if (backdropPlayPromise && typeof backdropPlayPromise.catch === "function") {
      backdropPlayPromise.catch(() => {
        // Ignore backdrop autoplay failures and keep the foreground video playing.
      });
    }
  }

  function pauseBackdropVideo() {
    if (!backdropVideo) return;
    backdropVideo.pause();
  }

  function syncHeroFloatingWidgetState() {
    const shouldMoveAccessibilityFab =
      heroIsInView &&
      hero.dataset.heroMediaState === "video" &&
      window.matchMedia &&
      window.matchMedia("(min-width: 769px)").matches;

    document.body.classList.toggle("hero-video-visible", shouldMoveAccessibilityFab);
  }

  function updateHeroMediaCopy() {
    const copy = getHeroMediaCopy();
    const muteLabel = video.muted ? copy.unmute : copy.mute;

    muteButton.dataset.muted = String(video.muted);
    muteButton.setAttribute("aria-label", muteLabel);
    muteButton.setAttribute("title", muteLabel);
    muteButton.setAttribute("aria-pressed", String(!video.muted));

    replayLabel.textContent = copy.replay;
    replayButton.setAttribute("aria-label", copy.replay);
    replayButton.setAttribute("title", copy.replay);
  }

  function setHeroMediaState(state) {
    hero.dataset.heroMediaState = state;
    muteButton.hidden = state !== "video";
    replayButton.hidden = state !== "image";
    syncHeroFloatingWidgetState();
  }

  function showHeroImageState() {
    video.pause();
    pauseBackdropVideo();
    setHeroMediaState("image");
    updateHeroMediaCopy();
  }

  function playHeroVideo({ restart = false, userInitiated = false } = {}) {
    if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested() && !userInitiated) {
      showHeroImageState();
      return;
    }

    setHeroMediaState("video");

    if (restart) {
      try {
        video.currentTime = 0;
      } catch (error) {
        // Ignore seek failures while metadata is still loading.
      }

      syncBackdropTime(true);
    }

    updateHeroMediaCopy();

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        showHeroImageState();
      });
    }

    playBackdropVideo();
  }

  muteButton.addEventListener("click", () => {
    video.muted = !video.muted;
    if (backdropVideo) {
      backdropVideo.muted = video.muted;
    }
    updateHeroMediaCopy();
  });

  replayButton.addEventListener("click", () => {
    playHeroVideo({ restart: true, userInitiated: true });
  });

  video.addEventListener("ended", showHeroImageState);
  video.addEventListener("play", () => {
    playBackdropVideo();
    setHeroMediaState("video");
    updateHeroMediaCopy();
  });
  video.addEventListener("pause", pauseBackdropVideo);
  video.addEventListener("seeked", () => syncBackdropTime(true));
  video.addEventListener("timeupdate", () => syncBackdropTime(false));
  video.addEventListener("volumechange", updateHeroMediaCopy);
  video.addEventListener("error", showHeroImageState);

  document.addEventListener("site-language-change", updateHeroMediaCopy);
  document.addEventListener("site-accessibility-change", () => {
    if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) {
      showHeroImageState();
      return;
    }

    if (hero.dataset.heroMediaState === "video") {
      playHeroVideo();
      return;
    }

    updateHeroMediaCopy();
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        heroIsInView = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35);
        syncHeroFloatingWidgetState();
      },
      { threshold: [0, 0.35, 0.6] }
    );

    observer.observe(hero);
  }

  window.addEventListener("resize", syncHeroFloatingWidgetState);

  updateHeroMediaCopy();
  playHeroVideo();
}

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
    const animMs =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--rotator-duration")) || 420;

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

    let fallbackTimer = null;
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
    fallbackTimer = setTimeout(() => onTransitionEnd({ propertyName: "opacity" }), animMs + 80);
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

  const observer = new IntersectionObserver(() => syncVideoPlayback(), { threshold: 0.5 });

  observer.observe(video);
  document.addEventListener("site-accessibility-change", syncVideoPlayback);
}
