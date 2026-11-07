// The site cart drawer. Items live in the wifigate_cart cookie (cart-cookie.js).
// Products are not on sale yet, so the cart leads to the contact section to join
// the waitlist; there is no online payment.
import { CART_CATALOG, cartProduct, normalizeCart, readCart, writeCart } from "./cart-cookie.js?v=20261108a";

const trigger = document.querySelector(".site-cart__trigger");
const drawer = document.querySelector(".site-cart__drawer");
const backdrop = document.querySelector(".site-cart__backdrop");

if (trigger && drawer && backdrop) {
  const badge = trigger.querySelector(".site-cart__count");
  const closeButton = drawer.querySelector(".site-cart__close");
  const list = drawer.querySelector(".site-cart__items");
  const empty = drawer.querySelector(".site-cart__empty");
  const checkout = drawer.querySelector(".site-cart__checkout");
  const copy = JSON.parse(drawer.dataset.cartCopy || "{}");
  const isHebrew = document.documentElement.lang === "he";
  const text = isHebrew
    ? { items: "פריטים", remove: "הסרה", controller: "בקר", subscription: "מנוי", subscriptionNote: "הצוות יתאם איתכם את המסלול" }
    : { items: "items", remove: "Remove", controller: "Controller", subscription: "Subscription", subscriptionNote: "Our team will arrange the plan with you" };
  // Earlier preview builds kept a priced test cart in local storage.
  try { localStorage.removeItem("wifigate-cart-v1"); } catch { /* Storage may be disabled. */ }
  // The cookie is the source of truth; memory keeps the cart usable when cookies are blocked.
  let items = readCart();
  let focusBeforeOpen = null;

  function save(next) {
    const wanted = normalizeCart(next);
    const stored = writeCart(wanted);
    items = stored.length === wanted.length ? stored : wanted;
    render();
    window.dispatchEvent(new CustomEvent("wifigate:cart-change", { detail: { items: getItems() } }));
    return getItems();
  }

  function getItems() { return items.map((item) => ({ ...item })); }

  function addItem({ productId, quantity = 1 } = {}) {
    const product = cartProduct(productId);
    if (!product || !Number.isInteger(quantity) || quantity < 1) throw new TypeError("Invalid cart item");
    const current = items.find((item) => item.productId === productId)?.quantity ?? 0;
    return save([...items.filter((item) => item.productId !== productId), { productId, quantity: Math.min(product.max, current + quantity) }]);
  }

  function setQuantity(productId, quantity) {
    const product = cartProduct(productId);
    if (!product || !Number.isInteger(quantity) || quantity < 0) throw new TypeError("Invalid quantity");
    const rest = items.filter((item) => item.productId !== productId);
    return save(quantity === 0 ? rest : [...rest, { productId, quantity: Math.min(product.max, quantity) }]);
  }

  function clear() { return save([]); }

  function makeButton(label, action, product, content) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = content;
    button.setAttribute("aria-label", `${label}: ${product.name}`);
    button.addEventListener("click", action);
    return button;
  }

  function render() {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    badge.hidden = count === 0;
    badge.textContent = count > 99 ? "99+" : String(count);
    trigger.setAttribute("aria-label", count ? `${copy.trigger}, ${count} ${text.items}` : copy.trigger);
    empty.hidden = items.length > 0;
    list.hidden = items.length === 0;
    checkout.disabled = items.length === 0;
    list.replaceChildren();
    for (const { productId, quantity } of items) {
      const product = cartProduct(productId);
      const row = document.createElement("li");
      row.className = "site-cart__item";
      row.dataset.product = productId;
      if (product.image) {
        const image = document.createElement("img");
        image.className = "site-cart__image";
        image.src = product.image;
        image.alt = "";
        image.width = 80;
        image.height = 80;
        row.append(image);
      } else {
        const placeholder = document.createElement("span");
        placeholder.className = "site-cart__image-placeholder";
        placeholder.textContent = "W";
        placeholder.setAttribute("aria-hidden", "true");
        row.append(placeholder);
      }
      const details = document.createElement("div");
      const kind = document.createElement("span");
      kind.className = `site-cart__kind site-cart__kind--${product.kind}`;
      kind.textContent = text[product.kind];
      const name = document.createElement("p");
      name.className = "site-cart__item-name";
      name.dir = "ltr";
      name.textContent = product.name;
      details.append(kind, name);
      if (product.max > 1) {
        const control = document.createElement("div");
        control.className = "site-cart__quantity";
        const less = makeButton(copy.decrease, () => setQuantity(productId, quantity - 1), product, "−");
        const more = makeButton(copy.increase, () => setQuantity(productId, quantity + 1), product, "+");
        more.disabled = quantity >= product.max;
        control.append(less, Object.assign(document.createElement("output"), { textContent: String(quantity) }), more);
        details.append(control);
      } else {
        const note = document.createElement("span");
        note.className = "site-cart__item-note";
        note.textContent = text.subscriptionNote;
        details.append(note);
      }
      const remove = makeButton(copy.remove, () => setQuantity(productId, 0), product, text.remove);
      remove.className = "site-cart__remove";
      details.append(remove);
      row.append(details);
      list.append(row);
    }
  }

  function closeCart() {
    if (drawer.hidden) return;
    drawer.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove("site-cart-open");
    trigger.setAttribute("aria-expanded", "false");
    if (focusBeforeOpen?.isConnected) focusBeforeOpen.focus();
    focusBeforeOpen = null;
  }

  function openCart() {
    focusBeforeOpen = document.activeElement;
    const nav = document.querySelector(".nav__links-wrapper");
    nav?.classList.remove("is-open");
    document.querySelector(".nav__toggle")?.setAttribute("aria-expanded", "false");
    const account = document.querySelector(".site-account");
    account?.classList.remove("is-open");
    const accountPanel = account?.querySelector(".site-account__panel");
    if (accountPanel) accountPanel.hidden = true;
    account?.querySelector(".site-account__button")?.setAttribute("aria-expanded", "false");
    document.querySelector(".language-selector")?.classList.remove("is-open");
    document.querySelector("#language-button")?.setAttribute("aria-expanded", "false");
    drawer.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add("site-cart-open");
    trigger.setAttribute("aria-expanded", "true");
    closeButton.focus();
  }

  trigger.addEventListener("click", () => drawer.hidden ? openCart() : closeCart());
  closeButton.addEventListener("click", closeCart);
  backdrop.addEventListener("click", closeCart);
  checkout.addEventListener("click", () => {
    if (!items.length) return;
    // The header's contact link already points at this locale's home page.
    const contact = new URL(document.querySelector(".nav__contact-link")?.getAttribute("href") || "/#get-in-touch", location.href);
    closeCart();
    if (contact.pathname === location.pathname) document.getElementById(contact.hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
    location.assign(contact.href);
  });
  document.addEventListener("keydown", (event) => {
    if (drawer.hidden) return;
    if (event.key === "Escape") { event.preventDefault(); closeCart(); return; }
    if (event.key !== "Tab") return;
    const controls = [...drawer.querySelectorAll("button:not([disabled]), a[href]")];
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener("click", (event) => {
    if (!drawer.hidden && event.target.closest(".nav__toggle, .site-account__button, .language-selector__button")) closeCart();
  }, true);
  // Cookies raise no storage event: pick up changes from other tabs on return.
  const refresh = () => { if (navigator.cookieEnabled && document.visibilityState === "visible") { items = readCart(); render(); } };
  document.addEventListener("visibilitychange", refresh);
  window.addEventListener("pageshow", refresh);
  window.WIFIGATE_CART = Object.freeze({ addItem, setQuantity, clear, getItems, products: CART_CATALOG, open: openCart, close: closeCart });
  render();
}
