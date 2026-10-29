import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";
import { installHomeFeatureCards } from "./homepage-feature-grid.mjs";

test("homepage feature positions retain public identities, artwork revisions and translation slots", async () => {
  const $ = load(await readFile(new URL("../templates/index.template.html", import.meta.url), "utf8"));
  const before = $("#how-it-works .section__header").toString();
  const expected = [
    ["noSimRouter", "no-sim-router", "no_sim_no_router.svg?v=20260707e"],
    ["stability", "stability", "stability.svg?v=20260707an"],
    ["quickGuestInvite", "quick-guest-invite", "quick_guest_invite.svg?v=20260707i"],
    ["history30Day", "history-30-day", "history.svg?v=20260707p"],
    ["autoOpen", "auto-open", "auto_open.svg?v=20260707am"],
    ["upTo50Events", "events", "up_to_50_events.svg?v=20260707t"],
    ["rfRemoteLearning", "rf-remote-learning", "digital_rf_remote_learning.svg?v=20260707w"],
    ["securityPrivacy", "security-privacy", "security_privacy.svg?v=20260707ab"],
    ["noSubscriptionFees", "no-subscription-fees", "no_subscription_fees.svg?v=20260707af"],
  ];
  installHomeFeatureCards($);
  const cards = $("#how-it-works .features-grid > article");
  assert.equal(cards.length, 9);
  expected.forEach(([key, modifier, image], index) => {
    const card = cards.eq(index), picture = card.find("img");
    assert.equal(card.attr("class"), `feature-card feature-card--${modifier} js-reveal`);
    assert.equal(picture.attr("src"), `assets/wifigate_features/${image}`);
    assert.equal(picture.attr("alt"), ""); assert.equal(picture.attr("loading"), "lazy");
    for (const tag of ["title", "text"]) {
      const copy = card.find(`.feature-card__${tag}`);
      assert.equal(copy.attr("data-i18n"), `features.items.${key}.${tag}`);
      assert.equal(copy.attr("dir"), "ltr");
    }
  });
  assert.equal(cards.eq(3).find("h3").text(), "90-Day History", "legacy class/key does not change visible history length");
  assert.equal(cards.eq(7).find("h3").text(), "Security & Privacy");
  assert.equal($("#subscription-note").length, 1);
  assert.equal(cards.eq(8).find("#subscription-note[hidden]").length, 1);
  assert.equal($("#how-it-works .section__header").toString(), before);
});

test("invalid feature slots fail without changing any document content", () => {
  for (const markup of ["<main>Other page</main>", '<main id="how-it-works"><div class="features-grid">First</div><div class="features-grid">Second</div></main>']) {
    const $ = load(markup), before = $.html();
    assert.throws(() => installHomeFeatureCards($), /Homepage features require one grid/);
    assert.equal($.html(), before);
  }
});
