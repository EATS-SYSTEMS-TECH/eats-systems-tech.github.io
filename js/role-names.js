// Display names only. Persisted roles and authorization contracts stay unchanged.
const names = {
  en: { founder: "Founder", user: "User", owner: "Organization Owner", admin: "Organization Admin", staff: "Organization Staff", viewer: "Organization Viewer" },
  he: { founder: "מייסד", user: "משתמש", owner: "בעל הארגון", admin: "מנהל ארגון", staff: "צוות הארגון", viewer: "צופה בארגון" },
};
const labels = language => names[(language ?? globalThis.document?.documentElement.lang ?? "en").startsWith("he") ? "he" : "en"];

export function planRoleName(role, language) {
  return labels(language)[role === "admin" ? "founder" : "user"];
}

export function organizationRoleName(role, language) {
  const shared = { "organization-admin": "admin", "organization-user": "staff", "organization-staff": "staff", "organization-viewer": "viewer" }[role] ?? role;
  return labels(language)[shared] ?? "";
}
