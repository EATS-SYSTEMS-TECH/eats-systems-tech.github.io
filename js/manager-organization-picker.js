import { attachPopover, placeFloating } from "./popover.js";
import { createOrganizationLogo } from "./manager-organization-card.js";
import { sharedOrganizationRole } from "./role-guide.js";

const node = (tag, text, className) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
};
let pickerId = 0;

/** Accessible searchable navigation, backed only by already-authorized metadata. */
export function createManagerOrganizationPicker({
  organizations,
  selectedId,
  language = "en",
  onSelect,
}) {
  const t = (he, en) => (language === "he" ? he : en);
  const root = node("div", undefined, "manager-organization-picker");
  const selected = organizations.find((org) => org.id === selectedId);
  const trigger = node(
    "button",
    undefined,
    "manager-organization-picker-trigger",
  );
  trigger.type = "button";
  trigger.setAttribute("aria-label", t("בחירת ארגון", "Choose organization"));
  trigger.setAttribute("aria-haspopup", "dialog");
  const logo = createOrganizationLogo(
    selected ?? { name: "W" },
    language,
    "manager-organization-picker-logo",
  );
  logo.setAttribute("aria-hidden", "true");
  if (!selected) logo.textContent = "▦";
  const identity = node(
    "span",
    undefined,
    "manager-organization-picker-identity",
  );
  const caption = node(
    "small",
    selected
      ? t("הארגון הנבחר", "Selected organization")
      : t("סביבת הארגון", "Organization workspace"),
  );
  identity.append(
    caption,
    node("strong", selected?.name ?? t("בחרו ארגון", "Choose organization")),
  );
  trigger.append(
    logo,
    identity,
    node("span", "", "manager-organization-picker-chevron"),
  );
  root.append(trigger);

  const panel = node("section", undefined, "manager-organization-picker-panel");
  panel.id = `manager-organization-picker-${++pickerId}`;
  identity.id = panel.id + "-selection";
  trigger.setAttribute("aria-describedby", identity.id);
  if (selected) trigger.title = selected.name;
  panel.dir = language === "he" ? "rtl" : "ltr";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", t("בחירת ארגון", "Choose organization"));
  trigger.setAttribute("aria-controls", panel.id);
  const heading = node("div", undefined, "manager-organization-picker-heading");
  heading.append(
    node("strong", t("מעבר בין ארגונים", "Switch organization")),
    node("span", String(organizations.length)),
  );
  const search = node("input");
  search.type = "search";
  search.className = "manager-organization-picker-search";
  search.autocomplete = "off";
  search.placeholder = t("חיפוש ארגון…", "Search organizations…");
  search.setAttribute("aria-label", t("חיפוש ארגון", "Search organizations"));
  const status = node("p", "", "manager-organization-picker-status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const list = node("div", undefined, "manager-organization-picker-options");
  list.id = panel.id + "-options";
  search.setAttribute("aria-controls", list.id);
  const empty = node(
    "p",
    t(
      "לא נמצאו ארגונים. נסו שם אחר.",
      "No organizations found. Try another name.",
    ),
    "manager-organization-picker-empty",
  );
  empty.hidden = true;
  panel.append(heading, search, status, list, empty);
  document.body.append(panel);
  const options = [];
  const visible = () => options.filter((option) => !option.hidden);
  const focusOption = (option) => {
    if (!option) return;
    options.forEach((item) => {
      item.tabIndex = item === option ? 0 : -1;
    });
    option.focus();
    option.scrollIntoView({ block: "nearest" });
  };
  // Keep the established shared popover lifecycle. Only this picker needs a
  // taller, scrollable list and above-anchor placement in short viewports.
  const position = () => {
    if (panel.hidden) return;
    panel.style.maxHeight = "";
    const anchor = trigger.getBoundingClientRect();
    const below = Math.max(0, innerHeight - anchor.bottom - 24);
    const above = Math.max(0, anchor.top - 24);
    panel.style.maxHeight = `${panel.offsetHeight > below && above > below ? above : below}px`;
    placeFloating(panel, trigger, { align: "start", flip: true });
  };
  const popup = attachPopover(trigger, panel, {
    align: "start",
    focus: () => search,
    onOpen: () => {
      search.value = "";
      filter();
      window.addEventListener("resize", position);
      window.addEventListener("scroll", position, true);
    },
    onClose: () => {
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    },
  });
  for (const org of organizations) {
    const option = node("button", undefined, "manager-organization-option");
    option.type = "button";
    option.dataset.organizationId = org.id;
    option.title = org.name;
    const current = org.id === selectedId;
    if (current) option.setAttribute("aria-current", "true");
    const role =
      {
        owner: t("בעל הארגון", "Organization owner"),
        admin: t("מנהל ארגון", "Organization admin"),
        staff: t("צוות ארגון", "Organization staff"),
        viewer: t("צופה בארגון", "Organization viewer"),
      }[org.role === "owner" ? "owner" : sharedOrganizationRole(org.role)] ?? "";
    const text = node(
      "span",
      undefined,
      "manager-organization-picker-identity",
    );
    text.append(node("strong", org.name));
    if (role) text.append(node("small", role));
    const artwork = createOrganizationLogo(
      org,
      language,
      "manager-organization-picker-logo",
    );
    artwork.setAttribute("aria-hidden", "true");
    option.append(artwork, text);
    if (current) {
      const check = node("span", "✓", "manager-organization-picker-check");
      check.setAttribute(
        "aria-label",
        t("הארגון הנבחר", "Selected organization"),
      );
      option.append(check);
    }
    option.addEventListener("click", async () => {
      popup.close(current);
      if (current || trigger.disabled) return;
      trigger.disabled = true;
      trigger.setAttribute("aria-busy", "true");
      caption.textContent = t("טוענים את הארגון…", "Loading organization…");
      try {
        await onSelect(org.id);
      } catch {
        popup.open();
        status.textContent = t(
          "לא ניתן לעבור לארגון כרגע. נסו שוב.",
          "Unable to switch organizations. Please try again.",
        );
      } finally {
        trigger.disabled = false;
        trigger.removeAttribute("aria-busy");
        caption.textContent = selected
          ? t("הארגון הנבחר", "Selected organization")
          : t("סביבת הארגון", "Organization workspace");
      }
    });
    option.addEventListener("keydown", (event) => {
      const rows = visible();
      const index = rows.indexOf(option);
      const next = {
        ArrowDown: Math.min(rows.length - 1, index + 1),
        ArrowUp: Math.max(0, index - 1),
        Home: 0,
        End: rows.length - 1,
      }[event.key];
      if (next !== undefined) {
        event.preventDefault();
        focusOption(rows[next]);
      }
    });
    options.push(option);
    list.append(option);
  }
  function filter() {
    const query = search.value.trim().normalize("NFKC").toLocaleLowerCase();
    options.forEach((option, index) => {
      option.hidden = !organizations[index].name
        .normalize("NFKC")
        .toLocaleLowerCase()
        .includes(query);
    });
    const rows = visible();
    const first =
      rows.find((row) => row.getAttribute("aria-current") === "true") ??
      rows[0];
    options.forEach((option) => {
      option.tabIndex = option === first ? 0 : -1;
    });
    empty.hidden = rows.length > 0;
    status.textContent = t(
      `${rows.length} מתוך ${organizations.length} ארגונים`,
      `${rows.length} of ${organizations.length} organizations`,
    );
    position();
  }
  search.addEventListener("input", filter);
  search.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && visible().length === 1) {
      event.preventDefault();
      visible()[0].click();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const rows = visible();
    focusOption(event.key === "ArrowDown" ? rows[0] : rows.at(-1));
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    popup.open();
  });
  panel.addEventListener("focusout", (event) => {
    if (event.relatedTarget) return;
    queueMicrotask(() => {
      if (
        !panel.contains(document.activeElement) &&
        document.activeElement !== trigger
      )
        popup.close();
    });
  });
  filter();
  return {
    root,
    close: () => popup.close(),
    destroy() {
      popup.close();
      panel.remove();
      root.remove();
    },
  };
}
