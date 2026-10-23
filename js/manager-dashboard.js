import { placeManagerActions } from "./manager-action-layout.js";
import { parseManagerCsv, encodeManagerCsv } from "./manager-csv.js";
import { managerRequest } from "./api/index.js";
import { ManagerConnection } from "./manager-connection.js";
import { createManagerExamples } from "./manager-examples.js";

const BASE = "/api/v1/manager";
const node = (tag, text, cls) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (cls) el.className = cls;
  return el;
};
const tables = {
  users: ["ADMIN_LIST_USERS", "items"],
  admins: ["ADMIN_LIST_ADMINS", "items"],
  events: ["ADMIN_LIST_EVENTS", "items"],
  history: ["ADMIN_LIST_HISTORY", "items"],
  rf: ["ADMIN_RF_GET", null],
  auto: ["ADMIN_GET_AUTO_OPEN_CONFIG", null],
  settings: ["ADMIN_GET_GATE_CONFIG", null],
  system: ["ADMIN_GET_STORAGE_HEALTH", null],
};
export function createManagerDashboard({
  root,
  user,
  language = "en",
  ensureRecent: verifyRecent = async () => {},
  api: customApi,
  Connection = ManagerConnection,
  onProfile = () => {},
}) {
  const he = language === "he",
    t = (h, e) => (he ? h : e);
  const api =
    customApi ??
    ((path, method = "GET", body) =>
      managerRequest(user, BASE + path, method, body));
  let generation = 0,
    closed = false,
    profile,
    scope = null,
    systems = [],
    connection,
    currentSystem,
    currentGate,
    currentTab = "overview",
    currentRows = [],
    currentData,
    cursor = null,
    currentView = "";
  const shell = node("div", undefined, "manager-shell"),
    nav = node("nav", undefined, "manager-nav"),
    main = node("div", undefined, "manager-main");
  nav.setAttribute("aria-label", t("ניווט Manager", "Manager navigation"));
  const title = node("p", t("סביבת עבודה", "Workspace"), "manager-nav-title"),
    status = node("p", "", "manager-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const hero = node("section", undefined, "manager-hero");
  hero.append(
    node("small", t("ניהול מערכות וארגונים", "SYSTEMS & ORGANIZATIONS")),
    node("h2", t("כל המערכות. מקום אחד.", "Your systems. One workspace.")),
    node(
      "p",
      t(
        "נתוני המערכת נשארים בשער. מתחברים לניהול רק כשצריך.",
        "System data stays on the gate. Connect for management only when needed.",
      ),
    ),
  );
  const metrics = node("div", undefined, "manager-metrics"),
    view = node("section", undefined, "manager-view");
  const platformHeader = node("section", undefined, "manager-platform-header");
  platformHeader.hidden = true;
  main.append(hero, metrics, status, platformHeader, view);
  nav.append(title);
  shell.append(nav, main);
  root.replaceChildren(shell);
  const examples = createManagerExamples({
    language,
    onOpen: openExample,
    onOpenOrganization: openExampleOrganization,
  });
  const say = (text, error = false) => {
    status.textContent = text;
    status.dataset.state = error ? "error" : "ready";
  };
  const errorText = (error) =>
    ({
      APP_CHECK_UNCONFIGURED: t(
        "בדיקת תקינות האתר דורשת הגדרה לפני הפעלת Manager.",
        "Site integrity must be configured before Manager can run.",
      ),
      TOTP_REQUIRED: t(
        "נדרש אימות באפליקציית האימות.",
        "Authenticator verification required.",
      ),
      RECENT_REAUTH_REQUIRED: t(
        "יש לאמת את הזהות מחדש לפני הפעולה.",
        "Verify your identity again before this action.",
      ),
      ORGANIZATION_HAS_SYSTEMS: t(
        "יש להסיר את שיוך המערכות לפני הסרת הארגון.",
        "Unassign linked systems before removing the organization.",
      ),
      ORGANIZATION_HAS_MEMBERS: t(
        "יש לבטל את מינויי מנהלי הארגון לפני הסרתו.",
        "Revoke organization administrator appointments before removing the organization.",
      ),
      SELF_CHANGE_FORBIDDEN: t(
        "לא ניתן לבטל את הרשאת המנהל של עצמכם.",
        "You cannot revoke your own administrator access.",
      ),
      CONFLICT: t(
        "הנתונים השתנו או שהחשבון מחזיק בתפקיד אחר. רעננו ובדקו לפני ניסיון נוסף.",
        "Data changed or the account holds another role. Refresh and review before retrying.",
      ),
      NO_COMMUNICATION: t(
        "אין תקשורת עם המערכת.",
        "No communication with the system.",
      ),
      BUSY: t(
        "המערכת בשימוש. נסו שוב לאחר סיום הניהול הנוכחי.",
        "The system is in use. Try after the current session ends.",
      ),
      DISCONNECTED: t(
        "החיבור נותק. אם נשלחה פעולה, בדקו היסטוריה לפני ניסיון נוסף.",
        "Disconnected. If an action was sent, check history before trying again.",
      ),
      RESPONSE_TIMEOUT: t(
        "תוצאת הפעולה אינה ידועה. בדקו היסטוריה לפני ניסיון נוסף.",
        "Outcome unknown. Check history before trying again.",
      ),
    })[error.code ?? error.message] ??
    t(
      "לא ניתן להשלים את הפעולה. בדקו את החיבור וההרשאות.",
      "Unable to complete this action. Check connection and permissions.",
    );
  const button = (label, action, primary = false) => {
    const b = node(
      "button",
      label,
      "manager-button" + (primary ? " primary" : ""),
    );
    b.type = "button";
    b.addEventListener("click", () => void task(action, b));
    return b;
  };
  async function task(action, b) {
    if (b) b.disabled = true;
    try {
      await action();
    } catch (error) {
      if (!closed && error.message !== "CANCELLED") say(errorText(error), true);
    } finally {
      if (b) b.disabled = false;
    }
  }
  async function ensureRecent() {
    const epoch = generation;
    await verifyRecent();
    if (closed || epoch !== generation) throw new Error("CANCELLED");
  }
  function form(fields, label, submit) {
    const f = node("form", undefined, "manager-form"),
      inputs = {};
    for (const [key, title, type = "text"] of fields) {
      const l = node("label", title),
        input = node(type === "textarea" ? "textarea" : "input");
      if (type !== "textarea") input.type = type;
      input.name = key;
      input.required = true;
      input.maxLength =
        type === "textarea" ? 50000 : type === "email" ? 254 : 100;
      l.append(input);
      f.append(l);
      inputs[key] = input;
    }
    const b = node("button", label, "manager-button primary");
    b.type = "submit";
    f.append(b);
    f.addEventListener("submit", (event) => {
      event.preventDefault();
      void task(() => submit(Object.fromEntries(new FormData(f)), f), b);
    });
    return f;
  }
  function stop() {
    examples.closeView();
    view.classList.remove("manager-example-workspace");
    generation++;
    connection?.close();
    connection = null;
    currentRows = [];
    currentData = undefined;
    cursor = null;
  }
  function renderMetrics() {
    metrics.hidden = profile?.role === "admin";
    metrics.replaceChildren();
    for (const [label, value] of [
      [
        t("מערכות מוצגות", "Systems shown"),
        systems.filter((s) => s.status === "active").length,
      ],
      [
        t("שערים פיזיים ייחודיים", "Unique physical gates"),
        new Set(
          systems
            .filter((s) => s.status === "active")
            .flatMap((s) => s.systemIds),
        ).size,
      ],
      [
        t("ארגונים מורשים", "Authorized organizations"),
        profile?.organizations?.length ?? 0,
      ],
    ]) {
      const box = node("div", undefined, "manager-metric");
      box.append(node("span", label), node("b", String(value)));
      metrics.append(box);
    }
  }
  function renderNav() {
    nav.replaceChildren(title);
    platformHeader.replaceChildren();
    platformHeader.hidden = true;
    if (profile.account || profile.role === "admin") {
      const b = button(t("המערכות שלי", "My systems"), () => showSystems(null));
      if (!scope && ["systems", "example-system"].includes(currentView))
        b.setAttribute("aria-current", "page");
      nav.append(b);
    }
    const myOrganizations = button(t("הארגונים שלי", "My organizations"), () =>
      showOrganizations(true),
    );
    if (
      ["my-organizations", "example-organization"].includes(currentView) ||
      (currentView === "systems" && scope)
    )
      myOrganizations.setAttribute("aria-current", "page");
    nav.append(myOrganizations);
    if (profile.organizations?.length) {
      const select = node("select");
      select.setAttribute(
        "aria-label",
        t("בחירת ארגון", "Choose organization"),
      );
      select.append(new Option(t("בחרו ארגון", "Choose organization"), ""));
      for (const org of profile.organizations)
        select.append(new Option(org.name, org.id));
      select.value = scope ?? "";
      select.addEventListener("change", () => {
        if (select.value) void task(() => showSystems(select.value));
      });
      nav.append(select);
    }
    if (profile.role !== "admin")
      nav.append(button(t("הזמנות", "Invitations"), showInvitations));
    if (scope)
      nav.append(
        button(t("מנהלי ארגון", "Organization administrators"), showMembers),
      );
    if (profile.role === "admin") {
      const platform = node("section", undefined, "manager-platform-nav");
      const platformViews = [
        "overview",
        "admin",
        "user",
        "organization-admin",
        "organizations",
        "platform-systems",
      ];
      const platformButton = button(
        t("ניהול פלטפורמה", "Platform management"),
        showOverview,
      );
      platformButton.classList.add("manager-platform-entry");
      platformButton.replaceChildren(
        node("span", t("ניהול פלטפורמה", "Platform management")),
        node("small", "WIFIGATE Manager admin"),
      );
      platform.append(platformButton);
      if (platformViews.includes(currentView)) {
        platformHeader.hidden = false;
        platformHeader.append(node("span", t("ניהול פלטפורמה", "Platform management"), "manager-platform-eyebrow"));
        const parentTitle = node("h2", undefined, "manager-platform-title");
        const parent = button("WIFIGATE Manager admin platform", showOverview);
        parent.classList.add("manager-platform-parent");
        if (currentView === "overview") parent.setAttribute("aria-current", "page");
        parentTitle.append(parent);
        platformHeader.append(parentTitle);
        const tabs = node("nav", undefined, "manager-platform-tabs");
        tabs.setAttribute("aria-label", t("ניווט ניהול פלטפורמה", "Platform management navigation"));
        for (const [key, label, action] of [
          ["admin", "WIFIGATE Manager admin", () => showDirectory("admin")],
          ["user", "WIFIGATE Manager user", () => showAccounts()],
          [
            "organization-admin",
            "WIFIGATE Manager organization admin",
            () => showDirectory("organization-admin"),
          ],
          ["organizations", t("ארגונים", "Organizations"), showOrganizations],
        ]) {
          const b = button(label, action);
          if (
            currentView === key ||
            (currentView === "platform-systems" && key === "user")
          )
            b.setAttribute("aria-current", "page");
          tabs.append(b);
        }
        platformHeader.append(tabs);
        requestAnimationFrame(() => {
          if (!tabs.isConnected) return;
          const selected = tabs.querySelector('[aria-current="page"]');
          if (!selected) return;
          const bar = tabs.getBoundingClientRect(),
            item = selected.getBoundingClientRect();
          if (item.left < bar.left)
            tabs.scrollBy({ left: item.left - bar.left - 6 });
          else if (item.right > bar.right)
            tabs.scrollBy({ left: item.right - bar.right + 6 });
        });
      }
      nav.append(platform);
    }
  }
  function openExample(system) {
    stop();
    scope = null;
    currentView = "example-system";
    renderNav();
    say("");
    examples.renderWorkspace(view, system, {
      onBack: () => void task(() => showSystems(null)),
    });
  }
  function openExampleOrganization() {
    stop();
    scope = null;
    currentView = "example-organization";
    renderNav();
    say("");
    examples.renderOrganization(view, {
      onBack: () => void task(() => showOrganizations(true)),
    });
  }
  function roleName(role) {
    return (
      {
        admin: "WIFIGATE Manager admin",
        user: "WIFIGATE Manager user",
        "organization-admin": "WIFIGATE Manager organization admin",
      }[role] ?? t("ממתין להרשאה", "Access pending")
    );
  }
  function beginView(key) {
    stop();
    scope = null;
    currentView = key;
    renderNav();
    say("");
    view.replaceChildren();
  }
  function orgPath(id) {
    return `${profile.role === "admin" ? "/admin" : ""}/organizations/${encodeURIComponent(id)}`;
  }
  async function pagedView(path, container, render) {
    const epoch = generation;
    let next = null;
    const more = button(t("הצגת עוד", "Show more"), load);
    const seen = new Set();
    async function load() {
      const result = await api(
        path +
          (path.includes("?") ? "&" : "?") +
          "limit=25" +
          (next ? "&cursor=" + encodeURIComponent(next) : ""),
      );
      if (closed || epoch !== generation) return;
      more.remove();
      for (const row of result.items) container.append(render(row));
      next = result.nextCursor;
      if (next && seen.has(next)) throw new Error("LIST_LIMIT");
      if (next) {
        seen.add(next);
        view.append(more);
      }
      if (!container.childElementCount)
        say(t("אין רשומות להצגה.", "No records to display."));
    }
    await load();
  }
  async function showOverview() {
    beginView("overview");
    const epoch = generation;
    view.append(node("h3", t("סקירת פלטפורמה", "Platform overview")));
    view.append(
      node(
        "p",
        t(
          "ניהול הרשאות, משתמשים וארגונים — במקום אחד.",
          "Manage access, people and organizations in one place.",
        ),
        "manager-view-description",
      ),
    );
    const totals = await api("/admin/overview");
    if (closed || epoch !== generation) return;
    const grid = node("div", undefined, "manager-overview-grid");
    for (const [key, label, action] of [
      ["admins", "WIFIGATE Manager admin", () => showDirectory("admin")],
      ["users", "WIFIGATE Manager user", () => showAccounts()],
      [
        "organizationAdmins",
        "WIFIGATE Manager organization admin",
        () => showDirectory("organization-admin"),
      ],
      ["organizations", t("ארגונים", "Organizations"), showOrganizations],
    ]) {
      const card = node(
        "article",
        undefined,
        "manager-card manager-overview-card",
      );
      card.append(
        node("span", label),
        node("strong", String(totals[key] ?? 0)),
        button(t("הצגה וניהול", "View and manage"), action),
      );
      grid.append(card);
    }
    view.append(
      grid,
      node(
        "p",
        t(
          "הספירות מציגות רשומות פעילות. מנהלי ארגונים נספרים לפי מינויים לארגון; אותו אדם עשוי להחזיק יותר ממינוי אחד.",
          "Counts show active records. Organization administrators are counted by organization appointments; one person may hold multiple appointments.",
        ),
        "manager-note",
      ),
    );
  }
  async function showDirectory(role, status = "active") {
    beginView(role);
    const epoch = generation;
    view.append(node("h3", roleName(role)));
    const filters = node("div", undefined, "manager-toolbar");
    for (const state of ["active", "blocked"])
      filters.append(
        button(
          state === "active"
            ? t("פעילים", "Active")
            : t("גישה שבוטלה", "Revoked access"),
          () => showDirectory(role, state),
        ),
      );
    view.append(filters);
    const rows = node("div", undefined, "manager-directory");
    view.append(rows);
    await pagedView(
      `/admin/directory?role=${role}&status=${status}`,
      rows,
      (row) => {
        const card = node(
          "article",
          undefined,
          "manager-card manager-directory-row",
        );
        const identity = node("div");
        identity.append(
          node("strong", row.email),
          node("span", roleName(row.role), "manager-muted"),
        );
        if (row.organization)
          identity.append(
            node(
              "span",
              `${t("ארגון", "Organization")}: ${row.organization.name} · ${row.organization.status}`,
              "manager-muted",
            ),
          );
        card.append(identity);
        if (role === "organization-admin")
          card.append(
            button(t("ניהול המינוי", "Manage appointment"), () => {
              scope = row.organization.id;
              renderNav();
              return showMembers();
            }),
          );
        else if (row.uid !== user.uid)
          card.append(
            button(
              status === "active"
                ? t("ביטול גישה", "Revoke access")
                : t("הפעלת גישה", "Enable access"),
              async () => {
                if (
                  !confirm(
                    t(
                      `לעדכן את הגישה של ${row.email}?`,
                      `Change access for ${row.email}?`,
                    ),
                  )
                )
                  return;
                await ensureRecent();
                await api("/admin/access", "POST", {
                  email: row.email,
                  role: "admin",
                  status: status === "active" ? "blocked" : "active",
                });
                await showDirectory(role, status);
              },
            ),
          );
        return card;
      },
    );
    if (closed || epoch !== generation) return;
    if (role === "admin")
      view.append(
        form(
          [
            [
              "email",
              t("אימייל מנהל מאומת", "Verified administrator email"),
              "email",
            ],
          ],
          t("הוספת Manager admin", "Add Manager admin"),
          async (values) => {
            await ensureRecent();
            await api("/admin/access", "POST", {
              ...values,
              role: "admin",
              status: "active",
            });
            await showDirectory(role);
          },
        ),
      );
    else
      view.append(
        button(
          t(
            "הוספת מנהל ארגון דרך ארגון",
            "Add an administrator through an organization",
          ),
          showOrganizations,
        ),
      );
    placeManagerActions(view, language);
  }
  async function refreshProfile() {
    profile = await api("/me");
    if (closed) return;
    onProfile(profile);
    hero.hidden = profile.role === "admin";
    renderNav();
    renderMetrics();
  }
  async function listAll(path) {
    const rows = [];
    const epoch = generation,
      seen = new Set();
    let next = null;
    do {
      if (closed || epoch !== generation) throw new Error("CANCELLED");
      const r = await api(
        path +
          (path.includes("?") ? "&" : "?") +
          "limit=100" +
          (next ? "&cursor=" + encodeURIComponent(next) : ""),
      ).catch((error) => {
        if (closed || epoch !== generation) throw new Error("CANCELLED");
        throw error;
      });
      if (closed || epoch !== generation) throw new Error("CANCELLED");
      rows.push(...r.items);
      next = r.nextCursor;
      if (next && seen.has(next)) throw new Error("LIST_LIMIT");
      if (next) seen.add(next);
      if (rows.length > 10000) throw new Error("LIST_LIMIT");
    } while (next);
    return rows;
  }
  async function showSystems(orgId, operatorAccount = null) {
    stop();
    currentView = operatorAccount ? "platform-systems" : "systems";
    scope = orgId;
    renderNav();
    say(t("טוען מערכות…", "Loading systems…"));
    const epoch = generation;
    const rows =
      !operatorAccount && !scope && !profile.account
        ? []
        : await listAll(
            operatorAccount
              ? operatorAccount.orgId
                ? `/admin/organizations/${encodeURIComponent(operatorAccount.orgId)}/systems`
                : `/admin/accounts/${encodeURIComponent(operatorAccount.id)}/systems`
              : scope
                ? `/organizations/${encodeURIComponent(scope)}/systems`
                : "/systems",
          );
    if (closed || epoch !== generation) return;
    systems = rows.filter((s) => s.status === "active");
    renderMetrics();
    view.replaceChildren();
    const bar = node("div", undefined, "manager-toolbar");
    bar.append(
      node(
        "h3",
        operatorAccount
          ? operatorAccount.email
          : scope
            ? profile.organizations.find((o) => o.id === scope)?.name
            : t("המערכות שלי", "My systems"),
      ),
      button(t("רענון", "Refresh"), () => showSystems(scope, operatorAccount)),
    );
    view.append(bar);
    view.append(
      node(
        "p",
        t(
          "להוספת מערכת: פתחו באפליקציה For Business › WIFIGATE Manager וייבאו מערכת שאתם מנהלים בה.",
          "To add a system, open For Business › WIFIGATE Manager in the app and import a system you administer.",
        ),
        "manager-note",
      ),
    );
    if (!systems.length)
      view.append(
        node(
          "div",
          t(
            "אין מערכות להצגה באזור זה.",
            "There are no systems in this area yet.",
          ),
          "manager-empty",
        ),
      );
    const grid = node("div", undefined, "manager-grid");
    for (const s of systems) {
      const card = node("article", undefined, "manager-card manager-system");
      const icon = node("span", undefined, "manager-icon");
      const drawing = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      drawing.setAttribute("viewBox", "0 0 24 24");
      drawing.setAttribute("fill", "none");
      drawing.setAttribute("stroke", "currentColor");
      drawing.setAttribute("stroke-width", "1.7");
      drawing.setAttribute("stroke-linecap", "round");
      drawing.setAttribute("stroke-linejoin", "round");
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      path.setAttribute(
        "d",
        {
          group: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
          "dual-control": "m8 7-5 5 5 5M3 12h18m-5-5 5 5-5 5",
          gate: "M4 21V4h16v17M8 21V9h8v12M8 13h8M8 17h8M2 21h20",
        }[s.type] ?? "M4 21V4h16v17M2 21h20",
      );
      drawing.append(path);
      icon.append(drawing);
      icon.setAttribute("aria-hidden", "true");
      const count = new Set(s.systemIds).size;
      const typeLabel =
        {
          gate: t("שער", "Gate"),
          "dual-control": t("שליטה כפולה", "Dual Control"),
          group: t("קבוצה", "Group"),
        }[s.type] ?? t("מערכת", "System");
      card.append(
        icon,
        node("h4", s.name),
        node(
          "span",
          `${typeLabel} · ${count} ${count === 1 ? t("שער", "gate") : t("שערים", "gates")}`,
          "manager-muted",
        ),
      );
      const actions = node("div", undefined, "manager-system-actions");
      if (!operatorAccount)
        actions.append(
          button(
            t("פתיחת סביבת ניהול", "Open workspace"),
            () => openSystem(s),
            true,
          ),
        );
      if (profile.account)
        actions.append(
          button(t("שיוך לארגון", "Assign organization"), () =>
            assignSystem(s),
          ),
        );
      if (profile.account || operatorAccount) {
        actions.append(
          button(t("ניתוק מ־Manager", "Disconnect from Manager"), async () => {
            if (
              !confirm(
                t(
                  `לנתק את ${s.name} מ־Manager? הניהול המקומי ב־Bluetooth יישאר פעיל. שערים שמשויכים גם למערכות נוספות יישארו מחוברים דרכן.`,
                  `Disconnect ${s.name} from Manager? Local Bluetooth management stays available. Gates also used by other systems remain connected through them.`,
                ),
              )
            )
              return;
            await ensureRecent();
            const result = await api(`/systems/${s.id}/remove`, "POST", {
              expectedVersion: s.version,
            });
            await showSystems(scope, operatorAccount);
            const messages = [
              result.networkStopPending?.length
                ? t(
                    "בקשת הניתוק נשמרה. השער יכבה Wi-Fi בבדיקה הבאה כשיש תקשורת; הניהול המקומי נשאר פעיל.",
                    "Disconnect request saved. The gate will switch Wi-Fi off on its next reachable poll; local management stays available.",
                  )
                : t(
                    "המערכת נותקה. הניהול המקומי נשאר פעיל.",
                    "System disconnected. Local management stays available.",
                  ),
            ];
            if (result.retainedSharedGates?.length)
              messages.push(
                t(
                  "שערים משותפים ממשיכים לפעול במערכות האחרות.",
                  "Shared gates remain available through other systems.",
                ),
              );
            say(messages.join(" "));
          }),
        );
      }
      card.append(actions);
      grid.append(card);
    }
    view.append(grid);
    if (!scope && !operatorAccount) examples.renderCards(view);
    say("");
  }
  async function assignSystem(system) {
    stop();
    view.replaceChildren(
      node("h3", t("שיוך מערכת לארגון", "Assign system to organization")),
    );
    const f = node("form", undefined, "manager-form"),
      label = node("label", t("ארגון", "Organization")),
      select = node("select");
    select.append(new Option(t("המערכות שלי בלבד", "My systems only"), ""));
    for (const org of profile.organizations)
      select.append(new Option(org.name, org.id));
    select.value = system.orgId ?? "";
    label.append(select);
    f.append(label);
    const b = button(
      t("שמירה", "Save"),
      async () => {
        await ensureRecent();
        await api(`/systems/${system.id}/assign`, "POST", {
          orgId: select.value || null,
          expectedVersion: system.version,
        });
        await showSystems(scope);
      },
      true,
    );
    f.append(
      b,
      button(t("ביטול", "Cancel"), () => showSystems(scope)),
    );
    view.append(f);
  }
  async function showOrganizations(personal = false) {
    beginView(
      personal || profile.role !== "admin"
        ? "my-organizations"
        : "organizations",
    );
    const epoch = generation;
    view.append(
      node(
        "h3",
        personal || profile.role !== "admin"
          ? t("הארגונים שלי", "My organizations")
          : t("ניהול ארגונים", "Organization management"),
      ),
    );
    const columns = node("div", undefined, "manager-org-columns");
    view.append(columns);
    const operator = profile.role === "admin" && !personal;
    await pagedView(
      operator ? "/admin/organizations" : "/organizations",
      columns,
      (org) => {
        const card = node(
          "article",
          undefined,
          "manager-card manager-org-column",
        );
        card.dataset.organization = org.id;
        card.append(node("h4", org.name));
        const owner = node("section", undefined, "manager-org-owner");
        owner.append(
          node("small", t("בעל הארגון", "Organization owner")),
          node("strong", org.owner?.email ?? t("לא זמין", "Unavailable")),
          node("span", roleName(org.owner?.role), "manager-role-badge"),
        );
        card.append(owner);
        const members = node(
          "section",
          undefined,
          "manager-org-administrators",
        );
        members.append(
          node("h5", t("מנהלי הארגון", "Organization administrators")),
        );
        if (!org.administrators.length)
          members.append(
            node(
              "p",
              t(
                "אין מנהלי ארגון נוספים.",
                "No additional organization administrators.",
              ),
              "manager-muted",
            ),
          );
        for (const member of org.administrators)
          members.append(node("p", member.email));
        if (org.administratorNextCursor)
          members.append(
            node(
              "p",
              t(
                "מנהלים נוספים מופיעים בניהול המינויים.",
                "More administrators are available in appointment management.",
              ),
              "manager-note",
            ),
          );
        card.append(members);
        const count = node("p", undefined, "manager-org-count");
        count.append(
          node("b", String(org.linkedSystemCount)),
          node("span", t("מערכות מקושרות", "Linked systems")),
        );
        card.append(count);
        const actions = node("div", undefined, "manager-org-actions");
        actions.append(
          button(t("מערכות הארגון", "Organization systems"), () =>
            showSystems(
              org.id,
              operator
                ? { id: org.owner?.id, email: org.name, orgId: org.id }
                : null,
            ),
          ),
        );
        actions.append(
          button(
            t("ניהול מנהלי הארגון", "Manage organization administrators"),
            () => {
              scope = org.id;
              renderNav();
              return showMembers();
            },
          ),
        );
        const owns = profile.organizations.some(
          (o) =>
            o.id === org.id &&
            (o.role === "owner" || (profile.account && !o.role)),
        );
        if (operator || owns)
          actions.append(
            button(t("הסרת ארגון", "Remove organization"), async () => {
              if (
                !confirm(
                  t(
                    'להסיר את הארגון "' +
                      org.name +
                      '" מ־Manager? יש לנתק שיוכי מערכות ומינויי מנהלים תחילה. ההיסטוריה נשמרת.',
                    'Remove organization "' +
                      org.name +
                      '" from Manager? Unassign systems and revoke administrator appointments first. History is retained.',
                  ),
                )
              )
                return;
              await ensureRecent();
              await api(orgPath(org.id) + "/archive", "POST", {
                name: org.name,
                expectedVersion: org.version,
              });
              await refreshProfile();
              await showOrganizations(personal);
            }),
          );
        card.append(actions);
        return card;
      },
    );
    if (closed || epoch !== generation) return;
    if (personal || profile.role !== "admin")
      examples.renderOrganizationCard(view);
    if (profile.account || operator)
      view.append(
        form(
          [
            ["name", t("שם ארגון חדש", "New organization name")],
            ...(operator
              ? [
                  [
                    "email",
                    t(
                      "אימייל בעל הארגון · Manager user",
                      "Organization owner email · Manager user",
                    ),
                    "email",
                  ],
                ]
              : []),
          ],
          t("יצירת ארגון", "Create organization"),
          async (values, f) => {
            f.dataset.requestId ??= crypto.randomUUID();
            await ensureRecent();
            await api(
              operator ? "/admin/organizations" : "/organizations",
              "POST",
              { ...values, requestId: f.dataset.requestId },
            );
            await refreshProfile();
            await showOrganizations(personal);
          },
        ),
      );
    placeManagerActions(view, language);
  }
  async function showInvitations() {
    stop();
    view.replaceChildren(
      node("h3", t("הזמנות לארגונים", "Organization invitations")),
    );
    const rows = await listAll("/invitations");
    if (!rows.length)
      view.append(
        node(
          "div",
          t("אין הזמנות ממתינות.", "No pending invitations."),
          "manager-empty",
        ),
      );
    for (const inv of rows) {
      const row = node("div", undefined, "manager-card manager-row");
      row.append(
        node("span", inv.email),
        button(
          t("קבלת הזמנה", "Accept invitation"),
          async () => {
            await ensureRecent();
            await api(`/invitations/${inv.id}/accept`, "POST", {});
            await refreshProfile();
            await showSystems(inv.orgId);
          },
          true,
        ),
      );
      view.append(row);
    }
  }
  async function showMembers() {
    if (!scope) return;
    stop();
    view.replaceChildren(
      node("h3", t("מנהלי הארגון", "Organization administrators")),
    );
    const canManage =
      profile.role === "admin" ||
      profile.organizations.some(
        (o) =>
          o.id === scope &&
          (o.role === "owner" || (profile.account && !o.role)),
      );
    const rows = await listAll(`${orgPath(scope)}/members`);
    for (const member of rows.filter((m) => m.status === "active")) {
      const row = node("div", undefined, "manager-card manager-row");
      row.append(node("span", member.email));
      if (canManage)
        row.append(
          button(t("ביטול גישה", "Revoke access"), async () => {
            if (
              !confirm(
                t("לבטל את הגישה לארגון?", "Revoke organization access?"),
              )
            )
              return;
            await ensureRecent();
            await api(
              `${orgPath(scope)}/members/${encodeURIComponent(member.uid)}/remove`,
              "POST",
              {},
            );
            await showMembers();
          }),
        );
      view.append(row);
    }
    if (canManage)
      view.append(
        form(
          [
            [
              "email",
              t("אימייל מנהל הארגון", "Organization administrator email"),
              "email",
            ],
          ],
          t("יצירת הזמנה", "Create invitation"),
          async (v, f) => {
            await ensureRecent();
            await api(`${orgPath(scope)}/invitations`, "POST", v);
            f.reset();
            say(
              t(
                "ההזמנה ממתינה בחשבון של כתובת האימייל שהוזנה.",
                "The invitation is waiting in the invited email account.",
              ),
            );
          },
        ),
      );
    placeManagerActions(view, language);
  }
  async function showAccounts(status = "active") {
    beginView("user");
    const epoch = generation;
    view.replaceChildren(
      node("h3", t("הפעלת חשבון לקוח", "Enable customer account")),
      node(
        "p",
        t(
          "גישה ניתנת במפורש. אין דרישת תשלום או כרטיס בשלב זה.",
          "Access is explicitly provisioned. No payment or card is required in this phase.",
        ),
        "manager-note",
      ),
    );
    const filters = node("div", undefined, "manager-row");
    filters.append(
      button(t("לקוחות פעילים", "Active customers"), () =>
        showAccounts("active"),
      ),
      button(t("לקוחות חסומים", "Blocked customers"), () =>
        showAccounts("blocked"),
      ),
    );
    view.append(filters);
    const accounts = await listAll(`/admin/accounts?status=${status}`);
    if (closed || epoch !== generation) return;
    for (const account of accounts) {
      const card = node("article", undefined, "manager-card manager-row");
      card.append(
        node("h4", account.email),
        button(t("מערכות הלקוח", "Customer systems"), () =>
          showSystems(null, account),
        ),
      );
      card.append(
        node("span", "WIFIGATE Manager user", "manager-role-badge"),
        button(
          status === "active"
            ? t("ביטול גישה", "Revoke access")
            : t("הפעלת גישה", "Enable access"),
          async () => {
            if (
              !confirm(
                t(
                  `לעדכן את הגישה של ${account.email}?`,
                  `Change access for ${account.email}?`,
                ),
              )
            )
              return;
            await ensureRecent();
            await api("/admin/accounts", "POST", {
              email: account.email,
              status: status === "active" ? "blocked" : "active",
            });
            await showAccounts(status);
          },
        ),
      );
      view.append(card);
    }
    if (!accounts.length)
      view.append(
        node(
          "p",
          t(
            "אין לקוחות להצגה במצב הזה.",
            "There are no customers with this status.",
          ),
          "manager-muted",
        ),
      );
    view.append(
      form(
        [["email", t("אימייל לקוח מאומת", "Verified customer email"), "email"]],
        t("הפעלת גישה", "Enable access"),
        async (v, f) => {
          await ensureRecent();
          await api("/admin/accounts", "POST", { ...v, status: "active" });
          f.reset();
          await showAccounts(status);
          say(t("חשבון הלקוח הופעל.", "Customer account enabled."));
        },
      ),
    );
    placeManagerActions(view, language);
  }
  async function openSystem(system) {
    stop();
    currentSystem = system;
    const epoch = generation;
    view.replaceChildren();
    const head = node("div", undefined, "manager-workspace-head");
    head.append(
      node("h3", system.name),
      button(t("סיום וחזרה", "End and return"), () => showSystems(scope)),
    );
    view.append(head);
    if (system.systemIds.length > 1) {
      const select = node("select", undefined, "manager-button");
      select.setAttribute("aria-label", t("בחירת שער", "Choose gate"));
      for (const id of system.systemIds) select.append(new Option(id, id));
      select.addEventListener(
        "change",
        () => void task(() => openGate(select.value)),
      );
      view.append(select);
    }
    const tabs = node("div", undefined, "manager-tabs"),
      content = node("div");
    tabs.id = "manager-tabs";
    content.id = "manager-content";
    view.append(tabs, content);
    await ensureRecent();
    if (epoch === generation) await openGate(system.systemIds[0]);
  }
  async function openGate(gate) {
    connection?.close();
    currentGate = gate;
    currentRows = [];
    cursor = null;
    const epoch = ++generation;
    const candidate = new Connection({
      api,
      user,
      onState: (state) => {
        if (epoch !== generation) return;
        if (state === "waiting")
          say(
            t(
              "ממתין לחיבור המערכת — עד כדקה ובנוסף זמן הקמת חיבור. אפשר לבטל.",
              "Waiting for the system — up to about a minute plus connection setup. You can cancel.",
            ),
          );
        else if (state === "connecting")
          say(
            t(
              "מקים ערוץ ניהול מאובטח…",
              "Establishing a secure management channel…",
            ),
          );
        else if (state === "active")
          say(t("מחובר · נתונים חיים מהשער", "Connected · live gate data"));
        else {
          currentRows = [];
          currentData = undefined;
          view.querySelector("#manager-content")?.replaceChildren();
          view.querySelector("#manager-tabs")?.replaceChildren();
          say(errorText(new Error(state)), true);
        }
      },
    });
    connection = candidate;
    try {
      await candidate.open(gate);
      if (epoch !== generation) {
        candidate.close();
        return;
      }
      renderTabs();
      await showTab("overview");
    } catch (error) {
      if (epoch === generation) {
        connection?.close();
        say(errorText(error), true);
      }
    }
  }
  const tabNames = {
    overview: ["סקירה ופתיחה", "Overview & open"],
    users: ["משתמשים", "Users"],
    admins: ["מנהלים", "Administrators"],
    guests: ["אורחים", "Guests"],
    auto: ["Auto Open", "Auto Open"],
    settings: ["הגדרות", "Settings"],
    events: ["אירועים", "Events"],
    history: ["היסטוריה", "History"],
    rf: ["שלטים", "RF remotes"],
    system: ["מערכת", "System"],
  };
  function renderTabs() {
    const tabs = view.querySelector("#manager-tabs");
    if (!tabs) return;
    tabs.replaceChildren();
    tabs.setAttribute("role", "tablist");
    for (const [id, label] of Object.entries(tabNames)) {
      const b = button(t(...label), () => showTab(id));
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(id === currentTab));
      b.dataset.tab = id;
      tabs.append(b);
    }
  }
  async function showTab(tab, more = false) {
    if (!connection?.session) throw new Error("DISCONNECTED");
    currentTab = tab;
    renderTabs();
    const content = view.querySelector("#manager-content");
    if (!content) return;
    content.replaceChildren();
    if (tab === "overview") {
      const source = connection,
        epoch = generation;
      const r = await source.command("ADMIN_GET_OVERVIEW");
      if (
        connection !== source ||
        generation !== epoch ||
        currentTab !== tab ||
        !source.session
      )
        throw new Error("CANCELLED");
      currentData = r.data;
      renderFacts(content, r.data);
      content.append(button(t("פתיחת שער", "Open gate"), openGateAction, true));
      placeManagerActions(content, language);
      return;
    }
    if (tab === "guests") {
      content.append(
        node(
          "p",
          t(
            "פעילות האורחים נקראת מהיסטוריית השער.",
            "Guest activity is read from gate history.",
          ),
          "manager-note",
        ),
      );
      await showRead(
        content,
        "ADMIN_LIST_HISTORY",
        { dayKey: null, page: { limit: 20, cursor: null } },
        "items",
        false,
      );
      return;
    }
    const [cmd, items] = tables[tab];
    let payload = {};
    if (["users", "admins", "history"].includes(tab))
      payload = {
        page: { limit: 20, cursor: more ? cursor : null },
        ...(tab === "history" ? { dayKey: null } : { query: "" }),
      };
    await showRead(content, cmd, payload, items, more);
    if (tab === "users" || tab === "admins") renderPeopleActions(content, tab);
    if (tab === "settings") renderSettings(content);
    if (tab === "events") renderEventActions(content);
    if (tab === "rf") renderRfActions(content);
    if (tab === "auto") renderAutoActions(content);
    placeManagerActions(content, language);
  }
  async function showRead(content, cmd, payload, key, more) {
    const source = connection,
      epoch = generation,
      tab = currentTab;
    const r = await source.command(cmd, payload);
    if (
      connection !== source ||
      generation !== epoch ||
      currentTab !== tab ||
      !source.session
    )
      throw new Error("CANCELLED");
    currentData = r.data;
    if (cmd === "ADMIN_LIST_EVENTS") {
      content.append(
        node(
          "p",
          `${r.data.items.length} ${t("אירועים מתוזמנים", "scheduled events")}`,
        ),
      );
      return;
    }
    if (cmd === "ADMIN_LIST_HISTORY" && Array.isArray(r.data.days)) {
      for (const [day, count] of r.data.days)
        content.append(
          button(`${day} · ${count}`, async () => {
            content.replaceChildren();
            content.append(
              button(t("חזרה לימים", "Back to days"), () =>
                showTab(currentTab),
              ),
            );
            await showRead(
              content,
              cmd,
              { dayKey: day, page: { limit: 20, cursor: null } },
              "items",
              false,
            );
          }),
        );
      if (!r.data.days.length)
        content.append(
          node(
            "p",
            t("אין היסטוריה זמינה בשער.", "No history available on the gate."),
          ),
        );
      if (r.data.page?.nextCursor)
        content.append(
          button(t("ימים נוספים", "More days"), async () => {
            await showRead(
              content,
              cmd,
              {
                dayKey: null,
                page: { limit: 20, cursor: r.data.page.nextCursor },
              },
              "items",
              true,
            );
          }),
        );
      return;
    }
    const rows = key ? r.data?.[key] : null;
    if (Array.isArray(rows)) {
      currentRows = more ? [...currentRows, ...rows] : rows;
      cursor = r.data.page?.nextCursor ?? r.data.page?.cursor ?? null;
      if (cmd === "ADMIN_LIST_HISTORY") {
        const events = he
          ? [
              "",
              "פתיחה",
              "הפעלה",
              "כיבוי",
              "החזקה",
              "שחרור",
              "פתוח מאולץ",
              "סגור מאולץ",
              "רגיל",
              "הפעלה מחדש",
              "היסטוריה נוקתה",
            ]
          : [
              "",
              "Open",
              "On",
              "Off",
              "Hold",
              "Release",
              "Held open",
              "Held closed",
              "Normal",
              "Restart",
              "History cleared",
            ];
        renderTable(
          content,
          currentRows
            .filter((row) => currentTab !== "guests" || row[7] === 3)
            .map((row) => ({
              time: row[1]
                ? new Date((row[1] + row[2] * 60) * 1000)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 19)
                : t("זמן לא ידוע", "Time unknown"),
              action: events[row[5]] ?? row[5],
              source: row[6] === 9 ? "WIFIGATE Manager" : row[6],
              name: row[13],
              phone: row[14],
              result: row[8] === 0 ? t("בוצע", "Done") : t("סורב", "Refused"),
            })),
        );
      } else renderTable(content, currentRows);
      if (cursor)
        content.append(
          button(t("טען עוד", "Load more"), () =>
            cmd === "ADMIN_LIST_HISTORY"
              ? showRead(
                  content,
                  cmd,
                  { ...payload, page: { ...payload.page, cursor } },
                  key,
                  true,
                )
              : showTab(currentTab, true),
          ),
        );
      content.append(
        button(t("ייצוא הנתונים המוצגים", "Export displayed data"), () =>
          exportRows(currentRows),
        ),
      );
    } else {
      currentRows = [];
      renderFacts(content, r.data);
    }
    placeManagerActions(content, language);
  }
  function renderFacts(content, value) {
    const grid = node("dl", undefined, "manager-facts");
    const names = {
      users: t("משתמשים", "Users"),
      admins: t("מנהלים", "Administrators"),
      firmware: t("קושחה", "Firmware"),
      systemId: t("מזהה מערכת", "System ID"),
      freeHeap: t("זיכרון פנוי", "Free memory"),
      command: t("אופן פתיחה", "Opening method"),
      enabled: t("פעיל", "Enabled"),
      state: t("מצב", "State"),
      revision: t("גרסה", "Revision"),
      ssid: t("רשת אלחוטית", "Wi-Fi network"),
      available: t("זמין", "Available"),
    };
    function add(o, prefix = "") {
      for (const [key, v] of Object.entries(o ?? {})) {
        if (/secret|credential|private|password|passphrase/i.test(key))
          continue;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          add(v, prefix + (names[key] ?? key) + " · ");
          continue;
        }
        grid.append(
          node("dt", prefix + (names[key] ?? key)),
          node(
            "dd",
            typeof v === "boolean"
              ? v
                ? t("כן", "Yes")
                : t("לא", "No")
              : Array.isArray(v)
                ? v.length
                : String(v ?? "—"),
          ),
        );
      }
    }
    add(value);
    content.append(grid);
  }
  function renderTable(content, rows) {
    if (!rows.length) {
      content.append(
        node("p", t("אין רשומות.", "No records."), "manager-empty"),
      );
      return;
    }
    const columns = [
      ...new Set(rows.flatMap((row) => Object.keys(row))),
    ].filter(
      (k) => !["secret", "key", "credentialNonce", "credential"].includes(k),
    );
    const wrap = node("div", undefined, "manager-table-wrap"),
      table = node("table", undefined, "manager-table"),
      head = node("tr");
    const names = {
      name: t("שם", "Name"),
      email: t("אימייל", "Email"),
      countryCode: t("קידומת", "Country"),
      localNumber: t("טלפון", "Phone"),
      floorNumber: t("קומה", "Floor"),
      apartmentNumber: t("דירה", "Apartment"),
      parkingNumber: t("חניה", "Parking"),
    };
    for (const k of columns) head.append(node("th", names[k] ?? k));
    const thead = node("thead");
    thead.append(head);
    const tbody = node("tbody");
    const people = currentTab === "users" || currentTab === "admins";
    if (people) head.append(node("th", t("פעולות", "Actions")));
    for (const r of rows) {
      const tr = node("tr");
      for (const k of columns)
        tr.append(
          node(
            "td",
            typeof r[k] === "object"
              ? JSON.stringify(r[k])
              : String(r[k] ?? ""),
          ),
        );
      if (people) {
        const actions = node("td");
        actions.append(
          button(t("עריכה", "Edit"), () => {
            const f = content.querySelector("[data-people-form]");
            for (const key of [
              "countryCode",
              "localNumber",
              "name",
              "email",
              "floorNumber",
              "apartmentNumber",
              "parkingNumber",
            ])
              f.elements[key].value =
                r[key] ??
                (key.endsWith("Number") && key !== "localNumber" ? 0 : "");
            f.scrollIntoView({ block: "nearest" });
          }),
          button(t("מחיקה", "Delete"), async () => {
            if (
              !confirm(
                t(
                  `למחוק את ${r.name} מהשער?`,
                  `Delete ${r.name} from the gate?`,
                ),
              )
            )
              return;
            await connection.command(
              currentTab === "users"
                ? "ADMIN_DELETE_USER"
                : "ADMIN_DELETE_ADMIN",
              {
                countryCode: r.countryCode,
                localNumber: r.localNumber,
                expectedRevision: currentData.revision,
              },
            );
            await showTab(currentTab);
          }),
        );
        tr.append(actions);
      }
      tbody.append(tr);
    }
    table.append(thead, tbody);
    wrap.append(table);
    content.append(wrap);
  }
  function downloadCsv(csv) {
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = node("a");
    a.href = url;
    a.download = `WIFIGATE-${currentGate}-${currentTab}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportRows(rows) {
    if (["users", "admins"].includes(currentTab)) {
      downloadCsv(encodeManagerCsv(rows));
      return;
    }
    const columns = [
      "slot",
      "utc",
      "tz",
      "uptime",
      "boot",
      "event",
      "source",
      "principal",
      "result",
      "reason",
      "gateCommand",
      "dualRole",
      "detail",
      "name",
      "phone",
      "issuer",
    ];
    const cell = (value) =>
      '"' +
      String(value ?? "")
        .replace(/^[=+\-@\t\r]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    downloadCsv(
      "\ufeff" +
        [
          columns.map(cell).join(","),
          ...rows.map((row) => row.map(cell).join(",")),
        ].join("\r\n"),
    );
  }
  async function openGateAction() {
    const config = (await connection.command("ADMIN_GET_GATE_CONFIG")).data;
    let state;
    const expected = config.config.command;
    if (expected === "TOGGLE" || expected === 3) {
      state = prompt(t("בחרו ON או OFF", "Enter ON or OFF"));
      if (!["ON", "OFF"].includes(state)) return;
    }
    if (
      !confirm(
        t(
          `לפתוח את ${currentSystem.name} (${currentGate}) עכשיו?`,
          `Open ${currentSystem.name} (${currentGate}) now?`,
        ),
      )
    )
      return;
    await connection.command("ADMIN_REMOTE_OPEN", {
      mode: "METHOD",
      ...(state ? { state } : {}),
      expectedGateCommand: expected,
    });
    say(t("השער אישר את הפעולה.", "The gate confirmed the action."));
  }
  function renderPeopleActions(content, tab) {
    const collection = tab === "users" ? "USERS" : "ADMINS";
    content.append(
      button(t("ייצוא כל הרשומות", "Export all records"), async () => {
        const rows = await connection.exportCollection(collection, (bytes) =>
          say(t(`התקבלו ${bytes} בתים…`, `Received ${bytes} bytes…`)),
        );
        downloadCsv(encodeManagerCsv(rows));
        say(t("הייצוא אומת מול השער.", "Export verified against the gate."));
      }),
    );
    const upload = node("input");
    upload.type = "file";
    upload.accept = ".csv,text/csv";
    upload.setAttribute(
      "aria-label",
      t("בחירת קובץ משתמשים לייבוא", "Select residents CSV to import"),
    );
    const mode = node("select");
    mode.setAttribute("aria-label", t("אופן ייבוא", "Import mode"));
    mode.append(
      new Option(t("מיזוג", "Merge"), "MERGE"),
      new Option(t("החלפת כל הרשומות", "Replace all records"), "REPLACE"),
    );
    content.append(
      upload,
      mode,
      button(t("בדיקה וייבוא קובץ", "Validate and import file"), async () => {
        const file = upload.files?.[0];
        if (!file || file.size > 4 * 1024 * 1024)
          throw new Error("INVALID_CSV");
        const rows = parseManagerCsv(await file.text());
        if (
          mode.value === "REPLACE" &&
          !confirm(
            t(
              "הייבוא יחליף את כל הרשומות בקבוצה זו. להמשיך לבדיקת הקובץ?",
              "Import will replace every record in this collection. Continue to validation?",
            ),
          )
        )
          return;
        const revision = (
          await connection.command(
            tab === "users" ? "ADMIN_LIST_USERS" : "ADMIN_LIST_ADMINS",
            { page: { cursor: null, limit: 1 }, query: "" },
          )
        ).data.revision;
        const result = await connection.importCollection(
          collection,
          mode.value,
          rows,
          revision,
          (v) =>
            confirm(
              t(
                `השער אימת ${v.accepted} רשומות. לשמור כעת?`,
                `The gate validated ${v.accepted} records. Commit now?`,
              ),
            ),
          (done, total) =>
            say(
              t(
                `מעלה לשער ${Math.round((done / total) * 100)}%`,
                `Uploading to gate ${Math.round((done / total) * 100)}%`,
              ),
            ),
        );
        if (!result.cancelled) await showTab(tab);
        else
          say(t("הייבוא בוטל לפני שמירה.", "Import cancelled before commit."));
      }),
    );
    content.append(
      form(
        [
          ["countryCode", t("קידומת מדינה", "Country code")],
          ["localNumber", t("מספר מקומי", "Local number")],
          ["name", t("שם", "Name")],
          ["email", t("אימייל", "Email"), "email"],
          ["floorNumber", t("קומה", "Floor"), "number"],
          ["apartmentNumber", t("דירה", "Apartment"), "number"],
          ["parkingNumber", t("חניה", "Parking"), "number"],
        ],
        t("הוספה / עדכון", "Add / update"),
        async (v) => {
          if (!confirm(t("לשמור בשער?", "Save on the gate?"))) return;
          await connection.command(
            tab === "users" ? "ADMIN_UPSERT_USER" : "ADMIN_UPSERT_ADMIN",
            {
              ...v,
              floorNumber: Number(v.floorNumber),
              apartmentNumber: Number(v.apartmentNumber),
              parkingNumber: Number(v.parkingNumber),
              expectedRevision: currentData.revision,
            },
          );
          await showTab(tab);
        },
      ),
    );
    const editor = content.querySelector("form");
    editor.dataset.peopleForm = "true";
    editor.elements.email.required = true;
    for (const key of ["floorNumber", "apartmentNumber", "parkingNumber"]) {
      editor.elements[key].value = "0";
      editor.elements[key].min = "0";
      editor.elements[key].max =
        key === "parkingNumber" ? "4294967295" : "65535";
    }
  }
  function renderSettings(content) {
    const config = currentData.config,
      revision = currentData.revision;
    const fields = [
      ["command", t("אופן פתיחה", "Opening method")],
      [
        "pulseWidth1Millis",
        t("משך פולס ראשון (מילישניות)", "First pulse (ms)"),
        "number",
      ],
      [
        "timeBetweenPulses1Seconds",
        t("השהיה ראשונה (שניות)", "First delay (seconds)"),
        "number",
      ],
      [
        "pulseWidth2Millis",
        t("משך פולס שני (מילישניות)", "Second pulse (ms)"),
        "number",
      ],
      [
        "timeBetweenPulses2Seconds",
        t("השהיה שנייה (שניות)", "Second delay (seconds)"),
        "number",
      ],
      [
        "pulseWidth3Millis",
        t("משך פולס שלישי (מילישניות)", "Third pulse (ms)"),
        "number",
      ],
    ];
    const f = form(fields, t("שמירת הגדרות", "Save settings"), async (v) => {
      if (!confirm(t("לשנות את הגדרות השער?", "Change gate settings?"))) return;
      const payload = { command: v.command, expectedRevision: revision };
      for (const [key] of fields.slice(1)) payload[key] = Number(v[key]);
      await connection.command("ADMIN_SET_GATE_CONFIG", payload);
      await showTab("settings");
    });
    for (const [key] of fields) f.elements[key].value = config[key];
    const old = f.elements.command,
      select = node("select");
    select.name = "command";
    for (const method of [
      "PULSE",
      "PULSE_AFTER_PULSE",
      "PULSE_AFTER_PULSE_AFTER_PULSE",
      "TOGGLE",
      "PUSH_BUTTON",
    ])
      select.append(new Option(method.replaceAll("_", " "), method));
    select.value = config.command;
    old.replaceWith(select);
    content.append(f);
  }
  function renderEventActions(content) {
    const snapshot = currentData,
      days = he
        ? ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
        : [
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ];
    const time = (n) =>
      String(Math.floor(n / 60)).padStart(2, "0") +
      ":" +
      String(n % 60).padStart(2, "0");
    const list = node("div");
    for (const [index, event] of snapshot.items.entries()) {
      const row = node("div", undefined, "manager-card manager-row");
      row.append(
        node(
          "span",
          `${days[event[0]]} · ${time(event[2])}–${time(event[3])} · ${event[1] === 0 ? t("פתוח", "Open") : t("סגור", "Closed")}${event.length === 5 ? " · " + t("חד־פעמי", "One time") : ""}`,
        ),
        button(t("מחיקת אירוע", "Delete event"), async () => {
          if (!confirm(t("למחוק את האירוע?", "Delete this event?"))) return;
          await connection.command("ADMIN_SET_EVENTS", {
            today: snapshot.today,
            items: snapshot.items.filter((_, i) => i !== index),
            expectedRevision: snapshot.revision,
          });
          await showTab("events");
        }),
      );
      list.append(row);
    }
    content.append(list);
    const f = form(
      [
        ["day", t("יום בשבוע", "Weekday")],
        ["action", t("מצב בזמן האירוע", "State during event")],
        ["start", t("תחילת האירוע", "Start time"), "time"],
        ["end", t("סיום האירוע", "End time"), "time"],
      ],
      t("הוספת אירוע שבועי", "Add weekly event"),
      async (v) => {
        const minutes = (value) => {
          const [h, m] = value.split(":").map(Number);
          return h * 60 + m;
        };
        const start = minutes(v.start),
          end = minutes(v.end) || 1440;
        if (start >= end || start % 10 || end % 10)
          throw new Error("INVALID_EVENT");
        if (!confirm(t("לשמור את האירוע בשער?", "Save the event on the gate?")))
          return;
        await connection.command("ADMIN_SET_EVENTS", {
          today: snapshot.today,
          items: [
            ...snapshot.items,
            [Number(v.day), Number(v.action), start, end],
          ],
          expectedRevision: snapshot.revision,
        });
        await showTab("events");
      },
    );
    for (const [name, options] of [
      ["day", days.map((d, i) => [d, String(i)])],
      [
        "action",
        [
          [t("פתוח", "Open"), "0"],
          [t("סגור", "Closed"), "1"],
        ],
      ],
    ]) {
      const select = node("select");
      select.name = name;
      for (const [label, value] of options)
        select.append(new Option(label, value));
      f.elements[name].replaceWith(select);
    }
    f.elements.start.step = "600";
    f.elements.end.step = "600";
    content.append(f);
  }
  function renderRfActions(content) {
    const revision = currentData.revision;
    let operationId;
    const actions = node("div", undefined, "manager-actions");
    for (const [label, cmd] of [
      [t("לימוד שלט", "Learn remote"), "ADMIN_RF_LEARN_START"],
      [t("בדיקת לימוד", "Check learning"), "ADMIN_RF_LEARN_STATUS"],
      [t("שמירה", "Save"), "ADMIN_RF_LEARN_SAVE"],
      [t("ביטול לימוד", "Cancel learning"), "ADMIN_RF_LEARN_CANCEL"],
    ])
      actions.append(
        button(label, async () => {
          if (
            cmd.endsWith("START") &&
            !confirm(
              t(
                "נדרש אדם ליד השער שילחץ על השלט. להתחיל?",
                "A person at the gate must press the remote. Start?",
              ),
            )
          )
            return;
          if (cmd !== "ADMIN_RF_LEARN_START" && !operationId)
            throw new Error("NO_RF_OPERATION");
          const r = await connection.command(
            cmd,
            cmd === "ADMIN_RF_LEARN_START"
              ? {}
              : {
                  operationId,
                  ...(cmd === "ADMIN_RF_LEARN_SAVE"
                    ? { expectedRevision: revision }
                    : {}),
                },
          );
          if (cmd === "ADMIN_RF_LEARN_START") operationId = r.data.operationId;
          renderFacts(content, r.data);
        }),
      );
    content.append(actions);
  }
  function renderAutoActions(content) {
    const data = currentData;
    const actions = node("div", undefined, "manager-actions");
    for (const enabled of [true, false])
      actions.append(
        button(
          enabled
            ? t("הפעלת Auto Open", "Enable Auto Open")
            : t("כיבוי Auto Open", "Disable Auto Open"),
          async () => {
            await connection.command("ADMIN_SET_AUTO_OPEN_CONFIG", {
              ...data.config,
              enabled,
              expectedRevision: data.revision,
            });
            await showTab("auto");
          },
        ),
      );
    content.append(actions);
  }
  const ready = task(async () => {
    await refreshProfile();
    if (closed) return;
    if (profile.role === "admin" || profile.account) await showSystems(null);
    else if (profile.organizations.length)
      await showSystems(profile.organizations[0].id);
    else await showInvitations();
  });
  return {
    ready,
    close() {
      closed = true;
      stop();
      examples.close();
      root.replaceChildren();
    },
  };
}
