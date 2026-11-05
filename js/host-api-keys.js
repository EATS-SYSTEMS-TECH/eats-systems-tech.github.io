import { hostText, hostLocale } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { field, node, hostDateTime } from "./host-ui.js";
import { requestWithRecentIdentity } from "./host-recent-identity.js";
import { can, ownerOnly } from "./host-permissions.js";
import { renderApiExamples } from "./host-api-examples.js";

const errors = {
  RECENT_REAUTH_REQUIRED:
    "Sign out and sign in again with your authenticator before revealing this key.",
  API_KEY_CREATOR_REQUIRED:
    "Only the creator can reveal or rotate this key. The owner can revoke it.",
  API_KEY_MANAGER_REQUIRED: "An owner or administrator can create API keys.",
  API_KEY_PAYMENT_CONSENT_REQUIRED:
    "Five keys are included. Confirm the additional $1 per month estimate before adding another key.",
  TOTP_REQUIRED: "Verify your authenticator before managing API keys.",
  VERSION_CONFLICT: "The key changed. Refresh the list before retrying.",
  KEY_INACTIVE: "This key is inactive and cannot be revealed.",
};
const scopes = [
  ["guest-invitations:create", "Create guest invitations"],
  ["reservations:read", "Read reservation status"],
  ["reservations:write", "Create and update reservations"],
  ["webhooks:receive", "Receive provider webhooks"],
];
const targetTypes = [
  ["gate", "Gate"],
  ["dual-control", "Dual Control (includes Roller Shutters)"],
  ["group", "Group"],
];
const button = (label, className = "button-secondary") =>
  node("button", hostText(label), { type: "button", class: className });
