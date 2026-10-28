import { readFileSync } from "node:fs";

// Shared fixtures for the Host dashboard browser tests: the dashboard shell
// (the same landmarks and styles as dashboard/host/index.html, without the
// sign-in bootstrap) and the organization permissions the Host API returns in
// workspace.permissions for each role.
export const rolePermissions = Object.freeze({
  owner: [
    "read",
    "organization:write",
    "members:write",
    "systems:write",
    "reservations:write",
    "invitations:write",
    "billing:write",
    "integrations:write",
    "operations:write",
  ],
  admin: [
    "read",
    "systems:write",
    "reservations:write",
    "invitations:write",
    "integrations:write",
    "operations:write",
  ],
  staff: ["read", "reservations:write", "invitations:write", "operations:write"],
  viewer: ["read"],
});

export function workspaceFor(role, service = { state: "legacy-active", available: true }) {
  return { role, permissions: rolePermissions[role] ?? [], service };
}

// Production markup keeps test fixtures on the same responsive shell as the
// deployed Host dashboard. Only authentication/bootstrap is replaced by the
// isolated fixture script; all layout styles, landmarks and IDs are real.
export function hostShell(script, { head = "" } = {}) {
  let html = readFileSync(new URL("../dashboard/host/index.html", import.meta.url), "utf8");
  html = html.replace(/<script[\s\S]*?<\/script>/g, "");
  html = html.replace("</head>", `${head}</head>`);
  return html.replace("</body>", `<script type="module">document.querySelector('#host-sidebar').hidden=false;document.querySelector('#dashboard-content').hidden=false;document.querySelector('#access-panel').hidden=true;document.body.classList.add('host-ready');</script>${script ? `<script type="module" src="${script}"></script>` : ""}</body>`);
}
