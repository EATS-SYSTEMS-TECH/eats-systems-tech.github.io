import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const origin = process.env.SITE_URL || "http://127.0.0.1:8000";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
try {
  for (const [path, width] of [["/", 940], ["/", 360], ["/he/", 412], ["/he/", 360], ["/shop/", 940], ["/he/shop/", 412], ["/electric-gates/", 940], ["/electric-gates/", 360], ["/he/electric-gates/", 412], ["/privacy-policy/", 940]]) {
    const context = await browser.newContext({ viewport: { width, height: 700 } });
    const page = await context.newPage();
    await page.goto(origin + path, { waitUntil: "domcontentloaded" });
    if (path === "/" && width === 360) {
      const hero = await page.evaluate(() => ({
        headlineSize: parseFloat(getComputedStyle(document.querySelector(".hero__title")).fontSize),
        copySize: parseFloat(getComputedStyle(document.querySelector(".hero__subtitle")).fontSize),
        buttonColor: getComputedStyle(document.querySelector(".hero__btn-primary")).backgroundColor,
      }));
      assert.ok(hero.headlineSize > hero.copySize * 1.5, "The slogan stands out from the smaller product explanation");
      assert.equal(hero.buttonColor, "rgb(20, 107, 255)", "How it works uses brand blue");
    }
    if (path.endsWith("/shop/")) {
      const shop = await page.evaluate(() => {
        const main = document.querySelector(".shop-main");
        return {
          headingText: main.querySelector("h1").textContent.trim(),
          cards: main.querySelectorAll(".shop-product-card").length,
          unavailable: [...main.querySelectorAll(".shop-purchase")].every((button) => button.disabled),
          stock: [...main.querySelectorAll(".shop-stock")].map((element) => element.textContent.trim()),
        };
      });
      assert.ok(shop.headingText, "Shop has a clear catalog heading");
      assert.equal(shop.cards, 2, "Shop presents the two WIFIGATE products");
      assert.equal(shop.unavailable, true, "Unavailable products cannot be purchased");
      assert.ok(shop.stock.length >= 2);
      shop.stock.forEach((status) => assert.match(status, path.startsWith("/he/") ? /אזל מהמלאי/ : /Out of stock/i));
    }
    const header = await page.evaluate(() => {
      const nav = document.querySelector(".site-header");
      return {
        background: getComputedStyle(nav).backgroundColor,
        logoFilter: getComputedStyle(nav.querySelector(".nav__logo")).filter,
        cartColor: getComputedStyle(nav.querySelector(".site-cart__trigger")).color,
      };
    });
    assert.equal(header.background, "rgb(255, 255, 255)", `${path}: header stays white`);
    assert.equal(header.logoFilter, "none", `${path}: logo stays dark`);
    assert.equal(header.cartColor, "rgb(10, 10, 10)", `${path}: cart stays visible`);
    await page.locator(".nav__toggle").click();
    await page.waitForTimeout(250);
    const result = await page.evaluate(() => {
      const menu = document.querySelector(".nav__links-wrapper");
      const links = [...menu.querySelectorAll(".nav__link")];
      const rect = (element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      };
      return {
        menu: rect(menu),
        topbar: rect(menu.querySelector(".topbar-nav")),
        background: getComputedStyle(menu).backgroundColor,
        contactBackground: getComputedStyle(links.at(-1)).backgroundColor,
        contactColor: getComputedStyle(links.at(-1)).color,
        links: links.map((link) => ({ text: link.textContent.trim(), box: rect(link), color: getComputedStyle(link).color })),
      };
    });
    assert.equal(result.links.length, 6);
    assert.equal(result.background, "rgb(255, 255, 255)", `${path}: collapsed menu matches the white homepage menu`);
    assert.equal(result.contactBackground, "rgb(10, 10, 10)", `${path}: contact button is black at rest`);
    assert.equal(result.contactColor, "rgb(255, 255, 255)", `${path}: contact button text stays readable`);
    assert.ok(result.menu.height < 330, `${path}: menu is compact`);
    result.links.slice(0, -1).forEach((link) => assert.equal(link.color, "rgb(36, 36, 36)", `${path}: ${link.text} is readable`));
    result.links.forEach((link) => assert.ok(link.box.y >= result.menu.y && link.box.y + link.box.height <= result.menu.y + result.menu.height, `${path}: ${link.text} remains inside menu`));
    if (path === "/" && width === 940) {
      await page.locator(".topbar-nav .nav__link").nth(1).click();
      await page.waitForFunction(() => location.hash === "#use-cases");
      const scrolledHeader = await page.locator(".site-header").evaluate((element) => getComputedStyle(element).backgroundColor);
      assert.equal(scrolledHeader, "rgb(255, 255, 255)", "Use cases navigation keeps the header white");
    }
    await context.close();
  }
} finally {
  await browser.close();
}
console.log("Shared white header, mobile menu, homepage slogan, Shop styling, and primary CTA verified.");
