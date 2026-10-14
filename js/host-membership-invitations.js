import { hostText, hostLocale } from "./host-locale.js";
import {
  portalRequest,
  pendingMembershipInvitations,
  acceptMembershipInvitation,
  getPlatformProfile,
} from "./api/index.js";
import { reauthenticate } from "./site-auth.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { roleBadge, roleLabel } from "./host-role-badge.js";
import { can } from "./host-permissions.js";
import {
  node,
  field,
  hostDateTime,
  infoTip,
  viewerTimeZone,
  isolatedText,
} from "./host-ui.js";
// A line with a date in it ("Open until {p0}"): the date stays whole on a
// narrow screen.
function dateLine(tag, message, date, attrs = {}) {
  const line = node(tag, undefined, attrs);
  line.append(
    isolatedText(message, { p0: hostDateTime(date, viewerTimeZone()) }),
  );
  line.querySelector("bdi")?.classList.add("team-invitation__date");
  return line;
}
let accepting = false;
export const membershipActionInProgress = () => accepting;
const failure = (error) =>
  ({
    TOTP_REQUIRED: hostText(
      "Verify your authenticator before accepting a management role.",
    ),
    RECENT_TOTP_REQUIRED: hostText(
      "Sign in again with your authenticator, then retry.",
    ),
    INVITATION_EXPIRED: hostText(
      "This invitation expired. Ask the owner for a new invitation.",
    ),
    INVITATION_PENDING: hostText(
      "A pending invitation already exists for this email.",
    ),
    MEMBERSHIP_EXISTS: hostText(
      "Membership already exists. Review the current member access instead.",
    ),
    INVITER_ACCESS_DENIED: hostText(
      "The inviting owner is unavailable. Ask an active owner to review this invitation.",
    ),
    INVITATION_CAPACITY_EXCEEDED: hostText(
      "Review or cancel pending invitations before adding more.",
    ),
    VERSION_CONFLICT: hostText(
      "The invitation changed. Load the current invitations before retrying.",
    ),
  })[error?.code] ??
  hostText(
    "Invitation action failed. Refresh and verify your current access before retrying.",
  );

// What went wrong while joining, for the person who was asked to join. In
// Hebrew "הזמנות" means bookings, so these lines speak of joining.
const joinFailure = (error) =>
  ({
    TOTP_REQUIRED: hostText(
      "Verify your authenticator before joining with a management role.",
    ),
    RECENT_TOTP_REQUIRED: hostText(
      "Sign in again with your authenticator, then retry.",
    ),
    INVITATION_EXPIRED: hostText(
      "This request to join has expired. Ask the owner to send a new one.",
    ),
    MEMBERSHIP_EXISTS: hostText("You already belong to this organization."),
    INVITER_ACCESS_DENIED: hostText(
      "The owner who asked you to join is no longer active. Ask an active owner to send a new request.",
    ),
    VERSION_CONFLICT: hostText(
      "This request to join changed. Choose Check again, then retry.",
    ),
  })[error?.code] ??
  hostText("Joining didn't work. Choose Check again, then retry.");

