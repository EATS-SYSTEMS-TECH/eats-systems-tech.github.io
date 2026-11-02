import { hostLanguage, hostLocale } from "./host-locale.js";
import { organizationRole } from "./host-permissions.js";
import { roleLabel, roleDescription } from "./host-role-badge.js";
import { createManagerOrganizationPicker } from "./manager-organization-picker.js";

const holder = () => document.getElementById("workspace-org-switcher");

export const initial = (text) =>
  (Array.from(String(text ?? "").trim())[0] || "W").toLocaleUpperCase(
    hostLocale,
  );

export function clearOrganizationSelector() {
  const element = holder();
  if (!element) return;
  element.closeOrganizationMenu?.();
  element.closeOrganizationMenu = undefined;
  element.replaceChildren();
  element.hidden = true;
  const area = element.closest(".manager-organization-area");
  if (area) area.hidden = true;
}

// The picker displays only metadata the Host workspace has already authorized.
// Its role names are presentation labels; every Host action still checks the
// original workspace.permissions, and organization selection keeps its callback.
export function renderOrganizationSelector(org, organizations, onChoose) {
  const element = holder();
  if (!element) return;
  clearOrganizationSelector();
  const picker = createManagerOrganizationPicker({
    organizations: organizations.map((entry) => ({
      ...entry,
      role: {
        owner: "owner",
        admin: "organization-admin",
        staff: "organization-user",
        viewer: "organization-user",
      }[organizationRole(entry)],
    })),
    selectedId: org?.id,
    language: hostLanguage,
    onSelect: onChoose,
  });
  const trigger = picker.root.querySelector("button");
  if (org) trigger.dataset.organizationId = org.id;
  const panel = document.getElementById(trigger.getAttribute("aria-controls"));
  for (const option of panel.querySelectorAll("[data-organization-id]")) {
    const entry = organizations.find((item) => item.id === option.dataset.organizationId);
    const role = organizationRole(entry);
    const label = option.querySelector(".manager-organization-picker-identity small");
    if (label) label.textContent = roleLabel(role);
    option.title = `${entry.name}: ${roleDescription(role)}`;
  }
  element.closeOrganizationMenu = () => picker.destroy();
  element.replaceChildren(picker.root);
  element.hidden = false;
  const area = element.closest(".manager-organization-area");
  if (area) area.hidden = false;
}
