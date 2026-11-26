export const productIds = Object.freeze(["host", "pay", "manager"]);
// WIFIGATE Pay is hidden from the website for now (owner decision,
// 20 November 2026): it is not listed, offered or opened anywhere. The
// identity still carries all three products, so server data stays valid.
export const hiddenProductIds = Object.freeze(["pay"]);
export const visibleProductIds = Object.freeze(productIds.filter((id) => !hiddenProductIds.includes(id)));
const productStates = new Set([
  "active",
  "pending",
  "no-plan",
  "blocked",
  "mfa-required",
  "unavailable",
]);

// The Host plan role: admin (WIFIGATE operator) or user (paying customer).
// null means no plan: an organization member, who never sees My systems.
const hostPlanRoles = new Set(["admin", "user", null]);

export function parsePlatformIdentity(value, expectedUid) {
  const { user, mfa, products } = value || {};
  if (
    !user ||
    typeof user.uid !== "string" ||
    !user.uid ||
    (expectedUid && user.uid !== expectedUid) ||
    typeof user.emailVerified !== "boolean" ||
    typeof mfa?.enrolled !== "boolean" ||
    typeof mfa?.verified !== "boolean"
  ) {
    throw new Error("portal-contract-incomplete");
  }
  for (const id of productIds) {
    const product = products?.[id];
    if (
      !productStates.has(product?.state) ||
      (product.organizations !== undefined &&
        (!Number.isSafeInteger(product.organizations) ||
          product.organizations < 0)) ||
      (!user.emailVerified && product.state === "active") ||
      (id === "host" && !hostPlanRoles.has(product.role ?? null))
    ) {
      throw new Error("portal-contract-incomplete");
    }
  }
  return {
    user,
    mfa,
    platformRole: value.platformRole === "admin" ? "admin" : null,
    ...(Object.hasOwn(value, "factoryAccess") ? { factoryAccess: value.factoryAccess === true } : {}),
    products: {
      ...products,
      host: { ...products.host, role: products.host.role ?? null },
    },
  };
}

export function hasFactoryAccess(identity) {
  return identity?.user?.emailVerified === true &&
    (identity.platformRole === "admin" || identity.factoryAccess === true);
}

export function canOpenFactory(identity) {
  return hasFactoryAccess(identity) && identity.mfa?.enrolled === true && identity.mfa.verified === true;
}

// A Host plan holder pays for Host and has My systems; anyone else in Host is
// an organization member only.
export function hasHostPlan(identity) {
  const role = identity?.products?.host?.role;
  return role === "admin" || role === "user";
}

// Whether a dashboard may open for this product. Host also opens while an
// invitation is pending, with only the join-organization view, so the
// invitation can be accepted there.
export function canOpenProduct(identity, id) {
  if (hiddenProductIds.includes(id)) return false;
  const state = identity?.products?.[id]?.state;
  return state === "active" || (["host", "manager"].includes(id) && state === "pending");
}

// An admitted Factory account can set up its authenticator without a business
// plan. Otherwise no-plan across all products still refuses the sign-in.
export const signInRefusals = Object.freeze(["no-account", "unverified-email"]);

export function signInRefusal(identity) {
  if (hasFactoryAccess(identity)) return null;
  if (!productIds.every((id) => identity.products[id].state === "no-plan"))
    return null;
  return identity.user.emailVerified ? "no-account" : "unverified-email";
}

export function safeDashboardPath(value) {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/dashboard/")
  )
    return null;
  if (/[\\\s\u0000-\u001f\u007f]/.test(value)) return null;
  const path = value.split(/[?#]/, 1)[0];
  if (
    path.includes("%") ||
    path.includes("//") ||
    path.split("/").some((part) => part === "." || part === "..")
  )
    return null;
  const supported =
    path === "/dashboard/" ||
    path === "/dashboard/platform/" ||
    path === "/dashboard/reservations/" ||
    path === "/dashboard/factory/" ||
    path === "/dashboard/manager/platform/" ||
    path === "/dashboard/host/overview/" ||
    visibleProductIds.some((id) => path === `/dashboard/${id}/`);
  if (!supported) return null;
  return value;
}

export function loginDestination(identity, next, language = "en") {
  const safeNext = safeDashboardPath(next);
  const product = safeNext?.split(/[/?#]/)[2];
  if (product === "factory" && hasFactoryAccess(identity)) return safeNext;
  if (["platform", "reservations"].includes(product) && identity.platformRole === "admin") return safeNext;
  if (product && canOpenProduct(identity, product)) return safeNext;
  return language === "he" ? "/dashboard/?lang=he" : "/dashboard/";
}

export function pageLanguage(location = globalThis.location) {
  if (location?.pathname === "/login/") return "en";
  return location?.pathname.startsWith("/he/") ||
    new URLSearchParams(location?.search).get("lang") === "he"
    ? "he"
    : "en";
}

// The sign-in page exists in every site language: /login/ for English and
// /<code>/login/ (lower case) for the rest. A refused session goes back there
// with ?reason= so the page can say why.
export function loginPath(next, language = "en", reason) {
  const path =
    language !== "en" && /^[a-z]{2,3}(-[A-Za-z]{4})?$/.test(language)
      ? `/${language.toLowerCase()}/login/`
      : "/login/";
  const safeNext = safeDashboardPath(next);
  const query = [
    safeNext && `next=${encodeURIComponent(safeNext)}`,
    signInRefusals.includes(reason) && `reason=${reason}`,
  ].filter(Boolean);
  return query.length ? `${path}?${query.join("&")}` : path;
}
