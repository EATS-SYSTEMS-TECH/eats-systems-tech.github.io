import { hostText } from "./host-locale.js";
const descriptions = {
  "host-admin": [
    "Host admin",
    "Runs the WIFIGATE platform. Authenticator required.",
  ],
  "host-user": ["Host user", "Has a Host plan with My systems."],
  owner: [
    "Owner",
    "Manages the organization, team, billing and connections, and everything else.",
  ],
  admin: [
    "Admin",
    "Manages systems, bookings, guest links, connections and activity.",
  ],
  staff: ["Staff", "Manages bookings, guest links and daily activity."],
  viewer: [
    "Viewer",
    "Views the calendar, bookings and systems without making changes.",
  ],
};
// The Host plan chip in the signed-in person's own account menu and
// Settings → Account speaks to them, not about them.
const ownDescriptions = {
  "host-admin": "You run the WIFIGATE platform. Authenticator required.",
  "host-user": "You have a Host plan with My systems.",
};

// The role's name alone, for lists that show many roles at once.
export function roleLabel(role) {
  return hostText(descriptions[role]?.[0] ?? "Unknown role");
}

// What a role may do, in one plain line (for an ⓘ beside a role choice).
export function roleDescription(role) {
  return hostText(descriptions[role]?.[1] ?? "Access needs review.");
}

export function roleBadge(role, host = false, { own = false } = {}) {
  const key = host ? `host-${role}` : role;
  const [label, generalDescription] = descriptions[key] ?? [
    "Unknown role",
    "Access needs review.",
  ];
  const description = (own && ownDescriptions[key]) || generalDescription;
  const badge = document.createElement("span");
  badge.className = "host-role-badge";
  badge.dataset.role = key;
  badge.textContent = hostText(label);
  badge.title = hostText(description);
  badge.setAttribute(
    "aria-label",
    `${hostText(label)}: ${hostText(description)}`,
  );
  const explanation = document.createElement("span");
  explanation.className = "host-role-explanation";
  explanation.textContent = hostText(description);
  badge.append(explanation);
  return badge;
}

export function accessBadge(status) {
  const badge = document.createElement("span");
  badge.className = "host-access-badge";
  badge.dataset.status = status;
  badge.textContent = hostText(
    {
      active: "Active",
      pending: "Pending",
      blocked: "Blocked",
      archived: "Archived",
    }[status] ?? "Unavailable",
  );
  return badge;
}
