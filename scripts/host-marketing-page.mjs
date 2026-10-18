// The public Host page shares the use-case hero, highlights and benefit cards.
// Its wording and commercial details remain owned by the existing locale copy.
export const HOST_PAGE_KEY = "wifigate-host";

const HIGHLIGHT_ICONS = ["calendar", "invite", "phone"];
const BENEFIT_ICONS = ["key-off", "calendar-clock", "shield-check", "door-open", "building", "layers"];
const DETAIL_SECTIONS = [".wa-audience", ".wa-secure", ".wa-pricing", ".wa-cta"];

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
