import { portalRequest } from "./api/index.js";
import { field, node } from "./host-ui.js";
export async function renderHostAutomation({
  container,
  user,
  organization,
  properties,
  isCurrent,
  includePolicy = true,
  includeJobs = true,
}) {
  const manager = ["owner", "admin"].includes(organization.membership.role);
  if (!manager && organization.membership.role !== "staff") return;
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/automation`;
  const section = node("section", undefined, {
      "aria-label": "Automatic guest access",
    }),
    status = node("p", "Loading automatic access jobs…", {
      role: "status",
      "aria-live": "polite",
    }),
    jobs = node("div");
  section.append(
    node("h2", "Automatic guest access"),
    node(
      "p",
      "Automation requires an enabled property policy and a live administrator delegation for every gate. An imported offline pass remains valid until its effective expiry after cancellation.",
    ),
    status,
  );
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
    } catch {
      if (current())
        status.textContent =
          "Automatic access operation failed. Reload current settings and verify permissions before retrying.";
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  async function mutate(path, method, body) {
    const signature = `${method}:${path}:${JSON.stringify(body)}`;
    if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
    return portalRequest(user, path, method, body, attempts.get(signature));
  }
  if (includePolicy && manager && properties.length) {
    const form = node("form"),
      property = field(
        form,
        "Automation property",
        "propertyId",
        "",
        "text",
        properties.map((entry) => [entry.id, entry.name]),
      );
    const enabledLabel = node("label", "Enable automatic access"),
      enabled = node("input", undefined, { type: "checkbox", name: "enabled" });
    enabledLabel.prepend(enabled);
    form.append(enabledLabel);
    const early = field(
        form,
        "Early access minutes",
        "earlyAccessMinutes",
        "0",
        "number",
      ),
      late = field(
        form,
        "Late expiry minutes",
        "lateExpiryMinutes",
        "0",
        "number",
      );
    for (const input of [early, late]) {
      input.min = "0";
      input.max = "10080";
      input.step = "1";
    }
    const channel = field(
      form,
      "Automatic delivery channel",
      "channel",
      "none",
      "text",
      [
        ["none", "Generate only"],
        ["partner-webhook", "Configured partner delivery"],
      ],
    );
    const destination = field(form, "Delivery destination ID", "destinationId");
    destination.maxLength = 100;
    destination.pattern = "[A-Za-z0-9_-]+";
    const template = field(
      form,
      "Guest message template ID (optional)",
      "guestTemplateId",
    );
    template.required = false;
    template.maxLength = 100;
    template.pattern = "[A-Za-z0-9_-]+";
    const syncChannel = () => {
      destination.required = channel.value === "partner-webhook";
      destination.disabled = !destination.required;
      template.disabled = !destination.required;
    };
    channel.addEventListener("change", syncChannel);
    syncChannel();
    let version = 0,
      loadedProperty;
    const load = node("button", "Load automation policy", { type: "button" }),
      save = node("button", "Save automation policy", {
        type: "submit",
        disabled: "",
      });
    form.append(load, save);
    section.append(form);
    property.addEventListener("change", () => {
      loadedProperty = undefined;
      save.disabled = true;
    });
    load.addEventListener("click", () =>
      run(load, async () => {
        const id = property.value,
          response = await portalRequest(
            user,
            `${root}/properties/${encodeURIComponent(id)}/policy`,
          );
        if (!current() || property.value !== id) return;
        const policy = response.policy;
        loadedProperty = id;
        version = policy.version;
        enabled.checked = policy.enabled;
        early.value = String(policy.earlyAccessMinutes);
        late.value = String(policy.lateExpiryMinutes);
        channel.value = policy.channel;
        destination.value = policy.destinationId ?? "";
        template.value = policy.guestTemplateId ?? "";
        syncChannel();
        save.disabled = false;
        status.textContent = "Automation policy loaded.";
      }),
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity() || loadedProperty !== property.value) return;
      void run(save, async () => {
        const id = property.value,
          body = {
            enabled: enabled.checked,
            earlyAccessMinutes: Number(early.value),
            lateExpiryMinutes: Number(late.value),
            channel: channel.value,
            ...(channel.value === "partner-webhook"
              ? {
                  destinationId: destination.value,
                  ...(template.value.trim()
                    ? { guestTemplateId: template.value.trim() }
                    : {}),
                }
              : {}),
            ...(version ? { version } : {}),
          };
        const response = await mutate(
          `${root}/properties/${encodeURIComponent(id)}/policy`,
          "PUT",
          body,
        );
        if (!current() || property.value !== id) return;
        version = response.policy.version;
        status.textContent =
          "Automation policy saved. Review paused jobs before retrying them.";
      });
    });
  }
  async function loadJobs(cursor, append = false) {
    const response = await portalRequest(
      user,
      `${root}/jobs?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`,
    );
    if (!current()) return;
    if (!append) jobs.replaceChildren();
    for (const job of response.items) {
      const row = node("article");
      row.append(
        node(
          "p",
          `${job.reservationId} · revision ${job.reservationVersion} · ${job.status} · attempts ${job.attempts}`,
        ),
      );
      if (job.lastErrorCode) row.append(node("p", job.lastErrorCode));
      if (job.deliveryId)
        row.append(node("p", `Delivery receipt: ${job.deliveryId}`));
      if (!["delivered", "expired", "cancelled"].includes(job.status)) {
        const form = node("form"),
          reason = field(form, "Automatic access stop reason", "reason");
        reason.minLength = 5;
        reason.maxLength = 200;
        const stop = node("button", "Stop automatic access", {
          type: "submit",
        });
        form.append(stop);
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          void run(stop, async () => {
            await mutate(
              `${root}/jobs/${encodeURIComponent(job.id)}/stop`,
              "POST",
              { reason: reason.value },
            );
            if (current()) {
              await loadJobs();
              status.textContent =
                "Automatic access stopped. An already imported offline pass remains valid until its expiry.";
            }
          });
        });
        row.append(form);
      }
      if (["failed", "paused"].includes(job.status)) {
        const form = node("form"),
          reason = field(form, "Automatic access retry reason", "reason");
        reason.minLength = 5;
        reason.maxLength = 200;
        const retry = node("button", "Retry automatic access", {
          type: "submit",
        });
        form.append(retry);
        form.addEventListener("submit", (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          void run(retry, async () => {
            await mutate(
              `${root}/jobs/${encodeURIComponent(job.id)}/retry`,
              "POST",
              { reason: reason.value },
            );
            if (current()) {
              status.textContent =
                "Automatic access job queued for a verified retry.";
              await loadJobs();
            }
          });
        });
        row.append(form);
      }
      jobs.append(row);
    }
    if (response.nextCursor) {
      const more = node("button", "Load more automatic access jobs", {
        type: "button",
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
      ? "Automatic access jobs loaded."
      : "No automatic access jobs yet.";
  }
  if (!includeJobs) {
    status.textContent =
      "Load a property policy to review or change automation.";
    return;
  }
  const refresh = node("button", "Refresh automatic access jobs", {
    type: "button",
  });
  refresh.addEventListener("click", () => run(refresh, () => loadJobs()));
  section.append(refresh, jobs);
  await loadJobs();
}
