import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const origin = process.env.SITE_URL || "http://127.0.0.1:8000";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
try {
  for (const [path, locale, edge] of [["/shop/", "en", "right"], ["/he/shop/", "he", "left"]]) {
    const context = await browser.newContext({ viewport: { width: 412, height: 800 } });
    const page = await context.newPage();
    page.on("pageerror", (error) => console.error(`${locale} page error:`, error.message));
    await page.goto(origin + path, { waitUntil: "networkidle" });
    assert.equal(await page.locator("html").getAttribute("lang"), locale);
    assert.equal(await page.locator(".site-cart__checkout").isDisabled(), true);
    assert.equal(await page.locator(".site-cart__count").isHidden(), true);
    await page.locator(".nav__toggle").click();
    assert.equal(await page.locator(".nav__links-wrapper").getAttribute("class").then((value) => value.includes("is-open")), true);
    await page.locator(".site-cart__trigger").click();
    assert.equal(await page.locator(".nav__links-wrapper").getAttribute("class").then((value) => value.includes("is-open")), false);
    const position = await page.locator(".site-cart__drawer").boundingBox();
    assert.ok(position);
    assert.ok(edge === "right" ? position.x + position.width >= 411 : position.x <= 1, `${locale}: drawer opens on ${edge}`);
    await page.evaluate(() => window.WIFIGATE_CART.addItem({
      productId: "test-controller", variantId: "black", name: "Test controller", imageUrl: "",
      unitPriceMinor: 12500, currency: "EUR", quantity: 2,
    }));
    assert.equal(await page.locator(".site-cart__count").textContent(), "2");
    assert.equal(await page.locator(".site-cart__item").count(), 1);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator(".site-cart__count").textContent(), "2");
    await page.locator(".site-cart__trigger").click();
    await page.locator(".site-cart__quantity button").last().click();
    assert.equal(await page.locator(".site-cart__count").textContent(), "3");
    await page.locator(".site-cart__remove").click();
    assert.equal(await page.locator(".site-cart__count").isHidden(), true);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".site-cart__drawer").isHidden(), true);
    await context.close();
  }
  console.log("Shop and cart preview: English/Hebrew drawer, badge, quantity, persistence, empty state and disabled checkout verified.");
} finally {
  await browser.close();
}
