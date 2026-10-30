import { payRequest } from "./api/index.js";
import qrcode from "./vendor/qrcode-generator.js";
import { createManagerSystemCard } from "./manager-system-card.js";
import { createManagerOrganizationCard, createOrganizationLogo } from "./manager-organization-card.js";
import { createManagerOrganizationPicker } from "./manager-organization-picker.js";
import { createManagerActivity } from "./manager-activity.js";
import { createOrganizationRoleCard } from "./role-guide.js";

const BASE = "/api/v1/pay";
const el = (tag, text, cls) => {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (cls) node.className = cls;
  return node;
};
const icons = {
  gate: "M3 20v-8h4v8M5 12V7h15v5H5Zm4-5 3 5m2-5 3 5M3 20h6",
  "dual-control": "M4 4h16v16H4V4Zm3 4h10M7 12h10M7 16h10",
  group: "M3 6h7l2 2h9v12H3V6Zm1-3h7l2 2h6",
  systems: "M3 4h7v7H3V4Zm11 0h7v7h-7V4ZM3 15h7v6H3v-6Zm11 0h7v6h-7v-6Z",
  tune: "M4 7h16M4 17h16M8 4v6m8 4v6",
  qr: "M3 3h6v6H3V3Zm12 0h6v6h-6V3ZM3 15h6v6H3v-6Zm12 0h2v2h4v4h-6v-2m6-7v2m-10 1v6",
  arrow: "m15 5-7 7 7 7",
  info: "M12 11v6m0-10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  refresh: "M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1",
};
function icon(name) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.6");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", icons[name] || icons.gate);
  svg.append(path);
  return svg;
}
export function payMoney(amount, currency, language = "en") {
  return Number.isSafeInteger(amount) && amount >= 0 && ["ILS", "USD", "EUR"].includes(currency)
    ? new Intl.NumberFormat(language === "he" ? "he-IL" : "en-GB", { style: "currency", currency }).format(amount / 100)
    : language === "he" ? "טרם הוגדר" : "Not configured";
}
export function safePayPointUrl(value, origin = location.origin) {
  if (typeof value !== "string" || !/^\/pay\/point\/\?id=[a-f0-9]{64}$/.test(value)) return null;
  return new URL(value, origin).href;
}
export function payTariff(config, language = "en") {
  const mode = config?.accessMode || "single-entry";
  const amount = payMoney(mode === "metered" ? config?.hourlyRateMinor : config?.priceMinor, config?.currency, language);
  const unit = mode === "metered" ? language === "he" ? "לשעה" : "per hour" : mode === "timed" ? language === "he" ? `${config?.windowMin || 60} דקות` : `${config?.windowMin || 60} minutes` : language === "he" ? "לכניסה" : "per entry";
  return `${amount} · ${unit}`;
}

