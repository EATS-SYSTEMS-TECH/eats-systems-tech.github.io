import { hostText, hostLocale } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { field, node, hostDateTime } from "./host-ui.js";
import { requestWithRecentIdentity } from "./host-recent-identity.js";

const errors = {
  RECENT_REAUTH_REQUIRED: hostText(
    "Sign out and sign in again with your authenticator before revealing this key.",
  ),
  OWNER_REQUIRED: hostText("Only an organization owner can reveal a key."),
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
  if (!["owner", "admin"].includes(organization.membership.role)) return;
  const section = node("section", undefined, {
    "aria-label": "API integrations",
  });
  const status = node("p", hostText("Loading API keys…"), {
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
  section.append(
    node("h2", hostText("API integrations")),
    node(
      "p",
      hostText(
        "Create a separate key for each integration and limit its operations and target types. An owner can reveal a key after a recent sign-in with an authenticator. Share keys privately.",
      ),
    ),
    form,
    status,
    privateOutput,
    list,
  );
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const listeners = new AbortController();
  window.addEventListener(
    "host:workspace-navigate",
    (event) => {
      if (event.detail !== "integrations") privateOutput.replaceChildren();
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
      const row = node("article");
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
      if (record.status === "active") {
        if (organization.membership.role === "owner") {
          const reveal = node("button", hostText("Reveal private API key"), {
            type: "button",
          });
          reveal.addEventListener("click", () =>
            perform(reveal, async () => {
              const result = await action(record, "reveal", {});
              if (
                !current() ||
                (document.body.dataset.hostView &&
                  document.body.dataset.hostView !== "Integrations")
              )
                return;
              const box = node("textarea", result.value, {
                readonly: "",
                "aria-label": "Private API key",
                rows: "3",
              });
              const hide = node("button", hostText("Hide API key"), {
                type: "button",
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
              status.textContent = hostText(
                "Private key revealed. Hide it after copying.",
              );
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
          });
          rotation.append(rotate);
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
              status.textContent = hostText(
                overlapHours === 0
                  ? "New key created. The previous key is revoked immediately. Update the integration with the new key."
                  : "New key created. Reveal it and update the integration before the previous key expires.",
              );
            });
          });
          row.append(rotation);
        }
        const revoke = node("button", hostText("Revoke API key"), {
          type: "button",
        });
        revoke.addEventListener("click", () =>
          perform(revoke, async () => {
            await action(record, "revoke", { version: record.version });
            if (!current()) return;
            await load();
            status.textContent = hostText(
              "Key revoked. Requests using it are rejected.",
            );
          }),
        );
        row.append(revoke);
      }
      list.append(row);
    }
    status.textContent = response.items.length
      ? hostText("API keys loaded.")
      : hostText("No API keys created.");
    if (response.nextCursor) {
      const more = node("button", hostText("Load more API keys"), {
        type: "button",
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
      status.textContent = hostText(
        "API key created. An owner can reveal it privately.",
      );
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