const money = (cents) =>
  new Intl.NumberFormat(hostLocale, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

export async function renderHostApiKeys({
  container,
  user,
  organization,
  systems = [],
  isCurrent,
}) {
  if (!can(organization, "integrations:write")) return;
  const section = node("section", undefined, {
    "aria-label": "API keys",
    class: "host-api-keys",
  });
  const heading = node("div", undefined, { class: "view-heading" });
  heading.append(node("h2", hostText("API keys")));
  const status = node("p", hostText("Loading…"), {
    role: "status",
    "aria-live": "polite",
  });
  const pricing = node("div", undefined, { class: "host-api-pricing" });
  section.append(
    heading,
    node(
      "p",
      hostText(
        "Connect your booking software to this organization's systems. Each key belongs to the person who created it.",
      ),
    ),
    pricing,
  );
  renderApiExamples(section, systems);

  const creation = node("details", undefined, { class: "host-api-create" });
  creation.append(node("summary", hostText("Create API key")));
  const form = node("form"),
    name = field(form, "API key name", "name");
  name.required = true;
  name.maxLength = 80;
  name.placeholder = hostText("For example: Reception PMS");
  const choices = node("div", undefined, { class: "host-api-permissions" });
  for (const [legend, fieldName, options] of [
    ["Allowed API operations", "scope", scopes],
    ["Allowed target types", "targetType", targetTypes],
  ]) {
    const set = node("fieldset");
    set.append(node("legend", hostText(legend)));
    for (const [value, label] of options) {
      const checkbox = node("input", undefined, {
        type: "checkbox",
        name: fieldName,
        value,
      });
      checkbox.checked =
        fieldName === "scope" ? value !== "webhooks:receive" : value === "gate";
      checkbox.defaultChecked = checkbox.checked;
      const wrapper = node("label", hostText(label));
      wrapper.prepend(checkbox);
      set.append(wrapper);
    }
    choices.append(set);
  }
  form.append(choices);
  const expiry = field(
    form,
    "Expiry (optional)",
    "expiresAt",
    "",
    "datetime-local",
  );
  expiry.required = false;
  const consentLabel = node(
    "label",
    hostText(
      "I confirm an estimated additional $1 per month for this key. No automatic payment is made here.",
    ),
    { class: "host-api-consent", hidden: "" },
  );
  const consent = node("input", undefined, {
    type: "checkbox",
    name: "paidKeyConsent",
  });
  consentLabel.prepend(consent);
  const create = node("button", hostText("Create API key"), { type: "submit" });
  form.append(consentLabel, create);
  creation.append(form);
  const privateOutput = node("div", undefined, {
    class: "host-api-private",
    "aria-live": "polite",
  });
  const toolbar = node("div", undefined, { class: "host-api-toolbar" });
  const filterLabel = node("label", hostText("Keys to show"));
  const ownerFilter = node("select", undefined, {
    "aria-label": "Keys to show",
  });
  ownerFilter.append(
    node("option", hostText("All organization keys"), { value: "all" }),
    node("option", hostText("My keys"), { value: "mine" }),
  );
  filterLabel.append(ownerFilter);
  const revokedLabel = node("label", hostText("Include revoked keys"));
  const revoked = node("input", undefined, { type: "checkbox" });
  revokedLabel.prepend(revoked);
  const refresh = button("Refresh keys");
  toolbar.append(filterLabel, revokedLabel, refresh);
  const list = node("div", undefined, { class: "host-api-list" });
  const usage = node("section", undefined, {
    class: "host-api-usage",
    "aria-label": "API key usage",
    hidden: "",
    tabindex: "-1",
  });
  section.append(creation, privateOutput, toolbar, status, list, usage);
  container.append(section);

  const current = () => isCurrent() && section.isConnected;
  const listeners = new AbortController();
  const hideSecret = () => privateOutput.replaceChildren();
  window.addEventListener(
    "host:workspace-navigate",
    (event) => {
      if (event.detail !== "api-keys") hideSecret();
    },
    { signal: listeners.signal },
  );
  window.addEventListener(
    "host:workspace-dispose",
    () => {
      hideSecret();
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
    attempt,
    loadVersion = 0,
    usageVersion = 0;
  const actionKeys = new Map();
  async function perform(trigger, operation) {
    if (busy || !current()) return;
    busy = true;
    trigger.disabled = true;
    hideSecret();
    try {
      await operation();
    } catch (error) {
      if (current()) {
        if (error.code === "API_KEY_PAYMENT_CONSENT_REQUIRED") {
          await load();
          creation.open = true;
        }
        status.textContent = hostText(
          errors[error.code] ?? "API key operation failed. Retry safely.",
        );
      }
    } finally {
      busy = false;
      if (current()) trigger.disabled = false;
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

  async function showUsage(record) {
    const version = ++usageVersion;
    usage.hidden = false;
    usage.replaceChildren(
      node("h3", record.name),
      node("p", hostText("Loading…")),
    );
    const report = await portalRequest(
      user,
      `${root}/${encodeURIComponent(record.id)}/usage`,
    );
    if (!current() || version !== usageVersion) return;
    const close = button("Close usage");
    close.addEventListener("click", () => {
      usageVersion++;
      usage.hidden = true;
    });
    const title = node("div", undefined, { class: "view-heading" });
    title.append(node("h3", record.name), close);
    const description = node(
      "p",
      hostText("Invitations issued per day · UTC · last 30 days"),
    );
    const totals = node(
      "p",
      hostText("{p0} invitations · {p1} requests · {p2} errors", {
        p0: report.totals.invitations,
        p1: report.totals.requests,
        p2: report.totals.errors,
      }),
    );
    const bars = node("div", undefined, {
      class: "host-api-chart",
      role: "img",
      "aria-label": "Daily invitations",
    });
    const maximum = Math.max(
      1,
      ...report.items.map((item) => item.invitations),
    );
    for (const item of report.items) {
      const bar = node("span", undefined, {
        title: `${item.date}: ${item.invitations}`,
        class: "host-api-bar",
      });
      bar.style.setProperty(
        "--bar-height",
        `${Math.max(item.invitations ? 2 : 0, (item.invitations / maximum) * 100)}%`,
      );
      bars.append(bar);
    }
    const range = node("div", undefined, {
      class: "host-api-chart-range",
      dir: "ltr",
    });
    range.append(node("span", report.from), node("span", report.to));
    const data = node("details");
    data.append(node("summary", hostText("Daily values")));
    const dailyTable = node("table");
    const head = node("tr");
    for (const value of ["Date", "Invitations", "Requests", "Errors"])
      head.append(node("th", hostText(value), { scope: "col" }));
    const thead = node("thead");
    thead.append(head);
    const tbody = node("tbody");
    for (const day of report.items) {
      const row = node("tr");
      for (const value of [day.date, day.invitations, day.requests, day.errors])
        row.append(node("td", String(value)));
      tbody.append(row);
    }
    dailyTable.append(thead, tbody);
    data.append(dailyTable);
    const errors = node("div", undefined, { class: "host-api-errors" });
    errors.append(node("h4", hostText("Errors by code")));
    for (const [code, count] of Object.entries(report.errorsByCode))
      errors.append(node("p", `${code}: ${count}`, { dir: "ltr" }));
    if (!Object.keys(report.errorsByCode).length)
      errors.append(node("p", hostText("No recorded errors in this period.")));
    usage.replaceChildren(
      title,
      description,
      totals,
      bars,
      range,
      data,
      errors,
      node(
        "p",
        hostText("Measured invitations: {p0}. Measurement began: {p1}.", {
          p0: report.measured.invitations,
          p1: report.measured.since
            ? hostDateTime(report.measured.since)
            : hostText("No activity yet"),
        }),
      ),
      ...(!report.measured.lifetimeComplete
        ? [
            node(
              "p",
              hostText(
                "Older activity may be incomplete. Measured totals are not a lifetime total.",
              ),
            ),
          ]
        : []),
    );
    usage.focus({ preventScroll: true });
    usage.scrollIntoView({ behavior: "instant", block: "nearest" });
  }

  function actions(record) {
    const cell = node("td"),
      use = button("Usage");
    use.addEventListener(
      "click",
      () => void perform(use, () => showUsage(record)),
    );
    cell.append(use);
    const manage = record.canManage ?? ownerOnly(organization);
    const canRevoke = record.canRevoke ?? manage;
    if (record.status !== "active" || (!manage && !canRevoke)) return cell;
    const menu = node("details", undefined, { class: "host-api-actions" });
    menu.append(node("summary", hostText("Manage key")));
    const expired =
      (record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) ||
      (record.overlapUntil && Date.parse(record.overlapUntil) <= Date.now());
    if (manage && !expired) {
      const reveal = button("Reveal private API key");
      reveal.addEventListener(
        "click",
        () =>
          void perform(reveal, async () => {
            const result = await action(record, "reveal", {});
            if (
              !current() ||
              (document.body.dataset.hostViewId &&
                document.body.dataset.hostViewId !== "api-keys")
            )
              return;
            const value = node("textarea", result.value, {
              readonly: "",
              rows: "3",
              dir: "ltr",
              "aria-label": "Private API key",
            });
            const hide = button("Hide API key");
            hide.addEventListener("click", hideSecret);
            privateOutput.replaceChildren(
              node(
                "p",
                hostText("Copy this key privately to your integration."),
              ),
              value,
              hide,
            );
            value.focus();
            value.select();
            status.textContent = "";
          }),
      );
      menu.append(reveal);
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
        rotation.append(rotate);
        rotation.addEventListener("submit", (event) => {
          event.preventDefault();
          void perform(rotate, async () => {
            await action(record, "rotate", {
              version: record.version,
              overlapHours: Number(overlap.value),
            });
            if (current()) await load();
          });
        });
        menu.append(
          rotation,
          node(
            "p",
            hostText(
              "Rotation replaces this key and counts as one key, including the overlap period.",
            ),
          ),
        );
      }
    }
    if (canRevoke) {
      const confirm = node("details", undefined, { class: "host-api-revoke" });
      confirm.append(
        node("summary", hostText("Revoke API key")),
        node("p", hostText("Requests that use a revoked key are refused.")),
      );
      const revoke = button("Confirm revocation", "button-danger");
      confirm.append(revoke);
      revoke.addEventListener(
        "click",
        () =>
          void perform(revoke, async () => {
            await action(record, "revoke", { version: record.version });
            if (current()) await load();
          }),
      );
      menu.append(confirm);
    }
    cell.append(menu);
    return cell;
  }

  async function load(cursor, append = false) {
    const version = ++loadVersion;
    const response = await portalRequest(
      user,
      `${root}?${new URLSearchParams({ limit: "50", owner: ownerFilter.value, status: revoked.checked ? "all" : "active", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current() || version !== loadVersion) return;
    const summary = response.summary;
    if (summary) {
      pricing.replaceChildren(
        node(
          "strong",
          hostText("{p0} active keys · 5 included", { p0: summary.activeKeys }),
        ),
        node(
          "span",
          hostText("Additional keys: {p0}/month (estimate)", {
            p0: money(summary.monthlyEstimateCents),
          }),
        ),
      );
      consentLabel.hidden = summary.activeKeys < 5;
      consent.required = !consentLabel.hidden;
    }
    let tbody = list.querySelector("tbody");
    if (!append || !tbody) {
      const scroll = node("div", undefined, {
        class: "host-api-table-scroll",
        tabindex: "0",
        "aria-label": "Organization API keys",
      });
      const table = node("table", undefined, { class: "host-api-table" }),
        thead = node("thead"),
        row = node("tr");
      for (const label of [
        "Key & creator",
        "Status",
        "Today",
        "30 days",
        "Measured",
        "Last used · UTC",
        "Actions",
      ])
        row.append(node("th", hostText(label), { scope: "col" }));
      thead.append(row);
      tbody = node("tbody");
      table.append(thead, tbody);
      scroll.append(table);
      list.replaceChildren(scroll);
    }
    for (const record of response.items) {
      const row = node("tr", undefined, { "data-api-key": record.id });
      const identity = node("td");
      identity.append(
        node("strong", record.name),
        node("code", record.prefix, { dir: "ltr" }),
        node(
          "small",
          record.ownerEmail ??
            (record.ownerUid === user.uid
              ? hostText("You")
              : (record.ownerUid ?? hostText("Legacy key · owner managed"))),
          { dir: "auto" },
        ),
      );
      const info = node("details");
      info.append(
        node("summary", hostText("Permissions")),
        node(
          "p",
          record.scopes
            .map((value) =>
              hostText(scopes.find(([scope]) => scope === value)?.[1] ?? value),
            )
            .join(", "),
        ),
        node(
          "p",
          record.targetTypes
            .map((value) =>
              hostText(
                targetTypes.find(([type]) => type === value)?.[1] ?? value,
              ),
            )
            .join(", "),
        ),
      );
      if (record.expiresAt)
        info.append(
          node(
            "p",
            hostText("Expires: {p0}", { p0: hostDateTime(record.expiresAt) }),
          ),
        );
      if (record.overlapUntil)
        info.append(
          node(
            "p",
            hostText("Previous key expires: {p0}", {
              p0: hostDateTime(record.overlapUntil),
            }),
          ),
        );
      identity.append(info);
      const state =
        record.status === "active" &&
        ((record.expiresAt && Date.parse(record.expiresAt) <= Date.now()) ||
          (record.overlapUntil &&
            Date.parse(record.overlapUntil) <= Date.now()))
          ? "expired"
          : record.status;
      const stateCell = node("td");
      stateCell.append(
        node("span", hostText(state), {
          class: `host-api-state host-api-state--${state}`,
        }),
      );
      row.append(identity, stateCell);
      for (const count of [
        record.invitationsToday,
        record.invitations30Days,
        record.invitationsMeasured,
      ])
        row.append(node("td", String(count ?? 0), { class: "host-api-count" }));
      row.append(
        node(
          "td",
          record.lastUsedAt
            ? hostDateTime(record.lastUsedAt)
            : hostText("No activity yet"),
        ),
        actions(record),
      );
      tbody.append(row);
    }
    status.textContent = response.items.length
      ? hostText(
          "Invitation counts use UTC. Repeated requests do not create additional invitations.",
        )
      : hostText(
          "No keys match this view. Create a key to connect your booking software.",
        );
    list.querySelector("[data-more-keys]")?.remove();
    if (response.nextCursor) {
      const more = button("Load more API keys");
      more.dataset.moreKeys = "true";
      more.addEventListener(
        "click",
        () => void perform(more, () => load(response.nextCursor, true)),
      );
      list.append(more);
    }
  }
  refresh.addEventListener("click", () => void perform(refresh, () => load()));
  ownerFilter.addEventListener(
    "change",
    () => void perform(refresh, () => load()),
  );
  revoked.addEventListener("change", () => void perform(refresh, () => load()));
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
        ...(expiry.value
          ? { expiresAt: new Date(expiry.value).toISOString() }
          : {}),
        ...(!consentLabel.hidden ? { paidKeyConsent: consent.checked } : {}),
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
      form.reset();
      creation.open = false;
      await load();
      status.textContent = hostText(
        "Key created. Use Reveal private API key to copy it securely.",
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
