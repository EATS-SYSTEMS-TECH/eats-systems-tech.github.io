// Presentation-only adapters consume existing product/locale data. Building
// nodes and assigning text keeps copy separate from markup and access logic.
export const HOST_PAGE_KEY = "wifigate-host";
const marketingKey = "guestInvites.marketing";
const sectionNames = ["wa-audience", "wa-secure", "wa-pricing", "wa-cta"];
const detailNames = sectionNames.filter(name => name !== "wa-pricing");

// The documented WIFIGATE Host plans (WIFIGATE_HOST.html, Pricing), always in
// USD per active system per month. They describe the offer, never a billing action.
const offers = [
  ["start", "START", "$6", "For small businesses starting to automate guest access.", "For 1–14 active systems",
    ["Complete CRM/PMS reservation automation", "Up to 14 active systems", "A booking calendar per system", "Google/Apple Sign-In and admin MFA"]],
  ["growth", "GROWTH", "$5", "For hotels and management companies running many systems from one place.", "For 15–49 active systems",
    ["Everything in START", "Up to 49 active systems", "Multiple CRM/PMS connections and routing rules", "Team roles and priority support"]],
  ["scale", "SCALE", "$4", "For hotel groups, large portfolios and enterprise rollouts.", "For 50+ active systems",
    ["Everything in GROWTH", "50+ active systems", "Sandbox, custom roles and extended audit", "Enterprise rollout support"]],
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

// Construct one plan with the fixed translation schema; GROWTH is the featured plan.
function offerCard($, [key, name, amount, description, range, features]) {
  const prefix = `${marketingKey}.pricing`;
  const featured = key === "growth";
  const parts = [];
  if (featured) parts.push(translated($, "span", "wa-plan__badge", `${prefix}.badge`, "Most popular"));
  parts.push(node($, "h3", { class: "wa-plan__name" }, name));
  const price = node($, "div", { class: "wa-plan__price" }, [node($, "span", { class: "wa-plan__amount", dir: "ltr" }, amount),
    translated($, "span", "wa-plan__per", `${prefix}.per`, "/ system / month")]);
  parts.push(price, translated($, "p", "wa-plan__range", `${prefix}.${key}Range`, range),
    translated($, "p", "wa-plan__desc", `${prefix}.${key}Desc`, description));
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

// Clone the already localized detail nodes in their original document order.
// The plans come first, right under the hero; the other details follow the
// shared benefits. Both wrappers attach only after every guard succeeds.
export function appendHostMarketingDetails($, { legacyTemplate }) {
  if (typeof legacyTemplate !== "function") throw new Error("A localized Host detail document is required");
  if ($(".host-marketing-details, .host-marketing-pricing").length) throw new Error("Host marketing details are already present");
  const hero = $(".niche-hero"), target = $("#niche-benefits");
  if (hero.length !== 1) throw new Error("Host details require one shared hero section");
  if (target.length !== 1) throw new Error("Host details require one shared benefits section");
  for (const name of sectionNames) {
    if (legacyTemplate(`section.${name}`).length !== 1) throw new Error(`Host details require one localized .${name} section`);
  }
  const clone = names => legacyTemplate(names.map(name => `section.${name}`).join(", ")).toArray()
    .map(section => legacyTemplate(section).clone());
  const pricing = node($, "div", { class: "wa-page host-marketing-pricing" }, clone(["wa-pricing"]));
  const wrapper = node($, "div", { class: "wa-page host-marketing-details" }, clone(detailNames));
  hero.after(pricing);
  target.after(wrapper);
  return wrapper;
}
