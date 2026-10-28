const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
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
  for (const [title, description] of [
    [
      t("כל המערכות במקום אחד", "Systems in one place"),
      t(
        "משייכים לארגון מערכות קיימות ורואים אותן יחד, למשל שער חניה ודלת כניסה של אותו בניין.",
        "Link existing systems and see them together, such as a building’s parking gate and entrance door.",
      ),
    ],
    [
      t("ניהול משותף לצוות", "Shared team management"),
      t(
        "מזמינים אנשים לארגון כדי שיוכלו לפתוח את סביבת הניהול של המערכות המשויכות אליו, כל אחד מהחשבון שלו.",
        "Invite people to open the workspaces of the organization’s linked systems, each using their own account.",
      ),
    ],
    [
      t("תפקידים ברורים", "Clear responsibilities"),
      t(
        "מנהלי הארגון יכולים להוסיף ולהסיר מנהלים ומשתמשים. משתמשי הארגון יכולים להיכנס לסביבות הניהול, ללא ניהול אנשי הארגון.",
        "Organization admins can add or remove admins and users. Organization users can access system workspaces without managing organization members.",
      ),
    ],
  ]) {
    const item = node("li");
    item.append(node("strong", title), node("p", description));
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
