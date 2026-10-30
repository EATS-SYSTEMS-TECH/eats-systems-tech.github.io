import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { runInNewContext } from "node:vm";
import test from "node:test";

const source = await readFile(new URL("./build-localized-site.mjs", import.meta.url), "utf8");
const declaration = name => source.match(new RegExp(`^(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, "m"))?.[0];
const imported = source.includes('from "./sitemap.mjs"') ? await import("./sitemap.mjs") : {};

// Execute the shipped orchestration before/after extraction. Disk contents,
// changed paths and today's date are controlled; output logic is real code.
function fixture(options = {}) {
  const root = path.resolve("fixture-site"), reads = [];
  const functions = ["readPreviousLastmods", "pageFileForUrl", "buildSitemap"].map(declaration).filter(Boolean).join("\n");
  const api = runInNewContext(functions + "\n({readPreviousLastmods,buildSitemap});", {
    ...imported, path, URL, repoRoot: root, nowDate: "2030-04-05",
    changedFiles: new Set((options.changed ?? []).map(name => path.resolve(root, name, "index.html"))),
    fs: { readFile(file, encoding) {
      reads.push([file, encoding]);
      return options.readError ? Promise.reject(options.readError) : Promise.resolve(options.xml ?? "");
    } },
  });
  return { ...api, root, reads };
}

test("previous sitemap dates retain literal values, exact adjacent tags and last duplicate wins", async () => {
  const f = fixture({ xml: `<url><loc>https://example.test/a?x=1&amp;y=2</loc>\n <lastmod>2020-01-02</lastmod></url>
    <loc>https://example.test/a?x=1&amp;y=2</loc><lastmod>2021-03-04</lastmod>
    <loc>https://example.test/skipped</loc><priority>1</priority><lastmod>2010-01-01</lastmod>
    <LOC>https://example.test/uppercase</LOC><lastmod>2010-01-01</lastmod>
    <loc></loc><lastmod>empty</lastmod><loc>missing-date</loc><lastmod></lastmod>` });
  const dates = await f.readPreviousLastmods();
  assert.deepEqual(Array.from(dates, ([key, value]) => [key, value]), [["https://example.test/a?x=1&amp;y=2", "2021-03-04"]]);
  assert.deepEqual(f.reads, [[path.join(f.root, "sitemap.xml"), "utf8"]]);
});

test("unreadable or absent prior sitemap has an empty date map without changing the read boundary", async () => {
  for (const options of [{}, { xml: "not XML" }, { readError: Error("denied") }]) {
    const f = fixture(options); assert.equal((await f.readPreviousLastmods()).size, 0); assert.equal(f.reads.length, 1);
  }
});

test("explicit dates win;changed paths use today and unchanged paths retain previous dates", () => {
  const f = fixture({ changed: ["he/hotels", "explicit"] });
  const entries = [
    { loc: "https://wifigate.io/he/hotels/?keep=1#anchor", changefreq: "monthly", priority: "0.8" },
    { loc: "https://wifigate.io/explicit/", lastmod: "2019-02-03", changefreq: "yearly", priority: "0.5" },
    { loc: "https://other-origin.test/keep/", lastmod: "", changefreq: "weekly", priority: 0 },
    { loc: "https://wifigate.io/new/", changefreq: "daily", priority: "1.0" },
  ];
  const dates = new Map(entries.map(e => [e.loc, "2010-01-01"])); dates.delete(entries[3].loc);
  const xml = f.buildSitemap(entries, dates);
  assert.deepEqual(entries.map(e => e.lastmod), ["2030-04-05", "2019-02-03", "2010-01-01", "2030-04-05"]);
  assert.equal(xml, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n  </url>`).join("\n")}
</urlset>
`);
});

test("serialization keeps duplicate entry references, order, literal field values and a trailing newline", () => {
  const f = fixture(), entry = { loc: "https://example.test/?a=1&b=2", lastmod: "<literal>", changefreq: undefined, priority: 0 };
  const xml = f.buildSitemap([entry, entry], new Map());
  assert.equal(xml.match(/<url>/g).length, 2);
  assert.equal(xml.match(/a=1&b=2/g).length, 2); assert.equal(xml.includes("<lastmod><literal></lastmod>"), true);
  assert.equal(xml.includes("<changefreq>undefined</changefreq>"), true); assert.equal(xml.includes("<priority>0</priority>"), true);
  assert.equal(xml.endsWith("</urlset>\n"), true);
  assert.equal(f.buildSitemap([], new Map()), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n');
});

test("date mutation completes before XML coercion;malformed URLs retain the original partial mutation boundary", () => {
  const f = fixture(); let fieldReads = 0;
  const first = { loc: "https://example.test/first/", changefreq: "daily", get priority() { fieldReads++; return "1"; } };
  const malformed = { loc: "not a URL", lastmod: "already dated" };
  assert.throws(() => f.buildSitemap([first, malformed], new Map()), /Invalid URL/);
  assert.equal(first.lastmod, "2030-04-05"); assert.equal(malformed.lastmod, "already dated"); assert.equal(fieldReads, 0);
  const undated = { loc: "https://example.test/second/" };
  const failing = { loc: "https://example.test/error/", get lastmod() { throw Error("date unavailable"); } };
  assert.throws(() => f.buildSitemap([undated, failing], new Map()), /date unavailable/);
  assert.equal(undated.lastmod, "2030-04-05");
});
