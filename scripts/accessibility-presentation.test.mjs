import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright-core";

const styles = await readFile(new URL("../css/styles.css", import.meta.url), "utf8");
const accessibility = await readFile(new URL("../css/accessibility.css", import.meta.url), "utf8");
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
