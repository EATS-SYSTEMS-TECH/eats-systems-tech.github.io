const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
};

const benefitIcon = (kind) => {
  const ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
  for (const [name, value] of Object.entries({ viewBox:"0 0 24 24", width:"26", height:"26", fill:"none", stroke:"currentColor", "stroke-width":"1.65", "stroke-linecap":"round", "stroke-linejoin":"round", "aria-hidden":"true", focusable:"false" })) svg.setAttribute(name, value);
  const shapes = {
    systems: ["M4 3h6v6H4zM14 15h6v6h-6zM4 15h6v6H4zM14 3h6v6h-6z", "M7 9v6M17 9v6M10 6h4M10 18h4"],
    team: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75", "M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0"],
    roles: ["M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z", "m8 12 3 3 5-6"],
  };
  for (const d of shapes[kind]) { const path = document.createElementNS(ns,"path"); path.setAttribute("d",d); svg.append(path); }
  const wrap = node("span",undefined,"manager-organization-benefit-icon"); wrap.append(svg); return wrap;
};

/** Read-only introduction to the existing organization and membership model. */
export function createManagerOrganizationGuide(language = "en") {
  const t = (he, en) => (language === "he" ? he : en);
  const guide = node(
    "details",
    undefined,
    "manager-organization-guide manager-setup-guide dashboard-examples",
  );
  guide.append(
    node("summary", t("למה צריך ארגון?", "Why use an organization?")),
  );
  guide.append(
    node(
      "p",
      t(
        "ארגון הוא סביבת עבודה משותפת ב־WIFIGATE Manager. הוא מרכז את המערכות של בניין, עסק או צוות ואת האנשים שמנהלים אותן.",
        "An organization is a shared workspace in WIFIGATE Manager. It brings together the systems of a building, business or team and the people who manage them.",
      ),
    ),
  );
  const benefits = node("ul", undefined, "manager-organization-benefits");
  for (const [kind, title, description] of [
    [
      "systems",
      t("כל המערכות במקום אחד", "Systems in one place"),
      t(
        "משייכים לארגון מערכות קיימות ורואים אותן יחד, למשל שער חניה ודלת כניסה של אותו בניין.",
        "Link existing systems and see them together, such as a building’s parking gate and entrance door.",
      ),
    ],
    [
      "team",
      t("ניהול משותף לצוות", "Shared team management"),
      t(
        "מזמינים אנשים לארגון כדי שיוכלו לפתוח את סביבת הניהול של המערכות המשויכות אליו, כל אחד מהחשבון שלו.",
        "Invite people to open the workspaces of the organization’s linked systems, each using their own account.",
      ),
    ],
    [
      "roles",
      t("תפקידים ברורים", "Clear responsibilities"),
      t(
        "מנהלי הארגון יכולים להוסיף ולהסיר מנהלים ומשתמשים. משתמשי הארגון יכולים להיכנס לסביבות הניהול, ללא ניהול אנשי הארגון.",
        "Organization admins can add or remove admins and users. Organization users can access system workspaces without managing organization members.",
      ),
    ],
  ]) {
    const item = node("li");
    item.append(benefitIcon(kind), node("strong", title), node("p", description));
    benefits.append(item);
  }
  guide.append(benefits);
  const when = node("p", undefined, "manager-setup-update");
  when.append(
    node(
      "strong",
      t("מתי כדאי להשתמש בארגון?", "When is an organization useful?"),
    ),
    document.createTextNode(
      " " +
        t(
          "כשכמה מערכות שייכות לאותו בניין או עסק, או כשיותר מאדם אחד צריך לנהל אותן. מתחילים ביצירת ארגון, משייכים אליו מערכות קיימות ומזמינים את הצוות.",
          "When several systems belong to the same building or business, or more than one person needs to manage them. Start by creating an organization, linking existing systems and inviting your team.",
        ),
    ),
  );
  guide.append(when);
  return guide;
}
