// scripts/lib/accessibility-page-check.mjs
// Every real page of the site carries the same three accessibility components
// (scripts/lib/accessibility-components.mjs): the skip link to #main-content,
// the accessibility menu from templates/partials/accessibility-widget.template.html
// with its controller and copy, and a link to the accessibility statement in
// the page's language with the site footer's label. Only redirect stubs,
// which leave at once, are exempt. Used by scripts/verify-site.mjs and
// scripts/accessibility-components.test.mjs.
import * as cheerio from "cheerio";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { accessibilityLinkLabels } from "../legal/footer-labels.mjs";

const WIDGET_IDS = [
  "fab", "backdrop", "panel", "eyebrow", "close", "title", "description", "status", "reset",
  "text-size-title", "text-size-description", "text-smaller", "text-size-value", "text-larger", "statement",
].map((suffix) => `a11y-${suffix}`);
const SETTINGS = [
  "highContrast", "grayscale", "underlineLinks", "readableFont", "textSpacing",
  "highlightHeadings", "bigCursor", "focusHighlight", "reducedMotion",
];
// Source folders, not pages.
const SOURCE_FOLDERS = /^(templates|maintenance|scripts|node_modules)\//;

const statementPath = (code) => (code === "en" ? "/accessibility/" : `/${code.toLowerCase()}/accessibility/`);
const localeOf = (lang) =>
  Object.keys(accessibilityLinkLabels).find((code) => code.toLowerCase() === String(lang).toLowerCase());
const urlPath = (rel) => "/" + rel.replace(/(^|\/)index\.html$/, "$1");

