import { managerUiIcon } from "./manager-ui-icons.js";

// Shared visual hierarchy; callers keep ownership of data and actions.
export function createManagerSectionHeading({ title, description, icon = "systems", level = "h3", className = "" }) {
  const header = document.createElement("header");
  header.className = `manager-section-heading ${className}`.trim();
  const identity = document.createElement("div");
  identity.className = "manager-section-identity";
  const symbol = document.createElement("span");
  symbol.className = "manager-section-symbol";
  symbol.setAttribute("aria-hidden", "true");
  symbol.append(managerUiIcon(icon));
  const copy = document.createElement("div");
  const heading = document.createElement(level);
  heading.textContent = title;
  copy.append(heading);
  if (description) {
    const detail = document.createElement("p");
    detail.textContent = description;
    copy.append(detail);
  }
  identity.append(symbol, copy);
  header.append(identity);
  return header;
}
