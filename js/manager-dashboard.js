import { renderManagerOrganization } from "./manager-organization.js";
import { createManagerOrganizationPicker } from "./manager-organization-picker.js";
import { organizeManagerPeople } from "./manager-people-workspace.js";
import { renderManagerHistoryDays, renderManagerHistoryRecords } from "./manager-history-workspace.js";
import { createManagerSetupGuide } from "./manager-setup-guide.js";
import { createManagerOrganizationCard } from "./manager-organization-card.js";
import { createPersonalOrganizationPage } from "./manager-organization-list.js";
import {
  systemsEmptyCopy,
  organizationsEmptyCopy,
} from "./systems-empty-copy.js";
import { attachPopover } from "./popover.js";
import { accessNoteContent } from "./manager-access-note.js";
import { createSystemIcon } from "./wifigate-system-icons.js";
import { createManagerDialog } from "./manager-dialog.js";
import { placeManagerActions } from "./manager-action-layout.js";
import { encodeManagerCsv } from "./manager-csv.js";
import { createManagerCsvDialog } from "./manager-csv-dialog.js";
import { renderManagerSettings } from "./manager-settings.js";
import { createManagerEvents } from "./manager-events.js";
import { formatManagerBytes, managerRfDetails, managerSdDetails, managerMaximumUsers } from "./manager-device-details.js";
import { managerRequest } from "./api/index.js";
import { ManagerConnection } from "./manager-connection.js";
import { createManagerExamples } from "./manager-examples.js";
import { createManagerSystemCard } from "./manager-system-card.js";
import { createManagerActivity } from "./manager-activity.js";
import { createManagerConnectionDialog } from "./manager-connection-dialog.js";
import { managerConnectionError } from "./manager-connection-errors.js";
import { managerRequestedTiming } from "./manager-connection-timing.js";
import { createManagerControlHeader, createManagerGatePicker, setManagerControlState, updateManagerSelectedGate, renderManagerControlOverview } from "./manager-control-workspace.js";

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
  let organizationPicker;
  const organizationIdentities = new Map();
  let managementMode = management;
  let initializing = true;
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
  let cancellationBarrier, interruptedConnection, workspaceReturn;
  let workspacePanel, workspacePanelContext, tabGeneration = 0, systemOverview;
  let connectionFailureVersion = 0;
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
  const connectionDialog = createManagerConnectionDialog({
    language,
    onClose: () => activity.pause(false),
  });
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
        // A cancelled creator still needs its requestId to cancel server-side
        // demand. ManagerConnection fences the response before any relay use.
        if ((closed || epoch !== generation) && !(path === "/connection-requests" && method === "POST")) throw new Error("CANCELLED");
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
  platformEntry.title = t("ניהול פלטפורמה", "Platform management");
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
    dialogs,
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
  const errorText = (error) => {
    const explanation = managerConnectionError(error, language);
    if (explanation) return [explanation.message, ...explanation.steps].join(" ");
    return ({
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
      INVALID_ORGANIZATION_LOGO: t(
        "לא ניתן לעבד את הלוגו. בחרו תמונת PNG, JPG או WebP בגודל של עד 5 MB.",
        "This logo could not be processed. Choose a PNG, JPG or WebP image up to 5 MB.",
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
  };
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
  const csvDialog = createManagerCsvDialog({ language, errorText });
  async function task(action, b) {
    if (b?.disabled) return;
    const restoreFocus = b && document.activeElement === b;
    if (b) {
      b.disabled = true;
      b.setAttribute("aria-busy", "true");
      b.classList.add("is-loading");
    }
    const writesBefore = successfulWrites;
    const failureBefore = connectionFailureVersion;
    try {
      await action();
      if (!closed && failureBefore === connectionFailureVersion && successfulWrites > writesBefore && !status.textContent)
        say(
          t("השינויים נשמרו בהצלחה.", "Changes saved successfully."),
          false,
          "success",
        );
    } catch (error) {
      if (!closed && error.message !== "CANCELLED" && failureBefore === connectionFailureVersion)
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
        if (restoreFocus && b.isConnected && !document.querySelector("dialog[open]") &&
          [document.body, b].includes(document.activeElement)) b.focus({ preventScroll: true });
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
    interruptedConnection = undefined;
    workspacePanel?.dispose();
    workspacePanel = undefined;
    workspacePanelContext = undefined;
    csvDialog.cancel();
    systemOverview = undefined;
    tabGeneration++;
    connectionDialog.close();
    activity.reset();
    countsPopover?.close();
    countsPopover = null;
    dialogs.cancel();
    examples.closeView();
    view.classList.remove("manager-example-workspace", "manager-control-workspace");
    delete view.dataset.systemType;
    if (status.parentNode !== main) main.insertBefore(status, retry);
    delete view.dataset.simulation;
    generation++;
    say("");
    if (connection) cancellationBarrier = Promise.resolve(connection.close()).catch(() => {});
    connection = null;
    currentRows = [];
    currentData = undefined;
    cursor = null;
  }
  function renderNav() {
    organizationPicker?.destroy();
    organizationPicker = undefined;
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
      organizationPicker = createManagerOrganizationPicker({
        organizations: profile.organizations.map(org => ({ ...org, ...organizationIdentities.get(org.id), role: org.role })),
        selectedId: scope,
        language,
        onSelect: id => task(() => showSystems(id)),
      });
      nav.append(organizationPicker.root);
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
        const home = node("a", undefined, "manager-platform-home");
        home.href = "/dashboard/manager/platform/" + (he ? "?lang=he" : "");
        home.setAttribute("aria-label", t("ניהול פלטפורמה", "Platform management"));
        home.title = t("מעבר לסקירה הכללית", "Open the platform overview");
        if (currentView === "overview") home.setAttribute("aria-current", "page");
        const homeIcon = node("span", undefined, "manager-platform-home-icon");
        homeIcon.append(overviewIcon("overview"));
        const homeText = node("div", undefined, "manager-platform-home-text");
        homeText.append(
          node("h2", t("ניהול פלטפורמה", "Platform management"), "manager-platform-title"),
          node("span", currentView === "overview" ? t("סקירה כללית", "Platform overview") : t("חזרה לסקירה הכללית", "Back to platform overview"), "manager-platform-home-caption"),
        );
        home.append(homeIcon, homeText);
        home.addEventListener("click", event => {
          if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          void task(showOverview);
        });
        platformHeader.append(
          back,
          node("span", "WIFIGATE Manager admin", "manager-role-badge"),
          home,
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
          ["admin", directoryLabel("admin"), () => showDirectory("admin")],
          ["user", directoryLabel("user"), () => showAccounts()],
          ["organizations", t("ארגונים", "Organizations"), showOrganizations],
        ]) {
          const b = button(label, action);
          const icon = node("span", undefined, "manager-platform-section-icon");
          icon.append(overviewIcon(key === "admin" ? "admins" : key === "user" ? "users" : "organizations"));
          b.replaceChildren(icon, node("span", label));
          if (
            currentView === key ||
            (currentView === "platform-systems" && key === (scope ? "organizations" : "user"))
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
  async function openExampleOrganization(organizationId) {
    stop();
    scope = null;
    currentView = "example-organization";
    renderNav();
    say("");
    await examples.renderOrganization(view, {
      organizationId,
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
        overview: "M3 10 12 3l9 7M5 9v12h14V9M9 21v-7h6v7",
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
    // Keep the initial page load neutral; move focus only on later view changes.
    if (initializing) return;
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
  async function pagedView(path, container, render, { onEmpty, onPage, loadPage = api } = {}) {
    const epoch = generation;
    let next = null;
    const more = button(t("הצגת עוד", "Show more"), load);
    const seen = new Set();
    async function load() {
      const result = await loadPage(
        path +
          (path.includes("?") ? "&" : "?") +
          "limit=25" +
          (next ? "&cursor=" + encodeURIComponent(next) : ""),
      );
      if (closed || epoch !== generation) return;
      more.remove();
      for (const row of result.items) container.append(render(row));
      onPage?.();
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
    heading.append(node("h3", t("תמונת מצב", "At a glance")), info, help);
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
          Number.isSafeInteger(totals[key]) && totals[key] >= 0 ? String(totals[key]) : t("לא זמין", "Unavailable"),
        ),
        node("span", cta + (he ? " ←" : " →"), "manager-overview-cta"),
      );
      grid.append(card);
    }
    view.append(grid);
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
      if (organizationDetail?.organization && !operatorAccount) {
        organizationIdentities.set(scope, organizationDetail.organization);
        renderNav();
      }
    }

    const bar = node("div", undefined, "manager-toolbar");
    if (scope) bar.dataset.organizationSection = "systems";
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
    if (!scope && !operatorAccount) {
      view.prepend(createManagerSetupGuide(language));
      examples.renderCards(view);
    }
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
    if (personal || profile.role !== "admin") await refreshProfile();
    if (closed || epoch !== generation) return;
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
        if (!operator) organizationIdentities.set(org.id, org);
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
        return createManagerOrganizationCard({ organization: org, language, actions });
      },
      {
        onPage: renderNav,
        loadPage: operator ? api : createPersonalOrganizationPage({
          request: api,
          organizations: profile.organizations,
          hasAccount: Boolean(profile.account),
          isCurrent: () => !closed && epoch === generation,
        }),
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
    const explanation = node("details", undefined, "manager-simulation-explanation");
    explanation.append(
      node("summary", t("איך הסימולציה עובדת?", "How does the simulation work?")),
      node("p", t(
        "זהו מסך הניהול של מערכת אמיתית, עם נתוני דוגמה. כל הפעולות והשינויים מתבצעים בסימולציה בזיכרון בלבד, ללא חיבור למערכת פיזית. הנתונים מתאפסים בסגירת הדשבורד.",
        "This is the real system workspace with sample data. All actions and changes run in memory only, without a physical connection. Sample data resets when the dashboard closes.",
      )),
    );
    note.append(
      node(
        "strong",
        t("סימולציה · מערכת לדוגמה", "Simulation · example system"),
      ),
      node(
        "p",
        t(
          "אפשר להתנסות בכלי הניהול. הפעולות כאן אינן מפעילות שער פיזי.",
          "Explore the management tools. Actions here do not operate a physical gate.",
        ),
      ),
      explanation,
    );
    view.prepend(note);
  }
  async function openSystem(system) {
    const simulated = examples.isSystem(system);
    const originScope = scope;
    const returnToOrigin = simulated && exampleBack
      ? exampleBack
      : () => showSystems(originScope);
    stop();
    workspaceReturn = returnToOrigin;
    currentSystem = system;
    const epoch = generation;
    view.replaceChildren();
    view.classList.add("manager-control-workspace");
    view.dataset.systemType = system.type;
    if (simulated) appendSimulationNote();
    const head = createManagerControlHeader({ system, language,
      returnButton: button(t("סיום וחזרה", "End and return"), returnToOrigin),
      actions: systemActions(system, null, true),
    });
    head.querySelector(".manager-workspace-heading").append(status);
    view.prepend(head);
    focusView();
    if (system.systemIds.length > 1) {
      view.append(createManagerGatePicker({ system, language,
        onChange: gate => void task(() => openGate(gate)),
      }));
    }
    const tabs = node("div", undefined, "manager-tabs"),
      content = node("div");
    tabs.id = "manager-tabs";
    content.id = "manager-content";
    content.setAttribute("role", "tabpanel");
    content.tabIndex = 0;
    view.append(tabs, content);
    await ensureRecent();
    if (epoch === generation) await openGate(system.systemIds[0]);
  }
  async function openGate(gate, preserveView = false) {
    interruptedConnection = undefined;
    dialogs.cancel();
    csvDialog.cancel();
    const previous = connection;
    const epoch = ++generation;
    activity.reset();
    say("");
    const returnFocus = view.querySelector(".manager-workspace-head h3");
    if (returnFocus) returnFocus.tabIndex = -1;
    const returnToOrigin = workspaceReturn;
    const returnFromConnection = () => {
      if (!closed && epoch === generation) void task(returnToOrigin);
    };
    const openConnectionDialog = () => {
      connectionDialog.open({
        systemName: currentSystem.name,
        gate,
        simulation: examples.isSystem(currentSystem),
        returnFocus,
        onCancel: returnFromConnection,
        onDismiss: returnFromConnection,
        onRetry: () => {
          if (epoch === generation) void task(() => openGate(gate, preserveView));
        },
      });
      activity.pause(true);
    };
    let failureShown = false, workspaceReady = false;
    const failConnection = (error) => {
      if (closed || epoch !== generation || failureShown) return;
      failureShown = true;
      connectionFailureVersion++;
      currentRows = [];
      currentData = undefined;
      showConnectionRecovery(gate);
      view.querySelector("#manager-tabs")?.replaceChildren();
      say("");
      // Established sessions can fail after the success dialog has closed.
      // Reopen the same connection UI, while reporting each attempt only once.
      if (!connectionDialog.active || connectionDialog.state === "complete") {
        connectionDialog.close();
        openConnectionDialog();
        connectionDialog.setStage(workspaceReady ? "loading" : "connecting");
      }
      showConnectionState("error", managerConnectionError(error, language, true));
    };
    openConnectionDialog();
    showConnectionState("waiting");
    const existingContent = view.querySelector("#manager-content");
    const existingTabs = view.querySelector("#manager-tabs");
    if (preserveView) {
      if (existingContent) existingContent.inert = true;
      if (existingTabs) existingTabs.inert = true;
    }
    // Wait for the old demand to be cancelled before claiming the gate again.
    try {
      await previous?.close();
      await cancellationBarrier;
    } catch (error) {
      failConnection(error);
      return;
    }
    if (closed || epoch !== generation) return;
    currentGate = gate;
    updateManagerSelectedGate(view, gate, null, language);
    if (!preserveView) {
      currentRows = [];
      cursor = null;
    }
    const options = {
      api,
      user,
      timingVersion: managerRequestedTiming(profile),
      onTiming: timing => {
        if (closed || epoch !== generation || failureShown) return;
        connectionDialog.setTiming(timing);
      },
      onState: (state) => {
        if (closed || epoch !== generation || failureShown) return;
        if (["waiting", "connecting", "active"].includes(state)) {
          showConnectionState(state);
        } else if (state === "SECURE_SESSION_EXPIRED") {
          const readOnly =
            /^(ADMIN_(GET_|LIST_).+|ADMIN_PING|ADMIN_RF_GET)$/.test(
              candidate.pendingCommand ?? "",
            );
          const uncertain = candidate.transfer || (candidate.busy && !readOnly);
          // Let fail() close the old socket first. Never replay an in-flight
          // operation whose outcome may be unknown.
          queueMicrotask(() => {
            if (closed || epoch !== generation || failureShown) return;
            if (!uncertain) {
              showConnectionState("connecting");
              void openGate(gate, true);
            } else {
              failConnection(new Error(state));
            }
          });
        } else {
          failConnection(new Error(state));
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
              if (closed || epoch !== generation || connection !== candidate || failureShown)
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
      if (epoch !== generation || failureShown) {
        candidate.close();
        return;
      }
      // Read-only channel renewal keeps the current draft, but every new
      // operation must use the replacement authenticated transport. Pending
      // confirmations were cancelled above; uncertain writes are never retried.
      if (preserveView && workspacePanelContext) {
        workspacePanelContext.source = candidate;
        workspacePanelContext.epoch = epoch;
      }
      renderTabs();
      if (!preserveView) await showTab("overview");
      else if (!existingContent?.childElementCount) await showTab(currentTab);
      else if (currentTab === "auto") await showTab("auto");
      if (
        epoch === generation &&
        connection === candidate &&
        candidate.session
      ) {
        workspaceReady = true;
        connectionDialog.complete();
        setManagerControlState(view, examples.isSystem(currentSystem) ? "simulation" : "connected", language);
        say("");
      }
    } catch (error) {
      if (epoch === generation) {
        connection?.close();
        failConnection(error);
      }
    } finally {
      if (epoch === generation) {
        if (existingContent) existingContent.inert = false;
        if (existingTabs) existingTabs.inert = false;
      }
    }
  }
  function showConnectionState(state, detail) {
    setManagerControlState(view, state === "active" ? "loading" : state, language);
    if (state === "error") connectionDialog.fail(detail);
    else connectionDialog.setStage(state === "active" ? "loading" : state);
  }
  function showConnectionRecovery(gate) {
    workspacePanel?.dispose();
    workspacePanel = undefined;
    workspacePanelContext = undefined;
    csvDialog.cancel();
    dialogs.cancel();
    const card = node("section", undefined, "manager-connection-recovery");
    card.append(
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
      const b = button(t(...label), async () => {
        await showTab(id);
        const active = view.querySelector(`#manager-tab-${id}`);
        if (currentTab === id && active && !active.inert) {
          active.focus({ preventScroll: true });
          active.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
      });
      b.id = `manager-tab-${id}`;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", String(id === currentTab));
      b.setAttribute("aria-controls", "manager-content");
      b.tabIndex = id === currentTab ? 0 : -1;
      b.dataset.tab = id;
      b.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const entries = [...tabs.querySelectorAll('[role="tab"]')];
        const index = entries.indexOf(b);
        const direction = (event.key === "ArrowRight" ? 1 : -1) * (he ? -1 : 1);
        const next = event.key === "Home" ? entries[0] : event.key === "End" ? entries.at(-1) : entries[(index + direction + entries.length) % entries.length];
        entries.forEach(entry => entry.tabIndex = entry === next ? 0 : -1);
        next.focus({ preventScroll: true });
        next.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
      tabs.append(b);
    }
    view.querySelector("#manager-content")?.setAttribute("aria-labelledby", `manager-tab-${currentTab}`);
  }
  async function showTab(tab, more = false) {
    if (!connection?.session) throw new Error("DISCONNECTED");
    workspacePanel?.dispose();
    workspacePanel = undefined;
    workspacePanelContext = undefined;
    csvDialog.cancel();
    const panelEpoch = ++tabGeneration;
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
        tabGeneration !== panelEpoch ||
        currentTab !== tab ||
        !source.session
      )
        throw new Error("CANCELLED");
      currentData = r.data;
      systemOverview = r.data;
      const maximum = managerMaximumUsers(source.capabilities?.data, r.data);
      updateManagerSelectedGate(view, currentGate, r.data?.systemName, language);
      const details = renderManagerControlOverview({ content, system: currentSystem, overview: r.data, maximum, language,
        openButton: button(t("פתיחת שער", "Open gate"), openGateAction, true),
      });
      renderFacts(details, { ...r.data, ...(maximum !== null && maximum !== undefined ? { maxUsers: maximum } : {}) });
      details.querySelector(".manager-facts").className = "manager-detail-facts";
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
    if (tab === "users" || tab === "admins") {
      renderPeopleActions(content, tab);
      return;
    }
    if (tab === "settings") renderSettings(content);
    if (tab === "events") renderEventActions(content);
    if (tab === "auto") {
      renderAutoActions(content);
      await renderAutoUsers(content);
    }
    placeManagerActions(content, language);
  }
  async function showRead(content, cmd, payload, key, more) {
    const source = connection,
      epoch = generation,
      panelEpoch = tabGeneration,
      tab = currentTab;
    const r = await source.command(cmd, payload);
    if (
      connection !== source ||
      generation !== epoch ||
      tabGeneration !== panelEpoch ||
      currentTab !== tab ||
      !source.session
    )
      throw new Error("CANCELLED");
    currentData = r.data;
    if (cmd === "ADMIN_GET_GATE_CONFIG") return;
    if (cmd === "ADMIN_GET_AUTO_OPEN_CONFIG") {
      renderFacts(content, { enabled: r.data?.config?.enabled });
      return;
    }
    if (cmd === "ADMIN_GET_STORAGE_HEALTH") {
      renderStorageDetails(content, r.data);
      return;
    }
    if (cmd === "ADMIN_RF_GET") {
      renderRemoteDetails(content, r.data);
      return;
    }
    if (cmd === "ADMIN_LIST_EVENTS") {
      return;
    }
    if (cmd === "ADMIN_LIST_HISTORY" && Array.isArray(r.data.days)) {
      renderManagerHistoryDays(content, {
        days: r.data.days, language, guests: tab === "guests", more, createButton: button,
        onDay: day => showRead(content, cmd, { dayKey: day, page: { limit: 20, cursor: null } }, "items", false),
        moreButton: r.data.page?.nextCursor ? button(t("ימים נוספים", "More days"), () =>
          showRead(content, cmd, { dayKey: null, page: { limit: 20, cursor: r.data.page.nextCursor } }, "items", true)) : undefined,
      });
      return;
    }
    const rows = key ? r.data?.[key] : null;
    if (Array.isArray(rows)) {
      currentRows = more ? [...currentRows, ...rows] : rows;
      cursor = r.data.page?.nextCursor ?? r.data.page?.cursor ?? null;
      if (cmd === "ADMIN_LIST_HISTORY") {
        const visibleRows = currentRows.filter(row => tab !== "guests" || row[7] === 3);
        renderManagerHistoryRecords(content, {
          rows: visibleRows, language, guests: tab === "guests", day: payload.dayKey,
          backButton: button(t("חזרה לימים", "Back to days"), () => showTab(tab)),
          exportButton: button(t("ייצוא הנתונים המוצגים", "Export displayed data"), () => exportRows(visibleRows)),
          moreButton: cursor ? button(t("טען עוד", "Load more"), () =>
            showRead(content, cmd, { ...payload, page: { ...payload.page, cursor } }, key, true)) : undefined,
        });
        return;
      } else renderTable(content, currentRows);
      if (cursor) {
        const loadMore = button(t("טען עוד", "Load more"), () =>
            cmd === "ADMIN_LIST_HISTORY"
              ? showRead(
                  content,
                  cmd,
                  { ...payload, page: { ...payload.page, cursor } },
                  key,
                  true,
                )
              : showTab(currentTab, true),
          );
        loadMore.dataset.peopleAction = "more";
        content.append(loadMore);
      }
      const displayed = button(t("ייצוא הנתונים המוצגים", "Export displayed data"), () =>
          exportRows(currentRows),
        );
      displayed.dataset.peopleAction = "displayed";
      content.append(displayed);
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
      maxUsers: t("מספר משתמשים מרבי", "Maximum users"),
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
      totalBytes: t("נפח כולל", "Total capacity"),
      usedBytes: t("נפח בשימוש", "Used capacity"),
      freeBytes: t("נפח פנוי", "Free capacity"),
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
        if (/secret|credential|private|password|passphrase|flashVariantMb|boardMb/i.test(key))
          continue;
        if (v && typeof v === "object" && !Array.isArray(v)) {
          add(v, prefix + (names[key] ?? key) + " · ");
          continue;
        }
        grid.append(
          node("dt", prefix + (names[key] ?? key)),
          node(
            "dd",
            /Bytes$/.test(key) && typeof v === "number"
              ? formatManagerBytes(v, language)
              : typeof v === "boolean"
              ? v
                ? t("כן", "Yes")
                : t("לא", "No")
              : Array.isArray(v)
                ? v.length
                : String(v ?? t("לא זמין", "Unavailable")),
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
            const details = f.closest(".manager-people-editor");
            if (details) {
              details.open = true;
              details.querySelector("summary").textContent = currentTab === "users"
                ? t("עריכת משתמש", "Edit user") : t("עריכת מנהל", "Edit administrator");
            }
            f.elements.name.focus({ preventScroll: true });
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
    content.lastElementChild.dataset.peopleAction = "all";
    content.append(button(t("ייבוא CSV", "Import CSV"), async () => {
      const source = connection, epoch = generation, panel = tabGeneration;
      const alive = () => source === connection && epoch === generation && panel === tabGeneration && source.session && !closed;
      const result = await csvDialog.open({
        collection,
        capacity: source.capabilities?.data?.limits?.[tab === "users" ? "maxUsers" : "maxAdmins"],
        systemName: currentSystem.name,
        onImport: async ({ mode, rows, confirmCommit, onProgress }) => {
          if (!alive()) throw new Error("CANCELLED");
          const revision = (await source.command(tab === "users" ? "ADMIN_LIST_USERS" : "ADMIN_LIST_ADMINS", { page: { cursor: null, limit: 1 }, query: "" })).data.revision;
          if (!alive()) throw new Error("CANCELLED");
          return source.importCollection(collection, mode, rows, revision,
            value => alive() ? confirmCommit(value) : false, onProgress);
        },
      });
      if (!alive()) return;
      if (!result.cancelled) await showTab(tab);
    }));
    content.lastElementChild.dataset.peopleAction = "import";
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
      editor.elements[key].defaultValue = "0";
      editor.elements[key].min = "0";
      editor.elements[key].max =
        key === "parkingNumber" ? "4294967295" : "65535";
    }
    for (const key of ["countryCode", "localNumber"]) {
      editor.elements[key].type = "tel";
      editor.elements[key].inputMode = "numeric";
      editor.elements[key].dir = "ltr";
    }
    editor.elements.countryCode.placeholder = "972";
    editor.elements.localNumber.placeholder = "501234567";
    editor.elements.email.dir = "ltr";
    organizeManagerPeople(content, { language, tab, rows: currentRows, editor });
  }
  function renderSettings(content) {
    const context = { source: connection, epoch: generation, panel: tabGeneration };
    workspacePanelContext = context;
    const alive = () => context === workspacePanelContext && context.source === connection && context.epoch === generation && context.panel === tabGeneration && context.source.session && !closed;
    workspacePanel = renderManagerSettings({
      root: content, language, config: currentData.config, revision: currentData.revision,
      commandLocked: currentSystem.type === "dual-control", confirm: confirmAction, errorText, isCurrent: alive,
      onSave: async payload => {
        if (!alive()) throw new Error("CANCELLED");
        const source = context.source;
        await source.command("ADMIN_SET_GATE_CONFIG", payload);
        if (alive() && source === context.source) { await showTab("settings"); say(t("ההגדרות נשמרו בשער.", "Settings saved on the gate."), false, "success"); }
      },
    });
  }
  function renderEventActions(content) {
    const context = { source: connection, epoch: generation, panel: tabGeneration };
    workspacePanelContext = context;
    const alive = () => context === workspacePanelContext && context.source === connection && context.epoch === generation && context.panel === tabGeneration && context.source.session && !closed;
    workspacePanel = createManagerEvents({
      root: content, language, table: currentData, maxEvents: connection.capabilities?.data?.limits?.maxEvents,
      clock: systemOverview?.clock, confirm: confirmAction, errorText, isCurrent: alive,
      command: async (name, payload) => {
        if (!alive()) throw new Error("CANCELLED");
        const source = context.source;
        const result = await source.command(name, payload);
        if (!alive() || source !== context.source) throw new Error("CANCELLED");
        return result;
      },
      onTableChanged: table => { if (alive()) currentData = table; },
    });
  }
  function detailCard(title, description, facts) {
    const card = node("section", undefined, "manager-device-card");
    card.append(node("h3", title));
    if (description) card.append(node("p", description, "manager-supporting-copy"));
    const list = node("dl", undefined, "manager-device-facts");
    for (const [label, value] of facts) {
      const term = node("dd", value ?? t("לא דווח על ידי המערכת", "Not reported by the system"));
      if (typeof value === "string" && /^(?:0x|[\d.,]+ (?:B|KB|MB|GB|TB)$)/.test(value)) term.dir = "ltr";
      list.append(node("dt", label), term);
    }
    card.append(list); return card;
  }
  function renderRemoteDetails(content, data) {
    const remote = managerRfDetails(data);
    content.append(detailCard(t("השלט השמור במערכת", "Saved remote"),
      t("לימוד שלט מתבצע באפליקציה ליד המערכת.", "Learn a remote in the app near the system."), [
        [t("מצב השלט", "Remote status"), remote.present === true ? t("קיים שלט שמור", "Remote saved") : remote.present === false ? t("לא נשמר שלט", "No remote saved") : t("המצב אינו זמין", "Status unavailable")],
        ...(remote.present === true ? [[t("הקוד שנלמד", "Learned code"), remote.code]] : []),
      ]));
    content.dataset.remoteReadOnly = "true";
  }
  function renderStorageDetails(content, data) {
    const sd = managerSdDetails(data, language);
    const state = sd.supported === false ? t("כרטיס SD אינו נתמך במערכת זו", "SD cards are not supported by this system")
      : sd.mounted === true ? t("כרטיס מחובר וזמין", "Card mounted and available")
      : sd.mounted === false ? t("כרטיס SD אינו זמין", "SD card unavailable") : t("מצב הכרטיס לא דווח", "Card status not reported");
    const facts = [[t("מצב הכרטיס", "Card status"), state]];
    if (sd.supported !== false) facts.push(
      [t("תקינות הפורמט", "Format compatibility"), sd.format === "compatible" ? t("פורמט תואם למערכת", "Compatible with the system") : sd.format === "incompatible" ? t("פורמט אינו תואם", "Incompatible format") : t("לא ניתן לאמת את הפורמט", "Format could not be verified")],
      [t("נפח כרטיס SD", "SD card capacity"), sd.capacity],
      [t("נפח זמין לקבצים", "Filesystem capacity"), sd.total],
      [t("בשימוש", "Used"), sd.used], [t("פנוי", "Free"), sd.free]);
    content.append(detailCard("SD Card", t("נתוני הכרטיס נפרדים מהאחסון הפנימי של המערכת.", "Card information is separate from the system's internal storage."), facts));
    const { sd: ignored, ...internal } = data ?? {};
    const other = node("details", undefined, "manager-storage-more");
    other.append(node("summary", t("נתוני מערכת נוספים", "More system information")));
    renderFacts(other, internal); content.append(other);
  }
  async function renderAutoUsers(content) {
    const source = connection, epoch = generation, panel = tabGeneration;
    const alive = () => source === connection && epoch === generation && panel === tabGeneration && source.session && !closed;
    const section = node("section", undefined, "manager-device-card manager-auto-users");
    section.append(node("h3", t("משתמשי Auto Open", "Auto Open users")));
    content.append(section);
    if (!source.capabilities?.data?.features?.includes("AUTO_OPEN_USERS")) {
      section.append(node("p", t("הצגת המשתמשים הרשומים דורשת קושחה שתומכת ברשימת Auto Open. הרשאות רגילות אינן מעידות על רישום ל־Auto Open.", "Displaying enrolled users requires firmware with Auto Open list support. Regular access does not imply Auto Open enrollment."), "manager-supporting-copy"));
      return;
    }
    section.append(node("p", t("משתמשים שנרשמו בפועל לפתיחה אוטומטית במערכת זו.", "Users actually enrolled for automatic opening on this system."), "manager-supporting-copy"));
    const list = node("div", undefined, "manager-auto-user-list"), state = node("p", "", "manager-supporting-copy");
    state.setAttribute("role", "status");
    const seen = new Set(); let next = null, loaded = 0;
    const more = button(t("משתמשים נוספים", "More users"), () => load(next));
    section.append(state, list, more); more.hidden = true;
    async function load(after) {
      if (!alive()) return;
      state.textContent = t("טוען משתמשי Auto Open…", "Loading Auto Open users…");
      more.disabled = true;
      try {
        const result = await source.command("ADMIN_LIST_AUTO_OPEN_USERS", { page: { cursor: after, limit: 10 } });
        if (!alive()) return;
        if (!Array.isArray(result.data?.items)) throw new Error("INVALID_RESPONSE");
        for (const person of result.data.items) {
          const row = node("article", undefined, "manager-auto-user");
          row.append(node("strong", person.name || t("משתמש רשום", "Enrolled user")), node("span", `+${person.countryCode ?? ""}${person.localNumber ?? ""}`));
          row.append(node("span", person.allowed === false ? t("הרשאת Auto Open כבויה", "Auto Open permission disabled") : t("רשום ל־Auto Open", "Enrolled for Auto Open"), "manager-auto-user-badge" + (person.allowed === false ? " is-disabled" : "")));
          list.append(row); loaded++;
        }
        next = result.data.page?.nextCursor ?? null;
        if (next && seen.has(next)) throw new Error("LIST_LIMIT");
        if (next) seen.add(next);
        more.hidden = !next;
        state.textContent = loaded ? t(`${loaded} משתמשים מוצגים`, `${loaded} users shown`) : next ? t("אפשר להמשיך לטעון את הרשימה.", "Continue loading the list.") : t("אין משתמשים הרשומים ל־Auto Open במערכת זו.", "No users are enrolled for Auto Open on this system.");
      } catch (error) {
        if (!alive()) return;
        if ((error.code ?? error.message) === "STALE_CURSOR") {
          list.replaceChildren(); loaded = 0; next = null; seen.clear();
          state.textContent = t("רשימת Auto Open השתנתה במערכת. טענו אותה מחדש.", "Auto Open enrollment changed on the system. Reload the list.");
        } else state.textContent = errorText(error);
        state.setAttribute("role", "alert");
        more.hidden = false; more.textContent = t("ניסיון נוסף", "Try again");
      } finally { more.disabled = false; }
    }
    await load(null);
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
  function pauseForBackground() {
    if (closed || !currentSystem || !view.querySelector("#manager-content")) return;
    const system = currentSystem;
    const gate = system.systemIds.includes(currentGate) ? currentGate : system.systemIds[0];
    stop();
    view.querySelector("#manager-tabs")?.replaceChildren();
    showConnectionRecovery(gate);
    interruptedConnection = { system, gate, epoch: generation };
  }
  function resumeFromBackground() {
    if (document.hidden || closed || !interruptedConnection) return;
    const interruption = interruptedConnection;
    interruptedConnection = undefined;
    if (interruption.epoch !== generation || interruption.system !== currentSystem || !view.querySelector("#manager-content")) return;
    const returnFromInterruption = () => {
      if (!closed && interruption.epoch === generation) void task(workspaceReturn);
    };
    connectionDialog.open({
      systemName: currentSystem.name,
      gate: interruption.gate,
      returnFocus: view.querySelector(".manager-workspace-head h3"),
      onCancel: returnFromInterruption,
      onDismiss: returnFromInterruption,
      onRetry: () => { if (!closed && interruption.epoch === generation) void task(() => openGate(interruption.gate)); },
    });
    activity.pause(true);
    connectionDialog.fail(managerConnectionError("CONNECTION_PAUSED", language, true));
  }
  const visibilityChanged = () => document.hidden ? pauseForBackground() : resumeFromBackground();
  document.addEventListener("visibilitychange", visibilityChanged);
  window.addEventListener("pagehide", pauseForBackground);
  window.addEventListener("pageshow", resumeFromBackground);
  const ready = task(async () => {
    try {
      await refreshProfile();
      if (closed) return;
      await changeManagement(managementMode, false);
    } finally {
      initializing = false;
    }
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
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("pagehide", pauseForBackground);
      window.removeEventListener("pageshow", resumeFromBackground);
      organizationPicker?.destroy();
      organizationIdentities.clear();
      stop();
      activity.close();
      examples.close();
      root.replaceChildren();
    },
  };
}
