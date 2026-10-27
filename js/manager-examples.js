import { createManagerSystemCard } from "./manager-system-card.js";
import { ManagerExampleConnection } from "./manager-example-connection.js";
import { placeManagerActions } from "./manager-action-layout.js";
import {
  createManagerExampleData,
  managerExampleSystems,
  managerExampleOrganization,
} from "./manager-example-data.js";
import { parseManagerCsv } from "./manager-csv.js";

const el = (tag, text, cls) => {
  const value = document.createElement(tag);
  if (text !== undefined) value.textContent = text;
  if (cls) value.className = cls;
  return value;
};
// No API, Auth, WebSocket, storage or relay dependency belongs in this module.
export function createManagerExamples({
  language = "en",
  onOpen,
  onOpenOrganization,
}) {
  const he = language === "he",
    t = (h, e) => (he ? h : e);
  const data = createManagerExampleData();
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
  async function run(action) {
    try {
      await action();
    } catch (error) {
      say(errors[error.message] || error.message);
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
  function badge() {
    return el("span", t("דוגמה", "Example"), "manager-example-badge");
  }
  function facts(container, rows) {
    const list = el("dl", undefined, "manager-facts");
    for (const [label, value] of rows)
      list.append(el("dt", label), el("dd", String(value)));
    container.append(list);
  }
  function form(fields, label, action) {
    const f = el("form", undefined, "manager-form manager-example-form");
    for (const field of fields) {
      const l = el("label", field.label),
        input = el(
          field.options
            ? "select"
            : field.type === "textarea"
              ? "textarea"
              : "input",
        );
      input.name = field.name;
      input.setAttribute("aria-label", field.label);
      if (field.options)
        for (const [name, value] of field.options)
          input.append(new Option(name, String(value)));
      else if (field.type !== "textarea") input.type = field.type || "text";
      input.required = field.required !== false;
      if (field.type === "number") {
        input.min = field.min ?? 0;
        input.max = field.max ?? 65535;
        input.step = field.step ?? 1;
      }
      if (field.type === "time") input.step = "600";
      if (field.type === "email") input.maxLength = 254;
      else if (!field.options && !["number", "time"].includes(field.type))
        input.maxLength = field.maxLength || 100;
      input.value = field.value ?? field.options?.[0]?.[1] ?? "";
      l.append(input);
      f.append(l);
    }
    const submit = el("button", label, "manager-button primary");
    submit.type = "submit";
    f.append(submit);
    f.addEventListener("submit", (event) => {
      event.preventDefault();
      run(() => action(Object.fromEntries(new FormData(f)), f));
    });
    return f;
  }
  function table(container, headers, rows) {
    const wrapper = el("div", undefined, "manager-table-wrap"),
      grid = el("table", undefined, "manager-table"),
      thead = el("thead"),
      tr = el("tr"),
      tbody = el("tbody");
    for (const title of headers) {
      const th = el("th", title);
      th.scope = "col";
      tr.append(th);
    }
    thead.append(tr);
    for (const cells of rows) {
      const row = el("tr");
      for (const cell of cells) {
        const td = el("td");
        if (cell instanceof Node) td.append(cell);
        else td.textContent = String(cell);
        row.append(td);
      }
      tbody.append(row);
    }
    grid.append(thead, tbody);
    wrapper.append(grid);
    container.append(wrapper);
  }
  function mount(container) {
    activeRoot = container;
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
  function renderCards(container, systems = managerExampleSystems) {
    const section = el(
        "details",
        undefined,
        "manager-examples dashboard-examples",
      ),
      title = el("summary", t("דוגמאות", "Examples"));
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
    container.prepend(section);
  }
  function renderOrganizationCard(container) {
    const section = el(
      "details",
      undefined,
      "manager-examples dashboard-examples",
    );
    section.append(el("summary", t("ארגון לדוגמה", "Example organization")));
    const card = el("article", undefined, "manager-card manager-example-card");
    card.dataset.exampleOrganization = "true";
    card.append(badge(), el("h4", managerExampleOrganization.name));
    facts(card, [
      [t("בעל הארגון", "Owner"), "owner@example.test · WIFIGATE Manager user"],
      [
        t("מנהלי ארגון", "Organization administrators"),
        data.members.filter((m) => m.status === "active").length,
      ],
      [t("מערכות מקושרות", "Linked systems"), data.assignments.size],
      [
        t("שערים פיזיים ייחודיים", "Unique physical gates"),
        data.uniqueGates(
          managerExampleSystems.filter((s) => data.assignments.has(s.id)),
        ).length,
      ],
    ]);
    card.append(
      button(
        t("כניסה לארגון לדוגמה", "Open example organization"),
        onOpenOrganization,
        true,
      ),
    );
    section.append(card);
    container.prepend(section);
  }
  function renderBulk(container, systems = managerExampleSystems) {
    container.append(
      el("h4", t("פעולות מרובות", "Bulk operations")),
      note(
        t(
          "שער משותף נספר ומטופל פעם אחת. אין הרצה אוטומטית ואין שליחת פקודות לשער מנותק.",
          "A shared physical gate is counted and processed once. No automatic execution or command queue for offline gates.",
        ),
      ),
    );
    const fields = el("div", undefined, "manager-example-selection");
    for (const system of systems) {
      const label = el("label"),
        input = el("input");
      input.type = "checkbox";
      input.value = system.id;
      input.checked = true;
      label.append(input, document.createTextNode(system.name));
      fields.append(label);
    }
    const count = el("p"),
      results = el("div");
    const selected = () =>
      systems.filter((s) =>
        [...fields.querySelectorAll("input:checked")].some(
          (i) => i.value === s.id,
        ),
      );
    const update = () =>
      (count.textContent = `${data.uniqueGates(selected()).length} ${t("שערים פיזיים ייחודיים נבחרו", "unique physical gates selected")}`);
    fields.addEventListener("change", update);
    update();
    const options = [
      [t("כיבוי Auto Open", "Disable Auto Open"), "auto"],
      [t("פתיחה לפי שיטת השער", "Open using each gate's method"), "open"],
      [t("הדמיית עדכון קושחה", "Simulate firmware update"), "firmware"],
      [t("ייבוא משתמשים לדוגמה", "Import sample users"), "import"],
    ];
    const f = form(
      [
        { name: "action", label: t("הפעולה", "Operation"), options },
        {
          name: "mode",
          label: t("מצב ייבוא", "Import mode"),
          value: "MERGE",
          options: [
            ["MERGE", "MERGE"],
            ["REPLACE", "REPLACE"],
          ],
        },
        {
          name: "csv",
          type: "textarea",
          label: t("CSV לדוגמת ייבוא מרובה", "CSV for sample bulk import"),
          required: false,
          maxLength: 50000,
          value:
            "Name,Email,Country,Local,Floor,Apt,Parking\nDemo import,bulk@example.test,972,509999999,0,0,0",
        },
      ],
      t("הפעלת הדגמה על השערים שנבחרו", "Run example on selected gates"),
      (values) => {
        const ids = data.uniqueGates(selected());
        if (!ids.length) return;
        const imported =
          values.action === "import" ? parseManagerCsv(values.csv) : null;
        if (
          !confirm(
            t(
              `להדגים את הפעולה על ${ids.length} שערים פיזיים ייחודיים?`,
              `Simulate this operation on ${ids.length} unique physical gates?`,
            ),
          )
        )
          return;
        const rows = ids.map((id) => {
          try {
            const gate = data.available(id);
            if (values.action === "auto") gate.auto.enabled = false;
            if (values.action === "firmware") gate.firmware = gate.ota.target;
            if (values.action === "import")
              data.importPeople(id, "users", imported, values.mode);
            data.log(id, `Bulk ${values.action}`);
            return [id, t("בוצע בהדגמה", "Completed in example")];
          } catch (error) {
            return [id, errors[error.message] || error.message];
          }
        });
        results.replaceChildren();
        table(
          results,
          [t("שער", "Gate"), t("תוצאה לכל שער", "Per-gate result")],
          rows,
        );
        say(
          t(
            "הדגמה הושלמה. אין ניסיון חוזר אוטומטי על שער שנכשל.",
            "Example finished. Failed gates are not retried automatically.",
          ),
        );
      },
    );
    container.append(fields, count, f, results);
  }
  function renderOrganization(container, { onBack }) {
    mount(container);
    const head = el("div", undefined, "manager-toolbar");
    head.append(
      el("h3", managerExampleOrganization.name),
      badge(),
      button(t("חזרה לארגונים שלי", "Back to my organizations"), onBack),
    );
    container.append(head);
    const tabs = el("div", undefined, "manager-tabs"),
      body = el("div");
    tabs.setAttribute("role", "tablist");
    container.append(tabs, body);
    const views = [
      ["systems", t("מערכות הארגון", "Organization systems")],
      ["members", t("מנהלי ארגון", "Organization administrators")],
      ["bulk", t("פעולות מרובות", "Bulk operations")],
      ["activity", t("פעילות", "Activity")],
    ];
    const render = (selected) => {
      body.replaceChildren();
      tabs.replaceChildren();
      for (const [key, label] of views) {
        const b = button(label, () => render(key));
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", String(key === selected));
        tabs.append(b);
      }
      if (selected === "systems") {
        const assigned = managerExampleSystems.filter((s) =>
          data.assignments.has(s.id),
        );
        facts(body, [
          [
            t("בעל הארגון", "Organization owner"),
            "owner@example.test · WIFIGATE Manager user",
          ],
          [t("מערכות", "Systems"), assigned.length],
          [
            t("שערים פיזיים ייחודיים", "Unique physical gates"),
            data.uniqueGates(assigned).length,
          ],
        ]);
        renderCards(body, assigned);
        body.append(
          form(
            [
              {
                name: "system",
                label: t("מערכת לדוגמה לשיוך", "Example system assignment"),
                options: managerExampleSystems.map((s) => [s.name, s.id]),
              },
              {
                name: "assignment",
                label: t("פעולת שיוך", "Assignment action"),
                options: [
                  [
                    t("שיוך לארגון לדוגמה", "Assign to example organization"),
                    "assign",
                  ],
                  [
                    t(
                      "הסרת שיוך מהארגון לדוגמה",
                      "Unassign from example organization",
                    ),
                    "unassign",
                  ],
                ],
              },
            ],
            t("עדכון שיוך בדוגמה", "Update example assignment"),
            (values) => {
              if (!managerExampleSystems.some((s) => s.id === values.system))
                return;
              if (values.assignment === "assign")
                data.assignments.add(values.system);
              else data.assignments.delete(values.system);
              render("systems");
              say(
                t(
                  "השיוך השתנה בדוגמה בלבד.",
                  "Assignment changed only in the example.",
                ),
              );
            },
          ),
        );
      }
      if (selected === "members") {
        table(
          body,
          [
            t("אימייל", "Email"),
            t("תפקיד", "Role"),
            t("מצב", "Status"),
            t("פעולות", "Actions"),
          ],
          data.members.map((member) => [
            member.email,
            "WIFIGATE Manager organization admin",
            member.status,
            button(t("הסרה בהדגמה", "Remove in example"), () => {
              if (
                !confirm(
                  t(
                    "להסיר את המינוי לדוגמה?",
                    "Remove the sample appointment?",
                  ),
                )
              )
                return;
              data.members.splice(data.members.indexOf(member), 1);
              render("members");
            }),
          ]),
        );
        body.append(
          form(
            [
              {
                name: "email",
                type: "email",
                label: t("אימייל להזמנה לדוגמה", "Sample invitation email"),
              },
            ],
            t("יצירת הזמנה לדוגמה", "Create sample invitation"),
            (values) => {
              if (
                data.members.some((m) => m.email === values.email.toLowerCase())
              )
                return;
              data.members.push({
                email: values.email.toLowerCase(),
                status: "pending",
              });
              render("members");
              say(
                t(
                  "נוצרה הזמנה בדוגמה בלבד. לא נשלח אימייל.",
                  "Sample invitation created. No email was sent.",
                ),
              );
            },
          ),
        );
      }
      if (selected === "bulk")
        renderBulk(
          body,
          managerExampleSystems.filter((s) => data.assignments.has(s.id)),
        );
      if (selected === "activity") {
        const rows = data
          .uniqueGates(managerExampleSystems)
          .flatMap((id) =>
            data
              .gate(id)
              .history.map((item) => [
                id,
                item.time,
                item.actor,
                item.action,
                item.result,
              ]),
          );
        table(
          body,
          [
            t("שער", "Gate"),
            t("שעה", "Time"),
            t("מפעיל", "Operator"),
            t("פעולה", "Action"),
            t("תוצאה", "Result"),
          ],
          rows,
        );
      }
      placeManagerActions(body, language);
    };
    render("systems");
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
      activeRoot = undefined;
      message = undefined;
    },
    close() {
      disposed = true;
      activeRoot = undefined;
      message = undefined;
      data.clear();
    },
  };
}
