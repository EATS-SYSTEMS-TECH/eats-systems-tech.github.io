export const workspaceViews = [
  {
    id: "calendar",
    label: "Calendar",
    he: "לוח שנה",
    icon: "calendar",
    group: "",
    selector: ".host-calendar",
  },
  {
    id: "reservations",
    label: "Reservations",
    he: "הזמנות",
    icon: "key",
    group: "",
    selector: 'section[aria-label="Reservations"]',
  },
  {
    id: "properties",
    label: "Properties",
    he: "נכסים וחדרים",
    icon: "home",
    group: "",
    selector: 'section[aria-label="properties"], section[aria-label="rooms"]',
  },
  {
    id: "systems",
    label: "Systems",
    he: "מערכות",
    icon: "key",
    group: "",
    selector: 'section[aria-label="WIFIGATE systems"]',
  },
  {
    id: "team",
    label: "Team",
    he: "צוות",
    icon: "users",
    group: "Management",
    roles: ["owner"],
    selector:
      'section[aria-label="members"], section[aria-label="Invite team members"]',
  },
  {
    id: "automation",
    label: "Automation",
    he: "אוטומציה",
    icon: "bolt",
    group: "Management",
    roles: ["owner", "admin"],
    selector: 'section[aria-label="Automatic guest access"]',
  },
  {
    id: "operations",
    label: "Operations",
    he: "תפעול",
    icon: "bolt",
    group: "Management",
    roles: ["owner", "admin", "staff"],
    selector:
      'section[aria-label="Host operations"], section[aria-label="Service health"]',
  },
  {
    id: "integrations",
    label: "Integrations",
    he: "אינטגרציות",
    icon: "key",
    group: "Advanced",
    roles: ["owner", "admin"],
    selector:
      'section[aria-label="API integrations"], section[aria-label="Reservation integrations"]',
  },
  {
    id: "billing",
    label: "Billing statements",
    he: "דוחות חיוב",
    icon: "file",
    group: "Advanced",
    roles: ["owner"],
    selector: "[data-workspace-billing]",
  },
  {
    id: "support",
    label: "Support",
    he: "תמיכה",
    icon: "chat",
    group: "Advanced",
    roles: ["owner"],
    selector:
      'section[aria-label="Temporary support access"], section[aria-label="Approved support diagnostics"]',
  },
  {
    id: "organization",
    label: "Organization settings",
    he: "הגדרות ארגון",
    icon: "home",
    group: "Advanced",
    selector: '[data-workspace-view="organization"]',
  },
  {
    id: "invitations",
    label: "Team invitations",
    he: "הזמנות לצוות",
    icon: "users",
    group: "Account",
    selector: 'section[aria-label="Team invitations"]',
  },
  {
    id: "account",
    label: "Settings",
    he: "חשבון ואבטחה",
    icon: "settings",
    group: "Account",
    selector: "#account-details",
  },
  {
    id: "overview",
    label: "Overview",
    he: "ניהול פלטפורמה",
    icon: "users",
    group: "Platform",
    selector: "#admin-overview",
  },
];

const aliases = {
  settings: "account",
  "access-keys": "systems",
  "jobs-calendar": "operations",
  "service-health": "operations",
  "api-integrations": "integrations",
  "system-import": "systems",
  guests: "reservations",
  staff: "team",
  invoices: "billing",
  organizations: "organization",
  Guests: "reservations",
  Staff: "team",
  "Access Keys": "systems",
  "Jobs Calendar": "operations",
  "Service health": "operations",
  "API integrations": "integrations",
  Invoices: "billing",
  "System Import": "systems",
  Organizations: "organization",
};

export function workspaceView(value) {
  return (
    workspaceViews.find((view) => view.id === value || view.label === value) ??
    workspaceViews.find((view) => view.id === aliases[value])
  );
}

export function workspaceLocation(url) {
  if (url.pathname === "/dashboard/host/overview/") return "overview";
  return workspaceView(url.searchParams.get("view"))?.id ?? "calendar";
}

export function allowedWorkspaceViews(role) {
  return workspaceViews.filter(
    (view) =>
      !["account", "overview", "invitations"].includes(view.id) &&
      (!view.roles || view.roles.includes(role)),
  );
}
