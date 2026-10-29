import { managerExampleOrganization } from "./manager-example-data.js";
import { validOrganizationLogo } from "./manager-organization-card.js";

// This adapter has no transport or authentication dependency. All mutations are
// per-dashboard memory, through the same UI contract used by a real organization.
export function createExampleOrganization(
  data,
  definition = managerExampleOrganization,
) {
  const path = "/example-organizations/" + definition.id;
  const owner = { uid: "demo-organization-owner", email: "owner@example.test" };
  let organizationName = definition.name,
    logoDataUrl = null,
    logoChanged = false,
    version = 1,
    sequence = 0;
  const members = data.members.map((person, index) => ({
    ...person,
    uid: "demo-org-admin-" + index,
    role: "organization-admin",
  }));
  members.push({
    uid: "demo-org-user",
    email: "resident@example.test",
    role: "organization-user",
    status: "active",
  });
  const invitations = [];
  const fail = (code) => {
    throw Object.assign(new Error(code), { code });
  };
  const organization = () => ({
    ...definition,
    name: organizationName,
    logoAsset: logoChanged ? undefined : definition.logoAsset,
    version,
    logoDataUrl,
  });
  const counts = () => ({
    administrators:
      1 +
      members.filter(
        (m) => m.status === "active" && m.role === "organization-admin",
      ).length,
    users: members.filter(
      (m) => m.status === "active" && m.role === "organization-user",
    ).length,
    systems: data.assignments.size,
  });
  return {
    path,
    owner,
    summary: () => ({
      ...organization(),
      owner: { ...owner, role: "user" },
      linkedSystemCount: data.assignments.size,
    }),
    async request(url, method = "GET", body = {}) {
      if (url === path && method === "GET")
        return {
          organization: organization(),
          owner: { ...owner },
          counts: counts(),
          permissions: {
            managePeople: true,
            manageLogo: true,
            openWorkspace: true,
          },
        };
      if (url.startsWith(path + "/members?") && method === "GET")
        return { items: structuredClone(members), nextCursor: null };
      if (url.startsWith(path + "/invitations?") && method === "GET")
        return {
          items: structuredClone(
            invitations.filter((i) => i.status === "pending"),
          ),
          nextCursor: null,
        };
      if (url === path + "/name" && method === "POST") {
        if (body.expectedVersion !== version) fail("CONFLICT");
        const name = String(body.name ?? "").trim();
        if (!name || name.length > 100) fail("INVALID_REQUEST");
        organizationName = name; version++;
        return { organization: organization() };
      }
      if (url === path + "/logo" && method === "POST") {
        if (body.expectedVersion !== version) fail("CONFLICT");
        if (
          body.logoDataUrl !== null &&
          !validOrganizationLogo(body.logoDataUrl)
        )
          fail("INVALID_ORGANIZATION_LOGO");
        logoDataUrl = body.logoDataUrl;
        logoChanged = true;
        version++;
        return { organization: organization() };
      }
      if (url === path + "/invitations" && method === "POST") {
        const email = String(body.email ?? "")
          .trim()
          .toLowerCase();
        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
          email.length > 254 ||
          !["organization-admin", "organization-user"].includes(body.role)
        )
          fail("INVALID_REQUEST");
        if (
          email === owner.email ||
          members.some((m) => m.email === email && m.status === "active") ||
          invitations.some((i) => i.email === email && i.status === "pending")
        )
          fail("CONFLICT");
        const invitation = {
          id: "demo-org-invite-" + ++sequence,
          email,
          role: body.role,
          status: "pending",
        };
        invitations.push(invitation);
        return { invitation: structuredClone(invitation) };
      }
      const member = members.find(
        (m) =>
          url === path + "/members/" + encodeURIComponent(m.uid) + "/remove",
      );
      if (member && method === "POST") {
        member.status = "revoked";
        return { removed: true };
      }
      const invitation = invitations.find(
        (i) => url === path + "/invitations/" + i.id + "/cancel",
      );
      if (invitation && method === "POST") {
        invitation.status = "cancelled";
        return { cancelled: true };
      }
      fail("EXAMPLE_SYSTEM_NOT_FOUND");
    },
    clear() {
      logoDataUrl = null;
      logoChanged = true;
      members.length = 0;
      invitations.length = 0;
    },
  };
}
