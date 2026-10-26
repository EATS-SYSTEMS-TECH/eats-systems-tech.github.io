// The public Host page shares the use-case hero, highlights and benefit cards.
// Its wording and commercial details remain owned by the existing locale copy.
export const HOST_PAGE_KEY = "wifigate-host";

const HIGHLIGHT_ICONS = ["calendar", "invite", "phone"];
const BENEFIT_ICONS = ["key-off", "calendar-clock", "shield-check", "door-open", "building", "layers"];
const DETAIL_SECTIONS = [".wa-audience", ".wa-secure", ".wa-pricing", ".wa-cta"];

// The homepage owns three ordered Host benefit slots. Keep their geometric
// icons separate from locale text; the existing copy pipeline fills every slot.
const HOME_POINT_SHAPES = [
  ['<rect x="7" y="2" width="10" height="20" rx="2"></rect>', '<path d="M11 18h2"></path>'],
  ['<circle cx="12" cy="12" r="9"></circle>', '<path d="M12 7v5l3 3"></path>'],
  ['<rect x="4" y="10" width="16" height="11" rx="2"></rect>', '<path d="M8 10V7a4 4 0 0 1 8 0v3"></path>'],
];

// Build the repeated card structure once, before translation and per-locale
// icon overrides. Preserve public classes, SVG attributes, data keys and source
// whitespace so unchanged locale copy produces identical serialized pages.
export function installHomeHostPointShells($) {
  const rows = HOME_POINT_SHAPES.map((shapes, index) => `              <li class="guest-invites__point">
                <span class="guest-invites__point-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
${shapes.map(shape => `                    ${shape}`).join("\n")}
                  </svg>
                </span>
                <span class="guest-invites__point-copy">
                  <span class="guest-invites__point-title" data-i18n="guestInvites.promo.point${index + 1}Title" dir="ltr"></span>
                  <span class="guest-invites__point-text" data-i18n="guestInvites.promo.point${index + 1}Text" dir="ltr"></span>
                </span>
              </li>`);
  // Scope installation to the homepage Host band; other use-case lists and
  // the separate Host detail template remain untouched.
  $("#wifigate-automation .guest-invites__points").html(`\n${rows.join("\n")}\n            `);
}

// Plan identity, prices and existing translation keys are presentation data.
// They describe the public contact offer only; this module never bills users.
const HOST_PLANS = [
  { key: "starter", name: "Starter", amount: "₪29", description: "For a single property or entrance.",
    features: ["1 system", "Up to 1,000 guest invitations / month", "Automatic time-limited access"] },
  { key: "pro", name: "Pro", amount: "₪99", description: "For a small management company.",
    features: ["Up to 5 systems", "1,000 invitations per system", "Priority email support"] },
  { key: "hotel", name: "Hotel", amount: "₪299", featured: true, description: "For a hotel or a whole complex.",
    features: ["Up to 20 systems", "Centralized reporting", "Preferred support"] },
  { key: "enterprise", name: "Enterprise", amount: "Custom", custom: true,
    description: "For PMS, channel managers and large portfolios.",
    features: ["Volume pricing", "SLA &amp; onboarding", "Custom integration"] },
];

// Every feature uses the same decorative checkmark and an existing copy slot.
// Keep the SVG adjacent to its span so inline spacing and accessibility stay put.
function hostPlanFeature(key, fallback) {
  return `              <li class="wa-plan__feature"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                  aria-hidden="true">
                  <path d="m5 12 5 5L20 7" />
                </svg><span data-i18n="guestInvites.marketing.pricing.${key}">${fallback}</span></li>`;
}

// Compose all four plans from one card structure before the existing locale
// translator runs. Only Hotel is featured; Enterprise has no monthly suffix.
function hostPlanShell(plan) {
  const prefix = "guestInvites.marketing.pricing";
  const badge = plan.featured
    ? `            <span class="wa-plan__badge" data-i18n="${prefix}.hotelBadge">Most popular</span>\n` : "";
  const amountKey = plan.custom ? ` data-i18n="${prefix}.enterpriseAmount"` : "";
  const period = plan.custom ? "" : `<span class="wa-plan__per" data-i18n="${prefix}.per">/ month</span>`;
  const features = plan.features.map((copy, index) => hostPlanFeature(`${plan.key}F${index + 1}`, copy));
  return `          <article class="wa-plan${plan.featured ? " wa-plan--featured" : ""}">
${badge}            <h3 class="wa-plan__name">${plan.name}</h3>
            <div class="wa-plan__price"><span class="wa-plan__amount"${amountKey}>${plan.amount}</span>${period}</div>
            <p class="wa-plan__desc" data-i18n="${prefix}.${plan.key}Desc">${plan.description}</p>
            <ul class="wa-plan__features">
${features.join("\n")}
            </ul>
            <div class="wa-plan__cta"><a class="btn btn--${plan.featured ? "primary" : "ghost"}" href="../index.html#contact"
                data-i18n="${prefix}.planCta">Talk to us</a></div>
          </article>`;
}

// Replace only the dedicated pricing slot. Validate the fragment before any
// mutation so a missing/ambiguous slot cannot publish a partial Host detail page.
export function installHostPricingShells($) {
  const slot = $("section.wa-pricing .wa-pricing__grid");
  if (slot.length !== 1) throw new Error("Host pricing requires one plan grid");
  slot.html(`\n${HOST_PLANS.map(hostPlanShell).join("\n\n")}\n        `);
}

