import { hostText, hostLocale } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { field, node, infoTip, hostDateTime } from "./host-ui.js";
import { requestWithRecentIdentity } from "./host-recent-identity.js";
import { can } from "./host-permissions.js";
const messages = {
  RECENT_AUTH_REQUIRED: hostText(
    "Sign out and sign in again with your authenticator before using support access.",
  ),
  TOTP_REQUIRED: hostText(
    "Verify your authenticator before using support access.",
  ),
  SUPPORT_ACCESS_DENIED: hostText(
    "This support approval is unavailable, expired or revoked.",
  ),
  SUPPORT_RECIPIENT_UNAVAILABLE: hostText(
    "The support administrator must have active portal approval and an authenticator.",
  ),
  VERSION_CONFLICT: hostText(
    "The support approval changed. Refresh before retrying.",
  ),
  SUPPORT_CAPACITY_EXCEEDED: hostText(
    "This organization needs an operator capacity review before loading diagnostics.",
  ),
};
// What a support approval is for, in the words of the problem it solves.
const purposes = {
  access: "Someone can't get in",
  delivery: "Guest links don't arrive",
  synchronization: "Bookings don't come through",
  capacity: "Limits and usage",
};
// A title whose ⓘ explains it, in place of a hint paragraph.
function heading(title, tip) {
  const element = node("div", undefined, { class: "view-heading" });
  element.append(node("h2", hostText(title)), infoTip(hostText(tip)));
  return element;
}