export async function renderPendingMembershipInvitations({
  container,
  user,
  isCurrent,
  onAccepted,
}) {
  // The join-organization view behind the bell: organizations that asked
  // this verified email to join. Owner and admin roles ask for the
  // authenticator before joining.
  const section = node("section", undefined, {
      "aria-label": "Join an organization",
      class: "join-view",
    }),
    heading = node("div", undefined, { class: "view-heading" }),
    status = node("p", hostText("Loading…"), {
      role: "status",
      class: "join-view__status",
    }),
    again = node("button", hostText("Check again"), {
      type: "button",
      class: "button-secondary",
      hidden: "",
    }),
    rows = node("div", undefined, { class: "join-view__rows" });
  heading.append(
    node("h2", hostText("Organizations waiting for you")),
    infoTip(
      hostText(
        "Organizations that asked your verified email to join appear here. Owner and admin roles ask for your authenticator.",
      ),
    ),
  );
  section.append(heading, rows, status, again);
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  let busy = false;
  async function read(cursor, append = false) {
    const result = await pendingMembershipInvitations(user, {
      ...(cursor ? { cursor } : {}),
    });
    if (!current()) return;
    if (!append) rows.replaceChildren();
    for (const item of result.items) {
      const row = node("article", undefined, {
        "data-invitation-id": item.id,
        class: "join-card",
      });
      const details = node("div", undefined, { class: "join-card__details" });
      details.append(
        node("strong", item.organizationName, { dir: "auto" }),
        // When joining closes, in the reader's own time zone.
        dateLine("small", "Open until {p0}", item.expiresAt),
      );
      row.append(details, roleBadge(item.role));
      const accept = node("button", hostText("Join"), {
        type: "button",
        "aria-label": hostText("Join {p0}", { p0: item.organizationName }),
      });
      let intent;
      accept.addEventListener("click", async () => {
        if (busy || !current()) return;
        busy = true;
        accept.disabled = true;
        intent ??= crypto.randomUUID();
        try {
          accepting = true;
          if (["owner", "admin"].includes(item.role)) {
            const profile = await getPlatformProfile(user);
            if (!current()) return;
            if (!profile.mfa.enrolled) {
              status.textContent = hostText(
                "Set up your authenticator, then come back to join.",
              );
              window.dispatchEvent(new CustomEvent("host:totp-required"));
              return;
            }
            await reauthenticate(user, requestMfaChallenge);
            await user.getIdToken(true);
            if (!current()) return;
          }
          await acceptMembershipInvitation(user, item.id, item.version, intent);
          if (current()) await onAccepted(item.clientId);
        } catch (error) {
          if (current()) {
            status.textContent = joinFailure(error);
            again.hidden = false;
          }
        } finally {
          accepting = false;
          busy = false;
          if (current()) accept.disabled = false;
        }
      });
      row.append(accept);
      rows.append(row);
    }
    if (result.nextCursor) {
      const more = node("button", hostText("Show more"), {
        type: "button",
        class: "button-secondary",
      });
      more.addEventListener("click", async () => {
        if (busy || !current()) return;
        busy = true;
        more.disabled = true;
        try {
          await read(result.nextCursor, true);
          if (current()) more.remove();
        } catch (error) {
          if (current()) status.textContent = joinFailure(error);
        } finally {
          busy = false;
          if (current()) more.disabled = false;
        }
      });
      rows.append(more);
    }
    status.textContent = rows.children.length
      ? ""
      : hostText("No organization is waiting for you to join.");
    again.hidden = Boolean(rows.children.length);
  }
  again.addEventListener("click", async () => {
    if (busy || !current()) return;
    busy = true;
    again.disabled = true;
    status.textContent = hostText("Loading…");
    try {
      await read();
    } catch (error) {
      if (current()) status.textContent = joinFailure(error);
    } finally {
      busy = false;
      if (current()) again.disabled = false;
    }
  });
  try {
    await read();
  } catch (error) {
    if (current()) {
      status.textContent = joinFailure(error);
      again.hidden = false;
    }
  }
}

// Where a request to join stands, for the owner who sent it.
const invitationStates = {
  pending: "Invitation pending · open until {p0}",
  expired: "Invitation expired",
  cancelled: "Invitation cancelled",
  accepted: "Invitation accepted",
};

