import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import * as cheerio from "cheerio";
import { SECURITY_PROOF_COPY, SECURITY_PROOF_PAGE_KEY, securityProofCopy } from "./security-proof.mjs";

const page = async path => cheerio.load(await fs.readFile(new URL(path, import.meta.url), "utf8"));

test("the Hebrew security page shows the panel under the hero, above the three points", async () => {
  const $ = await page("../he/security-privacy/index.html"), copy = SECURITY_PROOF_COPY.he;
  const order = $("main section, body > section").toArray().map(node => $(node).attr("id")).filter(Boolean);
  assert.equal(order[order.indexOf("security-proof") + 1], "niche-highlights", order.join(","));
  assert.ok($("#security-proof").prevAll("section").first().hasClass("niche-hero"));
  assert.equal($("#security-proof-title").text().replace(/‏/g, ""), copy.title);
  assert.equal($(".security-proof__layer").length, 4);
  assert.deepEqual($(".security-proof__tool bdi").toArray().map(node => $(node).text()), copy.tools.map(tool => tool.name));
  assert.equal($(".security-proof__note").text().replace(/\u200f/g, ""), copy.note);
  assert.equal($("link[href*='css/security-proof.css']").length, 1);
});

test("the panel is limited to the security page and to the locales that have it", async () => {
  assert.equal(securityProofCopy("access-history", "he"), null);
  assert.equal(securityProofCopy(SECURITY_PROOF_PAGE_KEY, "zz"), null);
  for (const path of ["../security-privacy/index.html", "../he/access-history/index.html"]) {
    const $ = await page(path);
    assert.equal($("#security-proof").length, 0, path);
    assert.equal($("link[href*='css/security-proof.css']").length, 0, path);
  }
});

test("the public panel names no implementation details", () => {
  const text = JSON.stringify(SECURITY_PROOF_COPY);
  for (const detail of ["ESP32", "AES", "ECDH", "HMAC", "BLE", "Bluetooth", "שער"]) assert.ok(!text.includes(detail), detail);
});
