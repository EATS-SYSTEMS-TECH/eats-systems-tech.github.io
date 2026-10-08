const descriptions = {
  "host-admin": [
    "Host admin",
    "Manages Host access and the administrator overview. Authenticator required.",
  ],
  "host-user": [
    "Host user",
    "Accesses only their organizations, according to their role in each one.",
  ],
  owner: [
    "owner",
    "Manages organization settings, members, billing and API keys, plus all operations.",
  ],
  admin: [
    "admin",
    "Manages properties, rooms, gates, reservations, invitations and operations.",
  ],
  staff: [
    "staff",
    "Manages reservations, guest invitations and day-to-day operations.",
  ],
  viewer: [
    "viewer",
    "Views the calendar, reservations and gates without making changes.",
  ],
};

export function roleBadge(role, host = false) {
  const key = host ? `host-${role}` : role;
  const [label, description] = descriptions[key] ?? [
    "Unknown role",
    "Access needs review.",
  ];
  const badge = document.createElement("span");
  badge.className = "host-role-badge";
  badge.dataset.role = key;
  badge.textContent = label;
  badge.tabIndex = 0;
  badge.title = description;
  badge.setAttribute("aria-label", `${label}: ${description}`);
  const explanation = document.createElement("span");
  explanation.className = "host-role-explanation";
  explanation.textContent = description;
  badge.append(explanation);
  return badge;
}

export function accessBadge(status) {
  const badge = document.createElement("span");
  badge.className = "host-access-badge";
  badge.dataset.status = status;
  badge.textContent =
    {
      active: "Active",
      pending: "Pending",
      blocked: "Blocked",
      archived: "Archived",
    }[status] ?? "Unavailable";
  return badge;
}
