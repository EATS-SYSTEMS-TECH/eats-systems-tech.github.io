// Presentation-only adapters consume existing product/locale data. Building
// nodes and assigning text keeps copy separate from markup and access logic.
export const HOST_PAGE_KEY = "wifigate-host";
const marketingKey = "guestInvites.marketing";
const sectionNames = ["wa-audience", "wa-secure", "wa-pricing", "wa-cta"];

// Frozen plan facts describe the existing public offer, never a billing action.
const offers = [
  ["starter", "Starter", "₪29", "For a single property or entrance.",
    ["1 system", "Up to 1,000 guest invitations / month", "Automatic time-limited access"]],
  ["pro", "Pro", "₪99", "For a small management company.",
    ["Up to 5 systems", "1,000 invitations per system", "Priority email support"]],
  ["hotel", "Hotel", "₪299", "For a hotel or a whole complex.",
    ["Up to 20 systems", "Centralized reporting", "Preferred support"]],
  ["enterprise", "Enterprise", "Custom", "For PMS, channel managers and large portfolios.",
    ["Volume pricing", "SLA & onboarding", "Custom integration"]],
];
const audienceFacts = [["hotels", "Hotels"], ["rentals", "Airbnb & short-term rentals"],
  ["guesthouses", "Guesthouses"], ["parking", "Rental parking & garages"]];
const securityFacts = [
  ["Encrypted end to end", "Every invitation is encrypted, so access details cannot be read or copied in transit."],
  ["Works at the gate, not the cloud", "The entrance verifies access locally, so it keeps working even without a connection."],
  ["You stay in control", "Access is tied to each stay and each guest, and you can shut it down whenever you need to."],
];

// Text is always assigned with .text(); only constructed nodes enter .append().
function node($, tag, attributes = {}, contents = []) {
  const result = $(`<${tag}>`).attr(attributes);
  return typeof contents === "string" ? result.text(contents) : result.append(...contents);
}
function translated($, tag, className, key, text) {
  return node($, tag, { class: className, "data-i18n": key }, text);
}
function outline($, shapes, extra = {}) {
  return node($, "svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
    "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", ...extra },
  shapes.map(([tag, attributes]) => node($, tag, attributes)));
}

// Construct one plan with the fixed translation schema; Hotel and Enterprise
// are the only variants, independently controlling emphasis and price suffix.
function offerCard($, [key, name, amount, description, features]) {
  const prefix = `${marketingKey}.pricing`;
  const featured = key === "hotel";
  const custom = key === "enterprise";
  const priceAttributes = { class: "wa-plan__amount" };
  if (custom) priceAttributes["data-i18n"] = `${prefix}.enterpriseAmount`;
  const parts = [];
  if (featured) parts.push(translated($, "span", "wa-plan__badge", `${prefix}.hotelBadge`, "Most popular"));
  parts.push(node($, "h3", { class: "wa-plan__name" }, name));
  const price = node($, "div", { class: "wa-plan__price" }, [node($, "span", priceAttributes, amount)]);
  if (!custom) price.append(translated($, "span", "wa-plan__per", `${prefix}.per`, "/ month"));
  parts.push(price, translated($, "p", "wa-plan__desc", `${prefix}.${key}Desc`, description));
  parts.push(node($, "ul", { class: "wa-plan__features" }, features.map((text, index) =>
    node($, "li", { class: "wa-plan__feature" }, [
      outline($, [["path", { d: "m5 12 5 5L20 7" }]], { width: "16", height: "16", "stroke-width": "2.5", "aria-hidden": "true" }),
      node($, "span", { "data-i18n": `${prefix}.${key}F${index + 1}` }, text),
    ]))));
  parts.push(node($, "div", { class: "wa-plan__cta" }, [node($, "a", {
    class: `btn btn--${featured ? "primary" : "ghost"}`, href: "../index.html#contact", "data-i18n": `${prefix}.planCta`,
  }, "Talk to us")]));
  return node($, "article", { class: `wa-plan${featured ? " wa-plan--featured" : ""}` }, parts);
}

// All constructors complete before replacing the existing grid's children.
export function installHostPricingShells($) {
  const grid = $("section.wa-pricing .wa-pricing__grid");
  if (grid.length !== 1) throw new Error("Host pricing requires one plan grid");
  const cards = offers.map(offer => offerCard($, offer));
  grid.empty().append(...cards);
}

