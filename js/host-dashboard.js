import { initializeSiteAuth, signOut } from "./site-auth.js";
import { hostGet } from "./host-api.js";
import { parseIdentity, records, safeText } from "./host-dashboard-model.js";
import { isLocalStaging } from "./firebase-config.js";

const $ = (selector) => document.querySelector(selector);
if (isLocalStaging) $("[data-staging]").hidden = false;
let currentUser;
let identity;
let generation = 0;

const roleCopy = {
  platform_admin: ["מנהל פלטפורמה", "סקירת פלטפורמה", "לקוחות, שימוש ואירועי אבטחה לפי הרשאות השרת."],
  client_owner: ["בעל חשבון לקוח", "המפתחות והפעילות שלי", "נתונים המשויכים ללקוחות שבהם יש לך חברות פעילה."],
  client_member: ["חבר חשבון לקוח", "המפתחות והפעילות שלי", "צפייה במפתחות ובפעילות שהוקצו לחשבון שלך."]
};

function setStatus(message) { $("#dashboard-status").textContent = message; }
function appendCell(row, value) {
  const cell = document.createElement("td");
  cell.textContent = safeText(value);
  row.append(cell);
}
function renderRows(bodySelector, items, columns) {
  const body = $(bodySelector);
  body.replaceChildren();
  if (!items.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = columns.length;
    cell.textContent = "אין נתונים להצגה";
    return;
  }
  for (const item of items) {
    const row = body.insertRow();
    for (const column of columns) appendCell(row, column(item));
  }
}
function renderMemberships(memberships) {
  const list = $("#memberships-list");
  list.replaceChildren();
  if (!memberships.length) {
    list.textContent = identity.role === "platform_admin" ? "חשבון מנהל פלטפורמה" : "אין שיוכי לקוח פעילים להצגה";
    return;
  }
  for (const membership of memberships) {
    const card = document.createElement("div");
    card.className = "membership-card";
    const name = document.createElement("strong");
    name.textContent = safeText(membership.clientName || membership.name || membership.clientId);
    const detail = document.createElement("span");
    detail.textContent = `${safeText(membership.role)} · ${safeText(membership.status || "active")}`;
    card.append(name, detail);
    list.append(card);
  }
}
function renderUsage(data) {
  const root = $("#usage-cards");
  root.replaceChildren();
  const source = data?.summary || data?.totals || data || {};
  const metrics = [
    ["בקשות מאומתות", source.totalAuthenticatedRequests ?? source.total],
    ["הזמנות שנוצרו", source.invitationsCreated ?? source.created],
    ["בקשות חוזרות", source.idempotentReplays ?? source.replay],
    ["שגיאות", source.errors ?? source.error]
  ];
  for (const [label, value] of metrics) {
    const card = document.createElement("article");
    card.className = "metric-card";
    const number = document.createElement("strong");
    number.textContent = safeText(value);
    const caption = document.createElement("span");
    caption.textContent = label;
    card.append(number, caption);
    root.append(card);
  }
}
function resourceError(error) {
  if (error.status === 404 || error.status === 501) return "נקודת הקצה עדיין אינה זמינה ב־backend.";
  if (error.status === 401 || error.status === 403) return "אין הרשאה לצפות בנתונים האלה.";
  return "לא ניתן לטעון את הנתונים. בדקו את חיבור ה־API ונסו שוב.";
}
async function loadResource(name) {
  if (!currentUser || !identity) return;
  const admin = identity.role === "platform_admin";
  const paths = {
    keys: "/v1/portal/keys",
    usage: admin ? "/v1/admin/usage" : "/v1/portal/usage",
    clients: "/v1/admin/clients",
    audit: "/v1/admin/audit"
  };
  if (admin && name === "keys" || !admin && (name === "clients" || name === "audit")) return;
  const status = $(`#${name}-status`);
  status.textContent = "טוען נתונים…";
  const requestGeneration = generation;
  try {
    const data = await hostGet(currentUser, paths[name]);
    if (requestGeneration !== generation) return;
    status.textContent = "";
    if (name === "keys") renderRows("#keys-body", records(data, ["keys", "items"]), [
      (item) => item.label,
      (item) => [item.prefix, item.last4].filter(Boolean).join("…"),
      (item) => item.status,
      (item) => item.lastUsedAt || item.lastUsed
    ]);
    if (name === "clients") renderRows("#clients-body", records(data, ["clients", "items"]), [
      (item) => item.name, (item) => item.clientId || item.id, (item) => item.status
    ]);
    if (name === "audit") renderRows("#audit-body", records(data, ["events", "items", "audit"]), [
      (item) => item.action, (item) => item.target, (item) => item.createdAt || item.timestamp
    ]);
    if (name === "usage") renderUsage(data);
  } catch (error) {
    if (requestGeneration === generation) status.textContent = resourceError(error);
  }
}
function renderNavigation(admin) {
  const nav = $("#dashboard-nav");
  nav.replaceChildren();
  const sections = admin
    ? [["clients-section", "לקוחות"], ["usage-section", "שימוש"], ["audit-section", "Audit"]]
    : [["keys-section", "המפתחות שלי"], ["usage-section", "שימוש"]];
  for (const [id, label] of sections) {
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = label;
    nav.append(link);
  }
}
async function loadDashboard(user) {
  const requestGeneration = ++generation;
  currentUser = user;
  identity = null;
  $("#dashboard-content").hidden = true;
  setStatus("טוען הרשאות מהשרת…");
  try {
    const me = await hostGet(user, "/v1/me");
    if (requestGeneration !== generation) return;
    identity = parseIdentity(me);
    if (!identity || (identity.role !== "platform_admin" && !identity.memberships.length)) {
      setStatus("החשבון אומת ב־Firebase, אך אין לו הרשאה פעילה לפורטל WIFIGATE Host.");
      return;
    }
    const admin = identity.role === "platform_admin";
    const [roleLabel, title, description] = roleCopy[identity.role];
    $("#account-name").textContent = user.email || user.displayName || user.uid;
    $("#dashboard-title").textContent = title;
    $("#role-badge").textContent = roleLabel;
    $("#welcome-title").textContent = `שלום, ${user.displayName || user.email || "משתמש WIFIGATE"}`;
    $("#welcome-description").textContent = description;
    $("#keys-section").hidden = admin;
    $("#clients-section").hidden = !admin;
    $("#audit-section").hidden = !admin;
    renderMemberships(identity.memberships);
    renderNavigation(admin);
    $("#dashboard-content").hidden = false;
    setStatus("");
    await Promise.all((admin ? ["clients", "usage", "audit"] : ["keys", "usage"]).map(loadResource));
  } catch (error) {
    if (requestGeneration !== generation) return;
    setStatus(error.status === 401 || error.status === 403
      ? "השרת לא אישר את הגישה לפורטל."
      : "לא ניתן לטעון הרשאות מ־GET /v1/me. בדקו את כתובת ה־API ואת החיבור לשרת.");
  }
}

initializeSiteAuth((user) => {
  if (!user) { ++generation; location.replace("/login/"); return; }
  loadDashboard(user);
}).catch((error) => {
  setStatus(error.message === "site-auth-unconfigured" ? "חסרה הגדרת Firebase Web לאתר." : "לא ניתן להפעיל אימות Firebase.");
});

$("#sign-out").addEventListener("click", async () => {
  try { await signOut(); location.replace("/login/"); }
  catch { setStatus("ההתנתקות נכשלה. נסו שוב."); }
});
document.querySelectorAll("[data-refresh]").forEach((button) => {
  button.addEventListener("click", () => loadResource(button.dataset.refresh));
});
