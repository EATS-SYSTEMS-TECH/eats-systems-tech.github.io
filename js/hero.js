// /js/hero.js
// The homepage hero video. It plays only where it costs the visitor little:
// not with reduced motion, Save-Data, a slow connection or a phone-sized
// screen. Everyone else sees the poster image and can start the video.

// The labels of the video controls (pause/play, mute, replay) in the page
// language; the build writes them into #hero-locale-data.
const HERO_MEDIA_FALLBACK_COPY = {
  replay: "Play Video Again",
  mute: "Mute video",
  unmute: "Unmute video",
  pause: "Pause video",
  play: "Play video",
};

function getHeroMediaCopy() {
  try {
    const media = JSON.parse(document.getElementById("hero-locale-data")?.textContent || "{}").media || {};
    return { ...HERO_MEDIA_FALLBACK_COPY, ...media };
  } catch (error) {
    return HERO_MEDIA_FALLBACK_COPY;
  }
}

// Autoplay downloads the whole video; only a desktop-sized screen on a
// connection that does not ask to save data gets it without a click.
function heroVideoMayAutoplay() {
  if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) return false;
  const connection = navigator.connection || {};
  if (connection.saveData) return false;
  if (/(^|-)2g$|^3g$/.test(connection.effectiveType || "")) return false;
  return !window.matchMedia || window.matchMedia("(min-width: 769px)").matches;
}

function setupHeroMedia() {
  const hero = document.querySelector(".hero");
  const video = document.getElementById("hero-video");
  const muteButton = document.getElementById("hero-mute-toggle");
  const replayButton = document.getElementById("hero-replay");
  const replayLabel = replayButton?.querySelector("span");
  const pauseButton = document.getElementById("hero-pause-toggle");
  let heroIsInView = true;
  // Set when the visitor pauses: nothing restarts the video until they press play.
  let pausedByVisitor = false;

  if (!hero || !video || !muteButton || !replayButton || !replayLabel) return;

  video.muted = true;
  video.defaultMuted = true;

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

    if (pauseButton) {
      const paused = video.paused;
      const pauseLabel = paused ? copy.play : copy.pause;
      pauseButton.dataset.paused = String(paused);
      pauseButton.setAttribute("aria-label", pauseLabel);
      pauseButton.setAttribute("title", pauseLabel);
      pauseButton.setAttribute("aria-pressed", String(paused));
    }

    replayLabel.textContent = copy.replay;
    replayButton.setAttribute("aria-label", copy.replay);
    replayButton.setAttribute("title", copy.replay);
  }

  function setHeroMediaState(state) {
    hero.dataset.heroMediaState = state;
    muteButton.hidden = state !== "video";
    if (pauseButton) pauseButton.hidden = state !== "video";
    replayButton.hidden = state !== "image";
    syncHeroFloatingWidgetState();
  }

  function showHeroImageState() {
    video.pause();
    setHeroMediaState("image");
    updateHeroMediaCopy();
  }

  function playHeroVideo({ restart = false, userInitiated = false } = {}) {
    if (!userInitiated && !heroVideoMayAutoplay()) {
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
    }

    updateHeroMediaCopy();

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        showHeroImageState();
      });
    }
  }

  muteButton.addEventListener("click", () => {
    video.muted = !video.muted;
    updateHeroMediaCopy();
  });

  replayButton.addEventListener("click", () => {
    pausedByVisitor = false;
    playHeroVideo({ restart: true, userInitiated: true });
  });

  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      if (video.paused) {
        pausedByVisitor = false;
        playHeroVideo({ userInitiated: true });
      } else {
        pausedByVisitor = true;
        video.pause();
      }
      updateHeroMediaCopy();
    });
  }

  video.addEventListener("ended", showHeroImageState);
  video.addEventListener("play", () => {
    setHeroMediaState("video");
    updateHeroMediaCopy();
  });
  video.addEventListener("pause", updateHeroMediaCopy);
  video.addEventListener("volumechange", updateHeroMediaCopy);
  video.addEventListener("error", showHeroImageState);

  document.addEventListener("site-accessibility-change", () => {
    if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) {
      showHeroImageState();
      return;
    }

    if (hero.dataset.heroMediaState === "video" && !pausedByVisitor) {
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
