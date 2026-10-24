import { createSystemIcon } from "./wifigate-system-icons.js";
import { placeManagerActions } from "./manager-action-layout.js";
import {
  createManagerExampleData,
  managerExampleSystems,
  managerExampleOrganization,
  openingMethods,
  localOnlyFeatures,
} from "./manager-example-data.js";
import { parseManagerCsv, encodeManagerCsv } from "./manager-csv.js";

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
  function run(action) {
    try {
      action();
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
    b.addEventListener("click", () => run(action));
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
  function download(text, filename) {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const link = el("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    const section = el("details", undefined, "manager-examples dashboard-examples"),
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
      const card = el(
        "article",
        undefined,
        "manager-card manager-example-card",
      );
      card.dataset.exampleSystem = system.id;
      const type = {
        gate: "Gate",
        "dual-control": "Dual Control",
        group: "Group",
      }[system.type];
      const heading = el("div", undefined, "manager-example-card-head");
      heading.append(createSystemIcon(system), badge());
      card.append(
        heading,
        el("h4", system.name),
        el(
          "p",
          `${type} · ${new Set(system.systemIds).size} ${t("שערים פיזיים", "physical gates")}`,
          "manager-muted",
        ),
        el(
          "p",
          t("אתר לדוגמה · חיפה", "Example site · Haifa"),
          "manager-muted",
        ),
      );
      const first = data.gate(system.systemIds[0]);
      facts(card, [
        [
          t("משתמשים בשער הראשון", "Users on first gate"),
          `${first.users.length}/${first.maxUsers}`,
        ],
        [
          t("מנהלים מקומיים", "Local admins"),
          `${first.admins.length}/${first.maxAdmins}`,
        ],
        [t("קושחה לדוגמה", "Example firmware"), first.firmware],
      ]);
      card.append(
        button(
          t("נסו את הניהול", "Try management"),
          () => onOpen(system),
          true,
        ),
      );
      grid.append(card);
    }
    section.append(grid);
    container.prepend(section);
  }
  function renderOrganizationCard(container) {
    const section = el("details", undefined, "manager-examples dashboard-examples");
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
  function renderWorkspace(container, system, { onBack }) {
    if (!managerExampleSystems.includes(system))
      throw new Error("EXAMPLE_SYSTEM_NOT_FOUND");
    mount(container);
    let gateId = system.systemIds[0],
      tab = "overview",
      page = 0,
      autoPage = 0,
      query = "";
    const head = el("div", undefined, "manager-workspace-head");
    head.append(
      el("h3", system.name),
      badge(),
      button(t("סיום וחזרה", "End and return"), onBack),
    );
    container.append(head);
    if (system.systemIds.length > 1) {
      const l = el("label", t("בחירת שער", "Choose gate")),
        select = el("select");
      select.setAttribute("aria-label", t("בחירת שער", "Choose gate"));
      for (const id of system.systemIds)
        select.append(new Option(`${data.gate(id).name} · ${id}`, id));
      select.addEventListener("change", () => {
        gateId = select.value;
        page = 0;
        autoPage = 0;
        query = "";
        render();
      });
      l.append(select);
      container.append(l);
      container.append(
        note(
          t(
            "בחירת שער אינה מפעילה אותו. אפשר לנסות פעולה מפורשת על הקבוצה בלשונית פעולות מרובות.",
            "Selecting a gate never opens it. Use Bulk operations to explicitly try an action on the group.",
          ),
        ),
      );
    }
    const controls = el("div", undefined, "manager-actions"),
      status = el("span");
    controls.append(
      status,
      button(t("הדמיית ניתוק / חיבור", "Simulate offline / online"), () => {
        const gate = data.gate(gateId);
        gate.online = !gate.online;
        render();
      }),
      button(t("הדמיית תפוס / פנוי", "Simulate busy / idle"), () => {
        const gate = data.gate(gateId);
        gate.busy = !gate.busy;
        render();
      }),
    );
    container.append(controls);
    const tabs = el("div", undefined, "manager-tabs"),
      content = el("section");
    tabs.setAttribute("role", "tablist");
    content.className = "manager-example-content";
    container.append(tabs, content);
    const labels = {
      overview: t("סקירה ופתיחה", "Overview & open"),
      users: t("משתמשים", "Users"),
      admins: t("מנהלים", "Administrators"),
      guests: t("אורחים", "Guests"),
      auto: "Auto Open",
      settings: t("הגדרות השער", "Gate settings"),
      events: t("אירועים", "Events"),
      history: t("היסטוריה", "History"),
      rf: t("שלטים", "RF remotes"),
      system: t("מערכת וקושחה", "System & firmware"),
      ...(system.systemIds.length > 1
        ? { bulk: t("פעולות מרובות", "Bulk operations") }
        : {}),
    };
    const get = () => data.gate(gateId);
    function changed(
      action,
      text = t("נשמר בהדגמה בלבד.", "Saved in the example only."),
    ) {
      data.available(gateId);
      action();
      data.log(gateId, text);
      render();
      say(text);
    }
    function open() {
      data.available(gateId);
      if (get().override === "FORCE_NC")
        throw new Error(
          t(
            "הפתיחה סורבה בדוגמה: השער במצב סגור קבוע.",
            "Example opening refused: the gate is held closed.",
          ),
        );
      if (
        !confirm(
          t(
            `להדגים פתיחה של ${get().name} בשיטה ${get().config.command}?`,
            `Simulate opening ${get().name} using ${get().config.command}?`,
          ),
        )
      )
        return;
      changed(
        () => {},
        t(
          "פתיחה הודגמה. לא הופעל ממסר פיזי.",
          "Opening simulated. No physical relay was activated.",
        ),
      );
    }
    function overview() {
      const gate = get(),
        metrics = el("div", undefined, "manager-example-metrics");
      for (const [label, value] of [
        [t("משתמשים", "Users"), `${gate.users.length}/${gate.maxUsers}`],
        [
          t("מנהלים מקומיים", "Local administrators"),
          `${gate.admins.length}/${gate.maxAdmins}`,
        ],
        [t("אירועים", "Events"), `${gate.events.length}/${gate.maxEvents}`],
        [t("קושחה לדוגמה", "Example firmware"), gate.firmware],
      ]) {
        const metric = el("div", undefined, "manager-card");
        metric.append(el("span", label), el("strong", value));
        metrics.append(metric);
      }
      content.append(metrics);
      facts(content, [
        [t("מזהה שער", "Gate ID"), gate.id],
        [
          t("סוג האובייקט", "System type"),
          { gate: "Gate", "dual-control": "Dual Control", group: "Group" }[
            system.type
          ],
        ],
        [t("סוג שער", "Gate type"), t("מחסום חניה", "Parking barrier")],
        [t("לוח", "Board"), `${gate.boardMb} MB`],
        [t("מקסימום משתמשים", "Max users"), gate.maxUsers],
        [t("מקסימום מנהלים", "Max administrators"), gate.maxAdmins],
        [t("שיטת פתיחה", "Opening method"), gate.config.command],
        [t("מצב קבוע", "Override"), gate.override],
        [
          "Auto Open",
          gate.auto.enabled ? t("פעיל", "Enabled") : t("כבוי", "Disabled"),
        ],
        [
          t("חיישן", "Sensor"),
          gate.sensor ? t("פעיל", "Enabled") : t("כבוי", "Disabled"),
        ],
        [
          t("שעון השער", "Gate clock"),
          new Intl.DateTimeFormat(he ? "he-IL" : "en-GB", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: gate.timezone,
          }).format(new Date(gate.clock)),
        ],
        [t("אזור זמן", "Time zone"), gate.timezone],
        [t("אחסון", "Storage"), "OK · LittleFS / NVS / SD"],
        [t("זיכרון פנוי", "Free memory"), `${gate.freeHeap} bytes`],
        [
          t("מצב ממסר בהדגמה", "Example relay state"),
          gate.relayOn ? "ON" : "OFF",
        ],
        ["Wi-Fi", `${gate.networks[0]?.ssid || "—"} · -58 dBm`],
        [t("זמן פעולה", "Uptime"), gate.uptime],
      ]);
      content.append(button(t("הדמיית פתיחה", "Simulate opening"), open, true));
      if (["TOGGLE", "PUSH_BUTTON"].includes(gate.config.command)) {
        for (const on of [true, false])
          content.append(
            button(
              gate.config.command === "PUSH_BUTTON"
                ? on
                  ? t("הדמיית לחיצה", "Simulate press")
                  : t("הדמיית שחרור", "Simulate release")
                : on
                  ? t("הדמיית הפעלה", "Simulate ON")
                  : t("הדמיית כיבוי", "Simulate OFF"),
              () => {
                if (
                  confirm(
                    t(
                      "לשנות את מצב הממסר המדומה?",
                      "Change the simulated relay state?",
                    ),
                  )
                )
                  changed(() => {
                    gate.relayOn = on;
                  });
              },
            ),
          );
      }
    }
    function peopleView(collection) {
      const gate = get(),
        admin = collection === "admins",
        all = gate[collection],
        limit = admin ? gate.maxAdmins : gate.maxUsers;
      content.append(
        el("h4", `${labels[collection]} · ${all.length}/${limit}`),
      );
      const search = el("input");
      search.type = "search";
      search.value = query;
      search.setAttribute(
        "aria-label",
        t("חיפוש ברשימת הדוגמה", "Search sample records"),
      );
      const results = el("div");
      const drawRows = () => {
        results.replaceChildren();
        const filtered = all.filter((p) =>
          `${p.name} ${p.email} ${p.localNumber}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        );
        const rows = filtered.slice(page * 20, page * 20 + 20);
        table(
          results,
          [
            t("שם", "Name"),
            t("טלפון", "Phone"),
            t("אימייל", "Email"),
            t("קומה / דירה / חניה", "Floor / Apt / Parking"),
            t("רישום והרשאות", "Enrollment & permissions"),
            t("פעולות", "Actions"),
          ],
          rows.map((person) => {
            const actions = el("div", undefined, "manager-actions"),
              permissions = el("div");
            permissions.append(
              el(
                "p",
                person.enrolled
                  ? t("רשום", "Enrolled")
                  : t("ממתין לרישום מקומי", "Awaiting local enrollment"),
              ),
            );
            permissions.append(
              el(
                "p",
                `${t("דור אורחים", "Guest generation")}: ${person.guestGeneration || 1}`,
              ),
            );
            if (!admin) {
              permissions.append(
                button(
                  `${t("אורחים", "Guests")}: ${person.allowGuests ? t("מותר", "Allowed") : t("חסום", "Blocked")}`,
                  () =>
                    changed(() => {
                      person.allowGuests = !person.allowGuests;
                    }),
                ),
                button(
                  `Auto Open: ${person.allowAutoOpen ? t("מותר", "Allowed") : t("חסום", "Blocked")}`,
                  () =>
                    changed(() => {
                      person.allowAutoOpen = !person.allowAutoOpen;
                    }),
                ),
              );
            }
            actions.append(
              button(t("עריכה", "Edit"), () => editPerson(person)),
              button(t("מחיקה בהדגמה", "Delete in example"), () => {
                if (admin && (person === all[0] || all.length === 1))
                  throw new Error("EXAMPLE_DELEGATION_ADMIN");
                if (
                  confirm(
                    t("למחוק את רשומת הדוגמה?", "Delete the sample record?"),
                  )
                )
                  changed(() => all.splice(all.indexOf(person), 1));
              }),
            );
            return [
              person.name,
              `+${person.countryCode} ${person.localNumber}`,
              person.email,
              `${person.floorNumber} / ${person.apartmentNumber} / ${person.parkingNumber}`,
              permissions,
              actions,
            ];
          }),
        );
        const pager = el("div", undefined, "manager-actions");
        if (page > 0)
          pager.append(
            button(t("הקודם", "Previous"), () => {
              page--;
              drawRows();
            }),
          );
        if ((page + 1) * 20 < filtered.length)
          pager.append(
            button(t("הבא", "Next"), () => {
              page++;
              drawRows();
            }),
          );
        results.append(
          el(
            "p",
            `${filtered.length} ${t("תוצאות · 20 לעמוד", "results · 20 per page")}`,
          ),
          pager,
        );
      };
      search.addEventListener("input", () => {
        query = search.value;
        page = 0;
        drawRows();
      });
      content.append(search, results);
      drawRows();
      const editor = el("div", undefined, "manager-record-editor");
      content.append(editor);
      function editPerson(person) {
        editor.replaceChildren(
          el(
            "h4",
            person
              ? t("עריכת רשומת דוגמה", "Edit sample record")
              : t("הוספת רשומת דוגמה", "Add sample record"),
          ),
        );
        editor.append(
          form(
            [
              {
                name: "name",
                label: t("שם", "Name"),
                value: person?.name,
                maxLength: 20,
              },
              {
                name: "email",
                label: t("אימייל", "Email"),
                type: "email",
                value: person?.email,
              },
              {
                name: "countryCode",
                label: t("קידומת מדינה", "Country code"),
                value: person?.countryCode || "972",
              },
              {
                name: "localNumber",
                label: t("מספר טלפון", "Phone number"),
                value: person?.localNumber,
              },
              ...["floorNumber", "apartmentNumber", "parkingNumber"].map(
                (name, i) => ({
                  name,
                  label: [
                    t("קומה", "Floor"),
                    t("דירה", "Apartment"),
                    t("חניה", "Parking"),
                  ][i],
                  type: "number",
                  value: person?.[name] || 0,
                  max: name === "parkingNumber" ? 4294967295 : 65535,
                }),
              ),
            ],
            t("שמירת רשומת דוגמה", "Save sample record"),
            (values) => {
              data.available(gateId);
              if (
                !/^\d{1,3}$/.test(values.countryCode) ||
                !/^\d{1,20}$/.test(values.localNumber)
              )
                throw new Error("INVALID_CONFIG");
              if (
                all.some(
                  (p) =>
                    p !== person &&
                    p.countryCode + p.localNumber ===
                      values.countryCode + values.localNumber,
                )
              )
                throw new Error("DUPLICATE_PHONE");
              if (!person && all.length >= limit)
                throw new Error("EXAMPLE_CAPACITY");
              for (const key of [
                "floorNumber",
                "apartmentNumber",
                "parkingNumber",
              ])
                values[key] = Number(values[key]);
              changed(() => {
                if (person) Object.assign(person, values);
                else
                  all.push({
                    id: crypto.randomUUID(),
                    ...values,
                    enrolled: false,
                    allowGuests: true,
                    allowAutoOpen: true,
                    guestGeneration: 1,
                  });
              });
            },
          ),
        );
      }
      const actions = el("div", undefined, "manager-actions");
      actions.append(
        button(t("הוספה", "Add"), () => editPerson()),
        button(t("ייצוא CSV לדוגמה", "Export sample CSV"), () =>
          download(encodeManagerCsv(all), `WIFIGATE-example-${collection}.csv`),
        ),
      );
      content.append(actions);
      const file = el("input");
      file.type = "file";
      file.accept = ".csv,text/csv";
      file.setAttribute(
        "aria-label",
        t("ייבוא CSV לדוגמה", "Import sample CSV"),
      );
      const modeLabel = el("label", t("מצב ייבוא", "Import mode")),
        mode = el("select");
      mode.append(
        new Option("MERGE", "MERGE"),
        new Option("REPLACE", "REPLACE"),
      );
      modeLabel.append(mode);
      file.addEventListener("change", async () => {
        const selected = file.files?.[0],
          root = activeRoot;
        if (!selected) return;
        if (selected.size > 4 * 1024 * 1024) {
          say(errors.INVALID_CSV);
          return;
        }
        try {
          const text = await selected.text();
          if (disposed || activeRoot !== root || !file.isConnected) return;
          const rows = parseManagerCsv(text);
          if (
            !confirm(
              t(
                `לייבא ${rows.length} רשומות אל הדוגמה במצב ${mode.value}?`,
                `Import ${rows.length} records into the example using ${mode.value}?`,
              ),
            )
          )
            return;
          data.importPeople(gateId, collection, rows, mode.value);
          render();
          say(
            t(
              "הייבוא בוצע בדוגמה בלבד.",
              "Import applied to the example only.",
            ),
          );
        } catch (error) {
          say(errors[error.message] || error.message);
        }
      });
      content.append(
        modeLabel,
        file,
        note(
          t(
            "רישום טלפון וקוד QR של מנהל נשארים מקומיים ליד השער.",
            "Phone enrollment and administrator QR operations remain local to the gate.",
          ),
        ),
      );
      content.append(
        form(
          [
            {
              name: "kind",
              label: t("סוג הזמנה", "Invitation kind"),
              options: admin
                ? [
                    [
                      t("פרטית למנהל", "Private administrator invite"),
                      "private",
                    ],
                  ]
                : [
                    [t("פרטית", "Private"), "private"],
                    [t("ציבורית למשתמשים", "Public resident invite"), "public"],
                  ],
            },
            {
              name: "phone",
              label: t("טלפון מוזמן לדוגמה", "Sample invited phone"),
              required: false,
            },
          ],
          t("הדמיית יצירת הזמנה", "Simulate invitation"),
          (values) => {
            data.available(gateId);
            say(
              t(
                `כרטיס הזמנה ${values.kind} נוצר בהדגמה בלבד. אינו קישור תקף לרישום.`,
                `A ${values.kind} example invitation was created. This is not a valid enrollment link.`,
              ),
            );
          },
        ),
      );
    }
    function guests() {
      const gate = get();
      content.append(
        note(
          t(
            "האורחים מוצגים לפי פעילות הדוגמה. ביטול אורחי מזמין חל על כל הכרטיסים שהנפיק.",
            "Guests are shown from example activity. Revoking an inviter's guests affects all passes they issued.",
          ),
        ),
      );
      table(
        content,
        [
          t("אורח", "Guest"),
          t("מזמין", "Inviter"),
          t("פתיחות", "Opens"),
          t("מצב", "Status"),
          t("פעולה", "Action"),
        ],
        gate.guests.map((guest) => [
          guest.name,
          guest.inviter,
          guest.opens,
          guest.revoked ? t("בוטל", "Revoked") : t("פעיל", "Active"),
          button(t("ביטול אורחי המזמין", "Revoke inviter's guests"), () => {
            if (
              confirm(
                t(
                  `לבטל את כל אורחי ${guest.inviter} בדוגמה?`,
                  `Revoke all guests issued by ${guest.inviter} in the example?`,
                ),
              )
            )
              changed(() => {
                for (const row of gate.guests)
                  if (row.inviter === guest.inviter) row.revoked = true;
              });
          }),
        ]),
      );
      content.append(
        form(
          [
            { name: "name", label: t("שם אורח לדוגמה", "Sample guest name") },
            {
              name: "phone",
              label: t("טלפון אורח לדוגמה", "Sample guest phone"),
            },
            {
              name: "start",
              label: t("תחילת תוקף", "Valid from"),
              type: "datetime-local",
            },
            {
              name: "end",
              label: t("סיום תוקף", "Valid until"),
              type: "datetime-local",
            },
          ],
          t("הדמיית הזמנת אורח", "Simulate guest invitation"),
          (values) => {
            if (values.start >= values.end) throw new Error("INVALID_CONFIG");
            changed(
              () =>
                gate.guests.push({
                  id: crypto.randomUUID(),
                  name: values.name,
                  inviter: "Demo admin 01",
                  opens: 0,
                  revoked: false,
                }),
              t(
                "אורח נוסף בדוגמה. לא נוצר כרטיס גישה אמיתי.",
                "Guest added to the example. No real access pass was created.",
              ),
            );
          },
        ),
      );
    }
    function autoOpen() {
      const gate = get();
      facts(content, [
        [
          t("מתג Auto Open בשער", "Gate Auto Open switch"),
          gate.auto.enabled ? t("פעיל", "Enabled") : t("כבוי", "Disabled"),
        ],
        [
          t("משתמשים רשומים", "Enrolled users"),
          gate.users.filter((p) => p.autoKey).length,
        ],
      ]);
      content.append(
        button(
          gate.auto.enabled
            ? t("כיבוי Auto Open", "Disable Auto Open")
            : t("הפעלת Auto Open", "Enable Auto Open"),
          () =>
            changed(() => {
              if (!gate.config.command.startsWith("PULSE"))
                throw new Error("INVALID_CONFIG");
              gate.auto.enabled = !gate.auto.enabled;
            }),
        ),
      );
      content.append(
        form(
          Object.keys(gate.auto)
            .filter((k) => k !== "enabled")
            .map((name, i) => ({
              name,
              label: [
                t("פולס ראשון (מילישניות)", "First pulse (ms)"),
                t("השהיה (שניות)", "Delay (seconds)"),
                t("פולס שני (מילישניות)", "Second pulse (ms)"),
                t("זמן המתנה חוזרת (שניות)", "Cooldown (seconds)"),
              ][i],
              type: "number",
              value: gate.auto[name],
              max: name.includes("Millis") ? 60000 : 600,
            })),
          t("שמירת זמני Auto Open בדוגמה", "Save example Auto Open timings"),
          (values) =>
            changed(() => {
              for (const [key, value] of Object.entries(values))
                gate.auto[key] = Number(value);
            }),
        ),
      );
      table(
        content,
        [
          t("משתמש", "User"),
          t("מפתח לדוגמה", "Sample key"),
          t("הרשאה", "Permission"),
          t("פעולות", "Actions"),
        ],
        gate.users
          .filter((p) => p.autoKey)
          .slice(autoPage * 10, autoPage * 10 + 10)
          .map((p, i) => [
            p.name,
            `DEMO-${p.localNumber.slice(-4)}`,
            p.allowAutoOpen ? t("מותר", "Allowed") : t("חסום", "Blocked"),
            (() => {
              const actions = el("div", undefined, "manager-actions");
              actions.append(
                button(t("חסימה / היתר", "Block / allow"), () =>
                  changed(() => {
                    p.allowAutoOpen = !p.allowAutoOpen;
                  }),
                ),
                button(t("מחיקת מפתח בדוגמה", "Delete sample key"), () => {
                  if (
                    confirm(
                      t(
                        "למחוק את מפתח Auto Open בדוגמה?",
                        "Delete this example Auto Open key?",
                      ),
                    )
                  )
                    changed(() => {
                      p.autoKey = false;
                      autoPage = 0;
                    });
                }),
              );
              return actions;
            })(),
          ]),
      );
      if (autoPage > 0)
        content.append(
          button(t("מפתחות קודמים", "Previous keys"), () => {
            autoPage--;
            render();
          }),
        );
      if ((autoPage + 1) * 10 < gate.users.filter((p) => p.autoKey).length)
        content.append(
          button(t("מפתחות נוספים", "More keys"), () => {
            autoPage++;
            render();
          }),
        );
      content.append(
        note(
          t(
            "רישום Auto Open, מדידת טווח ומחיקת זיהוי הטלפון נעשים ליד השער. המפתחות כאן הם דוגמאות בלבד.",
            "Auto Open enrollment and range measurement require the phone at the gate. Keys shown here are examples only.",
          ),
        ),
      );
    }
    function settings() {
      const gate = get(),
        revision = gate.revision;
      facts(content, [
        [t("סוג שער", "Gate type"), gate.gateType],
        [t("גרסת הגדרות", "Configuration revision"), revision],
        [t("מצב קבוע", "Override"), gate.override],
        [
          t("חיישן", "Sensor"),
          gate.sensor ? t("פעיל", "Enabled") : t("כבוי", "Disabled"),
        ],
      ]);
      content.append(
        form(
          [
            {
              name: "command",
              label: t("שיטת פתיחה", "Opening method"),
              value: gate.config.command,
              options: openingMethods.map((value) => [
                value.replaceAll("_", " "),
                value,
              ]),
            },
            ...Object.keys(gate.config)
              .filter((key) => key !== "command")
              .map((name, i) => ({
                name,
                label: [
                  t("פולס ראשון (מילישניות)", "First pulse (ms)"),
                  t("השהיה ראשונה (שניות)", "First delay (seconds)"),
                  t("פולס שני (מילישניות)", "Second pulse (ms)"),
                  t("השהיה שנייה (שניות)", "Second delay (seconds)"),
                  t("פולס שלישי (מילישניות)", "Third pulse (ms)"),
                ][i],
                type: "number",
                value: gate.config[name],
                min: name.includes("Millis") ? 1 : 0,
                max: name.includes("Millis") ? 60000 : 60,
              })),
          ],
          t("שמירת הגדרות בדוגמה", "Save example settings"),
          (values) => {
            for (const key of Object.keys(values))
              if (key !== "command") values[key] = Number(values[key]);
            data.setConfig(gateId, values, revision);
            render();
            say(
              t(
                "הגדרות הדוגמה נשמרו. שיטה שאינה פולס מכבה Auto Open.",
                "Sample settings saved. A non-pulse method disables Auto Open.",
              ),
            );
          },
        ),
      );
      const actions = el("div", undefined, "manager-actions");
      for (const value of ["NORMAL", "FORCE_NC", "FORCE_NO"])
        actions.append(
          button(
            {
              NORMAL: t("רגיל", "Normal"),
              FORCE_NC: t("סגור קבוע", "Held closed"),
              FORCE_NO: t("פתוח קבוע", "Held open"),
            }[value],
            () => {
              if (
                value === "FORCE_NO" &&
                prompt(
                  t(
                    `לאישור הדגמת פתוח קבוע הקלידו: ${system.name}`,
                    `To simulate held open, type: ${system.name}`,
                  ),
                ) !== system.name
              )
                return;
              changed(
                () => {
                  gate.override = value;
                },
                t(
                  "המצב שונה בדוגמה בלבד. במערכת אמיתית פתוח קבוע דורש גם אימות עדכני.",
                  "Override changed only in the example. A real held-open operation also requires recent authentication.",
                ),
              );
            },
          ),
        );
      actions.append(
        button(t("הפעלה / כיבוי חיישן", "Enable / disable sensor"), () =>
          changed(() => {
            gate.sensor = !gate.sensor;
          }),
        ),
      );
      content.append(actions);
    }
    function events() {
      const gate = get(),
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
      const clock = (n) =>
        `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
      content.append(
        el("h4", `${gate.events.length}/${gate.maxEvents} · ${gate.timezone}`),
      );
      const timeline = el("div", undefined, "manager-example-week");
      for (let day = 0; day < 7; day++) {
        const column = el("section", undefined, "manager-card");
        column.append(el("h5", days[day]));
        for (const event of gate.events.filter((e) => e.day === day)) {
          const row = el(
            "div",
            `${clock(event.start)}–${clock(event.end)} · ${event.open ? t("פתוח", "Open") : t("סגור", "Closed")}${event.once ? " · " + t("חד־פעמי", "One time") : ""}`,
            `manager-example-event ${event.open ? "is-open" : "is-closed"}`,
          );
          row.append(
            button(t("הסרת אירוע", "Remove event"), () => {
              if (
                confirm(
                  t("להסיר את אירוע הדוגמה?", "Remove this sample event?"),
                )
              )
                changed(() =>
                  gate.events.splice(gate.events.indexOf(event), 1),
                );
            }),
          );
          column.append(row);
        }
        timeline.append(column);
      }
      content.append(timeline);
      content.append(
        form(
          [
            {
              name: "day",
              label: t("יום בשבוע", "Weekday"),
              value: "0",
              options: days.map((d, i) => [d, i]),
            },
            {
              name: "start",
              label: t("התחלה", "Start"),
              type: "time",
              value: "08:00",
            },
            {
              name: "end",
              label: t("סיום", "End"),
              type: "time",
              value: "09:00",
            },
            {
              name: "action",
              label: t("מצב בזמן האירוע", "Event state"),
              value: "open",
              options: [
                [t("פתוח", "Open"), "open"],
                [t("סגור", "Closed"), "closed"],
              ],
            },
            {
              name: "kind",
              label: t("חזרה", "Recurrence"),
              value: "weekly",
              options: [
                [t("שבועי", "Weekly"), "weekly"],
                [t("חד־פעמי לדוגמה", "Example one-time"), "once"],
              ],
            },
          ],
          t("הוספת אירוע בדוגמה", "Add example event"),
          (values) => {
            const minutes = (text) => {
                const [h, m] = text.split(":").map(Number);
                return h * 60 + m;
              },
              start = minutes(values.start),
              end = minutes(values.end) || 1440;
            if (start >= end || start % 10 || end % 10)
              throw new Error("INVALID_CONFIG");
            if (gate.events.length >= gate.maxEvents)
              throw new Error("EXAMPLE_CAPACITY");
            if (
              gate.events.some(
                (e) =>
                  e.day === Number(values.day) &&
                  start < e.end &&
                  end > e.start,
              )
            )
              throw new Error(
                t(
                  "האירוע חופף לאירוע קיים בדוגמה.",
                  "This overlaps an existing sample event.",
                ),
              );
            changed(() =>
              gate.events.push({
                id: crypto.randomUUID(),
                day: Number(values.day),
                start,
                end,
                open: values.action === "open",
                once: values.kind === "once",
              }),
            );
          },
        ),
      );
    }
    function history() {
      const gate = get(),
        filter = el("input");
      filter.type = "search";
      filter.setAttribute("aria-label", t("סינון היסטוריה", "Filter history"));
      const rows = el("div");
      const show = () => {
        rows.replaceChildren();
        table(
          rows,
          [
            t("שעה", "Time"),
            t("מפעיל", "Operator"),
            t("פעולה", "Action"),
            t("מקור", "Source"),
            t("תוצאה", "Result"),
          ],
          gate.history
            .filter((h) =>
              Object.values(h)
                .join(" ")
                .toLowerCase()
                .includes(filter.value.toLowerCase()),
            )
            .map((h) => [h.time, h.actor, h.action, h.source, h.result]),
        );
      };
      filter.addEventListener("input", show);
      content.append(filter, rows);
      show();
      content.append(
        button(t("ייצוא היסטוריית הדוגמה", "Export example history"), () => {
          const quote = (v) =>
            `"${String(v)
              .replace(/^[=+@-]/, "'$&")
              .replaceAll('"', '""')}"`;
          download(
            "\ufeff" +
              [
                Object.keys(
                  gate.history[0] || {
                    time: "",
                    actor: "",
                    action: "",
                    source: "",
                    result: "",
                  },
                ),
                ...gate.history.map((h) => Object.values(h)),
              ]
                .map((row) => row.map(quote).join(","))
                .join("\r\n"),
            "WIFIGATE-example-history.csv",
          );
        }),
        button(t("ניקוי היסטוריית הדוגמה", "Clear example history"), () => {
          if (
            prompt(
              t(
                `להדגמת ניקוי היסטוריה הקלידו: ${system.name}`,
                `To simulate clearing history, type: ${system.name}`,
              ),
            ) !== system.name
          )
            return;
          changed(() => {
            gate.history = [];
          }, "HISTORY_CLEARED · Demo operator");
        }),
      );
    }
    function rf() {
      const gate = get();
      facts(content, [
        [
          t("שלט שמור", "Saved remote"),
          gate.remote.saved ? t("כן", "Yes") : t("לא", "No"),
        ],
        [
          t("חלון לימוד", "Learning window"),
          gate.remote.learning ? "60 s · demo" : t("סגור", "Closed"),
        ],
        [
          t("זוהה קוד", "Code detected"),
          gate.remote.detected ? t("כן", "Yes") : t("לא", "No"),
        ],
      ]);
      content.append(
        note(
          t(
            "במערכת אמיתית נדרש אדם ליד השער שילחץ על השלט בחלון של 60 שניות.",
            "A real gate needs a person nearby to press the remote during the 60-second learning window.",
          ),
        ),
      );
      for (const [label, action] of [
        [
          t("פתיחת חלון לימוד לדוגמה", "Start example learning"),
          () => {
            gate.remote.learning = true;
            gate.remote.detected = false;
          },
        ],
        [
          t("הדמיית לחיצה ליד השער", "Simulate nearby remote press"),
          () => {
            if (!gate.remote.learning) throw new Error("INVALID_CONFIG");
            gate.remote.detected = true;
          },
        ],
        [
          t("שמירת שלט בדוגמה", "Save sample remote"),
          () => {
            if (!gate.remote.detected) throw new Error("INVALID_CONFIG");
            gate.remote.saved = true;
            gate.remote.learning = false;
          },
        ],
        [
          t("ביטול לימוד", "Cancel learning"),
          () => {
            gate.remote.learning = false;
            gate.remote.detected = false;
          },
        ],
        [
          t("מחיקת השלט בדוגמה", "Delete sample remote"),
          () => {
            if (confirm(t("למחוק את שלט הדוגמה?", "Delete the sample remote?")))
              gate.remote.saved = false;
          },
        ],
      ])
        content.append(button(label, () => changed(action)));
    }
    function systemView() {
      const gate = get();
      facts(content, [
        [t("גרסת קושחה לדוגמה", "Sample firmware version"), gate.firmware],
        ["targetProfile", "production-secure · example"],
        ["flashVariantMb", gate.boardMb],
        ["releaseCounter", 47],
        ["maxUsers", gate.maxUsers],
        ["maxAdmins", gate.maxAdmins],
        ["maxEvents", gate.maxEvents],
        ["maxPageItems", gate.maxPageItems],
        [t("אחסון", "Storage"), "LittleFS: OK · NVS: OK · SD: OK"],
        [t("שעון", "Clock"), gate.clock],
        [t("ניהול רשת", "Network management"), "Wi-Fi · 60 s idle polling"],
      ]);
      content.append(
        el("h4", t("רשתות Wi-Fi לדוגמה", "Example Wi-Fi networks")),
      );
      table(
        content,
        [t("עדיפות", "Priority"), "SSID", "RSSI", t("פעולות", "Actions")],
        gate.networks.map((network, i) => [
          i + 1,
          network.ssid,
          network.rssi,
          button(t("העלאת עדיפות", "Move up"), () =>
            changed(() => {
              if (i)
                [gate.networks[i - 1], gate.networks[i]] = [
                  gate.networks[i],
                  gate.networks[i - 1],
                ];
            }),
          ),
        ]),
      );
      content.append(
        note(
          t(
            "סריקה לדוגמה: Example-Office, Example-Backup, Example-Lobby. סיסמאות הן לכתיבה בלבד ואינן מוצגות או נשמרות בדוגמה.",
            "Sample scan: Example-Office, Example-Backup, Example-Lobby. Passwords are write-only and are never displayed or retained in this example.",
          ),
        ),
      );
      content.append(
        form(
          [
            {
              name: "ssid",
              label: t("שם רשת לדוגמה", "Sample network name"),
              maxLength: 32,
            },
            {
              name: "password",
              label: t(
                "סיסמה לדוגמה — לא נשמרת",
                "Sample password — not retained",
              ),
              type: "password",
              required: false,
              maxLength: 63,
            },
          ],
          t("שמירת רשת בדוגמה", "Save sample network"),
          (values) => {
            if (gate.networks.length >= 3)
              throw new Error(
                t(
                  "ניתן להגדיר עד שלוש רשתות.",
                  "Up to three networks are allowed.",
                ),
              );
            changed(() =>
              gate.networks.push({
                ssid: values.ssid,
                rssi: -60,
                priority: gate.networks.length + 1,
              }),
            );
          },
        ),
      );
      content.append(
        el("h4", t("עדכון קושחה בהדגמה", "Firmware update simulation")),
        note(
          t(
            "זו הדמיית מסכי OTA; אין הורדה, העברת קושחה או התקנה על חומרה. אישור גרסה במערכת אמיתית דורש תקופת בדיקה, Bluetooth תקין וכניסת מנהל בתוך 10 דקות.",
            "This simulates OTA screens; no firmware is downloaded, transferred or installed on hardware. Real confirmation requires probation, healthy Bluetooth and administrator access within 10 minutes.",
          ),
        ),
      );
      const progress = el("progress");
      progress.max = 100;
      progress.value = gate.ota.progress;
      progress.setAttribute(
        "aria-label",
        t("התקדמות העברה מדומה", "Simulated transfer progress"),
      );
      content.append(progress);
      facts(content, [
        [t("שלב", "Stage"), gate.ota.stage],
        [t("גרסת יעד לדוגמה", "Sample target version"), gate.ota.target],
        [t("תוצאה", "Result"), gate.ota.result || "—"],
        [t("גודל מנה מרבי", "Maximum remote packet"), "960 bytes"],
        [t("חידוש מנקודה מאומתת", "Resume from verified point"), "600 s"],
      ]);
      content.append(
        button(t("התחלת עדכון מדומה", "Start simulated update"), () =>
          changed(() => {
            gate.ota.stage = "transfer";
            gate.ota.progress = 0;
            gate.ota.previous = gate.firmware;
            gate.ota.result = "";
          }),
        ),
        button(t("המשך העברה מדומה", "Advance simulated transfer"), () =>
          changed(() => {
            if (gate.ota.stage !== "transfer")
              throw new Error("INVALID_CONFIG");
            gate.ota.progress = Math.min(100, gate.ota.progress + 25);
            if (gate.ota.progress === 100) gate.ota.stage = "verified";
          }),
        ),
        button(
          t("הדמיית התקנה ואישור", "Simulate install and confirmation"),
          () => {
            if (gate.ota.stage !== "verified")
              throw new Error("INVALID_CONFIG");
            if (
              confirm(
                t(
                  "להדגים התקנה ואישור גרסה?",
                  "Simulate installing and confirming the release?",
                ),
              )
            )
              changed(() => {
                gate.firmware = gate.ota.target;
                gate.ota.stage = "confirmed";
                gate.ota.result = "Example confirmed";
              });
          },
        ),
        button(t("הדמיית חזרה לגרסה קודמת", "Simulate rollback"), () =>
          changed(() => {
            gate.firmware = gate.ota.previous;
            gate.ota.stage = "rollback";
            gate.ota.result = "Example Bluetooth health failure → rollback";
          }),
        ),
        button(t("ביטול עדכון מדומה", "Cancel simulated update"), () =>
          changed(() => {
            gate.ota.stage = "cancelled";
            gate.ota.progress = 0;
          }),
        ),
      );
      const local = el("section", undefined, "manager-local-actions");
      local.dataset.managerAction = "local-only";
      local.append(el("h4", t("פעולות מקומיות בלבד", "Local-only operations")));
      for (const feature of localOnlyFeatures) {
        const b = button(feature, () => {});
        b.disabled = true;
        b.title = t(
          "דורש ניהול מקומי ליד השער",
          "Requires local management at the gate",
        );
        local.append(b);
      }
      content.append(local);
    }
    function render() {
      if (disposed || activeRoot !== container || !container.isConnected)
        return;
      const gate = get();
      content.replaceChildren();
      tabs.replaceChildren();
      status.textContent = `${gate.online ? t("מחובר בדוגמה", "Online in example") : t("אין תקשורת עם המערכת · נתונים לא עדכניים", "No communication with the system · stale data")} · ${gate.busy ? "BUSY" : t("פנוי", "Idle")}`;
      for (const [key, label] of Object.entries(labels)) {
        const b = button(label, () => {
          tab = key;
          page = 0;
          query = "";
          render();
        });
        b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", String(key === tab));
        b.dataset.exampleTab = key;
        tabs.append(b);
      }
      if (!gate.online) {
        content.append(
          note(
            `${t("אין תקשורת עם המערכת. קשר אחרון:", "No communication with the system. Last contact:")} ${gate.lastContact}`,
          ),
        );
        return;
      }
      ({
        overview,
        users: () => peopleView("users"),
        admins: () => peopleView("admins"),
        guests,
        auto: autoOpen,
        settings,
        events,
        history,
        rf,
        system: systemView,
        bulk: () => renderBulk(content, [system]),
      })[tab]();
      placeManagerActions(content, language);
    }
    render();
  }
  return {
    renderCards,
    renderOrganizationCard,
    renderOrganization,
    renderWorkspace,
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
