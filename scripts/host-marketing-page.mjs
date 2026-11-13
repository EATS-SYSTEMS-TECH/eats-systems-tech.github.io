// Presentation-only adapters consume existing product/locale data. Building
// nodes and assigning text keeps copy separate from markup and access logic.
// The WIFIGATE Host and WIFIGATE Manager pages share one layout; each product
// supplies its own plans, audience and icons.
import { AUDIENCE_ART, AUDIENCE_ART_SIZE, audienceArtPath } from "./audience-art.mjs";
import { planArt } from "./plan-art.mjs";

export const HOST_PAGE_KEY = "wifigate-host";
export const MANAGER_PAGE_KEY = "wifigate-manager";
const marketingKey = "guestInvites.marketing";
const sectionNames = ["wa-audience", "wa-pricing", "wa-shop"];
// Step illustrations and the wave that carries them (assets/img/subscription-flow/).
const flowArt = "assets/img/subscription-flow/";
// Version of the audience drawings (assets/img/audience/); change it with them.
export const AUDIENCE_ART_VERSION = "20261112b";

// Plans describe the documented offer in USD, never a billing action.
// Host: WIFIGATE_HOST.html, Pricing. Manager: WIFIGATE_MANAGER.html, Price.
// A plan without a fixed name or price suffix takes them from its copy.
// `crest` names the drawing that stands on the card's top edge (scripts/plan-art.mjs):
// centred on the Host plans, which show one plant at three ages and carry no badge;
// at the start edge on the Manager cards, where the worked example has its label.
const PRODUCTS = {
  host: {
    label: "WIFIGATE Host", featured: "growth", badge: null, crestAt: "center",
    offers: [
      { key: "start", crest: "sprout", name: "START", amount: "$6", per: "/ system / month", description: "For a guesthouse, a vacation rental or a small business starting to host without keys.", range: "For 1–14 active systems",
        features: ["An automatic access link for every booking, from your booking system", "Up to 14 active systems", "A booking calendar per system", "Google or Apple sign-in and two-step verification for admins"] },
      { key: "growth", crest: "sapling", name: "GROWTH", amount: "$5", per: "/ system / month", description: "For hotels and management companies running many systems from one place.", range: "For 15–49 active systems",
        features: ["Everything in START", "Up to 49 active systems", "Several booking-system connections, with routing rules", "Team roles and priority support"] },
      { key: "scale", crest: "tree", name: "SCALE", amount: "$4", per: "/ system / month", description: "For hotel groups, large portfolios and enterprise rollouts.", range: "For 50+ active systems",
        features: ["Everything in GROWTH", "50+ active systems", "A test environment, custom roles and an extended activity log", "Enterprise rollout support"] },
    ],
    audience: [["hotels", "Hotels"], ["rentals", "Airbnb & short-term rentals"], ["guesthouses", "Guesthouses"], ["parking", "Rental parking & garages"]],
    highlights: ["calendar", "invite", "phone"],
    benefits: ["key-off", "calendar-clock", "shield-check", "door-open", "building", "layers"],
    art: "host",
    // The customer types shown on the page: the homepage's localized list, which ends with "And more…".
    audienceList: "automation.audiences",
    imageAlt: "automation.imageAlt",
  },
  manager: {
    label: "WIFIGATE Manager", featured: "systems", badge: "One simple price", crestAt: "start",
    offers: [
      { key: "systems", crest: "systems", name: "Systems", amount: "$1.90", per: "/ system / month", translated: true, description: "Every active system on your dashboard, wherever it is.", range: "Gate, Dual Control or roller shutter",
        features: ["Each system counts once, even in several groups", "Groups are free: only their systems count", "Monthly minimum: $1.90, even with no linked system", "A system added mid-month is charged by days"] },
      { key: "organizations", crest: "organizations", name: "Organizations", amount: "$1", per: "/ extra organization / month", translated: true, description: "Run separate buildings, clients or companies under one account.", range: "First 3 organizations free",
        features: ["3 free organizations in every account", "$1 per month for each additional organization", "Organization admins do not pay", "One account, one monthly invoice"] },
      { key: "example", name: "Example", amount: "$21", per: "/ month", translated: true, sticker: true, description: "10 systems × $1.90, plus 2 extra organizations × $1.", range: "10 systems · 5 organizations",
        features: ["1 gate: $1.90 / month", "A group of 2 gates and 1 Dual Control: $5.70", "1 roller shutter: $1.90 / month", "Monthly estimate before tax"] },
    ],
    audience: [["residential", "Residential buildings"], ["offices", "Offices"], ["sports", "Sports facilities"], ["parking", "Parking facilities"]],
    highlights: ["gate", "roster", "phone"],
    benefits: ["building", "users", "history", "layers", "smartphone", "gate"],
    art: "manager",
    audienceList: "automation.manager.audiences",
    imageAlt: "automation.manager.imageAlt",
  },
};
// Eight questions per page, each with its own answer in the page copy.
const questionCount = 8;
// A step may mark the words that link to the sign-in page as [[words]]; everywhere else they read as plain text.
const linkMarker = /\[\[(.+?)\]\]/;
const unmarked = text => text.replace(/\[\[(.+?)\]\]/g, "$1");
const productOf = name => {
  if (!PRODUCTS[name]) throw new Error(`Unknown subscription page: ${name}`);
  return PRODUCTS[name];
};

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

