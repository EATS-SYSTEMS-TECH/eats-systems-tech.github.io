// scripts/lib/accessibility-components.mjs
// The three accessibility components every real page of the site carries:
// the skip link to #main-content, the accessibility menu (the shared partial
// templates/partials/accessibility-widget.template.html, run by
// js/accessibility.js) and a link to the accessibility statement. Generators
// that do not go through the localized page builder (sign-in, 404) take them
// from here, localized with the same copy and the same helper as every other
// page, so the components stay uniform.
import * as cheerio from "cheerio";
import { accessibilityLinkLabels } from "../legal/footer-labels.mjs";
import { buildPagePath, readPartial, readWindowGlobal, updateAccessibilityMarkup } from "../localized-builder-document.mjs";
import { serializeScriptData } from "../script-data.mjs";

// The versions every page links today; bump them here and in the templates
// together when css/accessibility.css, js/accessibility-copy.js or
// js/accessibility.js change.
export const ACCESSIBILITY_ASSETS = Object.freeze({
  stylesheet: "/css/accessibility.css?v=20261027c",
  copy: "/js/accessibility-copy.js?v=20261007a",
  controller: "/js/accessibility.js?v=20261027d",
});

const escapeHtml = (value) =>
  String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

let copies;
export async function readAccessibilityCopy() {
  copies ??= await readWindowGlobal("accessibility-copy.js", "accessibilityCopy");
  return copies;
}

export const accessibilityStatementPath = (locale) => buildPagePath(locale, "accessibility");
export const accessibilityStatementLabel = (locale) => accessibilityLinkLabels[locale] || accessibilityLinkLabels.en;

// Localized markup for one locale: the skip link, the menu (button, backdrop
// and dialog), the statement link's address and footer label, and the menu
// copy of that locale as an inline script for pages without a script policy
// (pages with one load ACCESSIBILITY_ASSETS.copy instead).
export async function accessibilityComponents(locale) {
  const all = await readAccessibilityCopy();
  const copy = all[locale] || all.en;
  const $ = cheerio.load(await readPartial("accessibility-widget"), null, false);
  updateAccessibilityMarkup($, copy, locale);
  return {
    skipLink: `<a class="skip-link" href="#main-content">${escapeHtml(copy.skipLink)}</a>`,
    widget: $.html(),
    statementHref: accessibilityStatementPath(locale),
    statementLabel: escapeHtml(accessibilityStatementLabel(locale)),
    inlineCopy: `<script>window.accessibilityCopy = ${serializeScriptData({ [locale]: copy })};</script>`,
  };
}

// Indent every non-empty line of a fragment for a readable generated page.
export const indent = (html, spaces) =>
  html.split("\n").map((line) => (line.trim() ? " ".repeat(spaces) + line : line)).join("\n");