export function renderSupportDiagnostics({
  container,
  user,
  identity,
  isCurrent,
}) {
  if (identity.role !== "admin") return;
  const section = node("section", undefined, {
      "aria-label": "Approved support diagnostics",
    }),
    form = node("form"),
    org = field(form, "Support organization ID", "orgId"),
    grant = field(form, "Support approval ID", "grantId"),
    load = node("button", hostText("Read approved support diagnostics"), {
      type: "submit",
    }),
    output = node("div", undefined, { "aria-live": "polite" });
  org.pattern = grant.pattern = "[A-Za-z0-9_-]{1,100}";
  form.append(load);
  section.append(
    heading(
      "Approved support diagnostics",
      "Read anonymous queue-state counts using an owner's temporary approval. This does not add membership or grant access to guest records, keys or system changes.",
    ),
    form,
    output,
  );
  container.append(section);
  let busy = false;
  const current = () => isCurrent() && section.isConnected;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (busy || !current() || !form.reportValidity()) return;
    busy = true;
    load.disabled = true;
    output.replaceChildren();
    void portalRequest(
      user,
      `/api/v1/organizations/${encodeURIComponent(org.value)}/support/grants/${encodeURIComponent(grant.value)}/diagnostics`,
    )
      .then((result) => {
        if (!current()) return;
        output.append(
          node(
            "p",
            hostText("Support approval expires: {p0}", {
              p0: hostDateTime(result.diagnostics.expiresAt),
            }),
          ),
        );
        for (const [source, values] of Object.entries(
          result.diagnostics.sources,
        ))
          output.append(
            node(
              "p",
              hostText("{p0} · records {p1} · {p2}", {
                p0: source,
                p1: values.records,
                p2:
                  Object.entries(values.statuses)
                    .map(([status, count]) => `${status}: ${count}`)
                    .join(" · ") || hostText("No queued work"),
              }),
            ),
          );
      })
      .catch((error) => {
        if (current())
          output.append(
            node(
              "p",
              messages[error.code] ||
                hostText("Support diagnostics could not be loaded."),
            ),
          );
      })
      .finally(() => {
        busy = false;
        if (current()) load.disabled = false;
      });
  });
}
export async function renderSupportOwner({
  container,
  user,
  organization,
  isCurrent,
}) {
  // Support access: the owner (organization:write).
  if (!can(organization, "organization:write")) return;
  const section = node("section", undefined, {
      "aria-label": "Temporary support access",
    }),
    status = node("p", undefined, { role: "status", "aria-live": "polite" }),
    rows = node("div"),
    form = node("form"),
    email = field(form, "Support administrator email", "email", "", "email"),
    duration = field(
      form,
      "Support duration",
      "durationMinutes",
      "15",
      "text",
      [
        ["5", hostText("5 minutes")],
        ["15", hostText("15 minutes")],
        ["30", hostText("30 minutes")],
        ["60", hostText("1 hour")],
      ],
    ),
    purpose = field(
      form,
      "Support purpose",
      "purpose",
      "delivery",
      "text",
      Object.entries(purposes).map(([id, label]) => [id, hostText(label)]),
    ),
    create = node("button", hostText("Approve temporary support"), {
      type: "submit",
    }),
    refresh = node("button", hostText("Refresh support approvals"), {
      type: "button",
      class: "button-secondary",
    });
  form.append(create);
  rows.className = "support-approvals";
  section.append(
    heading(
      "Temporary support access",
      "An approved administrator with an authenticator can view anonymous operational counts for the selected time. The approval expires automatically and can be revoked immediately.",
    ),
    form,
    status,
    rows,
    refresh,
  );
  container.append(section);
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/support/grants`,
    keys = new Map();
  const current = () => isCurrent() && section.isConnected;
  let busy = false;
  async function run(button, operation) {
    if (busy || !current()) return;
    busy = true;
    button.disabled = true;
    try {
      await operation();
    } catch (error) {
      if (current())
        status.textContent =
          messages[error.code] ||
          hostText("Support access could not be changed.");
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  const write = (path, body) => {
    const signature = JSON.stringify([path, body]);
    if (!keys.has(signature)) keys.set(signature, crypto.randomUUID());
    return requestWithRecentIdentity({
      user,
      path: root + path,
      body,
      intent: keys.get(signature),
      isCurrent: current,
      onVerifying: () => {
        status.textContent = hostText(
          "Confirm your identity with your authenticator…",
        );
      },
    });
  };
  async function load(cursor, append = false) {
    const result = await portalRequest(
      user,
      `${root}?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    if (!append) rows.replaceChildren();
    for (const item of result.items) {
      const row = node("article", undefined, { class: "support-approval" });
      // The ids are what WIFIGATE support types in; they stay folded away.
      const ids = node("details", undefined, { class: "connect-developer" });
      ids.append(
        node("summary", hostText("For WIFIGATE support")),
        node("p", hostText("Support approval ID: {p0}", { p0: item.id }), {
          dir: "auto",
        }),
        node(
          "p",
          hostText("Support organization ID: {p0}", { p0: organization.id }),
          { dir: "auto" },
        ),
      );
      row.append(
        node(
          "p",
          hostText("{p0} · {p1} · expires {p2}", {
            p0: hostText(purposes[item.purpose] ?? "Unavailable"),
            p1: hostText(item.status),
            p2: hostDateTime(item.endsAt),
          }),
        ),
        ids,
      );
      if (item.status === "active") {
        const revoke = node("button", hostText("Revoke support approval"), {
          type: "button",
          class: "button-danger",
        });
        revoke.addEventListener("click", () =>
          run(revoke, async () => {
            await write(`/${encodeURIComponent(item.id)}/revoke`, {
              version: item.version,
            });
            await load();
          }),
        );
        row.append(revoke);
      }
      rows.append(row);
    }
    if (!result.items.length)
      rows.append(
        node("p", hostText("No support access is open."), {
          class: "connect-empty",
        }),
      );
    if (result.nextCursor) {
      const more = node("button", hostText("Load more support approvals"), {
        type: "button",
        class: "button-secondary",
      });
      more.addEventListener("click", () =>
        run(more, async () => {
          await load(result.nextCursor, true);
          if (current()) more.remove();
        }),
      );
      rows.append(more);
    }
  }
  refresh.addEventListener("click", () => run(refresh, () => load()));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    void run(create, async () => {
      const body = {
        email: email.value.trim(),
        durationMinutes: Number(duration.value),
        purpose: purpose.value,
      };
      await write("", body);
      await load();
      if (current()) {
        status.textContent = "";
        keys.delete(JSON.stringify(["", body]));
      }
    });
  });
  await run(refresh, () => load());
}