export async function renderOwnerMembershipInvitations({
  container,
  user,
  organization,
  isCurrent,
}) {
  // Inviting is the owner's (members:write).
  if (!can(organization, "members:write")) return;
  const section = node("section", undefined, {
      "aria-label": "Invite team members",
    }),
    status = node("p", hostText("Loading…"), {
      role: "status",
      "aria-live": "polite",
    }),
    rows = node("div", undefined, { class: "team-invitations" }),
    form = node("form");
  const email = field(form, "Invite verified email", "email", "", "email"),
    role = field(
      form,
      "Invitation role",
      "role",
      "staff",
      "text",
      // The role's name ("Staff"), never its id.
      ["staff", "viewer", "admin", "owner"].map((value) => [
        value,
        roleLabel(value),
      ]),
    );
  const submit = node("button", hostText("Invite"), {
    type: "submit",
  });
  form.append(submit);
  const heading = node("div", undefined, { class: "view-heading" });
  heading.append(
    node("h3", hostText("Invite team members")),
    infoTip(
      hostText(
        "No email is sent. Tell them to sign in at wifigate.io with this email and join from the bell.",
      ),
    ),
  );
  section.append(heading, form, status, rows);
  container.append(section);
  const current = () => isCurrent() && section.isConnected,
    root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/member-invitations`,
    attempts = new Map();
  let busy = false;
  const key = (signature) => {
    if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
    return attempts.get(signature);
  };
  async function writeWithRecentIdentity(path, body, intent) {
    accepting = true;
    try {
      try {
        await portalRequest(user, path, "POST", body, intent);
      } catch (error) {
        if (error?.code !== "RECENT_TOTP_REQUIRED") throw error;
        if (!current()) return false;
        status.textContent = hostText(
          "Confirm your identity with your authenticator…",
        );
        await reauthenticate(user, requestMfaChallenge);
        await user.getIdToken(true);
        if (!current()) return false;
        await portalRequest(user, path, "POST", body, intent);
      }
      return true;
    } finally {
      accepting = false;
    }
  }
  async function read(cursor, append = false) {
    const result = await portalRequest(
      user,
      `${root}?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    if (!append) rows.replaceChildren();
    for (const item of result.items) {
      // A row like a team member's: who, the role, where the request to join
      // stands (in the viewer's own time) and Cancel while it waits.
      const row = node("article", undefined, {
        "data-invitation-id": item.id,
        class: "team-member team-invitation",
      });
      const who = node("span", undefined, { class: "team-member__who" });
      who.append(
        node("span", item.email, { dir: "ltr", class: "team-member__email" }),
      );
      const badges = node("span", undefined, { class: "team-member__badges" });
      badges.append(roleBadge(item.role));
      const state =
        item.status === "pending" && item.expired ? "expired" : item.status;
      row.append(
        who,
        badges,
        dateLine(
          "p",
          invitationStates[state] ?? invitationStates.pending,
          item.expiresAt,
          { class: "team-invitation__state" },
        ),
      );
      if (item.status === "pending") {
        const cancel = node("button", hostText("Cancel team invitation"), {
          type: "button",
          class: "button-secondary",
        });
        cancel.addEventListener("click", async () => {
          if (busy || !current()) return;
          busy = true;
          cancel.disabled = true;
          const signature = `cancel:${item.id}:${item.version}`;
          try {
            const saved = await writeWithRecentIdentity(
              `${root}/${encodeURIComponent(item.id)}/cancel`,
              { version: item.version },
              key(signature),
            );
            if (!saved) return;
            attempts.delete(signature);
            if (current()) await read();
          } catch (error) {
            if (current()) status.textContent = failure(error);
          } finally {
            busy = false;
            if (current()) cancel.disabled = false;
          }
        });
        row.append(cancel);
      }
      rows.append(row);
    }
    if (result.nextCursor) {
      const more = node("button", hostText("Load more owner invitations"), {
        type: "button",
        class: "button-secondary",
      });
      more.addEventListener("click", async () => {
        if (busy || !current()) return;
        busy = true;
        more.disabled = true;
        try {
          await read(result.nextCursor, true);
          if (current()) more.remove();
        } catch (error) {
          if (current()) status.textContent = failure(error);
        } finally {
          busy = false;
          if (current()) more.disabled = false;
        }
      });
      rows.append(more);
    }
    status.textContent = "";
  }
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !current() || !form.reportValidity()) return;
    const body = { email: email.value.trim().toLowerCase(), role: role.value },
      signature = JSON.stringify(body);
    busy = true;
    [email, role, submit].forEach((input) => {
      input.disabled = true;
    });
    try {
      const saved = await writeWithRecentIdentity(root, body, key(signature));
      if (!saved) return;
      attempts.delete(signature);
      if (current()) {
        email.value = "";
        await read();
      }
    } catch (error) {
      if (current()) status.textContent = failure(error);
    } finally {
      busy = false;
      if (current())
        [email, role, submit].forEach((input) => {
          input.disabled = false;
        });
    }
  });
  try {
    await read();
  } catch (error) {
    if (current()) status.textContent = failure(error);
  }
}
