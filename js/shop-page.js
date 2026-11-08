document.addEventListener("DOMContentLoaded", () => {
  if (typeof setupNav === "function") setupNav();
});

// "Add to cart" stores the product in the cart cookie and shows the cart. On a
// product page the chosen plan (Manager or Host) joins it as a subscription.
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-shop-cart]");
  if (!button || !window.WIFIGATE_CART) return;
  event.preventDefault();
  window.WIFIGATE_CART.addItem({ productId: button.dataset.shopCart });
  const plan = button.closest(".shop-product-detail")?.querySelector("[data-shop-plan] input:checked")?.value;
  if (plan) window.WIFIGATE_CART.addItem({ productId: plan });
  window.WIFIGATE_CART.open();
});

// The 3D view's bundle sits next to this script; it loads only on demand.
const shop3dModule = new URL("shop-3d.bundle.js?v=20261109b", document.currentScript?.src || location.href);

// Product photos open in a full-screen viewer. Clicking the photo zooms in at
// that point and moving the pointer pans across it; arrows and swipes switch
// photos, following the page direction. The same viewer hosts the 3D view.
const viewer = document.querySelector(".shop-viewer");
if (viewer) {
  const photos = [...document.querySelectorAll("[data-shop-zoom] img")];
  const stage = viewer.querySelector(".shop-viewer__stage");
  // The viewer's photo is created on first open, so the closed dialog holds no empty image.
  const image = document.createElement("img");
  image.className = "shop-viewer__image";
  const count = viewer.querySelector(".shop-viewer__count");
  const hint = viewer.querySelector(".shop-viewer__hint-text");
  const reset = viewer.querySelector(".shop-viewer__reset");
  const measure = viewer.querySelector(".shop-viewer__dimensions");
  const photoHint = hint.textContent;
  const forward = document.documentElement.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  let index = 0, frame = null, swipeStart = null, view3d = null, session = 0;

  // Leaving the 3D view frees its WebGL context; a load still in flight is
  // discarded through the session counter.
  const leave3d = () => {
    session += 1;
    view3d?.dispose();
    view3d = null;
    stage.querySelector(".shop-3d")?.remove();
    viewer.classList.remove("is-3d");
    reset.hidden = true;
    measure.hidden = true;
    hint.textContent = photoHint;
  };
  const open3d = async (button) => {
    leave3d();
    unzoom();
    image.remove();
    viewer.classList.add("is-3d");
    const holder = Object.assign(document.createElement("div"), { className: "shop-3d" });
    stage.append(holder);
    hint.textContent = viewer.getAttribute("data-3d-loading");
    if (!viewer.open) { viewer.showModal(); document.body.classList.add("shop-viewer-open"); }
    const current = session;
    try {
      const { mountProduct3D } = await import(shop3dModule.href);
      if (current !== session) return;
      const mounted = await mountProduct3D(holder, {
        // data-shop-3d keeps its dash in dataset (a digit follows it), so read the attributes.
        product: button.getAttribute("data-shop-3d"),
        assets: JSON.parse(button.getAttribute("data-shop-3d-assets")),
        label: viewer.getAttribute("data-3d-label"),
        unit: viewer.getAttribute("data-3d-unit"),
        showDimensions: measure.getAttribute("aria-pressed") === "true",
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
      if (current !== session) { mounted.dispose(); return; }
      view3d = mounted;
      hint.textContent = viewer.getAttribute("data-3d-hint");
      reset.hidden = false;
      measure.hidden = false;
    } catch (error) {
      if (current !== session) return;
      // Only missing WebGL means "not supported"; a failed download can be retried.
      hint.textContent = viewer.getAttribute(error?.code === "webgl-unavailable" ? "data-3d-error" : "data-3d-retry");
      holder.remove();
    }
  };

  const unzoom = () => { viewer.classList.remove("is-zoomed"); image.style.transformOrigin = ""; frame = null; };
  const show = (next) => {
    if (viewer.classList.contains("is-3d")) leave3d();
    index = (next + photos.length) % photos.length;
    unzoom();
    if (!image.isConnected) stage.append(image);
    image.src = photos[index].currentSrc || photos[index].src;
    image.alt = photos[index].alt;
    if (count) count.textContent = `${index + 1} / ${photos.length}`;
  };
  const pan = (event) => {
    if (!frame) return;
    const x = Math.min(1, Math.max(0, (event.clientX - frame.left) / frame.width));
    const y = Math.min(1, Math.max(0, (event.clientY - frame.top) / frame.height));
    image.style.transformOrigin = `${x * 100}% ${y * 100}%`;
  };

  document.addEventListener("click", (event) => {
    const button3d = event.target.closest("[data-shop-3d]");
    if (button3d) { open3d(button3d); return; }
    const trigger = event.target.closest("[data-shop-zoom]");
    if (!trigger) return;
    show(Number(trigger.dataset.shopZoom));
    viewer.showModal();
    document.body.classList.add("shop-viewer-open");
  });
  viewer.querySelector(".shop-viewer__close").addEventListener("click", () => viewer.close());
  viewer.querySelectorAll("[data-shop-viewer-step]").forEach((button) =>
    button.addEventListener("click", () => show(index + Number(button.dataset.shopViewerStep))));
  reset.addEventListener("click", () => view3d?.reset());
  // Dimensions show by default; the choice holds while the page stays open.
  measure.addEventListener("click", () => {
    const visible = measure.getAttribute("aria-pressed") !== "true";
    measure.setAttribute("aria-pressed", String(visible));
    view3d?.setDimensions(visible);
  });
  viewer.addEventListener("close", () => { leave3d(); unzoom(); document.body.classList.remove("shop-viewer-open"); });
  image.addEventListener("click", (event) => {
    if (frame) { unzoom(); return; }
    frame = image.getBoundingClientRect();
    pan(event);
    viewer.classList.add("is-zoomed");
  });
  stage.addEventListener("click", (event) => { if (event.target === stage) viewer.close(); });
  stage.addEventListener("pointermove", pan);
  stage.addEventListener("pointerdown", (event) => { swipeStart = frame || viewer.classList.contains("is-3d") ? null : event.clientX; });
  stage.addEventListener("pointerup", (event) => {
    if (swipeStart === null || photos.length < 2) return;
    const distance = event.clientX - swipeStart;
    swipeStart = null;
    if (Math.abs(distance) < 60) return;
    const towardsStart = document.documentElement.dir === "rtl" ? distance > 0 : distance < 0;
    show(index + (towardsStart ? 1 : -1));
  });
  viewer.addEventListener("keydown", (event) => {
    if (photos.length < 2 || viewer.classList.contains("is-3d") || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    show(index + (event.key === forward ? 1 : -1));
  });
}
