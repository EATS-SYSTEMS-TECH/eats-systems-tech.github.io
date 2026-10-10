import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const runtime = await readFile(new URL("../js/navigation.js", import.meta.url), "utf8");

function headerDestination(path, href = "/login/") {
  const location = new URL(path, "https://wifigate.io");
  const link = { href: new URL(href, location).href };
  runInNewContext(runtime + "\nsetupNav();", {
    location,
    URL,
    $: () => null,
    $$: () => [link],
  });
  return new URL(link.href);
}

test("every published language keeps its login destination from home and nested pages", () => {
  for (const { code } of SITE_LANGUAGES) {
    const prefix = code === "en" ? "" : `/${code}`;
    for (const page of ["/", "/hotels-airbnb/", "/contact-us/"]) {
      assert.equal(headerDestination(prefix + page).pathname, prefix + "/login/", code + page);
    }
  }
});

test("login localization preserves the requested destination and query", () => {
  const result = headerDestination("/he/", "/login/?next=%2Fdashboard%2Fhost%2F&source=header");
  assert.equal(result.pathname, "/he/login/");
  assert.equal(result.searchParams.get("next"), "/dashboard/host/");
  assert.equal(result.searchParams.get("source"), "header");
});

test("English content paths and unrelated external links keep their destination", () => {
  assert.equal(headerDestination("/hotels-airbnb/").pathname, "/login/");
  assert.equal(headerDestination("/he/", "https://example.test/login/").href, "https://example.test/login/");
});
