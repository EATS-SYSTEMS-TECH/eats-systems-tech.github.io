document.addEventListener("DOMContentLoaded", () => {
  if (typeof setupNav === "function") setupNav();
});

// Online ordering is not open yet: "Add to cart" opens the cart, which says so,
// without storing a product or an unverified price.
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-shop-cart]");
  if (!button) return;
  event.preventDefault();
  window.WIFIGATE_CART?.open();
});
