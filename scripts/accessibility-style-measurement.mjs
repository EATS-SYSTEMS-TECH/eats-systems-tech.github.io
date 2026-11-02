import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { chromium } from "playwright-core";

// The actual shared control partial and independent representative page roles
// exercise the sheet's cascade without retaining the former CSS implementation.
const [partial, ...base] = await Promise.all([
  "../templates/partials/accessibility-widget.template.html", "../css/styles.css",
  "../css/niche.css", "../css/guest-invites.css",
].map(file => readFile(new URL(file, import.meta.url), "utf8")));
const roles = ["site-header", "feature-card", "contact-cta", "where-showcase", "where-story-card",
  "where-story-card__item", "where-story-card__video-frame", "where-story-card__video-screen",
  "where-story-card__bullet", "where-story-card__win", "where-story-card__badge", "where-story-card__close",
  "language-selector__button", "language-selector__dropdown", "section__subtitle", "feature-card__text",
  "about__text", "contact-cta__text", "where-story-card__pitch", "where-story-card__value",
  "where-story-card__video-note", "where-story-card__bullet-value", "where-story-card__win-text",
  "where-list__item--static", "where-story-card__video-label", "where-story-card__video-status",
  "where-story-card__summary-label", "where-story-card__decision-title", "where-story-card__bullet-label",
  "where-story-card__win-label", "where-list__link", "where-list__link is-active", "btn btn--ghost",
  "section--alt", "hero__overlay", "js-reveal", "site-footer__inner", "topbar-nav"];
const toggles = ["high-contrast", "grayscale", "underlined-links", "readable-font", "text-spacing",
  "highlight-headings", "big-cursor", "focus-highlight", "reduced-motion"];
const states = ["default", ...toggles, "scaled", "all", "closed", "hidden", "arranging", "arabic-spacing"];
const properties = ["display", "position", "zIndex", "opacity", "pointerEvents", "backgroundColor", "backgroundImage",
  "color", "borderTopColor", "borderTopStyle", "borderTopWidth", "borderRadius", "boxShadow", "outlineColor",
  "outlineStyle", "outlineWidth", "outlineOffset", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "marginTop", "marginRight", "marginBottom", "marginLeft", "fontFamily", "fontSize", "fontWeight", "lineHeight",
  "letterSpacing", "wordSpacing", "textAlign", "textTransform", "textDecorationLine", "textDecorationThickness",
  "textUnderlineOffset", "cursor", "filter", "backdropFilter", "transform", "translate", "touchAction", "userSelect",
  "flexDirection", "alignItems", "justifyContent", "gap", "flexShrink", "minWidth", "minHeight", "maxWidth", "maxHeight",
  "overflowX", "overflowY", "overflowWrap", "zoom", "content"];

// Browser rendering facts are hashed after transitions settle or are disabled.
// Fixed dimensions are sampled only on controls whose sizes are CSS-owned.
export async function measureAccessibilitySheet(sheet, onCase = () => {}) {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const rows = [];
  try {
    const page = await browser.newPage();
    await page.route("**/*", route => route.abort());
    for (const width of [375, 520, 521, 768, 769, 1440]) for (const direction of ["ltr", "rtl"]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const state of states) {
        const flags = state === "all" ? toggles : toggles.includes(state) ? [state] : state === "arabic-spacing" ? ["text-spacing"] : [];
        const classes = flags.map(name => `a11y-${name}`).concat(["all", "scaled"].includes(state) ? ["a11y-text-scaled"] : []);
        await page.setContent(`<html lang="${state === "arabic-spacing" ? "ar" : "en"}" dir="${direction}" class="${classes.join(" ")}" style="--a11y-text-scale:1.5"><head><style>${base.join("\n")}\n${sheet}\n*{transition:none!important;animation:none!important}</style></head><body>${partial}<button class="a11y-fab__dismiss">×</button><main><h1>Access</h1><p>Readable text</p><a href="#">Entrance</a><button>Action</button>${roles.map(role => `<div data-style-probe class="${role}">Access</div>`).join("")}</main></body></html>`);
        await page.evaluate(({ state, flags }) => {
          document.getElementById("a11y-panel").classList.toggle("is-open", state !== "closed");
          document.getElementById("a11y-backdrop").classList.toggle("is-visible", state !== "closed");
          document.body.classList.toggle("a11y-panel-open", state !== "closed");
          document.getElementById("a11y-fab").hidden = state === "hidden";
          document.querySelector(".a11y-fab__dismiss").hidden = state === "hidden";
          document.getElementById("a11y-fab").classList.toggle("is-arranging", state === "arranging");
          document.querySelectorAll(".a11y-option").forEach(button => button.classList.toggle("is-active", flags.length > 0));
        }, { state, flags });
        const values = await page.evaluate(properties => {
          const nodes = [document.documentElement, document.body, ...document.querySelectorAll('[class*="a11y"],.skip-link,[data-style-probe],main h1,main p,main a,main button')];
          const fixed = new Set(["a11y-fab", "a11y-fab__icon", "a11y-panel__close", "a11y-text-size__step", "a11y-option__switch", "a11y-fab__dismiss"]);
          return nodes.map(element => [element.tagName, element.className.baseVal ?? element.className,
            ...[null, "::before", "::after"].map(pseudo => {
              const style = getComputedStyle(element, pseudo);
              const values = properties.map(key => style[key]);
              if ([...element.classList].some(name => fixed.has(name))) values.push(style.width, style.height);
              return values;
            })]);
        }, properties);
        const row = { width, direction, state, elements: values.length,
          sha256: createHash("sha256").update(JSON.stringify(values)).digest("hex") };
        rows.push(row);
        onCase(row, values);
      }
    }
  } finally { await browser.close(); }
  return rows;
}
