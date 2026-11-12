import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { NICHE_PAGE_LOCALES } from "./niche-pages/index.mjs";
import { HIGHLIGHT_ART_NAMES, HIGHLIGHT_ART_SIZE, highlightArtFiles, highlightArtName, highlightArtPath } from "./highlight-art.mjs";

test("committed highlight drawings and their wave are exactly what scripts/highlight-art.mjs draws", async () => {
  const files = highlightArtFiles();
  assert.equal(files.length, HIGHLIGHT_ART_NAMES.length + 1, "one file per drawing, and the wave");
  for (const { file, svg } of files) {
    const committed = await fs.readFile(new URL(`../${file}`, import.meta.url), "utf8");
    assert.equal(committed.replace(/\r\n/g, "\n"), svg, file);
  }
  for (const { file, svg } of files.slice(0, -1)) assert.ok(svg.includes(`viewBox="0 0 ${HIGHLIGHT_ART_SIZE.width} ${HIGHLIGHT_ART_SIZE.height}"`), file);
});

test("every highlight of every use-case page has its own drawing; unknown kinds share the default", () => {
  const kinds = new Set();
  for (const [locale, page] of Object.entries(NICHE_PAGE_LOCALES)) for (const [key, niche] of Object.entries(page.niches ?? {})) {
    for (const highlight of niche.highlights ?? []) {
      kinds.add(highlight.icon);
      assert.notEqual(highlightArtName(highlight.icon), "default", `${locale} ${key}: ${highlight.icon}`);
    }
  }
  assert.ok(kinds.size >= 3);
  assert.equal(highlightArtName("no-such-kind"), "default");
  assert.equal(highlightArtName("toString"), "default", "inherited names are not drawings");
  assert.equal(highlightArtPath("roster"), "assets/img/highlight-flow/roster.svg");
});
