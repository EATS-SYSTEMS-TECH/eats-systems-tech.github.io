import { hostText } from "./host-locale.js";
import { node, infoTip } from "./host-ui.js";
import { roleBadge, accessBadge, roleLabel } from "./host-role-badge.js";
import { readHostPages } from "./host-pages.js";
import { can } from "./host-permissions.js";
import { renderOwnerMembershipInvitations } from "./host-membership-invitations.js";
import { openSystemDialog, changeTracker } from "./host-system-cards.js";
import { initial } from "./host-org-selector.js";

// Settings → Team (the owner: members:write). The people in the
// organization, each with a role and access the owner can change; new
// people join only through an invitation (below the list). The signed-in
// person's own row has no Change: another owner changes their role.
const roles = ["owner", "admin", "staff", "viewer"];
const refusals = {
  LAST_OWNER_PROTECTED: "At least one active owner must remain.",
  MEMBER_NOT_FOUND: "This person is no longer in the organization.",
  SELF_ACCESS_PROTECTED: "You can't change your own role or access.",
};

const sameEmail = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  a.trim().toLowerCase() === b.trim().toLowerCase();

// context: {user, email (the signed-in person's), organization, isCurrent,
// onChanged()}.
export async function renderTeam(panel, context) {
  const { user, organization } = context;
  const ownEmail = context.email ?? user?.email;
  const base = `/api/v1/organizations/${encodeURIComponent(organization.id)}`;
  const section = node("section", undefined, {
    "aria-label": "Team",
    class: "team-view",
  });
  section.append(node("h3", hostText("Team")));
  panel.append(section);
  const { items } = await readHostPages(
    user,
    `${base}/members`,
    context.isCurrent,
  );
  if (!context.isCurrent()) return;
  const manage = can(organization, "members:write");
  const list = node("ul", undefined, { class: "team-list" });
  for (const member of items) {
    if (typeof member?.email !== "string") continue;
    const item = node("li", undefined, {
      class: "team-member",
      "data-member-email": member.email,
    });
    const who = node("span", undefined, { class: "team-member__who" });
    who.append(
      node("span", initial(member.displayName || member.email), {
        class: "account-card__avatar team-member__avatar",
        "aria-hidden": "true",
      }),
      node("span", member.email, { dir: "ltr", class: "team-member__email" }),
    );
    const badges = node("span", undefined, { class: "team-member__badges" });
    badges.append(roleBadge(member.role), accessBadge(member.status));
    item.append(who, badges);
    if (manage && sameEmail(member.email, ownEmail)) {
      item.dataset.self = "true";
      item.append(
        infoTip(hostText("Another owner can change your role or access.")),
      );
    } else if (manage) {
      const change = node("button", hostText("Change"), {
        type: "button",
        class: "button-secondary",
        "aria-label": hostText("Change {p0}", { p0: member.email }),
      });
      change.addEventListener("click", () => edit(member, change));
      item.append(change);
    }
    list.append(item);
  }
  section.append(list);

  function edit(member, trigger) {
    const tracker = changeTracker({
      user,
      isCurrent: context.isCurrent,
      onChanged: () => context.onChanged(),
    });
    openSystemDialog({
      container: section,
      trigger,
      title: hostText("Change {p0}", { p0: member.email }),
      submitLabel: hostText("Save"),
      build(form) {
        const roleGroup = node("fieldset", undefined, { class: "choice-list" });
        roleGroup.append(node("legend", hostText("Role")));
        for (const role of roles) {
          const choice = node("label", undefined, { class: "choice" });
          const radio = node("input", undefined, {
            type: "radio",
            name: "role",
            value: role,
          });
          radio.checked = member.role === role;
          choice.append(
            radio,
            node("span", roleLabel(role), { class: "choice__name" }),
          );
          roleGroup.append(choice);
        }
        const accessGroup = node("fieldset", undefined, {
          class: "choice-list",
        });
        accessGroup.append(node("legend", hostText("Access")));
        for (const [value, label] of [
          ["active", "Active"],
          ["blocked", "Blocked"],
        ]) {
          const choice = node("label", undefined, { class: "choice" });
          const radio = node("input", undefined, {
            type: "radio",
            name: "status",
            value,
          });
          radio.checked = (member.status ?? "active") === value;
          choice.append(
            radio,
            node("span", hostText(label), { class: "choice__name" }),
          );
          accessGroup.append(choice);
        }
        form.append(roleGroup, accessGroup);
      },
      onClosed: () => tracker.closed(),
      submit: ({ data, status }) => {
        const role = data.get("role");
        const access = data.get("status");
        if (role === member.role && access === member.status) return true;
        return tracker.run({
          path: `${base}/members`,
          body: { email: member.email, role, status: access },
          status,
          onRefused: (error) => {
            if (!refusals[error?.code]) return false;
            status.textContent = hostText(refusals[error.code]);
            return true;
          },
        });
      },
    });
  }
  await renderOwnerMembershipInvitations({
    container: panel,
    user,
    organization,
    isCurrent: context.isCurrent,
  });
}
