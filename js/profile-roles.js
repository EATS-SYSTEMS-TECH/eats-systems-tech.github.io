import { planRoleName, organizationRoleName } from "./role-names.js";
import { managerUiIcon } from "./manager-ui-icons.js";
let founderVisible = false;
export const isPlatformFounder = () => founderVisible;

export function renderFounderTag(platformRole, verified = false) {
  founderVisible = platformRole === "admin";
  document.querySelectorAll(".dashboard-identity-tag, .dashboard-identity-divider").forEach(tag => tag.remove());
  const brand = document.querySelector(".platform-header .brand, .host-topbar .brand");
  if (!brand) return;
  brand.removeAttribute("aria-description");
  if (verified !== true) return;
  const he = document.documentElement.lang.startsWith("he");
  const divider = document.createElement("span");
  divider.className = "dashboard-identity-divider";
  divider.setAttribute("aria-hidden", "true");
  const tag = document.createElement("span");
  tag.className = "dashboard-identity-tag" + (founderVisible ? " dashboard-founder-tag" : " dashboard-user-tag");
  const label = founderVisible
    ? he ? "מייסד מאומת" : "Verified Founder"
    : he ? "משתמש מאומת" : "Verified User";
  tag.title = label;
  brand.setAttribute("aria-description", label);
  tag.append(managerUiIcon("admin"), document.createTextNode(label));
  brand.append(divider, tag);
}

// The same explicit hierarchy is rendered in every product's profile popover.
export function renderProfileRoles(container, { platformRole, product, role, roles, verified = false } = {}) {
  renderFounderTag(platformRole, verified);
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
