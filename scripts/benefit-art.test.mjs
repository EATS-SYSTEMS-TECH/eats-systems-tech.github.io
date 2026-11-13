import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";
import { BENEFIT_ICONS } from "./benefit-icons.mjs";
import { BENEFIT_ART_NAMES, benefitArtSvg, hasBenefitArt } from "./benefit-art.mjs";
import { NICHE_PAGE_LOCALES } from "./niche-pages/index.mjs";

test("every benefit kind has a small drawing of its own, drawn in the page's colour", () => {
  assert.deepEqual([...BENEFIT_ART_NAMES].sort(), Object.keys(BENEFIT_ICONS).sort(), "one drawing per icon name, and no other");
  const seen = new Set();
  for (const name of BENEFIT_ART_NAMES) {
    const svg = benefitArtSvg(name);
    assert.ok(svg.startsWith('<svg viewBox="0 0 56 56" fill="none" stroke="currentColor"'), name);
    assert.ok(svg.includes('aria-hidden="true"') && svg.includes('focusable="false"'), `${name}: decorative`);
    assert.ok(!/\sid=|<style|<script|href=|url\(/.test(svg), `${name}: no ids, styles, scripts or references`);
    assert.ok(!/#(?!fff\b)[0-9a-f]{3,8}\b/i.test(svg), `${name}: its only fixed colour is the white under a badge`);
    assert.ok(!seen.has(svg), `${name}: repeats another drawing`);
    seen.add(svg);
  }
  assert.equal(hasBenefitArt("no-such-kind"), false);
  assert.equal(hasBenefitArt("toString"), false, "inherited names are not drawings");
});

test("every benefit of every use-case page names a kind that has a drawing", () => {
  let count = 0;
  for (const [locale, page] of Object.entries(NICHE_PAGE_LOCALES)) for (const [key, niche] of Object.entries(page.niches ?? {})) {
    for (const benefit of niche.benefits ?? []) {
      count += 1;
      assert.ok(hasBenefitArt(benefit.icon), `${locale} ${key}: ${benefit.icon}`);
    }
  }
  assert.ok(count > 0);
});

test("built use-case pages, and WIFIGATE Host and Manager, show the drawings without a tile", async () => {
  const read = async file => load(await fs.readFile(new URL(`../${file}`, import.meta.url), "utf8"));
  for (const file of ["he/residential-buildings/index.html", "residential-buildings/index.html", "he/roller-shutters/index.html", "ja/electric-gates/index.html", "he/wifigate-manager/index.html", "wifigate-host/index.html"]) {
    const $ = await read(file), icons = $("#niche-benefits-list .bento-card__icon");
    assert.ok(icons.length >= 3, file);
    assert.equal($("#niche-benefits-list .bento-card__icon--art").length, icons.length, `${file}: every benefit has a drawing`);
    assert.equal($("#niche-benefits-list .bento-card__icon--art > svg").length, icons.length, file);
    // Host and Manager style the drawing in their own sheet (css/automation.css).
    assert.equal($("link[href*='css/niche-flow.css']").length, /wifigate-(host|manager)/.test(file) ? 0 : 1, `${file}: the drawing styles load once`);
  }
  const css = await fs.readFile(new URL("../css/niche-flow.css", import.meta.url), "utf8");
  assert.match(css, /\.bento-card__icon--art\s*\{[^}]*border:\s*0;[^}]*background:\s*none;/);
  assert.match(css, /html\.a11y-high-contrast \.bento-card__icon--art\s*\{[^}]*border:\s*0;/);
  const subscription = await fs.readFile(new URL("../css/automation.css", import.meta.url), "utf8");
  assert.match(subscription, /#niche-benefits \.bento-card__icon--art\s*\{[^}]*border:\s*0;[^}]*background:\s*none;/);
  assert.match(subscription, /#niche-benefits \.bento-card__icon--art svg\s*\{[^}]*width:\s*100%;/);
});