// Construct one plan with the fixed translation schema; one plan per product is featured.
// A plan marked `sticker` (a worked example, not an offer) shows its name as a label stuck over the card's top edge.
function offerCard($, { key, name, amount, per, translated: named, description, range, features, sticker = false, crest = "" }, product) {
  const prefix = `${marketingKey}.pricing`;
  const featured = key === product.featured;
  const parts = [];
  if (crest) {
    const art = planArt(crest);
    parts.push(node($, "svg", { class: "wa-plan__crest", viewBox: `0 0 ${art.width} ${art.height}`, width: String(art.width), height: String(art.height), fill: "none", stroke: "currentColor",
      "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" }, art.shapes.map(([tag, attributes]) => node($, tag, attributes))));
  }
  if (featured && product.badge) parts.push(translated($, "span", "wa-plan__badge", `${prefix}.badge`, product.badge));
  const nameClass = sticker ? "wa-plan__name wa-plan__name--sticker" : "wa-plan__name";
  parts.push(named ? translated($, "h3", nameClass, `${prefix}.${key}Name`, name) : node($, "h3", { class: nameClass }, name));
  const price = node($, "div", { class: "wa-plan__price" }, [node($, "span", { class: "wa-plan__amount", dir: "ltr" }, amount),
    translated($, "span", "wa-plan__per", named ? `${prefix}.${key}Per` : `${prefix}.per`, per)]);
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
  const crestClass = crest ? ` wa-plan--crest wa-plan--crest-${product.crestAt} wa-plan--crest-${crest}` : "";
  return node($, "article", { class: `wa-plan${featured ? " wa-plan--featured" : ""}${sticker ? " wa-plan--sticker" : ""}${crestClass}` }, parts);
}

// All constructors complete before replacing the existing grid's children.
export function installHostPricingShells($, productName = "host") {
  const product = productOf(productName);
  const grid = $("section.wa-pricing .wa-pricing__grid");
  if (grid.length !== 1) throw new Error("Host pricing requires one plan grid");
  const cards = product.offers.map(offer => offerCard($, offer, product));
  grid.empty().addClass("wa-pricing__grid--crest").append(...cards);
}

// Validate the entire destination before touching any list; missing/ambiguous
// sections cannot leave a partly updated public fragment.
export function installHostDetailShells($, productName = "host") {
  const product = productOf(productName);
  const [audience, pricing] = ["section.wa-audience .wa-audience__row", "section.wa-pricing .wa-pricing__grid"].map(selector => $(selector));
  if ([audience, pricing].some(selection => selection.length !== 1)) {
    throw new Error("Host details require one audience row and plan grid");
  }
  const chips = [translated($, "span", "wa-audience__label", `${marketingKey}.audience.label`, "Built for:"),
    ...product.audience.map(([key, text]) => translated($, "span", "wa-chip", `${marketingKey}.audience.${key}`, text))];
  const plans = product.offers.map(offer => offerCard($, offer, product));
  audience.empty().append(...chips);
  pricing.empty().addClass("wa-pricing__grid--crest").append(...plans);
}

