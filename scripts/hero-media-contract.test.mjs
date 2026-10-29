import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../js/hero.js", import.meta.url), "utf8");
const settle = () => new Promise((resolve) => setImmediate(resolve));

// Execute the shipped controller with deterministic media and browser events;
// no media network, installed app or production endpoint participates.
function fixture(options = {}) {
  function element() {
    const listeners = new Map(), attributes = new Map();
    return {
      dataset: {}, hidden: false, textContent: "",
      addEventListener(name, listener) {
        if (!listeners.has(name)) listeners.set(name, []);
        listeners.get(name).push(listener);
      },
      emit(name, event = {}) { for (const listener of listeners.get(name) || []) listener(event); },
      setAttribute(name, value) { attributes.set(name, value); },
      getAttribute(name) { return attributes.get(name) ?? null; },
      hasAttribute(name) { return attributes.has(name); },
    };
  }
  const hero = element(), video = element(), image = element(), replay = element();
  const label = element(), mute = element(), pause = element(), locale = element();
  const document = element(), classes = new Set();
  hero.querySelector = () => image;
  replay.querySelector = () => label;
  video.dataset = { videoSrc: "/fixture.mp4", silent: String(!!options.silent) };
  video.paused = true; video.ended = false; video.currentTime = 19;
  video.playCalls = 0;
  video.pause = () => { video.paused = true; video.emit("pause"); };
  video.play = async () => {
    video.playCalls++;
    if (options.rejectPlay) throw new Error("Fixture autoplay rejection");
    video.paused = false; video.ended = false; video.emit("playing");
    await options.playResult?.(video.playCalls);
  };
  image.decode = async () => {
    if (options.rejectPoster) throw new Error("Fixture poster failure");
    await options.decode?.();
  };
  locale.textContent = options.copy ?? "{}";
  const elements = { "hero-video": video, "hero-replay": replay,
    "hero-mute-toggle": mute, "hero-pause-toggle": pause, "hero-locale-data": locale };
  document.querySelector = () => options.missingHero ? null : hero;
  document.getElementById = (id) => id === options.missingId ? null : elements[id];
  document.body = { classList: { toggle(name, enabled) { if (enabled) classes.add(name); else classes.delete(name); } } };
  document.hidden = !!options.hidden;
  const desktop = element(), reduced = element(), connection = element();
  desktop.matches = options.desktop ?? true;
  reduced.matches = !!options.reduced;
  connection.saveData = !!options.saveData;
  const window = {
    matchMedia: (query) => query.includes("min-width") ? desktop : reduced,
    WifigateMedia: { prepare: options.prepare ?? (async () => {}) },
  };
  let observer;
  class Observer {
    constructor(callback, config) { observer = { callback, config }; }
    observe(target) { observer.target = target; }
  }
  if (options.observer) window.IntersectionObserver = Observer;
  const context = { document, window, navigator: { connection }, IntersectionObserver: Observer,
    isReducedMotionRequested: () => !!options.siteReduced };
  runInNewContext(source + "\nsetupHeroMedia();", context);
  return { hero, video, image, replay, label, mute, pause, document, desktop, reduced, connection, classes,
    observe(visible, ratio = .25) {
      observer.callback([{ isIntersecting: visible, intersectionRatio: ratio }]);
    }, observer };
}

test("required hero controls may be absent without attaching media", async () => {
  for (const options of [{ missingHero: true }, { missingId: "hero-video" }, { missingId: "hero-replay" }]) {
    const f = fixture(options); await settle();
    assert.equal(f.video.playCalls, 0);
    assert.equal(f.video.getAttribute("src"), null);
  }
});

test("autoplay respects motion, data and visibility while manual play remains available", async () => {
  for (const options of [{ reduced: true }, { siteReduced: true }, { saveData: true }, { hidden: true }]) {
    const f = fixture(options); await settle();
    assert.equal(f.video.playCalls, 0);
    assert.equal(f.hero.dataset.heroMediaState, "image");
    f.replay.emit("click"); await settle();
    assert.equal(f.video.playCalls, 1);
    assert.equal(f.hero.dataset.heroMediaState, "video");
  }
});

test("playback starts muted, updates controls and preserves visitor pause until explicit resume", async () => {
  const f = fixture(); await settle();
  assert.equal(f.video.getAttribute("src"), "/fixture.mp4");
  assert.equal(f.video.defaultMuted, true);
  assert.equal(f.video.playsInline, true);
  assert.equal(f.video.loop, false);
  assert.equal(f.mute.getAttribute("aria-label"), "Unmute video");
  assert.equal(f.replay.getAttribute("aria-label"), "Pause video");
  assert.equal(f.classes.has("hero-video-visible"), true);
  f.mute.emit("click");
  assert.equal(f.video.muted, false);
  assert.equal(f.mute.getAttribute("aria-pressed"), "true");
  f.replay.emit("click");
  assert.equal(f.video.paused, true);
  f.desktop.emit("change"); await settle();
  assert.equal(f.video.playCalls, 1);
  f.replay.emit("click"); await settle();
  assert.equal(f.video.playCalls, 2);
  assert.equal(f.video.currentTime, 19);
  f.video.ended = true; f.video.emit("ended");
  assert.equal(f.hero.dataset.heroMediaState, "image");
  f.desktop.emit("change"); await settle();
  assert.equal(f.video.playCalls, 2);
  f.replay.emit("click"); await settle();
  assert.equal(f.video.currentTime, 0);
  assert.equal(f.video.playCalls, 3);
});

