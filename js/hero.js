// The homepage hero keeps its eager poster until an actual video frame plays.
// Sources are attached only for in-view autoplay or explicit playback.
const HERO_MEDIA_FALLBACK_COPY = {
  replay: "Play Video Again", mute: "Mute video", unmute: "Unmute video",
  pause: "Pause video", play: "Play video",
};

// Invalid locale payloads retain the established fallback action labels.
function getHeroMediaCopy() {
  try {
    const media = JSON.parse(document.getElementById("hero-locale-data")?.textContent || "{}").media || {};
    return { ...HERO_MEDIA_FALLBACK_COPY, ...media };
  } catch { return HERO_MEDIA_FALLBACK_COPY; }
}

// Automatic playback honors both motion preferences and data-saving policy.
function heroVideoMayAutoplay() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return false;
  if (typeof isReducedMotionRequested === "function" && isReducedMotionRequested()) return false;
  const connection = navigator.connection || {};
  return !connection.saveData;
}

// The view owns labels, glyph datasets and control visibility only. Playback,
// cancellation and visitor intent stay in the controller below.
function createHeroMediaView(nodes) {
  const { hero, video, muteButton, pauseButton, replayButton, replayLabel, silent } = nodes;

  // Tooltips and assistive names describe the same current action.
  function name(control, text) {
    control.setAttribute("aria-label", text);
    control.setAttribute("title", text);
  }

  // Optional compact controls expose their media flag and pressed state in the
  // original mute-then-pause order. The replay action has its own playing flag.
  function compact(control, flag, enabled, text, pressed) {
    if (!control) return;
    control.dataset[flag] = String(enabled);
    name(control, text);
    control.setAttribute("aria-pressed", String(pressed));
  }

  function refresh() {
    const copy = getHeroMediaCopy();
    compact(muteButton, "muted", video.muted,
      video.muted ? copy.unmute : copy.mute, !video.muted);
    compact(pauseButton, "paused", video.paused,
      video.paused ? copy.play : copy.pause, video.paused);
    const playing = !video.paused && !video.ended && hero.dataset.heroMediaState === "video";
    const text = playing ? copy.pause : copy.replay;
    replayButton.dataset.playing = String(playing);
    replayLabel.textContent = text;
    name(replayButton, text);
  }

  // Replay remains available on the poster and during playback; silent clips
  // never expose mute. Native paused/ended state still controls their labels.
  function setVisibility(mode) {
    if (muteButton) muteButton.hidden = silent || mode !== "video";
    if (pauseButton) pauseButton.hidden = mode !== "video";
    replayButton.hidden = false;
  }
  return { refresh, setVisibility };
}

// Bind one hero instance to its existing public IDs and media policy events.
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
  // Keep automatic eligibility, explicit visitor intent and asynchronous
  // cancellation together; a later request must supersede pending preparation.
  const session = { inView: !("IntersectionObserver" in window),
    pausedByVisitor: false, finished: false, generation: 0 };
  video.muted = video.defaultMuted = true;
  video.playsInline = true;
  video.loop = false;

  function syncHeroFloatingWidgetState() {
    // Starting or ending an accepted scene must not move the accessibility
    // button while a visitor is pressing or dragging it.
    document.body.classList.toggle("hero-video-visible", !hero.hasAttribute("data-hero-scene") && session.inView && desktop.matches && hero.dataset.heroMediaState === "video");
  }
  // State publication keeps the original ordering: DOM visibility first,
  // floating-widget placement second, localized control labels last.
  const view = createHeroMediaView({ hero, video, muteButton, pauseButton,
    replayButton, replayLabel, silent });
  const updateHeroMediaCopy = view.refresh;
  function setHeroMediaState(mode) {
    hero.dataset.heroMediaState = mode;
    view.setVisibility(mode);
    syncHeroFloatingWidgetState();
    updateHeroMediaCopy();
  }
  // Invalidate pending playback before pausing. Only an explicit visitor pause
  // persists across automatic visibility and policy changes.
  function stopHeroPlayback(visitor = false) {
    session.generation += 1;
    if (visitor) session.pausedByVisitor = true;
    video.pause();
  }
  // Media failures and completion restore the poster after cancelling playback.
  function showHeroImageState() {
    stopHeroPlayback();
    setHeroMediaState("image");
  }
  // Preparation and poster decoding may outlive a pause or newer request.
  // Check the generation at both boundaries and leave manual playback eligible.
  async function playHeroVideo({ restart = false, manual = false } = {}) {
    if (!manual && (!session.inView || !heroVideoMayAutoplay() || session.pausedByVisitor || session.finished || document.hidden)) return;
    const current = ++session.generation;
    if (manual) session.pausedByVisitor = false;
    await window.WifigateMedia?.prepare(video, image);
    if (current !== session.generation) return;
    try { await image?.decode(); } catch { /* Explicit video playback can recover a failed poster. */ }
    if (current !== session.generation || (!manual && (!session.inView || !heroVideoMayAutoplay() || document.hidden))) return;
    if (!video.getAttribute("src") && video.dataset.videoSrc) video.setAttribute("src", video.dataset.videoSrc);
    if (restart) { session.finished = false; video.currentTime = 0; }
    try {
      await video.play();
      // Stop/policy handlers own pausing; a stale completion cannot cancel a
      // newer visitor play/resume request.
      if (current !== session.generation) return;
    } catch { if (current === session.generation) showHeroImageState(); }
    updateHeroMediaCopy();
  }
  // Visitor actions preserve resume-in-place and restart-after-completion.
  muteButton?.addEventListener("click", () => { video.muted = !video.muted; updateHeroMediaCopy(); });
  replayButton.addEventListener("click", () => {
    if (!video.paused && !video.ended) {
      // Keep the visitor's pause distinct from temporary offscreen pauses.
      stopHeroPlayback(true);
      updateHeroMediaCopy();
      return;
    }
    // Resume a visitor-paused video; restart only after the video finished.
    playHeroVideo({ restart: session.finished || video.ended, manual: true });
  });
  pauseButton?.addEventListener("click", () => {
    // The dedicated control resumes in place or records an explicit pause.
    if (video.paused) playHeroVideo({ manual: true });
    else stopHeroPlayback(true);
    updateHeroMediaCopy();
  });
  // Register native media events in their original order. Completion is marked
  // before restoring the poster, so viewport re-entry cannot loop the clip.
  for (const [event, handler] of [
    ["playing", () => setHeroMediaState("video")],
    ["ended", () => { session.finished = true; showHeroImageState(); }],
    ["pause", updateHeroMediaCopy],
    ["volumechange", updateHeroMediaCopy],
    ["error", showHeroImageState],
  ]) video.addEventListener(event, handler);
  // Policy changes restore the poster or attempt eligible automatic playback;
  // document visibility and viewport exits cancel without recording a visitor pause.
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
    // Hidden documents cancel pending work without becoming visitor-paused.
    if (document.hidden) stopHeroPlayback();
    else playHeroVideo();
  });
  // The original quarter-visible threshold owns automatic viewport eligibility.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      // Pause outside the original threshold and resume under autoplay policy.
      session.inView = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= .25);
      if (!session.inView) stopHeroPlayback();
      else playHeroVideo();
      syncHeroFloatingWidgetState();
    }, { threshold: [0, .25] });
    observer.observe(hero);
  }
  // Initialize the eager poster before attempting any eligible video download.
  setHeroMediaState("image");
  if (session.inView) playHeroVideo();
}
