// Keep the nine public feature positions stable: the existing locale copy
// pipeline addresses them by index. Keys, artwork revisions and legacy classes
// remain compatibility data even when their visible wording has evolved.
const HOME_FEATURES = [
  { key: "noSimRouter", classes: "feature-card feature-card--no-sim-router js-reveal", image: "assets/wifigate_features/no_sim_no_router.svg?v=20260707e",
    title: "No SIM, No Router",
    text: "WIFIGATE works directly with the device, with no SIM card, no internet plan, and no external Wi-Fi router required." },
  { key: "stability", classes: "feature-card feature-card--stability js-reveal", image: "assets/wifigate_features/stability.svg?v=20260707an",
    title: "Stability",
    text: "A streamlined architecture keeps access responsive and dependable while supporting secure, private, encrypted operation." },
  { key: "quickGuestInvite", classes: "feature-card feature-card--quick-guest-invite js-reveal", image: "assets/wifigate_features/quick_guest_invite.svg?v=20260707i",
    title: "Quick Guest Invite",
    text: "Send a secure guest invitation in seconds so visitors can enter without calls, shared remotes, or manual coordination." },
  { key: "history30Day", classes: "feature-card feature-card--history-30-day js-reveal", image: "assets/wifigate_features/history.svg?v=20260707p",
    title: "90-Day History",
    text: "Review the last 90 days of access activity for clearer visibility into gate usage and recent entry events." },
  { key: "autoOpen", classes: "feature-card feature-card--auto-open js-reveal", image: "assets/wifigate_features/auto_open.svg?v=20260707am",
    title: "Auto Open",
    text: "Let approved users open the gate automatically when they arrive for a smoother, more convenient hands-free experience." },
  { key: "upTo50Events", classes: "feature-card feature-card--events js-reveal", image: "assets/wifigate_features/up_to_50_events.svg?v=20260707t",
    title: "Up to 50 Scheduled Events",
    text: "Create recurring access schedules and automated actions directly in the system to match how your site operates." },
  { key: "rfRemoteLearning", classes: "feature-card feature-card--rf-remote-learning js-reveal", image: "assets/wifigate_features/digital_rf_remote_learning.svg?v=20260707w",
    title: "Digital RF Remote Learning",
    text: "Teach and manage RF remotes digitally through the platform instead of relying on manual programming workflows." },
  { key: "securityPrivacy", classes: "feature-card feature-card--security-privacy js-reveal", image: "assets/wifigate_features/security_privacy.svg?v=20260707ab",
    title: "Security & Privacy",
    text: "WIFIGATE is designed around secure handling, encrypted storage, and private operation." },
  { key: "noSubscriptionFees", classes: "feature-card feature-card--no-subscription-fees js-reveal", image: "assets/wifigate_features/no_subscription_fees.svg?v=20260707af",
    title: "No Subscription Fees",
    text: "Pay once for the device and installation, with no monthly subscription, renewal cycle, or ongoing platform fee." },
];

// Fallback copy is text content, including literal ampersands. Escape it once
// when producing HTML; the existing locale pipeline subsequently fills the slots.
const textHtml = text => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// One card structure owns media, title and explanatory copy. Only the existing
// no-subscription card retains its initially hidden, uniquely identified note.
function featureCard(feature) {
  const note = feature.key === "noSubscriptionFees"
    ? '\n            <p class="feature-card__note" id="subscription-note" hidden></p>' : "";
  return `          <article class="${feature.classes}">
            <figure class="feature-card__media">
              <img src="${feature.image}" alt="" class="feature-card__image" loading="lazy">
            </figure>
            <h3 class="feature-card__title" data-i18n="features.items.${feature.key}.title" dir="ltr">${textHtml(feature.title)}</h3>
            <p class="feature-card__text" data-i18n="features.items.${feature.key}.text" dir="ltr">${textHtml(feature.text)}</p>${note}
          </article>`;
}

// Compose before asset rewriting, translation and Auto Open link wrapping.
// Restrict replacement to the original feature slot and reject invalid templates
// before mutation rather than publishing a page with missing feature cards.
export function installHomeFeatureCards($) {
  const slot = $("#how-it-works > .features-grid");
  if (slot.length !== 1) throw new Error("Homepage features require one grid");
  slot.html(`\n${HOME_FEATURES.map(featureCard).join("\n\n")}\n        `);
}