export function createPayDashboard({ root, user, language = "en", api, onProfile = () => {} }) {
  const t = (he, en) => language === "he" ? he : en;
  const rawRequest = api ?? ((path, method = "GET", body, key) => payRequest(user, path, method, body, key));
  const request = (path, method = "GET", body, key) => activity.track(
    method !== "GET" ? t("מעדכן את הנתונים…", "Updating data…") : path.endsWith("/me") ? t("טוען את סביבת העבודה…", "Loading your workspace…") : t("טוען מערכות…", "Loading systems…"),
    () => rawRequest(path, method, body, key),
  );
  let closed = false, generation = 0, profile, items = [], nextCursor = null, selected, demo = false, tab = "overview", busy = false, organizationId = null, listView = "systems";
  let activeDialog, organizationPicker;
  let lastFocus;
  const examples = [
    { id: "example-gate", name: t("שער החניון", "Car park gate"), type: "gate", targetId: "DEMO-GATE", systemIds: ["DEMO-GATE"], version: 1 },
    { id: "example-dual", name: t("כניסה ויציאה", "Entry and exit"), type: "dual-control", targetId: "DEMO-DUAL", systemIds: ["DEMO-DUAL"], version: 1 },
    { id: "example-group", name: t("מתחם העסקים", "Business campus"), type: "group", targetId: "DEMO-GROUP", systemIds: ["DEMO-1", "DEMO-2", "DEMO-3"], version: 1 },
  ].map((system, index) => ({ ...system, capabilities: { paymentModes: ["single-entry", "metered", "timed"], paymentsEnabled: false, physicalOpening: false }, config: { displayName: system.name, description: t("נקודת תשלום לדוגמה בחניון.", "An example car park payment point."), currency: "ILS", priceMinor: 1200 + index * 300, graceMinutes: 10, maxSessionMinutes: 1440, accessMode: "single-entry", validityMin: 15, windowMin: 60, hourlyRateMinor: 0, dailyCap: null, enabled: false }, publicPoint: { status: "preview_only" } }));
  root.className = "pay-dashboard";
  root.replaceChildren();
  const shell = el("div", undefined, "manager-shell pay-shell");
  shell.dataset.mode = "workspace";
  const navigation = el("nav", undefined, "manager-nav pay-nav");
  navigation.setAttribute("aria-label", t("ניווט Pay", "Pay navigation"));
  const main = el("div", undefined, "manager-main pay-main");
  const live = el("p", "", "manager-status pay-live");
  live.setAttribute("role", "status");
  live.setAttribute("aria-live", "polite");
  const content = el("section", undefined, "manager-view pay-view pay-content");
  main.append(live, content);
  shell.append(navigation, main);
  root.append(shell);
  const activity = createManagerActivity({ main, view: content, language });
  function button(text, action, cls = "") {
    const b = el("button", text, "manager-button pay-button " + cls);
    b.type = "button";
    b.addEventListener("click", action);
    return b;
  }
  function errorText(error) {
    if (error?.status === 409 || error?.code === "VERSION_CONFLICT") return t("הפרטים עודכנו במקביל. טענו את הפרטים העדכניים לפני שמירה נוספת.", "These details changed in another session. Load the latest details before saving again.");
    if (error?.status === 403) return t("אין לחשבון הרשאה לפעולה הזו. אפשר לחזור למערכות שלי ולרענן את הגישה.", "Your account does not have permission for this action. Return to My systems and refresh your access.");
    if (error?.status === 404) return t("המערכת אינה זמינה לחשבון הזה. ייתכן שהקישור אליה הוסר.", "This system is not available to this account. Its link may have been removed.");
    if (error?.status === 429) return t("בוצעו בקשות רבות בזמן קצר. המתינו מעט ונסו שוב.", "Too many requests. Wait a moment and try again.");
    if (error?.code === "PAY_MODE_UNSUPPORTED") return t("התעריף שנבחר אינו זמין למערכת הזו. טענו את פרטי המערכת העדכניים ובחרו מתוך האפשרויות הזמינות.", "The selected tariff is not available for this system. Load the latest system details and choose an available option.");
    return t("לא הצלחנו להשלים את הפעולה. בדקו את החיבור ונסו שוב.", "We could not complete the action. Check your connection and try again.");
  }
  function announce(text, state = "info") {
    if (closed) return;
    live.textContent = text;
    live.dataset.state = state;
    live.setAttribute("role", state === "error" ? "alert" : "status");
  }
  function loading() {
    content.replaceChildren();
    content.setAttribute("aria-busy", "true");
    announce("");
  }
  function failure(error, retry) {
    content.setAttribute("aria-busy", "false");
    content.replaceChildren();
    const box = el("section", undefined, "manager-empty manager-empty-systems pay-empty pay-error");
    box.setAttribute("role", "alert");
    box.append(icon("info"), el("h4", t("לא ניתן לטעון כרגע", "Unable to load right now")), el("p", errorText(error)), button(t("ניסיון נוסף", "Try again"), retry));
    content.append(box);
  }
  function cancelDialog() {
    if (!activeDialog) return;
    activeDialog.close();
    activeDialog.remove();
    activeDialog = undefined;
    activity.pause(false);
    if (lastFocus?.isConnected) lastFocus.focus();
  }
  function closeView() { ++generation; cancelDialog(); activity.reset(); selected = undefined; busy = false; }
  function disabledBanner() {
    const banner = el("aside", undefined, "manager-note pay-preparation");
    banner.append(icon("info"));
    const text = el("div");
    text.append(el("strong", t("מכינים את סביבת התשלום", "Prepare your payment workspace")), el("p", t("אפשר להגדיר נקודות ותעריפים ולבדוק את התצוגה. סליקה ופתיחת מערכות באמצעות Pay אינן פעילות.", "Configure points and tariffs and review the customer experience. Payments and system opening through Pay are not active.")));
    banner.append(text);
    return banner;
  }
  const organizationRole = role => ({ owner: t("בעל הארגון", "Organization owner"), admin: t("מנהל ארגון", "Organization admin"), staff: t("צוות ארגון", "Organization staff") })[role] ?? t("צפייה בנקודות ובתעריפים", "View payment points and tariffs");
  function renderNavigation() {
    organizationPicker?.destroy();
    organizationPicker = undefined;
    navigation.replaceChildren();
    const personalNavigation = el("section", undefined, "manager-personal-navigation");
    personalNavigation.setAttribute("aria-label", t("סביבת עבודה אישית", "Personal workspace"));
    personalNavigation.append(el("p", t("סביבת עבודה אישית", "Personal workspace"), "manager-nav-title"));
    navigation.append(personalNavigation);
    if (!profile) return;
    const roles = el("div", undefined, "manager-sidebar-roles");
    const role = el("span", profile.role === "admin" ? "WIFIGATE Pay Admin" : "WIFIGATE Pay User");
    role.dir = "ltr";
    roles.append(role);
    personalNavigation.append(roles);
    const personal = button(t("המערכות שלי", "My systems"), () => { organizationId = null; listView = "systems"; void load(); });
    const organizations = button(t("הארגונים שלי", "My organizations"), () => { organizationId = null; listView = "organizations"; closeView(); renderList(); announce(""); });
    if (!organizationId) (listView === "organizations" ? organizations : personal).setAttribute("aria-current", "page");
    personalNavigation.append(personal, organizations);
    if (profile.organizations?.length) {
      const organizationArea = el("section", undefined, "manager-organization-area");
      organizationArea.setAttribute("aria-label", t("סביבת הארגון", "Organization workspace"));
      organizationArea.append(el("p", t("סביבת הארגון", "Organization workspace"), "manager-nav-title"));
      navigation.append(organizationArea);
      organizationPicker = createManagerOrganizationPicker({
        organizations: profile.organizations.map(org => ({ ...org, name: org.name || t("ארגון", "Organization"), role: org.role })),
        selectedId: organizationId,
        language,
        onSelect: id => { organizationId = id; listView = "systems"; void load(); },
      });
      organizationArea.append(organizationPicker.root);
      if (organizationId && profile.organizations.some(org => org.id === organizationId)) {
        const organizationSystems = button(t("מערכות הארגון", "Organization systems"), () => { listView = "systems"; void load(); });
        organizationSystems.dataset.organizationView = "systems";
        organizationSystems.setAttribute("aria-current", "page");
        organizationArea.append(organizationSystems);
      }
    }
  }
  function renderOrganizations() {
    content.append(el("h3", t("הארגונים שלי", "My organizations")));
    const grid = el("div", undefined, "manager-org-columns pay-organization-list");
    for (const organization of profile?.organizations || []) {
      const actions = el("div", undefined, "manager-org-actions");
      actions.append(button(t("כניסה לארגון", "Open organization"), () => { organizationId = organization.id; listView = "systems"; void load(); }, "primary"));
      const knownCount = Number.isSafeInteger(organization.linkedSystemCount) && organization.linkedSystemCount >= 0;
      const card = createManagerOrganizationCard({ organization: { ...organization, name: organization.name || t("ארגון", "Organization"), linkedSystemCount: knownCount ? organization.linkedSystemCount : 0 }, language, actions });
      card.classList.add("pay-organization-card");
      if (!organization.owner?.email) card.querySelector(".manager-org-owner").replaceChildren(el("small", t("הגישה שלכם", "Your access")), el("strong", organizationRole(organization.role)));
      if (!knownCount) card.querySelector(".manager-org-count").remove();
      grid.append(card);
    }
    content.append(grid);
    if (!grid.childElementCount) {
      const empty = el("section", undefined, "manager-empty manager-empty-systems pay-empty");
      empty.append(el("h4", t("הארגונים שלכם יופיעו כאן", "Your organizations will appear here")), el("p", t("כאן מוצגים ארגונים שבהם הוגדרה לחשבון שלכם גישת Pay פעילה.", "This area shows organizations where your account has active Pay access.")));
      content.append(empty);
    }
  }
  function card(system, isDemo) {
    const actions = el("div", undefined, "manager-system-actions");
    actions.append(button(t("פתיחת סביבת ניהול", "Open workspace"), () => void openSystem(system, isDemo), "primary"));
    const value = createManagerSystemCard({ system: { ...system, name: system.name || system.config?.displayName || t("מערכת", "System"), systemIds: system.systemIds || [system.targetId] }, language, actions, example: isDemo });
    value.classList.add("pay-system-card");
    value.dataset.systemId = system.id;
    return value;
  }
  function fold(title, subtitle, body, open = false) {
    const details = el("details", undefined, "manager-examples dashboard-examples pay-fold");
    details.open = open;
    details.append(el("summary", title));
    if (subtitle) details.append(el("p", subtitle, "manager-muted"));
    details.append(body);
    return details;
  }
  function setupGuide() {
    const guide = el("details", undefined, "manager-setup-guide dashboard-examples pay-fold");
    guide.append(el("summary", t("איך מוסיפים מערכת?", "How do I add a system?")), el("p", t("מקשרים את המערכת לחשבון שלכם בתהליך הפעלה מאומת, ואז מנהלים את נקודת Pay כאן באתר.", "Link a system to your account through verified activation, then manage its Pay point here on the website.")));
    const steps = el("ol", undefined, "manager-setup-steps");
    for (const [title, description] of [
      [t("התחברו לאותו חשבון", "Sign in with the same account"), t("השתמשו בחשבון WIFIGATE שבו אתם מחוברים באתר.", "Use the WIFIGATE account you use on this website.")],
      [t("ודאו שגישת Pay פעילה", "Check your Pay access"), t("קישור מערכת זמין לאחר אישור גישת Pay ובהפעלה מבוקרת.", "System linking is available after Pay access approval through controlled activation.")],
      [t("בחרו את המערכת באפליקציה", "Choose your system in the app"), t("נדרשת גישת מנהל מקומי מאומתת. הפעילו Bluetooth והישארו ליד המערכת לצורך אימות הקישור.", "Verified local administrator access is required. Enable Bluetooth and stay near the system to verify its link.")],
      [t("השלימו את הקישור המאומת", "Complete verified linking"), t("בתהליך ההפעלה המבוקר השלימו את אימות המערכת והמתינו לאישור שקושרה לחשבון.", "During controlled activation, complete system verification and wait for confirmation that it is linked to your account.")],
      [t("חזרו אל המערכות שלי באתר", "Return to My systems on the website"), t("פתחו את Pay עם אותו חשבון ולחצו רענון. בחרו את המערכת כדי להכין את הנקודה והתעריף.", "Open Pay with the same account and select Refresh. Choose your system to prepare its point and tariff.")],
    ]) { const step = el("li"); step.append(el("strong", title), el("p", description)); steps.append(step); }
    guide.append(steps, disabledBanner());
    return guide;
  }
  function organizationHeader(organization) {
    const header = el("section", undefined, "manager-organization-header pay-organization-header");
    const name = organization.name || t("ארגון", "Organization");
    const text = el("div", undefined, "manager-organization-identity");
    text.append(el("p", t("סביבת הארגון", "Organization workspace"), "manager-eyebrow"), el("h2", name), el("p", t("גישה לנקודות ולתעריפים של הארגון", "Access to your organization's points and tariffs"), "manager-muted"));
    header.append(createOrganizationLogo({ ...organization, name }, language, "manager-organization-logo"), text, button(t("כל הארגונים", "All organizations"), () => { organizationId = null; listView = "organizations"; closeView(); renderList(); announce(""); }));
    content.append(header);
    const details = el("div");
    details.append(el("p", organizationRole(organization.role), "manager-note"));
    const disclosure = fold(t("פרטי הארגון", "Organization details"), "", details);
    disclosure.classList.add("manager-organization-disclosure");
    content.append(disclosure);
  }
  function renderList() {
    content.setAttribute("aria-busy", "false");
    content.replaceChildren();
    renderNavigation();
    if (listView === "organizations") { renderOrganizations(); return; }
    const organization = profile?.organizations?.find(item => item.id === organizationId);
    if (organization) {
      organizationHeader(organization);
      document.body.dataset.organizationRole = organization.role;
      content.append(createOrganizationRoleCard({ product: "pay", language, role: organization.role, plan: profile.role === "admin" ? "admin" : null, organizationName: organization.name }));
    } else delete document.body.dataset.organizationRole;
    if (!organizationId) {
      const examplesGrid = el("div", undefined, "manager-grid manager-example-grid pay-system-grid");
      for (const system of examples) examplesGrid.append(card(system, true));
      content.append(fold(t("דוגמאות", "Examples"), t("אפשר לנסות את מסכי Pay על נתוני דוגמה. סליקה ופתיחת מערכות אינן פעילות.", "Explore Pay screens using sample data. Payments and system opening are not active."), examplesGrid), setupGuide());
    }
    const bar = el("div", undefined, "manager-toolbar pay-list-toolbar");
    bar.append(el("h3", organizationId ? t("מערכות הארגון", "Organization systems") : t("המערכות שלי", "My systems")), button(t("רענון", "Refresh"), () => void load()));
    content.append(bar);
    const searchLabel = el("label", undefined, "manager-organization-search pay-search");
    searchLabel.append(el("span", t("חיפוש במערכות שנטענו", "Search loaded systems"), "pay-sr-only"));
    const search = el("input"); search.type = "search"; search.placeholder = t("חיפוש מערכת", "Search systems"); search.maxLength = 100;
    searchLabel.append(search); content.append(searchLabel);
    const grid = el("div", undefined, "manager-grid pay-system-grid");
    const emptySearch = el("p", t("לא נמצאו מערכות לחיפוש הזה.", "No systems match this search."), "pay-empty-search"); emptySearch.hidden = true;
    const paint = () => {
      grid.replaceChildren();
      const query = search.value.trim().toLocaleLowerCase(language);
      for (const system of items.filter(system => `${system.name || ""} ${system.targetId || ""} ${system.config?.displayName || ""}`.toLocaleLowerCase(language).includes(query))) grid.append(card(system, false));
      emptySearch.hidden = grid.childElementCount !== 0 || items.length === 0;
    };
    search.addEventListener("input", paint); paint(); content.append(grid, emptySearch);
    if (!items.length) {
      const empty = el("section", undefined, "manager-empty manager-empty-systems pay-empty");
      empty.append(icon("systems"), el("h3", organizationId ? t("עדיין אין מערכות בארגון הזה", "No systems in this organization yet") : t("המערכת הראשונה שלכם מתחילה כאן", "Your first system starts here")), el("p", organizationId ? t("בעל מערכת יכול לשייך אותה לארגון מתוך סביבת הניהול האישית שלו, אם הוא מנהל בארגון.", "A system owner who administers this organization can assign a system from their personal workspace.") : t("מערכות שקושרו לחשבון שלכם יוצגו כאן. בינתיים אפשר להתנסות בדוגמאות ולבדוק את סביבת הניהול.", "Systems linked to your account will appear here. Meanwhile, explore the examples and try the management workspace.")));
      content.append(empty);
    }
    if (nextCursor) {
      const more = button(t("טעינת מערכות נוספות", "Load more systems"), async () => {
        if (busy) return; busy = true; more.disabled = true; more.setAttribute("aria-busy", "true");
        const guard = generation;
        try {
          const result = await request(`${BASE}/systems?limit=50&cursor=${encodeURIComponent(nextCursor)}${organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : ""}`);
          if (closed || guard !== generation) return;
          if (!Array.isArray(result.items)) throw new Error("invalid-response");
          const ids = new Set(items.map(system => system.id));
          items.push(...result.items.filter(system => !ids.has(system.id))); nextCursor = result.nextCursor || null; renderList();
          announce(t("מערכות נוספות נטענו.", "More systems loaded."));
        } catch (error) { if (!closed && guard === generation) announce(errorText(error), "error"); }
        finally { if (!closed && guard === generation) { busy = false; more.disabled = false; more.removeAttribute("aria-busy"); } }
      });
      content.append(more);
    }
  }
  async function load() {
    closeView(); const guard = generation;
    loading();
    try {
      const [me, systems] = await Promise.all([request(`${BASE}/me`), request(`${BASE}/systems?limit=50${organizationId ? `&organizationId=${encodeURIComponent(organizationId)}` : ""}`)]);
      if (closed || guard !== generation) return;
      if (!["admin", "user"].includes(me?.role) || me.user?.uid !== user.uid || me.paymentsEnabled !== false || systems.paymentsEnabled !== false || !Array.isArray(systems.items)) throw new Error("invalid-response");
      profile = me; items = systems.items; nextCursor = systems.nextCursor || null;
      onProfile(me); renderList(); announce("");
    } catch (error) { if (!closed && guard === generation) failure(error, () => void load()); }
  }
  async function openSystem(system, isDemo = false) {
    cancelDialog(); activity.reset(); const guard = ++generation;
    demo = isDemo; selected = system; tab = "overview"; busy = false;
    if (demo) { renderSystem(); return; }
    loading();
    try {
      const result = await request(`${BASE}/systems/${encodeURIComponent(system.id)}`);
      if (closed || guard !== generation) return;
      if (!result.system || result.system.id !== system.id || result.paymentsEnabled !== false) throw new Error("invalid-response");
      selected = result.system; renderSystem(); announce("");
    } catch (error) { if (!closed && guard === generation) failure(error, () => void openSystem(system)); }
  }
  function back() { closeView(); renderList(); announce(""); }
  function renderSystem() {
    content.setAttribute("aria-busy", "false"); content.replaceChildren();
    renderNavigation();
    if (demo) content.append(el("section", t("סימולציה למערכת לדוגמה. השינויים כאן זמניים ואינם משפיעים על מערכת אמיתית.", "Example system simulation. Changes here are temporary and do not affect a real system."), "manager-note manager-simulation-note pay-simulation"));
    const header = el("header", undefined, "manager-workspace-head pay-detail-header");
    header.append(el("h3", selected.name || selected.config?.displayName || t("מערכת", "System")), button(t("סיום וחזרה", "End and return"), back, "pay-back"));
    if (!demo && (selected.permissions?.canRemove || selected.permissions?.canAssignOrganization)) {
      const menu = el("details", undefined, "manager-system-menu pay-system-actions");
      const trigger = el("summary"); trigger.setAttribute("aria-label", t("פעולות מערכת", "System actions"));
      trigger.title = t("פעולות מערכת", "System actions");
      trigger.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>';
      const actions = el("div", undefined, "manager-system-options");
      if (selected.permissions?.canAssignOrganization) actions.append(button(t("שיוך לארגון", "Assign to organization"), () => { menu.open = false; showAssignment(); }));
      if (selected.permissions?.canRemove) { const remove = button(t("ניתוק מ־Pay", "Unlink from Pay"), () => { menu.open = false; showRemoval(); }, "pay-danger-outline"); remove.prepend(icon("trash")); actions.append(remove); }
      menu.addEventListener("keydown", event => { if (event.key === "Escape") { event.preventDefault(); menu.open = false; trigger.focus(); } });
      menu.addEventListener("focusout", event => { if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false; });
      menu.append(trigger, actions); header.append(menu);
    }
    content.append(header, disabledBanner());
    const navigation = el("nav", undefined, "manager-tabs pay-tabs");
    navigation.setAttribute("aria-label", t("סביבת ניהול Pay", "Pay management workspace"));
    navigation.setAttribute("role", "tablist");
    for (const [id, label, glyph] of [["overview", t("סקירה", "Overview"), "systems"], ["settings", t("נקודה ותעריף", "Point and tariff"), "tune"], ["preview", t("תצוגת לקוח", "Customer preview"), "qr"]]) {
      const b = button(label, () => { if (!busy) { tab = id; renderSystem(); } }); b.dataset.payTab = id; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", String(tab === id));
      if (tab === id) b.setAttribute("aria-current", "page"); navigation.append(b);
    }
    content.append(navigation);
    if (tab === "settings") renderSettings();
    else if (tab === "preview") renderPreview();
    else renderOverview();
  }
  function renderOverview() {
    const grid = el("dl", undefined, "manager-facts pay-overview-grid");
    for (const [label, value] of [
      [t("שם נקודת התשלום", "Payment point name"), selected.config?.displayName || t("טרם הוגדר", "Not configured")],
      [t("תעריף מתוכנן", "Planned tariff"), payTariff(selected.config, language)],
      [t("מצב נקודה", "Point status"), t("תצוגה מקדימה בלבד", "Preview only")],
    ]) { grid.append(el("dt", label), el("dd", value, "pay-overview-card")); }
    content.append(grid);
    const panel = el("section", undefined, "manager-action-panel pay-panel pay-next");
    const supportedModes = Array.isArray(selected.capabilities?.paymentModes) ? selected.capabilities.paymentModes.filter(mode => ["single-entry", "metered", "timed"].includes(mode)) : [];
    const unsupported = supportedModes.length === 0;
    const readOnly = unsupported || (!demo && selected.permissions?.canConfigure !== true);
    panel.append(el("h2", readOnly ? t("פרטי הנקודה של הארגון", "Organization point details") : t("השלב הבא שלכם", "Your next step")), el("p", readOnly ? t("אפשר לצפות בפרטי הנקודה, בתעריף המתוכנן ובתצוגת הלקוח. עדכון ההגדרות זמין למנהלי הארגון.", "View point details, the planned tariff and the customer preview. Organization administrators can update the settings.") : t("הגדירו שם, הסבר ותעריף מתוכנן. לאחר השמירה אפשר לבדוק כיצד הנקודה תיראה למבקר, ולפתוח את קישור התצוגה המקדימה.", "Set a name, description and planned tariff. After saving, review how the point will look to a visitor and open its preview link.")), button(readOnly ? t("פרטי נקודה ותעריף", "Point and tariff details") : t("הגדרת נקודה ותעריף", "Configure point and tariff"), () => { tab = "settings"; renderSystem(); }, "primary"));
    content.append(panel);
  }
  function renderSettings() {
    const config = selected.config || {};
    const panel = el("section", undefined, "manager-settings-card pay-panel"); panel.append(el("h3", t("נקודת התשלום שלכם", "Your payment point")), el("p", t("ההגדרות נשמרות כהכנה לסליקה. הן אינן מפעילות חיוב או פותחות מערכת.", "These settings prepare the payment point. They do not enable charging or open a system."), "pay-muted"));
    const form = el("form", undefined, "manager-form manager-settings-form pay-settings-form");
    const fields = new Map();
    let saveAttempt;
    const supportedModes = Array.isArray(selected.capabilities?.paymentModes) ? selected.capabilities.paymentModes.filter(mode => ["single-entry", "metered", "timed"].includes(mode)) : [];
    const unsupported = supportedModes.length === 0;
    const readOnly = unsupported || (!demo && selected.permissions?.canConfigure !== true);
    function field(name, label, value, options = {}) {
      const wrapper = el("label", undefined, options.wide ? "wide" : "");
      const caption = el("span", label); caption.id = `pay-field-${name}-label`; wrapper.append(caption);
      let input;
      if (options.choices) {
        input = el("select");
        for (const [value, text] of options.choices) { const option = el("option", text); option.value = value; input.append(option); }
      } else input = el(options.multiline ? "textarea" : "input");
      input.name = name; input.value = value ?? "";
      input.setAttribute("aria-labelledby", caption.id);
      if (!options.multiline && !options.choices) input.type = options.number ? "number" : "text";
      if (options.number) { input.min = String(options.min ?? 0); input.max = String(options.max ?? 100000); input.step = String(options.step ?? 1); input.inputMode = "decimal"; input.dir = "ltr"; }
      input.required = options.required !== false;
      if (options.maxLength) input.maxLength = options.maxLength;
      if (options.multiline) input.rows = 3;
      wrapper.append(input);
      if (options.hint) { const hint = el("small", options.hint); hint.id = `pay-field-${name}-hint`; wrapper.append(hint); input.setAttribute("aria-describedby", hint.id); }
      form.append(wrapper); fields.set(name, input);
      return wrapper;
    }
    const publicHint = t("המידע הזה מוצג לכל מי שפותח את קישור התצוגה המקדימה.", "This information is visible to anyone who opens the public preview link.");
    field("displayName", t("שם הנקודה שיוצג למבקר", "Point name shown to the visitor"), config.displayName || selected.name, { wide: true, maxLength: 80, hint: publicHint });
    field("description", t("הסבר למבקר", "Visitor instructions"), config.description || "", { multiline: true, wide: true, required: false, maxLength: 300, hint: publicHint });
    const modeChoices = [["single-entry", t("כניסה בודדת", "Single entry")], ["metered", t("לפי זמן", "By time")], ["timed", t("גישה לחלון זמן", "Timed access")]].filter(([mode]) => unsupported ? mode === (config.accessMode || "single-entry") : supportedModes.includes(mode));
    field("accessMode", t("סוג תעריף", "Tariff type"), config.accessMode || supportedModes[0] || "single-entry", { choices: modeChoices });
    field("currency", t("מטבע", "Currency"), config.currency || "ILS", { choices: [["ILS", "ILS · ₪"], ["USD", "USD · $"], ["EUR", "EUR · €"]] });
    const price = field("price", t("מחיר מתוכנן", "Planned price"), ((config.priceMinor || 0) / 100).toFixed(2), { number: true, step: .01, max: 1000 });
    const hourly = field("hourlyRate", t("תעריף לשעה", "Hourly rate"), ((config.hourlyRateMinor || 0) / 100).toFixed(2), { number: true, step: .01, max: 1000 });
    const cap = field("dailyCap", t("תקרת מחיר יומית", "Daily price cap"), config.dailyCap == null ? "" : (config.dailyCap / 100).toFixed(2), { number: true, step: .01, min: .01, max: 1000, required: false, hint: t("אפשר להשאיר ריק", "Optional") });
    const window = field("windowMin", t("חלון גישה בדקות", "Access window in minutes"), config.windowMin ?? 60, { number: true, min: 15, max: 1440, step: 5 });
    const validity = field("validityMin", t("תוקף כניסה בדקות", "Entry validity in minutes"), config.validityMin ?? 15, { number: true, min: 5, max: 120 });
    const grace = field("graceMinutes", t("דקות חסד", "Grace period in minutes"), config.graceMinutes ?? 0, { number: true, max: 120 });
    const maxSession = field("maxSessionMinutes", t("משך שהייה מרבי בדקות", "Maximum session in minutes"), config.maxSessionMinutes ?? 1440, { number: true, min: 1, max: 10080 });
    function conditional() {
      const mode = fields.get("accessMode").value;
      for (const [wrapper, visible] of [[price, mode !== "metered"], [hourly, mode === "metered"], [cap, mode === "metered"], [window, mode === "timed"], [validity, mode !== "metered"], [grace, mode === "metered"], [maxSession, mode === "metered"]]) {
        wrapper.hidden = !visible; wrapper.querySelector("input").disabled = readOnly || !visible;
      }
      if (readOnly) for (const input of fields.values()) input.disabled = true;
    }
    fields.get("accessMode").addEventListener("change", conditional); conditional();
    const notice = el("p", "", "pay-form-message"); notice.setAttribute("role", "status"); notice.setAttribute("aria-live", "polite");
    const actions = el("div", undefined, "manager-confirm-actions pay-form-actions");
    const save = el("button", demo ? t("שמירה בסימולציה", "Save in simulation") : t("שמירת ההגדרות", "Save settings"), "manager-button pay-button primary"); save.type = "submit";
    const reload = button(t("טעינת הפרטים העדכניים", "Load latest details"), () => void openSystem(selected, demo)); reload.hidden = true;
    if (readOnly) { save.hidden = true; notice.textContent = unsupported ? t("מערכת זו אינה תומכת כרגע בהגדרת נקודת תשלום.", "Payment point configuration is not currently supported for this system.") : t("לחשבון שלכם יש הרשאת צפייה. מנהל הארגון יכול לעדכן את ההגדרות.", "Your account has view access. An organization administrator can update these settings."); notice.classList.add("pay-read-only"); }
    actions.append(save, reload); form.append(notice, actions);
    form.addEventListener("submit", async event => {
      event.preventDefault(); if (busy || readOnly) return;
      const nameInput = fields.get("displayName");
      nameInput.setCustomValidity(nameInput.value.trim() ? "" : t("יש להזין שם לנקודה.", "Enter a point name."));
      if (!form.reportValidity()) return;
      const guard = generation; busy = true; form.setAttribute("aria-busy", "true");
      save.disabled = true; save.textContent = t("שומרים את ההגדרות…", "Saving settings…"); notice.textContent = ""; reload.hidden = true;
      const values = name => fields.get(name).value;
      const numeric = (name, fallback) => fields.get(name).disabled ? fallback : Number(values(name));
      const next = {
        displayName: values("displayName").trim(), description: values("description").trim(),
        accessMode: values("accessMode"), currency: values("currency"),
        priceMinor: Math.round(numeric("price", (config.priceMinor || 0) / 100) * 100),
        hourlyRateMinor: Math.round(numeric("hourlyRate", (config.hourlyRateMinor || 0) / 100) * 100),
        dailyCap: fields.get("dailyCap").disabled ? config.dailyCap ?? null : values("dailyCap") === "" ? null : Math.round(Number(values("dailyCap")) * 100),
        windowMin: numeric("windowMin", config.windowMin ?? 60), validityMin: numeric("validityMin", config.validityMin ?? 15),
        graceMinutes: numeric("graceMinutes", config.graceMinutes ?? 0), maxSessionMinutes: numeric("maxSessionMinutes", config.maxSessionMinutes ?? 1440), enabled: false,
      };
      for (const input of fields.values()) input.disabled = true;
      try {
        if (!next.displayName) throw new Error("empty-name");
        const data = { version: selected.version, config: next }, fingerprint = JSON.stringify(data);
        if (saveAttempt?.fingerprint !== fingerprint) saveAttempt = { fingerprint, key: crypto.randomUUID() };
        const result = demo ? { system: { ...selected, version: selected.version + 1, config: next }, paymentsEnabled: false } : await request(`${BASE}/systems/${encodeURIComponent(selected.id)}/config`, "PATCH", data, saveAttempt.key);
        if (closed || guard !== generation) return;
        if (!result.system || result.system.id !== selected.id || result.paymentsEnabled !== false) throw new Error("invalid-response");
        selected = result.system;
        if (demo) { const at = examples.findIndex(system => system.id === selected.id); examples[at] = selected; }
        else { const at = items.findIndex(system => system.id === selected.id); if (at >= 0) items[at] = selected; }
        busy = false; renderSystem(); announce(t("ההגדרות נשמרו. סליקה אינה פעילה.", "Settings saved. Payments are not active."));
      } catch (error) {
        if (!closed && guard === generation) { notice.textContent = errorText(error); notice.setAttribute("role", "alert"); reload.hidden = !(error?.status === 409 || error?.code === "VERSION_CONFLICT"); }
      } finally {
        if (!closed && guard === generation) { busy = false; form.removeAttribute("aria-busy"); save.disabled = false; save.textContent = demo ? t("שמירה בסימולציה", "Save in simulation") : t("שמירת ההגדרות", "Save settings"); for (const input of fields.values()) input.disabled = false; conditional(); }
      }
    });
    fields.get("displayName").addEventListener("input", () => fields.get("displayName").setCustomValidity(""));
    panel.append(form); content.append(panel);
  }
  function renderPreview() {
    const panel = el("section", undefined, "manager-card pay-panel pay-preview-layout");
    const customer = el("article", undefined, "pay-customer-preview");
    customer.append(el("span", "WIFIGATE PAY", "pay-eyebrow"), el("span", t("תצוגה מקדימה", "Preview"), "pay-pill"), el("h2", selected.config?.displayName || selected.name), el("p", selected.config?.description || t("פרטי נקודת התשלום", "Payment point details")), el("strong", payMoney(selected.config?.accessMode === "metered" ? selected.config.hourlyRateMinor : selected.config?.priceMinor, selected.config?.currency, language), "pay-preview-price"));
    customer.append(el("p", selected.config?.accessMode === "metered" ? t("לשעה, לפי התעריף המתוכנן", "Per hour at the planned tariff") : selected.config?.accessMode === "timed" ? t(`חלון גישה: ${selected.config.windowMin} דקות`, `Access window: ${selected.config.windowMin} minutes`) : t("עבור כניסה בודדת", "For a single entry"), "pay-muted"));
    const disabled = el("div", t("התשלום אינו פעיל כרגע", "Payments are not active"), "pay-unavailable"); customer.append(disabled, el("small", t("זוהי תצוגה בלבד. לא מתבצע חיוב ולא נשלחת פקודת פתיחה.", "This is a preview. No charge or opening command is sent.")));
    const sharing = el("section", undefined, "pay-sharing"); sharing.append(el("h2", t("קישור ו־QR לנקודה", "Point link and QR")));
    const baseUrl = demo ? null : safePayPointUrl(selected.publicPoint?.url);
    const url = baseUrl ? baseUrl + (language === "he" ? "&lang=he" : "") : null;
    if (url) {
      const qr = qrcode(0, "M"); qr.addData(url); qr.make();
      const image = el("img"); image.src = qr.createDataURL(5, 20); image.alt = t("קוד QR לקישור התצוגה המקדימה", "QR code for the preview link"); image.width = 220; image.height = 220;
      const input = el("input"); input.readOnly = true; input.value = url; input.dir = "ltr"; input.setAttribute("aria-label", t("קישור לתצוגה מקדימה", "Preview link"));
      const copy = button(t("העתקת קישור", "Copy link"), async () => {
        try { await navigator.clipboard.writeText(url); announce(t("הקישור הועתק.", "Link copied.")); }
        catch { input.focus(); input.select(); announce(t("סמנו והעתיקו את הקישור משדה הקישור.", "Select and copy the link from the link field.")); }
      });
      const open = el("a", t("פתיחת תצוגה מקדימה", "Open preview"), "manager-button pay-button"); open.href = url; open.target = "_blank"; open.rel = "noopener noreferrer";
      sharing.append(image, input, copy, open);
    } else sharing.append(icon("qr"), el("p", demo ? t("בסימולציה מוצגת דוגמת העמוד. קישור ציבורי ו־QR נוצרים רק למערכת מקושרת.", "The simulation shows the page design. Public links and QR codes are created for linked systems only.") : t("הקישור עדיין לא זמין. טענו מחדש את פרטי המערכת.", "The link is not available yet. Reload system details.")));
    sharing.append(el("small", t("אפשר לשתף תצוגה מקדימה. אין להפיץ אותה כנקודת תשלום פעילה.", "You can share the preview. Do not present it as an active payment point.")));
    panel.append(customer, sharing); content.append(panel);
  }
  function showAssignment() {
    if (demo || selected.permissions?.canAssignOrganization !== true || busy) return;
    cancelDialog(); lastFocus = document.activeElement?.closest(".pay-system-actions")?.querySelector("summary") || document.activeElement;
    const dialog = el("dialog", undefined, "manager-confirm-dialog pay-dialog"); dialog.dir = language === "he" ? "rtl" : "ltr";
    dialog.setAttribute("aria-labelledby", "pay-assign-title"); dialog.setAttribute("aria-describedby", "pay-assign-description");
    const title = el("h2", t("שיוך המערכת לארגון", "Assign system to an organization")); title.id = "pay-assign-title";
    const description = el("p", t("אנשי הארגון יוכלו לצפות בנקודה. בעלי הארגון ומנהליו יוכלו לעדכן אותה. השיוך חל על Pay בלבד.", "Organization members can view the point. Owners and administrators can update it. This assignment applies to Pay only.")); description.id = "pay-assign-description";
    const form = el("form", undefined, "manager-form pay-assignment-form");
    let assignmentAttempt;
    const label = el("label", t("ארגון", "Organization"));
    const select = el("select"); select.name = "organization";
    select.id = "pay-assign-organization"; label.htmlFor = select.id;
    const none = el("option", t("מערכת אישית", "Personal system")); none.value = ""; select.append(none);
    for (const organization of profile?.organizations || []) {
      if (!["owner", "admin"].includes(organization.role)) continue;
      const option = el("option", organization.name || t("ארגון", "Organization")); option.value = organization.id; select.append(option);
    }
    if (selected.organization && !Array.from(select.options).some(option => option.value === selected.organization.id)) {
      const current = el("option", selected.organization.name || t("הארגון הנוכחי", "Current organization")); current.value = selected.organization.id; current.disabled = true; select.append(current);
    }
    select.value = selected.organization?.id || "";
    const error = el("p", "", "pay-form-message"); error.setAttribute("role", "alert");
    const actions = el("div", undefined, "manager-confirm-actions pay-form-actions");
    const cancel = button(t("ביטול", "Cancel"), cancelDialog);
    const confirm = el("button", t("שמירת השיוך", "Save assignment"), "manager-button pay-button primary"); confirm.type = "submit";
    const reload = button(t("טעינת הפרטים העדכניים", "Load latest details"), () => { cancelDialog(); void openSystem(selected); }); reload.hidden = true;
    actions.append(cancel, confirm, reload); form.append(label, select, error, actions);
    form.addEventListener("submit", async event => {
      event.preventDefault(); if (busy || !form.reportValidity()) return;
      const targetOrganization = select.value || null;
      if (targetOrganization === (selected.organization?.id || null)) { cancelDialog(); return; }
      const guard = generation; busy = true; confirm.disabled = true; cancel.disabled = true; select.disabled = true; dialog.setAttribute("aria-busy", "true"); confirm.textContent = t("שומרים…", "Saving…");
      try {
        const data = { version: selected.version, organizationId: targetOrganization }, fingerprint = JSON.stringify(data);
        if (assignmentAttempt?.fingerprint !== fingerprint) assignmentAttempt = { fingerprint, key: crypto.randomUUID() };
        const result = await request(`${BASE}/systems/${encodeURIComponent(selected.id)}/organization`, "POST", data, assignmentAttempt.key);
        if (closed || guard !== generation) return;
        if (!result.system || result.system.id !== selected.id || result.paymentsEnabled !== false) throw new Error("invalid-response");
        selected = result.system;
        items = items.flatMap(system => system.id !== selected.id ? [system] : organizationId && selected.organization?.id !== organizationId ? [] : [selected]);
        busy = false; cancelDialog(); renderSystem(); announce(t("שיוך המערכת נשמר.", "System assignment saved."));
      } catch (failure) { if (!closed && guard === generation && dialog.isConnected) { error.textContent = errorText(failure); reload.hidden = failure?.status !== 409; } }
      finally { if (!closed && guard === generation) { busy = false; confirm.disabled = false; cancel.disabled = false; select.disabled = false; confirm.textContent = t("שמירת השיוך", "Save assignment"); dialog.removeAttribute("aria-busy"); } }
    });
    dialog.append(title, description, form);
    dialog.addEventListener("cancel", event => { event.preventDefault(); if (!busy) cancelDialog(); });
    activeDialog = dialog; root.append(dialog); activity.pause(true); dialog.showModal(); select.focus();
  }
  function showRemoval() {
    if (demo || selected.permissions?.canRemove !== true || busy) return;
    cancelDialog(); lastFocus = document.activeElement?.closest(".pay-system-actions")?.querySelector("summary") || document.activeElement;
    const dialog = el("dialog", undefined, "manager-confirm-dialog pay-dialog"); dialog.dir = language === "he" ? "rtl" : "ltr";
    dialog.setAttribute("aria-labelledby", "pay-remove-title"); dialog.setAttribute("aria-describedby", "pay-remove-description");
    const title = el("h2", t("לנתק את המערכת מ־Pay?", "Unlink this system from Pay?")); title.id = "pay-remove-title";
    const description = el("p", t("נקודת התשלום והקישור הציבורי שלה לא יהיו זמינים. חשבון WIFIGATE וקישורי Host ו־Manager נשארים בחשבון.", "Its payment point and public link will become unavailable. Your WIFIGATE account and Host and Manager links stay in your account.")); description.id = "pay-remove-description";
    const alert = el("p", "", "pay-form-message"); alert.setAttribute("role", "alert");
    const actions = el("div", undefined, "manager-confirm-actions pay-form-actions");
    const cancel = button(t("ביטול", "Cancel"), cancelDialog);
    const removalKey = crypto.randomUUID();
    const confirm = button(t("ניתוק המערכת", "Unlink system"), async () => {
      if (busy) return; busy = true; const guard = generation, id = selected.id;
      confirm.disabled = true; cancel.disabled = true; confirm.textContent = t("מנתקים…", "Unlinking…"); dialog.setAttribute("aria-busy", "true");
      try {
        const result = await request(`${BASE}/systems/${encodeURIComponent(id)}/remove`, "POST", { version: selected.version }, removalKey);
        if (closed || guard !== generation) return;
        if (result.system?.id !== id || result.system.status !== "removed") throw new Error("invalid-response");
        items = items.filter(system => system.id !== id); cancelDialog(); back(); announce(t("המערכת נותקה מ־Pay.", "System unlinked from Pay."));
      } catch (error) { if (!closed && guard === generation && dialog.isConnected) alert.textContent = errorText(error); }
      finally { if (!closed && guard === generation) { busy = false; confirm.disabled = false; cancel.disabled = false; confirm.textContent = t("ניתוק המערכת", "Unlink system"); dialog.removeAttribute("aria-busy"); } }
    }, "danger");
    actions.append(cancel, confirm); dialog.append(title, el("strong", selected.name || ""), description, alert, actions);
    dialog.addEventListener("cancel", event => { event.preventDefault(); if (!busy) cancelDialog(); });
    activeDialog = dialog; root.append(dialog); activity.pause(true); dialog.showModal(); cancel.focus();
  }
  renderNavigation();
  void load();
  return { refresh: load, close() { closed = true; ++generation; cancelDialog(); organizationPicker?.destroy(); activity.close(); root.replaceChildren(); } };
}
