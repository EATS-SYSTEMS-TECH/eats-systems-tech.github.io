import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { load } from "cheerio";
import { installHomeFeatureCards, installFeatureArrows } from "./homepage-feature-grid.mjs";

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
  assert.equal($("#connection-note").length, 1);
  assert.equal(cards.eq(0).find(".feature-card__text + #connection-note.feature-card__note[hidden]").length, 1);
  assert.equal($("#how-it-works .section__header").toString(), before);
});

test("invalid feature slots fail without changing any document content", () => {
  for (const markup of ["<main>Other page</main>", '<main id="how-it-works"><div class="features-grid">First</div><div class="features-grid">Second</div></main>']) {
    const $ = load(markup), before = $.html();
    assert.throws(() => installHomeFeatureCards($), /Homepage features require one grid/);
    assert.equal($.html(), before);
  }
});

test("every card carries one small arrow; only cards with a page of their own link, through the arrow alone", async () => {
  const $ = load(await readFile(new URL("../templates/index.template.html", import.meta.url), "utf8"));
  installHomeFeatureCards($);
  installFeatureArrows($, { pages: { "no-sim-router": "/no-sim-no-router/", "auto-open": "/auto-open/" } });
  const cards = $("#how-it-works > .features-grid > .feature-card");
  assert.equal(cards.find("> .feature-card__more").length, cards.length, "one arrow per card");
  assert.deepEqual($("a.feature-card__more").map((_, node) => $(node).attr("href")).get(), ["/no-sim-no-router/", "/auto-open/"]);
  assert.equal(cards.find("a").length, 2, "the arrow is the only link of a card");
  for (const link of $("a.feature-card__more").toArray()) assert.equal($(link).attr("aria-label"), $(link).closest(".feature-card").find(".feature-card__title").text().trim());
  // A card without a page shows the arrow, but it is not a link and stays out of the accessibility tree.
  const pending = $("span.feature-card__more--pending");
  assert.equal(pending.length, cards.length - 2);
  assert.ok(pending.toArray().every(node => $(node).attr("aria-hidden") === "true" && !$(node).attr("href")));
  assert.throws(() => installFeatureArrows($, { pages: {} }), /already present/);
});
