import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright-core";
import { load } from "cheerio";

const styles = await readFile(new URL("../css/styles.css", import.meta.url), "utf8");
const accessibility = await readFile(new URL("../css/accessibility.css", import.meta.url), "utf8");
const guestInvites = await readFile(new URL("../css/guest-invites.css", import.meta.url), "utf8");
const homeTemplate = load(await readFile(new URL("../templates/index.template.html", import.meta.url), "utf8"));
const hostPromo = homeTemplate.html(homeTemplate("#guest-invites-api"));
const surface = ["site-header", "feature-card", "contact-cta", "where-showcase", "where-story-card",
  "where-story-card__item", "where-story-card__video-frame", "where-story-card__video-screen",
  "where-story-card__bullet", "where-story-card__win", "where-story-card__badge", "where-story-card__close",
  "language-selector__button", "language-selector__dropdown", "a11y-panel", "a11y-option"];
const subdued = ["section__subtitle", "feature-card__text", "about__text", "contact-cta__text",
  "where-story-card__pitch", "where-story-card__value", "where-story-card__video-note",
  "where-story-card__bullet-value", "where-story-card__win-text", "where-list__item--static",
  "a11y-option__description", "a11y-panel__description"];
const ink = ["where-story-card__video-label", "where-story-card__video-status", "where-story-card__summary-label",
  "where-story-card__decision-title", "where-story-card__bullet-label", "where-story-card__win-label",
  "where-story-card__badge", "where-list__link", "where-story-card__close"];
const classes = [...new Set([...surface, ...subdued, ...ink])];

test("Host promo preserves full band layout, icon/text sizing, overlay and the exact 900px breakpoint", async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const width of [375, 900, 901, 1440]) for (const dir of ["ltr", "rtl"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        // Render the real source template with local presentation only. Network
        // assets and product scripts do not participate in this style contract.
        await page.route("**/*", route => route.abort());
        await page.setContent(`<html dir="${dir}"><head><style>${styles}\n${guestInvites}</style></head>
          <body class="${dir === "rtl" ? "rtl" : ""}">${hostPromo}</body></html>`);
        const result = await page.evaluate(() => {
          const css = selector => getComputedStyle(document.querySelector(selector));
          const grid = css(".guest-invites__grid"), title = css(".guest-invites__title");
          const points = css(".guest-invites__points"), icon = css(".guest-invites__point-icon");
          const vector = css(".guest-invites__point-icon svg"), pointTitle = css(".guest-invites__point-title");
          const overlay = getComputedStyle(document.querySelector(".guest-invites"), "::before");
          return { columns: grid.gridTemplateColumns.split(" ").length, display: grid.display,
            titleColor: title.color, lineBreaks: title.whiteSpace, pointsDisplay: points.display,
            pointsGap: points.rowGap, icon: [icon.width, icon.height], vector: [vector.width, vector.height],
            pointTitleColor: pointTitle.color, pointTitleWeight: pointTitle.fontWeight,
            overlayPointer: overlay.pointerEvents, overlayGrid: overlay.backgroundSize, mask: overlay.maskImage };
        });
        assert.equal(result.columns, width <= 900 ? 1 : 2, `${width}/${dir}`);
        assert.equal(result.display, "grid"); assert.equal(result.pointsDisplay, "grid");
        assert.equal(result.titleColor, "rgb(255, 255, 255)"); assert.equal(result.lineBreaks, "pre-line");
        assert.equal(result.pointsGap, "17.6px"); assert.deepEqual(result.icon, ["40px", "40px"]);
        for (const dimension of result.vector) assert.ok(Math.abs(parseFloat(dimension) - 20.8) < .01);
        assert.equal(result.pointTitleColor, "rgb(255, 255, 255)"); assert.equal(result.pointTitleWeight, "700");
        assert.equal(result.overlayPointer, "none"); assert.equal(result.overlayGrid, "38px 38px, 38px 38px");
        assert.notEqual(result.mask, "none");
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});

test("high contrast retains surfaces, text, active indicators and focus in mobile/desktop LTR/RTL", async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const width of [393, 1280]) for (const dir of ["ltr", "rtl"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        // Reject network assets; computed presentation uses the real local CSS.
        await page.route("**/*", (route) => route.abort());
        await page.setContent(`<html dir="${dir}" class="a11y-high-contrast"><head><style>${styles}\n${accessibility}</style></head><body>
          ${classes.map((name) => `<div data-probe="${name}" class="${name}">Readable fixture</div>`).join("")}
          <a data-probe="active" class="where-list__link is-active">Active</a>
          <button data-probe="ghost" class="btn btn--ghost">Action</button>
          <div data-probe="alternate" class="section--alt">Alternate</div></body></html>`);
        const computed = await page.evaluate(() => Object.fromEntries([
          ["body", document.body], ...[...document.querySelectorAll("[data-probe]")].map((el) => [el.dataset.probe, el]),
        ].map(([key, el]) => {
          const css = getComputedStyle(el);
          return [key, { color: css.color, background: css.backgroundColor, border: css.borderTopColor,
            shadow: css.boxShadow, before: getComputedStyle(el, "::before").opacity,
            after: getComputedStyle(el, "::after").opacity }];
        })));
        const context = `${width}px/${dir}`;
        assert.equal(computed.body.background, "rgb(255, 255, 255)", context);
        assert.equal(computed.body.color, "rgb(2, 6, 23)", context);
        for (const name of surface) assert.equal(computed[name].background, "rgb(255, 255, 255)", `${context}/${name}`);
        for (const name of subdued) assert.equal(computed[name].color, "rgb(30, 41, 59)", `${context}/${name}`);
        for (const name of ink) assert.equal(computed[name].color, "rgb(2, 6, 23)", `${context}/${name}`);
        assert.equal(computed.active.background, "rgb(255, 255, 255)", context);
        assert.equal(computed.active.shadow, `rgb(2, 6, 23) ${dir === "rtl" ? "-4px" : "4px"} 0px 0px 0px inset`, context);
        assert.equal(computed.ghost.background, "rgb(255, 255, 255)", context);
        assert.equal(computed.ghost.color, "rgb(2, 6, 23)", context);
        assert.equal(computed.ghost.border, "rgb(2, 6, 23)", context);
        assert.equal(computed.alternate.background, "rgb(219, 231, 255)", context);
        assert.equal(computed["where-story-card__video-frame"].before, "0.08", context);
        assert.equal(computed["where-story-card__video-screen"].after, "0.08", context);
        await page.locator('[data-probe="ghost"]').focus();
        assert.equal(await page.locator('[data-probe="ghost"]').evaluate((el) => getComputedStyle(el).outlineWidth), "3px", context);
        await page.evaluate(() => document.documentElement.classList.remove("a11y-high-contrast"));
        assert.equal(await page.locator("body").evaluate((el) => getComputedStyle(el).color), "rgb(17, 24, 39)", context);
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});

