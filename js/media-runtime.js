// One viewport-selected pair per page. Cache availability never gates controls.
(() => {
  const entryVariant = window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop";
  const selections = new WeakMap();
  const script = document.currentScript;
  const root = script?.src ? new URL("../", script.src) : new URL("./", location.href);
  const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  let registrationPromise;

  // The poster file the browser already chose from <picture> (a portrait crop
  // or an AVIF copy of the selected variant), so it is never fetched twice.
  function shownPoster(image, fallback) {
    if (!image) return fallback;
    if (image.currentSrc) return image.currentSrc;
    const sources = image.closest("picture[data-scene-picture]")?.querySelectorAll("source:not([type])") || [];
    const source = [...sources].find(candidate => window.matchMedia(candidate.media).matches);
    return source ? new URL(source.getAttribute("srcset"), document.baseURI).href : fallback;
  }

  function select(video, image) {
    if (selections.has(video)) return selections.get(video);
    let variants;
    try { variants = JSON.parse(video.dataset.mediaVariants || "null"); } catch { /* Legacy single-source fallback. */ }
    const selected = variants?.[entryVariant];
    if (selected && typeof selected.src === "string" && typeof selected.poster === "string") {
      // Pin the shown poster before removing native picture sources, so
      // changing viewport later cannot fetch a second poster or change the pair.
      const poster = shownPoster(image, selected.poster);
      if (image) {
        image.src = poster;
        image.closest("picture[data-scene-picture]")?.querySelectorAll("source").forEach(source => source.remove());
      }
      video.poster = poster;
      video.dataset.videoSrc = selected.src;
      video.dataset.mediaVariant = entryVariant;
      video.width = selected.width;
      video.height = selected.height;
    }
    const pair = { src: video.dataset.videoSrc, poster: video.getAttribute("poster") || image?.currentSrc || image?.src };
    selections.set(video, pair);
    return pair;
  }

  async function register() {
    if (!window.isSecureContext || !["http:", "https:"].includes(location.protocol) || !("serviceWorker" in navigator)) return false;
    try {
      const worker = new URL("media-cache-sw.js", root);
      await navigator.serviceWorker.register(worker.href, { type: "module", scope: root.pathname, updateViaCache: "none" });
      if (!navigator.serviceWorker.controller) {
        await new Promise(resolve => {
          const changed = () => { navigator.serviceWorker.removeEventListener("controllerchange", changed); resolve(); };
          navigator.serviceWorker.addEventListener("controllerchange", changed, { once: true });
          setTimeout(changed, 1200);
        });
      }
      return navigator.serviceWorker.controller?.scriptURL === worker.href;
    } catch { return false; }
  }

  window.WifigateMedia = {
    select,
    async prepare(video, image) {
      const pair = select(video, image);
      registrationPromise ||= register();
      const controlled = await Promise.race([registrationPromise, delay(1500).then(() => false)]);
      // Only the displayed poster is warmed after first control. No video or
      // unselected variant is prefetched, including on reduced-motion/mobile.
      if (controlled && pair.poster && !video.dataset.mediaPosterWarmed) {
        video.dataset.mediaPosterWarmed = "true";
        fetch(pair.poster, { credentials: "omit" }).catch(() => {});
      }
      return pair;
    },
  };
  document.querySelectorAll("video[data-media-variants]").forEach(video => {
    const image = video.closest(".hero")?.querySelector(".hero__bg--image") || video.parentElement.querySelector("[data-scene-image]");
    select(video, image);
  });
  registrationPromise = register();
})();
