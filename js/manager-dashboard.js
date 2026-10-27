import { renderManagerOrganization } from "./manager-organization.js";
import {
  systemsEmptyCopy,
  organizationsEmptyCopy,
} from "./systems-empty-copy.js";
import { attachPopover } from "./popover.js";
import { accessNoteContent } from "./manager-access-note.js";
import { createSystemIcon } from "./wifigate-system-icons.js";
import { createManagerDialog } from "./manager-dialog.js";
import { placeManagerActions } from "./manager-action-layout.js";
import { parseManagerCsv, encodeManagerCsv } from "./manager-csv.js";
import { managerRequest } from "./api/index.js";
import { ManagerConnection } from "./manager-connection.js";
import { createManagerExamples } from "./manager-examples.js";
import { createManagerSystemCard } from "./manager-system-card.js";
import { createPlatformAdminDirectory } from "./platform-admin-directory.js";
import { createManagerActivity } from "./manager-activity.js";

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
  management = false,
  onManagementChange = () => {},
}) {
  const he = language === "he",
    t = (h, e) => (he ? h : e);
  const request =
    customApi ??
    ((path, method = "GET", body) =>
      managerRequest(user, BASE + path, method, body));
  const dialogs = createManagerDialog({ language });
  const confirmAction = (message) =>
    dialogs.confirm(
      view.dataset.simulation === "true"
        ? `${t("סימולציה בלבד · מערכת לדוגמה", "Simulation only · example system")}\n${message}`
        : message,
    );
  let planDirectory;
  let managementMode = management;
  let successfulWrites = 0;
  let generation = 0,
    closed = false,
    profile,
    scope = null,
    organizationDetail = null,
    systems = [],
    connection,
    currentSystem,
    exampleBack,
    currentGate,
    currentTab = "overview",
    currentRows = [],
    currentData,
    cursor = null,
    currentView = "",
    countsPopover;
  const shell = node("div", undefined, "manager-shell"),
    nav = node("nav", undefined, "manager-nav"),
    main = node("div", undefined, "manager-main");
  nav.setAttribute("aria-label", t("ניווט Manager", "Manager navigation"));
  const title = node("p", t("סביבת עבודה", "Workspace"), "manager-nav-title"),
    status = node("p", "", "manager-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const retry = node(
    "button",
    t("טעינה מחדש", "Reload data"),
    "manager-button manager-retry",
  );
  retry.type = "button";
  retry.hidden = true;
  retry.addEventListener(
    "click",
    () =>
      void task(async () => {
        retry.hidden = true;
        if (!profile) {
          await refreshProfile();
          return changeManagement(managementMode, false);
        }
        if (currentView === "overview") return showOverview();
        if (currentView === "admin") return showDirectory("admin");
        if (currentView === "user") return showAccounts();
        if (
          currentView === "organizations" ||
          currentView === "my-organizations"
        )
          return showOrganizations(currentView === "my-organizations");
        if (currentView === "invitations") return showInvitations();
        return showSystems(scope);
      }, retry),
  );
  const view = node("section", undefined, "manager-view");
  const platformHeader = node("section", undefined, "manager-platform-header");
  platformHeader.hidden = true;
  main.append(status, retry, platformHeader, view);
  nav.append(title);
  shell.append(nav, main);
  root.replaceChildren(shell);
  const activity = createManagerActivity({ main, view, language });
  const requestLabel = (path, method) =>
    method !== "GET"
      ? t("מעדכן את הנתונים…", "Updating data…")
      : path === "/me"
        ? t("טוען את סביבת העבודה…", "Loading your workspace…")
        : path.includes("overview")
          ? t("טוען את תמונת המצב…", "Loading the overview…")
          : path.includes("systems")
            ? t("טוען מערכות…", "Loading systems…")
            : path.includes("members") ||
                path.includes("directory") ||
                path.includes("accounts")
              ? t("טוען משתמשים והרשאות…", "Loading people and access…")
              : path.includes("organizations")
                ? t("טוען ארגונים…", "Loading organizations…")
                : path.includes("invitations")
                  ? t("טוען הזמנות…", "Loading invitations…")
                  : t("מתקשר עם המערכת…", "Communicating with the system…");
  const api = (path, method = "GET", body) => {
    const epoch = generation;
    return activity.track(requestLabel(path, method), async () => {
      try {
        const result = await request(path, method, body);
        if (closed || epoch !== generation) throw new Error("CANCELLED");
        if (
          method !== "GET" &&
          /^\/(admin\/)?(accounts|access|organizations|systems|invitations)(\/|$)/.test(
            path,
          )
        )
          successfulWrites++;
        return result;
      } catch (error) {
        if (closed || epoch !== generation) throw new Error("CANCELLED");
        throw error;
      }
    });
  };
  const platformEntry = node(
    "a",
    undefined,
    "platform-management-entry manager-platform-entry",
  );
  platformEntry.href = "/dashboard/manager/platform/" + (he ? "?lang=he" : "");
  platformEntry.append(
    overviewIcon("admins"),
    node("span", t("ניהול פלטפורמה", "Platform management")),
  );
  platformEntry.hidden = true;
  platformEntry.addEventListener("click", (event) => {
    if (
      event.button ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    void task(() => changeManagement(true));
  });
  root.append(platformEntry);
  const examples = createManagerExamples({
    language,
    onOpen: (system) => task(() => openExample(system)),
    onOpenOrganization: openExampleOrganization,
  });
  const say = (text, error = false, state = "info") => {
    status.textContent = text;
    status.dataset.state = error ? "error" : state;
    status.setAttribute("role", error ? "alert" : "status");
    retry.hidden =
      !error || Boolean(connection) || currentView === "platform-systems";
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
      CREDENTIAL_REVOKED: t(
        "השער דחה את הרשאת Manager השמורה בו. סנכרון פרטי המערכת אינו מחדש הרשאה זו. נדרש חידוש הקישור דרך מנהל מקומי באפליקציה ליד המערכת.",
        "The gate rejected its saved Manager authorization. Syncing system details does not renew that authorization. A local administrator must renew the link in the app near the system.",
      ),
      CREDENTIAL_UNKNOWN: t(
        "השער לא זיהה הרשאת Manager תקפה. נדרש חידוש הקישור באפליקציה ליד המערכת עם הרשאת מנהל מקומי.",
        "The gate did not recognize a valid Manager authorization. Renew the link in the app near the system with local administrator access.",
      ),
      KEY_MISMATCH: t(
        "הזהות המאובטחת של השער השתנתה. יש לאמת את המערכת מחדש באפליקציה ליד השער.",
        "The gate's secure identity changed. Verify the system again in the app near the gate.",
      ),
      SYSTEM_MISMATCH: t(
        "החיבור הגיע למערכת אחרת. בדקו את המערכת שיוצאה מהאפליקציה.",
        "The connection reached a different system. Check which system was exported from the app.",
      ),
      VERSION_UNSUPPORTED: t(
        "גרסת השער אינה תואמת לחיבור. יש לעדכן את האפליקציה ואת קושחת המערכת.",
        "The gate version is incompatible. Update the app and system firmware.",
      ),
      GATE_AUTHENTICATION_FAILED: t(
        "השער לא אישר את החיבור המאובטח. בדקו את הרשאת המנהל המקומי באפליקציה.",
        "The gate did not approve the secure connection. Check local administrator access in the app.",
      ),
      INVALID_ORGANIZATION_LOGO: t(
        "לא ניתן לעבד את הלוגו. בחרו תמונת PNG, JPG או WebP בגודל של עד 5 MB.",
        "This logo could not be processed. Choose a PNG, JPG or WebP image up to 5 MB.",
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
      CONNECTION_FAILED: t(
        "החיבור למערכת נכשל. בדקו את החיבור לרשת ונסו להתחבר מחדש.",
        "Connection failed. Check the network and reconnect.",
      ),
      CONNECTION_TIMEOUT: t(
        "המערכת לא השלימה את החיבור בזמן. אפשר לנסות להתחבר מחדש.",
        "The system did not connect in time. You can reconnect.",
      ),
      EXAMPLE_CONFLICT: t(
        "הנתונים בסימולציה השתנו. טענו את הלשונית מחדש.",
        "Simulation data changed. Reload this tab.",
      ),
      EXAMPLE_DELEGATION_ADMIN: t(
        "לא ניתן להסיר את המנהל שעליו נשענת הרשאת הניהול.",
        "The administrator backing management access cannot be removed.",
      ),
      EXAMPLE_CAPACITY: t(
        "הפעולה חורגת מקיבולת המערכת.",
        "This exceeds the system capacity.",
      ),
      EXAMPLE_OFFLINE: t(
        "מערכת הדוגמה אינה זמינה.",
        "The example system is offline.",
      ),
      EXAMPLE_HELD_CLOSED: t(
        "המערכת במצב סגור קבוע.",
        "The system is held closed.",
      ),
      LIST_LIMIT: t(
        "הרשימה אינה זמינה במלואה. רעננו או בחרו ארגון כדי לצמצם את התוצאות.",
        "The full list is unavailable. Refresh or choose an organization to narrow the results.",
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
    if (b?.disabled) return;
    if (b) {
      b.disabled = true;
      b.setAttribute("aria-busy", "true");
      b.classList.add("is-loading");
    }
    const writesBefore = successfulWrites;
    try {
      await action();
      if (!closed && successfulWrites > writesBefore && !status.textContent)
        say(
          t("השינויים נשמרו בהצלחה.", "Changes saved successfully."),
          false,
          "success",
        );
    } catch (error) {
      if (!closed && error.message !== "CANCELLED")
        say(
          successfulWrites > writesBefore
            ? t(
                "הפעולה נשמרה, אבל רענון התצוגה נכשל. טענו את הנתונים מחדש.",
                "The change was saved, but the view could not refresh. Reload the data.",
              )
            : errorText(error),
          true,
        );
    } finally {
      if (b) {
        b.disabled = false;
        b.removeAttribute("aria-busy");
        b.classList.remove("is-loading");
      }
    }
  }
  async function ensureRecent() {
    if (examples.isSystem(currentSystem) && view.dataset.simulation === "true")
      return;
    const epoch = generation;
    await activity.track(
      t("מאמת את הזהות…", "Verifying your identity…"),
      verifyRecent,
    );
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
      if (b.disabled) return;
      const values = Object.fromEntries(new FormData(f));
      void task(async () => {
        const fields = [...f.querySelectorAll("input,select,textarea")].map(
          (field) => [field, field.disabled],
        );
        fields.forEach(([field]) => {
          field.disabled = true;
        });
        f.setAttribute("aria-busy", "true");
        try {
          await submit(values, f);
        } finally {
          fields.forEach(([field, disabled]) => {
            field.disabled = disabled;
          });
          f.removeAttribute("aria-busy");
        }
      }, b);
    });
    return f;
  }
  function stop() {
    activity.reset();
    planDirectory?.close();
    planDirectory = undefined;
    countsPopover?.close();
    countsPopover = null;
    dialogs.cancel();
    examples.closeView();
    view.classList.remove("manager-example-workspace");
    delete view.dataset.simulation;
    generation++;
    say("");
    connection?.close();
    connection = null;
    currentRows = [];
    currentData = undefined;
    cursor = null;
  }
  function renderNav() {
    root.dataset.management = String(managementMode);
    shell.dataset.mode = managementMode ? "management" : "workspace";
    nav.hidden = managementMode;
    platformEntry.hidden = managementMode || profile.role !== "admin";
    nav.replaceChildren(title);
    const roleList = node("div", undefined, "manager-sidebar-roles");
    for (const role of new Set(
      profile.roles?.length ? profile.roles : [profile.role],
    )) {
      if (!["admin", "user", "organization-admin"].includes(role)) continue;
      const label = node("span", roleName(role));
      label.dir = "ltr";
      roleList.append(label);
    }
    if (roleList.childElementCount) nav.append(roleList);

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
    if (profile.role === "admin") {
      const platformViews = [
        "overview",
        "admin",
        "user",
        "organizations",
        "platform-systems",
      ];
      if (managementMode && platformViews.includes(currentView)) {
        platformHeader.hidden = false;
        const back = node(
          "a",
          t("חזרה לסביבת העבודה", "Back to workspace"),
          "manager-workspace-back",
        );
        back.href = "/dashboard/manager/" + (he ? "?lang=he" : "");
        back.addEventListener("click", (event) => {
          if (
            event.button ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
          )
            return;
          event.preventDefault();
          void task(() => changeManagement(false));
        });
        platformHeader.append(
          back,
          node("span", "WIFIGATE Manager admin", "manager-role-badge"),
          node(
            "h2",
            t("ניהול פלטפורמה", "Platform management"),
            "manager-platform-title",
          ),
          node(
            "p",
            t(
              "משתמשים, הרשאות וארגונים של WIFIGATE Manager.",
              "People, access and organizations in WIFIGATE Manager.",
            ),
            "manager-platform-description",
          ),
        );
        const tabs = node("nav", undefined, "manager-platform-tabs");
        tabs.setAttribute(
          "aria-label",
          t("ניווט ניהול פלטפורמה", "Platform management navigation"),
        );
        for (const [key, label, action] of [
          ["overview", t("סקירה", "Overview"), showOverview],
          ["admin", directoryLabel("admin"), () => showDirectory("admin")],
          ["user", directoryLabel("user"), () => showAccounts()],
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
    }
  }
  async function changeManagement(enabled, notify = true) {
    managementMode = enabled;
    if (notify) onManagementChange(enabled);
    if (enabled) {
      if (profile.role !== "admin") {
        beginView("restricted");
        view.append(
          node(
            "h3",
            t(
              "המסך זמין למנהלי Manager בלבד",
              "This page is for Manager administrators",
            ),
          ),
        );
        const back = node(
          "a",
          t("חזרה לסביבת העבודה", "Back to workspace"),
          "manager-workspace-back",
        );
        back.href = "/dashboard/manager/" + (he ? "?lang=he" : "");
        back.addEventListener("click", (event) => {
          event.preventDefault();
          void task(() => changeManagement(false));
        });
        view.append(back);
        return;
      }
      await showOverview();
    } else if (profile.role === "admin" || profile.account)
      await showSystems(null);
    else if (profile.organizations.length) await showOrganizations(true);
    else await showInvitations();
  }
  async function openExample(system) {
    if (!examples.isSystem(system)) throw new Error("EXAMPLE_SYSTEM_NOT_FOUND");
    const fromOrganization = currentView === "example-organization";
    exampleBack = fromOrganization
      ? openExampleOrganization
      : () => showSystems(null);
    scope = null;
    currentView = "example-system";
    renderNav();
    await openSystem(system);
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
  function directoryLabel(role) {
    return {
      admin: t("מנהלי פלטפורמה", "Platform admins"),
      user: t("לקוחות", "Customers"),
      "organization-admin": t("מנהלי ארגונים", "Organization admins"),
    }[role];
  }
  function overviewIcon(key) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (const [attribute, value] of Object.entries({
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "1.7",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    }))
      svg.setAttribute(attribute, value);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      {
        admins: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6",
        users: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
        organizationAdmins:
          "M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6 21v-2a6 6 0 0 1 12 0v2M18 5a3 3 0 0 1 0 6M21 20v-2a5 5 0 0 0-3-4M6 5a3 3 0 0 0 0 6M3 20v-2a5 5 0 0 1 3-4",
        organizations:
          "M5 21V3h14v18M2 21h20M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3",
      }[key],
    );
    svg.append(path);
    return svg;
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
    focusView();
  }
  function focusView() {
    const epoch = generation;
    requestAnimationFrame(() => {
      if (
        closed ||
        epoch !== generation ||
        document.activeElement !== document.body
      )
        return;
      const heading = view.querySelector("h3");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    });
  }
  function orgPath(id) {
    return `${profile.role === "admin" ? "/admin" : ""}/organizations/${encodeURIComponent(id)}`;
  }
  async function pagedView(path, container, render, { onEmpty } = {}) {
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
      if (!container.childElementCount && !next) {
        if (onEmpty) onEmpty();
        else say(t("אין רשומות להצגה.", "No records to display."));
      }
    }
    await load();
  }
  async function showOverview() {
    beginView("overview");
    const epoch = generation;
    const heading = node("div", undefined, "manager-overview-heading");
    const info = node("button", "i", "manager-count-info");
    info.type = "button";
    info.setAttribute("aria-label", t("הסבר על הספירות", "About these counts"));
    info.setAttribute("aria-describedby", "manager-counts-help");
    const help = node(
      "p",
      t(
        "תמונת מצב של מנהלי פלטפורמה, לקוחות וארגונים פעילים ב־Manager.",
        "Active platform administrators, customers and organizations in Manager.",
      ),
      "manager-count-help",
    );
    help.id = "manager-counts-help";
    help.setAttribute("role", "tooltip");
    help.tabIndex = -1;
    heading.append(node("h3", t("סקירה", "Overview")), info, help);
    view.append(heading);
    countsPopover = attachPopover(info, help, { align: "end" });
    const totals = await api("/admin/overview");
    if (closed || epoch !== generation) return;
    const grid = node("div", undefined, "manager-overview-grid");
    for (const [key, label, cta, action] of [
      [
        "admins",
        directoryLabel("admin"),
        t("ניהול מנהלים", "Manage admins"),
        () => showDirectory("admin"),
      ],
      [
        "users",
        directoryLabel("user"),
        t("ניהול לקוחות", "Manage customers"),
        () => showAccounts(),
      ],
      [
        "organizations",
        t("ארגונים", "Organizations"),
        t("ניהול ארגונים", "Manage organizations"),
        showOrganizations,
      ],
    ]) {
      const card = button(label, action);
      card.classList.add("manager-card", "manager-overview-card");
      const icon = node("span", undefined, "manager-overview-icon");
      icon.append(overviewIcon(key));
      card.replaceChildren(
        icon,
        node("span", label, "manager-overview-label"),
        node(
          "strong",
          Number.isInteger(totals[key]) ? String(totals[key]) : "—",
        ),
        node("span", cta + (he ? " ←" : " →"), "manager-overview-cta"),
      );
      grid.append(card);
    }
    view.append(grid);
    const details = node("details", undefined, "platform-admin-management");
    details.append(
      node(
        "summary",
        t("תוכניות ועלויות משתמשי Manager", "Manager user plans and costs"),
      ),
    );
    const directoryRoot = node("section");
    details.append(directoryRoot);
    view.append(details);
    details.addEventListener("toggle", () => {
      if (details.open && !planDirectory && !closed && epoch === generation)
        planDirectory = createPlatformAdminDirectory({
          root: directoryRoot,
          user,
          language,
          product: "manager",
        });
    });
  }
  async function showDirectory(role, status = "active") {
    beginView(role);
    const epoch = generation;
    view.append(
      node("h3", directoryLabel(role)),
      node("p", roleName(role), "manager-view-description"),
    );
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
                  !(await confirmAction(
                    t(
                      `לעדכן את הגישה של ${row.email}?`,
                      `Change access for ${row.email}?`,
                    ),
                  ))
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
    if (role === "admin") {
      const create = button(
        t("הוספת Manager admin", "Add Manager admin"),
        async () => {
          const created = await dialogs.form({
            title: t("הוספת Manager admin", "Add Manager admin"),
            message: t(
              "הזינו כתובת אימייל מאומתת של החשבון שיקבל הרשאת ניהול ב־WIFIGATE Manager.",
              "Enter the verified email address of the account receiving administrator access to WIFIGATE Manager.",
            ),
            fields: [
              [
                "email",
                t("אימייל מנהל מאומת", "Verified administrator email"),
                "email",
              ],
            ],
            submitLabel: t("הוספת Manager admin", "Add Manager admin"),
            errorText,
            onSubmit: async (values) => {
              await ensureRecent();
              await api("/admin/access", "POST", {
                ...values,
                role: "admin",
                status: "active",
              });
            },
          });
          if (created && !closed && epoch === generation)
            await showDirectory(role);
        },
        true,
      );
      const heading = view.querySelector("h3");
      const bar = node("div", undefined, "manager-toolbar");
      heading.replaceWith(bar);
      bar.append(heading, create);
    } else
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
    renderNav();
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
    organizationDetail = null;
    renderNav();
    view.replaceChildren();
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
    view.replaceChildren();
    if (scope) {
      const path =
        (operatorAccount?.orgId ? "/admin" : "") +
        "/organizations/" +
        encodeURIComponent(scope);
      organizationDetail = await renderManagerOrganization({
        root: view,
        path,
        api,
        language,
        user,
        dialogs,
        ensureRecent,
        run: task,
        onRefresh: () => showSystems(orgId, operatorAccount),
        onBack: () => showOrganizations(!operatorAccount),
        errorText,
        isCurrent: () => !closed && epoch === generation,
      });
      if (closed || epoch !== generation) return;
    }

    const bar = node("div", undefined, "manager-toolbar");
    bar.append(
      node(
        "h3",
        operatorAccount
          ? operatorAccount.email
          : scope
            ? t("מערכות הארגון", "Organization systems")
            : t("המערכות שלי", "My systems"),
      ),
      button(t("רענון", "Refresh"), () => showSystems(scope, operatorAccount)),
    );
    view.append(bar);
    focusView();
    if (!systems.length) {
      const empty = node(
        "section",
        undefined,
        "manager-empty manager-empty-systems",
      );
      const copy = systemsEmptyCopy(he ? "he" : "en");
      empty.append(node("h4", copy.title));
      if (!scope && !operatorAccount) empty.append(node("p", copy.description));
      view.append(empty);
    }
    const grid = node("div", undefined, "manager-grid");
    for (const s of systems)
      grid.append(
        createManagerSystemCard({
          system: s,
          language,
          actions: systemActions(s, operatorAccount),
        }),
      );
    view.append(grid);
    if (!scope && !operatorAccount) examples.renderCards(view);
    say("");
  }
  function systemActions(s, operatorAccount = null, workspace = false) {
    const actions = node("div", undefined, "manager-system-actions");
    const secondary = node("div", undefined, "manager-system-options");
    if (
      scope &&
      organizationDetail?.permissions.openWorkspace === false &&
      !operatorAccount
    ) {
      if (s.accessNote)
        actions.append(
          button(t("פרטי גישה", "Access Note"), () =>
            dialogs.info({
              title: t("פרטי גישה", "Access Note") + " · " + s.name,
              content: accessNoteContent(s.accessNote, language),
            }),
          ),
        );
      else
        actions.append(
          node("span", t("צפייה בלבד", "View only"), "manager-muted"),
        );
      return actions;
    }

    if (s.accessNote)
      secondary.append(
        button(t("פרטי גישה", "Access Note"), () =>
          dialogs.info({
            title: t("פרטי גישה", "Access Note") + " · " + s.name,
            content: accessNoteContent(s.accessNote, language),
          }),
        ),
      );

    if (!operatorAccount && !workspace)
      actions.append(
        button(
          t("פתיחת סביבת ניהול", "Open workspace"),
          () => openSystem(s),
          true,
        ),
      );
    if ((profile.account || examples.isSystem(s)) && !operatorAccount)
      secondary.append(
        button(t("שיוך לארגון", "Assign organization"), () => assignSystem(s)),
      );
    if (profile.account || operatorAccount || examples.isSystem(s)) {
      secondary.append(
        Object.assign(
          button(t("ניתוק מ־Manager", "Disconnect from Manager"), async () => {
            if (
              !(await confirmAction(
                t(
                  `לנתק את ${s.name} מ־Manager? הניהול המקומי ב־Bluetooth יישאר פעיל. שערים שמשויכים גם למערכות נוספות יישארו מחוברים דרכן.`,
                  `Disconnect ${s.name} from Manager? Local Bluetooth management stays available. Gates also used by other systems remain connected through them.`,
                ),
              ))
            )
              return;
            if (examples.isSystem(s)) {
              examples.disconnect(s);
              await showSystems(null);
              say(
                t(
                  "המערכת הוסרה מהסימולציה בלבד.",
                  "System removed from the simulation only.",
                ),
              );
              return;
            }
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
          { className: "manager-button manager-button-danger" },
        ),
      );
    }
    if ((workspace || operatorAccount) && secondary.childElementCount) {
      const menu = node("details", undefined, "manager-system-menu");
      menu.name = "manager-system-options";
      const trigger = node("summary");
      trigger.setAttribute(
        "aria-label",
        t("פעולות מערכת", "System actions") + " · " + s.name,
      );
      trigger.title = t("פעולות מערכת", "System actions");
      trigger.innerHTML =
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
      secondary.addEventListener("click", (event) => {
        if (event.target.closest("button")) menu.open = false;
      });
      menu.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          menu.open = false;
          trigger.focus();
        }
      });
      menu.append(trigger, secondary);
      actions.append(menu);
    }
    return actions;
  }
  async function assignSystem(system) {
    stop();
    view.replaceChildren(
      node("h3", t("שיוך מערכת לארגון", "Assign system to organization")),
    );
    const f = node("form", undefined, "manager-form"),
      label = node("label", t("ארגון", "Organization")),
      select = node("select");
    select.setAttribute("aria-label", t("ארגון", "Organization"));
    select.append(new Option(t("המערכות שלי בלבד", "My systems only"), ""));
    const simulated = examples.isSystem(system);
    if (simulated) appendSimulationNote();
    for (const org of simulated
      ? examples.organizations()
      : profile.organizations)
      select.append(new Option(org.name, org.id));
    select.value =
      (simulated ? examples.assignment(system) : system.orgId) ?? "";
    label.append(select);
    f.append(label);
    const b = button(
      t("שמירה", "Save"),
      async () => {
        if (simulated) {
          examples.assign(system, select.value || null);
          await openSystem(system);
          say(
            t(
              "השיוך נשמר בסימולציה בלבד.",
              "Assignment saved in the simulation only.",
            ),
          );
          return;
        }
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
      button(t("ביטול", "Cancel"), () =>
        simulated ? openSystem(system) : showSystems(scope),
      ),
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
        const count = node("p", undefined, "manager-org-count");
        count.append(
          node("b", String(org.linkedSystemCount)),
          node("span", t("מערכות מקושרות", "Linked systems")),
        );
        card.append(count);
        const actions = node("div", undefined, "manager-org-actions");
        actions.append(
          button(t("כניסה לארגון", "Open organization"), () =>
            showSystems(
              org.id,
              operator
                ? { id: org.owner?.id, email: org.name, orgId: org.id }
                : null,
            ),
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
                !(await confirmAction(
                  t(
                    'להסיר את הארגון "' +
                      org.name +
                      '" מ־Manager? יש לנתק שיוכי מערכות ומינויי מנהלים תחילה. ההיסטוריה נשמרת.',
                    'Remove organization "' +
                      org.name +
                      '" from Manager? Unassign systems and revoke administrator appointments first. History is retained.',
                  ),
                ))
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
      {
        onEmpty: () => {
          const copy = organizationsEmptyCopy(he ? "he" : "en");
          const empty = node(
            "section",
            undefined,
            "manager-empty manager-empty-systems manager-empty-organizations",
          );
          empty.append(node("h4", copy.title));
          if (!operator) empty.append(node("p", copy.description));
          columns.append(empty);
        },
      },
    );
    if (closed || epoch !== generation) return;
    if (personal || profile.role !== "admin")
      examples.renderOrganizationCard(view);
    if (profile.account || profile.role === "admin") {
      const createForCustomer = operator || !profile.account;
      const create = button(
        t("יצירת ארגון חדש", "Create new organization"),
        async () => {
          const requestId = crypto.randomUUID();
          const created = await dialogs.form({
            title: t("ארגון חדש", "New organization"),
            message: t(
              "שלושת הארגונים הראשונים חינם. מהארגון הרביעי, כל ארגון נוסף עולה $1 לחודש. התעריף מחושב לפי הארגונים שבבעלות הלקוח.",
              "Your first 3 organizations are free. From the fourth, each additional organization costs $1 per month. Pricing is based on the organizations owned by the customer.",
            ),
            fields: [
              ["name", t("שם ארגון חדש", "New organization name")],
              ...(createForCustomer
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
            submitLabel: t("יצירת ארגון", "Create organization"),
            errorText,
            onSubmit: async (values) => {
              await ensureRecent();
              await api(
                createForCustomer ? "/admin/organizations" : "/organizations",
                "POST",
                { ...values, name: values.name.trim(), requestId },
              );
            },
          });
          if (created && !closed && epoch === generation) {
            await refreshProfile();
            await showOrganizations(personal);
          }
        },
        true,
      );
      const heading = view.querySelector("h3");
      const bar = node("div", undefined, "manager-toolbar");
      heading.replaceWith(bar);
      bar.append(heading, create);
    }
    placeManagerActions(view, language);
  }
  async function showInvitations() {
    beginView("invitations");
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
    return showSystems(
      scope,
      managementMode && profile.role === "admin"
        ? {
            orgId: scope,
            email:
              profile.organizations.find((o) => o.id === scope)?.name ??
              t("ארגון", "Organization"),
          }
        : null,
    );
  }
  async function showAccounts(status = "active") {
    beginView("user");
    const epoch = generation;
    view.replaceChildren(
      node("h3", directoryLabel("user")),
      node("p", roleName("user"), "manager-view-description"),
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
              !(await confirmAction(
                t(
                  `לעדכן את הגישה של ${account.email}?`,
                  `Change access for ${account.email}?`,
                ),
              ))
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
    const create = button(
      t("הוספת לקוח", "Add customer"),
      async () => {
        const created = await dialogs.form({
          title: t("הוספת לקוח", "Add customer"),
          message: t(
            "הזינו כתובת אימייל מאומתת להפעלת חשבון WIFIGATE Manager user. אין דרישת תשלום או כרטיס בשלב זה.",
            "Enter a verified email address to enable a WIFIGATE Manager user account. No payment or card is required in this phase.",
          ),
          fields: [
            [
              "email",
              t("אימייל לקוח מאומת", "Verified customer email"),
              "email",
            ],
          ],
          submitLabel: t("הוספת לקוח", "Add customer"),
          errorText,
          onSubmit: async (values) => {
            await ensureRecent();
            await api("/admin/accounts", "POST", {
              ...values,
              status: "active",
            });
          },
        });
        if (created && !closed && epoch === generation) {
          await showAccounts(status);
          say(t("חשבון הלקוח הופעל.", "Customer account enabled."));
        }
      },
      true,
    );
    const heading = view.querySelector("h3");
    const bar = node("div", undefined, "manager-toolbar");
    heading.replaceWith(bar);
    bar.append(heading, create);
    placeManagerActions(view, language);
  }
  function appendSimulationNote() {
    view.dataset.simulation = "true";
    const note = node(
      "section",
      undefined,
      "manager-note manager-simulation-note",
    );
    note.setAttribute("role", "note");
    note.append(
      node(
        "strong",
        t("סימולציה · מערכת לדוגמה", "Simulation · example system"),
      ),
      node(
        "p",
        t(
          "זהו מסך הניהול של מערכת אמיתית, עם נתוני דוגמה. כל הפעולות והשינויים מתבצעים בסימולציה בזיכרון בלבד, ללא חיבור למערכת פיזית. הנתונים מתאפסים בסגירת הדשבורד.",
          "This is the real system workspace with sample data. All actions and changes run in memory only, without a physical connection. Sample data resets when the dashboard closes.",
        ),
      ),
    );
    view.prepend(note);
  }
  async function openSystem(system) {
    stop();
    currentSystem = system;
    const simulated = examples.isSystem(system);
    const epoch = generation;
    view.replaceChildren();
    if (simulated) appendSimulationNote();
    const head = node("div", undefined, "manager-workspace-head");
    head.append(
      node("h3", system.name),
      button(t("סיום וחזרה", "End and return"), () =>
        simulated ? exampleBack() : showSystems(scope),
      ),
    );
    head.append(systemActions(system, null, true));
    view.append(head);
    focusView();
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
  async function openGate(gate, preserveView = false) {
    dialogs.cancel();
    const previous = connection;
    const epoch = ++generation;
    activity.reset();
    say("");
    showConnectionState("waiting");
    const existingContent = view.querySelector("#manager-content");
    const existingTabs = view.querySelector("#manager-tabs");
    if (preserveView) {
      if (existingContent) existingContent.inert = true;
      if (existingTabs) existingTabs.inert = true;
    }
    // Wait for the old demand to be cancelled before claiming the gate again.
    await previous?.close();
    if (closed || epoch !== generation) return;
    currentGate = gate;
    if (!preserveView) {
      currentRows = [];
      cursor = null;
    }
    const options = {
      api,
      user,
      onState: (state) => {
        if (epoch !== generation) return;
        if (["waiting", "connecting", "active"].includes(state)) {
          showConnectionState(state);
          if (state === "active")
            say(
              examples.isSystem(currentSystem)
                ? t("מחובר · נתוני סימולציה", "Connected · simulation data")
                : t("מחובר · נתונים חיים מהשער", "Connected · live gate data"),
              false,
              "success",
            );
        } else if (state === "SECURE_SESSION_EXPIRED") {
          const readOnly =
            /^(ADMIN_(GET_|LIST_).+|ADMIN_PING|ADMIN_RF_GET)$/.test(
              candidate.pendingCommand ?? "",
            );
          const uncertain = candidate.transfer || (candidate.busy && !readOnly);
          // Let fail() close the old socket first. Never replay an in-flight
          // operation whose outcome may be unknown.
          queueMicrotask(() => {
            if (closed || epoch !== generation) return;
            if (!uncertain) {
              showConnectionState("connecting");
              void openGate(gate, true);
            } else {
              say(
                t(
                  "החיבור הסתיים במהלך פעולה. התחברו לשער ובדקו את התוצאה לפני ניסיון נוסף.",
                  "The connection ended during an operation. Reconnect and check its result before retrying.",
                ),
                true,
              );
              showConnectionState(
                "error",
                t(
                  "החיבור הסתיים במהלך פעולה. בדקו את התוצאה לפני ניסיון נוסף.",
                  "The connection ended during an operation. Check its result before retrying.",
                ),
              );
              view
                .querySelector("#manager-content")
                ?.replaceChildren(
                  button(t("חיבור מחדש לשער", "Reconnect to gate"), () =>
                    openGate(gate),
                  ),
                );
              view.querySelector("#manager-tabs")?.replaceChildren();
            }
          });
        } else {
          currentRows = [];
          currentData = undefined;
          showConnectionRecovery(gate);
          view.querySelector("#manager-tabs")?.replaceChildren();
          say(errorText(new Error(state)), true);
          showConnectionState("error", errorText(new Error(state)));
        }
      },
    };
    const candidate = examples.isSystem(currentSystem)
      ? examples.createConnection({
          system: currentSystem,
          onState: options.onState,
        })
      : new Connection(options);
    connection = candidate;
    let pendingOperations = 0;
    for (const method of ["command", "exportCollection", "importCollection"]) {
      if (typeof candidate[method] !== "function") continue;
      const run = candidate[method].bind(candidate);
      candidate[method] = (...args) =>
        activity.track(
          method === "exportCollection"
            ? t("מייצא נתונים מהמערכת…", "Exporting system data…")
            : method === "importCollection"
              ? t("מייבא ומאמת נתונים…", "Importing and verifying data…")
              : /^(ADMIN_(GET_|LIST_).+|ADMIN_PING|ADMIN_RF_GET)$/.test(args[0])
                ? t("טוען נתונים מהמערכת…", "Loading system data…")
                : t(
                    "שולח פעולה וממתין לאישור המערכת…",
                    "Sending the action and waiting for system confirmation…",
                  ),
          async () => {
            pendingOperations++;
            const contents = [
              view.querySelector("#manager-content"),
              view.querySelector("#manager-tabs"),
            ];
            contents.forEach((element) => {
              if (element) element.inert = true;
            });
            try {
              const result = await run(...args);
              if (closed || epoch !== generation || connection !== candidate)
                throw new Error("CANCELLED");
              return result;
            } catch (error) {
              if (closed || epoch !== generation || connection !== candidate)
                throw new Error("CANCELLED");
              throw error;
            } finally {
              pendingOperations--;
              if (epoch === generation && connection === candidate)
                contents.forEach((element) => {
                  if (element) element.inert = pendingOperations > 0;
                });
            }
          },
        );
    }
    try {
      await activity.track(
        t(
          "מתחבר למערכת… אפשר לסיים ולחזור בכל רגע.",
          "Connecting to the system… You can end and return at any time.",
        ),
        () => candidate.open(gate),
      );
      if (epoch !== generation) {
        candidate.close();
        return;
      }
      renderTabs();
      if (!preserveView) await showTab("overview");
      else if (!existingContent?.childElementCount) await showTab(currentTab);
    } catch (error) {
      if (epoch === generation) {
        connection?.close();
        showConnectionRecovery(gate);
        say(errorText(error), true);
        showConnectionState("error", errorText(error));
      }
    } finally {
      if (epoch === generation) {
        if (existingContent) existingContent.inert = false;
        if (existingTabs) existingTabs.inert = false;
      }
    }
  }
  function showConnectionState(state, detail) {
    const simulated = examples.isSystem(currentSystem);
    let panel = view.querySelector(".manager-connection-panel");
    if (!panel) {
      panel = node("section", undefined, "manager-connection-panel");
      panel.setAttribute("role", "status");
      panel.setAttribute("aria-live", "polite");
      view.insertBefore(panel, view.querySelector("#manager-tabs"));
    }
    panel.dataset.state = state;
    const labels = {
      waiting: [
        t("ממתינים למערכת", "Waiting for the system"),
        t(
          "ממתינים לזמינות המערכת. ההמתנה עשויה להימשך עד כדקה וחצי, בהתאם לתקשורת. אפשר לסיים ולחזור.",
          "Waiting for the system to become available. This can take up to about 90 seconds, depending on connectivity. You can end and return.",
        ),
      ],
      connecting: [
        t("מקימים חיבור מאובטח", "Establishing a secure connection"),
        t(
          "המערכת זמינה. מאמתים את החיבור לפני טעינת הנתונים.",
          "The system is available. Verifying the connection before loading data.",
        ),
      ],
      active: [
        t("המערכת מחוברת", "System connected"),
        t(
          simulated
            ? "הסימולציה פעילה. הנתונים והפעולות הם לדוגמה בלבד."
            : "החיבור המאובטח פעיל. הנתונים והפעולות מתקבלים מהמערכת עצמה.",
          simulated
            ? "Simulation is active. Data and confirmations are examples only."
            : "The secure connection is active. Data and confirmations come from the system itself.",
        ),
      ],
      error: [
        t("לא ניתן להשלים את החיבור", "Connection could not complete"),
        detail,
      ],
    };
    const [label, description] = labels[state];
    const marker = node(
      "span",
      state === "active" ? "✓" : state === "error" ? "!" : "",
      state === "active" || state === "error"
        ? "manager-connection-marker"
        : "manager-spinner",
    );
    marker.setAttribute("aria-hidden", "true");
    const copy = node("div");
    copy.append(node("strong", label), node("p", description));
    const steps = node("ol", undefined, "manager-connection-steps");
    for (const [index, text] of [
      t("המתנה", "Waiting"),
      t("אימות חיבור", "Verification"),
      t("מחובר", "Connected"),
    ].entries()) {
      const step = node("li", text);
      const current = ["waiting", "connecting", "active"].indexOf(state);
      step.dataset.state =
        current > index
          ? "complete"
          : current === index
            ? "current"
            : "pending";
      if (current === index) step.setAttribute("aria-current", "step");
      steps.append(step);
    }
    panel.replaceChildren(marker, copy, steps);
  }
  function showConnectionRecovery(gate) {
    dialogs.cancel();
    const card = node("section", undefined, "manager-connection-recovery");
    card.append(
      node("h3", t("החיבור למערכת הופסק", "Connection interrupted")),
      node(
        "p",
        t(
          "אפשר להתחבר מחדש ולקרוא את המצב העדכני. אם שלחתם שינוי, בדקו אם הוא נשמר לפני שליחתו שוב.",
          "Reconnect to read the current state. If you sent a change, check whether it was saved before sending it again.",
        ),
      ),
      button(
        t("חיבור מחדש לשער", "Reconnect to gate"),
        () => openGate(gate),
        true,
      ),
    );
    view.querySelector("#manager-content")?.replaceChildren(card);
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
      systemName: t("שם מערכת", "System name"),
      firmwareVersion: t("גרסת קושחה", "Firmware version"),
      flashVariantMb: t("נפח Flash (MB)", "Flash capacity (MB)"),
      targetChip: t("דגם מעבד", "Processor"),
      uptimeSec: t("זמן פעילות (שניות)", "Uptime (seconds)"),
      counts: t("כמויות", "Counts"),
      health: t("תקינות", "Health"),
      historyAvailable: t("היסטוריה זמינה", "History available"),
      events: t("אירועים", "Events"),
      clock: t("שעון מערכת", "System clock"),
      credentialReplicasHealthy: t(
        "תקינות עותקי הרשאות",
        "Credential replicas healthy",
      ),
      littleFs: t("אחסון פנימי", "Internal storage"),
      sd: t("כרטיס זיכרון", "Memory card"),
      history: t("היסטוריה", "History"),
      mounted: t("מחובר", "Mounted"),
      supported: t("נתמך", "Supported"),
      writable: t("ניתן לכתיבה", "Writable"),
      totalBytes: t("נפח כולל (בתים)", "Total capacity (bytes)"),
      usedBytes: t("נפח בשימוש (בתים)", "Used capacity (bytes)"),
      freeBytes: t("נפח פנוי (בתים)", "Free capacity (bytes)"),
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
              !(await confirmAction(
                t(
                  `למחוק את ${r.name} מהשער?`,
                  `Delete ${r.name} from the gate?`,
                ),
              ))
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
      state = await dialogs.chooseState();
      if (!["ON", "OFF"].includes(state)) return;
    }
    if (
      !(await confirmAction(
        t(
          `לפתוח את ${currentSystem.name} (${currentGate}) עכשיו?`,
          `Open ${currentSystem.name} (${currentGate}) now?`,
        ),
      ))
    )
      return;
    await connection.command("ADMIN_REMOTE_OPEN", {
      mode: "METHOD",
      ...(state ? { state } : {}),
      expectedGateCommand: expected,
    });
    say(
      examples.isSystem(currentSystem)
        ? t(
            "הפעולה בוצעה בסימולציה. לא הופעל שער פיזי.",
            "Action completed in the simulation. No physical gate was activated.",
          )
        : t("השער אישר את הפעולה.", "The gate confirmed the action."),
    );
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
          !(await confirmAction(
            t(
              "הייבוא יחליף את כל הרשומות בקבוצה זו. להמשיך לבדיקת הקובץ?",
              "Import will replace every record in this collection. Continue to validation?",
            ),
          ))
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
          async (v) =>
            await confirmAction(
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
          if (!(await confirmAction(t("לשמור בשער?", "Save on the gate?"))))
            return;
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
      if (
        !(await confirmAction(
          t("לשנות את הגדרות השער?", "Change gate settings?"),
        ))
      )
        return;
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
          if (
            !(await confirmAction(t("למחוק את האירוע?", "Delete this event?")))
          )
            return;
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
        if (
          !(await confirmAction(
            t("לשמור את האירוע בשער?", "Save the event on the gate?"),
          ))
        )
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
            !(await confirmAction(
              t(
                "נדרש אדם ליד השער שילחץ על השלט. להתחיל?",
                "A person at the gate must press the remote. Start?",
              ),
            ))
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
    await changeManagement(managementMode, false);
  });
  return {
    ready,
    setManagement: (enabled) => {
      if (!profile) {
        managementMode = enabled;
        return Promise.resolve();
      }
      return task(() => changeManagement(enabled, false));
    },
    close() {
      closed = true;
      stop();
      activity.close();
      examples.close();
      root.replaceChildren();
    },
  };
}