// Read a path without accepting blank/nontext fallback data. Each returned
// record/array is new; locale inputs remain owned by their source modules.
function localized(source, path, diagnostic = path, label = "WIFIGATE Host") {
  const value = path.split(".").reduce((value, key) => value?.[key], source);
  if (typeof value !== "string" || !value.trim()) throw new Error(`Missing localized ${label} copy: ${diagnostic}`);
  return value;
}
// The audience list is never closed: it needs at least one customer type and the open ending.
function localizedList(source, path, label) {
  const value = path.split(".").reduce((value, key) => value?.[key], source);
  if (!Array.isArray(value) || value.length < 2 || value.some(item => typeof item !== "string" || !item.trim())) throw new Error(`Missing localized ${label} copy: homepage.${path}`);
  return [...value];
}
export function getHostPageContent(hostCopy, homepageCopy, productName = "host") {
  const product = productOf(productName);
  const read = path => localized(hostCopy, path, path, product.label);
  const ordered = (icons, group, marker) => icons.map((icon, index) => ({ icon,
    title: read(`marketing.${group}.${marker}${index + 1}t`), text: read(`marketing.${group}.${marker}${index + 1}x`),
  }));
  return { label: product.label, eyebrow: read("marketing.hero.eyebrow"), title: read("marketing.hero.title"),
    heroLead: read("marketing.hero.lead"), imageAlt: localized(homepageCopy, product.imageAlt, `homepage.${product.imageAlt}`, product.label),
    audiences: localizedList(homepageCopy, product.audienceList, product.label),
    highlights: ordered(product.highlights, "steps", "s"), benefitsTitle: read("marketing.benefits.title"),
    benefits: ordered(product.benefits, "benefits", "b"),
    stepsHeading: { eyebrow: read("marketing.steps.eyebrow"), title: read("marketing.steps.title"), subtitle: read("marketing.steps.subtitle") },
    benefitsEyebrow: read("marketing.benefits.eyebrow"),
    faq: Array.from({ length: questionCount }, (_, index) => ({ question: read(`marketing.faq.q${index + 1}`), answer: unmarked(read(`marketing.faq.a${index + 1}`)) })),
    seoTitle: read("metaTitle"), seoDescription: read("metaDescription") };
}

// The three steps ride one wave: an illustration above each numbered point,
// the copy below. Step 1 sits at the inline start, so the wave follows the
// page direction (the document's, unless one is given). The first question
// starts open. A step's [[words]] link to the sign-in page when its path is
// given. Everything is validated before the shared sections change.
export function installSubscriptionFlow($, { content, productName = "host", assetPrefix = "", loginHref, direction = $("html").attr("dir") === "rtl" ? "rtl" : "ltr" }) {
  const product = productOf(productName);
  if (loginHref !== undefined && (typeof loginHref !== "string" || !loginHref.trim())) throw new Error("The step flow sign-in link must be a path");
  const section = $("#niche-highlights"), list = $("#niche-highlights-list"), benefitsHeader = $("#niche-benefits .niche-section__header");
  if (section.length !== 1 || list.length !== 1 || benefitsHeader.length !== 1) throw new Error("The step flow requires one highlights section, one list and one benefits header");
  if (!["ltr", "rtl"].includes(direction)) throw new Error(`Unknown step flow direction: ${direction}`);
  const steps = content?.highlights, heading = content?.stepsHeading;
  if (!Array.isArray(steps) || steps.length !== 3 || steps.some(step => !step?.title || !step?.text)) throw new Error("The step flow requires three complete steps");
  if (!heading?.eyebrow || !heading?.title || !heading?.subtitle || !content.benefitsEyebrow) throw new Error("The step flow requires its localized headings");
  const picture = (file, className, width, height) => node($, "img", { class: className, src: `${assetPrefix}${flowArt}${file}`, alt: "",
    width: String(width), height: String(height), loading: "lazy", decoding: "async" });
  const description = text => {
    const match = linkMarker.exec(text);
    if (!match || !loginHref) return node($, "p", { class: "wa-flow__desc" }, unmarked(text));
    return node($, "p", { class: "wa-flow__desc" }, [node($, "span", {}, text.slice(0, match.index)),
      node($, "a", { class: "wa-flow__link", href: loginHref }, match[1]), node($, "span", {}, unmarked(text.slice(match.index + match[0].length)))]);
  };
  const items = steps.map((step, index) => node($, "li", { class: "wa-flow__step" }, [
    picture(`${product.art}-${index + 1}.svg`, "wa-flow__art", 320, 220),
    node($, "div", { class: "wa-flow__text" }, [node($, "h3", { class: "wa-flow__title" }, step.title), description(step.text)]),
  ]));
  const head = node($, "div", { class: "wa-head wa-head--center" }, [node($, "span", { class: "wa-eyebrow" }, heading.eyebrow),
    node($, "h2", { class: "wa-h2", id: "wa-flow-title" }, heading.title), node($, "p", { class: "wa-lead" }, heading.subtitle)]);
  const track = node($, "div", { class: "wa-flow__track" }, [picture(`wave-${direction}.svg`, "wa-flow__wave", 1160, 200),
    node($, "ol", { class: "wa-flow__list", id: "niche-highlights-list" }, items)]);
  section.removeAttr("hidden").removeClass("niche-highlights--flow").addClass("wa-page wa-flow").attr("aria-labelledby", "wa-flow-title");
  $("link[href*='css/niche-flow.css']").remove();
  section.children(".container").first().empty().append(head, track);
  benefitsHeader.prepend(node($, "span", { class: "wa-eyebrow" }, content.benefitsEyebrow));
  $("#niche-faq-list details").first().attr("open", "");
}

