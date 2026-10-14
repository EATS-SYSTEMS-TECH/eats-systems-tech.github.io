import { hostText } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { field, node, hostDateTime, infoTip } from "./host-ui.js";
import { requestWithRecentIdentity } from "./host-recent-identity.js";
import { can, ownerOnly } from "./host-permissions.js";

// Connect → Your own software (API keys). Owners and admins (integrations:write) see the keys;
// only the owner creates, rotates, revokes and reveals them. Keys, their
// operations and the actions on them are for a developer: they sit in the
// collapsed "For your developer" part of the card.

const errors = {
  RECENT_REAUTH_REQUIRED: hostText(
    "Sign out and sign in again with your authenticator before revealing this key.",
  ),
  OWNER_REQUIRED: hostText("Only the organization owner can manage API keys."),
  TOTP_REQUIRED: hostText(
    "Verify your authenticator before managing API keys.",
  ),
  VERSION_CONFLICT: hostText(
    "The key changed. Refresh the list before retrying.",
  ),
  KEY_INACTIVE: hostText("This key is inactive and cannot be revealed."),
};
export async function renderHostApiKeys({
  container,
  user,
  organization,
  isCurrent,
}) {
  if (!can(organization, "integrations:write")) return;
  const manage = ownerOnly(organization);
  const section = node("section", undefined, {
    "aria-label": "Your own software",
    class: "connect-card",
  });
  const status = node("p", hostText("Loading…"), {
    role: "status",
    "aria-live": "polite",
  });
  const list = node("div"),
    privateOutput = node("div");
  const form = node("form");
  const name = field(form, "API key name", "name");
  const scopeOptions = [
    ["guest-invitations:create", "Create guest invitations"],
    ["reservations:write", "Update reservations"],
    ["webhooks:receive", "Receive provider webhooks"],
  ];
  const scopes = node("fieldset"),
    types = node("fieldset");
  scopes.append(node("legend", hostText("Allowed API operations")));
  types.append(node("legend", hostText("Allowed target types")));
  for (const [value, label] of scopeOptions) {
    const wrapper = node("label", hostText(label)),
      checkbox = node("input", undefined, {
        type: "checkbox",
        name: "scope",
        value,
      });
    checkbox.checked = value === "guest-invitations:create";
    wrapper.prepend(checkbox);
    scopes.append(wrapper);
  }
  const targetLabels = {
    gate: "Gate",
    "dual-control": "Dual Control",
    group: "Group",
  };
  for (const [value, label] of Object.entries(targetLabels)) {
    const wrapper = node("label", hostText(label)),
      checkbox = node("input", undefined, {
        type: "checkbox",
        name: "targetType",
        value,
      });
    checkbox.checked = value === "gate";
    wrapper.prepend(checkbox);
    types.append(wrapper);
  }
  const create = node("button", hostText("Create API key"), { type: "submit" });
  form.append(scopes, types, create);
  const heading = node("div", undefined, { class: "view-heading" });
  heading.append(
    node("h2", hostText("Your own software")),
    infoTip(
      hostText(
        manage
          ? "Your developer connects your website or software to WIFIGATE with a key. Make a separate key for each connection and share it privately."
          : "Your developer connects your website or software to WIFIGATE with a key. Only the owner can create, change or show keys.",
      ),
    ),
  );
  const developer = node("details", undefined, {
    class: "connect-developer connect-keys",
  });
  developer.append(
    node("summary", hostText("For your developer")),
    ...(manage ? [form] : []),
    privateOutput,
    list,
  );
  section.append(heading, status, developer);
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const listeners = new AbortController();
  window.addEventListener(
    "host:workspace-navigate",
    (event) => {
      if (event.detail !== "connect") privateOutput.replaceChildren();
    },
    { signal: listeners.signal },
  );
  window.addEventListener(
    "host:workspace-dispose",
    () => {
      privateOutput.replaceChildren();
      listeners.abort();
    },
    { once: true, signal: listeners.signal },
  );
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/api-keys`;
  const write = (path, body, intent) =>
    requestWithRecentIdentity({
      user,
      path,
      body,
      intent,
      isCurrent: current,
      onVerifying: () => {
        status.textContent = hostText(
          "Confirm your identity with your authenticator…",
        );
      },
    });
  let busy = false,
    attempt;
  const actionKeys = new Map();
  async function perform(button, operation) {
    if (busy || !current()) return;
    busy = true;
    button.disabled = true;
    privateOutput.replaceChildren();
    try {
      await operation();
    } catch (error) {
      if (current())
        status.textContent =
          errors[error.code] ||
          hostText("API key operation failed. Retry safely.");
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  async function action(record, action, input) {
    const token = `${record.id}:${record.version}:${action}:${JSON.stringify(input)}`;
    if (!actionKeys.has(token)) actionKeys.set(token, crypto.randomUUID());
    return write(
      `${root}/${encodeURIComponent(record.id)}/${action}`,
      input,
      actionKeys.get(token),
    );
  }
  async function load(cursor, append = false) {
    const response = await portalRequest(
      user,
      `${root}?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    if (!append) list.replaceChildren();
    for (const record of response.items) {
      const row = node("article", undefined, { class: "connect-key" });
      row.append(
        node("h3", record.name),
        node("p", `${record.prefix} · ${hostText(record.status)}`),
        node(
          "p",
          hostText("Operations: {p0} · Targets: {p1}", {
            p0: record.scopes
              .map((scope) =>
                hostText(
                  scopeOptions.find(([value]) => value === scope)?.[1] ??
                    "Unavailable",
                ),
              )
              .join(", "),
            p1: record.targetTypes
              .map((type) => hostText(targetLabels[type] ?? "Unavailable"))
              .join(", "),
          }),
        ),
      );
      if (record.overlapUntil)
        row.append(
          node(
            "p",
            hostText("Previous key expires: {p0}", {
              p0: hostDateTime(record.overlapUntil),
            }),
          ),
        );
      if (record.status === "active" && manage) {
        // Reveal, rotate and revoke belong to the owner.
        {
          const reveal = node("button", hostText("Reveal private API key"), {
            type: "button",
            class: "button-secondary",
          });
          reveal.addEventListener("click", () =>
            perform(reveal, async () => {
              const result = await action(record, "reveal", {});
              // Shown only while Connect is still on screen.
              if (
                !current() ||
                (document.body.dataset.hostViewId &&
                  document.body.dataset.hostViewId !== "connect")
              )
                return;
              const box = node("textarea", result.value, {
                readonly: "",
                "aria-label": "Private API key",
                rows: "3",
              });
              const hide = node("button", hostText("Hide API key"), {
                type: "button",
                class: "button-secondary",
              });
              hide.addEventListener("click", () =>
                privateOutput.replaceChildren(),
              );
              privateOutput.replaceChildren(
                node(
                  "p",
                  hostText("Copy this key privately to your integration."),
                ),
                box,
                hide,
              );
              status.textContent = "";
            }),
          );
          row.append(reveal);
        }
        if (!record.rotatedTo) {
          const rotation = node("form"),
            overlap = field(
              rotation,
              "Key overlap in hours",
              "overlapHours",
              "0",
              "number",
            );
          overlap.min = "0";
          overlap.max = "24";
          overlap.step = "1";
          const rotate = node("button", hostText("Rotate API key"), {
            type: "submit",
            class: "button-secondary",
          });
          rotation.append(
            rotate,
            infoTip(
              hostText(
                "A new key replaces this one. With 0 hours the old key stops at once; otherwise it keeps working for those hours. Update your integration with the new key.",
              ),
            ),
          );
          rotation.addEventListener("submit", (event) => {
            event.preventDefault();
            void perform(rotate, async () => {
              const overlapHours = Number(overlap.value);
              await action(record, "rotate", {
                version: record.version,
                overlapHours,
              });
              if (!current()) return;
              await load();
            });
          });
          row.append(rotation);
        }
        const revoke = node("button", hostText("Revoke API key"), {
          type: "button",
          class: "button-danger",
        });
        revoke.addEventListener("click", () =>
          perform(revoke, async () => {
            await action(record, "revoke", { version: record.version });
            if (!current()) return;
            await load();
          }),
        );
        row.append(
          revoke,
          infoTip(hostText("Requests that use a revoked key are refused.")),
        );
      }
      list.append(row);
    }
    status.textContent = response.items.length ? "" : hostText("No keys yet.");
    if (response.nextCursor) {
      const more = node("button", hostText("Load more API keys"), {
        type: "button",
        class: "button-secondary",
      });
      more.addEventListener("click", () =>
        perform(more, async () => {
          await load(response.nextCursor, true);
          if (current()) more.remove();
        }),
      );
      list.append(more);
    }
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void perform(create, async () => {
      const input = {
        name: name.value.trim(),
        scopes: [...form.querySelectorAll('input[name="scope"]:checked')].map(
          (item) => item.value,
        ),
        targetTypes: [
          ...form.querySelectorAll('input[name="targetType"]:checked'),
        ].map((item) => item.value),
      };
      if (!input.scopes.length || !input.targetTypes.length) {
        status.textContent = hostText(
          "Select at least one operation and target type.",
        );
        return;
      }
      const signature = JSON.stringify(input);
      if (attempt?.signature !== signature)
        attempt = { signature, key: crypto.randomUUID() };
      await write(root, input, attempt.key);
      if (!current()) return;
      attempt = undefined;
      name.value = "";
      await load();
      status.textContent = "";
    });
  });
  try {
    await load();
  } catch {
    if (current())
      status.textContent = hostText(
        "API keys could not be loaded. Refresh your organization to retry.",
      );
  }
}
