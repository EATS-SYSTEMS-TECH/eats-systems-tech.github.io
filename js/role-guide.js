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

const svg = (path) => {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shape.setAttribute("d", path);
  icon.append(shape);
  return icon;
};

const icons = {
  guide: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-2.5-11.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14m0 3h.01",
  check: "m5 12.5 4.5 4.5L19 7",
  close: "M6 6l12 12M18 6 6 18",
  shield: "M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-3 9 2 2 4-4",
  card: "M3 7h18v10H3zM3 11h18M7 15h3",
  people: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0m1.5-9a3 3 0 1 0 0-6m2.5 15a5 5 0 0 0-3-4.6",
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
// Each row lists the roles that hold it, in owner → viewer order.
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
        ["View systems, calendar, bookings and settings", 4],
        ["Bookings", 3],
        ["Guest links", 3],
        ["Activity", 3],
        ["Organization systems: add from the app, icon, remove", 2],
        ["Connections: booking system, automatic links, API key list", 2],
        ["API keys: create, rotate, revoke, reveal", 1],
        ["Organization settings, time zone, support access, delete guest details", 1],
        ["Members and roles", 1],
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
        ["צפייה: מערכות הארגון, לוח שנה, הזמנות, הגדרות", 4],
        ["הזמנות", 3],
        ["קישורי אורח", 3],
        ["פעילות", 3],
        ["מערכות הארגון: הוספה מהאפליקציה, סמל, הסרה", 2],
        ["חיבורים: מערכת ההזמנות, קישורים אוטומטיים, רשימת מפתחות API", 2],
        ["מפתחות API: יצירה, סיבוב, ביטול וחשיפה", 1],
        ["הגדרות הארגון ואזור הזמן, גישת תמיכה, מחיקת פרטי אורח", 1],
        ["חברים ותפקידים", 1],
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
        ["View payment points, tariffs and systems", 4],
        ["Daily work at payment points", 3],
        ["Configure payment points and tariffs, assign systems", 2],
        ["Organization settings", 1],
        ["Members and roles", 1],
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
        ["צפייה: נקודות תשלום, תעריפים ומערכות", 4],
        ["עבודה יומיומית בנקודות התשלום", 3],
        ["הגדרת נקודות תשלום ותעריפים, שיוך מערכות", 2],
        ["הגדרות הארגון", 1],
        ["חברים ותפקידים", 1],
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
        ["View the organization, people and gates", 4],
        ["Open and operate gates remotely, Wi-Fi setup", 3],
        ["Invite and remove people, name and logo", 2],
        ["Add, assign and remove systems", 1],
        ["Delete the organization", 1],
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
        ["צפייה: הארגון, האנשים והשערים", 4],
        ["פתיחה והפעלה של שערים מרחוק, הגדרת Wi-Fi", 3],
        ["הזמנה והסרה של אנשים, שם ולוגו", 2],
        ["הוספה, שיוך והסרה של מערכות", 1],
        ["מחיקת הארגון", 1],
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
  const name = element("h4", "role-guide-role__name", roleTitle(product, level, role));
  name.dir = "ltr";
  head.append(name);
  const t = copy[lang];
  const price =
    level === "plan"
      ? role === "user"
        ? [t.subscription, "paid"]
        : [t.noSubscription, "exempt"]
      : [t.free, "free"];
  const tag = element("span", "role-guide-tag", price[0]);
  tag.dataset.kind = price[1];
  head.append(tag);
  if (current) {
    const you = element("span", "role-guide-you", t.you);
    head.append(you);
    card.dataset.current = "true";
  }
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
    const cell = element("th", "", role);
    cell.scope = "col";
    cell.dir = "ltr";
    if (role === currentRole) cell.dataset.current = "true";
    head.append(cell);
  }
  const thead = element("thead");
  thead.append(head);
  const tbody = element("tbody");
  for (const [label, holders] of data.rows) {
    const row = element("tr");
    const name = element("th", "", label);
    name.scope = "row";
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

  const planLevel = element("section", "role-guide-level");
  planLevel.append(
    element("h3", "", t.planLevel),
    element("p", "role-guide-level__note", t.planLevelNote),
  );
  for (const role of ["admin", "user"])
    planLevel.append(roleCard(product, "plan", role, plans[lang][role], lang, own.plan === role));

  const orgLevel = element("section", "role-guide-level");
  orgLevel.append(
    element("h3", "", t.orgLevel),
    element("p", "role-guide-level__note", t.orgLevelNote),
  );
  const orgRole = sharedOrganizationRole(own.organizationRole);
  for (const role of organizationRoles)
    orgLevel.append(
      roleCard(product, "organization", role, products[product][lang].roles[role], lang, orgRole === role),
    );
  orgLevel.append(element("p", "role-guide-level__note", t.accessNote));

  levels.append(planLevel, orgLevel);

  const billing = element("aside", "role-guide-billing");
  billing.append(svg(icons.card));
  const billingText = element("div");
  billingText.append(element("strong", "", t.billingTitle), element("p", "", fill(t.billing, product)));
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
    const tab = element("button", "role-guide__tab", `WIFIGATE ${productNames[id]}`);
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
  const texts = element("div");
  texts.append(label, name);
  if (organizationName) {
    const org = element("span", "role-guide-card__org", organizationName);
    org.dir = "auto";
    texts.append(org);
  }
  head.append(texts);
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
      for (const item of items) list.append(element("li", "", item));
      block.append(list);
      lists.append(block);
    }
    details.append(lists);
    card.append(details);
  }
  return card;
}
