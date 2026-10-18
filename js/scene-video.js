// Short, silent access scenes. No media URL is attached until playback is allowed.
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const connection = navigator.connection;
  const fallback = { play: "Play video", pause: "Pause video", replay: "Replay video" };

  function mayAutoplay() {
    return !reducedMotion.matches
      && !(typeof isReducedMotionRequested === "function" && isReducedMotionRequested())
      && !connection?.saveData;
  }

  document.querySelectorAll("[data-scene-video]").forEach((scene) => {
    const video = scene.querySelector("video[data-video-src]");
    const image = scene.querySelector("[data-scene-image]");
    const replayButton = scene.querySelector("[data-scene-replay]");
    const playButton = replayButton || scene.querySelector("[data-scene-play]");
    const pauseButton = scene.querySelector("[data-scene-pause]");
    if (!video || !image || !playButton || !pauseButton) return;
    let copy = fallback;
    try { copy = { ...fallback, ...JSON.parse(scene.querySelector("[data-scene-copy]")?.textContent || "{}") }; }
    catch { /* The image and usable controls remain available. */ }
    let inView = false;
    let finished = false;
    let pausedByVisitor = false;
    let userStarted = false;
    let generation = 0;
    scene.dataset.sceneState = "image";
    video.muted = video.defaultMuted = true;
    video.playsInline = true;
    video.loop = false;

    function labels() {
      const paused = video.paused;
      const playLabel = replayButton || finished ? copy.replay : copy.play;
      playButton.textContent = playLabel;
      playButton.setAttribute("aria-label", playLabel);
      pauseButton.textContent = paused ? copy.play : copy.pause;
      pauseButton.setAttribute("aria-label", paused ? copy.play : copy.pause);
      pauseButton.setAttribute("aria-pressed", String(paused));
      const visibleVideo = scene.dataset.sceneState === "video";
      playButton.hidden = !replayButton && visibleVideo && !finished;
      pauseButton.hidden = !visibleVideo || finished;
    }

    function imageState() {
      generation += 1;
      video.pause();
      scene.dataset.sceneState = "image";
      labels();
    }

    async function play({ manual = false, restart = false } = {}) {
      if (!manual && (!inView || !mayAutoplay() || finished || pausedByVisitor || document.hidden)) return;
      const current = ++generation;
      if (manual) { userStarted = true; pausedByVisitor = false; }
      await window.WifigateMedia?.prepare(video, image);
      if (current !== generation) return;
      // Preserve the eager image as the initial paint, including on a warm cache.
      try { await image.decode(); } catch { /* A failed image must not block explicit playback. */ }
      if (current !== generation || (!manual && (!inView || !mayAutoplay() || document.hidden))) return;
      if (!video.getAttribute("src")) video.setAttribute("src", video.dataset.videoSrc);
      if (restart) { finished = false; video.currentTime = 0; }
      try {
        await video.play();
        // Stop/policy handlers already pause. An obsolete completion must not
        // pause a newer explicit play request that superseded this one.
        if (current !== generation) return;
      } catch { if (current === generation) imageState(); }
      labels();
    }

    playButton.addEventListener("click", () => play({ manual: true, restart: Boolean(replayButton) || finished }));
    pauseButton.addEventListener("click", () => {
      if (video.paused) play({ manual: true });
      else { generation += 1; pausedByVisitor = true; video.pause(); labels(); }
    });
    video.addEventListener("playing", () => { scene.dataset.sceneState = "video"; labels(); });
    video.addEventListener("pause", labels);
    video.addEventListener("ended", () => { finished = true; labels(); });
    video.addEventListener("error", imageState);

    const observer = new IntersectionObserver((entries) => {
      inView = entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.25);
      if (!inView) { generation += 1; video.pause(); }
      else if (!userStarted) play();
      labels();
    }, { threshold: [0, 0.25] });
    observer.observe(scene);

    function policyChanged() {
      if (!mayAutoplay()) { userStarted = false; imageState(); }
      else if (!userStarted) play();
    }
    reducedMotion.addEventListener("change", policyChanged);
    connection?.addEventListener?.("change", policyChanged);
    document.addEventListener("site-accessibility-change", policyChanged);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { generation += 1; video.pause(); }
      else if (!userStarted) play();
    });
    labels();
  });
})();
