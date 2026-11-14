// The WIFIGATE shop cart, kept in one first-party cookie so the shop, the cart
// drawer and /reservations/ share it. It holds product ids and quantities only:
// no prices, names or account data. Strictly necessary for the cart, so it does
// not wait for analytics consent; see the Cookie Policy.
export const CART_COOKIE = "wifigate_cart";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

// Controllers can be reserved through /reservations/; subscriptions are passed
// to the team with the reservation.
export const CART_CATALOG = Object.freeze([
  { id: "wifigate", name: "WIFIGATE", kind: "controller", max: 50, image: "/assets/img/shop/wifigate-enclosure.webp" },
  { id: "wifigate-roller-shutter", name: "WIFIGATE Roller shutter", kind: "controller", max: 50, image: "/assets/img/shop/3d/roller-front.webp" },
  { id: "wifigate-host", name: "WIFIGATE Host", kind: "subscription", max: 1, image: null, tile: "Host" },
  { id: "wifigate-manager", name: "WIFIGATE Manager", kind: "subscription", max: 1, image: null, tile: "Manager" },
]);

export const cartProduct = (id) => CART_CATALOG.find((product) => product.id === id);

// Cookie value: "wifigate:2,wifigate-host:1", in catalog order.
function serialize(items) {
  return CART_CATALOG
    .map(({ id }) => items.find((item) => item.productId === id))
    .filter(Boolean)
    .map(({ productId, quantity }) => `${productId}:${quantity}`)
    .join(",");
}

export function normalizeCart(items) {
  const quantities = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    const product = cartProduct(item?.productId);
    const quantity = Number(item?.quantity);
    if (!product || !Number.isInteger(quantity) || quantity < 1) continue;
    quantities.set(product.id, Math.min(product.max, (quantities.get(product.id) ?? 0) + quantity));
  }
  return CART_CATALOG.filter(({ id }) => quantities.has(id)).map(({ id }) => ({ productId: id, quantity: quantities.get(id) }));
}

export function readCart(cookies = globalThis.document?.cookie ?? "") {
  const entry = cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${CART_COOKIE}=`));
  if (!entry) return [];
  let value;
  try { value = decodeURIComponent(entry.slice(CART_COOKIE.length + 1)); } catch { return []; }
  return normalizeCart(value.split(",").map((pair) => {
    const [productId, quantity] = pair.split(":");
    return { productId, quantity: Number(quantity) };
  }));
}

export function writeCart(items) {
  const value = serialize(normalizeCart(items));
  const secure = globalThis.location?.protocol === "https:" ? "; Secure" : "";
  document.cookie = value
    ? `${CART_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`
    : `${CART_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
  return readCart();
}