test("hero controls preserve hover contrast, independent transforms and hidden state", async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const width of [393, 1280]) for (const dir of ["ltr", "rtl"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.route("**/*", (route) => route.abort());
        await page.setContent(`<html dir="${dir}"><head><style>${styles}\n${accessibility}</style></head><body>
          <section class="hero"><div class="hero__media"></div>
          <button id="mute" class="hero__media-control">Mute</button>
          <button id="replay" class="hero__replay">Replay</button></section></body></html>`);
        for (const id of ["mute", "replay"]) {
          const control = page.locator("#" + id);
          await control.hover();
          // Wait for the actual CSS transition, rather than comparing a frame
          // sampled between its original and hovered colors.
          await page.waitForFunction((target) => {
            const css = getComputedStyle(document.getElementById(target));
            return css.backgroundColor === "rgba(30, 41, 59, 0.72)"
              && css.borderTopColor === "rgba(255, 255, 255, 0.34)"
              && new DOMMatrix(css.transform).m42 === (target === "mute" ? -1 : 0);
          }, id);
          const state = await control.evaluate((el) => {
            const css = getComputedStyle(el), matrix = new DOMMatrix(css.transform);
            return { border: css.borderTopColor, y: matrix.m42, x: matrix.m41, width: el.getBoundingClientRect().width };
          });
          assert.equal(state.border, "rgba(255, 255, 255, 0.34)", `${width}/${dir}/${id}`);
          assert.equal(state.y, id === "mute" ? -1 : 0);
          if (id === "replay") {
            if (width <= 768) assert.equal(state.x, 0);
            else assert.ok(Math.abs(state.x + state.width / 2) < .01);
          }
          await control.evaluate((el) => { el.hidden = true; });
          assert.equal(await control.evaluate((el) => getComputedStyle(el).display), "none");
        }
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});

test("Host promo CTA preserves LTR/RTL hover and keyboard motion with reduced-motion support", async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    for (const width of [393, 1280]) for (const rtl of [false, true]) for (const reduced of [false, true]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      try {
        await page.route("**/*", (route) => route.abort());
        await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
        await page.setContent(`<html dir="${rtl ? "rtl" : "ltr"}"><head><style>${styles}\n${guestInvites}</style></head>
          <body class="${rtl ? "rtl" : ""}"><button id="before">Before</button><section class="guest-invites">
          <div class="guest-invites__grid"><a id="cta" class="btn guest-invites__cta" href="#target">Explore Host
          <svg class="guest-invites__cta-arrow" viewBox="0 0 24 24"><path d="M5 12h14" /></svg></a></div></section>
          <code class="giapi-url">https://example.test/?fixture=1</code><svg class="giapi-copy__icon"></svg></body></html>`);
        const arrow = page.locator(".guest-invites__cta-arrow");
        const initial = await arrow.evaluate((el) => {
          const css = getComputedStyle(el), matrix = new DOMMatrix(css.transform);
          return { x: matrix.m41, scale: matrix.m11, duration: css.transitionDuration };
        });
        assert.equal(initial.x, 0);
        assert.equal(initial.scale, rtl ? -1 : 1);
        assert.equal(initial.duration, reduced ? "0s" : "0.16s");
        assert.equal(await page.locator(".guest-invites__grid").evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length), width <= 900 ? 1 : 2);
        const waitForArrow = () => page.waitForFunction((direction) => {
          const matrix = new DOMMatrix(getComputedStyle(document.querySelector(".guest-invites__cta-arrow")).transform);
          return matrix.m41 === (direction ? -3 : 3) && matrix.m11 === (direction ? -1 : 1);
        }, rtl);
        await page.locator("#cta").hover(); await waitForArrow();
        await page.mouse.move(width - 1, 899);
        await page.locator("#before").focus(); await page.keyboard.press("Tab");
        assert.equal(await page.locator("#cta").evaluate((el) => el.matches(":focus-visible")), true);
        await waitForArrow();
        assert.equal(await page.locator("#cta").getAttribute("href"), "#target");
        if (rtl) {
          assert.equal(await page.locator(".giapi-url").evaluate((el) => getComputedStyle(el).direction), "ltr");
          assert.equal(await page.locator(".giapi-copy__icon").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m11), -1);
        }
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});
