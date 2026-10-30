// One explanation of WIFIGATE For Business roles, shared by platform
// management and the Host, Pay and Manager dashboards. Two separate levels:
// a platform plan per person and product (Admin, User) and an organization
// role per organization and product (owner, admin, staff, viewer). Only the
// User plan pays a monthly subscription; organization roles never do.

export const roleGuideProducts = ["host", "pay", "manager"];
const organizationRoles = ["owner", "admin", "staff", "viewer"];
const productNames = { host: "Host", pay: "Pay", manager: "Manager" };

const languageOf = (language) =>
  (language ?? document.documentElement.lang ?? "en").startsWith("he")
    ? "he"
    : "en";

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const svg = (paths) => {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  for (const path of paths) {
    const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
    shape.setAttribute("d", path);
    icon.append(shape);
  }
  return icon;
};

// Icons from Lucide v1.65.0 (ISC; see js/vendor/lucide.LICENSE), one path per
// shape, so every role and permission uses the same professional icon set.
const icons = {
  // circle-question-mark
  guide: ["M2 12a10 10 0 1 0 20 0a10 10 0 1 0 -20 0", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3", "M12 17h.01"],
  // check
  check: ["M20 6 9 17l-5-5"],
  // x
  close: ["M18 6 6 18", "m6 6 12 12"],
  // shield-check
  shield: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "m9 12 2 2 4-4"],
  // credit-card
  card: ["M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2Z", "M2 10L22 10", "M6 14h2"],
  // users
  people: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M16 3.128a4 4 0 0 1 0 7.744", "M22 21v-2a4 4 0 0 0-3-3.87", "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"],
  // crown
  crown: ["M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L21.183 5.5a.5.5 0 0 1 .798.519l-2.834 10.246a1 1 0 0 1-.956.734H5.81a1 1 0 0 1-.957-.734L2.02 6.02a.5.5 0 0 1 .798-.519l4.276 3.664a1 1 0 0 0 1.516-.294z", "M5 21h14"],
  // user-cog
  userCog: ["M10 15H6a4 4 0 0 0-4 4v2", "m14.305 16.53.923-.382", "m15.228 13.852-.923-.383", "m16.852 12.228-.383-.923", "m16.852 17.772-.383.924", "m19.148 12.228.383-.923", "m19.53 18.696-.382-.924", "m20.772 13.852.924-.383", "m20.772 16.148.924.383", "M15 15a3 3 0 1 0 6 0a3 3 0 1 0 -6 0", "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"],
  // sliders-horizontal
  sliders: ["M10 5H3", "M12 19H3", "M14 3v4", "M16 17v4", "M21 12h-9", "M21 19h-5", "M21 5h-7", "M8 10v4", "M8 12H3"],
  // user-check
  staff: ["m16 11 2 2 4-4", "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0"],
  // eye
  eye: ["M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0", "M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"],
  // house
  house: ["M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8", "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  // wallet
  wallet: ["M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1", "M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"],
  // fence
  gate: ["M4 3 2 5v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z", "M6 8h4", "M6 18h4", "m12 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z", "M14 8h4", "M14 18h4", "m20 3-2 2v15c0 .6.4 1 1 1h2c.6 0 1-.4 1-1V5Z"],
  // layers
  layers: ["M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z", "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12", "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"],
  // building-2
  building: ["M10 12h4", "M10 8h4", "M14 21v-3a2 2 0 0 0-4 0v3", "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2", "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"],
  // calendar-days
  calendar: ["M8 2v3", "M16 2v3", "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2Z", "M3 9h18", "M8 13h.01", "M12 13h.01", "M16 13h.01", "M8 17h.01", "M12 17h.01", "M16 17h.01"],
  // link
  link: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"],
  // activity
  activity: ["M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"],
  // wifi
  wifi: ["M12 20h.01", "M2 8.82a15 15 0 0 1 20 0", "M5 12.859a10 10 0 0 1 14 0", "M8.5 16.429a5 5 0 0 1 7 0"],
  // plug
  plug: ["M12 22v-5", "M15 8V2", "M17 8a1 1 0 0 1 1 1v4a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1z", "M9 8V2"],
  // key-round
  key: ["M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z", "M16 7.5a0.5 0.5 0 1 0 1 0a0.5 0.5 0 1 0 -1 0"],
  // settings
  cog: ["M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915", "M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"],
  // user-plus
  userPlus: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M5 7a4 4 0 1 0 8 0a4 4 0 1 0 -8 0", "M19 8L19 14", "M22 11L16 11"],
  // trash-2
  trash: ["M10 11v6", "M14 11v6", "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", "M3 6h18", "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"],
  // receipt-text
  receipt: ["M13 16H8", "M14 8H8", "M16 12H8", "M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z"],
  // lock
  lock: ["M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-7a2 2 0 0 1 2 -2Z", "M7 11V7a5 5 0 0 1 10 0v4"],
};

const productIcons = { host: "house", pay: "wallet", manager: "gate" };
const planIcons = { admin: "shield", user: "card" };
const organizationIcons = { owner: "crown", admin: "userCog", staff: "staff", viewer: "eye" };

// A round badge that identifies a role at a glance; `tone` picks its colour.
const roleBadge = (level, role, className = "role-guide-avatar") => {
  const badge = element("span", className);
  badge.dataset.tone = level === "plan" ? `plan-${role}` : role;
  badge.append(svg(icons[(level === "plan" ? planIcons : organizationIcons)[role]]));
  return badge;
};

// Text for both levels. `{product}` is replaced by Host, Pay or Manager.
const copy = {
  en: {
    button: "Roles & access",
    title: "Roles & access",
    subtitle:
      "WIFIGATE For Business has two separate levels. A platform plan belongs to a person; an organization role belongs to a person inside one organization.",
    planLevel: "Platform plan",
    planLevelNote:
      "One per person in each product. It is not a role in any organization, and organization members do not need one.",
    orgLevel: "Organization role",
    orgLevelNote:
      "A separate role in every organization and in every product, so a person can be an admin in Pay and a viewer in Host.",
    subscription: "Monthly subscription",
    noSubscription: "No subscription",
    free: "Free",
    you: "You",
    billingTitle: "Who pays?",
    billing:
      "Only a WIFIGATE {product} User pays a monthly subscription, for the systems in their plan. WIFIGATE Admins are exempt, and organization roles — owner included — never pay and never see billing on their own. An owner sees the organization's billing only when they are also its subscribing User.",
    matrix: "What each organization role can do",
    permission: "Permission",
    managementTitle: "What is platform management?",
    managementLead:
      "Platform management is the WIFIGATE Admins' console for running WIFIGATE For Business. It is separate from every organization's workspace.",
    managementItems: [
      [
        "people",
        "People and plans",
        "Add, block and remove WIFIGATE Admins and Users in Host, Pay and Manager. Each plan is per product.",
      ],
      [
        "shield",
        "Organizations",
        "Create and remove organizations, see their owners and employees, and switch products on or off for them.",
      ],
      [
        "card",
        "Subscriptions",
        "An estimate of what Users pay each month. Admins are exempt; organization employees never pay.",
      ],
    ],
    managementBoundary:
      "Platform management never opens an organization's own data. Inside an organization, an Admin acts only by the organization role they hold there.",
    yourRole: "Your role in this organization",
    noRole: "You have no role in this organization",
    canDo: "You can",
    cannotDo: "Only higher roles can",
    allRoles: "All roles",
    details: "What this role can do",
    close: "Close",
    access: { active: "Active", pending: "Pending", blocked: "Blocked" },
    accessNote: "Access status is shown separately from the role: active, pending or blocked.",
  },
  he: {
    button: "תפקידים והרשאות",
    title: "תפקידים והרשאות",
    subtitle:
      "ב־WIFIGATE For Business יש שתי רמות נפרדות. תוכנית פלטפורמה שייכת לאדם; תפקיד ארגון שייך לאדם בתוך ארגון אחד.",
    planLevel: "תוכנית פלטפורמה",
    planLevelNote:
      "לכל אדם לכל היותר תוכנית אחת בכל מוצר. היא אינה תפקיד בארגון, וחבר ארגון אינו צריך אותה.",
    orgLevel: "תפקיד בארגון",
    orgLevelNote:
      "תפקיד נפרד בכל ארגון ובכל מוצר, כך שאדם יכול להיות admin ב־Pay ו־viewer ב־Host.",
    subscription: "מנוי חודשי",
    noSubscription: "ללא מנוי",
    free: "ללא עלות",
    you: "את/ה",
    billingTitle: "מי משלם?",
    billing:
      "רק WIFIGATE {product} User משלם מנוי חודשי, על המערכות שבתוכנית שלו. WIFIGATE Admins פטורים, ותפקידי ארגון — כולל owner — לעולם אינם משלמים ואינם רואים חיוב בזכות התפקיד בלבד. owner רואה את החיוב של הארגון רק אם הוא גם ה־User המנוי שלו.",
    matrix: "מה כל תפקיד בארגון יכול לעשות",
    permission: "הרשאה",
    managementTitle: "מהו ניהול הפלטפורמה?",
    managementLead:
      "ניהול הפלטפורמה הוא מסוף העבודה של WIFIGATE Admins להפעלת WIFIGATE For Business. הוא נפרד מסביבת העבודה של כל ארגון.",
    managementItems: [
      [
        "people",
        "אנשים ותוכניות",
        "הוספה, חסימה והסרה של WIFIGATE Admins ו־Users ב־Host, Pay ו־Manager. כל תוכנית היא לפי מוצר.",
      ],
      [
        "shield",
        "ארגונים",
        "יצירה והסרה של ארגונים, צפייה בבעלים ובעובדים שלהם, והפעלה או כיבוי של מוצרים עבורם.",
      ],
      [
        "card",
        "מנויים",
        "אומדן של מה ש־Users משלמים בכל חודש. Admins פטורים; עובדי ארגון לעולם אינם משלמים.",
      ],
    ],
    managementBoundary:
      "ניהול הפלטפורמה אינו פותח את הנתונים של ארגון. בתוך ארגון, Admin פועל רק לפי תפקיד הארגון שיש לו שם.",
    yourRole: "התפקיד שלך בארגון הזה",
    noRole: "אין לך תפקיד בארגון הזה",
    canDo: "את/ה יכול/ה",
    cannotDo: "רק לתפקידים גבוהים יותר",
    allRoles: "כל התפקידים",
    details: "מה התפקיד הזה מאפשר",
    close: "סגירה",
    access: { active: "פעיל", pending: "ממתין", blocked: "חסום" },
    accessNote: "מצב הגישה מוצג בנפרד מהתפקיד: פעיל, ממתין או חסום.",
  },
};

// Platform plans: identical shape in every product.
const plans = {
  en: {
    admin: [
      "WIFIGATE's own operator: platform management, adding, blocking and removing Admins and Users, creating and removing organizations, and product access. Also My systems.",
      "Authenticator (TOTP) required. No automatic access to an organization's data — inside an organization they act by their membership role.",
    ],
    user: [
      "The paying customer with a {product} plan: My systems, and assigning them to organizations where they are owner or admin.",
      "Pays the monthly subscription for the systems in the plan.",
    ],
  },
  he: {
    admin: [
      "המפעיל של WIFIGATE: ניהול פלטפורמה, הוספה, חסימה והסרה של Admins ו־Users, יצירה והסרה של ארגונים, והרשאות מוצר. וגם המערכות שלי.",
      "אימות דו־שלבי (TOTP) חובה. אין לו גישה אוטומטית לנתוני ארגון — בתוך ארגון הוא פועל לפי תפקיד החברות שלו.",
    ],
    user: [
      "הלקוח המשלם עם תוכנית {product}: המערכות שלי, ושיוך שלהן לארגונים שבהם הוא owner או admin.",
      "משלם את המנוי החודשי על המערכות שבתוכנית.",
    ],
  },
};

// Organization roles per product: a summary and the rows of the matrix.
// Each row lists how many roles hold it, in owner → viewer order, and its icon.
const products = {
  host: {
    en: {
      roles: {
        owner:
          "Owns the organization. Everything an admin can do, plus organization settings and time zone, members and roles, support access and API keys (create, rotate, revoke, reveal). Every organization keeps at least one active owner.",
        admin:
          "Runs operations: organization systems (add from the app, icon, remove), bookings, guest links, connections and activity. Sees the API key list without changing it.",
        staff:
          "Daily team (reception, cleaning, maintenance): creates and updates bookings, creates guest links and handles activity. Does not add or remove systems.",
        viewer:
          "View only: the calendar, bookings and organization systems, without any change.",
      },
      rows: [
        ["View systems, calendar, bookings and settings", 4, "eye"],
        ["Bookings", 3, "calendar"],
        ["Guest links", 3, "link"],
        ["Activity", 3, "activity"],
        ["Organization systems: add from the app, icon, remove", 2, "wifi"],
        ["Connections: booking system, automatic links, API key list", 2, "plug"],
        ["API keys: create, rotate, revoke, reveal", 1, "key"],
        ["Organization settings, time zone, support access, delete guest details", 1, "cog"],
        ["Members and roles", 1, "people"],
      ],
    },
    he: {
      roles: {
        owner:
          "הבעלים של הארגון. כל מה שיש ל־admin, ובנוסף: הגדרות הארגון ואזור הזמן, ניהול החברים והתפקידים שלהם, גישת תמיכה ומפתחות API (יצירה, סיבוב, ביטול וחשיפה). בכל ארגון יש לפחות owner פעיל אחד.",
        admin:
          "מנהל את התפעול: מערכות הארגון (הוספה מהאפליקציה, החלפת סמל, הסרה), הזמנות, קישורי אורח, חיבורים ופעילות. רואה את רשימת מפתחות ה־API ואינו משנה אותה.",
        staff:
          "צוות יומיומי (קבלה, ניקיון, תחזוקה): יוצר ומעדכן הזמנות, יוצר קישורי אורח ומטפל בפעילות. אינו מוסיף ואינו מסיר מערכות.",
        viewer:
          "צפייה בלבד: רואה את לוח השנה, ההזמנות ומערכות הארגון, בלי שום שינוי.",
      },
      rows: [
        ["צפייה: מערכות הארגון, לוח שנה, הזמנות, הגדרות", 4, "eye"],
        ["הזמנות", 3, "calendar"],
        ["קישורי אורח", 3, "link"],
        ["פעילות", 3, "activity"],
        ["מערכות הארגון: הוספה מהאפליקציה, סמל, הסרה", 2, "wifi"],
        ["חיבורים: מערכת ההזמנות, קישורים אוטומטיים, רשימת מפתחות API", 2, "plug"],
        ["מפתחות API: יצירה, סיבוב, ביטול וחשיפה", 1, "key"],
        ["הגדרות הארגון ואזור הזמן, גישת תמיכה, מחיקת פרטי אורח", 1, "cog"],
        ["חברים ותפקידים", 1, "people"],
      ],
    },
  },
  pay: {
    en: {
      roles: {
        owner:
          "Owns the organization. Everything an admin can do, plus organization settings, members and roles. Every organization keeps at least one active owner.",
        admin:
          "Configures the organization's payment points and tariffs and assigns systems to the organization.",
        staff:
          "Daily team: sees the organization's payment points and tariffs and works with them day to day, without changing their configuration.",
        viewer: "View only: payment points, tariffs and systems, without any change.",
      },
      rows: [
        ["View payment points, tariffs and systems", 4, "eye"],
        ["Daily work at payment points", 3, "receipt"],
        ["Configure payment points and tariffs, assign systems", 2, "sliders"],
        ["Organization settings", 1, "cog"],
        ["Members and roles", 1, "people"],
      ],
    },
    he: {
      roles: {
        owner:
          "הבעלים של הארגון. כל מה שיש ל־admin, ובנוסף: הגדרות הארגון, ניהול החברים והתפקידים שלהם. בכל ארגון יש לפחות owner פעיל אחד.",
        admin: "מגדיר את נקודות התשלום והתעריפים של הארגון ומשייך מערכות לארגון.",
        staff:
          "צוות יומיומי: רואה את נקודות התשלום והתעריפים של הארגון ועובד איתן ביום־יום, בלי לשנות את ההגדרות.",
        viewer: "צפייה בלבד: נקודות תשלום, תעריפים ומערכות, בלי שום שינוי.",
      },
      rows: [
        ["צפייה: נקודות תשלום, תעריפים ומערכות", 4, "eye"],
        ["עבודה יומיומית בנקודות התשלום", 3, "receipt"],
        ["הגדרת נקודות תשלום ותעריפים, שיוך מערכות", 2, "sliders"],
        ["הגדרות הארגון", 1, "cog"],
        ["חברים ותפקידים", 1, "people"],
      ],
    },
  },
  manager: {
    en: {
      roles: {
        owner:
          "The Manager User whose account holds the organization. Everything an admin can do, plus adding, assigning and removing the organization's systems and deleting the organization.",
        admin:
          "Invites and removes people, changes the organization's name and logo, and opens and operates its gates remotely, Wi-Fi setup included.",
        staff:
          "Opens and operates the organization's gates remotely, Wi-Fi setup included. Does not manage people or branding.",
        viewer:
          "View only: the organization, its people and its gates. Cannot open or configure a gate.",
      },
      rows: [
        ["View the organization, people and gates", 4, "eye"],
        ["Open and operate gates remotely, Wi-Fi setup", 3, "gate"],
        ["Invite and remove people, name and logo", 2, "userPlus"],
        ["Add, assign and remove systems", 1, "wifi"],
        ["Delete the organization", 1, "trash"],
      ],
    },
    he: {
      roles: {
        owner:
          "ה־Manager User שהחשבון שלו מחזיק את הארגון. כל מה שיש ל־admin, ובנוסף: הוספה, שיוך והסרה של מערכות הארגון ומחיקת הארגון.",
        admin:
          "מזמין ומסיר אנשים, משנה את שם הארגון והלוגו, ופותח ומפעיל את השערים שלו מרחוק, כולל הגדרת Wi-Fi.",
        staff:
          "פותח ומפעיל את שערי הארגון מרחוק, כולל הגדרת Wi-Fi. אינו מנהל אנשים או מיתוג.",
        viewer:
          "צפייה בלבד: הארגון, האנשים והשערים שלו. אינו פותח ואינו מגדיר שער.",
      },
      rows: [
        ["צפייה: הארגון, האנשים והשערים", 4, "eye"],
        ["פתיחה והפעלה של שערים מרחוק, הגדרת Wi-Fi", 3, "gate"],
        ["הזמנה והסרה של אנשים, שם ולוגו", 2, "userPlus"],
        ["הוספה, שיוך והסרה של מערכות", 1, "wifi"],
        ["מחיקת הארגון", 1, "trash"],
      ],
    },
  },
};

const fill = (text, product) => text.replaceAll("{product}", productNames[product]);

// Legacy Manager role names read as the shared organization roles.
export function sharedOrganizationRole(role) {
  return (
    {
      "organization-admin": "admin",
      "organization-user": "staff",
      "organization-staff": "staff",
      "organization-viewer": "viewer",
    }[role] ?? (organizationRoles.includes(role) ? role : null)
  );
}

// "WIFIGATE Host Organization Owner", "WIFIGATE Pay User", …
export function roleTitle(product, level, role) {
  const name = `WIFIGATE ${productNames[product]}`;
  if (level === "plan") return `${name} ${role === "admin" ? "Admin" : "User"}`;
  const shared = sharedOrganizationRole(role);
  return shared
    ? `${name} Organization ${shared[0].toUpperCase()}${shared.slice(1)}`
    : name;
}

export function organizationRoleSummary(product, role, language) {
  const shared = sharedOrganizationRole(role);
  return shared ? products[product][languageOf(language)].roles[shared] : "";
}

function roleCard(product, level, role, text, lang, current) {
  const card = element("article", "role-guide-role");
  card.dataset.level = level;
  card.dataset.role = role;
  const head = element("header", "role-guide-role__head");
  const titles = element("div", "role-guide-role__titles");
  const name = element("h4", "role-guide-role__name", roleTitle(product, level, role));
  name.dir = "ltr";
  const tags = element("div", "role-guide-role__tags");
  const t = copy[lang];
  const price =
    level === "plan"
      ? role === "user"
        ? [t.subscription, "paid"]
        : [t.noSubscription, "exempt"]
      : [t.free, "free"];
  const tag = element("span", "role-guide-tag", price[0]);
  tag.dataset.kind = price[1];
  tags.append(tag);
  if (current) {
    const you = element("span", "role-guide-you", t.you);
    tags.append(you);
    card.dataset.current = "true";
  }
  titles.append(name, tags);
  head.append(roleBadge(level, role), titles);
  card.append(head);
  for (const line of [text].flat()) card.append(element("p", "", fill(line, product)));
  return card;
}

function matrix(product, lang, currentRole) {
  const t = copy[lang];
  const data = products[product][lang];
  const wrap = element("div", "role-guide-matrix");
  const table = element("table");
  const caption = element("caption", "", t.matrix);
  table.append(caption);
  const head = element("tr");
  head.append(element("th", "", t.permission));
  for (const role of organizationRoles) {
    const cell = element("th");
    cell.scope = "col";
    cell.dir = "ltr";
    const label = element("span", "role-guide-matrix__role");
    label.append(roleBadge("organization", role, "role-guide-avatar role-guide-avatar--small"), element("span", "", role));
    cell.append(label);
    if (role === currentRole) cell.dataset.current = "true";
    head.append(cell);
  }
  const thead = element("thead");
  thead.append(head);
  const tbody = element("tbody");
  for (const [label, holders, icon] of data.rows) {
    const row = element("tr");
    const name = element("th");
    name.scope = "row";
    const text = element("span", "role-guide-matrix__permission");
    text.append(svg(icons[icon]), element("span", "", label));
    name.append(text);
    row.append(name);
    organizationRoles.forEach((role, index) => {
      const cell = element("td");
      if (role === currentRole) cell.dataset.current = "true";
      if (index < holders) {
        cell.append(svg(icons.check));
        cell.dataset.allowed = "true";
        cell.setAttribute("aria-label", "✓");
      } else {
        cell.textContent = "—";
        cell.setAttribute("aria-label", "—");
      }
      row.append(cell);
    });
    tbody.append(row);
  }
  table.append(thead, tbody);
  wrap.append(table);
  return wrap;
}

function productPanel(product, lang, current = {}) {
  const t = copy[lang];
  const panel = element("section", "role-guide-panel");
  panel.dataset.product = product;
  const own = current.product === product ? current : {};
  const levels = element("div", "role-guide-levels");

  const levelHeading = (icon, text) => {
    const heading = element("h3");
    heading.append(svg(icons[icon]), element("span", "", text));
    return heading;
  };

  const planLevel = element("section", "role-guide-level");
  planLevel.dataset.level = "plan";
  planLevel.append(
    levelHeading("layers", t.planLevel),
    element("p", "role-guide-level__note", t.planLevelNote),
  );
  for (const role of ["admin", "user"])
    planLevel.append(roleCard(product, "plan", role, plans[lang][role], lang, own.plan === role));

  const orgLevel = element("section", "role-guide-level");
  orgLevel.dataset.level = "organization";
  orgLevel.append(
    levelHeading("building", t.orgLevel),
    element("p", "role-guide-level__note", t.orgLevelNote),
  );
  const orgRole = sharedOrganizationRole(own.organizationRole);
  for (const role of organizationRoles)
    orgLevel.append(
      roleCard(product, "organization", role, products[product][lang].roles[role], lang, orgRole === role),
    );
  const access = element("div", "role-guide-access");
  const states = element("div", "role-guide-access__states");
  for (const state of ["active", "pending", "blocked"]) {
    const chip = element("span", "role-guide-access__state", t.access[state]);
    chip.dataset.state = state;
    states.append(chip);
  }
  access.append(element("p", "role-guide-level__note", t.accessNote), states);
  orgLevel.append(access);

  levels.append(planLevel, orgLevel);

  const billing = element("aside", "role-guide-billing");
  billing.append(svg(icons.card));
  const billingText = element("div");
  billingText.append(element("strong", "", t.billingTitle), element("p", "", fill(t.billing, product)));
  const payers = element("div", "role-guide-billing__payers");
  for (const [icon, name, price, kind] of [
    ["card", roleTitle(product, "plan", "user"), t.subscription, "paid"],
    ["shield", roleTitle(product, "plan", "admin"), t.noSubscription, "exempt"],
    ["building", organizationRoles.join(" · "), t.free, "free"],
  ]) {
    const payer = element("div", "role-guide-billing__payer");
    payer.dataset.kind = kind;
    const label = element("span", "role-guide-billing__name", name);
    label.dir = "ltr";
    payer.append(svg(icons[icon]), label, element("span", "role-guide-tag", price));
    payer.lastChild.dataset.kind = kind;
    payers.append(payer);
  }
  billingText.append(payers);
  billing.append(billingText);

  panel.append(levels, billing, matrix(product, lang, orgRole));
  return panel;
}

// The Platform management overview: what the console does, and its boundary.
export function createPlatformManagementGuide({ language, onOpenRoles } = {}) {
  const lang = languageOf(language);
  const t = copy[lang];
  const section = element("section", "role-guide-management");
  section.setAttribute("aria-labelledby", "role-guide-management-title");
  const head = element("header", "role-guide-management__head");
  const title = element("h2", "", t.managementTitle);
  title.id = "role-guide-management-title";
  const lead = element("p", "", t.managementLead);
  const heading = element("div");
  heading.append(title, lead);
  head.append(heading);
  if (onOpenRoles) {
    const open = element("button", "role-guide-link");
    open.type = "button";
    open.append(svg(icons.guide), element("span", "", t.title));
    open.addEventListener("click", () => onOpenRoles());
    head.append(open);
  }
  const items = element("div", "role-guide-management__items");
  for (const [icon, name, text] of t.managementItems) {
    const item = element("article", "role-guide-management__item");
    item.append(svg(icons[icon]), element("h3", "", name), element("p", "", text));
    items.append(item);
  }
  const boundary = element("p", "role-guide-management__boundary", t.managementBoundary);
  section.append(head, items, boundary);
  return section;
}

let openDialog;

// `current`: {product, plan: "admin"|"user"|null, organizationRole}.
export function openRoleGuide({ product = "host", language, current = {} } = {}) {
  const lang = languageOf(language);
  const t = copy[lang];
  openDialog?.close();
  const dialog = element("dialog", "role-guide");
  dialog.dir = lang === "he" ? "rtl" : "ltr";
  dialog.lang = lang;
  dialog.setAttribute("aria-labelledby", "role-guide-title");
  const header = element("header", "role-guide__header");
  const titles = element("div");
  const title = element("h2", "", t.title);
  title.id = "role-guide-title";
  titles.append(title, element("p", "role-guide__subtitle", t.subtitle));
  const close = element("button", "role-guide__close");
  close.type = "button";
  close.setAttribute("aria-label", t.close);
  close.append(svg(icons.close));
  close.addEventListener("click", () => dialog.close());
  header.append(titles, close);

  const tabs = element("div", "role-guide__tabs");
  tabs.setAttribute("role", "tablist");
  const body = element("div", "role-guide__body");
  const select = (id) => {
    for (const tab of tabs.children) {
      const on = tab.dataset.product === id;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    }
    dialog.dataset.product = id;
    body.replaceChildren(productPanel(id, lang, current));
    body.scrollTop = 0;
  };
  for (const id of roleGuideProducts) {
    const tab = element("button", "role-guide__tab");
    tab.append(svg(icons[productIcons[id]]), element("span", "", `WIFIGATE ${productNames[id]}`));
    tab.type = "button";
    tab.dir = "ltr";
    tab.dataset.product = id;
    tab.setAttribute("role", "tab");
    tab.addEventListener("click", () => select(id));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      const order = roleGuideProducts;
      const step = (event.key === "ArrowRight") === (lang !== "he") ? 1 : -1;
      const next = order[(order.indexOf(id) + step + order.length) % order.length];
      select(next);
      tabs.querySelector(`[data-product="${next}"]`).focus();
    });
    tabs.append(tab);
  }
  dialog.append(header, tabs, body);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    dialog.remove();
    if (openDialog === dialog) openDialog = undefined;
  });
  document.body.append(dialog);
  select(roleGuideProducts.includes(product) ? product : "host");
  openDialog = dialog;
  dialog.showModal();
  return dialog;
}