test("intersection threshold gates eager playback and cancels offscreen playback", async () => {
  const f = fixture({ observer: true }); await settle();
  assert.equal(f.video.playCalls, 0);
  assert.equal(f.observer.target, f.hero);
  assert.equal(JSON.stringify(f.observer.config.threshold), "[0,0.25]");
  f.observe(true, .24); await settle();
  assert.equal(f.video.playCalls, 0);
  f.observe(true); await settle();
  assert.equal(f.video.playCalls, 1);
  f.observe(false); assert.equal(f.video.paused, true);
  assert.equal(f.classes.has("hero-video-visible"), false);
});

test("local labels, silent video and invalid locale fallback preserve accessible controls", async () => {
  const f = fixture({ silent: true, copy: '{"media":{"pause":"Local pause","unmute":"Local unmute"}}' });
  await settle();
  assert.equal(f.mute.hidden, true);
  assert.equal(f.replay.getAttribute("title"), "Local pause");
  assert.equal(f.mute.getAttribute("title"), "Local unmute");
  const invalid = fixture({ copy: "invalid JSON" }); await settle();
  assert.equal(invalid.replay.getAttribute("title"), "Pause video");
});

test("optional controls and the dedicated pause button preserve playback and accessible state", async () => {
  for (const missingId of ["hero-mute-toggle", "hero-pause-toggle"]) {
    const optional = fixture({ missingId }); await settle();
    assert.equal(optional.hero.dataset.heroMediaState, "video");
    assert.equal(optional.replay.getAttribute("aria-label"), "Pause video");
  }
  const f = fixture(); await settle();
  f.pause.emit("click");
  assert.equal(f.pause.getAttribute("aria-label"), "Play video");
  assert.equal(f.pause.getAttribute("title"), "Play video");
  assert.equal(f.pause.getAttribute("aria-pressed"), "true");
  f.connection.emit("change"); await settle();
  assert.equal(f.video.playCalls, 1);
  f.pause.emit("click"); await settle();
  assert.equal(f.video.playCalls, 2);
  assert.equal(f.video.currentTime, 19);
  assert.equal(f.pause.getAttribute("title"), "Pause video");
});

test("policy and visibility changes pause media and update the floating widget", async () => {
  const f = fixture(); await settle();
  f.reduced.matches = true; f.reduced.emit("change");
  assert.equal(f.hero.dataset.heroMediaState, "image");
  assert.equal(f.video.paused, true);
  f.reduced.matches = false; f.document.emit("site-accessibility-change"); await settle();
  assert.equal(f.video.paused, false);
  f.document.hidden = true; f.document.emit("visibilitychange");
  assert.equal(f.video.paused, true);
  f.document.hidden = false; f.document.emit("visibilitychange"); await settle();
  assert.equal(f.video.paused, false);
  f.hero.setAttribute("data-hero-scene", "accepted"); f.desktop.emit("change"); await settle();
  assert.equal(f.classes.has("hero-video-visible"), false);
});

test("a stale preparation cannot start media after visibility cancellation", async () => {
  let resolve;
  const prepared = new Promise((done) => { resolve = done; });
  const f = fixture({ prepare: () => prepared });
  f.document.hidden = true; f.document.emit("visibilitychange");
  resolve(); await settle();
  assert.equal(f.video.playCalls, 0);
  assert.equal(f.video.getAttribute("src"), null);
});

test("playback rejection returns to poster while a failed poster does not block playback", async () => {
  const rejected = fixture({ rejectPlay: true }); await settle();
  assert.equal(rejected.hero.dataset.heroMediaState, "image");
  assert.equal(rejected.video.paused, true);
  const recovered = fixture({ rejectPoster: true }); await settle();
  assert.equal(recovered.hero.dataset.heroMediaState, "video");
});

// A media promise can settle after a later visitor request. Its completion
// must not replace that newer request's visibility or accessible action.
test("an older play rejection cannot stop a newer manual resume", async () => {
  let rejectFirst;
  const pending = new Promise((_, reject) => { rejectFirst = reject; });
  const f = fixture({ playResult: call => call === 1 ? pending : undefined });
  await settle();
  assert.equal(f.video.playCalls, 1);
  f.pause.emit("click");
  f.pause.emit("click");
  await settle();
  assert.equal(f.video.playCalls, 2);
  rejectFirst(new Error("Earlier native play rejected after visitor resume"));
  await settle();
  assert.equal(f.video.paused, false);
  assert.equal(f.hero.dataset.heroMediaState, "video");
  assert.equal(f.replay.getAttribute("aria-label"), "Pause video");
});

// Poster decoding is a second asynchronous boundary after media preparation.
test("hiding during poster decode cancels source attachment and playback", async () => {
  let finishDecode;
  const pending = new Promise(resolve => { finishDecode = resolve; });
  const f = fixture({ decode: () => pending });
  await settle();
  f.document.hidden = true;
  f.document.emit("visibilitychange");
  finishDecode();
  await settle();
  assert.equal(f.video.getAttribute("src"), null);
  assert.equal(f.video.playCalls, 0);
  assert.equal(f.hero.dataset.heroMediaState, "image");
});
