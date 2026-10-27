import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { startSite } from "./platform-test-fixtures.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const products = ["wifigate", "wifigate-roller-shutter"];
const widths = [360, 390, 1440];

function shopPath(locale, product) {
  return `${locale === "en" ? "" : `/${locale.toLowerCase()}`}/shop/${product ? `${product}/` : ""}`;
}

async function openShop(browser, origin, locale, width, product) {
  const context = await browser.newContext({ viewport: { width, height: 920 } });
  const page = await context.newPage();
  const pageErrors = [];
  const localFailures = [];
  const writes = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.url().startsWith(origin) && response.status() >= 400)
      localFailures.push({ url: response.url(), status: response.status() });
  });
  // These are public static catalog checks. Keep authentication, telemetry and
  // any prospective purchase endpoint out of the isolated browser session.
  await context.route("**/*", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      writes.push({ method: request.method(), url: request.url() });
      return route.abort();
    }
    if (!request.url().startsWith(origin)) return route.abort();
    return route.continue();
  });
  await page.goto(origin + shopPath(locale, product), { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.WIFIGATE_CART));
  return { context, page, pageErrors, localFailures, writes };
}

async function assertSharedCatalog(page, locale, width, product) {
  const content = page.locator(product ? ".shop-product-detail" : ".shop-main");
  assert.equal(await page.locator("html").getAttribute("lang"), locale);
  assert.equal(await page.locator("link[rel='canonical']").getAttribute("href"),
    "https://wifigate.io" + shopPath(locale, product));
  assert.equal(await content.getAttribute("lang"), locale === "he" ? "he" : "en");
  assert.equal(await content.getAttribute("dir"), locale === "he" ? "rtl" : "ltr");
  assert.equal(await page.locator(".shop-main h1").count(), 1);
  const mainText = await page.locator(".shop-main").innerText();
  assert.doesNotMatch(mainText, /[$€₪£]\s*\d|\d\s*[$€₪£]/, "No unverified price is published");
  const purchases = page.locator(".shop-purchase");
  assert.equal(await purchases.count(), product ? 1 : 0,
    "Catalog cards navigate to details; only the detail has a disabled purchase control");
  for (const purchase of await purchases.all()) {
    assert.equal(await purchase.isDisabled(), true, "Out of stock prevents purchasing");
    assert.match(await purchase.innerText(), locale === "he" ? /אזל מהמלאי/ : /Out of stock/i);
  }
  for (const stock of await page.locator(".shop-stock").all())
    assert.match(await stock.innerText(), locale === "he" ? /אזל מהמלאי/ : /Out of stock/i);
  assert.ok(await page.locator(".shop-main a[href$='#get-in-touch']").count(), "Contact remains available");
  assert.equal(await page.locator(".shop-main a[href*='reservations']").count(), 0,
    "Unavailable products do not lead to a reservation or purchase flow");
  const geometry = await page.evaluate(() => {
    const main = document.querySelector(".shop-main");
    return {
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clipped: [...main.querySelectorAll("h1, .shop-product-card, .shop-purchase")].filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1);
      }).map((element) => element.className),
    };
  });
  assert.ok(geometry.scrollWidth <= width + 1, `No horizontal overflow at ${width}px`);
  assert.deepEqual(geometry.clipped, [], "Main controls and cards remain inside the viewport");
  await page.locator(".shop-main img").evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      image.loading = "eager";
      await image.decode().catch(() => {});
    }));
  });
  const brokenImages = await page.locator(".shop-main img").evaluateAll((images) =>
    images.filter((image) => !image.getAttribute("src") || !image.complete || !image.naturalWidth).map((image) => image.getAttribute("src")));
  assert.deepEqual(brokenImages, [], "There are no empty or broken catalog images");
  if (!product || product === "wifigate-roller-shutter") {
    const noImage = page.locator(product ? ".shop-no-image" : "[data-product='wifigate-roller-shutter'] .shop-no-image");
    assert.equal(await noImage.count(), 1);
    assert.equal(await noImage.locator("img, picture, svg, canvas, video").count(), 0,
      "Roller shutter deliberately has no illustration or product image");
    assert.equal(await noImage.evaluate((element) => getComputedStyle(element).backgroundImage), "none");
  }
  if (!product || product === "wifigate")
    assert.ok(await page.locator(product ? ".shop-product-detail img" : "[data-product='wifigate'] img").count(), "WIFIGATE keeps its real product photo");
  assert.equal(await page.locator(".language-selector__option").count(), SITE_LANGUAGES.length);
  for (const { code } of SITE_LANGUAGES)
    assert.equal(await page.locator(`.language-selector__option[data-lang='${code}']`).getAttribute("href"), shopPath(code, product),
      "The language menu preserves the product route");
}

