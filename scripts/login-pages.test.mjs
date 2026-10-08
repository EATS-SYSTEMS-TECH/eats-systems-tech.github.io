import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { loadLoginCopy, renderLoginPage, validateLoginCopy } from "./login-pages.mjs";
import { SITE_LANGUAGES } from "./site-languages.mjs";

const copies = await loadLoginCopy();
const template = await fs.readFile(new URL("../templates/login.template.html", import.meta.url), "utf8");

test("every sign-in copy matches the Hebrew source and keeps no English", () => {
  assert.deepEqual(validateLoginCopy(copies), []);
});

test("each sign-in page is in its own language with a picker of every language", () => {
  for (const { code } of SITE_LANGUAGES) {
    const html = renderLoginPage(template, code, copies[code]);
    const base = code === "en" ? "" : `/${code.toLowerCase()}`;
    assert.match(html, new RegExp(`<html lang="${code}" dir="${code === "he" || code === "ar" ? "rtl" : "ltr"}">`));
    assert.doesNotMatch(html, /\{\{|\{terms\}|\{privacy\}/);
    assert.equal(html.match(/class="language-picker__option"/g).length, SITE_LANGUAGES.length);
    assert.equal(html.match(/aria-current="page"/g).length, 1);
    assert.match(html, new RegExp(`href="${base}/login/" hreflang="${code}" aria-current="page"`));
    assert.match(html, new RegExp(`href="${base}/terms-and-conditions/"`));
    const runtime = JSON.parse(html.match(/<script type="application\/json" id="login-copy">(.*?)<\/script>/s)[1]);
    assert.equal(runtime.gameTitle, copies[code].gameTitle);
    if (code !== "en") assert.ok(!html.includes(copies.en.google));
  }
});
