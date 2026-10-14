import { hostText } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { field, node, infoTip, hostDateTime } from "./host-ui.js";
import { can } from "./host-permissions.js";
import { zoneOf } from "./host-booking-model.js";

// Automatic guest links: one policy for the whole organization
// (GET/PUT …/automation/policy) and, in Activity, the jobs it runs.
const messages = {
  DELIVERY_DESTINATION_UNAVAILABLE:
    "That delivery destination isn't set up. Ask your developer.",
  DELIVERY_TEMPLATE_UNAVAILABLE:
    "That guest message template isn't set up. Ask your developer.",
  VERSION_CONFLICT: "These settings changed. Refresh the page and try again.",
  INVALID_REQUEST: "Check the numbers and the delivery details.",
  TOTP_REQUIRED: "Verify your authenticator first, then try again.",
  SUBSCRIPTION_UNAVAILABLE:
    "Service is unavailable for this organization right now.",
  HOST_API_UNAVAILABLE: "Can't reach WIFIGATE right now. Try again.",
};
export const automationMessage = (error) =>
  hostText(messages[error?.code] ?? "That didn't work. Try again.");
const failure = automationMessage;

const minutesField = (form, label, name, value, tip) => {
  const input = field(form, label, name, String(value ?? 0), "number");
  input.min = "0";
  input.max = "10080";
  input.step = "1";
  input.inputMode = "numeric";
  if (tip) input.parentElement.append(infoTip(hostText(tip)));
  return input;
};

// Connect → Automatic guest links (owner and admin: integrations:write).
export async function renderAutomationPolicy({
  container,
  user,
  organization,
  isCurrent,
}) {
  if (!can(organization, "integrations:write")) return;
  const path = `/api/v1/organizations/${encodeURIComponent(organization.id)}/automation/policy`;
  const section = node("section", undefined, {
    "aria-label": "Automatic guest links",
    class: "connect-card",
  });
  const heading = node("div", undefined, { class: "view-heading" });
  heading.append(
    node("h2", hostText("Automatic guest links")),
    infoTip(
      hostText(
        "When this is on, every confirmed booking gets its guest link without anyone pressing a button.",
      ),
    ),
  );
  const status = node("p", "", { role: "status", "aria-live": "polite" });
  section.append(heading, status);
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  let policy;
  try {
    policy = (await portalRequest(user, path)).policy;
  } catch (error) {
    if (current()) status.textContent = failure(error);
    return;
  }
  if (!current()) return;
  const form = node("form", undefined, { class: "connect-form" });
  const switchLabel = node(
    "label",
    hostText("Create guest links automatically"),
    {
      class: "connect-switch",
    },
  );
  const enabled = node("input", undefined, {
    type: "checkbox",
    name: "enabled",
    role: "switch",
  });
  enabled.checked = Boolean(policy.enabled);
  switchLabel.prepend(enabled);
  form.append(switchLabel);
  const early = minutesField(
    form,
    "Minutes the link works before arrival",
    "earlyAccessMinutes",
    policy.earlyAccessMinutes,
  );
  const late = minutesField(
    form,
    "Minutes the link works after leaving",
    "lateExpiryMinutes",
    policy.lateExpiryMinutes,
  );
  const delivery = node("fieldset", undefined, { class: "choice-list" });
  delivery.append(node("legend", hostText("Sending the link")));
  for (const [value, label] of [
    ["none", "Copy it from the booking"],
    ["partner-webhook", "Send it through your booking system"],
  ]) {
    const choice = node("label", undefined, { class: "choice" });
    const radio = node("input", undefined, {
      type: "radio",
      name: "channel",
      value,
    });
    radio.checked = (policy.channel ?? "none") === value;
    choice.append(
      radio,
      node("span", hostText(label), { class: "choice__name" }),
    );
    delivery.append(choice);
  }
  form.append(delivery);
  // The delivery ids are for a developer.
  const developer = node("details", undefined, {
    class: "connect-developer",
  });
  developer.append(node("summary", hostText("For your developer")));
  const destination = field(
    developer,
    "Delivery destination ID",
    "destinationId",
    policy.destinationId ?? "",
  );
  destination.pattern = "[A-Za-z0-9_-]+";
  destination.maxLength = 100;
  destination.dir = "ltr";
  const template = field(
    developer,
    "Guest message template ID",
    "guestTemplateId",
    policy.guestTemplateId ?? "",
  );
  template.required = false;
  template.pattern = "[A-Za-z0-9_-]+";
  template.maxLength = 100;
  template.dir = "ltr";
  form.append(developer);
  const channel = () =>
    form.querySelector('input[name="channel"]:checked')?.value ?? "none";
  const syncChannel = () => {
    const webhook = channel() === "partner-webhook";
    destination.required = webhook;
    destination.disabled = template.disabled = !webhook;
    if (webhook && !destination.value) developer.open = true;
  };
  delivery.addEventListener("change", syncChannel);
  syncChannel();
  const save = node("button", hostText("Save"), { type: "submit" });
  form.append(save);
  section.append(form);
  let version = policy.version ?? 0;
  let attempt;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (save.disabled || !form.reportValidity()) return;
    const body = {
      enabled: enabled.checked,
      earlyAccessMinutes: Number(early.value),
      lateExpiryMinutes: Number(late.value),
      channel: channel(),
      ...(channel() === "partner-webhook"
        ? {
            destinationId: destination.value.trim(),
            ...(template.value.trim()
              ? { guestTemplateId: template.value.trim() }
              : {}),
          }
        : {}),
      ...(version ? { version } : {}),
    };
    const signature = JSON.stringify(body);
    if (attempt?.signature !== signature)
      attempt = { signature, key: crypto.randomUUID() };
    save.disabled = true;
    status.textContent = "";
    try {
      const result = await portalRequest(user, path, "PUT", body, attempt.key);
      if (!current()) return;
      attempt = undefined;
      version = result?.policy?.version ?? version + 1;
    } catch (error) {
      if (current()) status.textContent = failure(error);
    } finally {
      if (current()) save.disabled = false;
    }
  });
}

