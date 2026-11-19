// Every real page carries the skip link, the accessibility menu and a link to
// the accessibility statement, in its own language (scripts/lib/
// accessibility-page-check.mjs). A page that loses any of them fails here.
import * as cheerio from "cheerio";
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  accessibilityPageProblems,
  checkSiteAccessibility,
  isRedirectStub,
  partialSignature,
  portalLabelProblems,
  readAccessibilityCopy,
} from "./lib/accessibility-page-check.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFile(path.join(repoRoot, rel), "utf8");
const context = { copy: await readAccessibilityCopy(repoRoot), signature: await partialSignature(repoRoot) };

test("every page except the redirect stubs carries all three components", async () => {
  const { pages, stubs, problems } = await checkSiteAccessibility(repoRoot);
  assert.deepEqual(problems, []);
  assert.ok(pages > 1200, `${pages} pages checked`);
  assert.ok(stubs > 500, `${stubs} redirect stubs`);
});

test("only redirect stubs are exempt", async () => {
  for (const rel of ["manager/index.html", "pay/index.html", "hotels/index.html", "he/automation/index.html"])
    assert.equal(isRedirectStub(await read(rel)), true, rel);
  for (const rel of ["index.html", "login/index.html", "dashboard/index.html", "pay/point/index.html", "wifigate-link/index.html", "404.html"])
    assert.equal(isRedirectStub(await read(rel)), false, rel);
});

// Each page kind: generated (public, sign-in, invitation, 404), hand-written
// workspaces and their build copies, left-to-right and right-to-left.
const samples = [
  "he/index.html",
  "login/index.html",
  "he/login/index.html",
  "ar/login/index.html",
  "ar/wifigate-link/index.html",
  "wifigate-api/index.html",
  "404.html",
  "contact-us/index.html",
  "dashboard/index.html",
  "dashboard/platform/index.html",
  "dashboard/host/index.html",
  "dashboard/manager/index.html",
  "dashboard/pay/index.html",
  "reservations/index.html",
  "pay/point/index.html",
];
const statementLinks = ($) =>
  $("a[href]").not("#a11y-statement").filter((_, node) => /(^|\/)accessibility\/$/.test($(node).attr("href")));
const breakages = {
  "no skip link": ($) => $("a.skip-link").remove(),
  "skip link elsewhere": ($) => $("a.skip-link").attr("href", "#top"),
  "no main#main-content": ($) => $("#main-content").removeAttr("id"),
  "no menu button": ($) => $("#a11y-fab").remove(),
  "an option missing": ($) => $('[data-a11y-setting="grayscale"]').remove(),
  "no controller": ($) => $("script[src*='js/accessibility.js']").remove(),
  "no menu copy": ($) => {
    $("script[src*='js/accessibility-copy.js']").remove();
    $("script").filter((_, node) => $(node).text().startsWith("window.accessibilityCopy")).remove();
  },
  "no stylesheet": ($) => $("link[href*='css/accessibility.css']").remove(),
  "no statement link": ($) => statementLinks($).remove(),
  "statement link in another wording": ($) => statementLinks($).text("Accessibility"),
};

for (const rel of samples)
  test(`${rel} fails the check without any one component`, async () => {
    const html = await read(rel);
    assert.deepEqual(accessibilityPageProblems(html, rel, context), []);
    for (const [name, breakIt] of Object.entries(breakages)) {
      const $ = cheerio.load(html);
      breakIt($);
      const broken = $.html();
      assert.ok(broken !== cheerio.load(html).html(), `${rel}: ${name} changed nothing`);
      assert.ok(accessibilityPageProblems(broken, rel, context).length > 0, `${rel}: ${name} passed the check`);
    }
  });

test("a hand-copied menu must keep the shared partial's structure", async () => {
  const html = await read("dashboard/index.html");
  const changed = html.replace('<span class="a11y-option__switch" aria-hidden="true"></span>', "");
  assert.ok(accessibilityPageProblems(changed, "dashboard/index.html", context).some((problem) => problem.includes("differs from the shared partial")));
});

test("the workspaces' statement link labels are the site footer's", async () => {
  assert.deepEqual(await portalLabelProblems(repoRoot), []);
});