// A meta refresh, or a script-only page that replaces the location and has
// no content of its own (/manager/, /pay/).
export function isRedirectStub(html) {
  const $ = cheerio.load(html);
  if ($("meta[http-equiv]").filter((_, node) => /refresh/i.test($(node).attr("http-equiv"))).length) return true;
  return /location\.replace\(/.test(html) && !$("main").length;
}

// The partial's element structure (tags, ids, classes, settings), which a
// localized copy keeps.
export function widgetSignature($, root) {
  return root
    .find("*")
    .addBack()
    .toArray()
    .map((node) => [node.tagName, $(node).attr("id") ?? "", $(node).attr("class") ?? "", $(node).attr("data-a11y-setting") ?? ""].join("|"));
}
export async function partialSignature(repoRoot) {
  const source = await fs.readFile(path.join(repoRoot, "templates/partials/accessibility-widget.template.html"), "utf8");
  const $ = cheerio.load(source.replace(/^﻿/, "").replace(/^\s*<!--[\s\S]*?-->\s*/, ""), null, false);
  return $.root().children().toArray().flatMap((node) => widgetSignature($, $(node)));
}

export async function readAccessibilityCopy(repoRoot) {
  const context = { window: {} };
  runInNewContext(await fs.readFile(path.join(repoRoot, "js/accessibility-copy.js"), "utf8"), context);
  return context.window.accessibilityCopy;
}

// Problems on one page; an empty list means the page carries all three.
export function accessibilityPageProblems(html, rel, { copy, signature }) {
  const $ = cheerio.load(html);
  const problems = [];
  const fail = (message) => problems.push(`${rel}: ${message}`);
  const lang = $("html").attr("lang");
  const locale = localeOf(lang);
  if (!locale) {
    fail(`<html lang="${lang ?? ""}"> is not a site language`);
    return problems;
  }
  const text = copy[locale];

  // 1. The skip link to the page's main element.
  const skip = $("a.skip-link");
  if (skip.length !== 1) fail(`expected one a.skip-link, found ${skip.length}`);
  else {
    if (skip.attr("href") !== "#main-content") fail(`the skip link points to ${skip.attr("href")}, not #main-content`);
    if (skip.text().trim() !== text.skipLink) fail(`the skip link reads "${skip.text().trim()}", not "${text.skipLink}"`);
  }
  const target = $("#main-content");
  if (target.length !== 1 || !target.is("main")) fail("the page needs exactly one main#main-content");
  // The skip link moves keyboard focus only to an element that can take it.
  else if (target.attr("tabindex") !== "-1") fail('main#main-content needs tabindex="-1" for the skip link to move focus');

  // 2. The accessibility menu: the shared partial, its stylesheet, its copy
  // and its controller, copy first.
  for (const id of WIDGET_IDS) {
    const count = $(`[id="${id}"]`).length;
    if (count !== 1) fail(`expected one #${id}, found ${count}`);
  }
  const settings = $("[data-a11y-setting]").map((_, node) => $(node).attr("data-a11y-setting")).get();
  if (settings.join() !== SETTINGS.join()) fail(`accessibility options ${settings.join() || "missing"}`);
  const fab = $("#a11y-fab"), panel = $("#a11y-panel");
  if (fab.length && panel.length) {
    const nodes = [fab, $("#a11y-backdrop"), panel].flatMap((node) => widgetSignature($, node));
    if (signature && nodes.join("\n") !== signature.join("\n")) fail("the accessibility menu markup differs from the shared partial");
    if (fab.attr("aria-controls") !== "a11y-panel" || fab.attr("aria-expanded") !== "false" || panel.attr("aria-hidden") !== "true" || panel.attr("role") !== "dialog")
      fail("the accessibility menu must start closed, as a dialog its button controls");
    if (fab.attr("aria-label") !== text.openButton) fail(`the accessibility button is labelled "${fab.attr("aria-label")}", not "${text.openButton}"`);
    if ($("#a11y-title").text().trim() !== text.title) fail(`the accessibility menu title is not in ${locale}`);
    if ($("#a11y-statement").attr("href") !== statementPath(locale)) fail(`the menu's statement link is not ${statementPath(locale)}`);
    if (panel.closest("[inert]").length || fab.closest("[inert]").length) fail("the accessibility menu is inside an inert container");
  }
  if (!$("link[rel='stylesheet'][href*='css/accessibility.css']").length) fail("css/accessibility.css is not linked");
  const scripts = $("script").toArray();
  const controller = scripts.findIndex((node) => ($(node).attr("src") || "").includes("js/accessibility.js"));
  const copyScript = scripts.findIndex((node) =>
    ($(node).attr("src") || "").includes("js/accessibility-copy.js") || /^\s*window\.accessibilityCopy = \{/.test($(node).text()));
  if (scripts.filter((node) => ($(node).attr("src") || "").includes("js/accessibility.js")).length !== 1) fail("expected one js/accessibility.js");
  if (copyScript < 0) fail("the accessibility menu copy is not loaded");
  else if (controller >= 0 && copyScript > controller) fail("the accessibility menu copy loads after js/accessibility.js");

  // 3. A link to the statement in the page's language, with the footer label.
  const label = accessibilityLinkLabels[locale];
  const links = $("a[href]").not("#a11y-statement").filter((_, node) => {
    const href = $(node).attr("href");
    const resolved = new URL(href, "https://wifigate.io" + urlPath(rel)).pathname;
    return resolved === statementPath(locale);
  });
  if (!links.length) fail(`no link to ${statementPath(locale)} outside the menu`);
  else if (!links.filter((_, node) => $(node).text().trim() === label).length)
    fail(`the statement link reads "${links.first().text().trim()}", not "${label}"`);
  return problems;
}

// Every page the repository serves: tracked or new files, not ignored ones.
export function sitePages(repoRoot) {
  return execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", "*.html"], { cwd: repoRoot, encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((rel) => rel && !SOURCE_FOLDERS.test(rel));
}

export async function checkSiteAccessibility(repoRoot) {
  const context = { copy: await readAccessibilityCopy(repoRoot), signature: await partialSignature(repoRoot) };
  const problems = [];
  let pages = 0, stubs = 0;
  for (const rel of sitePages(repoRoot)) {
    let html;
    try { html = await fs.readFile(path.join(repoRoot, rel), "utf8"); } catch { continue; }
    if (isRedirectStub(html)) { stubs++; continue; }
    pages++;
    problems.push(...accessibilityPageProblems(html, rel, context));
  }
  return { pages, stubs, problems };
}

// js/portal-accessibility.js localizes the workspaces' statement links with
// its own copy of the footer labels.
export async function portalLabelProblems(repoRoot) {
  const source = await fs.readFile(path.join(repoRoot, "js/portal-accessibility.js"), "utf8");
  const literal = source.match(/const labels = (\{[\s\S]*?\n {2}\});/);
  if (!literal) return ["js/portal-accessibility.js: no labels table"];
  const labels = runInNewContext(`(${literal[1]})`);
  return JSON.stringify(labels) === JSON.stringify(accessibilityLinkLabels)
    ? []
    : ["js/portal-accessibility.js: the statement labels differ from scripts/legal/footer-labels.mjs"];
}
