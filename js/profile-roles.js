import { planRoleName, organizationRoleName } from "./role-names.js";
import { managerUiIcon } from "./manager-ui-icons.js";

export function renderFounderTag(platformRole) {
  document.querySelectorAll(".dashboard-founder-tag").forEach(tag => tag.remove());
  if (platformRole !== "admin") return;
  const brand = document.querySelector(".platform-header .brand, .host-topbar .brand");
  if (!brand) return;
  const tag = document.createElement("span");
  tag.className = "dashboard-founder-tag";
  tag.append(managerUiIcon("founder"), document.createTextNode(planRoleName("admin")));
  brand.append(tag);
}

// The same explicit hierarchy is rendered in every product's profile popover.
export function renderProfileRoles(container, { platformRole, product, role, roles } = {}) {
  renderFounderTag(platformRole);
  const identity = container.closest(".dashboard-profile-panel")?.querySelector(".dashboard-profile-identity > div");
  identity?.querySelector(".dashboard-global-role")?.remove();
  container.replaceChildren();
  const append = (tag, text, className, parent = container) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    element.dir = "auto";
    parent.append(element);
    return element;
  };
  const name = { host: "WIFIGATE Host", pay: "WIFIGATE Pay", manager: "WIFIGATE Manager" }[product];
  if (!name || product === "manager") return;
  const card = append("div", "", "dashboard-profile-product-card");
  append("strong", name, "dashboard-profile-product", card);
  for (const value of roles?.length ? roles : [role].filter(Boolean)) {
    const label = ["admin", "user"].includes(value) ? planRoleName(value) : organizationRoleName(value);
    if (label) append("span", label, "manager-role-badge", card);
  }
}
