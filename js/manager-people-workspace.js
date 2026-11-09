// Presentation only: existing row actions, CSV flows and gate writes are reused.
import { createManagerSectionHeading } from "./manager-section-heading.js";
export function organizeManagerPeople(content, { language, tab, rows, editor, status }) {
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
  const header = createManagerSectionHeading({title:tab === "users" ? t("משתמשי המערכת", "System users") : t("מנהלי המערכת", "System administrators"),description:t("ניהול פרטי הקשר והגישה לשער הנבחר", "Manage contact details and access to the selected gate"),icon:tab === "users" ? "people" : "admin",level:"h4",className:"manager-people-header"});
  const tools = el("div", undefined, "manager-people-tools");
  const add = el("button", tab === "users" ? t("הוספת משתמש", "Add user") : t("הוספת מנהל", "Add administrator"), "manager-button primary");
  add.type = "button";
  // Add and edit open the same gate form in a modal dialog.
  const dialog = el("dialog", undefined, "manager-people-editor manager-people-dialog");
  dialog.dir = he ? "rtl" : "ltr";
  dialog.id = `manager-people-dialog-${tab}`;
  dialog.setAttribute("aria-labelledby", `${dialog.id}-title`);
  dialog.setAttribute("aria-describedby", `${dialog.id}-note`);
  const dialogHead = el("header", undefined, "manager-people-dialog-head");
  const badge = el("span", undefined, "manager-people-dialog-icon");
  badge.setAttribute("aria-hidden", "true");
  badge.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/></svg>';
  const titles = el("div");
  const title = el("h2", add.textContent);
  title.id = `${dialog.id}-title`;
  const note = el("p", t("בדקו את הפרטים. השמירה בשער דורשת אישור נוסף.", "Review the details. Saving to the gate requires a separate confirmation."));
  note.id = `${dialog.id}-note`;
  titles.append(title, note);
  const close = el("button", undefined, "manager-people-dialog-close");
  close.type = "button";
  close.setAttribute("aria-label", t("סגירה", "Close"));
  close.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  dialogHead.append(badge, titles, close);
  for (const [keys, label, cls] of [
    [["name", "email", "countryCode", "localNumber"], t("פרטי קשר", "Contact details"), "manager-people-contact-fields"],
    [["floorNumber", "apartmentNumber", "parkingNumber"], t("פרטי מיקום", "Location details"), "manager-people-location-fields"],
  ]) {
    const group = el("fieldset", undefined, cls);
    group.append(el("legend", label));
    for (const key of keys) group.append(editor.elements[key].closest("label"));
    editor.insertBefore(group, editor.querySelector('button[type="submit"]'));
  }
  // Gate errors are reported in the workspace status, which the modal covers.
  const failure = el("p", "", "manager-people-dialog-error");
  failure.setAttribute("role", "alert");
  failure.hidden = true;
  const showFailure = () => {
    const error = dialog.open && status?.dataset.state === "error" ? status.textContent : "";
    failure.textContent = error;
    failure.hidden = !error;
  };
  if (status) new MutationObserver(showFailure).observe(status, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ["data-state"] });
  const submit = editor.querySelector('button[type="submit"]');
  const actions = el("div", undefined, "manager-people-dialog-actions");
  const cancel = el("button", t("ביטול", "Cancel"), "manager-button");
  cancel.type = "button";
  cancel.addEventListener("click", () => dialog.close());
  close.addEventListener("click", () => dialog.close());
  actions.append(cancel, submit);
  editor.append(failure, actions);
  dialog.append(dialogHead, editor);
  let returnFocus = add;
  dialog.openEditor = (heading, editing = false) => {
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : add;
    title.textContent = heading;
    submit.textContent = editing ? t("שמירת שינויים", "Save changes") : heading;
    failure.hidden = true;
    if (!dialog.open) dialog.showModal();
    editor.elements.name.focus();
  };
  dialog.addEventListener("close", () => {
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  add.addEventListener("click", () => {
    editor.reset();
    dialog.openEditor(add.textContent);
  });
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
  header.append(tools);
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
  workspace.append(header, dialog, filter);
  if (wrap) workspace.append(wrap);
  else workspace.append(el("p", t("אין עדיין רשומות. הוסיפו אדם ראשון או ייבאו קובץ CSV.", "No records yet. Add the first person or import a CSV file."), "manager-people-empty"));
  workspace.append(noMatches);
  if (more) { const footer = el("footer", undefined, "manager-people-footer"); footer.append(el("span", t("טענו רשומות נוספות כדי להרחיב את הרשימה והחיפוש", "Load more records to extend the list and search")), more); workspace.append(footer); }
  // All controls have been moved before discarding the generic action container.
  panel?.remove();
  content.replaceChildren(workspace);
}
