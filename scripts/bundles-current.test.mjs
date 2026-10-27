// The committed bundles are what /dashboard/host/, the product picker with
// Pay and Manager, and every page that imports the API client actually run.
// They must match their sources: a source edit without `npm run build:api`
// would ship older code. This suite builds them in memory with the same
// options and compares, so test:dashboard (which tests the source modules)
// fails on a stale bundle.
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import {
  apiBundle,
  dashboardBundle,
  pickerBundle,
  reservationsBundle,
  pickerPages,
  hostPage,
  overviewPage,
  root,
} from "./lib/bundles.mjs";

// A Windows checkout may hold the committed files with CRLF line endings.
const text = (value) => value.replace(/\r\n/g, "\n");

for (const options of [apiBundle, dashboardBundle, pickerBundle, reservationsBundle])
  test(`${options.outfile} matches its sources`, async () => {
    const result = await build({ ...options, write: false });
    assert.equal(result.outputFiles.length, 1);
    const committed = await readFile(path.join(root, options.outfile), "utf8");
    assert.ok(
      text(committed) === text(result.outputFiles[0].text),
      `${options.outfile} is older than its sources: run npm run build:api`,
    );
  });

test("the Platform page is a copy of the Host page", async () => {
  const [page, copy] = await Promise.all(
    [hostPage, overviewPage].map((file) =>
      readFile(path.join(root, file), "utf8"),
    ),
  );
  assert.ok(
    text(copy) === text(page),
    `${overviewPage} differs from ${hostPage}: run npm run build:api`,
  );
});

// A page that loads the unbundled entry could pair it with an older cached
// copy of a module it imports and fail to start. The picker pages load the
// one bundle, all under the same version.
test("the picker, Pay and Manager pages load the versioned picker bundle", async () => {
  const versions = new Set();
  for (const page of pickerPages) {
    const html = await readFile(path.join(root, page), "utf8");
    const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(
      ([, src]) => src,
    );
    const bundle = scripts.filter((src) =>
      src.startsWith(`/${pickerBundle.outfile}?v=`),
    );
    assert.equal(bundle.length, 1, `${page} loads the picker bundle once`);
    assert.equal(
      scripts.some((src) => /\/js\/platform-dashboard\.js(?:[?#]|$)/.test(src)),
      false,
      `${page} never loads the unbundled entry`,
    );
    versions.add(bundle[0].split("?v=")[1]);
  }
  assert.equal(versions.size, 1, "the three pages share one bundle version");
});
