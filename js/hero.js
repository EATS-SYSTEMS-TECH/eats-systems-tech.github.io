// Keep localized control wording independent of media lifecycle state.
function readHeroControlText() {
  const defaults = {
    play: "Play video", pause: "Pause video", replay: "Play Video Again",
    unmute: "Unmute video", mute: "Mute video",
  };
  try {
    const node = document.getElementById("hero-locale-data");
    const localized = JSON.parse(node?.textContent || "{}");
    return Object.assign({}, defaults, localized.media || {});
  } catch {
    return defaults;
  }
}

// Connection speed is deliberately irrelevant; only explicit user preferences block autoplay.
function allowsAutomaticHeroPlayback() {
  const browserMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  const siteMotion = typeof isReducedMotionRequested === "function" && isReducedMotionRequested();
  return !browserMotion?.matches && !siteMotion && !navigator.connection?.saveData;
}

class HeroMediaController {
  constructor(elements) {
    Object.assign(this, elements);
    this.desktopQuery = window.matchMedia("(min-width: 769px)");
    this.motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.silent = this.video.dataset.silent === "true";
    // One epoch invalidates pending asynchronous playback without cancelling newer requests.
    this.lifecycle = {
      epoch: 0, visible: !("IntersectionObserver" in window),
      visitorPaused: false, completed: false,
    };
  }

  // The floating accessibility widget consumes this existing class; its own code owns positioning.
  refreshFloatingWidget() {
    const eligible = !this.hero.hasAttribute("data-hero-scene")
      && this.lifecycle.visible && this.desktopQuery.matches
      && this.hero.dataset.heroMediaState === "video";
    document.body.classList.toggle("hero-video-visible", eligible);
  }

  // Read the actual element properties so native media events and user actions share one presentation.
  refreshControls() {
    const words = readHeroControlText();
    const updateToggle = (button, stateName, stateValue, text) => {
      if (!button) return;
      button.dataset[stateName] = String(stateValue);
      button.title = text;
      button.setAttribute("aria-label", text);
      button.setAttribute("aria-pressed", String(stateValue));
    };
    updateToggle(this.mute, "muted", this.video.muted, this.video.muted ? words.unmute : words.mute);
    // Muted describes the data state, while pressed describes the enabled sound action.
    this.mute?.setAttribute("aria-pressed", String(!this.video.muted));
    updateToggle(this.pause, "paused", this.video.paused, this.video.paused ? words.play : words.pause);
    const playing = !this.video.paused && !this.video.ended
      && this.hero.dataset.heroMediaState === "video";
    const caption = playing ? words.pause : words.replay;
    this.primary.dataset.playing = String(playing);
    this.label.textContent = caption;
    this.primary.title = caption;
    this.primary.setAttribute("aria-label", caption);
  }

  // Poster and playback share unchanged markup, geometry and the permanently available primary action.
  present(mode) {
    this.hero.dataset.heroMediaState = mode;
    if (this.mute) this.mute.hidden = this.silent || mode !== "video";
    if (this.pause) this.pause.hidden = mode !== "video";
    this.primary.hidden = false;
    this.refreshFloatingWidget();
    this.refreshControls();
  }

  // Pausing invalidates pending work but retains the current poster/video presentation.
  stop({ visitor = false, poster = false } = {}) {
    this.lifecycle.epoch += 1;
    if (visitor) this.lifecycle.visitorPaused = true;
    this.video.pause();
    if (poster) this.present("image");
  }

  // Automatic requests require all lifecycle conditions, while an explicit play bypasses preferences.
  canAutoplay() {
    const state = this.lifecycle;
    return state.visible && !document.hidden && !state.visitorPaused
      && !state.completed && allowsAutomaticHeroPlayback();
  }

