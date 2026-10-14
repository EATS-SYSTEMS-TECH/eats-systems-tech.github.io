import { hostText, hostLocale } from "./host-locale.js";
import { roleBadge, roleLabel } from "./host-role-badge.js";
import { node } from "./host-ui.js";
import { attachPopover } from "./popover.js";
import { organizationRole } from "./host-permissions.js";

// The organization card at the top of the sidebar: the selected
// organization's name and your Host role in it. With more than one
// organization it opens a list to switch.
const holder = () => document.getElementById("workspace-org-switcher");

export const initial = (text) =>
  (Array.from(String(text ?? "").trim())[0] || "W").toLocaleUpperCase(
    hostLocale,
  );

const chevron = () => {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("class", "org-card__chevron");
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shape.setAttribute("d", "m6 9 6 6 6-6");
  icon.append(shape);
  return icon;
};

export function clearOrganizationSelector() {
  const element = holder();
  if (!element) return;
  element.closeOrganizationMenu?.();
  element.closeOrganizationMenu = undefined;
  element.replaceChildren();
  element.hidden = true;
}

export function renderOrganizationSelector(org, organizations, onChoose) {
  const element = holder();
  if (!element) return;
  element.closeOrganizationMenu?.();
  element.hidden = false;
  const several = organizations.length > 1;
  const card = node(several ? "button" : "div", undefined, {
    class: "org-card",
    "data-organization-id": org.id,
  });
  const text = node("span", undefined, { class: "org-card__text" });
  text.append(
    node("span", hostText("Organization"), { class: "org-card__label" }),
    node("strong", org.name, { class: "org-card__name", dir: "auto" }),
  );
  card.append(
    node("span", initial(org.name), {
      class: "org-card__avatar",
      "aria-hidden": "true",
    }),
    text,
  );
  const box = node("div", undefined, { class: "org-switcher__box" });
  const roleRow = node("div", undefined, { class: "org-card__role" });
  roleRow.append(roleBadge(organizationRole(org)));
  box.append(card, roleRow);
  if (!several) {
    element.replaceChildren(box);
    return;
  }
  card.type = "button";
  card.setAttribute("aria-haspopup", "listbox");
  card.setAttribute("aria-controls", "org-switcher-list");
  card.setAttribute(
    "aria-label",
    hostText("Organization: {p0}. Switch organization", { p0: org.name }),
  );
  card.append(chevron());
  const popover = node("div", undefined, { class: "org-switcher__popover" });
  const list = node("ul", undefined, {
    id: "org-switcher-list",
    role: "listbox",
    class: "org-switcher__list",
    tabindex: "-1",
    "aria-label": "Organizations",
  });
  const options = organizations.map((entry, index) => {
    const option = node("li", undefined, {
      id: `org-option-${index}`,
      role: "option",
      class: "org-switcher__option",
      "data-organization-id": entry.id,
      "aria-selected": String(entry.id === org.id),
    });
    const label = node("span", undefined, { class: "org-switcher__label" });
    label.append(
      node("strong", entry.name, { dir: "auto" }),
      node("small", roleLabel(organizationRole(entry))),
    );
    option.append(
      node("span", initial(entry.name), {
        class: "org-card__avatar",
        "aria-hidden": "true",
      }),
      label,
    );
    return option;
  });
  list.append(...options);
  popover.append(list);
  box.append(popover);
  let active = -1;
  const setActive = (index) => {
    active = (index + options.length) % options.length;
    options.forEach((option, position) =>
      option.classList.toggle("is-active", position === active),
    );
    list.setAttribute("aria-activedescendant", options[active].id);
  };
  const menu = attachPopover(card, popover, {
    align: "start",
    anchor: box,
    focus: () => list,
    onOpen: () =>
      setActive(
        Math.max(
          0,
          options.findIndex(
            (option) => option.dataset.organizationId === org.id,
          ),
        ),
      ),
    onClose: () => list.removeAttribute("aria-activedescendant"),
  });
  const choose = (option) => {
    menu.close(true);
    if (option.dataset.organizationId !== org.id)
      onChoose(option.dataset.organizationId);
  };
  card.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    menu.open();
  });
  list.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") setActive(active + 1);
    else if (event.key === "ArrowUp") setActive(active - 1);
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(options.length - 1);
    else if (event.key === "Enter" || event.key === " ")
      choose(options[active]);
    else return;
    event.preventDefault();
  });
  for (const option of options)
    option.addEventListener("click", () => choose(option));
  element.closeOrganizationMenu = () => menu.close();
  element.replaceChildren(box);
}
