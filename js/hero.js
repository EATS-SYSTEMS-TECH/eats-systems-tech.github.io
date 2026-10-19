// The homepage hero keeps its eager poster until an actual video frame plays.
// Sources are attached only for in-view autoplay or explicit playback.
const HERO_MEDIA_FALLBACK_COPY = {
  replay: "Play Video Again", mute: "Mute video", unmute: "Unmute video",
  pause: "Pause video", play: "Play video",
};

function getHeroMediaCopy() {
  try {
    const media = JSON.parse(document.getElementById("hero-locale-data")?.textContent || "{}").media || {};
    return { ...HERO_MEDIA_FALLBACK_COPY, ...media };
  } catch { return HERO_MEDIA_FALLBACK_COPY; }
}

function heroVideoMayAutoplay() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) return false;
  const connection = navigator.connection || {};
  return !connection.saveData;
}

function setupHeroMedia() {
  const hero = document.querySelector(".hero");
  const video = document.getElementById("hero-video");
  const image = hero?.querySelector(".hero__bg--image");
  const muteButton = document.getElementById("hero-mute-toggle");
  const replayButton = document.getElementById("hero-replay");
  const replayLabel = replayButton?.querySelector("span");
  const pauseButton = document.getElementById("hero-pause-toggle");
  if (!hero || !video || !replayButton || !replayLabel) return;
  const silent = video.dataset.silent === "true";
  const desktop = window.matchMedia("(min-width: 769px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let inView = !("IntersectionObserver" in window);
  let pausedByVisitor = false;
  let finished = false;
  let generation = 0;
  video.muted = video.defaultMuted = true;
  video.playsInline = true;
  video.loop = false;

  function syncHeroFloatingWidgetState() {
    // Starting or ending an accepted scene must not move the accessibility
    // button while a visitor is pressing or dragging it.
    document.body.classList.toggle("hero-video-visible", !hero.hasAttribute("data-hero-scene") && inView && desktop.matches && hero.dataset.heroMediaState === "video");
  }
  function updateHeroMediaCopy() {
    const copy = getHeroMediaCopy();
    if (muteButton) {
      const label = video.muted ? copy.unmute : copy.mute;
      muteButton.dataset.muted = String(video.muted);
      muteButton.setAttribute("aria-label", label);
      muteButton.setAttribute("title", label);
      muteButton.setAttribute("aria-pressed", String(!video.muted));
    }
    if (pauseButton) {
      const label = video.paused ? copy.play : copy.pause;
      pauseButton.dataset.paused = String(video.paused);
      pauseButton.setAttribute("aria-label", label);
      pauseButton.setAttribute("title", label);
      pauseButton.setAttribute("aria-pressed", String(video.paused));
    }
    // The replay action doubles as the primary play/pause control. Keep its
    // label and icon in sync with the actual media state so the same control
    // behaves consistently on desktop and mobile.
    const isPlaying = !video.paused && !video.ended && hero.dataset.heroMediaState === "video";
    const label = isPlaying ? copy.pause : copy.replay;
    replayButton.dataset.playing = String(isPlaying);
    replayLabel.textContent = label;
    replayButton.setAttribute("aria-label", label);
    replayButton.setAttribute("title", label);
  }
  function setHeroMediaState(state) {
    hero.dataset.heroMediaState = state;
    if (muteButton) muteButton.hidden = silent || state !== "video";
    if (pauseButton) pauseButton.hidden = state !== "video";
    replayButton.hidden = false;
    syncHeroFloatingWidgetState();
    updateHeroMediaCopy();
  }
  function showHeroImageState() {
    generation += 1;
    video.pause();
    setHeroMediaState("image");
  }
  async function playHeroVideo({ restart = false, manual = false } = {}) {
    if (!manual && (!inView || !heroVideoMayAutoplay() || pausedByVisitor || finished || document.hidden)) return;
    const current = ++generation;
    if (manual) pausedByVisitor = false;
    await window.WifigateMedia?.prepare(video, image);
    if (current !== generation) return;
    try { await image?.decode(); } catch { /* Explicit video playback can recover a failed poster. */ }
    if (current !== generation || (!manual && (!inView || !heroVideoMayAutoplay() || document.hidden))) return;
    if (!video.getAttribute("src") && video.dataset.videoSrc) video.setAttribute("src", video.dataset.videoSrc);
    if (restart) { finished = false; video.currentTime = 0; }
    try {
      await video.play();
      // Stop/policy handlers own pausing; a stale completion cannot cancel a
      // newer visitor play/resume request.
      if (current !== generation) return;
    } catch { if (current === generation) showHeroImageState(); }
    updateHeroMediaCopy();
  }
  muteButton?.addEventListener("click", () => { video.muted = !video.muted; updateHeroMediaCopy(); });
  replayButton.addEventListener("click", () => {
    if (!video.paused && !video.ended) {
      generation += 1;
      pausedByVisitor = true;
      video.pause();
      updateHeroMediaCopy();
      return;
    }
    // Resume a visitor-paused video; restart only after the video finished.
    playHeroVideo({ restart: finished || video.ended, manual: true });
  });
  pauseButton?.addEventListener("click", () => {
    if (video.paused) playHeroVideo({ manual: true });
    else { generation += 1; pausedByVisitor = true; video.pause(); }
    updateHeroMediaCopy();
  });
  video.addEventListener("playing", () => setHeroMediaState("video"));
  video.addEventListener("ended", () => { finished = true; showHeroImageState(); });
  video.addEventListener("pause", updateHeroMediaCopy);
  video.addEventListener("volumechange", updateHeroMediaCopy);
  video.addEventListener("error", showHeroImageState);
  function policyChanged() {
    if (!heroVideoMayAutoplay()) showHeroImageState();
    else playHeroVideo();
    syncHeroFloatingWidgetState();
  }
  desktop.addEventListener("change", policyChanged);
  reducedMotion.addEventListener("change", policyChanged);
  navigator.connection?.addEventListener?.("change", policyChanged);
  document.addEventListener("site-accessibility-change", policyChanged);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { generation += 1; video.pause(); }
    else playHeroVideo();
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= .25);
      if (!inView) { generation += 1; video.pause(); }
      else playHeroVideo();
      syncHeroFloatingWidgetState();
    }, { threshold: [0, .25] });
    observer.observe(hero);
  }
  setHeroMediaState("image");
  if (inView) playHeroVideo();
}