  async requestPlayback(manual = false, restart = false) {
    if (!manual && !this.canAutoplay()) return;
    const requestEpoch = ++this.lifecycle.epoch;
    if (manual) this.lifecycle.visitorPaused = false;
    const current = () => requestEpoch === this.lifecycle.epoch;
    // Lazy preparation must finish before source attachment; failed poster decode remains recoverable.
    await window.WifigateMedia?.prepare(this.video, this.poster);
    if (!current()) return;
    try { await this.poster?.decode(); } catch { /* Playback may recover a missing poster. */ }
    if (!current() || (!manual && !this.canAutoplay())) return;
    if (!this.video.getAttribute("src") && this.video.dataset.videoSrc) {
      this.video.setAttribute("src", this.video.dataset.videoSrc);
    }
    if (restart) {
      this.lifecycle.completed = false;
      this.video.currentTime = 0;
    }
    // A late failure or fulfillment belongs only to its own epoch and cannot stop a newer resume.
    try {
      await this.video.play();
      if (!current()) return;
    } catch {
      if (current()) this.stop({ poster: true });
    }
    this.refreshControls();
  }

  // Both play controls preserve a visitor-paused position; only the primary action restarts an ended clip.
  togglePlayback(primary) {
    const active = primary ? !this.video.paused && !this.video.ended : !this.video.paused;
    if (active) this.stop({ visitor: true });
    else this.requestPlayback(true, primary && (this.lifecycle.completed || this.video.ended));
    this.refreshControls();
  }

  mount() {
    // Establish native playback defaults without loading the lazy source.
    Object.assign(this.video, { muted: true, defaultMuted: true, playsInline: true, loop: false });
    this.mute?.addEventListener("click", () => {
      this.video.muted = !this.video.muted;
      this.refreshControls();
    });
    this.primary.addEventListener("click", () => this.togglePlayback(true));
    this.pause?.addEventListener("click", () => this.togglePlayback(false));

    // Only actual media events switch presentation or record completion.
    this.video.addEventListener("playing", () => this.present("video"));
    this.video.addEventListener("ended", () => {
      this.lifecycle.completed = true;
      this.stop({ poster: true });
    });
    this.video.addEventListener("error", () => this.stop({ poster: true }));
    for (const event of ["pause", "volumechange"]) {
      this.video.addEventListener(event, () => this.refreshControls());
    }

    // Preference changes can return to the poster; visibility changes pause without changing the scene.
    const reconsider = () => {
      if (allowsAutomaticHeroPlayback()) this.requestPlayback();
      else this.stop({ poster: true });
      this.refreshFloatingWidget();
    };
    this.desktopQuery.addEventListener("change", reconsider);
    this.motionQuery.addEventListener("change", reconsider);
    navigator.connection?.addEventListener?.("change", reconsider);
    document.addEventListener("site-accessibility-change", reconsider);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
      else this.requestPlayback();
    });

    // A quarter of the hero must be visible for automatic playback and floating-widget eligibility.
    if ("IntersectionObserver" in window) {
      this.observer = new IntersectionObserver(entries => {
        this.lifecycle.visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.25);
        if (this.lifecycle.visible) this.requestPlayback();
        else this.stop();
        this.refreshFloatingWidget();
      }, { threshold: [0, 0.25] });
      this.observer.observe(this.hero);
    }
    this.present("image");
    if (this.lifecycle.visible) this.requestPlayback();
  }
}

// Preserve the main-script entry point and allow pages without the complete hero surface to do nothing.
function setupHeroMedia() {
  const hero = document.querySelector(".hero");
  const elements = {
    hero, video: document.getElementById("hero-video"),
    poster: hero?.querySelector(".hero__bg--image"),
    mute: document.getElementById("hero-mute-toggle"),
    pause: document.getElementById("hero-pause-toggle"),
    primary: document.getElementById("hero-replay"),
  };
  elements.label = elements.primary?.querySelector("span");
  if ([elements.hero, elements.video, elements.primary, elements.label].some(element => !element)) return;
  new HeroMediaController(elements).mount();
}
