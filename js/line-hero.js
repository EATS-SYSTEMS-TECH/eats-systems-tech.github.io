// WIFIGATE Host and WIFIGATE Manager heroes: the approved white line
// animations in the full-width hero media layer, with the existing replay and
// pause controls. The page ships a static frame of the same scene (start
// frame, or the approved still under prefers-reduced-motion) as its eager
// image, so the hero is complete without JavaScript; css/line-hero.css sizes
// the art in the media layer and this module drives the live SVG over that
// frame, in the same box. A toggle next to pause collapses the hero text so
// the whole drawing can be seen.
const SCENES = {
  host: () => import("./line-hero-host.js?v=20261110lh2").then(module => module.createHostScene),
  manager: () => import("./line-hero-manager.js?v=20261110lh2").then(module => module.createManagerScene),
};
const SVG_NS = "http://www.w3.org/2000/svg";
const FALLBACK_COPY = { play: "Play video", pause: "Pause video", replay: "Replay video", hideText: "Hide text", showText: "Show text" };
// The visitor's last text choice, for this browser session only.
const TEXT_STATE_KEY = "wifigate-line-hero-text";

// --------------------------------------------------------------- playback
function reducedMotion(query) {
  return query.matches || (typeof globalThis.isReducedMotionRequested === "function" && Boolean(globalThis.isReducedMotionRequested()));
}

// Drives one scene: start/pause/resume/restart and the still frame. The loop
// advances by the elapsed frame time (at most 0.1 s per frame, like the
// approved pages) and only while the hero is on screen and the tab visible.
export function createPlayer(scene, { onState } = {}) {
  let time = 0, last = null, raf = 0, wanted = false, onScreen = true, visible = !document.hidden;
  const frame = timestamp => {
    raf = 0;
    if (last !== null) time = (time + Math.min(0.1, Math.max(0, (timestamp - last) / 1000))) % scene.duration;
    last = timestamp;
    scene.render(time);
    schedule();
  };
  const schedule = () => { if (wanted && onScreen && visible && !raf) raf = requestAnimationFrame(frame); };
  const halt = () => { if (raf) cancelAnimationFrame(raf); raf = 0; last = null; };
  const state = value => onState?.(value);
  return {
    get time() { return time; },
    get playing() { return wanted; },
    start() { wanted = true; state("playing"); schedule(); },
    pause() { wanted = false; halt(); state("paused"); },
    resume() { wanted = true; state("playing"); schedule(); },
    restart() { time = 0; last = null; scene.render(0); wanted = true; state("playing"); schedule(); },
    still(at = scene.still) { wanted = false; halt(); time = at; scene.render(at); state("still"); },
    view({ onScreen: nextOnScreen = onScreen, visible: nextVisible = visible } = {}) {
      onScreen = nextOnScreen; visible = nextVisible;
      if (onScreen && visible) schedule(); else halt();
    },
  };
}

// --------------------------------------------------------------- text toggle
// Collapsing hides the eyebrow, title, lead and replay action and their white
// scrim (css/line-hero.css); the text keeps its place, so the hero and the art
// do not move, and the h1 stays in the document. Focus stays on the toggle.
export function mountTextToggle(section, copy) {
  const button = section?.querySelector("[data-hero-text-toggle]");
  const text = button && section.querySelector(`#${button.getAttribute("aria-controls")}`);
  if (!button || !text) return null;
  const apply = collapsed => {
    section.dataset.lineHeroText = collapsed ? "collapsed" : "expanded";
    const label = collapsed ? copy.showText : copy.hideText;
    button.setAttribute("aria-expanded", String(!collapsed));
    button.setAttribute("aria-label", label);
    button.title = label;
  };
  // One remembered choice per product (Host, Manager), so collapsing one hero
  // never opens the other product's page without its headline.
  const key = `${TEXT_STATE_KEY}:${section.dataset.lineHero || "scene"}`;
  let remembered = false;
  try { remembered = sessionStorage.getItem(key) === "collapsed"; } catch { /* Storage unavailable: start expanded. */ }
  if (remembered) {
    // A remembered choice applies at once, without the fade.
    section.classList.add("line-hero--instant");
    apply(true);
    requestAnimationFrame(() => requestAnimationFrame(() => section.classList.remove("line-hero--instant")));
  } else apply(false);
  button.hidden = false;
  button.addEventListener("click", () => {
    const collapsed = section.dataset.lineHeroText !== "collapsed";
    apply(collapsed);
    try { sessionStorage.setItem(key, collapsed ? "collapsed" : "expanded"); } catch { /* The choice lasts for this page only. */ }
  });
  return { get collapsed() { return section.dataset.lineHeroText === "collapsed"; }, set: apply };
}