// The three icon geometries and public translation slots are existing data.
// Scope replacement to the home Host band, leaving all other lists untouched.
export function installHomeHostPointShells($) {
  const geometries = [
    [["rect", { x: "7", y: "2", width: "10", height: "20", rx: "2" }], ["path", { d: "M11 18h2" }]],
    [["circle", { cx: "12", cy: "12", r: "9" }], ["path", { d: "M12 7v5l3 3" }]],
    [["rect", { x: "4", y: "10", width: "16", height: "11", rx: "2" }], ["path", { d: "M8 10V7a4 4 0 0 1 8 0v3" }]],
  ];
  const rows = geometries.map((shapes, index) => {
    const text = ["title", "text"].map((kind, slot) => node($, "span", {
      class: `guest-invites__point-${kind}`, "data-i18n": `guestInvites.promo.point${index + 1}${slot ? "Text" : "Title"}`, dir: "ltr",
    }));
    return node($, "li", { class: "guest-invites__point" }, [
      node($, "span", { class: "guest-invites__point-icon", "aria-hidden": "true" }, [outline($, shapes)]),
      node($, "span", { class: "guest-invites__point-copy" }, text),
    ]);
  });
  $("#wifigate-automation .guest-invites__points").empty().append(...rows);
}

// Validate the entire destination before touching any list; missing/ambiguous
// sections cannot leave a partly updated public fragment.
export function installHostDetailShells($) {
  const [audience, security, pricing] = ["section.wa-audience .wa-audience__row", "section.wa-secure .wa-secure__grid",
    "section.wa-pricing .wa-pricing__grid"].map(selector => $(selector));
  if ([audience, security, pricing].some(selection => selection.length !== 1)) {
    throw new Error("Host details require one audience row, security grid and plan grid");
  }
  const chips = [translated($, "span", "wa-audience__label", `${marketingKey}.audience.label`, "Built for:"),
    ...audienceFacts.map(([key, text]) => translated($, "span", "wa-chip", `${marketingKey}.audience.${key}`, text))];
  const cards = securityFacts.map(([title, text], index) => node($, "article", { class: "wa-secure__item" }, [
    translated($, "h3", "wa-secure__title", `${marketingKey}.secure.i${index + 1}t`, title),
    translated($, "p", "wa-secure__text", `${marketingKey}.secure.i${index + 1}x`, text),
  ]));
  const plans = offers.map(offer => offerCard($, offer));
  audience.empty().append(...chips);
  security.empty().append(...cards);
  pricing.empty().append(...plans);
}

// Read a path without accepting blank/nontext fallback data. Each returned
// record/array is new; locale inputs remain owned by their source modules.
function localized(source, path, diagnostic = path) {
  const value = path.split(".").reduce((value, key) => value?.[key], source);
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing localized WIFIGATE Host copy: ${diagnostic}`);
  return value;
}
export function getHostPageContent(hostCopy, homepageCopy) {
  const read = path => localized(hostCopy, path);
  const ordered = (icons, group, marker) => icons.map((icon, index) => ({ icon,
    title: read(`marketing.${group}.${marker}${index + 1}t`), text: read(`marketing.${group}.${marker}${index + 1}x`),
  }));
  return { label: "WIFIGATE Host", eyebrow: read("marketing.hero.eyebrow"), title: read("marketing.hero.title"),
    heroLead: read("marketing.hero.lead"), imageAlt: localized(homepageCopy, "automation.imageAlt", "homepage.automation.imageAlt"),
    highlights: ordered(["calendar", "invite", "phone"], "steps", "s"), benefitsTitle: read("marketing.benefits.title"),
    benefits: ordered(["key-off", "calendar-clock", "shield-check", "door-open", "building", "layers"], "benefits", "b"),
    faq: [], seoTitle: read("metaTitle"), seoDescription: read("metaDescription") };
}

// Clone the already localized detail nodes in their original document order;
// create and attach a scoped wrapper only after every guard succeeds.
export function appendHostMarketingDetails($, { legacyTemplate }) {
  if (typeof legacyTemplate !== "function") throw new Error("A localized Host detail document is required");
  if ($(".host-marketing-details").length) throw new Error("Host marketing details are already present");
  const target = $("#niche-benefits");
  if (target.length !== 1) throw new Error("Host details require one shared benefits section");
  for (const name of sectionNames) {
    if (legacyTemplate(`section.${name}`).length !== 1) throw new Error(`Host details require one localized .${name} section`);
  }
  const sections = legacyTemplate(sectionNames.map(name => `section.${name}`).join(", ")).toArray()
    .map(section => legacyTemplate(section).clone());
  const wrapper = node($, "div", { class: "wa-page host-marketing-details" }, sections);
  target.after(wrapper);
  return wrapper;
}
