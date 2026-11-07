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