// The audience row lists the localized customer types and always ends open:
// the last entry ("And more…") is dashed, so the list never reads as closed.
// Every entry is a card: its drawing in the language of the hero animation
// (scripts/audience-art.mjs, decorative) above its name.
export function installAudienceList($, { items, productName = "host", assetPrefix = "" }) {
  const row = $(".host-marketing-details section.wa-audience .wa-audience__row");
  if (row.length !== 1 || row.children(".wa-audience__label").length !== 1) throw new Error("The audience list requires one audience row with its label");
  if (!Array.isArray(items) || items.length < 2 || items.some(item => typeof item !== "string" || !item.trim())) throw new Error("The audience list requires localized entries and an open ending");
  const art = AUDIENCE_ART[productName];
  if (!art || art.length !== items.length) throw new Error(`The audience list requires one drawing per entry: ${productName}`);
  const list = node($, "ul", { class: "wa-audience__list", "data-count": String(items.length) }, items.map((text, index) =>
    node($, "li", { class: `wa-chip${index === items.length - 1 ? " wa-chip--more" : ""}` }, [
      node($, "img", { class: "wa-chip__art", src: `${assetPrefix}${audienceArtPath(art[index])}?v=${AUDIENCE_ART_VERSION}`, alt: "",
        width: String(AUDIENCE_ART_SIZE.width), height: String(AUDIENCE_ART_SIZE.height), loading: "lazy", decoding: "async" }),
      node($, "span", { class: "wa-chip__text" }, text),
    ])));
  row.children(".wa-chip").remove();
  row.append(list);
}

// Clone the already localized detail nodes in their original document order.
// The plans come first, right under the hero; the audience follows the shared
// benefits; the shop section closes the page after the questions. All three
// wrappers attach only after every guard succeeds.
export function appendHostMarketingDetails($, { legacyTemplate, shopHref }) {
  if (typeof legacyTemplate !== "function") throw new Error("A localized Host detail document is required");
  if (shopHref !== undefined && (typeof shopHref !== "string" || !shopHref.trim())) throw new Error("The locale shop link must be a path");
  if ($(".host-marketing-details, .host-marketing-pricing").length) throw new Error("Host marketing details are already present");
  const hero = $(".niche-hero"), target = $("#niche-benefits"), questions = $("#niche-faq");
  if (hero.length !== 1) throw new Error("Host details require one shared hero section");
  if (target.length !== 1) throw new Error("Host details require one shared benefits section");
  if (questions.length !== 1) throw new Error("Host details require one shared questions section");
  for (const name of sectionNames) {
    if (legacyTemplate(`section.${name}`).length !== 1) throw new Error(`Host details require one localized .${name} section`);
  }
  const clone = names => legacyTemplate(names.map(name => `section.${name}`).join(", ")).toArray()
    .map(section => legacyTemplate(section).clone());
  const pricing = node($, "div", { class: "wa-page host-marketing-pricing" }, clone(["wa-pricing"]));
  const wrapper = node($, "div", { class: "wa-page host-marketing-details" }, clone(["wa-audience"]));
  const closing = node($, "div", { class: "wa-page host-marketing-closing" }, clone(["wa-shop"]));
  // The link is set on the clone; the localized source document stays untouched.
  if (shopHref) closing.find(".wa-shop__link").attr("href", shopHref);
  hero.after(pricing);
  target.after(wrapper);
  questions.after(closing);
  return wrapper;
}
