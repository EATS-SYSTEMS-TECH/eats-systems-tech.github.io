import { createOrganizationLogo } from "./manager-organization-card.js";

const node = (tag, text, cls) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (cls) el.className = cls;
  return el;
};

const defaultSearchText = (system) =>
  [system.name, system.id, system.targetId, system.systemId, system.displayName, system.config?.displayName]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join(" ");

// My systems in rows, shared by WIFIGATE Manager, Host and Pay so all three
// show the same order: one row per organization of the account (an
// organization with no systems yet too), a row for systems linked to an
// organization outside that list, then the systems linked to no organization.
// Each row scrolls sideways, so an organization with many systems still takes
// one row, and a search above the rows filters systems and organizations.
//
// `organizationOf(system)` returns the linked organization ID or null,
// `renderCard(system)` the product's own card, `onOpenOrganization(org)`
// opens that organization (optional) and `searchText(system)` the text the
// search matches (optional).
//
// Returns sibling elements: the search, the rows and the no-results message.
export function createMySystemsRows({
  systems,
  organizations = [],
  organizationOf,
  renderCard,
  onOpenOrganization,
  searchText = defaultSearchText,
  search = true,
  language = "en",
}) {
  const he = language === "he";
  const t = (hebrew, english) => (he ? hebrew : english);
  const count = (n) =>
    n === 0
      ? t("עדיין אין מערכות בארגון", "No systems yet")
      : n === 1
        ? t("מערכת אחת", "1 system")
        : t(`${n} מערכות`, `${n} systems`);
  const known = new Set(organizations.map((org) => org.id));
  const lower = (text) => String(text ?? "").toLocaleLowerCase(language);
  const rtl = () => getComputedStyle(document.documentElement).direction === "rtl";

  // Previous and next buttons for pointer users; touch users swipe the row.
  const scroller = (track) => {
    const nav = node("div", undefined, "manager-systems-row-nav");
    const step = (direction) => {
      const card = track.firstElementChild;
      const width = card ? card.getBoundingClientRect().width + 12 : track.clientWidth;
      track.scrollBy({ left: direction * width * (rtl() ? -1 : 1), behavior: "smooth" });
    };
    const make = (label, glyph, direction) => {
      const btn = node("button", glyph, "manager-systems-row-step");
      btn.type = "button";
      btn.setAttribute("aria-label", label);
      btn.addEventListener("click", () => step(direction));
      return btn;
    };
    // Arrows point the way the row moves: leftward is "more" in Hebrew.
    const previous = make(t("מערכות קודמות", "Previous systems"), rtl() ? "›" : "‹", -1);
    const next = make(t("מערכות נוספות", "More systems"), rtl() ? "‹" : "›", 1);
    nav.append(previous, next);
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const at = Math.abs(track.scrollLeft);
      nav.hidden = max <= 2;
      previous.disabled = at <= 2;
      next.disabled = at >= max - 2;
    };
    track.addEventListener("scroll", update, { passive: true });
    if (typeof ResizeObserver === "function") new ResizeObserver(update).observe(track);
    requestAnimationFrame(update);
    return { nav, update };
  };

  const updates = [];
  // Search text per card, kept off the card so its markup stays the product's own.
  const cardText = new WeakMap();
  const row = (key, title, rowSystems, { org = null, unlinked = false } = {}) => {
    const section = node("section", undefined, "manager-systems-row");
    section.dataset.row = key;
    section.dataset.search = lower(title);
    if (unlinked) section.dataset.unlinked = "";
    const head = node("header", undefined, "manager-systems-row-head");
    let mark;
    if (org) mark = createOrganizationLogo(org, language, "manager-systems-row-mark");
    else {
      mark = node("div", unlinked ? "—" : "•", "manager-systems-row-mark");
      mark.setAttribute("aria-hidden", "true");
    }
    const text = node("div", undefined, "manager-systems-row-title");
    const heading = node("h4", title);
    heading.id = "manager-systems-row-" + key;
    section.setAttribute("aria-labelledby", heading.id);
    const counter = node("p", count(rowSystems.length), "manager-muted");
    text.append(heading, counter);
    head.append(mark, text);
    const tools = node("div", undefined, "manager-systems-row-tools");
    if (rowSystems.length) {
      const track = node("div", undefined, "manager-grid system-grid");
      track.tabIndex = 0;
      track.setAttribute("aria-label", title);
      for (const system of rowSystems) {
        const card = renderCard(system);
        cardText.set(card, lower(searchText(system)));
        track.append(card);
      }
      const { nav, update } = scroller(track);
      updates.push(update);
      tools.append(nav);
      section._track = track;
      section._counter = counter;
      section._total = rowSystems.length;
      section.append(head, track);
    } else {
      section.append(
        head,
        node(
          "p",
          t(
            "שייכו מערכת לארגון הזה מתפריט הפעולות שלה, בשורה ״ללא ארגון״.",
            "Assign a system to this organization from its actions menu in the “No organization” row.",
          ),
          "manager-systems-row-empty",
        ),
      );
    }
    if (org && onOpenOrganization) {
      const open = node("button", t("כניסה לארגון", "Open organization"), "manager-button");
      open.type = "button";
      open.addEventListener("click", () => onOpenOrganization(org));
      tools.append(open);
    }
    if (tools.childElementCount) head.append(tools);
    return section;
  };

  const rows = organizations.map((org) =>
    row(
      "org-" + org.id,
      org.name,
      systems.filter((system) => organizationOf(system) === org.id),
      { org },
    ),
  );
  const elsewhere = systems.filter((system) => {
    const id = organizationOf(system);
    return id && !known.has(id);
  });
  if (elsewhere.length)
    rows.push(row("other", t("ארגון אחר", "Another organization"), elsewhere));
  const unassigned = systems.filter((system) => !organizationOf(system));
  if (unassigned.length)
    rows.push(
      row("none", t("ללא ארגון", "No organization"), unassigned, { unlinked: true }),
    );
  if (!search || !systems.length) return rows;

  const label = node("label", undefined, "manager-organization-search manager-systems-search");
  label.append(node("span", t("חיפוש במערכות שלי", "Search my systems"), "manager-systems-search-label"));
  const input = node("input");
  input.type = "search";
  input.maxLength = 100;
  input.autocomplete = "off";
  input.placeholder = t("שם מערכת, מזהה או ארגון", "System name, ID or organization");
  label.append(input);
  const none = node("p", t("לא נמצאו מערכות לחיפוש הזה.", "No systems match this search."), "manager-systems-search-empty");
  none.hidden = true;
  none.setAttribute("role", "status");
  input.addEventListener("input", () => {
    const query = lower(input.value.trim());
    let shown = 0;
    for (const section of rows) {
      const titleMatch = !query || section.dataset.search.includes(query);
      if (!section._track) {
        // An organization without systems shows only when its name matches.
        section.hidden = !titleMatch;
        if (query && titleMatch) shown++;
        continue;
      }
      let visible = 0;
      for (const card of section._track.children) {
        card.hidden = !titleMatch && !(cardText.get(card) ?? "").includes(query);
        if (!card.hidden) visible++;
      }
      section.hidden = visible === 0;
      section._counter.textContent =
        visible === section._total
          ? count(section._total)
          : t(`${visible} מתוך ${section._total}`, `${visible} of ${section._total}`);
      section._track.scrollLeft = 0;
      if (visible) shown++;
    }
    none.hidden = !query || shown > 0;
    updates.forEach((update) => update());
  });
  return [label, ...rows, none];
}
