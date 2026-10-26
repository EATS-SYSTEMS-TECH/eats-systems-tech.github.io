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