// A header button that opens the guide. `context()` returns the current
// {product, plan, organizationRole} when it is opened.
export function createRoleGuideButton({ product, language, context } = {}) {
  const lang = languageOf(language);
  const button = element("button", "dashboard-website-link role-guide-trigger");
  button.type = "button";
  button.dataset.roleGuide = "open";
  button.setAttribute("aria-label", copy[lang].button);
  button.title = copy[lang].button;
  button.append(svg(icons.guide), element("span", "", copy[lang].button));
  button.addEventListener("click", () => {
    const current = context?.() ?? {};
    openRoleGuide({ product: current.product ?? product, language: lang, current });
  });
  return button;
}

// Puts the guide button into the dashboard header, once.
export function mountRoleGuideButton(options) {
  if (document.querySelector("[data-role-guide=open]")) return null;
  const anchor = document.querySelector(".dashboard-website-link");
  if (!anchor) return null;
  const button = createRoleGuideButton(options);
  anchor.before(button);
  return button;
}

// Radio cards for choosing an organization role when adding someone: the
// role's badge, its WIFIGATE name and what it allows. `unavailable` maps a
// role to the reason it cannot be chosen here; that card stays visible but
// disabled, so all four roles are always explained.
export function createRolePicker({
  product,
  language,
  name = "role",
  value = "admin",
  unavailable = {},
} = {}) {
  const lang = languageOf(language);
  const picker = element("fieldset", "role-guide-picker");
  picker.dataset.product = product;
  picker.append(element("legend", "", copy[lang].orgLevel));
  const selected = unavailable[value] ? organizationRoles.find((role) => !unavailable[role]) : value;
  for (const role of organizationRoles) {
    const choice = element("label", "role-guide-choice");
    choice.dataset.role = role;
    const input = element("input");
    input.type = "radio";
    input.name = name;
    input.value = role;
    input.checked = role === selected;
    input.disabled = Boolean(unavailable[role]);
    const texts = element("span", "role-guide-choice__texts");
    const title = element("strong", "", `Organization ${role[0].toUpperCase()}${role.slice(1)}`);
    title.dir = "ltr";
    texts.append(title, element("small", "", products[product][lang].roles[role]));
    if (unavailable[role]) texts.append(element("small", "role-guide-choice__note", unavailable[role]));
    const mark = element("span", "role-guide-choice__mark");
    mark.append(svg(icons.check));
    choice.append(input, roleBadge("organization", role), texts, mark);
    picker.append(choice);
  }
  return picker;
}

