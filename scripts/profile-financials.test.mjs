import test from "node:test";
import assert from "node:assert/strict";
import { monthlyEstimate, monthlyTotal, revenueTotal } from "../js/profile-financials.js";
const product = (values, currency = "USD") => ({ financials: {
  kind: "monthly-estimate", currency,
  lines: Object.fromEntries(["gates", "dualControls", "groups", "organizations"].map((key, i) => [key, {amountCents: values[i]}])),
  monthlyCents: values.reduce((a, b) => a + b, 0),
}});
test("monthly costs sum separately; Pay revenue is never a subscription cost", () => {
  const products = {host: product([600, 1200, 600, 0]), manager: product([190, 380, 570, 100]), pay: {financials: {kind: "revenue", revenue: {currency: "ILS", amountCents: 12550}}}};
  assert.equal(monthlyEstimate(products.host).monthlyCents, 2400);
  assert.equal(monthlyTotal(products, "en"), "US$36.40");
  assert.match(revenueTotal(products.pay, "en"), /125\.50/);
});
test("missing, inconsistent and negative data stays unavailable instead of zero", () => {
  assert.equal(monthlyEstimate({}), null);
  const invalid = product([1, 2, 3, 4]); invalid.financials.monthlyCents++;
  assert.equal(monthlyEstimate(invalid), null);
  assert.equal(monthlyEstimate(product([-1, 0, 0, 0])), null);
  assert.equal(monthlyTotal({host: product([0, 0, 0, 0]), manager: {}}, "en"), "—");
  assert.equal(revenueTotal({}, "he"), "—");
});
test("different currencies are displayed separately, never numerically combined", () => {
  assert.match(monthlyTotal({host: product([100, 0, 0, 0]), manager: product([200, 0, 0, 0], "ILS")}, "en"), /1\.00.*\+.*2\.00/);
});

test("a product without a plan adds no monthly fee, but an unavailable active estimate stays unknown", () => {
  assert.match(monthlyTotal({host: product([600,0,0,0]),manager:{state:"no-plan"}}, "en"), /6\.00/);
  assert.equal(monthlyTotal({host: product([600,0,0,0]),manager:{state:"active"}}, "en"), "—");
});
