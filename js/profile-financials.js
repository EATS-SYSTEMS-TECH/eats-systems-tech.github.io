export const costCategories = ["gates", "dualControls", "groups", "organizations"];
const money = (value) => Number.isSafeInteger(value) && value >= 0;
const currency = (value) => typeof value === "string" && /^[A-Z]{3}$/.test(value);
export const unavailableLabel = language => language === "he" ? "לא זמין" : "Unavailable";

export function monthlyEstimate(product) {
  const value = product?.financials;
  if (value?.kind !== "monthly-estimate" || !currency(value.currency)) return null;
  if (!costCategories.every(key => money(value.lines?.[key]?.amountCents))) return null;
  const total = costCategories.reduce((sum, key) => sum + value.lines[key].amountCents, 0);
  if (!money(total) || total !== value.monthlyCents) return null;
  if (product.billingExempt === true || value.billingExempt === true) return {
    ...value, billingExempt: true, exemptionReason: "platform-admin", monthlyCents: 0,
    lines: Object.fromEntries(costCategories.map(key=>[key,{...value.lines[key],amountCents:0}])),
  };
  return value;
}

export function formatMoney(amountCents, code, language) {
  if (!money(amountCents) || !currency(code)) return language === "he" ? "לא זמין" : "Unavailable";
  return new Intl.NumberFormat(language === "he" ? "he-IL" : "en-GB", {
    style: "currency", currency: code,
  }).format(amountCents / 100);
}

export function monthlyTotal(products, language) {
  const estimates = [products.host, products.manager]
    .filter(product => !["no-plan", "blocked", "pending"].includes(product?.state))
    .map(monthlyEstimate);
  if (estimates.some(value => !value)) return language === "he" ? "לא זמין" : "Unavailable";
  if (!estimates.length) return formatMoney(0, "USD", language);
  const totals = new Map();
  for (const estimate of estimates) {
    const total = (totals.get(estimate.currency) ?? 0) + estimate.monthlyCents;
    if (!money(total)) return language === "he" ? "לא זמין" : "Unavailable";
    totals.set(estimate.currency, total);
  }
  return [...totals].map(([code, cents]) => formatMoney(cents, code, language)).join(" + ");
}

export function revenueTotal(product, language) {
  const value = product?.financials;
  if (value?.kind !== "revenue") return language === "he" ? "לא זמין" : "Unavailable";
  return formatMoney(value.revenue?.amountCents, value.revenue?.currency, language);
}
