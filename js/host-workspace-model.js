// The Host dashboard's views, in sidebar order. What a person sees comes from
// the Host plan (My systems) and from the selected organization's
// workspace.permissions — never from role names. A view that is never allowed
// is not built at all, so its navigation item stays hidden.
//   scope "plan":     Host plan holders only (role admin or user).
//   scope "account":  everyone who reaches the dashboard.
//   scope "platform": the WIFIGATE operator (Host admin) — built by the
//                     administrator overview, not by the workspace.
//   permission:       an organization permission from workspace.permissions.
//   short:            the label in the phone tab bar, when it differs.
export const workspaceViews = Object.freeze([
  {
    id: "my-systems",
    label: "My systems",
    icon: "grid",
    scope: "plan",
    selector: '[data-workspace-view="my-systems"]',
  },
  {
    id: "my-organizations",
    label: "My organizations",
    icon: "building",
    scope: "account",
    selector: '[data-workspace-view="my-organizations"]',
  },
  {
    id: "systems",
    label: "Organization systems",
    short: "Systems",
    icon: "building",
    permission: "read",
    selector: 'section[aria-label="WIFIGATE systems"]',
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: "calendar",
    permission: "read",
    selector: ".host-calendar",
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: "list",
    permission: "read",
    selector: 'section[aria-label="Bookings"]',
  },
  {
    id: "activity",
    label: "Activity",
    icon: "bolt",
    permission: "operations:write",
    selector:
      'section[aria-label="Host operations"], section[aria-label="Service health"]',
  },
  {
    id: "connect",
    label: "Connect",
    icon: "plug",
    permission: "integrations:write",
    selector:
      'section[aria-label="Automatic guest links"], section[aria-label="Your booking system"], section[aria-label="API keys"]',
  },
  {
    id: "settings",
    label: "Settings",
    icon: "settings",
    scope: "account",
    selector: '[data-workspace-view="settings"]',
  },
  {
    id: "invitations",
    label: "Join an organization",
    icon: "bell",
    scope: "account",
    placement: "bell",
    selector: 'section[aria-label="Team invitations"]',
  },
  {
    id: "overview",
    label: "Platform",
    icon: "shield",
    scope: "platform",
    placement: "platform",
    selector: "#admin-overview",
  },
]);

// Settings tabs, in order. Support is also open to the WIFIGATE operator, who
// reads approved support diagnostics there.
export const settingsTabs = Object.freeze([
  { id: "organization", label: "Organization", permission: "read" },
  { id: "team", label: "Team", permission: "members:write" },
  { id: "billing", label: "Plan & statements", permission: "billing:write" },
  { id: "support", label: "Support access", permission: "organization:write" },
  { id: "account", label: "Account & security", scope: "account" },
]);

// Old view ids and labels keep working as deep links.
const aliases = {
  reservations: "bookings",
  Reservations: "bookings",
  guests: "bookings",
  Guests: "bookings",
  operations: "activity",
  Operations: "activity",
  "jobs-calendar": "activity",
  "Jobs Calendar": "activity",
  "service-health": "activity",
  "Service health": "activity",
  integrations: "connect",
  Integrations: "connect",
  automation: "connect",
  Automation: "connect",
  "api-keys": "connect",
  "api-integrations": "connect",
  "API integrations": "connect",
  properties: "systems",
  Properties: "systems",
  "access-keys": "systems",
  "Access Keys": "systems",
  "system-import": "systems",
  "System Import": "systems",
  Systems: "systems",
  "WIFIGATE systems": "systems",
  "team-invitations": "invitations",
  "Team invitations": "invitations",
  "join-organization": "invitations",
  Overview: "overview",
};
const tabAliases = {
  organization: "organization",
  organizations: "organization",
  Organizations: "organization",
  "Organization settings": "organization",
  team: "team",
  Team: "team",
  staff: "team",
  Staff: "team",
  billing: "billing",
  invoices: "billing",
  Invoices: "billing",
  "Billing statements": "billing",
  "Plan & statements": "billing",
  support: "support",
  Support: "support",
  account: "account",
  Account: "account",
};

export function workspaceView(value) {
  if (typeof value !== "string") return undefined;
  if (tabAliases[value]) return workspaceViews.find((v) => v.id === "settings");
  return (
    workspaceViews.find((view) => view.id === value || view.label === value) ??
    workspaceViews.find((view) => view.id === aliases[value])
  );
}

// The Settings tab an old view id or label opens, if any.
export function settingsTabFor(value) {
  return tabAliases[value];
}

export function settingsTab(url) {
  return tabAliases[url.searchParams.get("tab")] ?? undefined;
}

// The view a URL asks for, or `home` when it names none (or an unknown one).
export function workspaceLocation(url, home) {
  if (url.pathname === "/dashboard/host/overview/") return "overview";
  return workspaceView(url.searchParams.get("view"))?.id ?? home;
}

export function homeView({ plan = false, pending = false } = {}) {
  if (pending) return "invitations";
  return plan ? "my-systems" : "my-organizations";
}

// Views the workspace builds for this person. `organization` is the selected
// organization's workspace.permissions, or undefined when there is none.
export function allowedWorkspaceViews({
  plan = false,
  pending = false,
  permissions,
} = {}) {
  if (pending)
    return workspaceViews.filter((view) => view.id === "invitations");
  const granted = new Set(Array.isArray(permissions) ? permissions : []);
  return workspaceViews.filter((view) => {
    if (view.scope === "platform") return false;
    if (view.scope === "plan") return plan;
    if (view.scope === "account") return true;
    return granted.has(view.permission);
  });
}

export function allowedSettingsTabs({
  permissions,
  platformAdmin = false,
} = {}) {
  const granted = new Set(Array.isArray(permissions) ? permissions : []);
  return settingsTabs.filter(
    (tab) =>
      tab.scope === "account" ||
      granted.has(tab.permission) ||
      (tab.id === "support" && platformAdmin),
  );
}
