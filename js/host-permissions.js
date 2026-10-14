// What the signed-in person may do in one organization. It comes from the
// server's workspace.permissions for that organization, never from role
// names, so a role the server narrows is narrowed here too.
export function permissionsOf(organization) {
  const list = organization?.workspace?.permissions;
  return new Set(
    Array.isArray(list) ? list.filter((item) => typeof item === "string") : [],
  );
}

export const can = (organization, permission) =>
  permissionsOf(organization).has(permission);

// API keys and deleting a guest's details belong to the owner: the role that
// holds organization:write.
export const ownerOnly = (organization) =>
  can(organization, "organization:write");

// The Host role in this organization, for the role chip only.
export const organizationRole = (organization) =>
  organization?.workspace?.role ?? organization?.membership?.role;

// While an organization's service is paused its records stay readable and
// changes are refused; buttons stay visible, disabled, with an ⓘ.
export const servicePaused = (organization) =>
  organization?.workspace?.service?.available === false;
