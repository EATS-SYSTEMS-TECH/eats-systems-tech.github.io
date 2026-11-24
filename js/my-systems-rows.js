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
// organization outside that list, and always a row for the systems linked to
// no organization. Every row has its own system search and scrolls sideways,
// with the scroll controls shown even when the row holds one system or none.
//
// `organizationOf(system)` returns the linked organization ID or null,
// `renderCard(system)` the product's own card, `onOpenOrganization(org)`
// opens that organization (optional) and `searchText(system)` the text the
// row's search matches (optional).
export function createMySystemsRows({
  systems,
  organizations = [],
  organizationOf,
  renderCard,
  onOpenOrganization,
  searchText = defaultSearchText,
  language = "en",
}) {
  const he = language === "he";
  const t = (hebrew, english) => (he ? hebrew : english);
  const count = (n, unlinked) =>
    n === 0
      ? unlinked
        ? t("אין מערכות ללא ארגון", "No unassigned systems")
        : t("עדיין אין מערכות בארגון", "No systems yet")
      : n === 1
        ? t("מערכת אחת", "1 system")
        : t(`${n} מערכות`, `${n} systems`);
  const known = new Set(organizations.map((org) => org.id));
  const lower = (text) => String(text ?? "").toLocaleLowerCase(language);
  const rtl = () => getComputedStyle(document.documentElement).direction === "rtl";
  // Search text per card, kept off the card so its markup stays the product's own.
  const cardText = new WeakMap();

  // Previous and next buttons, always shown; disabled while there is nothing
  // further to scroll to. Touch users also swipe the row.
  const scroller = (track, title) => {
    const nav = node("div", undefined, "manager-systems-row-nav");
    nav.setAttribute("role", "group");
    nav.setAttribute("aria-label", t(`גלילה בשורה ${title}`, `Scroll ${title}`));
    const step = (direction) => {
      const card = track.querySelector(".manager-system:not([hidden])");
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
    // ‹ and › are bidi-mirrored, so in Hebrew "more" already points left.
    const previous = make(t("מערכות קודמות", "Previous systems"), "‹", -1);
    const next = make(t("מערכות נוספות", "More systems"), "›", 1);
    nav.append(previous, next);
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const at = Math.abs(track.scrollLeft);
      previous.disabled = at <= 2;
      next.disabled = at >= max - 2;
    };
    track.addEventListener("scroll", update, { passive: true });
    if (typeof ResizeObserver === "function") new ResizeObserver(update).observe(track);
    requestAnimationFrame(update);
    return { nav, update };
  };

  const row = (key, title, rowSystems, { org = null, unlinked = false } = {}) => {
    const section = node("section", undefined, "manager-systems-row");
    section.dataset.row = key;
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
    const counter = node("p", count(rowSystems.length, unlinked), "manager-muted");
    text.append(heading, counter);
    head.append(mark, text);

    const track = node("div", undefined, "manager-grid system-grid");
    track.tabIndex = 0;
    track.setAttribute("aria-label", title);
    for (const system of rowSystems) {
      const card = renderCard(system);
      cardText.set(card, lower(searchText(system)));
      track.append(card);
    }
    // The empty place in the row: a row without systems, or no search match.
    const placeholder = node(
      "p",
      unlinked
        ? systems.length
          ? t("כל המערכות שלך משויכות לארגון.", "Every system of yours is in an organization.")
          : t("עדיין אין לך מערכות.", "You have no systems yet.")
        : t(
            "שייכו מערכת לארגון הזה מתפריט הפעולות שלה, בשורה ״ללא ארגון״.",
            "Assign a system to this organization from its actions menu in the “No organization” row.",
          ),
      "manager-systems-row-empty",
    );
    placeholder.hidden = rowSystems.length > 0;
    track.append(placeholder);

    const { nav, update } = scroller(track, title);
    const tools = node("div", undefined, "manager-systems-row-tools");
    tools.append(nav);
    if (org && onOpenOrganization) {
      const open = node("button", t("כניסה לארגון", "Open organization"), "manager-button");
      open.type = "button";
      open.addEventListener("click", () => onOpenOrganization(org));
      tools.append(open);
    }
    head.append(tools);

    // The row's own search: it looks for systems in this row only.
    const label = node("label", undefined, "manager-systems-row-search");
    label.append(node("span", t(`חיפוש מערכת ב${title}`, `Search systems in ${title}`), "manager-systems-row-search-label"));
    const input = node("input");
    input.type = "search";
    input.maxLength = 100;
    input.autocomplete = "off";
    input.placeholder = t("חיפוש מערכת", "Search systems");
    input.disabled = rowSystems.length === 0;
    label.append(input);
    input.addEventListener("input", () => {
      const query = lower(input.value.trim());
      let visible = 0;
      for (const card of track.children) {
        if (card === placeholder) continue;
        card.hidden = Boolean(query) && !(cardText.get(card) ?? "").includes(query);
        if (!card.hidden) visible++;
      }
      placeholder.textContent = t("לא נמצאו מערכות לחיפוש הזה.", "No systems match this search.");
      placeholder.hidden = visible > 0;
      counter.textContent =
        visible === rowSystems.length
          ? count(rowSystems.length, unlinked)
          : t(`${visible} מתוך ${rowSystems.length}`, `${visible} of ${rowSystems.length}`);
      track.scrollLeft = 0;
      update();
    });

    section.append(head, label, track);
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
  rows.push(
    row(
      "none",
      t("ללא ארגון", "No organization"),
      systems.filter((system) => !organizationOf(system)),
      { unlinked: true },
    ),
  );
  return rows;
}
