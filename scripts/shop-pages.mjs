// The public shop is a static catalog. Availability is explicit and checkout is
// disabled; the separately authenticated reservations workflow has its own rules.
export const SHOP_PRODUCTS = [
  { id: "wifigate", name: "WIFIGATE", image: "/assets/img/wifigate-product-v3.webp", width: 1545, height: 905, secondary: "/assets/img/shop/wifigate-enclosure.webp" },
  { id: "wifigate-roller-shutter", name: "WIFIGATE Roller shutter", image: null },
];

export const SHOP_PAGE_KEYS = ["shop", ...SHOP_PRODUCTS.map(({ id }) => `shop/${id}`)];

const COPY = {
  en: {
    shop: "Shop", home: "Home", eyebrow: "WIFIGATE COLLECTION", heading: ["One app.", "All your entrances."],
    products: "2 products", view: "Product details", moreDetails: "More details", addToCart: "Add to cart",
    stock: "Contact us to join the waitlist", waitlist: "Join the waitlist", stockNote: "Add it to your cart and contact us to join the waitlist. There is no payment at this stage.",
    imageSoon: "Product image coming soon", facts: ["No subscription", "Up to 5,000 users"], useCasesLabel: "Use cases", useCases: ["Electric gates and parking barriers", "Garage doors and private parking", "Entry doors and magnetic locks", "Private homes", "Residential buildings", "Office buildings", "Sports facilities", "Storage units and lockers"], shutterFacts: ["No subscription"], category: "Smart access controller", shutterCategory: "Electric shutter controller",
    description: "A smart controller for electric gates, garage doors and barriers. Open them from the WIFIGATE app, with no remote needed.",
    shutterDescription: "A smart controller for electric roller shutters. Open and close them from the WIFIGATE app.",
    imageAlt: "WIFIGATE controller enclosure", overviewAlt: "The WIFIGATE controller beside the WIFIGATE mobile app",
    overview: "Product overview", features: "Everyday use", compatibility: "Installation & compatibility", availability: "Availability", specs: "Technical specifications",
    gateSpecs: [["Enclosure", "Sealed ABS box, IP67"], ["Dimensions", "83 × 81 × 56 mm", true], ["Power input", "12–24V", true], ["Connectivity", "Wi‑Fi 6 · Bluetooth LE", true], ["Remote receiver", "433.92MHz, digital RF remote pairing"], ["Connections", "Screw terminals · USB Type‑C"], ["Users", "Up to 5,000 users and 20 admins"], ["Guest invites", "Unlimited"], ["History", "90 days"], ["Scheduled events", "Up to 50"], ["Subscription", "None"]],
    shutterSpecs: [["Controllers", "2 WIFIGATE controllers, one to open and one to close"], ["Operation", "Push button, held with your fingerprint"], ["Safety", "Open and close cannot run together; releasing stops the shutter"], ["Enclosure", "Nisko O-BOX 18M surface panel, white polycarbonate"], ["Dimensions", "370 × 155 × 70 mm", true], ["Connectivity", "Wi‑Fi 6 · Bluetooth LE", true], ["Installation", "Alongside your existing shutter controller"], ["Subscription", "None"]],
    overviewText: "Bring your electric gate, garage door or parking barrier into the WIFIGATE app. A dedicated controller connects everyday access to your phone.",
    shutterOverview: "Bring your electric roller shutters into the WIFIGATE app. A dedicated controller lets you open and close your shutter from your phone.",
    featureGate1: "Open compatible gates, garage doors and parking barriers from the WIFIGATE app.",
    featureGate2: "Keep your access points together in one app.",
    featureShutter1: "Open and close compatible electric roller shutters from the WIFIGATE app.",
    featureShutter2: "Manage your shutter from the same app as your other WIFIGATE systems.",
    compatibilityText: "The controller is installed alongside a compatible existing control system. Contact our team to check suitability for your installation.",
    shutterCompatibility: "Designed for electric roller shutters. Contact our team to check compatibility with your shutter and installation.",
    unavailableText: "The product is not on sale yet. Add it to your cart and contact us to join the waitlist; when it is available, our team will get back to you about price, installation and delivery. There is no online payment.",
    factUse: "Made for", factUseValue: "Gates, garage doors & parking barriers", shutterUseValue: "Electric roller shutters",
    factControl: "Control", factControlValue: "WIFIGATE app", allProducts: "All products",
    businessEyebrow: "WIFIGATE for Business", subscription: "Subscription", businessHeading: "Subscription plans for your business.",
    businessIntro: "Automate guest access and manage every system in your organization. Choose the WIFIGATE plan that fits your operation.",
    hostTag: "Guest access automation", hostDescription: "Secure, time-limited access created automatically for every booking. For hotels, vacation rentals and rental parking.",
    hostImageAlt: "Guests using a phone to enter their hotel room", hostStepsLabel: "Every stay, taken care of", hostSteps: ["Booking received", "Access at check-in", "Expires at checkout"],
    managerImageAlt: "A resident walking up to the entrance of a residential building", managerStepsLabel: "Every building, one dashboard", managerSteps: ["Main entrance", "Parking garage", "Lobby doors"],
    hostFeatures: ["Automatic access for every booking", "Access ends on its own at checkout", "Plans from a single property to large portfolios"],
    managerTag: "Organization management", managerDescription: "Control your systems from anywhere in the world: your organization's systems, people and access history in one dashboard.",
    hostSegments: ["Hotels", "Vacation rentals", "Guesthouses", "Rental parking", "And more…"], managerSegments: ["Residential buildings", "Offices", "Sports facilities", "Parking facilities", "And more…"],
    managerFeatures: ["All your systems in one place", "People and permissions management", "Complete access history"],
    catalogTitle: "WIFIGATE Shop | Smart access controllers",
    catalogDescription: "Explore WIFIGATE controllers for gates, garage doors, barriers and electric roller shutters. Contact us to join the waitlist.",
  },
  he: {
    shop: "חנות", home: "בית", eyebrow: "הקולקציה של WIFIGATE", heading: ["אפליקציה אחת.", "כל הכניסות שלכם."],
    products: "2 מוצרים", view: "לפרטי המוצר", moreDetails: "פרטים נוספים", addToCart: "הוספה לסל",
    stock: "צרו קשר כדי להירשם לרשימת ההמתנה", waitlist: "להרשמה לרשימת ההמתנה", stockNote: "אפשר להוסיף לסל וליצור קשר כדי להירשם לרשימת ההמתנה. אין תשלום בשלב הזה.",
    imageSoon: "תמונת המוצר תתווסף בהמשך", facts: ["בלי מנוי", "עד 5,000 משתמשים"], useCasesLabel: "שימושים", useCases: ["שערים חשמליים ומחסומי חניה", "דלתות גראז׳ וחניות פרטיות", "דלתות כניסה ומנעולים מגנטיים", "בתים פרטיים", "בנייני מגורים", "בנייני משרדים", "מתקני ספורט", "מקומות אחסון ולוקרים"], shutterFacts: ["בלי מנוי"], category: "בקר גישה חכם", shutterCategory: "בקר לתריס חשמלי",
    description: "בקר חכם לשערים חשמליים, לדלתות חניה ולמחסומים. פותחים באפליקציית WIFIGATE, בלי לחפש שלט.",
    shutterDescription: "בקר חכם לתריסים חשמליים. פותחים וסוגרים באפליקציית WIFIGATE.",
    imageAlt: "מארז בקר WIFIGATE", overviewAlt: "בקר WIFIGATE לצד אפליקציית WIFIGATE בטלפון",
    overview: "על המוצר", features: "בשימוש היומיומי", compatibility: "התקנה והתאמה", availability: "זמינות", specs: "מפרט טכני",
    gateSpecs: [["מארז", "קופסת ABS אטומה, IP67"], ["מידות", "83 × 81 × 56 מ״מ"], ["מתח הזנה", "12–24V", true], ["תקשורת", "Wi‑Fi 6 · Bluetooth LE", true], ["מקלט שלטים", "433.92MHz, למידת שלטי RF דיגיטליים"], ["חיבורים", "מחברי הברגה · USB Type‑C"], ["משתמשים", "עד 5,000 משתמשים ו־20 מנהלים"], ["הזמנות אורח", "ללא הגבלה"], ["היסטוריה", "90 יום"], ["אירועים מתוזמנים", "עד 50"], ["מנוי", "אין"]],
    shutterSpecs: [["בקרים", "2 בקרי WIFIGATE, אחד לפתיחה ואחד לסגירה"], ["הפעלה", "לחצן בהחזקה עם טביעת אצבע"], ["בטיחות", "אי אפשר להפעיל פתיחה וסגירה יחד; שחרור האצבע עוצר את התריס"], ["מארז", "לוח עה״ט Nisko O-BOX 18M, פוליקרבונט לבן"], ["מידות", "370 × 155 × 70 מ״מ"], ["תקשורת", "Wi‑Fi 6 · Bluetooth LE", true], ["התקנה", "לצד בקר התריס הקיים"], ["מנוי", "אין"]],
    overviewText: "מחברים את השער החשמלי, דלת החניה או המחסום לאפליקציית WIFIGATE. בקר ייעודי מביא את הפתיחה היומיומית לטלפון שלכם.",
    shutterOverview: "מחברים את התריסים החשמליים לאפליקציית WIFIGATE. בקר ייעודי מאפשר לפתוח ולסגור את התריס מהטלפון.",
    featureGate1: "פותחים שערים, דלתות חניה ומחסומים תואמים דרך אפליקציית WIFIGATE.",
    featureGate2: "מרכזים את נקודות הגישה שלכם באפליקציה אחת.",
    featureShutter1: "פותחים וסוגרים תריסים חשמליים תואמים דרך אפליקציית WIFIGATE.",
    featureShutter2: "מנהלים את התריס באותה אפליקציה עם שאר מערכות WIFIGATE שלכם.",
    compatibilityText: "הבקר מותקן לצד מערכת בקרה קיימת ותואמת. צרו קשר עם הצוות כדי לבדוק התאמה להתקנה שלכם.",
    shutterCompatibility: "מיועד לתריסים חשמליים. צרו קשר עם הצוות כדי לבדוק התאמה לתריס ולהתקנה שלכם.",
    unavailableText: "המוצר עדיין לא במכירה. מוסיפים אותו לסל ויוצרים קשר כדי להירשם לרשימת ההמתנה, וכשהוא יהיה זמין הצוות יחזור אליכם לתאם מחיר, התקנה ומשלוח. אין תשלום מקוון.",
    factUse: "מתאים ל", factUseValue: "שערים, דלתות חניה ומחסומים", shutterUseValue: "תריסים חשמליים",
    factControl: "שליטה", factControlValue: "אפליקציית WIFIGATE", allProducts: "כל המוצרים",
    businessEyebrow: "WIFIGATE לעסקים", subscription: "מנוי", businessHeading: "מסלולי מנוי לעסק שלכם.",
    businessIntro: "אוטומציה לגישת אורחים וניהול של כל המערכות בארגון. בחרו את מסלול WIFIGATE שמתאים לפעילות שלכם.",
    hostTag: "אוטומציה לגישת אורחים", hostDescription: "גישה מאובטחת ומוגבלת בזמן, שנוצרת אוטומטית לכל הזמנה. למלונות, לדירות נופש ולחניות להשכרה.",
    hostImageAlt: "אורחים משתמשים בטלפון כדי להיכנס למקום האירוח", hostStepsLabel: "מההזמנה ועד העזיבה", hostSteps: ["ההזמנה התקבלה", "גישה בצ׳ק-אין", "התוקף פג בצ׳ק-אאוט"],
    managerImageAlt: "דיירת ניגשת לכניסה של בניין מגורים", managerStepsLabel: "כל הבניינים בלוח אחד", managerSteps: ["כניסה ראשית", "חניון", "דלתות הלובי"],
    hostFeatures: ["גישה אוטומטית לכל הזמנה", "הגישה מסתיימת לבד בצ'ק-אאוט", "מסלולים מנכס יחיד ועד תיקי נכסים גדולים"],
    managerTag: "ניהול ארגוני", managerDescription: "שליטה במערכות שלכם מכל מקום בעולם: המערכות, האנשים והיסטוריית הגישה של הארגון, בלוח בקרה אחד.",
    hostSegments: ["מלונות", "דירות נופש", "בתי הארחה", "חניות להשכרה", "ועוד…"], managerSegments: ["בנייני מגורים", "משרדים", "מתקני ספורט", "חניונים", "ועוד…"],
    managerFeatures: ["כל המערכות במקום אחד", "ניהול אנשים והרשאות", "היסטוריית גישה מלאה"],
    catalogTitle: "החנות של WIFIGATE | בקרי גישה חכמים",
    catalogDescription: "מגלים את בקרי WIFIGATE לשערים, לדלתות חניה, למחסומים ולתריסים חשמליים. צרו קשר כדי להירשם לרשימת ההמתנה.",
  },
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const localePath = (locale, suffix = "") => `${locale === "en" ? "" : `/${locale.toLowerCase()}`}/${suffix ? `${suffix}/` : ""}`;
const productPath = (locale, id) => localePath(locale, `shop/${id}`);

function renderMedia(product, copy, { detail = false } = {}) {
  if (!product.image) {
    return `<div class="shop-no-image"><span class="shop-no-image__brand" dir="ltr">WIFIGATE</span><span class="shop-no-image__name" dir="ltr">Roller shutter</span><span class="shop-no-image__note">${copy.imageSoon}</span></div>`;
  }
  return `<img src="${product.image}" alt="${copy.overviewAlt}" width="${product.width}" height="${product.height}" loading="${detail ? "eager" : "lazy"}" decoding="async"${detail ? ' fetchpriority="high"' : ""} />`;
}

const CART_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>';

// Add to cart puts the product in the wifigate_cart cookie (js/site-cart.js);
// the cart is then sent to WIFIGATE on WhatsApp to join the waitlist.
function renderCartButton(copy, productId, name, className = "shop-actions__cart") {
  return `<button class="${className}" type="button" data-shop-cart="${productId}" aria-label="${escapeHtml(`${copy.addToCart}: ${name}`)}">${CART_ICON}<span>${copy.addToCart}</span></button>`;
}

// Add to cart leads; the details link sits beside it as quieter text.
function renderActions(copy, { href, label, details, name, productId, detailsClass = "" }) {
  return `<div class="shop-actions">${renderCartButton(copy, productId, name)}<a class="shop-actions__details${detailsClass}" href="${href}"${label ? ` aria-label="${escapeHtml(label)}"` : ""}>${details}</a></div>`;
}

// Same order as copy.useCases; each links to its use-case page.
const USE_CASE_PAGES = ["electric-gates", "garage-doors", "entry-doors-magnetic-locks", "private-homes", "residential-buildings", "office-buildings", "sports-facilities", "storage-lockers"];

const renderUseCases = (locale, copy) => `<ul class="shop-product-card__uses" aria-label="${copy.useCasesLabel}">${copy.useCases.map((label, index) => `<li><a href="${localePath(locale, USE_CASE_PAGES[index])}">${label}</a></li>`).join("")}</ul>`;

const renderList = (className, items) => `<p class="${className}">${items.map((item) => `<span>${item}</span>`).join("")}</p>`;

function renderCard(product, locale, copy, headingTag = "h2") {
  const shutter = product.id === "wifigate-roller-shutter";
  const href = productPath(locale, product.id);
  return `<article class="shop-product-card" data-product="${product.id}">
    <a class="shop-product-card__media" href="${href}" tabindex="-1" aria-hidden="true">${renderMedia(product, copy)}<span class="shop-stock">${copy.stock}</span></a>
    <div class="shop-product-card__body">
      <p class="shop-product-card__category">${shutter ? copy.shutterCategory : copy.category}</p>
      <${headingTag} class="shop-product-card__name" dir="ltr">${product.name}</${headingTag}>
      ${shutter ? `<p class="shop-product-card__description">${copy.shutterDescription}</p>` : renderUseCases(locale, copy)}
      ${renderList("shop-product-card__facts", shutter ? copy.shutterFacts : copy.facts)}
      ${renderActions(copy, { href, label: `${copy.view}: ${product.name}. ${copy.stock}`, details: copy.view, name: product.name, productId: product.id, detailsClass: " shop-product-card__link" })}
    </div>
  </article>`;
}

const BUSINESS_PHOTOS = {
  host: "/assets/wifigate_niche_pages/hotels-airbnb-v2-app-hero.webp",
  manager: "/assets/wifigate_niche_pages/residential-buildings-scene-hero.webp",
};

function renderBusinessInset(copy, id) {
  return `<div class="shop-business-card__inset shop-business-card__steps shop-business-card__steps--${id}"><span>${copy[`${id}StepsLabel`]}</span><ol>${copy[`${id}Steps`].map((step) => `<li>${step}</li>`).join("")}</ol></div>`;
}

function renderBusinessCard(copy, { id, name, href }) {
  const features = copy[`${id}Features`].map((feature) => `<li>${feature}</li>`).join("");
  return `<article class="shop-business-card shop-business-card--${id}" data-business="${id}">
    <div class="shop-business-card__media"><img class="shop-business-card__photo" src="${BUSINESS_PHOTOS[id]}" alt="${copy[`${id}ImageAlt`]}" width="1280" height="720" loading="lazy" decoding="async" /><span class="shop-business-card__chip">${copy.subscription}</span>${renderBusinessInset(copy, id)}
      <div class="shop-business-card__title"><p class="shop-business-card__tag">${copy[`${id}Tag`]}</p><h3 class="shop-business-card__name" dir="ltr">${name}</h3></div></div>
    <div class="shop-business-card__body">
      <p class="shop-business-card__description">${copy[`${id}Description`]}</p>
      ${renderList("shop-business-card__segments", copy[`${id}Segments`])}
      <ul class="shop-business-card__features">${features}</ul>
      ${renderActions(copy, { href, label: `${copy.moreDetails}: ${name}`, details: copy.moreDetails, name, productId: `wifigate-${id}` })}
    </div>
  </article>`;
}

function renderBusiness(locale, copy) {
  const cards = [
    { id: "host", name: "WIFIGATE Host", href: localePath(locale, "wifigate-host") },
    { id: "manager", name: "WIFIGATE Manager", href: `${localePath(locale)}#get-in-touch` },
  ];
  return `<div class="shop-divider" aria-hidden="true"></div>
    <section class="shop-business" aria-labelledby="shop-business-title"><header class="shop-business__heading"><p class="shop-business__eyebrow">${copy.businessEyebrow}</p><h2 id="shop-business-title">${copy.businessHeading}</h2><p>${copy.businessIntro}</p></header><div class="shop-business__grid">${cards.map((card) => renderBusinessCard(copy, card)).join("\n")}</div></section>`;
}

function renderBreadcrumb(locale, copy, product) {
  return `<nav class="shop-breadcrumb" aria-label="${locale === "he" ? "מיקום באתר" : "Breadcrumb"}"><ol><li><a href="${localePath(locale)}">${copy.home}</a></li><li>${product ? `<a href="${localePath(locale, "shop")}">${copy.shop}</a>` : `<span aria-current="page">${copy.shop}</span>`}</li>${product ? `<li><span aria-current="page" dir="ltr">${product.name}</span></li>` : ""}</ol></nav>`;
}

function renderSpecs(rows) {
  return `<dl class="shop-specs">${rows.map(([label, value, ltr]) => `<div><dt>${label}</dt><dd${ltr ? ' dir="ltr"' : ""}>${value}</dd></div>`).join("")}</dl>`;
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
      main: `${renderBreadcrumb(locale, copy)}<header class="shop-heading"><p class="shop-eyebrow">${copy.eyebrow}</p><h1 class="shop-heading__title">${copy.heading.map((line) => `<span>${line}</span>`).join(" ")}</h1></header><div class="shop-catalog-meta"><span>${copy.allProducts}</span><span>${copy.products}</span></div><div class="shop-grid">${SHOP_PRODUCTS.map((item) => renderCard(item, locale, copy)).join("\n")}</div>${renderBusiness(locale, copy)}`,
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
        <div class="shop-product-gallery"><div class="shop-product-gallery__main">${renderMedia(product, copy, { detail: true })}</div>${product.secondary ? `<figure class="shop-product-gallery__secondary"><img src="${product.secondary}" alt="${copy.imageAlt}" width="1254" height="1254" loading="lazy" decoding="async" /></figure>` : ""}</div>
        <div class="shop-product-info"><p class="shop-product-info__category">${shutter ? copy.shutterCategory : copy.category}</p><h1 dir="ltr">${product.name}</h1><p class="shop-product-info__description">${shutter ? copy.shutterDescription : copy.description}</p>
          <div class="shop-availability"><span class="shop-stock">${copy.stock}</span><p>${copy.stockNote}</p></div>
          <dl class="shop-product-facts"><div><dt>${copy.factUse}</dt><dd>${shutter ? copy.shutterUseValue : copy.factUseValue}</dd></div><div><dt>${copy.factControl}</dt><dd>${copy.factControlValue}</dd></div></dl>
          ${renderCartButton(copy, product.id, product.name, "shop-purchase")}<a class="shop-waitlist" href="${localePath(locale)}#get-in-touch">${copy.waitlist}</a>
          <div class="shop-product-accordions">${renderAccordion(copy.overview, `<p>${shutter ? copy.shutterOverview : copy.overviewText}</p>`, { open: true })}${renderAccordion(copy.specs, renderSpecs(shutter ? copy.shutterSpecs : copy.gateSpecs), { open: true })}${renderAccordion(copy.features, `<ul><li>${shutter ? copy.featureShutter1 : copy.featureGate1}</li><li>${shutter ? copy.featureShutter2 : copy.featureGate2}</li></ul>`)}${renderAccordion(copy.compatibility, `<p>${shutter ? copy.shutterCompatibility : copy.compatibilityText}</p>`)}${renderAccordion(copy.availability, `<p>${copy.unavailableText}</p>`)}</div>
        </div>
      </article>`,
  };
}
