import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";
import { PLAN_ART_NAMES, PLAN_ART_WIDTH, hasPlanArt, planArt, planArtSvg } from "./plan-art.mjs";

test("plan drawings are plain line shapes in the page's colour, and the plant grows from plan to plan", () => {
  assert.deepEqual([...PLAN_ART_NAMES], ["sprout", "sapling", "tree", "systems", "organizations"]);
  for (const name of PLAN_ART_NAMES) {
    const art = planArt(name), svg = planArtSvg(name);
    assert.equal(art.width, PLAN_ART_WIDTH);
    assert.ok(art.shapes.length >= 5, name);
    for (const [tag, attributes] of art.shapes) {
      assert.ok(["path", "circle"].includes(tag), `${name}: ${tag}`);
      for (const [key, value] of Object.entries(attributes)) assert.equal(typeof value, "string", `${name}: ${tag} ${key}`);
      for (const key of ["fill", "stroke"]) assert.ok([undefined, "none", "currentColor"].includes(attributes[key]), `${name}: ${key} follows the page`);
    }
    assert.ok(!/\sid=|<style|<script|href=|url\(|#[0-9a-f]{3,8}\b/i.test(svg), `${name}: no ids, styles, references or fixed colours`);
  }
  assert.ok(planArt("sprout").height < planArt("sapling").height && planArt("sapling").height < planArt("tree").height);
  assert.equal(hasPlanArt("toString"), false);
  assert.throws(() => planArt("no-such-drawing"), /Unknown plan drawing/);
});

test("built Host and Manager pages stand a drawing on their plan cards, and the cards carry no corner dots", async () => {
  const read = async file => load(await fs.readFile(new URL(`../${file}`, import.meta.url), "utf8"));
  for (const file of ["wifigate-host/index.html", "he/wifigate-host/index.html"]) {
    const $ = await read(file), plans = $(".wa-pricing__grid--crest > .wa-plan");
    assert.equal(plans.length, 3, file);
    assert.equal(plans.find("> svg.wa-plan__crest").length, 3, `${file}: one plant on each plan`);
    assert.equal($(".wa-plan__badge").length, 0, `${file}: the plants replace the badge`);
  }
  for (const file of ["wifigate-manager/index.html", "he/wifigate-manager/index.html"]) {
    const $ = await read(file), plans = $(".wa-pricing__grid--crest > .wa-plan");
    assert.deepEqual(plans.map((_, node) => $(node).children("svg.wa-plan__crest").length).get(), [1, 1, 0], `${file}: a gate, the buildings, and the example's own label`);
    assert.equal(plans.eq(2).find(".wa-plan__name--sticker").length, 1, file);
    assert.equal(plans.filter(".wa-plan--crest-start").length, 2, file);
  }
  const css = await fs.readFile(new URL("../css/automation.css", import.meta.url), "utf8");
  assert.ok(!/\.wa-plan::(before|after)/.test(css), "no corner dots");
  assert.match(css, /\.wa-plan__crest\s*\{[^}]*inset-block-end:\s*100%;/);
});
