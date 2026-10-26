import { getPlatformDirectory } from "./api/index.js";
import {
  monthlyEstimate,
  monthlyTotal,
  formatMoney,
} from "./profile-financials.js";
import { productLink } from "./product-switcher.js";

const element = (tag, text, className) => {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
};

export function createPlatformAdminDirectory({
  root,
  user,
  language,
  product = "all",
  standalone = false,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  let closed = false,
    generation = 0,
    selected = "all",
    next;
  root.hidden = false;
  root.dataset.standalone = String(standalone);
  const productName =
    product === "all"
      ? "WIFIGATE"
      : `WIFIGATE ${product[0].toUpperCase() + product.slice(1)}`;
  const title = element(
    "h2",
    (standalone
      ? t("חשבונות והרשאות", "People and access")
      : t("ניהול פלטפורמה", "Platform management")) +
      (product === "all" ? "" : ` · ${productName}`),
  );
  const note = element(
    "p",
    t(
      "חשבונות שהוגדרה להם גישה, כולל ממתינים וחסומים. כל חשבון נספר פעם אחת במסגרת הסקירה. הסכומים הם אומדן לחודש מלא לפני מס, ולא אישור גבייה.",
      "Provisioned accounts, including pending and blocked records. Each account is counted once within this overview. Amounts are full-month estimates before tax, not collected payments.",
    ),
  );
  const counts = element("div", null, "platform-admin-counts");
  const filters = element("nav", null, "platform-admin-filters");
  filters.setAttribute("aria-label", t("סינון משתמשים", "Filter people"));
  for (const [role, label] of [
    ["all", t("כל החשבונות", "All accounts")],
    ["admin", `${productName} Admins`],
    ["user", `${productName} Users`],
  ]) {
    const button = element("button", label, "platform-button");
    button.type = "button";
    button.dataset.role = role;
    button.addEventListener("click", () => {
      selected = role;
      void load();
    });
    filters.append(button);
  }
  const businessTitle = element("h3", "For Business");
  const business = element("nav", null, "platform-admin-business");
  business.setAttribute("aria-label", "For Business");
  for (const id of ["host", "pay", "manager"]) {
    const link = element("a", `WIFIGATE ${id[0].toUpperCase() + id.slice(1)}`);
    link.href = productLink(id, language);
    if (id === product) link.setAttribute("aria-current", "page");
    link.dir = "ltr";
    business.append(link);
  }
  const status = element("p");
  status.setAttribute("role", "status");
  const rows = element("div", null, "platform-admin-people");
  const more = element("button", t("טען עוד", "Load more"), "platform-button");
  more.type = "button";
  more.hidden = true;
  more.addEventListener("click", () => void load(true));
  const refresh = element("button", t("רענון", "Refresh"), "platform-button");
  refresh.type = "button";
  refresh.addEventListener("click", () => void load());
  const header = element("div", null, "platform-admin-directory-heading");
  const heading = element("div");
  heading.append(title, note);
  header.append(heading, refresh);
  const products = element("section", null, "platform-admin-products");
  products.append(businessTitle, business);
  const listHeading = element("h3", t("משתמשי הפלטפורמה", "Platform accounts"));
  const hint = element(
    "p",
    t(
      "פתחו חשבון כדי לראות תוכניות ועלויות לפי מוצר.",
      "Open an account to see plans and costs by product.",
    ),
    "platform-admin-list-hint",
  );
  const footnote = element(
    "p",
    t(
      "הסכומים הם אומדנים לפני מס. — מציין נתון שאינו זמין; נתוני הכנסות Pay עדיין אינם מאומתים.",
      "Amounts are estimates before tax. — means unavailable; Pay revenue data is not verified yet.",
    ),
    "platform-admin-footnote",
  );
  root.replaceChildren(
    header,
    counts,
    products,
    listHeading,
    hint,
    filters,
    status,
    rows,
    more,
    footnote,
  );

  function personCard(person) {
    const card = element("details", null, "platform-admin-person");
    const summary = element("summary", null, "platform-admin-person-summary");
    const avatar = element(
      "span",
      (person.name || person.email)
        .trim()
        .slice(0, 1)
        .toLocaleUpperCase(language),
      "platform-admin-avatar",
    );
    avatar.setAttribute("aria-hidden", "true");
    const identity = element("span", null, "platform-admin-person-identity");
    identity.append(element("strong", person.name || person.email));
    const email = element("span", person.email);
    email.dir = "ltr";
    identity.append(email);
    const badge = element(
      "span",
      person.role === "admin" ? t("מנהל", "Admin") : t("משתמש", "User"),
      "platform-admin-role",
    );
    badge.dataset.role = person.role;
    const total =
      product === "all"
        ? monthlyTotal(person.products, language)
        : formatMoney(
            monthlyEstimate(person.products[product])?.monthlyCents,
            monthlyEstimate(person.products[product])?.currency,
            language,
          );
    const price = element("span", null, "platform-admin-person-price");
    const value = element(
      "strong",
      person.identityStatus === "verified" ? total : "—",
    );
    value.dir = "auto";
    price.append(element("small", t("אומדן לחודש", "Monthly estimate")), value);
    const chevron = element("span", "⌄", "platform-admin-chevron");
    chevron.setAttribute("aria-hidden", "true");
    summary.append(avatar, identity, badge, price, chevron);
    card.append(summary);
    const content = element("div", null, "platform-admin-person-content");
    card.append(content);
    if (person.identityStatus !== "verified") {
      content.append(
        element(
          "p",
          t(
            "זהות לא זמינה או טרם אומתה. נתוני תוכניות אינם זמינים.",
            "Identity unavailable or not verified. Plan details are unavailable.",
          ),
        ),
      );
      return card;
    }
    const tableWrap = element("div", null, "platform-admin-table-wrap");
    const table = element("table");
    const caption = element(
      "caption",
      t("תוכניות, מערכות ואומדן חודשי", "Plans, systems and monthly estimate"),
    );
    table.append(caption);
    const head = table.createTHead().insertRow();
    for (const label of [
      t("מוצר", "Product"),
      t("גישה ותוכנית", "Access and plan"),
      t("שערים לחיוב", "Billable physical gates"),
      t("אומדן חודשי", "Monthly estimate"),
    ]) {
      const th = element("th", label);
      th.scope = "col";
      head.append(th);
    }
    const body = table.createTBody();
    const labels = {
      active: t("פעיל", "Active"),
      pending: t("ממתין", "Pending"),
      blocked: t("חסום", "Blocked"),
      "no-plan": t("ללא תוכנית", "No plan"),
      unavailable: t("לא זמין", "Unavailable"),
      "mfa-required": t("נדרש אימות", "Verification required"),
    };
    for (const id of product === "all"
      ? ["host", "pay", "manager"]
      : [product]) {
      const plan = person.products[id];
      const estimate = monthlyEstimate(plan);
      const row = body.insertRow();
      const name = element(
        "th",
        `WIFIGATE ${id[0].toUpperCase() + id.slice(1)}`,
      );
      name.scope = "row";
      name.dir = "ltr";
      row.append(name);
      const member =
        plan?.state === "active" && id === "host" && !plan.role
          ? t("גישה דרך ארגון", "Organization access")
          : null;
      const access = [
        labels[plan?.state] || labels.unavailable,
        plan?.plan,
        member,
      ]
        .filter(Boolean)
        .join(" · ");
      const accessCell = element("td", access);
      accessCell.className = "platform-admin-access";
      row.append(accessCell);
      const quantity = element(
        "td",
        estimate ? String(estimate.physicalGates) : "—",
      );
      quantity.dataset.label = t("שערים לחיוב", "Billable physical gates");
      row.append(quantity);
      const amount = element(
        "td",
        formatMoney(estimate?.monthlyCents, estimate?.currency, language),
      );
      amount.dataset.label = t("אומדן חודשי", "Monthly estimate");
      amount.dir = "auto";
      row.append(amount);
    }
    tableWrap.append(table);
    content.append(tableWrap);
    return card;
  }

  async function load(append = false) {
    const epoch = ++generation;
    root.setAttribute("aria-busy", "true");
    refresh.disabled = true;
    if (!append) {
      rows.replaceChildren();
      next = null;
    }
    more.hidden = true;
    status.textContent = t(
      "טוען משתמשים ותוכניות…",
      "Loading people and plans…",
    );
    for (const button of filters.children)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.role === selected),
      );
    try {
      const data = await getPlatformDirectory(
        user,
        selected,
        append ? next : undefined,
        product,
      );
      if (closed || epoch !== generation) return;
      counts.replaceChildren(
        ...[
          [`${productName} Admins`, data.counts.admins],
          [`${productName} Users`, data.counts.users],
          [t("סה״כ חשבונות", "Total accounts"), data.counts.total],
        ].map(([label, count]) => {
          const tile = element("div");
          tile.append(element("span", label), element("strong", String(count)));
          return tile;
        }),
      );
      rows.append(...data.items.map(personCard));
      next = data.nextCursor;
      more.hidden = !next;
      status.textContent = rows.childElementCount
        ? ""
        : t("לא נמצאו חשבונות.", "No accounts found.");
    } catch (error) {
      if (!closed && epoch === generation) {
        status.textContent =
          error.status === 403
            ? t(
                "נדרשת הרשאת מנהל מתאימה ואימות דו־שלבי כדי לצפות בנתונים.",
                "The appropriate administrator role and authenticator verification are required.",
              )
            : error.status === 413
              ? t(
                  "הרשימה חורגת ממגבלת הסקירה. נדרשת הרחבת הדפדוף בשרת.",
                  "The directory exceeds the overview limit. Backend pagination needs extending.",
                )
              : t(
                  "הנתונים אינם זמינים כרגע. אפשר לנסות לרענן.",
                  "Data is currently unavailable. Try refreshing.",
                );
      }
    } finally {
      if (!closed && epoch === generation) {
        root.setAttribute("aria-busy", "false");
        refresh.disabled = false;
      }
    }
  }
  void load();
  return {
    close() {
      closed = true;
      generation++;
      root.replaceChildren();
      root.hidden = true;
    },
  };
}
