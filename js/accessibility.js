// The shared preference model applies before page readiness. Dialog and launcher
// controllers mount independently of the rest of the product UI.
const siteAccessibility = (() => {
  const settingsKey = "wifigate-accessibility-settings-v2";
  const positionKey = "wifigate-a11y-fab-position-v2";
  const scales = [1, 1.15, 1.3, 1.5];
  const classes = {
    highContrast: "a11y-high-contrast", grayscale: "a11y-grayscale",
    underlineLinks: "a11y-underlined-links", readableFont: "a11y-readable-font",
    textSpacing: "a11y-text-spacing", highlightHeadings: "a11y-highlight-headings",
    bigCursor: "a11y-big-cursor", focusHighlight: "a11y-focus-highlight",
    reducedMotion: "a11y-reduced-motion",
  };
  const keys = Object.keys(classes);
  const defaults = () => Object.fromEntries([["textScale", 0], ...keys.map(key => [key, false])]);
  const safely = operation => { try { return operation(); } catch { return undefined; } };
  const language = () => {
    const bundles = window.accessibilityCopy || {};
    const requested = document.documentElement.getAttribute("lang") || "en";
    return bundles[requested] ? requested : bundles.en ? "en" : Object.keys(bundles)[0];
  };
  const copy = () => (window.accessibilityCopy || {})[language()];
  const announce = value => document.dispatchEvent(new CustomEvent("site-accessibility-change", {
    detail: { settings: { ...value } },
  }));

  class Preferences {
    // Admit only canonical booleans and one bounded scale from existing storage.
    constructor() {
      this.value = defaults();
      safely(() => {
        const stored = JSON.parse(localStorage.getItem(settingsKey) || "null");
        if (!stored || typeof stored !== "object") return;
        const index = Number(stored.textScale);
        if (Number.isInteger(index) && index >= 0 && index < scales.length) this.value.textScale = index;
        for (const key of keys) this.value[key] = stored[key] === true;
      });
    }
    // The scale counts as one adjustment regardless of its selected percentage.
    count() { return Number(this.value.textScale !== 0) + keys.filter(key => this.value[key]).length; }
    // Media consumers honor either the visitor preference or the OS preference.
    reduced() {
      return document.documentElement.classList.contains(classes.reducedMotion) ||
        Boolean(safely(() => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
    }
    // Root classes and events also work before the dialog DOM has been inserted.
    apply() {
      const root = document.documentElement;
      for (const key of keys) root.classList.toggle(classes[key], this.value[key]);
      const scale = scales[this.value.textScale];
      root.classList.toggle("a11y-text-scaled", scale !== 1);
      if (scale === 1) root.style.removeProperty("--a11y-text-scale");
      else root.style.setProperty("--a11y-text-scale", String(scale));
      if (this.value.reducedMotion) for (const video of document.querySelectorAll("video")) {
        if (!video.paused) video.pause();
        video.removeAttribute("autoplay");
      }
      dialog?.render();
      announce(this.value);
    }
    // A storage failure must leave the current page's adjustment functional.
    commit(change) {
      change(this.value);
      this.apply();
      safely(() => this.count() ? localStorage.setItem(settingsKey, JSON.stringify(this.value)) : localStorage.removeItem(settingsKey));
    }
    // Unknown DOM option keys cannot introduce persistent settings.
    toggle(key) {
      if (keys.includes(key)) this.commit(value => { value[key] = !value[key]; });
    }
    // At either scale boundary a further click produces no change event.
    step(delta) {
      const next = Math.max(0, Math.min(scales.length - 1, this.value.textScale + delta));
      if (next !== this.value.textScale) this.commit(value => { value.textScale = next; });
    }
    // Reset replaces the model and removes its inactive storage record.
    reset() { this.commit(() => { this.value = defaults(); }); }
  }

  // Dialog state owns keyboard focus and translated labels, but never changes
  // page content or persists whether the dialog happens to be open.
  class Dialog {
    constructor(nodes, options) {
      this.nodes = nodes;
      this.options = options;
      this.open = false;
      const n = nodes;
      n.panel.inert = true;
      n.statement.href = language() === "en" ? "/accessibility/" : `/${language().toLowerCase()}/accessibility/`;
      n.fab.addEventListener("click", () => {
        if (n.fab.dataset.suppressClick === "true") { delete n.fab.dataset.suppressClick; return; }
        this.setOpen(!this.open);
      });
      for (const control of [n.close, n.backdrop]) control.addEventListener("click", () => this.setOpen(false));
      n.reset.addEventListener("click", () => preferences.reset());
      n.smaller.addEventListener("click", () => preferences.step(-1));
      n.larger.addEventListener("click", () => preferences.step(1));
      for (const button of options) button.addEventListener("click", () => preferences.toggle(button.dataset.a11ySetting));
      document.addEventListener("keydown", event => this.keydown(event));
      document.addEventListener("site-language-change", () => this.render());
    }
    // Keep focus, inertness and all visibility/ARIA states in one transition.
    setOpen(next, restore = true) {
      if (next === this.open) return;
      this.open = next;
      const n = this.nodes;
      n.fab.setAttribute("aria-expanded", String(next));
      n.panel.setAttribute("aria-hidden", String(!next));
      n.panel.inert = !next;
      n.backdrop.classList.toggle("is-visible", next);
      n.panel.classList.toggle("is-open", next);
      document.body.classList.toggle("a11y-panel-open", next);
      this.render();
      if (next) requestAnimationFrame(() => n.close.focus());
      else if (restore && !n.fab.hidden) n.fab.focus();
    }
    // Disabled or hidden controls never participate in the modal focus cycle.
    keydown(event) {
      if (!this.open) return;
      if (event.key === "Escape") { event.preventDefault(); this.setOpen(false); return; }
      if (event.key !== "Tab") return;
      const panel = this.nodes.panel;
      const items = [...panel.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")]
        .filter(item => item.offsetParent !== null);
      if (!items.length) return;
      const backwards = event.shiftKey && (document.activeElement === items[0] || !panel.contains(document.activeElement));
      const forwards = !event.shiftKey && document.activeElement === items.at(-1);
      if (backwards || forwards) {
        event.preventDefault();
        (backwards ? items.at(-1) : items[0]).focus();
      }
    }
    // Translate existing nodes in place without injecting locale text as HTML.
    render() {
      const bundle = copy();
      const n = this.nodes;
      const text = { eyebrow: bundle.eyebrow, title: bundle.title, description: bundle.description,
        reset: bundle.reset, sizeTitle: bundle.textSize.label, sizeDescription: bundle.textSize.description,
        statement: bundle.statementLink };
      for (const [key, value] of Object.entries(text)) n[key].textContent = value;
      const skip = document.querySelector(".skip-link");
      if (skip) skip.textContent = bundle.skipLink;
      n.close.setAttribute("aria-label", bundle.closeButton);
      for (const [key, label] of [["smaller", bundle.textSize.decrease], ["larger", bundle.textSize.increase],
        ["fab", this.open ? bundle.closeButton : bundle.openButton]]) {
        n[key].setAttribute("aria-label", label);
        n[key].title = label;
      }
      for (const button of this.options) {
        const key = button.dataset.a11ySetting;
        const translated = bundle.options[key];
        if (translated) {
          button.querySelector(".a11y-option__title").textContent = translated.label;
          button.querySelector(".a11y-option__description").textContent = translated.description;
        }
        button.classList.toggle("is-active", Boolean(preferences.value[key]));
        button.setAttribute("aria-pressed", String(Boolean(preferences.value[key])));
      }
      const percent = Math.round(scales[preferences.value.textScale] * 100);
      n.sizeValue.textContent = `${percent}%`;
      n.sizeValue.setAttribute("aria-label", bundle.textSize.level.replace("{percent}", percent));
      n.smaller.disabled = preferences.value.textScale === 0;
      n.larger.disabled = preferences.value.textScale === scales.length - 1;
      const count = preferences.count();
      n.status.textContent = count ? bundle.statusActive.replace("{count}", count) : bundle.statusDefault;
      n.reset.disabled = count === 0;
    }
  }

  // Placement is stored relative to the reading-start edge. The local gesture
  // state is deliberately separate from persisted accessibility preferences.
  class Launcher {
    constructor(fab) {
      this.fab = fab;
      this.drag = null;
      this.timer = null;
      this.dismissTimer = null;
      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.className = "a11y-fab__dismiss";
      dismiss.textContent = "×";
      dismiss.hidden = true;
      document.body.append(dismiss);
      this.dismiss = dismiss;
      fab.addEventListener("pointerdown", event => this.begin(event));
      fab.addEventListener("pointermove", event => this.move(event));
      for (const name of ["pointerup", "pointercancel"]) fab.addEventListener(name, () => this.finish());
      for (const name of ["contextmenu", "dragstart"]) fab.addEventListener(name, event => event.preventDefault());
      dismiss.addEventListener("click", () => {
        dialog.setOpen(false, false);
        fab.hidden = true;
        dismiss.hidden = true;
      });
      document.addEventListener("pointerdown", event => {
        if (event.target !== dismiss && !fab.contains(event.target)) dismiss.hidden = true;
      });
      document.addEventListener("keydown", event => { if (event.key === "Escape") dismiss.hidden = true; });
      window.addEventListener("resize", () => {
        if (fab.style.left) this.place(parseFloat(fab.style.left), parseFloat(fab.style.top));
        if (!dismiss.hidden) this.placeDismiss();
      });
      this.restore();
      new MutationObserver(() => {
        if (fab.style.left) this.restore();
        if (!dismiss.hidden) this.placeDismiss();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["dir"] });
      this.watchClearance();
    }
    // Resolve current direction so an in-place language change mirrors placement.
    rtl() { return getComputedStyle(document.documentElement).direction === "rtl"; }
    // Explicit placement takes ownership from the default logical corner/lift.
    place(left, top) {
      const fab = this.fab;
      const box = fab.getBoundingClientRect();
      const bounded = (value, extent, size) => Math.min(Math.max(8, value), Math.max(8, extent - size - 8));
      const x = bounded(left, window.innerWidth, box.width);
      const y = bounded(top, window.innerHeight, box.height);
      fab.style.removeProperty("--a11y-fab-lift");
      Object.assign(fab.style, { insetInlineStart: "auto", insetInlineEnd: "auto", insetBlockEnd: "auto",
        right: "auto", bottom: "auto", left: `${x}px`, top: `${y}px` });
    }
    // Ignore malformed fractions and retire the former physical-position key.
    restore() {
      safely(() => {
        localStorage.removeItem("wifigate-a11y-fab-position");
        const saved = JSON.parse(localStorage.getItem(positionKey) || "null");
        if (!saved || !Number.isFinite(saved.start) || !Number.isFinite(saved.y)) return;
        const width = document.documentElement.clientWidth;
        const distance = width * saved.start;
        this.place(this.rtl() ? width - distance - this.fab.getBoundingClientRect().width : distance,
          saved.y * window.innerHeight);
      });
    }
    // Keep the temporary dismiss control attached to the actual rendered button.
    placeDismiss() {
      const box = this.fab.getBoundingClientRect();
      this.dismiss.style.left = `${Math.max(4, box.left - 6)}px`;
      this.dismiss.style.top = `${Math.max(4, box.top - 6)}px`;
    }
    // Repeated movement restarts the five-second localized dismiss affordance.
    revealDismiss() {
      const label = copy().hideButton;
      this.dismiss.setAttribute("aria-label", label);
      this.dismiss.title = label;
      this.placeDismiss();
      this.dismiss.hidden = false;
      clearTimeout(this.dismissTimer);
      this.dismissTimer = setTimeout(() => { this.dismiss.hidden = true; }, 5000);
    }
    // Capture the original grab point before playback or drag transforms change.
    begin(event) {
      if (event.button !== 0) return;
      clearTimeout(this.timer);
      const box = this.fab.getBoundingClientRect();
      const drag = { x: event.clientX, y: event.clientY, dx: event.clientX - box.left,
        dy: event.clientY - box.top, active: false, moved: false };
      this.drag = drag;
      this.timer = setTimeout(() => {
        drag.active = true;
        this.fab.classList.add("is-arranging");
        safely(() => this.fab.setPointerCapture?.(event.pointerId));
        if (navigator.vibrate) navigator.vibrate(15);
        this.revealDismiss();
      }, 550);
    }
    // Ordinary pointer travel cancels a pending hold; active dragging owns input.
    move(event) {
      const drag = this.drag;
      if (!drag) return;
      if (!drag.active) {
        if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 8) clearTimeout(this.timer);
        return;
      }
      event.preventDefault();
      drag.moved = true;
      this.place(event.clientX - drag.dx, event.clientY - drag.dy);
      this.placeDismiss();
    }
    // A completed hold suppresses its synthetic click and saves only real moves.
    finish() {
      clearTimeout(this.timer);
      const drag = this.drag;
      this.drag = null;
      if (!drag?.active) return;
      this.fab.classList.remove("is-arranging");
      this.fab.dataset.suppressClick = "true";
      if (!drag.moved) return;
      safely(() => {
        const width = document.documentElement.clientWidth;
        const left = parseFloat(this.fab.style.left);
        const distance = this.rtl() ? width - left - this.fab.offsetWidth : left;
        localStorage.setItem(positionKey, JSON.stringify({ start: distance / width,
          y: parseFloat(this.fab.style.top) / window.innerHeight }));
      });
      this.revealDismiss();
    }
    // Default corner placement clears existing hero controls without moving a
    // visitor-arranged button. Observer work shares a single animation frame.
    watchClearance() {
      const targets = [...document.querySelectorAll(".hero__actions, #hero-replay, [data-scene-replay]")];
      if (!targets.length) return;
      let scheduled = false;
      const fab = this.fab;
      const update = () => {
        scheduled = false;
        let lift = 0;
        if (!fab.hidden && !fab.style.left && !document.body.classList.contains("a11y-panel-open")) {
          const box = fab.getBoundingClientRect();
          const resting = box.bottom + (parseFloat(fab.style.getPropertyValue("--a11y-fab-lift")) || 0);
          let bottom = resting;
          const obstacles = targets.map(target => target.getBoundingClientRect())
            .filter(target => target.width > 0 && box.left < target.right + 4 && box.right > target.left - 4)
            .sort((a, b) => b.bottom - a.bottom);
          for (const target of obstacles) {
            if (bottom > target.top - 8 && bottom - box.height < target.bottom + 8) bottom = target.top - 8;
          }
          lift = Math.min(resting - bottom, resting - box.height - 8);
        }
        if (lift > 0) fab.style.setProperty("--a11y-fab-lift", `${Math.round(lift)}px`);
        else fab.style.removeProperty("--a11y-fab-lift");
      };
      const schedule = () => { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } };
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", schedule);
      document.addEventListener("site-accessibility-change", schedule);
      if (window.ResizeObserver) {
        const observer = new ResizeObserver(schedule);
        for (const target of [...targets, document.documentElement]) observer.observe(target);
      }
      if (window.MutationObserver) new MutationObserver(schedule)
        .observe(document.body, { attributes: true, attributeFilter: ["class"] });
      update();
    }
  }

  let dialog = null;
  const preferences = new Preferences();
  // Missing partials or late copy can retry; a successful mount is idempotent.
  function mount() {
    if (dialog || !copy()) return;
    const ids = { fab: "fab", panel: "panel", backdrop: "backdrop", close: "close", reset: "reset",
      status: "status", title: "title", description: "description", eyebrow: "eyebrow",
      sizeTitle: "text-size-title", sizeDescription: "text-size-description", sizeValue: "text-size-value",
      smaller: "text-smaller", larger: "text-larger", statement: "statement" };
    const nodes = Object.fromEntries(Object.entries(ids).map(([key, suffix]) => [key, document.getElementById(`a11y-${suffix}`)]));
    if (Object.values(nodes).some(node => !node)) return;
    dialog = new Dialog(nodes, [...document.querySelectorAll(".a11y-option[data-a11y-setting]")]);
    new Launcher(nodes.fab);
    safely(() => {
      const query = window.matchMedia?.("(prefers-reduced-motion: reduce)");
      const changed = () => announce(preferences.value);
      if (query?.addEventListener) query.addEventListener("change", changed);
      else query?.addListener?.(changed);
    });
    preferences.apply();
  }
  preferences.apply();
  safely(() => localStorage.removeItem("wifigate-accessibility-settings-v1"));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
  return { mount, reduced: () => preferences.reduced() };
})();

// Keep the two entry points consumed by the existing main and media scripts.
function setupAccessibilityWidget() { siteAccessibility.mount(); }
function isReducedMotionRequested() { return siteAccessibility.reduced(); }
