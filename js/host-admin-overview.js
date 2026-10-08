import {
  adminRequest,
  portalRequest,
  changePortalAccess,
  deletePortalAccess,
} from "./api/index.js";
import { reauthenticate } from "./site-auth.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { node, field } from "./host-ui.js";
import { roleBadge, accessBadge } from "./host-role-badge.js";

const root = document.querySelector("#admin-overview");
const tabs = ["admins", "users", "organizations"];
const roles = ["owner", "admin", "staff", "viewer"].map((role) => [role, role]);
let generation = 0;
let activeDialog;
let actionBusy = false;
export const adminActionInProgress = () => actionBusy;

export function clearAdminOverview() {
  generation++;
  activeDialog?.close();
  activeDialog?.remove();
  activeDialog = undefined;
  root.replaceChildren();
  root.hidden = true;
}

const message = (error) =>
  ({
    GATES_CLAIMED:
      "Release or transfer the claimed gates before archiving this organization.",
    LAST_OWNER_PROTECTED:
      "Invite another owner and wait for acceptance before removing the last owner.",
    SELF_ACCESS_PROTECTED: "You cannot change your own Host access.",
    LAST_ADMIN_PROTECTED: "At least one active Host administrator must remain.",
    PORTAL_ACCESS_EXISTS:
      "This email already has Host access. Find it in the people list.",
    INVITATION_PENDING: "This person already has a pending invitation.",
    MEMBERSHIP_EXISTS: "This person already has a Host membership.",
    OWNER_ACCESS_BLOCKED:
      "The owner's Host access is blocked. Unblock it explicitly first.",
    VERSION_CONFLICT:
      "The record changed. Close this dialog and refresh before trying again.",
    RECENT_REAUTH_REQUIRED:
      "Sign in again with your authenticator, then retry.",
    DIRECTORY_CAPACITY_EXCEEDED:
      "This directory needs a smaller page or an administrator review.",
  })[error?.code] ??
  (error?.status === 404
    ? "This administration feature is awaiting the backend update. Your Calendar and Settings remain available."
    : "The request could not be completed. Please retry.");

