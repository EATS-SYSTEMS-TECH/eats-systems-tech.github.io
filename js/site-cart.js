// Preview cart UI. Checkout is deliberately unavailable until a server-side
// catalog, order API and payment provider are connected.
(() => {
  const trigger = document.querySelector(".site-cart__trigger");
  const drawer = document.querySelector(".site-cart__drawer");
  const backdrop = document.querySelector(".site-cart__backdrop");
  if (!trigger || !drawer || !backdrop) return;

  const STORAGE_KEY = "wifigate-cart-v1";
  const MAX_QUANTITY = 99;
  const badge = trigger.querySelector(".site-cart__count");
  const closeButton = drawer.querySelector(".site-cart__close");
  const list = drawer.querySelector(".site-cart__items");
  const empty = drawer.querySelector(".site-cart__empty");
  const subtotal = drawer.querySelector(".site-cart__subtotal strong");
  const copy = JSON.parse(drawer.dataset.cartCopy || "{}");
  const isHebrew = document.documentElement.lang === "he";
  let items = readItems();
  let focusBeforeOpen = null;

  function validItem(item) {
    return item && typeof item.productId === "string" && item.productId.length > 0 && item.productId.length <= 120 &&
      typeof item.variantId === "string" && item.variantId.length <= 120 &&
      typeof item.name === "string" && item.name.trim() && item.name.length <= 200 &&
      Number.isSafeInteger(item.unitPriceMinor) && item.unitPriceMinor >= 0 &&
      typeof item.currency === "string" && /^[A-Z]{3}$/.test(item.currency) &&
      Number.isInteger(item.quantity) && item.quantity >= 1 && item.quantity <= MAX_QUANTITY &&
      (item.imageUrl === "" || (typeof item.imageUrl === "string" && /^\/(?!\/)/.test(item.imageUrl)));
  }

  function readItems() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(validItem).slice(0, 100) : [];
    } catch {
      return [];
    }
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* Storage may be disabled. */ }
    render();
    window.dispatchEvent(new CustomEvent("wifigate:cart-change", { detail: { items: getItems() } }));
  }

  function getItems() { return items.map((item) => ({ ...item })); }
  function keyOf(item) { return `${item.productId}\u0000${item.variantId}`; }

  function addItem(input) {
    const candidate = {
      productId: input?.productId,
      variantId: input?.variantId || "",
      name: input?.name,
      imageUrl: input?.imageUrl || "",
      unitPriceMinor: input?.unitPriceMinor,
      currency: input?.currency,
      quantity: input?.quantity ?? 1,
    };
    if (!validItem(candidate)) throw new TypeError("Invalid cart item");
    if (items.length && items[0].currency !== candidate.currency) throw new Error("Cart currency mismatch");
    const existing = items.find((item) => keyOf(item) === keyOf(candidate));
    if (existing) existing.quantity = Math.min(MAX_QUANTITY, existing.quantity + candidate.quantity);
    else items.push(candidate);
    save();
    return getItems();
  }

  function setQuantity(productId, variantId = "", quantity) {
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > MAX_QUANTITY) throw new TypeError("Invalid quantity");
    const index = items.findIndex((item) => item.productId === productId && item.variantId === variantId);
    if (index < 0) return getItems();
    if (quantity === 0) items.splice(index, 1);
    else items[index].quantity = quantity;
    save();
    return getItems();
  }

  function money(minor, currency) {
    try {
      const formatter = new Intl.NumberFormat(isHebrew ? "he-IL" : "en", { style: "currency", currency });
      return formatter.format(minor / 10 ** formatter.resolvedOptions().maximumFractionDigits);
    } catch { return `${(minor / 100).toFixed(2)} ${currency}`; }
  }

  function makeButton(text, label, action, item) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = text;
    button.setAttribute("aria-label", `${label}: ${item.name}`);
    button.addEventListener("click", action);
    return button;
  }

  function render() {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    badge.hidden = count === 0;
    badge.textContent = count > 99 ? "99+" : String(count);
    trigger.setAttribute("aria-label", count ? `${copy.trigger}, ${count} ${isHebrew ? "פריטים" : "items"}` : copy.trigger);
    empty.hidden = items.length > 0;
    list.hidden = items.length === 0;
    list.replaceChildren();
    for (const item of items) {
      const row = document.createElement("li");
      row.className = "site-cart__item";
      if (item.imageUrl) {
        const image = document.createElement("img");
        image.className = "site-cart__image";
        image.src = item.imageUrl;
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
      const name = document.createElement("p");
      name.className = "site-cart__item-name";
      name.textContent = item.name;
      const price = document.createElement("span");
      price.className = "site-cart__item-price";
      price.textContent = money(item.unitPriceMinor, item.currency);
      const quantity = document.createElement("div");
      quantity.className = "site-cart__quantity";
      quantity.append(
        makeButton("−", copy.decrease, () => setQuantity(item.productId, item.variantId, item.quantity - 1), item),
        Object.assign(document.createElement("output"), { textContent: String(item.quantity) }),
        makeButton("+", copy.increase, () => setQuantity(item.productId, item.variantId, Math.min(MAX_QUANTITY, item.quantity + 1)), item)
      );
      const remove = makeButton(isHebrew ? "הסרה" : "Remove", copy.remove, () => setQuantity(item.productId, item.variantId, 0), item);
      remove.className = "site-cart__remove";
      details.append(name, price, quantity, remove);
      row.append(details);
      list.append(row);
    }
    if (!items.length) subtotal.textContent = "—";
    else subtotal.textContent = money(items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0), items[0].currency);
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
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) { items = readItems(); render(); }
  });
  window.WIFIGATE_CART = Object.freeze({ addItem, setQuantity, getItems, open: openCart, close: closeCart });
  render();
})();
