import path from "node:path";

// Read only the legacy adjacent loc/lastmod pair. Keep literal XML text and
// last-duplicate-wins semantics; file errors are handled by the build caller.
export function previousSitemapDates(xml) {
  const dates = new Map();
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)) {
    dates.set(match[1], match[2]);
  }
  return dates;
}

const ENTRY_FIELDS = ["loc", "lastmod", "changefreq", "priority"];

// Date all entries before serializing any of them. Preserve the existing
// mutation and failure boundary rather than publishing partially formatted XML.
export function sitemapDocument(entries, previousLastmods, { repoRoot, changedFiles, nowDate }) {
  for (const entry of entries) {
    // Origin, query and fragment do not choose a different local output file.
    // Retain native URL/path validation, percent encoding and index.html rules.
    const file = path.resolve(repoRoot, `.${new URL(entry.loc).pathname}`, "index.html");
    const changed = changedFiles.has(file);
    entry.lastmod = entry.lastmod || (!changed && previousLastmods.get(entry.loc)) || nowDate;
  }

  // Resolve and coerce each field in its original order. Values remain literal:
  // this maintenance step adds neither escaping nor new defaults/SEO policy.
  const blocks = entries.map(entry => [
    "  <url>",
    ...ENTRY_FIELDS.map(tag => `    <${tag}>${entry[tag]}</${tag}>`),
    "  </url>",
  ].join("\n"));

  // The declaration, namespace, entry order/duplicates and final newline are
  // part of the existing generated-output contract.
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...blocks,
    "</urlset>",
    "",
  ].join("\n");
}
