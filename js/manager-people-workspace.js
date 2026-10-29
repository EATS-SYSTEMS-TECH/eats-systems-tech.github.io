// Presentation only: existing row actions, CSV flows and gate writes are reused.
export function organizeManagerPeople(content, { language, tab, rows, editor }) {
  const he = language === "he", t = (h, e) => he ? h : e;
  const el = (tag, text, cls) => {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (cls) element.className = cls;
    return element;
  };
  const panel = content.querySelector(".manager-action-panel");
  const displayed = content.querySelector('[data-people-action="displayed"]');
  if (displayed) displayed.textContent = t("ייצוא הרשומות שנטענו", "Export loaded records");
  const more = content.querySelector('[data-people-action="more"]');
  const all = content.querySelector('[data-people-action="all"]');
  const importButton = content.querySelector('[data-people-action="import"]');
  const wrap = content.querySelector(".manager-table-wrap");
  const table = wrap?.querySelector("table");
  const workspace = el("section", undefined, "manager-people-workspace");
  const header = el("header", undefined, "manager-people-header");
  const identity = el("div");
  identity.append(el("h4", tab === "users" ? t("משתמשי המערכת", "System users") : t("מנהלי המערכת", "System administrators")),
    el("p", t("ניהול פרטי הקשר והגישה לשער הנבחר", "Manage contact details and access to the selected gate")));
  const tools = el("div", undefined, "manager-people-tools");
  const add = el("button", tab === "users" ? t("הוספת משתמש", "Add user") : t("הוספת מנהל", "Add administrator"), "manager-button primary");
  add.type = "button";
  const details = el("details", undefined, "manager-people-editor");
  const summary = el("summary", add.textContent);
  for (const [keys, label, cls] of [
    [["name", "email", "countryCode", "localNumber"], t("פרטי קשר", "Contact details"), "manager-people-contact-fields"],
    [["floorNumber", "apartmentNumber", "parkingNumber"], t("פרטי מיקום", "Location details"), "manager-people-location-fields"],
  ]) {
    const group = el("fieldset", undefined, cls);
    group.append(el("legend", label));
    for (const key of keys) group.append(editor.elements[key].closest("label"));
    editor.insertBefore(group, editor.querySelector('button[type="submit"]'));
  }
  details.append(summary, el("p", t("בדקו את הפרטים. השמירה במערכת דורשת אישור נוסף.", "Review the details. Saving to the system requires a separate confirmation.")), editor);
  add.addEventListener("click", () => {
    editor.reset();
    summary.textContent = add.textContent;
    details.open = true;
    editor.elements.name.focus({ preventScroll: true });
    details.scrollIntoView({ block: "nearest" });
  });
  const cancel = el("button", t("ביטול", "Cancel"), "manager-button");
  cancel.type = "button";
  cancel.addEventListener("click", () => { details.open = false; add.focus(); });
  editor.append(cancel);
  const exports = el("details", undefined, "manager-people-exports");
  const exportLabel = el("summary", t("ייצוא CSV", "Export CSV"), "manager-button");
  exports.append(exportLabel);
  const exportOptions = el("div", undefined, "manager-people-export-options");
  for (const button of [displayed, all]) if (button) exportOptions.append(button);
  exports.append(exportOptions);
  exports.addEventListener("keydown", event => {
    if (event.key === "Escape" && exports.open) {
      event.preventDefault(); exports.open = false; exportLabel.focus();
    }
  });
  workspace.addEventListener("click", event => {
    if (!exports.contains(event.target) || event.target.closest("button")) exports.open = false;
  });
  tools.append(add);
  if (importButton) tools.append(importButton);
  tools.append(exports);
  header.append(identity, tools);
  const filter = el("div", undefined, "manager-people-filter");
  const searchLabel = el("label", t("חיפוש ברשומות שנטענו", "Search loaded records"));
  const search = el("input");
  search.type = "search";
  search.placeholder = t("שם, טלפון, אימייל או מיקום", "Name, phone, email or location");
  search.autocomplete = "off";
  searchLabel.append(search);
  const count = el("p", "", "manager-people-count");
  count.setAttribute("role", "status");
  filter.append(searchLabel, count);
  const noMatches = el("p", t("לא נמצאו רשומות מתאימות בחיפוש. נסו שם או מספר אחר.", "No matching loaded records. Try another name or number."), "manager-people-no-matches");
  noMatches.hidden = true;
  const rendered = [];
  if (table) {
    table.classList.add("manager-people-table");
    const head = table.querySelector("thead tr");
    head.replaceChildren(...[t("פרטי קשר", "Contact"), t("טלפון", "Phone"), t("מיקום", "Location"), t("פעולות", "Actions")].map(text => {
      const th = el("th", text); th.scope = "col"; return th;
    }));
    for (const [index, row] of [...table.querySelectorAll("tbody tr")].entries()) {
      const data = rows[index];
      const actions = row.lastElementChild;
      actions.className = "manager-people-row-actions";
      for (const [i, button] of [...actions.querySelectorAll("button")].entries()) {
        button.classList.add(i ? "manager-people-delete" : "manager-people-edit");
        button.title = `${button.textContent}: ${data.name || data.localNumber}`;
      }
      const person = el("td", undefined, "manager-people-person");
      const avatar = el("span", String(data.name || "?").trim().slice(0, 1).toUpperCase(), "manager-people-avatar");
      avatar.setAttribute("aria-hidden", "true");
      const contact = el("div");
      contact.append(el("strong", data.name || t("ללא שם", "Unnamed")));
      if (data.email) { const email = el("span", data.email); email.dir = "ltr"; contact.append(email); }
      person.append(avatar, contact);
      const phone = el("td", undefined, "manager-people-phone");
      const number = el("bdi", `+${data.countryCode} ${data.localNumber}`); number.dir = "ltr";
      phone.append(number);
      const location = el("td", undefined, "manager-people-location");
      for (const [key, label] of [["floorNumber", t("קומה", "Floor")], ["apartmentNumber", t("דירה", "Apartment")], ["parkingNumber", t("חניה", "Parking")]]) {
        if (data[key] !== null && data[key] !== undefined && data[key] !== "") location.append(el("span", `${label} ${data[key]}`));
      }
      row.replaceChildren(person, phone, location, actions);
      rendered.push({row, text: `${Object.values(data).join(" ")} +${data.countryCode} ${data.localNumber} ${data.countryCode}${data.localNumber}`.toLocaleLowerCase()});
    }
  }
  const update = () => {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const item of rendered) { item.row.hidden = !item.text.includes(query); if (!item.row.hidden) visible++; }
    count.textContent = query ? t(`${visible} מתוך ${rows.length} רשומות שנטענו`, `${visible} of ${rows.length} loaded records`) : t(`${rows.length} רשומות שנטענו`, `${rows.length} loaded records`);
    noMatches.hidden = !query || visible > 0;
  };
  search.addEventListener("input", update);
  update();
  workspace.append(header, details, filter);
  if (wrap) workspace.append(wrap);
  else workspace.append(el("p", t("אין עדיין רשומות. הוסיפו אדם ראשון או ייבאו קובץ CSV.", "No records yet. Add the first person or import a CSV file."), "manager-people-empty"));
  workspace.append(noMatches);
  if (more) { const footer = el("footer", undefined, "manager-people-footer"); footer.append(el("span", t("טענו רשומות נוספות כדי להרחיב את הרשימה והחיפוש", "Load more records to extend the list and search")), more); workspace.append(footer); }
  // All controls have been moved before discarding the generic action container.
  panel?.remove();
  content.replaceChildren(workspace);
}
