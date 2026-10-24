// The same explicit hierarchy is rendered in every product's profile popover.
export function renderProfileRoles(container, { platformRole, product, role, roles } = {}) {
  container.replaceChildren();
  const append = (tag, text, className, parent = container) => {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    element.dir = "ltr";
    parent.append(element);
    return element;
  };
  if (platformRole === "admin") append("span", "WIFIGATE admin", "dashboard-global-role");
  const name = { host: "WIFIGATE Host", pay: "WIFIGATE Pay", manager: "WIFIGATE Manager" }[product];
  if (!name) return;
  const card = append("div", "", "dashboard-profile-product-card");
  append("strong", name, "dashboard-profile-product", card);
  for (const value of roles?.length ? roles : [role].filter(Boolean)) {
    const suffix = { admin: "admin", user: "user", "organization-admin": "organization admin" }[value];
    if (suffix) append("span", `${name} ${suffix}`, "manager-role-badge", card);
  }
}
