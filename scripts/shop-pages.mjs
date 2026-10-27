// The public shop is a static catalog. Availability is explicit and checkout is
// disabled; the separately authenticated reservations workflow has its own rules.
export const SHOP_PRODUCTS = [
  { id: "wifigate", name: "WIFIGATE", image: "/assets/img/shop/wifigate-enclosure.webp" },
  { id: "wifigate-roller-shutter", name: "WIFIGATE Roller shutter", image: null },
];

export const SHOP_PAGE_KEYS = ["shop", ...SHOP_PRODUCTS.map(({ id }) => `shop/${id}`)];

const COPY = {
  en: {
    shop: "Shop", home: "Home", eyebrow: "WIFIGATE COLLECTION", heading: "Smart access. Simply WIFIGATE.",
    intro: "Controllers that bring everyday access to your phone.", products: "2 products", view: "Explore product",
    stock: "Out of stock", stockNote: "This product is currently unavailable for purchase.",
    imageSoon: "Product image coming soon", category: "Smart access controller", shutterCategory: "Electric shutter controller",
    description: "A smart controller for electric gates, garage doors and barriers. Open them from the WIFIGATE app, with no remote needed.",
    shutterDescription: "A smart controller for electric roller shutters. Open and close them from the WIFIGATE app.",
    imageAlt: "WIFIGATE controller enclosure", overviewAlt: "The WIFIGATE controller beside the WIFIGATE mobile app",
    appCaption: "Your access, in the WIFIGATE app.", purchase: "Out of stock", contact: "Talk to our team", contactPrompt: "Find the right controller for your space.",
    contactText: "Tell us about your gate, door or electric shutter. We can help you choose the right WIFIGATE solution.",
    overview: "Product overview", features: "Everyday use", compatibility: "Installation & compatibility", availability: "Availability",
    overviewText: "Bring your electric gate, garage door or parking barrier into the WIFIGATE app. A dedicated controller connects everyday access to your phone.",
    shutterOverview: "Bring your electric roller shutters into the WIFIGATE app. A dedicated controller lets you open and close your shutter from your phone.",
    featureGate1: "Open compatible gates, garage doors and parking barriers from the WIFIGATE app.",
    featureGate2: "Keep your access points together in one app.",
    featureShutter1: "Open and close compatible electric roller shutters from the WIFIGATE app.",
    featureShutter2: "Manage your shutter from the same app as your other WIFIGATE systems.",
    compatibilityText: "The controller is installed alongside a compatible existing control system. Contact our team to check suitability for your installation.",
    shutterCompatibility: "Designed for electric roller shutters. Contact our team to check compatibility with your shutter and installation.",
    unavailableText: "This product is out of stock. Ordering and online payment are currently unavailable.",
    factUse: "Made for", factUseValue: "Gates, garage doors & parking barriers", shutterUseValue: "Electric roller shutters",
    factControl: "Control", factControlValue: "WIFIGATE app", related: "Explore the collection", relatedIntro: "More from WIFIGATE.", allProducts: "All products",
    catalogTitle: "WIFIGATE Shop | Smart access controllers",
    catalogDescription: "Explore WIFIGATE controllers for gates, garage doors, barriers and electric roller shutters. All products are currently out of stock.",
  },
  he: {
    shop: "חנות", home: "בית", eyebrow: "הקולקציה של WIFIGATE", heading: "גישה חכמה. פשוט WIFIGATE.",
    intro: "בקרים שמביאים את הפתיחה היומיומית לטלפון שלכם.", products: "2 מוצרים", view: "לפרטי המוצר",
    stock: "אזל מהמלאי", stockNote: "המוצר אינו זמין כרגע לרכישה.",
    imageSoon: "תמונת המוצר תתווסף בהמשך", category: "בקר גישה חכם", shutterCategory: "בקר לתריס חשמלי",
    description: "בקר חכם לשערים חשמליים, לדלתות חניה ולמחסומים. פותחים באפליקציית WIFIGATE, בלי לחפש שלט.",
    shutterDescription: "בקר חכם לתריסים חשמליים. פותחים וסוגרים באפליקציית WIFIGATE.",
    imageAlt: "מארז בקר WIFIGATE", overviewAlt: "בקר WIFIGATE לצד אפליקציית WIFIGATE בטלפון",
    appCaption: "הגישה שלכם, באפליקציית WIFIGATE.", purchase: "אזל מהמלאי", contact: "דברו עם הצוות שלנו", contactPrompt: "הבקר המתאים למקום שלכם.",
    contactText: "ספרו לנו על השער, הדלת או התריס החשמלי שלכם. נעזור לכם לבחור את פתרון WIFIGATE המתאים.",
    overview: "על המוצר", features: "בשימוש היומיומי", compatibility: "התקנה והתאמה", availability: "זמינות",
    overviewText: "מחברים את השער החשמלי, דלת החניה או המחסום לאפליקציית WIFIGATE. בקר ייעודי מביא את הפתיחה היומיומית לטלפון שלכם.",
    shutterOverview: "מחברים את התריסים החשמליים לאפליקציית WIFIGATE. בקר ייעודי מאפשר לפתוח ולסגור את התריס מהטלפון.",
    featureGate1: "פותחים שערים, דלתות חניה ומחסומים תואמים דרך אפליקציית WIFIGATE.",
    featureGate2: "מרכזים את נקודות הגישה שלכם באפליקציה אחת.",
    featureShutter1: "פותחים וסוגרים תריסים חשמליים תואמים דרך אפליקציית WIFIGATE.",
    featureShutter2: "מנהלים את התריס באותה אפליקציה עם שאר מערכות WIFIGATE שלכם.",
    compatibilityText: "הבקר מותקן לצד מערכת בקרה קיימת ותואמת. צרו קשר עם הצוות כדי לבדוק התאמה להתקנה שלכם.",
    shutterCompatibility: "מיועד לתריסים חשמליים. צרו קשר עם הצוות כדי לבדוק התאמה לתריס ולהתקנה שלכם.",
    unavailableText: "המוצר אזל מהמלאי. הזמנה ותשלום מקוון אינם זמינים כרגע.",
    factUse: "מתאים ל", factUseValue: "שערים, דלתות חניה ומחסומים", shutterUseValue: "תריסים חשמליים",
    factControl: "שליטה", factControlValue: "אפליקציית WIFIGATE", related: "עוד בקולקציה", relatedIntro: "מגלים עוד מוצרים של WIFIGATE.", allProducts: "כל המוצרים",
    catalogTitle: "החנות של WIFIGATE | בקרי גישה חכמים",
    catalogDescription: "מגלים את בקרי WIFIGATE לשערים, לדלתות חניה, למחסומים ולתריסים חשמליים. כל המוצרים אזלו כרגע מהמלאי.",
  },
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const localePath = (locale, suffix = "") => `${locale === "en" ? "" : `/${locale.toLowerCase()}`}/${suffix ? `${suffix}/` : ""}`;
const productPath = (locale, id) => localePath(locale, `shop/${id}`);

function renderMedia(product, copy, { detail = false } = {}) {
  if (!product.image) {
    return `<div class="shop-no-image"><span class="shop-no-image__brand" dir="ltr">WIFIGATE</span><span class="shop-no-image__name" dir="ltr">Roller shutter</span><span class="shop-no-image__note">${copy.imageSoon}</span></div>`;
  }
  return `<img src="${product.image}" alt="${copy.imageAlt}" width="1254" height="1254" loading="${detail ? "eager" : "lazy"}" decoding="async"${detail ? ' fetchpriority="high"' : ""} />`;
}

function renderCard(product, locale, copy, headingTag = "h2") {
  const shutter = product.id === "wifigate-roller-shutter";
  return `<article class="shop-product-card" data-product="${product.id}">
    <a class="shop-product-card__link" href="${productPath(locale, product.id)}" aria-label="${escapeHtml(`${copy.view}: ${product.name}. ${copy.stock}`)}">
      <div class="shop-product-card__media">${renderMedia(product, copy)}<span class="shop-stock">${copy.stock}</span></div>
      <div class="shop-product-card__body">
        <p class="shop-product-card__category">${shutter ? copy.shutterCategory : copy.category}</p>
        <${headingTag} class="shop-product-card__name" dir="ltr">${product.name}</${headingTag}>
        <p class="shop-product-card__description">${shutter ? copy.shutterDescription : copy.description}</p>
        <span class="shop-product-card__footer"><span>${copy.view}</span><span class="shop-product-card__arrow" aria-hidden="true">↗</span></span>
      </div>
    </a>
  </article>`;
}

function renderContact(locale, copy) {
  return `<section class="shop-contact" aria-labelledby="shop-contact-title"><div><p class="shop-eyebrow">WIFIGATE</p><h2 id="shop-contact-title">${copy.contactPrompt}</h2><p>${copy.contactText}</p></div><a class="shop-contact-link" href="${localePath(locale)}#get-in-touch">${copy.contact}</a></section>`;
}

function renderBreadcrumb(locale, copy, product) {
  return `<nav class="shop-breadcrumb" aria-label="${locale === "he" ? "מיקום באתר" : "Breadcrumb"}"><ol><li><a href="${localePath(locale)}">${copy.home}</a></li><li>${product ? `<a href="${localePath(locale, "shop")}">${copy.shop}</a>` : `<span aria-current="page">${copy.shop}</span>`}</li>${product ? `<li><span aria-current="page" dir="ltr">${product.name}</span></li>` : ""}</ol></nav>`;
}

function renderAccordion(title, content, { open = false } = {}) {
  return `<details class="shop-accordion"${open ? " open" : ""}><summary>${title}</summary><div class="shop-accordion__content">${content}</div></details>`;
}

export function getShopPageContent(locale, productId = null) {
  const copy = COPY[locale === "he" ? "he" : "en"];
  const product = productId === null ? null : SHOP_PRODUCTS.find(({ id }) => id === productId);
  if (productId !== null && !product) throw new Error(`Unknown shop product: ${productId}`);
  const contentLang = locale === "he" ? "he" : "en";
  if (!product) {
    return {
      title: copy.catalogTitle,
      description: copy.catalogDescription,
      contentLang,
      main: `${renderBreadcrumb(locale, copy)}<header class="shop-heading"><p class="shop-eyebrow">${copy.eyebrow}</p><h1 class="shop-heading__title">${copy.heading}</h1><p class="shop-heading__description">${copy.intro}</p></header><div class="shop-catalog-meta"><span>${copy.allProducts}</span><span>${copy.products}</span></div><div class="shop-grid">${SHOP_PRODUCTS.map((item) => renderCard(item, locale, copy)).join("\n")}</div>${renderContact(locale, copy)}`,
    };
  }
  const shutter = product.id === "wifigate-roller-shutter";
  return {
    title: `${product.name} | ${locale === "he" ? "החנות של WIFIGATE" : "WIFIGATE Shop"}`,
    description: `${shutter ? copy.shutterDescription : copy.description} ${copy.stockNote}`,
    contentLang,
    product,
    main: `${renderBreadcrumb(locale, copy, product)}
      <article class="shop-product-detail" data-product="${product.id}">
        <div class="shop-product-gallery"><div class="shop-product-gallery__main">${renderMedia(product, copy, { detail: true })}</div>${product.image ? `<figure class="shop-product-gallery__secondary"><img src="/assets/img/wifigate-product-v3.webp" alt="${copy.overviewAlt}" width="1545" height="905" loading="lazy" decoding="async" /><figcaption>${copy.appCaption}</figcaption></figure>` : ""}</div>
        <div class="shop-product-info"><p class="shop-product-info__category">${shutter ? copy.shutterCategory : copy.category}</p><h1 dir="ltr">${product.name}</h1><p class="shop-product-info__description">${shutter ? copy.shutterDescription : copy.description}</p>
          <div class="shop-availability"><span class="shop-stock">${copy.stock}</span><p>${copy.stockNote}</p></div>
          <dl class="shop-product-facts"><div><dt>${copy.factUse}</dt><dd>${shutter ? copy.shutterUseValue : copy.factUseValue}</dd></div><div><dt>${copy.factControl}</dt><dd>${copy.factControlValue}</dd></div></dl>
          <button class="shop-purchase" type="button" disabled>${copy.purchase}</button><a class="shop-contact-link shop-contact-link--text" href="${localePath(locale)}#get-in-touch">${copy.contact}</a>
          <div class="shop-product-accordions">${renderAccordion(copy.overview, `<p>${shutter ? copy.shutterOverview : copy.overviewText}</p>`, { open: true })}${renderAccordion(copy.features, `<ul><li>${shutter ? copy.featureShutter1 : copy.featureGate1}</li><li>${shutter ? copy.featureShutter2 : copy.featureGate2}</li></ul>`)}${renderAccordion(copy.compatibility, `<p>${shutter ? copy.shutterCompatibility : copy.compatibilityText}</p>`)}${renderAccordion(copy.availability, `<p>${copy.unavailableText}</p>`)}</div>
        </div>
      </article>
      <section class="shop-related" aria-labelledby="shop-related-title"><div class="shop-section-heading"><div><p class="shop-eyebrow">${copy.relatedIntro}</p><h2 id="shop-related-title">${copy.related}</h2></div><a href="${localePath(locale, "shop")}">${copy.allProducts}</a></div><div class="shop-grid shop-grid--related">${SHOP_PRODUCTS.filter(({ id }) => id !== product.id).map((item) => renderCard(item, locale, copy, "h3")).join("\n")}</div></section>${renderContact(locale, copy)}`,
  };
}
