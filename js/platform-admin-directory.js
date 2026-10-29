import {
  getPlatformDirectory,
  getPlatformOrganizationOverview,
  getPlatformDirectoryFinancials,
} from "./api/index.js";
import {
  monthlyEstimate,
  monthlyTotal,
  formatMoney,
} from "./profile-financials.js";
import { productLink } from "./product-switcher.js";
import { createPlatformAccountDeletion } from "./platform-account-deletion.js";
import { createPlatformAccountActions } from "./platform-account-actions.js";

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
  ensureRecent,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  let closed = false,
    generation = 0,
    selected = "all",
    selectedProduct = product === "all" && ["host","pay","manager"].includes(new URLSearchParams(location.search).get("product")) ? new URLSearchParams(location.search).get("product") : product,
    productCounts = {},
    financialGeneration = 0,
    next;
  root.hidden = false;
  root.classList.add("platform-admin-management");
  root.dataset.standalone = String(standalone);
  const nameFor = (id) =>
    id === "all" ? "WIFIGATE" : `WIFIGATE ${id[0].toUpperCase() + id.slice(1)}`;
  const productName = nameFor(product);
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
    ["organizations", t("ארגונים", "Organizations")],
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
  const businessTitle = element("h3", t("בחרו מסלול לניהול", "Choose a product to manage"));
  const resetProduct = element(
    "button",
    t("כל המסלולים", "All plans"),
    "platform-admin-product-reset",
  );
  resetProduct.type = "button";
  resetProduct.addEventListener("click", () => selectProduct("all"));
  const business = element("nav", null, "platform-admin-business");
  business.setAttribute("aria-label", t("סינון לפי מסלול", "Filter by plan"));
  for (const id of ["host", "pay", "manager"]) {
    if (product === "all") {
      const button = element("button", null, "platform-admin-product-filter");
      button.type = "button";
      button.dataset.product = id;
      const label = element("span", nameFor(id), "platform-admin-product-name");
      label.dir = "ltr";
      const count = element("strong", t("לא זמין", "Unavailable"), "platform-admin-product-count");
      button.append(
        label,
        count,
        element("small", t("חשבונות עם גישה", "Provisioned accounts")),
        element("span", t("בחירת מסלול ←", "Select product →"), "platform-admin-product-select"),
      );
      button.addEventListener("click", () => selectProduct(id));
      business.append(button);
      continue;
    }
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
  const productHeading = element(
    "div",
    null,
    "platform-admin-products-heading",
  );
  productHeading.append(businessTitle);
  if (product === "all") productHeading.append(resetProduct);
  products.append(element("span", "For Business", "platform-admin-products-eyebrow"), productHeading, element("p", t("בחרו מסלול כדי להציג את החשבונות והארגונים שלו. אפשר להחליף מסלול בכל רגע.", "Select a product to view its accounts and organizations. You can switch at any time."), "platform-admin-products-help"), business);
  const listHeading = element("h3", t("משתמשי הפלטפורמה", "Platform accounts"));
  const listToolbar = element("div", null, "platform-admin-list-toolbar");
  listToolbar.append(listHeading);
  const actionStatus = element("p");
  actionStatus.setAttribute("role", "status");
  const changed = message => {
    actionStatus.textContent = message;
    productCounts = {};
    void load();
  };
  const deletions = standalone && product === "all" && ensureRecent
    ? createPlatformAccountDeletion({user,language,ensureRecent,onChanged:changed}) : null;
  const actions =
    standalone && product === "all"
      ? createPlatformAccountActions({
          user,
          language,
          ensureRecent,
          onChanged: (message) => {
            actionStatus.textContent = message;
            productCounts = {};
            void load();
          },
        })
      : null;
  if (actions) {
    const invite = element(
      "button",
      t("הזמנת משתמש", "Invite a person"),
      "platform-button platform-admin-invite",
    );
    invite.type = "button";
    invite.addEventListener("click", () => actions.invite(selectedProduct));
    listToolbar.append(invite);
  }
  const revenue = element("section", null, "platform-admin-revenue");
  const revenueValue = element("strong", t("לא זמין", "Unavailable"));
  const revenueStatus = element("p");
  revenueStatus.setAttribute("role", "status");
  revenue.append(
    element(
      "h3",
      t("סה״כ הכנסות חודשיות (אומדן)", "Total monthly revenue (estimate)"),
    ),
    revenueValue,
    revenueStatus,
  );
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
      "הסכומים הם אומדנים לפני מס. כשחסרים נתונים מוצג ״לא זמין״. נתוני הכנסות Pay עדיין אינם מאומתים.",
      "Amounts are estimates before tax. Missing data is marked Unavailable. Pay revenue data is not verified yet.",
    ),
    "platform-admin-footnote",
  );
  root.replaceChildren(
    products,
    header,
    counts,
    listToolbar,
    ...(product === "all" ? [revenue] : []),
    hint,
    filters,
    status,
    actionStatus,
    rows,
    more,
    footnote,
  );

  function selectProduct(id) {
    if (selectedProduct === id) return;
    selectedProduct = id;
    void load();
  }

  function renderProductFilters() {
    resetProduct.setAttribute(
      "aria-pressed",
      String(selectedProduct === "all"),
    );
    for (const button of business.querySelectorAll("button[data-product]")) {
      const id = button.dataset.product;
      button.setAttribute("aria-pressed", String(id === selectedProduct));
      const value = productCounts[id];
      button.querySelector("strong").textContent = Number.isInteger(value)
        ? String(value)
        : t("לא זמין", "Unavailable");
      button.querySelector("strong").classList.toggle("platform-admin-unavailable", !Number.isInteger(value));
      button.setAttribute(
        "aria-label",
        `${nameFor(id)} · ${Number.isInteger(value) ? value : t("לא זמין", "Unavailable")} ${t("חשבונות עם גישה", "provisioned accounts")}`,
      );
    }
    if (selected === "organizations") {
      listHeading.textContent = t("ארגוני הפלטפורמה", "Platform organizations") + (selectedProduct === "all" ? "" : " · " + nameFor(selectedProduct));
    } else if (selectedProduct === "all") {
      listHeading.textContent = t("משתמשי הפלטפורמה", "Platform accounts");
    } else {
      const name = element("bdi", nameFor(selectedProduct));
      name.dir = "ltr";
      listHeading.replaceChildren(
        document.createTextNode(t("חשבונות", "Accounts") + " · "),
        name,
      );
    }
    for (const button of filters.children) {
      if (!["all", "organizations"].includes(button.dataset.role))
        button.textContent = `${nameFor(selectedProduct)} ${button.dataset.role === "admin" ? "Admins" : "Users"}`;
    }
  }

  function organizationCard(organization) {
    const card = element("article", null, "platform-admin-organization");
    const artwork = element("span", "", "platform-admin-organization-icon");
    artwork.setAttribute("aria-hidden", "true");
    artwork.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 21V4h10v17M14 10h6v11M2 21h20M7 8h4M7 12h4M7 16h4M17 14h1M17 18h1"/></svg>';
    const identity=element("div");identity.append(element("h4",organization.name),element("small",t("ארגון", "Organization")));
    const products=element("div",null,"platform-admin-organization-products");
    const state = value => ({active:t("פעיל","Active"),pending:t("ממתין","Pending"),blocked:t("חסום","Blocked"),expired:t("פג תוקף","Expired")})[value] || t("לא זמין","Unavailable");
    for(const [id,value] of Object.entries(organization.products)) products.append(element("span", `${nameFor(id)} · ${state(value)}`));
    card.append(artwork,identity,element("span",state(organization.status),"platform-admin-organization-status"),products);
    return card;
  }

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
    const exempt = person.billingExempt === true || (person.products.host?.role === "admin" && person.products.host?.state === "active");
    const total = exempt ? t("ללא עלות · WIFIGATE Admin", "Free · WIFIGATE Admin") :
      selectedProduct === "all"
        ? monthlyTotal(person.products, language)
        : formatMoney(
            monthlyEstimate(person.products[selectedProduct])?.monthlyCents,
            monthlyEstimate(person.products[selectedProduct])?.currency,
            language,
          );
    const price = element("span", null, "platform-admin-person-price");
    const value = element(
      "strong",
      person.identityStatus === "verified" ? total : t("לא זמין", "Unavailable"),
    );
    value.dir = "auto";
    price.append(element("small", t("אומדן לחודש", "Monthly estimate")), value);
    const chevron = element("span", "⌄", "platform-admin-chevron");
    chevron.setAttribute("aria-hidden", "true");
    summary.append(avatar, identity, badge, price);
    if (deletions) {
      const remove = element("button", null, "platform-admin-delete");
      remove.type = "button";
      const self = person.email.toLowerCase() === user.email?.toLowerCase();
      remove.disabled = self;
      remove.setAttribute("aria-label", t("מחיקת חשבון לצמיתות: ", "Permanently delete account: ") + person.email);
      remove.title = self ? t("אי אפשר למחוק את החשבון שממנו אתם מנהלים", "You cannot delete your own administrator account here") : t("מחיקת חשבון לצמיתות", "Permanently delete account");
      remove.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18M9 6V4h6v2M5 6l1 15h12l1-15M10 10v7m4-7v7"/></svg>';
      remove.addEventListener("click", event => {event.preventDefault();event.stopPropagation();if (!self) deletions.open(person);});
      summary.append(remove);
    }
    summary.append(chevron);
    card.append(summary);
    const content = element("div", null, "platform-admin-person-content");
    card.append(content);
    if (actions) {
      const controls = element("div", null, "platform-admin-person-actions");
      if (person.role === "admin")
        controls.append(
          element(
            "small",
            t(
              "הרשאות מנהלים מוגנות מפעולות למסלול יחיד.",
              "Administrator roles are protected from single-product actions.",
            ),
          ),
        );
      else {
        const remove = element(
          "button",
          t("הסרה ממסלול…", "Remove product access…"),
          "platform-admin-remove",
        );
        remove.type = "button";
        remove.disabled =
          person.email.toLowerCase() === user.email?.toLowerCase();
        remove.addEventListener("click", () =>
          actions.remove(person, selectedProduct),
        );
        controls.append(remove);
      }
      content.append(controls);
    }
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
    for (const id of selectedProduct === "all"
      ? ["host", "pay", "manager"]
      : [selectedProduct]) {
      const plan = person.products[id];
      const estimate = monthlyEstimate({ ...plan, billingExempt: exempt });
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
        estimate ? String(estimate.physicalGates) : t("לא זמין", "Unavailable"),
      );
      quantity.dataset.label = t("שערים לחיוב", "Billable physical gates");
      row.append(quantity);
      const amount = element(
        "td",
        exempt ? t("ללא עלות", "Free") : formatMoney(estimate?.monthlyCents, estimate?.currency, language),
      );
      amount.dataset.label = t("אומדן חודשי", "Monthly estimate");
      amount.dir = "auto";
      row.append(amount);
    }
    tableWrap.append(table);
    content.prepend(tableWrap);
    return card;
  }

  function renderCounts(values = {}) {
    counts.replaceChildren(
      ...[
        [`${nameFor(selectedProduct)} Admins`, values.admins],
        [`${nameFor(selectedProduct)} Users`, values.users],
        [t("סה״כ חשבונות", "Total accounts"), values.total],
      ].map(([label, count]) => {
        const tile = element("div");
        tile.append(
          element("span", label),
          element("strong", String(count ?? t("לא זמין", "Unavailable")), count == null ? "platform-admin-unavailable" : null),
        );
        return tile;
      }),
    );
  }

  async function loadFinancials() {
    const epoch = ++financialGeneration;
    revenue.setAttribute("aria-busy", "true");
    revenueValue.textContent = t("לא זמין", "Unavailable");
    revenueValue.classList.add("platform-admin-unavailable");
    revenueStatus.textContent = t(
      "מחשב אומדן לכל החשבונות בסינון…",
      "Calculating the estimate for every matching account…",
    );
    try {
      const data = await getPlatformDirectoryFinancials(
        user,
        selectedProduct,
        selected,
      );
      if (closed || epoch !== financialGeneration) return;
      const total =
        data.totals
          .map((value) =>
            formatMoney(value.amountCents, value.currency, language),
          )
          .join(" + ") || formatMoney(0, "USD", language);
      const policyReady = data.billingPolicy === "platform-admin-exempt-v1";
      revenueValue.textContent = data.complete && policyReady ? total : t("לא זמין", "Unavailable");
      revenueValue.classList.toggle("platform-admin-unavailable", !data.complete || !policyReady);
      revenueStatus.textContent = !policyReady
        ? t("אומדן ההכנסות ממתין לעדכון חישוב הפטור למנהלי WIFIGATE בשרת.", "The revenue estimate awaits the server update excluding WIFIGATE administrator subscriptions.")
        : data.unknownAccounts
        ? t(
            `סכום ידוע: ${total}. חסרים נתונים עבור ${data.unknownAccounts} חשבונות.`,
            `Known amount: ${total}. Data is missing for ${data.unknownAccounts} accounts.`,
          )
        : selectedProduct === "pay"
          ? t(
              "נתוני הכנסות Pay אינם זמינים כרגע.",
              "Pay revenue data is currently unavailable.",
            )
          : t(
              "אומדן לחודש מלא לפני מס עבור Host ו־Manager, לפי הסינון הנוכחי. הכנסות Pay וגבייה בפועל אינן כלולות.",
              "Full-month estimate before tax for Host and Manager, matching the current filters. Pay revenue and collected payments are excluded.",
            );
    } catch {
      if (!closed && epoch === financialGeneration)
        revenueStatus.textContent = t(
          "אומדן ההכנסות אינו זמין כרגע. אפשר לנסות לרענן.",
          "The revenue estimate is currently unavailable. Try refreshing.",
        );
    } finally {
      if (!closed && epoch === financialGeneration)
        revenue.setAttribute("aria-busy", "false");
    }
  }

  async function load(append = false) {
    const epoch = ++generation;
    root.setAttribute("aria-busy", "true");
    renderProductFilters();
    refresh.disabled = true;
    if (!append) {
      rows.replaceChildren();
      renderCounts();
      revenue.hidden = selected === "organizations";
      hint.hidden = selected === "organizations";
      footnote.hidden = selected === "organizations";
      listToolbar.querySelector(".platform-admin-invite")?.toggleAttribute("hidden", selected === "organizations");
      if (product === "all" && selected !== "organizations") void loadFinancials();
      else financialGeneration++;
      next = null;
    }
    more.hidden = true;
    status.textContent = selected === "organizations" ? t("טוען ארגונים…", "Loading organizations…") : t("טוען משתמשים ותוכניות…", "Loading people and plans…");
    for (const button of filters.children)
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.role === selected),
      );
    try {
      const data = await getPlatformDirectory(
        user,
        selected === "organizations" ? "all" : selected,
        append ? next : undefined,
        selectedProduct,
      );
      if (closed || epoch !== generation) return;
      if (data.productCounts) {
        productCounts = data.productCounts;
        renderProductFilters();
      }
      if (!Object.keys(productCounts).length && selectedProduct !== "all") {
        const overview = await getPlatformDirectory(user, "all", undefined, "all");
        if (closed || epoch !== generation) return;
        productCounts = overview.productCounts ?? {};
        renderProductFilters();
      }
      renderCounts(data.counts);
      if (selected === "organizations") {
        const organizations = await getPlatformOrganizationOverview(user, selectedProduct);
        if (closed || epoch !== generation) return;
        rows.append(...organizations.items.map(organizationCard));
        more.hidden = true;
        status.textContent = organizations.items.length ? (organizations.items.length === 1 ? t("ארגון אחד בסינון הנבחר", "1 organization in this selection") : t(`${organizations.items.length} ארגונים בסינון הנבחר`, `${organizations.items.length} organizations in this selection`)) : t("לא נמצאו ארגונים במסלול שנבחר.", "No organizations found for this product.");
        return;
      }
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
      financialGeneration++;
      actions?.close();
      deletions?.close();
      root.replaceChildren();
      root.hidden = true;
    },
  };
}