// "Your role in this organization": who you are here, what you can do, and
// what only higher roles can. The full guide is one click away.
export function createOrganizationRoleCard({ product, language, role, plan, organizationName }) {
  const lang = languageOf(language);
  const t = copy[lang];
  const shared = sharedOrganizationRole(role);
  const card = element("section", "role-guide-card");
  card.dataset.product = product;
  card.dataset.role = shared ?? "none";
  const head = element("div", "role-guide-card__head");
  const label = element("span", "role-guide-card__eyebrow", t.yourRole);
  const name = element("strong", "role-guide-card__role", shared ? roleTitle(product, "organization", shared) : t.noRole);
  name.dir = "ltr";
  const texts = element("div", "role-guide-card__texts");
  texts.append(label, name);
  if (organizationName) {
    const org = element("span", "role-guide-card__org", organizationName);
    org.dir = "auto";
    texts.append(org);
  }
  const who = element("div", "role-guide-card__who");
  if (shared) who.append(roleBadge("organization", shared, "role-guide-avatar role-guide-avatar--large"));
  else {
    const none = element("span", "role-guide-avatar role-guide-avatar--large");
    none.dataset.tone = "none";
    none.append(svg(icons.lock));
    who.append(none);
  }
  who.append(texts);
  head.append(who);
  const more = element("button", "role-guide-link");
  more.type = "button";
  more.append(svg(icons.guide), element("span", "", t.allRoles));
  more.addEventListener("click", () =>
    openRoleGuide({ product, language: lang, current: { product, plan, organizationRole: shared } }),
  );
  head.append(more);
  card.append(head);
  if (shared) {
    card.append(element("p", "role-guide-card__summary", products[product][lang].roles[shared]));
    const rows = products[product][lang].rows;
    const rank = organizationRoles.indexOf(shared);
    const can = rows.filter(([, holders]) => rank < holders).map(([label]) => label);
    const cannot = rows.filter(([, holders]) => rank >= holders).map(([label]) => label);
    const details = element("details", "role-guide-card__details");
    details.append(element("summary", "", t.details));
    const lists = element("div", "role-guide-card__lists");
    for (const [items, heading, kind] of [
      [can, t.canDo, "can"],
      [cannot, t.cannotDo, "cannot"],
    ]) {
      if (!items.length) continue;
      const block = element("div", "role-guide-card__list");
      block.dataset.kind = kind;
      block.append(element("h3", "", heading));
      const list = element("ul");
      for (const item of items) {
        const entry = element("li");
        entry.append(svg(icons[kind === "can" ? "check" : "lock"]), element("span", "", item));
        list.append(entry);
      }
      block.append(list);
      lists.append(block);
    }
    details.append(lists);
    card.append(details);
  }
  return card;
}
