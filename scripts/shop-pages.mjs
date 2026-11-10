// The public shop is a static catalog. Availability is explicit and checkout is
// disabled; the separately authenticated reservations workflow has its own rules.
export const SHOP_PRODUCTS = [
  { id: "wifigate", name: "WIFIGATE", image: "/assets/img/wifigate-product-v3.webp", width: 1545, height: 905, secondary: "/assets/img/shop/wifigate-enclosure.webp" },
  { id: "wifigate-roller-shutter", name: "WIFIGATE Roller shutter", image: "/assets/img/shop/wifigate-roller-shutter.webp", width: 1600, height: 1100 },
];

export const SHOP_PAGE_KEYS = ["shop", ...SHOP_PRODUCTS.map(({ id }) => `shop/${id}`)];

const COPY = {
  en: {
    shop: "Shop", home: "Home", eyebrow: "WIFIGATE COLLECTION", heading: ["One app.", "All your entrances."],
    products: "2 products", view: "Product details", moreDetails: "More details", addToCart: "Add to cart",
    stockNote: "Add it to your cart and send your order to our WhatsApp Business. Our team takes it from there.",
    facts: ["One-time purchase", "No subscription", "Up to 5,000 users"], useCasesLabel: "Use cases", useCases: ["Electric gates and parking barriers", "Garage doors and private parking", "Entry doors and magnetic locks", "Private homes", "Residential buildings", "Office buildings", "Sports facilities", "Storage units and lockers"], shutterFacts: ["For business and industry", "One-time purchase", "No subscription"], category: "Smart access controller", shutterCategory: "Business roller shutter controller",
    description: "A smart controller for electric gates, garage doors and barriers. Open them from the WIFIGATE app, with no remote needed.",
    shutterDescription: "A smart controller for electric roller shutters in shops, businesses and industrial buildings. Open and close them from the WIFIGATE app.",
    imageAlt: "WIFIGATE controller enclosure", overviewAlt: "The WIFIGATE controller beside the WIFIGATE mobile app", shutterAlt: "The WIFIGATE Roller shutter wall panel", shutterMore: "Everything about WIFIGATE for electric roller shutters", planTitle: "Choose a plan", planNone: "No subscription fee", planNoneText: "One-time purchase of the controller. Full control from the WIFIGATE app on your phone.", planManager: "With WIFIGATE Manager", planManagerText: "Web control of all your systems, from anywhere in the world.", planHost: "With WIFIGATE Host", planHostText: "Automated guest access management for every booking.", planDetails: "Plan details and prices", zoom: "Enlarge image", zoomClose: "Close", zoomPrevious: "Previous image", zoomNext: "Next image", zoomHint: "Click the image to zoom in", view3d: "3D view", view3dLabel: "Open the 3D view", view3dHint: "Drag or use the arrow keys to rotate · scroll, pinch or +/− to zoom", view3dReset: "Reset view", view3dPhotos: "Photos", view3dPhotosLabel: "Back to the photos", view3dLoading: "Loading the 3D view…", view3dError: "The 3D view is not supported in this browser.", view3dRetry: "The 3D view could not load. Please try again.", view3dModel: "3D model", view3dDimensions: "Dimensions", view3dUnit: "mm", illustration: "Images and the 3D view are for illustration only.",
    overview: "Product overview", features: "Everyday use", compatibility: "Installation & compatibility", availability: "How to order", specs: "Technical specifications",
    gateSpecs: [["Enclosure", "Sealed ABS box, IP67"], ["Dimensions", "83 × 81 × 56 mm", true], ["Power input", "12–24V", true], ["Connectivity", "Wi‑Fi 6 · Bluetooth LE", true], ["Remote receiver", "433.92MHz, digital RF remote pairing"], ["Connections", "Screw terminals · USB Type‑C"], ["Users", "Up to 5,000 users and 20 admins"], ["Guest invites", "Unlimited"], ["History", "90 days"], ["Scheduled events", "Up to 50"], ["Subscription", "Not required · one-time purchase"]],
    shutterSpecs: [["Controllers", "2 WIFIGATE controllers, one to open and one to close"], ["Operation", "Push button, held with your fingerprint"], ["Safety", "Open and close cannot run together; releasing stops the shutter"], ["Enclosure", "Surface-mounted 18-module panel, white polycarbonate"], ["Dimensions", "370 × 155 × 70 mm", true], ["Connectivity", "Wi‑Fi 6 · Bluetooth LE", true], ["Installation", "Indoor installation, inside the business"], ["Subscription", "Not required · one-time purchase"]],
    overviewText: "Bring your electric gate, garage door or parking barrier into the WIFIGATE app. A dedicated controller connects everyday access to your phone.",
    shutterOverview: "Bring your business's electric roller shutters into the WIFIGATE app. A dedicated controller, installed inside the business, lets you open and close the shutter from your phone.",
    featureGate1: "Open compatible gates, garage doors and parking barriers from the WIFIGATE app.",
    featureGate2: "Keep your access points together in one app.",
    featureShutter1: "Open and close the electric roller shutters of shops, warehouses and industrial buildings from the WIFIGATE app.",
    featureShutter2: "Manage the shutters from the same app as your business's other WIFIGATE systems.",
    compatibilityText: "The controller is installed alongside a compatible existing control system. Contact our team to check suitability for your installation.",
    shutterCompatibility: "Designed for electric roller shutters in businesses and industry, installed inside the business. Contact our team to check compatibility with your shutter and installation.",
    unavailableText: "Add the product to your cart and send the order to our WhatsApp Business. Our team gets back to you there about price, installation and delivery.",
    factUse: "Made for", shutterUseValue: "Business and industrial roller shutters",
    factControl: "Control", factControlValue: "WIFIGATE app", allProducts: "All products",
    businessEyebrow: "WIFIGATE for Business", subscription: "Subscription", businessHeading: "Subscription plans.",
    businessIntro: "WIFIGATE works locally, straight from the app, with no cloud services. Subscription plans add cloud extensions: WIFIGATE Host for automated guest access management, and WIFIGATE Manager to control all your systems from anywhere in the world. The choice is yours, depending on your needs.",
        hostTag: "Guest access automation", hostDescription: "Automated guest access management for every booking: access starts at check-in and expires at checkout, with no keys or codes.",
            hostFeatures: ["Automatic access for every booking", "Access ends on its own at checkout", "Plans from a single property to large portfolios"],
    managerTag: "Organization management", managerDescription: "All your systems, from anywhere in the world: your organization's controllers, users and permissions in one browser dashboard.",
    hostSegments: ["Hotels", "Vacation rentals", "Guesthouses", "Rental parking", "Storage services", "And more…"], managerSegments: ["Residential buildings", "Offices", "Sports facilities", "Parking facilities", "And more…"],
    managerFeatures: ["All your systems in one place", "People and permissions management", "Complete access history"],
    catalogTitle: "WIFIGATE Shop | Smart access controllers",
    catalogDescription: "Explore WIFIGATE controllers for gates, garage doors, barriers and electric roller shutters. Add them to your cart and send your order on WhatsApp.",
  },
  he: {
    shop: "חנות", home: "בית", eyebrow: "הקולקציה של WIFIGATE", heading: ["אפליקציה אחת.", "כל הכניסות שלכם."],
    products: "2 מוצרים", view: "לפרטי המוצר", moreDetails: "פרטים נוספים", addToCart: "הוספה לסל",
    stockNote: "מוסיפים לסל ושולחים את ההזמנה ל־WhatsApp Business שלנו. הצוות ממשיך איתכם משם.",
    facts: ["תשלום חד־פעמי", "בלי מנוי", "עד 5,000 משתמשים"], useCasesLabel: "שימושים", useCases: ["שערים חשמליים ומחסומי חניה", "דלתות גראז׳ וחניות פרטיות", "דלתות כניסה ומנעולים מגנטיים", "בתים פרטיים", "בנייני מגורים", "בנייני משרדים", "מתקני ספורט", "מקומות אחסון ולוקרים"], shutterFacts: ["לעסקים ולתעשייה", "תשלום חד־פעמי", "בלי מנוי"], category: "בקר גישה חכם", shutterCategory: "בקר לתריסי גלילה לעסקים",
    description: "בקר חכם לשערים חשמליים, לדלתות חניה ולמחסומים. פותחים באפליקציית WIFIGATE, בלי לחפש שלט.",
    shutterDescription: "בקר חכם לתריסי גלילה חשמליים בחנויות, בעסקים ובמבני תעשייה. פותחים וסוגרים באפליקציית WIFIGATE.",
    imageAlt: "מארז בקר WIFIGATE", overviewAlt: "בקר WIFIGATE לצד אפליקציית WIFIGATE בטלפון", shutterAlt: "לוח עה״ט של WIFIGATE Roller shutter", shutterMore: "כל המידע על WIFIGATE לתריסים חשמליים", planTitle: "בחרו מסלול", planNone: "ללא דמי מנוי", planNoneText: "תשלום חד־פעמי על הבקר. שליטה מלאה מאפליקציית WIFIGATE בטלפון.", planManager: "כולל WIFIGATE Manager", planManagerText: "שליטה וובית בכל המערכות שלכם, מכל מקום בעולם.", planHost: "כולל WIFIGATE Host", planHostText: "ניהול כניסת אורחים אוטומטית לכל הזמנה.", planDetails: "פרטים ומחירים על המסלול", zoom: "הגדלת התמונה", zoomClose: "סגירה", zoomPrevious: "התמונה הקודמת", zoomNext: "התמונה הבאה", zoomHint: "לחצו על התמונה כדי להתקרב", view3d: "תלת־ממד", view3dLabel: "פתיחת התצוגה בתלת־ממד", view3dHint: "גררו או השתמשו בחצים כדי לסובב · גללו, צבטו או +/− כדי להתקרב", view3dReset: "איפוס התצוגה", view3dPhotos: "תמונות", view3dPhotosLabel: "חזרה לתמונות", view3dLoading: "טוען את התצוגה בתלת־ממד…", view3dError: "התצוגה בתלת־ממד לא נתמכת בדפדפן הזה.", view3dRetry: "לא הצלחנו לטעון את התצוגה בתלת־ממד. נסו שוב.", view3dModel: "דגם בתלת־ממד", view3dDimensions: "מידות", view3dUnit: "מ״מ", illustration: "התמונות והתצוגה בתלת־ממד להמחשה בלבד.",
    overview: "על המוצר", features: "בשימוש היומיומי", compatibility: "התקנה והתאמה", availability: "איך מזמינים", specs: "מפרט טכני",
    gateSpecs: [["מארז", "קופסת ABS אטומה, IP67"], ["מידות", "83 × 81 × 56 מ״מ"], ["מתח הזנה", "12–24V", true], ["תקשורת", "Wi‑Fi 6 · Bluetooth LE", true], ["מקלט שלטים", "433.92MHz, למידת שלטי RF דיגיטליים"], ["חיבורים", "מחברי הברגה · USB Type‑C"], ["משתמשים", "עד 5,000 משתמשים ו־20 מנהלים"], ["הזמנות אורח", "ללא הגבלה"], ["היסטוריה", "90 יום"], ["אירועים מתוזמנים", "עד 50"], ["מנוי", "לא נדרש · תשלום חד־פעמי"]],
    shutterSpecs: [["בקרים", "2 בקרי WIFIGATE, אחד לפתיחה ואחד לסגירה"], ["הפעלה", "לחצן בהחזקה עם טביעת אצבע"], ["בטיחות", "אי אפשר להפעיל פתיחה וסגירה יחד; שחרור האצבע עוצר את התריס"], ["מארז", "לוח עה״ט 18 מודולים, פוליקרבונט לבן"], ["מידות", "370 × 155 × 70 מ״מ"], ["תקשורת", "Wi‑Fi 6 · Bluetooth LE", true], ["התקנה", "התקנה פנימית, בתוך העסק"], ["מנוי", "לא נדרש · תשלום חד־פעמי"]],
    overviewText: "מחברים את השער החשמלי, דלת החניה או המחסום לאפליקציית WIFIGATE. בקר ייעודי מביא את הפתיחה היומיומית לטלפון שלכם.",
    shutterOverview: "מחברים את תריסי הגלילה החשמליים של העסק לאפליקציית WIFIGATE. בקר ייעודי, שמותקן בתוך העסק, מאפשר לפתוח ולסגור את התריס מהטלפון.",
    featureGate1: "פותחים שערים, דלתות חניה ומחסומים תואמים דרך אפליקציית WIFIGATE.",
    featureGate2: "מרכזים את נקודות הגישה שלכם באפליקציה אחת.",
    featureShutter1: "פותחים וסוגרים תריסי גלילה חשמליים של חנויות, מחסנים ומבני תעשייה דרך אפליקציית WIFIGATE.",
    featureShutter2: "מנהלים את התריסים באותה אפליקציה עם שאר מערכות WIFIGATE של העסק.",
    compatibilityText: "הבקר מותקן לצד מערכת בקרה קיימת ותואמת. צרו קשר עם הצוות כדי לבדוק התאמה להתקנה שלכם.",
    shutterCompatibility: "מיועד לתריסי גלילה חשמליים בעסקים ובתעשייה, בהתקנה בתוך העסק. צרו קשר עם הצוות כדי לבדוק התאמה לתריס ולהתקנה שלכם.",
    unavailableText: "מוסיפים את המוצר לסל ושולחים את ההזמנה ל־WhatsApp Business שלנו. הצוות חוזר אליכם שם לתאם מחיר, התקנה ומשלוח.",
    factUse: "מתאים ל", shutterUseValue: "תריסי גלילה בעסקים ובתעשייה",
    factControl: "שליטה", factControlValue: "אפליקציית WIFIGATE", allProducts: "כל המוצרים",
    businessEyebrow: "WIFIGATE לעסקים", subscription: "מנוי", businessHeading: "מסלולי מנויים.",
    businessIntro: "WIFIGATE עובד מקומית, ישירות מהאפליקציה ובלי שירותי ענן. מסלולי המנוי מוסיפים הרחבות בענן: WIFIGATE Host לניהול כניסת אורחים אוטומטית, ו־WIFIGATE Manager לשליטה בכל המערכות מכל מקום בעולם. הבחירה בידיכם, לפי הצורך.",
        hostTag: "אוטומציה לגישת אורחים", hostDescription: "ניהול כניסת אורחים אוטומטית לכל הזמנה: ההרשאה נכנסת לתוקף בצ׳ק־אין ופגה בצ׳ק־אאוט, בלי מפתחות ובלי קודים.",
            hostFeatures: ["גישה אוטומטית לכל הזמנה", "הגישה מסתיימת לבד בצ'ק-אאוט", "מסלולים מנכס יחיד ועד תיקי נכסים גדולים"],
    managerTag: "ניהול ארגוני", managerDescription: "כל המערכות שלכם, מכל מקום בעולם: הבקרים, המשתמשים וההרשאות של הארגון בלוח בקרה אחד בדפדפן.",
    hostSegments: ["מלונות", "דירות נופש", "בתי הארחה", "חניות להשכרה", "שירותי אחסנה", "ועוד…"], managerSegments: ["בנייני מגורים", "משרדים", "מתקני ספורט", "חניונים", "ועוד…"],
    managerFeatures: ["כל המערכות במקום אחד", "ניהול אנשים והרשאות", "היסטוריית גישה מלאה"],
    catalogTitle: "החנות של WIFIGATE | בקרי גישה חכמים",
    catalogDescription: "מגלים את בקרי WIFIGATE לשערים, לדלתות חניה, למחסומים ולתריסים חשמליים. מוסיפים לסל ושולחים את ההזמנה ב־WhatsApp.",
  },
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
const localePath = (locale, suffix = "") => `${locale === "en" ? "" : `/${locale.toLowerCase()}`}/${suffix ? `${suffix}/` : ""}`;
const productPath = (locale, id) => localePath(locale, `shop/${id}`);

// The product page image and the first listing card are the largest thing in
// the first screen, so they load at once with high priority.
function renderMedia(product, copy, { detail = false, first = false } = {}) {
  const alt = product.id === "wifigate-roller-shutter" ? copy.shutterAlt : copy.overviewAlt;
  const eager = detail || first;
  return `<img src="${product.image}" alt="${alt}" width="${product.width}" height="${product.height}" loading="${eager ? "eager" : "lazy"}" decoding="async"${eager ? ' fetchpriority="high"' : ""} />`;
}

const CART_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/></svg>';

// Add to cart puts the product in the wifigate_cart cookie (js/site-cart.js);
// the cart is then sent to WIFIGATE on WhatsApp for our team to continue the order.
function renderCartButton(copy, productId, name, className = "shop-actions__cart") {
  return `<button class="${className}" type="button" data-shop-cart="${productId}" aria-label="${escapeHtml(`${copy.addToCart}: ${name}`)}">${CART_ICON}<span>${copy.addToCart}</span></button>`;
}

// Add to cart leads; the details link sits beside it as quieter text.
function renderActions(copy, { href, label, details, name, productId, detailsClass = "" }) {
  return `<div class="shop-actions">${renderCartButton(copy, productId, name)}<a class="shop-actions__details${detailsClass}" href="${href}"${label ? ` aria-label="${escapeHtml(label)}"` : ""}>${details}</a></div>`;
}

// Same order as copy.useCases; each links to its use-case page.
const USE_CASE_PAGES = ["electric-gates", "garage-doors", "entry-doors-magnetic-locks", "private-homes", "residential-buildings", "office-buildings", "sports-facilities", "storage-lockers"];

const renderUseCases = (locale, copy) => `<p class="shop-product-card__uses-label">${copy.useCasesLabel}</p><ul class="shop-product-card__uses" aria-label="${copy.useCasesLabel}">${copy.useCases.map((label, index) => `<li><a href="${localePath(locale, USE_CASE_PAGES[index])}">${label}</a></li>`).join("")}</ul>`;

const renderList = (className, items) => `<p class="${className}">${items.map((item) => `<span>${item}</span>`).join("")}</p>`;

function renderCard(product, locale, copy, headingTag = "h2", first = false) {
  const shutter = product.id === "wifigate-roller-shutter";
  const href = productPath(locale, product.id);
  return `<article class="shop-product-card" data-product="${product.id}">
    <a class="shop-product-card__media" href="${href}" tabindex="-1" aria-hidden="true">${renderMedia(product, copy, { first })}</a>
    <div class="shop-product-card__body">
      <p class="shop-product-card__category">${shutter ? copy.shutterCategory : copy.category}</p>
      <${headingTag} class="shop-product-card__name" dir="ltr">${product.name}</${headingTag}>
      ${shutter ? `<p class="shop-product-card__description">${copy.shutterDescription}</p>` : renderUseCases(locale, copy)}
      ${renderList("shop-product-card__facts", shutter ? copy.shutterFacts : copy.facts)}
      ${renderActions(copy, { href, label: `${copy.view}: ${product.name}`, details: copy.view, name: product.name, productId: product.id, detailsClass: " shop-product-card__link" })}
    </div>
  </article>`;
}

// Each subscription is marked by its initial: a large outline letter, cropped
// at the corner, with the WIFIGATE label and the plan name.
const BUSINESS_LETTERS = { host: "H", manager: "M" };

function renderBusinessCard(copy, { id, name, href }) {
  const features = copy[`${id}Features`].map((feature) => `<li>${feature}</li>`).join("");
  return `<article class="shop-business-card shop-business-card--${id}" data-business="${id}">
    <div class="shop-business-card__media"><span class="shop-business-card__label" dir="ltr">WIFIGATE</span><span class="shop-business-card__letter" dir="ltr" aria-hidden="true">${BUSINESS_LETTERS[id]}</span>
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
    { id: "manager", name: "WIFIGATE Manager", href: localePath(locale, "wifigate-manager") },
  ];
  return `<div class="shop-divider" aria-hidden="true"><span>${copy.businessEyebrow}</span></div>
    <section class="shop-business" id="for-business" aria-labelledby="shop-business-title"><header class="shop-business__heading"><h2 id="shop-business-title">${copy.businessHeading}</h2><p>${copy.businessIntro}</p></header><div class="shop-business__grid">${cards.map((card) => renderBusinessCard(copy, card)).join("\n")}</div></section>`;
}

// The controller never needs a subscription; Host and Manager are optional
// add-ons. The chosen plan joins the controller in the cart (js/shop-page.js).
function renderPlanPicker(locale, copy) {
  const plans = [
    { value: "", title: copy.planNone, text: copy.planNoneText },
    { value: "wifigate-manager", title: copy.planManager, text: copy.planManagerText, page: "wifigate-manager" },
    { value: "wifigate-host", title: copy.planHost, text: copy.planHostText, page: "wifigate-host" },
  ];
  return `<fieldset class="shop-plan-picker" data-shop-plan><legend>${copy.planTitle}</legend>${plans.map(({ value, title, text, page }, index) =>
    `<label class="shop-plan"><input type="radio" name="shop-plan" value="${value}"${index ? "" : " checked"} /><span class="shop-plan__body"><span class="shop-plan__title">${title}</span><span class="shop-plan__text">${text}</span>${page ? `<a class="shop-plan__details" href="${localePath(locale, page)}">${copy.planDetails}</a>` : ""}</span></label>`).join("")}</fieldset>`;
}

const ZOOM_ICON = '<span class="shop-zoom__icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M11 8v6M8 11h6"/></svg></span>';
const CLOSE_ICON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const CHEVRON_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

const RULER_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 15.5 15.5 3.5l5 5-12 12z"/><path d="m7.5 11.5 2 2M10.5 8.5l2 2M13.5 5.5l2 2"/></svg>';
const PHOTO_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="m20.5 16-5-5-8.5 8.5"/></svg>';
const CUBE_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.8 20.5 7.4v9.2L12 21.2l-8.5-4.6V7.4z"/><path d="M3.8 7.6 12 12l8.2-4.4M12 12v9"/></svg>';

// Products with a 3D model and the textures js/shop-3d.js dresses them in.
const PRODUCT_3D = {
  "wifigate": { label: "/assets/img/shop/3d/enclosure-label.webp" },
  "wifigate-roller-shutter": { front: "/assets/img/shop/3d/roller-front.webp" },
};

// The 3D view opens in the photo viewer (js/shop-page.js loads three.js then).
function render3dButton(product, copy) {
  const assets = PRODUCT_3D[product.id];
  if (!assets) return "";
  return `<button type="button" class="shop-3d-button" data-shop-3d="${product.id}" data-shop-3d-assets='${JSON.stringify(assets)}' aria-label="${copy.view3dLabel}" aria-haspopup="dialog">${CUBE_ICON}<span>${copy.view3d}</span></button>`;
}

// Each product photo opens the full-screen viewer (js/shop-page.js).
function renderZoom(image, index, copy) {
  return `<button type="button" class="shop-zoom" data-shop-zoom="${index}" aria-label="${copy.zoom}" aria-haspopup="dialog">${image}${ZOOM_ICON}</button>`;
}

function renderViewer(product, copy, count) {
  // Products with a 3D model switch between their photos and the model from
  // inside the viewer, in both directions; shop-page.js sets the label.
  const mode = PRODUCT_3D[product.id] && count > 0
    ? `<button type="button" class="shop-viewer__mode" data-shop-viewer-mode data-label-3d="${copy.view3dLabel}" data-label-photos="${copy.view3dPhotosLabel}" aria-label="${copy.view3dLabel}"><span class="shop-viewer__mode-3d">${CUBE_ICON}<span>${copy.view3d}</span></span><span class="shop-viewer__mode-photos">${PHOTO_ICON}<span>${copy.view3dPhotos}</span></span></button>`
    : "";
  const nav = count > 1
    ? `<button type="button" class="shop-viewer__nav shop-viewer__nav--previous" data-shop-viewer-step="-1" aria-label="${copy.zoomPrevious}">${CHEVRON_ICON}</button><button type="button" class="shop-viewer__nav shop-viewer__nav--next" data-shop-viewer-step="1" aria-label="${copy.zoomNext}">${CHEVRON_ICON}</button>`
    : "";
  return `<dialog class="shop-viewer" aria-label="${product.name}" data-3d-hint="${copy.view3dHint}" data-3d-loading="${copy.view3dLoading}" data-3d-error="${copy.view3dError}" data-3d-retry="${copy.view3dRetry}" data-3d-label="${copy.view3dModel}: ${product.name}" data-3d-unit="${copy.view3dUnit}"><div class="shop-viewer__stage"></div><p class="shop-viewer__note">${copy.illustration}</p><button type="button" class="shop-viewer__close" aria-label="${copy.zoomClose}">${CLOSE_ICON}</button>${nav}<div class="shop-viewer__tools">${mode}<button type="button" class="shop-viewer__dimensions" aria-pressed="true" hidden>${RULER_ICON}<span>${copy.view3dDimensions}</span></button><button type="button" class="shop-viewer__reset" hidden>${copy.view3dReset}</button></div><p class="shop-viewer__hint"><span class="shop-viewer__hint-text" role="status" aria-live="polite">${copy.zoomHint}</span>${count > 1 ? '<span class="shop-viewer__count-wrap"> · <span class="shop-viewer__count" dir="ltr"></span></span>' : ""}</p></dialog>`;
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
      main: `${renderBreadcrumb(locale, copy)}<header class="shop-heading"><p class="shop-eyebrow">${copy.eyebrow}</p><h1 class="shop-heading__title">${copy.heading.map((line) => `<span>${line}</span>`).join(" ")}</h1></header><div class="shop-catalog-meta"><span>${copy.allProducts}</span><span>${copy.products}</span></div><div class="shop-grid">${SHOP_PRODUCTS.map((item, index) => renderCard(item, locale, copy, "h2", index === 0)).join("\n")}</div>${renderBusiness(locale, copy)}`,
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
        <div class="shop-product-gallery"><div class="shop-product-gallery__main">${renderZoom(renderMedia(product, copy, { detail: true }), 0, copy)}${render3dButton(product, copy)}</div>${product.secondary ? `<figure class="shop-product-gallery__secondary">${renderZoom(`<img src="${product.secondary}" alt="${copy.imageAlt}" width="1254" height="1254" loading="lazy" decoding="async" />`, 1, copy)}</figure>` : ""}<p class="shop-product-gallery__note">${copy.illustration}</p></div>
        ${renderViewer(product, copy, product.secondary ? 2 : 1)}
        <div class="shop-product-info"><p class="shop-product-info__category">${shutter ? copy.shutterCategory : copy.category}</p><h1 dir="ltr">${product.name}</h1>${shutter ? `<p class="shop-product-info__description">${copy.shutterDescription}</p>` : ""}${shutter ? `<a class="shop-product-info__more" href="${localePath(locale, "roller-shutters")}">${copy.shutterMore}</a>` : ""}
          <div class="shop-availability"><p>${copy.stockNote}</p></div>
          ${shutter ? "" : renderUseCases(locale, copy)}
          <dl class="shop-product-facts">${shutter ? `<div><dt>${copy.factUse}</dt><dd>${copy.shutterUseValue}</dd></div>` : ""}<div><dt>${copy.factControl}</dt><dd>${copy.factControlValue}</dd></div></dl>
          ${renderPlanPicker(locale, copy)}
          ${renderCartButton(copy, product.id, product.name, "shop-purchase")}
          <div class="shop-product-accordions">${renderAccordion(copy.overview, `<p>${shutter ? copy.shutterOverview : copy.overviewText}</p>`, { open: true })}${renderAccordion(copy.specs, renderSpecs(shutter ? copy.shutterSpecs : copy.gateSpecs), { open: true })}${renderAccordion(copy.features, `<ul><li>${shutter ? copy.featureShutter1 : copy.featureGate1}</li><li>${shutter ? copy.featureShutter2 : copy.featureGate2}</li></ul>`)}${renderAccordion(copy.compatibility, `<p>${shutter ? copy.shutterCompatibility : copy.compatibilityText}</p>`)}${renderAccordion(copy.availability, `<p>${copy.unavailableText}</p>`)}</div>
        </div>
      </article>`,
  };
}