// Activity → Automatic links: the automatic guest links waiting, failed or
// paused. Each says where it stands in words; its booking id, attempts and
// error code are for a developer.
export async function renderAutomationJobs({
  container,
  user,
  organization,
  isCurrent,
}) {
  if (!can(organization, "operations:write")) return;
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/automation`;
  const section = node("section", undefined, {
    "aria-label": "Automatic links",
  });
  const status = node("p", hostText("Loading…"), {
    role: "status",
    "aria-live": "polite",
  });
  const jobs = node("div");
  section.append(node("h2", hostText("Automatic links")), status);
  container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const attempts = new Map();
  let busy = false;
  async function run(button, operation) {
    if (busy || !current()) return;
    busy = true;
    button.disabled = true;
    try {
      await operation();
    } catch (error) {
      if (current()) status.textContent = failure(error);
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  async function mutate(path, body) {
    const signature = `${path}:${JSON.stringify(body)}`;
    if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
    return portalRequest(user, path, "POST", body, attempts.get(signature));
  }
  const reasonForm = (job, action, label, buttonLabel, tip) => {
    const form = node("form");
    const reason = field(form, label, "reason");
    reason.minLength = 5;
    reason.maxLength = 200;
    const button = node("button", hostText(buttonLabel), { type: "submit" });
    form.append(button);
    if (tip) form.append(infoTip(hostText(tip)));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      void run(button, async () => {
        await mutate(`${root}/jobs/${encodeURIComponent(job.id)}/${action}`, {
          reason: reason.value,
        });
        if (current()) await loadJobs();
      });
    });
    return form;
  };
  async function loadJobs(cursor, append = false) {
    const response = await portalRequest(
      user,
      `${root}/jobs?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    if (!append) jobs.replaceChildren();
    for (const job of response.items) {
      const row = node("article", undefined, { "data-job-id": job.id });
      const line = node("p");
      line.append(node("strong", hostText(job.status)));
      if (job.availableAt)
        line.append(
          ` · ${hostDateTime(job.availableAt, zoneOf(organization))}`,
        );
      const developer = node("details", undefined, {
        class: "connect-developer",
      });
      developer.append(
        node("summary", hostText("For your developer")),
        node(
          "p",
          [
            job.reservationId,
            Number.isInteger(job.reservationVersion)
              ? `v${job.reservationVersion}`
              : "",
            Number.isInteger(job.attempts) ? `attempts ${job.attempts}` : "",
            job.lastErrorCode,
          ]
            .filter(Boolean)
            .join(" · "),
          { dir: "ltr", class: "connect-code" },
        ),
      );
      row.append(line, developer);
      if (!["delivered", "expired", "cancelled"].includes(job.status))
        row.append(
          reasonForm(
            job,
            "stop",
            "Automatic access stop reason",
            "Stop automatic access",
            "A pass the guest already has in the app keeps working until it ends.",
          ),
        );
      if (["failed", "paused"].includes(job.status))
        row.append(
          reasonForm(
            job,
            "retry",
            "Automatic access retry reason",
            "Retry automatic access",
          ),
        );
      jobs.append(row);
    }
    if (response.nextCursor) {
      const more = node("button", hostText("Show more"), {
        type: "button",
        class: "button-secondary",
      });
      more.addEventListener("click", () =>
        run(more, async () => {
          await loadJobs(response.nextCursor, true);
          if (current()) more.remove();
        }),
      );
      jobs.append(more);
    }
    status.textContent = response.items.length
      ? ""
      : hostText("No automatic links are waiting.");
  }
  const refresh = node("button", hostText("Refresh"), {
    type: "button",
  });
  refresh.addEventListener("click", () => run(refresh, () => loadJobs()));
  section.append(refresh, jobs);
  await loadJobs();
}
