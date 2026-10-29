// Display codes follow WG_HistoryManager.hpp; transport and CSV rows stay intact.
const node = (tag, text, cls) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (cls) element.className = cls;
  return element;
};
export function managerHistoryRecord(row, language = "en") {
  const he = language === "he", t = (h, e) => he ? h : e;
  const events = he ? ["", "פתיחה", "הפעלה", "כיבוי", "החזקה", "שחרור", "פתוח מאולץ", "סגור מאולץ", "מצב רגיל", "הפעלה מחדש", "ניקוי היסטוריה"]
    : ["", "Open", "On", "Off", "Hold", "Release", "Held open", "Held closed", "Normal mode", "Restart", "History cleared"];
  const sources = he ? ["מערכת", "אפליקציית WIFIGATE", "Auto Open", "לחצן טכנאי", "לחצן שער", "שלט", "אירוע מתוזמן", "עקיפה", "שירות", "WIFIGATE Manager"]
    : ["System", "WIFIGATE app", "Auto Open", "Technician button", "Gate button", "Remote control", "Scheduled event", "Override", "Service", "WIFIGATE Manager"];
  const timestamp = Number(row[1]), offset = Number(row[2]);
  let date = t("זמן לא זמין", "Time unavailable"), time = "";
  if (Number.isFinite(timestamp) && timestamp > 0 && Number.isFinite(offset)) {
    const value = new Date((timestamp + offset * 60) * 1000);
    if (Number.isFinite(value.getTime())) {
      date = new Intl.DateTimeFormat(he ? "he-IL" : "en-GB", { day:"numeric", month:"short", year:"numeric", timeZone:"UTC" }).format(value);
      time = value.toISOString().slice(11, 19);
    }
  }
  return {
    date, time,
    action: events[row[5]] || t("פעולה לא מזוהה", "Unrecognized action"),
    source: sources[row[6]] || t("מקור לא מזוהה", "Unrecognized source"),
    name: row[13] || t("לא תועד שם", "Name not recorded"), phone: row[14] || "",
    result: row[8] === 0 ? t("בוצע", "Done") : row[8] === 1 ? t("סורב", "Refused") : t("תוצאה לא זמינה", "Result unavailable"),
    state: row[8] === 0 ? "done" : row[8] === 1 ? "refused" : "unknown",
  };
}
export function managerHistoryDay(day, language = "en") {
  const value = String(day);
  if (!/^\d{8}$/.test(value)) return value;
  const date = new Date(`${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10).replaceAll("-", "") !== value) return value;
  return new Intl.DateTimeFormat(language === "he" ? "he-IL" : "en-GB", {day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(date);
}
function heading(language, guests, subtitle) {
  const he = language === "he";
  const header = node("header", undefined, "manager-history-header");
  const identity = node("div");
  identity.append(node("h4", guests ? (he ? "פעילות אורחים" : "Guest activity") : (he ? "היסטוריית המערכת" : "System history")), node("p", subtitle));
  header.append(identity);
  return header;
}
export function renderManagerHistoryDays(content, { days, language, guests, more, createButton, onDay, moreButton }) {
  const he = language === "he", t = (h,e) => he ? h : e;
  let workspace = more ? content.querySelector(".manager-history-workspace") : null;
  if (!workspace) {
    workspace = node("section", undefined, "manager-history-workspace");
    workspace.append(heading(language, guests, guests ? t("בחרו יום לצפייה בפעילות האורחים שתועדה במערכת", "Choose a day to view guest activity recorded by the system") : t("בחרו יום לצפייה בפעולות שתועדו במערכת", "Choose a day to view recorded system activity")), node("div", undefined, "manager-history-days"));
    content.replaceChildren(workspace);
  }
  workspace.querySelector(".manager-history-more-days")?.remove();
  const list = workspace.querySelector(".manager-history-days");
  for (const [day, count] of days) {
    const existing = [...list.children].find(item => item.dataset.historyDay === String(day));
    if (existing) continue;
    const button = createButton("", () => onDay(day));
    button.classList.add("manager-history-day");
    button.dataset.historyDay = day;
    button.append(node("span", t("יומן פעילות", "Activity log"), "manager-history-day-label"), node("strong", managerHistoryDay(day, language)), node("span", t(`${count} רשומות במערכת`, `${count} system records`), "manager-history-day-count"), node("span", t("צפייה בפעילות ←", "View activity →"), "manager-history-day-link"));
    list.append(button);
  }
  if (!list.childElementCount) list.append(node("p", t("אין עדיין היסטוריה זמינה במערכת.", "No system history is available yet."), "manager-history-empty"));
  if (moreButton) { moreButton.classList.add("manager-history-more-days"); workspace.append(moreButton); }
}
export function renderManagerHistoryRecords(content, { rows, language, guests, day, backButton, moreButton, exportButton }) {
  const he = language === "he", t = (h,e) => he ? h : e;
  const workspace = node("section", undefined, "manager-history-workspace");
  const header = heading(language, guests, managerHistoryDay(day, language));
  const tools = node("div", undefined, "manager-history-tools");
  tools.append(backButton, exportButton);
  exportButton.disabled = !rows.length;
  header.append(tools);
  workspace.append(header);
  const summary = node("div", undefined, "manager-history-summary");
  summary.append(node("span", rows.length === 1 ? t("רשומה אחת נטענה", "1 record loaded") : t(`${rows.length} רשומות שנטענו`, `${rows.length} records loaded`)), node("span", t("השעות מוצגות לפי שעון המערכת", "Times follow the system clock")));
  workspace.append(summary);
  if (!rows.length) workspace.append(node("p", guests ? t("אין פעילות אורחים ברשומות שנטענו ליום זה.", "No guest activity in the records loaded for this day.") : t("אין רשומות שנטענו ליום זה.", "No records loaded for this day."), "manager-history-empty"));
  else {
    const wrap = node("div", undefined, "manager-table-wrap");
    const table = node("table", undefined, "manager-table manager-history-table");
    table.setAttribute("aria-label", guests ? t("פעילות אורחים", "Guest activity") : t("היסטוריית המערכת", "System history"));
    const titles = [t("מועד", "When"), t("פעולה", "Action"), t("מקור הפעולה", "Source"), t("פרטי משתמש", "Person"), t("תוצאה", "Result")];
    const head = node("thead"), headRow = node("tr");
    for (const text of titles) { const cell=node("th",text); cell.scope="col"; headRow.append(cell); }
    head.append(headRow);
    const body = node("tbody");
    for (const raw of rows) {
      const data = managerHistoryRecord(raw, language), row = node("tr");
      const cells = titles.map(title => { const td=node("td"); td.dataset.label=title; return td; });
      cells[0].className = "manager-history-time";
      const time = node("bdi", data.time || data.date); time.dir="ltr";
      cells[0].append(time);
      if (data.time) cells[0].append(node("span", data.date));
      cells[1].append(node("span",data.action,"manager-history-action"));
      cells[2].append(node("span",data.source,"manager-history-source"));
      cells[3].className = "manager-history-person";
      cells[3].append(node("strong",data.name));
      if (data.phone) { const phone=node("bdi",data.phone); phone.dir="ltr"; cells[3].append(phone); }
      const result=node("span",data.result,"manager-history-result"); result.dataset.state=data.state;
      cells[4].append(result);
      row.append(...cells); body.append(row);
    }
    table.append(head,body); wrap.append(table); workspace.append(wrap);
  }
  if (moreButton) { const footer=node("footer",undefined,"manager-history-footer"); footer.append(node("p",t("רשומות נוספות עשויות להיות זמינות במערכת", "More records may be available on the system")),moreButton); workspace.append(footer); }
  content.replaceChildren(workspace);
}
