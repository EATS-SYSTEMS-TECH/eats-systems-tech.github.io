import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { chromium } from "playwright-core";
import { serializeScriptData } from "./script-data.mjs";

test("script data preserves ordinary JSON bytes and unsupported-value failures", () => {
  for (const value of [null, true, false, 0, 1.5, "אב 中文 + & >", [1, null, "x"], { z: 2, a: { b: 1 } }]) {
    assert.equal(serializeScriptData(value), JSON.stringify(value));
  }
  for (const value of [undefined, () => {}, Symbol("x"), 1n]) assert.throws(() => serializeScriptData(value), TypeError);
  const circular = {}; circular.self = circular;
  assert.throws(() => serializeScriptData(circular), TypeError);
  let calls = 0;
  assert.equal(JSON.parse(serializeScriptData({ toJSON() { calls++; return "<"; } })), "<");
  assert.equal(calls, 1);
});

test("both actual builder boundaries use the same safe serializer without altering mutation order", async () => {
  const source = await readFile(new URL("./build-localized-site.mjs", import.meta.url), "utf8");
  assert.match(source, /import \{ serializeScriptData \} from "\.\/script-data\.mjs"/);
  const inline = source.match(/function inlineJson\(value\)\s*\{([\s\S]*?)\n\}/);
  assert.ok(inline);
  const serializeActualInline = new Function("value", "serializeScriptData", inline[1]);
  const input = { text: "</ScRiPt>" };
  assert.equal(JSON.parse(serializeActualInline(input, serializeScriptData)).text, input.text);
  const insertion = source.slice(source.indexOf("function insertPageDataScript("), source.indexOf("// The footer comes"));
  assert.match(insertion, /\.remove\(\);[\s\S]*?\$\(anchorSelector\)\.before\([\s\S]*?\$\{serializeScriptData\(data\)\}/);
  assert.doesNotMatch(insertion, /JSON\.stringify/);
});

test("real Chromium retains closing-script text as data in executable and JSON script elements", async () => {
  const original = { text: '</script><script>window.__unexpected=1</script><img id="unexpected-node">',
    mixed: "</ScRiPt ><script>window.__unexpected=2</script>", nested: ["<", "<!--", "\u2028\u2029"] };
  const encoded = serializeScriptData(original);
  assert.equal(encoded.includes("<"), false);
  assert.deepEqual(JSON.parse(encoded), original);
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setContent(`<script>window.actualData=${encoded}</script><script type="application/json" id="actual-json">${encoded}</script>`);
    const observed = await page.evaluate(() => ({ executable: window.actualData,
      json: JSON.parse(document.getElementById("actual-json").textContent), unexpected: window.__unexpected,
      node: Boolean(document.getElementById("unexpected-node")), scripts: document.scripts.length }));
    assert.deepEqual(observed.executable, original);
    assert.deepEqual(observed.json, original);
    assert.equal(observed.unexpected, undefined);
    assert.equal(observed.node, false);
    assert.equal(observed.scripts, 2);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); }
});
