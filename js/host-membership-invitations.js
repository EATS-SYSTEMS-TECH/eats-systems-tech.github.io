import { hostText, hostLocale } from "./host-locale.js";
import {
  portalRequest,
  pendingMembershipInvitations,
  acceptMembershipInvitation,
  getProfile,
} from "./api/index.js";
import { reauthenticate } from "./site-auth.js";
import { requestMfaChallenge } from "./host-mfa-challenge.js";
import { roleBadge } from "./host-role-badge.js";
import { node, field } from "./host-ui.js";
let accepting = false;
export const membershipActionInProgress = () => accepting;
const failure = (error) =>
  ({
    TOTP_REQUIRED: hostText(
      "Verify your authenticator before accepting a management role.",
    ),
    RECENT_TOTP_REQUIRED: hostText(
      "Set up your account authenticator and sign in again before accepting or changing a management invitation.",
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

export async function renderPendingMembershipInvitations({
  container,
  user,
  isCurrent,
  onAccepted,
}) {
  const section = node("section", undefined, {
      "aria-label": "Team invitations",
    }),
    status = node("p", hostText("Loading team invitations…"), {
      role: "status",
    }),
    rows = node("div");
  section.append(
    node("h3", hostText("Team invitations")),
    node(
      "p",
      hostText(
        "Only invitations for your verified approved email appear here. Management roles require a recent authenticator sign-in.",
      ),
    ),
    status,
    rows,
  );
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
      const row = node("article", undefined, { "data-invitation-id": item.id });
      row.append(
        node(
          "p",
          hostText("{p0} · expires {p1}", {
            p0: item.organizationName,
            p1: item.expiresAt,
          }),
        ),
        roleBadge(item.role),
      );
      const accept = node("button", hostText("Accept team invitation"), {
        type: "button",
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
            const profile = await getProfile(user);
            if (!current()) return;
            if (!profile.mfa.enrolled) {
              status.textContent = hostText(
                "Set up your authenticator, then return to accept this invitation.",
              );
              window.dispatchEvent(new CustomEvent("host:totp-required"));
              return;
            }
            await reauthenticate(user, requestMfaChallenge);
            await user.getIdToken(true);
            if (!current()) return;
          }
          await acceptMembershipInvitation(user, item.id, item.version, intent);
          if (current()) {
            status.textContent = hostText("Team invitation accepted.");
            await onAccepted(item.clientId);
          }
        } catch (error) {
          if (current()) status.textContent = failure(error);
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
      const more = node("button", hostText("Load more team invitations"), {
        type: "button",
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
    status.textContent = rows.children.length
      ? hostText("Team invitations loaded.")
      : hostText("No pending team invitations.");
  }
  try {
    await read();
  } catch (error) {
    if (current()) status.textContent = failure(error);
  }
}

export async function renderOwnerMembershipInvitations({
  container,
  user,
  organization,
  isCurrent,
}) {
  if (organization.membership.role !== "owner") return;
  const section = node("section", undefined, {
      "aria-label": "Invite team members",
    }),
    status = node("p", hostText("Loading invitations…"), { role: "status" }),
    rows = node("div"),
    form = node("form");
  const email = field(form, "Invite verified email", "email", "", "email"),
    role = field(
      form,
      "Invitation role",
      "role",
      "staff",
      "text",
      ["staff", "viewer", "admin", "owner"].map((value) => [
        value,
        hostText(value),
      ]),
    );
  const submit = node("button", hostText("Create team invitation"), {
    type: "submit",
  });
  form.append(submit);
  section.append(
    node("h3", hostText("Invite team members")),
    node(
      "p",
      hostText(
        "The recipient can sign in later and accept. Portal approval remains separate. No email is sent automatically.",
      ),
    ),
    form,
    status,
    rows,
  );
  container.append(section);
  const current = () => isCurrent() && section.isConnected,
    root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/member-invitations`,
    attempts = new Map();
  let busy = false;
  const key = (signature) => {
    if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
    return attempts.get(signature);
  };
  async function read(cursor, append = false) {
    const result = await portalRequest(
      user,
      `${root}?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    if (!append) rows.replaceChildren();
    for (const item of result.items) {
      const row = node("article", undefined, { "data-invitation-id": item.id });
      row.append(
        node(
          "p",
          `${item.email} · ${item.role} · ${item.status === "pending" && item.expired ? "expired" : item.status}`,
        ),
      );
      if (item.status === "pending") {
        const cancel = node("button", hostText("Cancel team invitation"), {
          type: "button",
        });
        cancel.addEventListener("click", async () => {
          if (busy || !current()) return;
          busy = true;
          cancel.disabled = true;
          const signature = `cancel:${item.id}:${item.version}`;
          try {
            await portalRequest(
              user,
              `${root}/${encodeURIComponent(item.id)}/cancel`,
              "POST",
              { version: item.version },
              key(signature),
            );
            attempts.delete(signature);
            if (current()) {
              await read();
              status.textContent = hostText("Team invitation cancelled.");
            }
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
    status.textContent = hostText("Owner invitations loaded.");
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
      await portalRequest(user, root, "POST", body, key(signature));
      attempts.delete(signature);
      if (current()) {
        await read();
        status.textContent = hostText(
          "Team invitation created. The approved recipient can accept after signing in.",
        );
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
