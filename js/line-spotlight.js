// Animated spotlight art on the WIFIGATE Manager page, with the hero player
// from js/line-hero.js: the Auto Open panel (a resident walks into an
// apartment building and the lobby doors open by themselves) and the guest
// invite panel (a courier on a bicycle gets the invite and opens the gate).
// The page ships the scene's start frame (or its still frame under
// prefers-reduced-motion) as the panel image, so the panel is complete
// without JavaScript; this module draws the live SVG over that frame in the
// same 16:9 box. It plays only while the panel is on screen and the tab is
// visible, offers pause/resume, and shows the still frame when the visitor
// prefers reduced motion (system or site setting).
// The runtime import uses the exact URL the page loads, so it is one module
// instance and the heroes mount once (scripts/line-hero.test.mjs checks it).
import { createPlayer } from "./line-hero.js?v=20261116lh14";

const SCENES = {
  building: () => import("./line-hero-building.js?v=20261116lh14").then(module => module.createBuildingEntryScene),
  guest: () => import("./line-hero-features.js?v=20261116lh14").then(module => module.createGuestScene),
};
const SVG_NS = "http://www.w3.org/2000/svg";

function reducedMotion(query) {
  return query.matches || (typeof globalThis.isReducedMotionRequested === "function" && Boolean(globalThis.isReducedMotionRequested()));
}

export async function mountLineSpotlight(figure) {
  const load = SCENES[figure?.dataset.lineSpotlight];
  if (!load) return null;
  const pauseButton = figure.querySelector("[data-scene-pause]");
  const copy = { play: pauseButton?.dataset.labelPlay || "Play animation", pause: pauseButton?.dataset.labelPause || "Pause animation" };

  const svg = document.createElementNS(SVG_NS, "svg");
  let scene;
  try { scene = (await load())(svg); }
  catch { return null; /* The static frame stays; nothing moves, so no pause control is offered. */ }
  svg.setAttribute("class", "wa-spotlight__live");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");

  const labels = state => {
    figure.dataset.lineSpotlightState = state;
    if (!pauseButton) return;
    const paused = state === "paused", label = paused ? copy.play : copy.pause;
    pauseButton.hidden = state === "still";
    pauseButton.textContent = label;
    pauseButton.setAttribute("aria-label", label);
    pauseButton.title = label;
    pauseButton.setAttribute("aria-pressed", String(paused));
  };
  const player = createPlayer(scene, { onState: labels });
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let pausedByVisitor = false, startedByVisitor = false;
  if (reducedMotion(motionQuery)) player.still();
  else { scene.render(0); player.start(); }
  figure.append(svg);

  pauseButton?.addEventListener("click", () => {
    if (player.playing) { pausedByVisitor = true; player.pause(); }
    else { pausedByVisitor = false; startedByVisitor = true; player.resume(); }
  });
  const policyChanged = () => {
    if (reducedMotion(motionQuery)) { startedByVisitor = false; pausedByVisitor = false; player.still(); }
    else if (!player.playing && !pausedByVisitor && !startedByVisitor) player.restart();
  };
  motionQuery.addEventListener("change", policyChanged);
  document.addEventListener("site-accessibility-change", policyChanged);
  document.addEventListener("visibilitychange", () => player.view({ visible: !document.hidden }));
  if ("IntersectionObserver" in window) new IntersectionObserver(entries => player.view({ onScreen: entries.some(entry => entry.isIntersecting) })).observe(figure);
  return player;
}

if (typeof document !== "undefined") for (const figure of document.querySelectorAll("[data-line-spotlight]")) mountLineSpotlight(figure);