export async function mountLineHero(section) {
  const stage = section?.querySelector("[data-line-hero-stage]");
  const load = SCENES[section?.dataset.lineHero];
  if (!stage || !load) return null;
  const replay = section.querySelector("[data-scene-replay]");
  const pauseButton = section.querySelector("[data-scene-pause]");
  let copy = FALLBACK_COPY;
  try { copy = { ...FALLBACK_COPY, ...JSON.parse(section.querySelector("[data-scene-copy]")?.textContent || "{}") }; }
  catch { /* The static frame and the controls' built-in labels remain. */ }
  // The text toggle works whether or not the scene loads.
  mountTextToggle(section, copy);

  let createScene, scene;
  const svg = document.createElementNS(SVG_NS, "svg");
  try {
    createScene = await load();
    scene = createScene(svg);
  } catch {
    // The static frame stays; nothing moves, so no pause control is offered.
    section.dataset.lineHeroState = "poster";
    return null;
  }
  svg.setAttribute("class", "line-hero__art");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const labels = state => {
    section.dataset.lineHeroState = state;
    if (!pauseButton) return;
    const paused = state === "paused";
    pauseButton.hidden = state === "still";
    pauseButton.textContent = paused ? copy.play : copy.pause;
    pauseButton.setAttribute("aria-label", paused ? copy.play : copy.pause);
    pauseButton.setAttribute("aria-pressed", String(paused));
  };
  const player = createPlayer(scene, { onState: labels });
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let pausedByVisitor = false, startedByVisitor = false;

  // A fixed time for review screenshots: a data attribute the builder never
  // writes, read once. The frame stays still and no pause control appears.
  const fixed = Number.parseFloat(section.dataset.lineHeroTime ?? "");
  if (Number.isFinite(fixed)) player.still(fixed);
  else if (reducedMotion(motionQuery)) player.still();
  else { scene.render(0); player.start(); }
  stage.append(svg);

  replay?.addEventListener("click", () => { pausedByVisitor = false; startedByVisitor = true; player.restart(); });
  pauseButton?.addEventListener("click", () => {
    if (player.playing) { pausedByVisitor = true; player.pause(); }
    else { pausedByVisitor = false; startedByVisitor = true; player.resume(); }
  });
  const policyChanged = () => {
    if (Number.isFinite(fixed)) return;
    if (reducedMotion(motionQuery)) { startedByVisitor = false; pausedByVisitor = false; player.still(); }
    else if (!player.playing && !pausedByVisitor && !startedByVisitor) player.restart();
  };
  motionQuery.addEventListener("change", policyChanged);
  document.addEventListener("site-accessibility-change", policyChanged);
  document.addEventListener("visibilitychange", () => player.view({ visible: !document.hidden }));
  if ("IntersectionObserver" in window) new IntersectionObserver(entries => player.view({ onScreen: entries.some(entry => entry.isIntersecting) })).observe(stage);
  return player;
}

if (typeof document !== "undefined") for (const section of document.querySelectorAll("[data-line-hero]")) mountLineHero(section);
