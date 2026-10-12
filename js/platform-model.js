export const productIds = Object.freeze(["host", "pay", "manager"]);
const productStates = new Set([
  "active",
  "pending",
  "no-plan",
  "blocked",
  "mfa-required",
  "unavailable",
]);

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
      (!user.emailVerified && product.state === "active")
    ) {
      throw new Error("portal-contract-incomplete");
    }
  }
  return { user, mfa, products };
}

// Sign-in is refused when no product is open to the account at all: every
// product answers no-plan (an unverified email always does). The reason names
// the message the sign-in page shows.
export const signInRefusals = Object.freeze(["no-account", "unverified-email"]);

export function signInRefusal(identity) {
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
    path === "/dashboard/host/overview/" ||
    productIds.some((id) => path === `/dashboard/${id}/`);
  if (!supported) return null;
  return value;
}

export function loginDestination(identity, next, language = "en") {
  const safeNext = safeDashboardPath(next);
  const product = safeNext?.split(/[/?#]/)[2];
  if (product && identity.products[product]?.state === "active")
    return safeNext;
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
