import { productIds, canOpenProduct } from "./platform-model.js";
import { platformText } from "./platform-copy.js";
import { attachPopover } from "./popover.js";

// The product pill at the top centre of every dashboard: a button with the
// current product and a listbox of Host | Pay | Manager. The order is fixed in
// both directions. A product that can't open stays listed, disabled, with an
// ⓘ that says why. States come from GET /api/v1/platform/me only.
export const productIconPaths = Object.freeze({
  host: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M8 14h3m-3 4h6",
  pay: "M3 8h18M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M7 15h4",
  manager: "M14 7a5 5 0 1 1-5 5L3 18v3h3v-3h3l3-3M17 6h.01",
});

const reasonKeys = {
  "no-plan": "reasonNoPlan",
  pending: "reasonPending",
  blocked: "reasonBlocked",
  "mfa-required": "reasonMfa",
  unavailable: "reasonUnavailable",
};

const productName = (id) => id[0].toUpperCase() + id.slice(1);

function svg(path, className) {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  if (className) icon.setAttribute("class", className);
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "path");
  shape.setAttribute("d", path);
  icon.append(shape);
  return icon;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function productLink(id, language = "en") {
  return `/dashboard/${id}/${language === "he" ? "?lang=he" : ""}`;
}

export function renderProductSwitcher(
  container,
  identity,
  selected,
  language = "en",
  context = "",
) {
  const copy = platformText(language);
  container.closeProductSwitcher?.();
  const button = element("button", "product-switcher__button");
  button.type = "button";
  button.id = "product-switcher-button";
  button.dataset.currentProduct = selected || context || "all";
  const contextLabel = context === "management"
    ? language === "he" ? "ניהול פלטפורמה" : "Platform management"
    : language === "he" ? "הפרופיל שלי" : "My profile";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-controls", "product-switcher-list");
  button.setAttribute(
    "aria-label",
    `${copy.switchProduct}: ${selected ? `WIFIGATE ${productName(selected)}` : contextLabel}`,
  );
  const name = element("span", "product-switcher__name");
  if (selected) {
    name.dir = "ltr";
    name.append(
      element("span", "product-switcher__brand", "WIFIGATE "),
      productName(selected),
    );
  } else name.textContent = contextLabel;
  const dot = element("span", "product-switcher__dot");
  dot.setAttribute("aria-hidden", "true");
  button.append(dot, name, svg("m6 9 6 6 6-6", "product-switcher__chevron"));

  const popover = element("div", "product-switcher__popover");
  const list = element("ul", "product-switcher__list");
  list.id = "product-switcher-list";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", copy.products);
  list.tabIndex = -1;
  const options = productIds.map((id) => {
    const state = identity.products[id].state;
    const enabled = canOpenProduct(identity, id);
    const option = element("li", "product-switcher__option");
    option.id = `product-option-${id}`;
    option.dataset.productOption = id;
    option.dataset.productState = state;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(id === selected));
    if (!enabled) option.setAttribute("aria-disabled", "true");
    const icon = element("span", "product-switcher__icon");
    icon.append(svg(productIconPaths[id]));
    const label = element("span", "product-switcher__label");
    const title = element("strong", "", `WIFIGATE ${productName(id)}`);
    title.dir = "ltr";
    const stateLabel =
      ["host", "manager"].includes(id) && state === "pending"
        ? copy[`${id}Pending`]
        : copy[state];
    label.append(title, element("span", "product-switcher__state", stateLabel));
    option.append(icon, label);
    if (!enabled) {
      const tip = element("span", "product-switcher__tip", "ⓘ");
      tip.setAttribute("aria-hidden", "true");
      const reason = element(
        "span",
        "product-switcher__reason",
        copy[reasonKeys[state]] ?? copy.reasonUnavailable,
      );
      reason.id = `product-reason-${id}`;
      reason.setAttribute("role", "tooltip");
      option.setAttribute("aria-describedby", reason.id);
      option.append(tip, reason);
    }
    return option;
  });
  list.append(...options);
  const all = element(
    "a",
    "product-switcher__all",
    language === "he" ? "הפרופיל שלי" : "My profile",
  );
  all.href = language === "he" ? "/dashboard/?lang=he" : "/dashboard/";
  if (!selected && !context) all.setAttribute("aria-current", "page");
  popover.append(list, all);

  let active = -1;
  function setActive(index) {
    active = (index + options.length) % options.length;
    options.forEach((option, position) =>
      option.classList.toggle("is-active", position === active),
    );
    list.setAttribute("aria-activedescendant", options[active].id);
  }
  const popup = attachPopover(button, popover, {
    align: "center",
    focus: () => list,
    onOpen: () => {
      const current = options.findIndex(
        (option) => option.dataset.productOption === selected,
      );
      setActive(current >= 0 ? current : 0);
    },
    onClose: () => {
      list.removeAttribute("aria-activedescendant");
      for (const option of options) option.classList.remove("is-active");
    },
  });
  function choose(option) {
    if (option.getAttribute("aria-disabled") === "true") {
      setActive(options.indexOf(option));
      return;
    }
    popup.close(true);
    const id = option.dataset.productOption;
    if (id !== selected) location.assign(productLink(id, language));
  }
  button.addEventListener("keydown", (event) => {
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    popup.open();
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
  container.closeProductSwitcher = () => popup.close();
  container.replaceChildren(button, popover);
}