// The audience labels and security explanations retain their existing public
// order and copy keys. Locale modules still own the final published wording.
const HOST_AUDIENCES = [
  ["hotels", "Hotels"], ["rentals", "Airbnb &amp; short-term rentals"],
  ["guesthouses", "Guesthouses"], ["parking", "Rental parking &amp; garages"],
];
const HOST_SECURITY = [
  ["Encrypted end to end", "Every invitation is encrypted, so access details cannot be read or copied in transit."],
  ["Works at the gate, not the cloud", "The entrance verifies access locally, so it keeps working even without a connection."],
  ["You stay in control", "Access is tied to each stay and each guest, and you can shut it down whenever you need to."],
];

// Compose the repeated detail lists and the existing pricing cards together.
// Validate every required slot before changing any of them; section headings,
// accessible labels and the final contact action remain in the source template.
export function installHostDetailShells($) {
  const audience = $("section.wa-audience .wa-audience__row");
  const security = $("section.wa-secure .wa-secure__grid");
  const pricing = $("section.wa-pricing .wa-pricing__grid");
  if ([audience, security, pricing].some(slot => slot.length !== 1)) {
    throw new Error("Host details require one audience row, security grid and plan grid");
  }
  // A single keyed span structure owns all four audience labels. Keep the lead
  // label separate so translators and styles continue to identify it correctly.
  const chips = HOST_AUDIENCES.map(([key, text]) =>
    `        <span class="wa-chip" data-i18n="guestInvites.marketing.audience.${key}">${text}</span>`);
  const audienceMarkup = `\n        <span class="wa-audience__label" data-i18n="guestInvites.marketing.audience.label">Built for:</span>\n${chips.join("\n")}\n      `;
  // Security cards share one title/body shape and retain their original i1..i3
  // translation slots. This is marketing presentation, not access enforcement.
  const cards = HOST_SECURITY.map(([title, text], index) => `          <article class="wa-secure__item">
            <h3 class="wa-secure__title" data-i18n="guestInvites.marketing.secure.i${index + 1}t">${title}</h3>
            <p class="wa-secure__text" data-i18n="guestInvites.marketing.secure.i${index + 1}x">${text}</p>
          </article>`);
  audience.html(audienceMarkup);
  security.html(`\n${cards.join("\n")}\n        `);
  installHostPricingShells($);
}

function requiredText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing localized WIFIGATE Host copy: ${field}`);
  }
  return value;
}

export function getHostPageContent(hostCopy, homepageCopy) {
  const marketing = hostCopy?.marketing;
  const text = (value, field) => requiredText(value, field);
  return {
    label: "WIFIGATE Host",
    eyebrow: text(marketing?.hero?.eyebrow, "marketing.hero.eyebrow"),
    title: text(marketing?.hero?.title, "marketing.hero.title"),
    heroLead: text(marketing?.hero?.lead, "marketing.hero.lead"),
    imageAlt: text(homepageCopy?.automation?.imageAlt, "homepage.automation.imageAlt"),
    highlights: HIGHLIGHT_ICONS.map((icon, index) => ({
      icon,
      title: text(marketing?.steps?.[`s${index + 1}t`], `marketing.steps.s${index + 1}t`),
      text: text(marketing?.steps?.[`s${index + 1}x`], `marketing.steps.s${index + 1}x`),
    })),
    benefitsTitle: text(marketing?.benefits?.title, "marketing.benefits.title"),
    benefits: BENEFIT_ICONS.map((icon, index) => ({
      icon,
      title: text(marketing?.benefits?.[`b${index + 1}t`], `marketing.benefits.b${index + 1}t`),
      text: text(marketing?.benefits?.[`b${index + 1}x`], `marketing.benefits.b${index + 1}x`),
    })),
    faq: [],
    seoTitle: text(hostCopy?.metaTitle, "metaTitle"),
    seoDescription: text(hostCopy?.metaDescription, "metaDescription"),
  };
}

// `legacyTemplate` is the already localized Cheerio document. Clone these four
// sections in their document order, including the exact plan amounts and links.
// Keeping .wa-page on this inner wrapper confines the former page's typography
// and button rules to its details, outside the shared hero and site header.
export function appendHostMarketingDetails($, { legacyTemplate }) {
  if (typeof legacyTemplate !== "function") throw new Error("A localized Host detail document is required");
  if ($(".host-marketing-details").length) throw new Error("Host marketing details are already present");
  const anchor = $("#niche-benefits");
  if (anchor.length !== 1) throw new Error("Host details require one shared benefits section");
  for (const selector of DETAIL_SECTIONS) {
    if (legacyTemplate(`section${selector}`).length !== 1) {
      throw new Error(`Host details require one localized ${selector} section`);
    }
  }
  const wrapper = $("<div>").addClass("wa-page host-marketing-details");
  for (const section of legacyTemplate(DETAIL_SECTIONS.map(selector => `section${selector}`).join(", ")).toArray()) {
    wrapper.append(legacyTemplate(section).clone());
  }
  anchor.after(wrapper);
  return wrapper;
}
