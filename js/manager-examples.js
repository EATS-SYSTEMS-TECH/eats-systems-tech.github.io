import { createManagerSystemCard } from "./manager-system-card.js";
import { ManagerExampleConnection } from "./manager-example-connection.js";
import {
  createManagerExampleData,
  managerExampleSystems,
  managerExampleOrganization,
} from "./manager-example-data.js";
import { createManagerOrganizationCard } from "./manager-organization-card.js";
import { renderManagerOrganization } from "./manager-organization.js";
import { createManagerDialog } from "./manager-dialog.js";
import { createExampleOrganization } from "./manager-example-organization.js";

const el = (tag, text, cls) => {
  const value = document.createElement(tag);
  if (text !== undefined) value.textContent = text;
  if (cls) value.className = cls;
  return value;
};
// No API, Auth, WebSocket, storage or relay dependency belongs in this module.
export function createManagerExamples({
  language = "en",
  dialogs = createManagerDialog({ language }),
  onOpen,
  onOpenOrganization,
}) {
  const he = language === "he",
    t = (h, e) => (he ? h : e);
  const data = createManagerExampleData();
  const organization = createExampleOrganization(data);
  let viewGeneration = 0;
  const removed = new Set();
  let activeRoot,
    message,
    disposed = false;
  const errors = {
    EXAMPLE_OFFLINE: t(
      "אין תקשורת עם מערכת הדוגמה. אין תור פקודות.",
      "The example gate is offline. Commands are not queued.",
    ),
    EXAMPLE_BUSY: t(
      "מערכת הדוגמה בשימוש. נסו שוב כשהיא פנויה.",
      "The example gate is busy. Retry when idle.",
    ),
    EXAMPLE_CAPACITY: t(
      "הפעולה חורגת מקיבולת הלוח.",
      "This exceeds the board capacity.",
    ),
    EXAMPLE_DELEGATION_ADMIN: t(
      "אין להסיר את המנהל שעליו נשענת האצלת הניהול.",
      "The administrator backing management delegation cannot be removed.",
    ),
    EXAMPLE_CONFLICT: t(
      "ההגדרות השתנו. רעננו את המסך לפני שמירה.",
      "Settings changed. Refresh before saving.",
    ),
    INVALID_CONFIG: t(
      "בדקו את ערכי ההגדרות.",
      "Check the configuration values.",
    ),
    INVALID_CSV: t(
      "קובץ ה־CSV אינו תקין. יש להשתמש בפורמט הייצוא.",
      "Invalid CSV. Use the exported format.",
    ),
    DUPLICATE_PHONE: t(
      "מספר הטלפון כבר קיים.",
      "The phone number already exists.",
    ),
  };
  function say(value) {
    if (message?.isConnected && !disposed) message.textContent = value;
  }
  async function run(action, control) {
    if (control?.disabled) return;
    if (control) {
      control.disabled = true;
      control.setAttribute("aria-busy", "true");
    }
    try {
      await action();
    } catch (error) {
      if (error.message !== "CANCELLED")
        say(
          errors[error.message] ||
            t(
              "לא ניתן להשלים את הפעולה בדוגמה.",
              "Unable to complete this example action.",
            ),
        );
    } finally {
      if (control) {
        control.disabled = false;
        control.removeAttribute("aria-busy");
      }
    }
  }
  function button(label, action, primary = false) {
    const b = el(
      "button",
      label,
      "manager-button" + (primary ? " primary" : ""),
    );
    b.type = "button";
    b.addEventListener("click", async () => {
      if (b.disabled) return;
      b.disabled = true;
      b.setAttribute("aria-busy", "true");
      b.classList.add("is-loading");
      try {
        await run(action);
      } finally {
        b.disabled = false;
        b.removeAttribute("aria-busy");
        b.classList.remove("is-loading");
      }
    });
    return b;
  }
  function note(text) {
    return el("p", text, "manager-note");
  }
  function mount(container) {
    viewGeneration++;
    activeRoot = container;
    container.dataset.simulation = "true";
    container.replaceChildren();
    container.classList.add("manager-example-workspace");
    container.append(
      note(
        t(
          "סביבת הדגמה בלבד. הנתונים והשינויים נשמרים בזיכרון עד סגירת הדשבורד. הפעולות אינן פותחות שער, יוצרות מנוי או משנות ארגון אמיתי.",
          "Example workspace only. Data and changes stay in memory until this dashboard closes. Actions never open a gate, create a subscription or change a real organization.",
        ),
      ),
    );
    message = el("p", "", "manager-status");
    message.setAttribute("role", "status");
    message.setAttribute("aria-live", "polite");
    container.append(message);
  }
  function renderCards(
    container,
    systems = managerExampleSystems,
    { collapsible = true } = {},
  ) {
    const section = el(
        collapsible ? "details" : "section",
        undefined,
        collapsible
          ? "manager-examples dashboard-examples"
          : "manager-organization-systems",
      ),
      title = el("summary", t("דוגמאות", "Examples"));
    if (collapsible)
      section.append(
        title,
        el(
          "p",
          t(
            "אפשר לנסות את כל מסכי הניהול על נתוני דוגמה, ללא חיבור למערכת פיזית.",
            "Explore the management screens using sample data, without connecting to a physical gate.",
          ),
          "manager-muted",
        ),
      );
    const grid = el("div", undefined, "manager-grid manager-example-grid");
    for (const system of systems) {
      if (removed.has(system.id)) continue;
      const actions = el("div", undefined, "manager-system-actions");
      actions.append(
        button(
          t("פתיחת סביבת ניהול", "Open workspace"),
          () => onOpen(system),
          true,
        ),
      );
      grid.append(
        createManagerSystemCard({ system, language, actions, example: true }),
      );
    }
    section.append(grid);
    if (collapsible) container.prepend(section);
    else container.append(section);
  }
  function renderOrganizationCard(container) {
    const section = el(
      "details",
      undefined,
      "manager-examples dashboard-examples manager-organization-examples",
    );
    section.append(el("summary", t("ארגון לדוגמה", "Example organization")));
    const grid = el("div", undefined, "manager-org-columns");
    const actions = el("div", undefined, "manager-org-actions");
    actions.append(
      button(t("כניסה לארגון", "Open organization"), onOpenOrganization, true),
    );
    grid.append(
      createManagerOrganizationCard({
        organization: organization.summary(),
        language,
        actions,
        example: true,
      }),
    );
    section.append(grid);
    container.append(section);
  }
  async function renderOrganization(container, { onBack }) {
    mount(container);
    const epoch = viewGeneration;
    const isCurrent = () =>
      !disposed && activeRoot === container && epoch === viewGeneration;
    const simulation = t(
      "סימולציה בלבד · ארגון לדוגמה. השינויים נשמרים בדוגמה בלבד.",
      "Simulation only · example organization. Changes stay in the example only.",
    );
    await renderManagerOrganization({
      root: container,
      path: organization.path,
      language,
      user: organization.owner,
      api: (...args) => {
        if (!isCurrent()) throw new Error("CANCELLED");
        return organization.request(...args);
      },
      dialogs: {
        form: (options) =>
          dialogs.form({
            ...options,
            message: simulation + "\n" + options.message,
          }),
        confirm: (text) => dialogs.confirm(simulation + "\n" + text),
      },
      ensureRecent: async () => {},
      run,
      onBack,
      onRefresh: () => renderOrganization(container, { onBack }),
      errorText: (error) =>
        errors[error.code ?? error.message] ||
        t(
          "לא ניתן לשמור. בדקו את הפרטים ונסו שוב.",
          "Unable to save. Check the details and retry.",
        ),
      isCurrent,
    });
    if (!isCurrent()) return;
    const assigned = managerExampleSystems.filter(
      (system) => data.assignments.has(system.id) && !removed.has(system.id),
    );
    const toolbar = el("div", undefined, "manager-toolbar");
    toolbar.dataset.organizationSection = "systems";
    toolbar.append(
      el("h3", t("מערכות הארגון", "Organization systems")),
      button(t("רענון", "Refresh"), () =>
        renderOrganization(container, { onBack }),
      ),
    );
    container.append(toolbar);
    renderCards(container, assigned, { collapsible: false });
  }

  return {
    renderCards,
    renderOrganizationCard,
    renderOrganization,
    isSystem: (system) => managerExampleSystems.includes(system),
    createConnection: (options) => {
      if (disposed || removed.has(options.system.id))
        throw new Error("EXAMPLE_SYSTEM_NOT_FOUND");
      return new ManagerExampleConnection({ ...options, data });
    },
    organizations: () => [managerExampleOrganization],
    assignment: (system) =>
      data.assignments.has(system.id) ? managerExampleOrganization.id : null,
    assign: (system, orgId) => {
      if (
        !managerExampleSystems.includes(system) ||
        (orgId !== null && orgId !== managerExampleOrganization.id)
      )
        throw new Error("EXAMPLE_SYSTEM_NOT_FOUND");
      if (orgId) data.assignments.add(system.id);
      else data.assignments.delete(system.id);
    },
    disconnect: (system) => {
      if (!managerExampleSystems.includes(system))
        throw new Error("EXAMPLE_SYSTEM_NOT_FOUND");
      removed.add(system.id);
      data.assignments.delete(system.id);
    },
    closeView() {
      viewGeneration++;
      dialogs.cancel();
      activeRoot = undefined;
      message = undefined;
    },
    close() {
      disposed = true;
      viewGeneration++;
      dialogs.cancel();
      organization.clear();
      activeRoot = undefined;
      message = undefined;
      data.clear();
    },
  };
}
