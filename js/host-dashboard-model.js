export const portalRoles = new Set(["platform_admin", "client_owner", "client_member"]);

export function parseIdentity(value) {
  if (!value || typeof value !== "object" || !portalRoles.has(value.role)) return null;
  const memberships = Array.isArray(value.memberships)
    ? value.memberships.filter((membership) => !membership?.status || String(membership.status).toLowerCase() === "active")
    : [];
  return { role: value.role, memberships };
}

export function records(value, keys) {
  if (Array.isArray(value)) return value;
  for (const key of keys) if (Array.isArray(value?.[key])) return value[key];
  return [];
}

export function safeText(value) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}
