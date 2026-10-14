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

export function hostShell(script, { head = "" } = {}) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/css/host-portal.css"><link rel="stylesheet" href="/css/platform.css"><link rel="stylesheet" href="/css/host-dashboard.css"><link rel="stylesheet" href="/css/host-admin.css">${head}</head><body class="host-app portal-dashboard host-ready"><aside id="host-sidebar" class="host-sidebar"><div id="workspace-org-switcher" class="org-switcher" hidden></div><nav id="host-section-navigation" aria-label="Dashboard sections"></nav><section id="host-my-systems" class="sidebar-systems" hidden><h2>My systems</h2><ul id="host-my-systems-list" class="sidebar-systems__list"></ul></section><div id="host-platform-navigation" class="sidebar-platform"></div></aside><header class="host-topbar"><div class="host-topbar__start"><button class="workspace-menu-toggle" type="button"><svg viewBox="0 0 24 24"></svg></button><h1 id="workspace-current-view"></h1></div><div id="product-switcher" class="product-switcher"></div><div class="host-topbar__end"><button id="join-organization" class="host-icon-button host-bell" type="button"><span class="host-bell__count" data-invitation-count></span></button></div></header><div class="host-scrim" hidden></div><main class="portal-shell" id="workspace-main"><div id="dashboard-content"><section id="admin-overview" class="portal-panel" hidden></section><section id="host-management" class="portal-panel"></section></div></main><nav id="host-tabbar" class="host-tabbar" hidden></nav>${script ? `<script type="module" src="${script}"></script>` : ""}</body></html>`;
}
