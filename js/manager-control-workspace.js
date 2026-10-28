import { createSystemIcon } from "./wifigate-system-icons.js";

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
const copy = language => (he, en) => language === "he" ? he : en;
const number = value => typeof value === "number" && Number.isFinite(value) && value >= 0;

export function createManagerControlHeader({ system, language, returnButton, actions }) {
  const t = copy(language);
  const header = node("header", undefined, "manager-workspace-head");
  const identity = node("div", undefined, "manager-workspace-identity");
  const icon = createSystemIcon(system);
  icon.classList.add("manager-workspace-icon");
  const heading = node("div", undefined, "manager-workspace-heading");
  const count = system.systemIds.length;
  const type = system.type === "group" ? t("קבוצת שערים", "Gate group")
    : system.type === "dual-control" ? "Dual Control" : t("שער", "Gate");
  heading.append(
    node("span", "WIFIGATE MANAGER", "manager-workspace-eyebrow"),
    node("h3", system.name),
    node("p", `${type} · ${count} ${count === 1 ? t("שער", "gate") : t("שערים", "gates")}`, "manager-workspace-context"),
    node("span", "", "manager-workspace-status"),
  );
  identity.append(icon, heading);
  const tools = node("div", undefined, "manager-workspace-tools");
  tools.append(returnButton, actions);
  header.append(identity, tools);
  setManagerControlState(header, "waiting", language);
  return header;
}

export function setManagerControlState(container, state, language) {
  const badge = container.querySelector(".manager-workspace-status");
  if (!badge) return;
  const t = copy(language);
  badge.dataset.state = state;
  badge.setAttribute("role", "status");
  badge.setAttribute("aria-live", "polite");
  badge.textContent = {
    waiting: t("ממתינים לחיבור", "Waiting for connection"),
    loading: t("מכינים את סביבת הניהול", "Preparing your workspace"),
    connecting: t("מתחברים למערכת", "Connecting to the system"),
    connected: t("חיבור מאובטח פעיל", "Secure connection active"),
    simulation: t("סימולציה פעילה", "Simulation active"),
    error: t("החיבור נעצר", "Connection interrupted"),
  }[state] || t("מתחברים למערכת", "Connecting to the system");
}

export function createManagerGatePicker({ system, language, onChange }) {
  const t = copy(language);
  const wrapper = node("section", undefined, "manager-gate-picker");
  const heading = node("div", undefined, "manager-gate-picker-heading");
  const label = node("label", t("על איזה שער עובדים?", "Which gate are you managing?"));
  label.htmlFor = "manager-selected-gate";
  heading.append(label, node("small", t("הפעולות חלות על השער הנבחר בלבד.", "Actions apply to the selected gate only.")));
  const select = node("select", undefined, "manager-button");
  select.id = "manager-selected-gate";
  select.setAttribute("aria-label", t("בחירת שער", "Choose gate"));
  system.systemIds.forEach((id, index) => select.append(new Option(t(`שער ${index + 1}`, `Gate ${index + 1}`), id)));
  select.addEventListener("change", () => onChange(select.value));
  wrapper.append(heading, select);
  return wrapper;
}

export function updateManagerSelectedGate(container, gate, name, language) {
  const select = container.querySelector("#manager-selected-gate");
  if (!select) return;
  select.value = gate;
  if (!name) return;
  const t = copy(language);
  [...select.options].forEach((option, index) => {
    if (option.value === gate) option.textContent = `${t(`שער ${index + 1}`, `Gate ${index + 1}`)} · ${name}`;
  });
}

// Presentation only: the caller owns the existing authenticated opening action.
export function renderManagerControlOverview({ content, system, overview, maximum, language, openButton }) {
  const t = copy(language);
  const format = value => number(value) ? new Intl.NumberFormat(language === "he" ? "he-IL" : "en-US").format(value) : t("לא זמין", "Unavailable");
  const layout = node("div", undefined, "manager-control-overview");
  const primary = node("section", undefined, "manager-primary-control");
  primary.setAttribute("aria-label", t("שליטה בשער", "Gate control"));
  const symbol = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const [key, value] of Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": "1.7", "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" })) symbol.setAttribute(key, value);
  symbol.classList.add("manager-control-symbol");
  const path = document.createElementNS(symbol.namespaceURI, "path");
  path.setAttribute("d", "M4 21V4l12-2v19M16 6h4v15M2 21h20M12 12h.01");
  symbol.append(path);
  primary.append(
    symbol,
    node("span", t("שליטה בשער", "Gate control"), "manager-control-eyebrow"),
    node("h4", overview?.systemName || system.name),
    node("p", t("פתיחה מרחוק, עם אישור לפני ביצוע.", "Open remotely, with confirmation before the action.")),
    openButton,
    node("small", t("הפעולה תתבצע אחרי האישור שלכם.", "The action runs after your confirmation."), "manager-control-confirmation"),
  );
  const health = node("div", undefined, "manager-control-health");
  if (overview?.health?.state != null) health.append(node("span", overview.health.state === "OK" ? t("מצב המערכת: תקין", "System health: OK") : `${t("מצב המערכת", "System health")}: ${String(overview.health.state)}`, "manager-control-chip"));
  if (typeof overview?.health?.historyAvailable === "boolean") health.append(node("span", overview.health.historyAvailable ? t("היסטוריה זמינה", "History available") : t("היסטוריה אינה זמינה", "History unavailable"), "manager-control-chip"));
  if (health.childElementCount) primary.append(health);
  const metrics = node("dl", undefined, "manager-overview-metrics manager-facts");
  metrics.setAttribute("aria-label", t("תמונת מצב", "At a glance"));
  for (const [key, label, value] of [
    ["users", t("משתמשים", "Users"), overview?.counts?.users],
    ["admins", t("מנהלים", "Administrators"), overview?.counts?.admins],
    ["events", t("אירועים", "Events"), overview?.counts?.events],
    ["maxUsers", t("מספר משתמשים מרבי", "Maximum users"), maximum],
  ]) {
    const metric = node("div", undefined, "manager-overview-metric");
    metric.dataset.metric = key;
    metric.append(node("dt", label), node("dd", format(value)));
    if (key === "users" && number(maximum) && maximum > 0 && number(value)) {
      metric.append(node("small", t(`מתוך ${format(maximum)} מקומות`, `of ${format(maximum)} places`)));
      const progress = node("progress");
      progress.max = maximum;
      progress.value = Math.min(value, maximum);
      progress.setAttribute("aria-label", t("ניצול קיבולת המשתמשים", "User capacity used"));
      metric.append(progress);
    }
    metrics.append(metric);
  }
  layout.append(primary, metrics);
  const details = node("details", undefined, "manager-overview-details");
  details.append(node("summary", t("פרטי המערכת", "System details")));
  content.append(layout, details);
  return details;
}
