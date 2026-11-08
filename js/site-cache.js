// Keeps public styles, scripts, fonts and images in this browser so repeat
// visits load from the device. The worker is the same one that caches scene
// videos; it never stores pages, account data, API or analytics requests.
(() => {
  if (!window.isSecureContext || !("serviceWorker" in navigator) || !["http:", "https:"].includes(location.protocol)) return;
  const root = new URL("../", document.currentScript?.src || location.href);
  const worker = new URL("media-cache-sw.js", root);
  // Files this page loaded before the worker was in control are handed to it,
  // so the next visit is already fast.
  const warm = (registration) => {
    const urls = performance.getEntriesByType("resource").map((entry) => entry.name);
    (registration.active || navigator.serviceWorker.controller)?.postMessage({ type: "wifigate-warm-static", urls });
  };
  const start = () => navigator.serviceWorker.register(worker.href, { type: "module", scope: root.pathname, updateViaCache: "none" })
    .then(() => navigator.serviceWorker.ready).then(warm).catch(() => {});
  // Registration waits for the page to finish loading so it never competes with it.
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();
