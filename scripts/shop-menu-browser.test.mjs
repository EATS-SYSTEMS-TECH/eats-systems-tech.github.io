import assert from "node:assert/strict";
import { chromium } from "playwright-core";

const origin = process.env.SITE_URL || "http://127.0.0.1:8000";
const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || "msedge", headless: true });
try {
  for (const [path, width] of [["/", 940], ["/", 360], ["/he/", 412], ["/he/", 360], ["/shop/", 940], ["/he/shop/", 412]]) {
    const context = await browser.newContext({ viewport: { width, height: 700 } });
    const page = await context.newPage();
    await page.goto(origin + path, { waitUntil: "domcontentloaded" });
    if (path === "/" && width === 360) {
      const hero = await page.evaluate(() => ({
        brandSize: parseFloat(getComputedStyle(document.querySelector(".hero__title-brand")).fontSize),
        copySize: parseFloat(getComputedStyle(document.querySelector(".hero__title-copy")).fontSize),
        buttonColor: getComputedStyle(document.querySelector(".hero__btn-primary")).backgroundColor,
      }));
      assert.ok(hero.brandSize > hero.copySize * 1.5, "WIFIGATE stands out from the smaller statement");
      assert.equal(hero.buttonColor, "rgb(11, 99, 255)", "How it works uses brand blue");
    }
    if (path.endsWith("/shop/")) {
      const shop = await page.evaluate(() => ({
        background: getComputedStyle(document.querySelector(".shop-main")).backgroundImage,
        headingColor: getComputedStyle(document.querySelector(".shop-main h1")).color,
      }));
      assert.ok(shop.background.includes("wifigate_homepage.webp"), "Shop uses the site visual language");
      assert.equal(shop.headingColor, "rgb(255, 255, 255)");
    }
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
    assert.equal(result.background, "rgb(16, 16, 16)", `${path}: collapsed menu stays dark`);
    assert.equal(result.contactBackground, "rgb(11, 99, 255)", `${path}: contact button uses brand blue`);
    assert.equal(result.contactColor, "rgb(255, 255, 255)", `${path}: contact button text stays readable`);
    assert.ok(result.menu.height < 330, `${path}: menu is compact`);
    result.links.slice(0, -1).forEach((link) => assert.equal(link.color, "rgb(247, 247, 247)", `${path}: ${link.text} is readable`));
    result.links.forEach((link) => assert.ok(link.box.y >= result.menu.y && link.box.y + link.box.height <= result.menu.y + result.menu.height, `${path}: ${link.text} remains inside menu`));
    await context.close();
  }
} finally {
  await browser.close();
}
console.log("Home and Shop menu contrast, compact layout, brand styling, and primary CTA verified.");
