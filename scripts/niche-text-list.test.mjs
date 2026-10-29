import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import test from "node:test";
import * as cheerio from "cheerio";

// Execute the original function in isolation for a pre-change baseline. Never
// import the complete generator: its main function writes the published pages.
const source = await readFile(new URL("./build-localized-site.mjs", import.meta.url), "utf8");
// The original top-level declaration ends at its unindented closing brace.
// Parse it with the JS runtime without depending on a compiler's private API.
const declaration = source.match(/^function setNicheList\([^\n]*\) \{[\s\S]*?^\}/m)?.[0];
const render = declaration
  ? runInNewContext(declaration + "\nsetNicheList;")
  : (await import("./niche-text-list.mjs")).setNicheList;

test("niche proof lists replace old items in order and encode text without parsing HTML", () => {
  const $ = cheerio.load('<ul id="proof"><li>Old</li></ul>');
  render($, "#proof", ["Gate <strong>one</strong>", "A & B", "שלום", ""], "proof-item extra");
  assert.deepEqual($("#proof li").map((_, el) => $(el).text()).get(), ["Gate <strong>one</strong>", "A & B", "שלום", ""]);
  assert.equal($("#proof strong").length, 0);
  assert.equal($("#proof li.proof-item.extra").length, 4);
  assert.ok($("#proof").html().includes("&lt;strong&gt;"));
});

test("missing targets do not inspect items or mutate another list", () => {
  const $ = cheerio.load('<ul id="other"><li>Retained</li></ul>');
  const unreadable = new Proxy({}, { get() { throw new Error("Unexpected item access"); } });
  render($, "#missing", unreadable, "proof-item");
  assert.equal($("#other").text(), "Retained");
});

test("empty and falsy item collections clear an existing proof list", () => {
  for (const items of [[], null, undefined, false, 0, ""]) {
    const $ = cheerio.load('<ul id="proof"><li>Old</li></ul>');
    render($, "#proof", items, "proof-item");
    assert.equal($("#proof").html(), "");
  }
});

test("each matching list receives ordered independent nodes and skips sparse holes", () => {
  const $ = cheerio.load('<ul class="proof"><li>Old A</li></ul><ul class="proof"><li>Old B</li></ul>');
  render($, ".proof", ["First", , "Second"], "proof-item");
  assert.equal($(".proof").length, 2);
  for (const list of $(".proof").toArray()) {
    assert.deepEqual($(list).children().map((_, el) => $(el).text()).get(), ["First", "Second"]);
  }
  const children = $(".proof").map((_, el) => $(el).children().first()[0]).get();
  assert.notEqual(children[0], children[1]);
  render($, ".proof", ["Replacement"], "next-item");
  assert.equal($(".proof-item").length, 0);
  assert.equal($(".next-item").length, 2);
});