async function screenshot(page, name) {
  if (!process.env.SHOP_SCREENSHOTS) return;
  await mkdir(process.env.SHOP_SCREENSHOTS, { recursive: true });
  const rejectCookies = page.locator("[data-cookie-reject]");
  if (await rejectCookies.isVisible()) await rejectCookies.click();
  await page.locator("img").evaluateAll(async (images) => {
    await Promise.all(images.map(async (image) => {
      image.loading = "eager";
      await image.decode().catch(() => {});
    }));
  });
  await page.screenshot({ path: path.join(process.env.SHOP_SCREENSHOTS, `${name}-clean.png`), fullPage: true, animations: "disabled" });
}

test("English and Hebrew shop catalog and details are responsive and consistently unavailable", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const locale of ["en", "he"]) {
    for (const width of widths) {
      for (const product of [undefined, ...products]) {
        const fixture = await openShop(browser, origin, locale, width, product);
        const { page, context } = fixture;
        try {
          await assertSharedCatalog(page, locale, width, product);
          if (!product) {
            assert.equal(await page.locator(".shop-grid .shop-product-card").count(), 2);
            for (const id of products) {
              const card = page.locator(`.shop-product-card[data-product='${id}']`);
              assert.ok(await card.locator(`a[href='${shopPath(locale, id)}']`).count(), "Cards lead to their dedicated product details");
            }
            if (width === 1440) {
              const cards = await page.locator(".shop-product-card").all();
              const [first, second] = await Promise.all(cards.map((card) => card.boundingBox()));
              assert.ok(Math.abs(first.y - second.y) < 2, "Desktop catalog has an aligned product grid");
            }
          } else {
            assert.equal(await page.locator(".shop-product-detail").getAttribute("data-product"), product);
            assert.ok(await page.locator("details.shop-accordion > summary").count());
          }
          if (width === 390 || width === 1440) await screenshot(page, `shop-${locale}-${product ?? "catalog"}-${width}`);
          assert.deepEqual(fixture.localFailures, []);
          assert.deepEqual(fixture.pageErrors, []);
          assert.deepEqual(fixture.writes, []);
        } finally { await context.close(); }
      }
    }
  }
});

test("product keyboard navigation, native accordions and deep-route header cart remain usable without ordering", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const locale of ["en", "he"]) {
    const { page, context, pageErrors, localFailures, writes } = await openShop(browser, origin, locale, 390, "wifigate-roller-shutter");
    try {
      const summary = page.locator("details.shop-accordion > summary").first();
      const before = await summary.evaluate((element) => element.parentElement.open);
      await summary.focus();
      await page.keyboard.press("Enter");
      assert.equal(await summary.evaluate((element) => element.parentElement.open), !before);
      await page.keyboard.press("Space");
      assert.equal(await summary.evaluate((element) => element.parentElement.open), before);
      const storageBefore = await page.evaluate(() => localStorage.getItem("wifigate-cart-v1"));
      await page.locator(".shop-purchase").evaluate((element) => element.click());
      assert.deepEqual(await page.evaluate(() => window.WIFIGATE_CART.getItems()), []);
      assert.equal(await page.evaluate(() => localStorage.getItem("wifigate-cart-v1")), storageBefore);
      assert.equal(await page.locator(".site-cart__count").isHidden(), true);
      const cart = page.locator(".site-cart__trigger");
      await cart.focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator(".site-cart__drawer").isVisible(), true);
      assert.equal(await page.locator(".site-cart__checkout").isDisabled(), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.locator(".site-cart__drawer").isHidden(), true);
      assert.equal(await cart.evaluate((element) => element === document.activeElement), true);
      await page.locator(".nav__toggle").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator(".nav__toggle").getAttribute("aria-expanded"), "true");
      const home = locale === "he" ? "/he/" : "/";
      assert.equal(await page.locator(".topbar-nav .nav__contact-link").getAttribute("href"), `${home}#get-in-touch`);
      await page.locator(".nav__toggle").click();
      await page.locator("#language-button").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator("#language-button").getAttribute("aria-expanded"), "true");
      const nextLocale = locale === "he" ? "en" : "he";
      await page.locator(`.language-selector__option[data-lang='${nextLocale}']`).click();
      await page.waitForURL(origin + shopPath(nextLocale, "wifigate-roller-shutter"));
      assert.equal(await page.locator(".shop-product-detail").getAttribute("data-product"), "wifigate-roller-shutter");
      assert.deepEqual(writes, []);
      assert.deepEqual(localFailures, []);
      assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
  }
});

test("Arabic shop pages preserve the localized shell with explicitly English left-to-right catalog content", async (t) => {
  const { origin, browser } = await startSite(t);
  for (const product of [undefined, ...products]) {
    const { page, context, pageErrors, localFailures, writes } = await openShop(browser, origin, "ar", 390, product);
    try {
      await assertSharedCatalog(page, "ar", 390, product);
      assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
      assert.equal(await page.locator(product ? ".shop-product-detail" : ".shop-main").evaluate((element) => getComputedStyle(element).direction), "ltr");
      assert.deepEqual(pageErrors, []);
      assert.deepEqual(localFailures, []);
      assert.deepEqual(writes, []);
    } finally { await context.close(); }
  }
});