export async function loadAdminOverview(user, identity) {
  clearAdminOverview();
  if (identity.role !== "admin" || !identity.mfa.verified) return;
  root.hidden = false;
  const epoch = generation;
  const current = () => epoch === generation;
  const requested = new URLSearchParams(location.search).get("tab");
  let tab = tabs.includes(requested) ? requested : "admins";
  let query = "";
  let nextCursor;
  let requestGeneration = 0;
  let counts = {};
  const attempts = new Map();
  const tiles = node("div", undefined, {
    class: "admin-tiles",
    role: "tablist",
    "aria-label": "Directory",
  });
  const toolbar = node("form", undefined, {
    class: "admin-toolbar",
    role: "search",
  });
  const search = field(toolbar, "Search this directory", "query", "", "search");
  search.required = false;
  const searchButton = node("button", "Search", { type: "submit" });
  const add = node("button", "Add admin", { type: "button" });
  const refresh = node("button", "Refresh", { type: "button" });
  toolbar.append(searchButton, add, refresh);
  const status = node("p", "Loading overview…", {
    role: "status",
    "aria-live": "polite",
  });
  const rows = node("div", undefined, {
    class: "admin-rows",
    role: "tabpanel",
    id: "admin-directory",
  });
  const more = node("button", "Load more", { type: "button", hidden: "" });
  root.append(
    node("h1", "Overview"),
    node("p", "Manage Host access, people and organizations."),
    tiles,
    toolbar,
    status,
    rows,
    more,
  );

  for (const name of tabs) {
    const button = node("button", undefined, {
      type: "button",
      role: "tab",
      "aria-controls": "admin-directory",
      id: `admin-tab-${name}`,
      "data-tab": name,
    });
    button.append(
      node("strong", "—"),
      node("span", name[0].toUpperCase() + name.slice(1)),
    );
    button.addEventListener("click", () => {
      if (!current()) return;
      tab = name;
      query = "";
      search.value = "";
      const url = new URL(location.href);
      url.pathname = "/dashboard/host/overview/";
      url.searchParams.set("tab", tab);
      history.replaceState(null, "", url);
      void read();
    });
    button.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key))
        return;
      event.preventDefault();
      const index = tabs.indexOf(name);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? 2
            : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
      const target = tiles.querySelector(`[data-tab="${tabs[next]}"]`);
      target.focus();
      target.click();
    });
    tiles.append(button);
  }

  function dialog(title, description, build, submitLabel, execute) {
    activeDialog?.close();
    activeDialog?.remove();
    const modal = node("dialog", undefined, {
      class: "admin-dialog",
      "aria-labelledby": "admin-dialog-title",
    });
    activeDialog = modal;
    const form = node("form");
    const feedback = node("p", "", { role: "status", "aria-live": "polite" });
    form.append(
      node("h2", title, { id: "admin-dialog-title" }),
      node("p", description),
    );
    build(form);
    const submit = node("button", submitLabel, { type: "submit" });
    const close = node("button", "Cancel", { type: "button" });
    close.addEventListener("click", () => modal.close());
    form.append(feedback, submit, close);
    modal.append(form);
    document.body.append(modal);
    modal.addEventListener("close", () => {
      modal.remove();
      if (activeDialog === modal) activeDialog = undefined;
    });
    modal.showModal();
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!current() || submit.disabled || !form.reportValidity()) return;
      const values = Object.fromEntries(new FormData(form));
      const signature = JSON.stringify([title, description, values]);
      if (!attempts.has(signature))
        attempts.set(signature, crypto.randomUUID());
      submit.disabled = true;
      close.disabled = true;
      actionBusy = true;
      feedback.textContent = "Confirm your identity with your authenticator…";
      try {
        await reauthenticate(user, requestMfaChallenge);
        await user.getIdToken(true);
        if (!current() || !modal.isConnected) return;
        feedback.textContent = "Saving…";
        await execute(values, attempts.get(signature));
        attempts.delete(signature);
        if (!current()) return;
        modal.close();
        await read();
      } catch (error) {
        if (current() && modal.isConnected)
          feedback.textContent = message(error);
      } finally {
        actionBusy = false;
        submit.disabled = false;
        close.disabled = false;
      }
    });
    return form;
  }

  function membershipTags(container, memberships) {
    for (const membership of memberships) {
      const line = node("p", membership.organizationName);
      for (const [product, value] of Object.entries(membership.products)) {
        line.append(
          node("span", ` ${product}: `),
          roleBadge(value.role),
          accessBadge(value.status),
        );
      }
      container.append(line);
    }
  }

  function removeMembership(membership) {
    dialog(
      "Remove Host membership",
      `${membership.email} will lose Host access to ${membership.organizationName}. Other product roles and audit history remain.`,
      () => {},
      "Remove membership",
      (_, key) =>
        adminRequest(
          user,
          `/api/v1/admin/organizations/${membership.clientId}/members/${membership.id}`,
          "DELETE",
          { version: membership.version },
          key,
        ),
    );
  }

  function personDetails(person) {
    const form = dialog(
      "Person access",
      person.email,
      (form) => {
        form.append(roleBadge(person.role, true), accessBadge(person.status));
        membershipTags(form, person.memberships);
        for (const membership of person.memberships) {
          if (membership.products.host?.status !== "active") continue;
          const remove = node(
            "button",
            `Remove from ${membership.organizationName}`,
            { type: "button" },
          );
          remove.addEventListener("click", () => removeMembership(membership));
          form.append(remove);
        }
      },
      "Close",
      async () => {},
    );
    form.querySelector('[type="submit"]').remove();
    form.querySelector("button:last-child").textContent = "Close";
  }

  function personRow(person) {
    const row = node("article", undefined, { class: "admin-row" });
    const name = node("button", person.name || person.email, {
      type: "button",
      class: "admin-person-link",
    });
    name.addEventListener("click", () => personDetails(person));
    const information = node("div");
    information.append(
      name,
      node("p", person.email),
      roleBadge(person.role, true),
      accessBadge(person.status),
    );
    if (person.role === "admin")
      information.append(
        node(
          "p",
          `Authenticator: ${person.mfaEnrolled === null ? "Not registered" : person.mfaEnrolled ? "Enrolled" : "Not enrolled"} · Last sign-in: ${person.lastSignInAt ? new Date(person.lastSignInAt).toLocaleString() : "Not yet"}`,
        ),
      );
    else membershipTags(information, person.memberships);
    const actions = node("details", undefined, { class: "admin-row-actions" });
    actions.append(node("summary", "Actions"));
    for (const action of [
      person.status === "blocked" ? "Unblock" : "Block",
      "Remove",
    ]) {
      const button = node("button", action, { type: "button" });
      const own =
        person.email === identity.user.email ||
        person.uid === identity.user.uid;
      const last =
        person.role === "admin" &&
        person.status === "active" &&
        counts.activeAdmins === 1;
      button.disabled = own || last;
      if (button.disabled)
        button.title = own
          ? "You cannot change your own Host access."
          : "The last active Host admin is protected.";
      button.addEventListener("click", () =>
        dialog(
          `${action} Host access`,
          `${person.email}: ${action === "Remove" ? "removes Host access and retains account and audit history" : action === "Block" ? "blocks Host access immediately" : "restores Host access"}.`,
          () => {},
          `${action} access`,
          (_, key) =>
            action === "Remove"
              ? deletePortalAccess(user, person.email, key)
              : changePortalAccess(
                  user,
                  {
                    email: person.email,
                    status: action === "Block" ? "blocked" : "active",
                  },
                  key,
                ),
        ),
      );
      actions.append(button);
    }
    row.append(information, actions);
    return row;
  }

  async function openOrganization(item, archive = false) {
    status.textContent = "Loading organization…";
    try {
      const result = await adminRequest(
        user,
        `/api/v1/admin/organizations/${item.id}`,
      );
      if (!current()) return;
      const { organization, members, impact } = result;
      if (archive) {
        const description = `${organization.name}: ${impact.members} members, ${impact.properties} properties, ${impact.rooms} rooms and ${impact.openReservations} open reservations will become inaccessible. History is retained. ${impact.gates ? `Release or transfer ${impact.gates} claimed gates first: ${impact.systems.map((system) => system.name).join(", ")}.` : "No gates are claimed."}`;
        const form = dialog(
          "Archive organization",
          description,
          (form) => field(form, "Type the organization name", "confirmName"),
          "Archive organization",
          (values, key) =>
            portalRequest(
              user,
              `/api/v1/organizations/${item.id}`,
              "DELETE",
              {
                confirmName: values.confirmName,
                version: organization.version,
              },
              key,
            ),
        );
        const confirm = form.elements.namedItem("confirmName");
        const submit = form.querySelector('[type="submit"]');
        submit.disabled = true;
        confirm.addEventListener("input", () => {
          submit.disabled =
            impact.gates > 0 || confirm.value !== organization.name;
        });
      } else {
        const form = dialog(
          organization.name,
          "Organization members and their roles in each product. Invitations appear in the recipient's dashboard; no email is sent automatically.",
          (form) => {
            for (const member of members) {
              const block = node("article");
              block.append(node("h3", member.email));
              membershipTags(block, [member]);
              if (member.products.host?.status === "active") {
                const remove = node("button", "Remove Host membership", {
                  type: "button",
                });
                remove.addEventListener("click", () =>
                  removeMembership(member),
                );
                block.append(remove);
              }
              form.append(block);
            }
            field(form, "Invite email", "email", "", "email");
            field(form, "Organization role", "role", "staff", "text", roles);
          },
          "Invite member",
          (values, key) =>
            adminRequest(
              user,
              `/api/v1/admin/organizations/${item.id}/invitations`,
              "POST",
              values,
              key,
            ),
        );
        if (organization.status === "pending" && organization.ownerEmail) {
          form.elements.namedItem("email").value = organization.ownerEmail;
          form.elements.namedItem("email").readOnly = true;
          form.elements.namedItem("role").value = "owner";
          form.elements.namedItem("role").disabled = true;
          const ownerRole = node("input", undefined, {
            type: "hidden",
            name: "role",
            value: "owner",
          });
          form.append(
            ownerRole,
            node(
              "p",
              "Waiting for the owner to accept. You can renew their invitation after its seven-day deadline.",
            ),
          );
          form.querySelector('[type="submit"]').textContent =
            "Renew owner invitation";
        } else if (organization.status !== "active") {
          form.querySelector('[type="submit"]').disabled = true;
          form.append(
            node(
              "p",
              "Waiting for the initial owner to accept their invitation.",
            ),
          );
        }
      }
      status.textContent = "";
    } catch (error) {
      if (current()) status.textContent = message(error);
    }
  }

  function organizationRow(item) {
    const row = node("article", undefined, { class: "admin-row" });
    const info = node("div");
    const name = node("button", item.name, {
      type: "button",
      class: "admin-person-link",
    });
    name.addEventListener("click", () => void openOrganization(item));
    info.append(
      name,
      accessBadge(item.status),
      node(
        "p",
        `Owner: ${item.owners.join(", ") || item.ownerEmail || "Needs review"}`,
      ),
      node(
        "p",
        `${item.memberCount} members · ${item.gateCount} gates · ${item.products.join(" / ")}`,
      ),
    );
    const archive = node("button", "Archive organization", { type: "button" });
    archive.addEventListener("click", () => void openOrganization(item, true));
    row.append(info, archive);
    return row;
  }

  async function read(append = false) {
    if (!current()) return;
    const request = ++requestGeneration;
    const selected = tab;
    status.textContent = "Loading directory…";
    more.disabled = true;
    add.textContent =
      selected === "organizations"
        ? "Create organization"
        : selected === "admins"
          ? "Add admin"
          : "Add user";
    for (const button of tiles.children) {
      button.setAttribute(
        "aria-selected",
        String(button.dataset.tab === selected),
      );
      button.tabIndex = button.dataset.tab === selected ? 0 : -1;
    }
    rows.setAttribute("aria-labelledby", `admin-tab-${selected}`);
    if (!append) rows.replaceChildren();
    try {
      const params = new URLSearchParams({ limit: "20", query });
      if (selected !== "organizations")
        params.set("role", selected === "admins" ? "admin" : "user");
      if (append && nextCursor) params.set("cursor", nextCursor);
      const [summary, result] = await Promise.all([
        adminRequest(user, "/api/v1/admin/overview"),
        adminRequest(
          user,
          `/api/v1/admin/${selected === "organizations" ? "organizations" : "people"}?${params}`,
        ),
      ]);
      if (!current() || request !== requestGeneration) return;
      counts = summary;
      for (const button of tiles.children)
        button.querySelector("strong").textContent = String(
          summary[button.dataset.tab],
        );
      rows.append(
        ...result.items.map(
          selected === "organizations" ? organizationRow : personRow,
        ),
      );
      nextCursor = result.nextCursor;
      more.hidden = !nextCursor;
      more.disabled = false;
      status.textContent = result.items.length
        ? "Directory loaded."
        : nextCursor
          ? "No matches on this page. Continue to the next page."
          : "No matching records.";
    } catch (error) {
      if (current() && request === requestGeneration) {
        status.textContent = message(error);
        more.hidden = true;
      }
    }
  }

  add.addEventListener("click", () => {
    if (tab === "organizations") {
      dialog(
        "Create organization",
        "The owner will receive an invitation in their dashboard. The organization becomes active after they accept with an authenticator. No email is sent automatically.",
        (form) => {
          field(form, "Organization name", "name");
          field(
            form,
            "Time zone",
            "timezone",
            Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          );
          field(form, "Owner email", "ownerEmail", "", "email");
        },
        "Create organization",
        (values, key) =>
          adminRequest(
            user,
            "/api/v1/admin/organizations",
            "POST",
            values,
            key,
          ),
      );
      return;
    }
    const role = tab === "admins" ? "admin" : "user";
    const form = dialog(
      `Add ${role}`,
      "Approve this email for Host. They sign in with the same verified Google or Apple email.",
      (form) => field(form, "Email", "email", "", "email"),
      `Add ${role}`,
      (values, key) =>
        adminRequest(
          user,
          "/api/v1/admin/people",
          "POST",
          {
            email: values.email,
            role,
            ...(values.organization
              ? {
                  organization: {
                    id: values.organization,
                    role: values.organizationRole,
                  },
                }
              : {}),
          },
          key,
        ),
    );
    if (role === "user") {
      const section = node("div");
      form.insertBefore(section, form.querySelector('[role="status"]'));
      const selector = field(
        section,
        "Organization (optional)",
        "organization",
        "",
        "text",
        [["", "Host access only"]],
      );
      selector.required = false;
      field(
        section,
        "Organization role",
        "organizationRole",
        "staff",
        "text",
        roles,
      );
      section.append(
        node(
          "p",
          "Choosing an organization also creates an invitation. The user accepts it in their dashboard.",
        ),
      );
      const load = node("button", "Load organizations", { type: "button" });
      section.append(load);
      let cursor;
      load.addEventListener("click", async () => {
        load.disabled = true;
        try {
          const params = new URLSearchParams({
            limit: "20",
            ...(cursor ? { cursor } : {}),
          });
          const result = await adminRequest(
            user,
            `/api/v1/admin/organizations?${params}`,
          );
          if (!current() || !form.isConnected) return;
          for (const org of result.items.filter(
            (item) => item.status === "active",
          ))
            selector.append(node("option", org.name, { value: org.id }));
          cursor = result.nextCursor;
          load.hidden = !cursor;
          load.textContent = "Load more organizations";
        } catch (error) {
          if (form.isConnected) load.textContent = message(error);
        } finally {
          load.disabled = false;
        }
      });
      load.click();
    }
  });
  toolbar.addEventListener("submit", (event) => {
    event.preventDefault();
    query = search.value.trim();
    void read();
  });
  refresh.addEventListener("click", () => void read());
  more.addEventListener("click", () => void read(true));
  await read();
}
