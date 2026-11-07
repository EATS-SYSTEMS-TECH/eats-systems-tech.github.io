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
    assert.equal(await page.locator(".site-cart__checkout").isDisabled(), true, "An empty cart cannot continue");
    assert.equal(await page.locator(".site-cart__count").isHidden(), true);
    await page.locator(".nav__toggle").click();
    assert.equal(await page.locator(".nav__links-wrapper").getAttribute("class").then((value) => value.includes("is-open")), true);
    await page.locator(".site-cart__trigger").click();
    assert.equal(await page.locator(".nav__links-wrapper").getAttribute("class").then((value) => value.includes("is-open")), false);
    const position = await page.locator(".site-cart__drawer").boundingBox();
    assert.ok(position);
    assert.ok(edge === "right" ? position.x + position.width >= 411 : position.x <= 1, `${locale}: drawer opens on ${edge}`);
    await page.keyboard.press("Escape");
    // Add from the shop buttons: a controller twice and a subscription twice (subscriptions stay at one).
    for (const id of ["wifigate", "wifigate", "wifigate-host", "wifigate-host"]) {
      await page.locator(`[data-shop-cart='${id}']`).click();
      await page.keyboard.press("Escape");
    }
    assert.equal(await page.locator(".site-cart__count").textContent(), "3");
    const cookie = (await context.cookies()).find(({ name }) => name === "wifigate_cart");
    assert.equal(decodeURIComponent(cookie.value), "wifigate:2,wifigate-host:1", "The cart lives in its own cookie");
    assert.equal(cookie.path, "/");
    assert.equal(cookie.sameSite, "Lax");
    assert.ok(cookie.expires > Date.now() / 1000 + 29 * 24 * 3600, "The cart cookie lasts 30 days");
    assert.equal(await page.evaluate(() => localStorage.getItem("wifigate-cart-v1")), null, "Nothing is kept in local storage");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.locator(".site-cart__count").textContent(), "3", "The cart survives a reload");
    await page.locator(".site-cart__trigger").click();
    assert.equal(await page.locator(".site-cart__item").count(), 2);
    assert.equal(await page.locator(".site-cart__item[data-product='wifigate-host'] .site-cart__quantity").count(), 0, "A subscription has no quantity");
    await page.locator(".site-cart__item[data-product='wifigate'] .site-cart__quantity button").last().click();
    assert.equal(await page.locator(".site-cart__count").textContent(), "4");
    await page.locator(".site-cart__item[data-product='wifigate-host'] .site-cart__remove").click();
    assert.equal(await page.locator(".site-cart__count").textContent(), "3");
    assert.doesNotMatch(await page.locator(".site-cart__drawer").innerText(), /[$€₪£]\s*\d|\d\s*[$€₪£]/, "No unverified price is shown");
    // A tampered cookie keeps only known products within their limits.
    await context.addCookies([{ name: "wifigate_cart", value: encodeURIComponent("wifigate:999,unknown:3,wifigate-manager:4"), url: origin }]);
    await page.reload({ waitUntil: "networkidle" });
    assert.deepEqual(await page.evaluate(() => window.WIFIGATE_CART.getItems()), [{ productId: "wifigate", quantity: 50 }, { productId: "wifigate-manager", quantity: 1 }]);
    await page.locator(".site-cart__trigger").click();
    await page.locator(".site-cart__checkout").click();
    await page.waitForURL(origin + (locale === "he" ? "/he/#get-in-touch" : "/#get-in-touch"), { waitUntil: "commit" });
    assert.equal(await page.locator(".site-cart__checkout").textContent(), locale === "he" ? "צרו קשר כדי להירשם לרשימת ההמתנה" : "Contact us to join the waitlist");
    await page.goto(origin + path, { waitUntil: "networkidle" });
    await page.evaluate(() => window.WIFIGATE_CART.clear());
    assert.equal(await page.locator(".site-cart__count").isHidden(), true);
    assert.equal((await context.cookies()).some(({ name }) => name === "wifigate_cart"), false, "Emptying the cart removes its cookie");
    await context.close();
  }
  console.log("Shop cart: English/Hebrew drawer, shop buttons, cookie persistence and limits, quantity, removal, empty state and waitlist contact verified.");
} finally {
  await browser.close();
}
