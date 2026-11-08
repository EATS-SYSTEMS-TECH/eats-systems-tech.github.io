document.addEventListener("DOMContentLoaded", () => {
  if (typeof setupNav === "function") setupNav();
});

// "Add to cart" stores the product in the cart cookie and shows the cart.
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-shop-cart]");
  if (!button || !window.WIFIGATE_CART) return;
  event.preventDefault();
  window.WIFIGATE_CART.addItem({ productId: button.dataset.shopCart });
  window.WIFIGATE_CART.open();
});

// Product photos open in a full-screen viewer. Clicking the photo zooms in at
// that point and moving the pointer pans across it; arrows and swipes switch
// photos, following the page direction.
const viewer = document.querySelector(".shop-viewer");
if (viewer) {
  const photos = [...document.querySelectorAll("[data-shop-zoom] img")];
  const stage = viewer.querySelector(".shop-viewer__stage");
  // The viewer's photo is created on first open, so the closed dialog holds no empty image.
  const image = document.createElement("img");
  image.className = "shop-viewer__image";
  const count = viewer.querySelector(".shop-viewer__count");
  const forward = document.documentElement.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
  let index = 0, frame = null, swipeStart = null;

  const unzoom = () => { viewer.classList.remove("is-zoomed"); image.style.transformOrigin = ""; frame = null; };
  const show = (next) => {
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
    const trigger = event.target.closest("[data-shop-zoom]");
    if (!trigger) return;
    show(Number(trigger.dataset.shopZoom));
    viewer.showModal();
    document.body.classList.add("shop-viewer-open");
  });
  viewer.querySelector(".shop-viewer__close").addEventListener("click", () => viewer.close());
  viewer.querySelectorAll("[data-shop-viewer-step]").forEach((button) =>
    button.addEventListener("click", () => show(index + Number(button.dataset.shopViewerStep))));
  viewer.addEventListener("close", () => { unzoom(); document.body.classList.remove("shop-viewer-open"); });
  image.addEventListener("click", (event) => {
    if (frame) { unzoom(); return; }
    frame = image.getBoundingClientRect();
    pan(event);
    viewer.classList.add("is-zoomed");
  });
  stage.addEventListener("click", (event) => { if (event.target === stage) viewer.close(); });
  stage.addEventListener("pointermove", pan);
  stage.addEventListener("pointerdown", (event) => { swipeStart = frame ? null : event.clientX; });
  stage.addEventListener("pointerup", (event) => {
    if (swipeStart === null || photos.length < 2) return;
    const distance = event.clientX - swipeStart;
    swipeStart = null;
    if (Math.abs(distance) < 60) return;
    const towardsStart = document.documentElement.dir === "rtl" ? distance > 0 : distance < 0;
    show(index + (towardsStart ? 1 : -1));
  });
  viewer.addEventListener("keydown", (event) => {
    if (photos.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    show(index + (event.key === forward ? 1 : -1));
  });
}
