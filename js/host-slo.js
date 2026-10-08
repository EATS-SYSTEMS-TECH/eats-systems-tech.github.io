import { portalRequest } from "./api/index.js";
import { field, node } from "./host-ui.js";

export function renderServiceTargets({
  section,
  user,
  root,
  current,
  run,
  status,
  owner,
  onSaved = () => {},
}) {
  const panel = node("section", undefined, {
    "aria-label": "Internal service targets",
  });
  const summary = node("p", "Load the current service target policy."),
    load = node("button", "Load service targets", { type: "button" });
  panel.append(
    node("h3", "Internal service targets"),
    node(
      "p",
      "Owner-approved internal thresholds. Missing evidence stays unknown. These settings do not publish a commercial SLA.",
    ),
    load,
    summary,
  );
  section.append(panel);
  let policy,
    loaded = false;
  const form = node("form"),
    enabled = node("input", undefined, {
      type: "checkbox",
      "aria-label": "Enable service targets",
    }),
    toggle = node("label", "Enable service targets");
  toggle.append(enabled);
  form.append(toggle);
  const responsible = field(
    form,
    "Responsible operations UID",
    "responsibleUid",
    user.uid,
  );
  responsible.maxLength = 128;
  const descriptors = [
    ["minimumSamples", "Minimum observed samples", 10, 1, 5000],
    ["apiAvailabilityPercent", "API availability target percent", 99, 90, 100],
    ["apiP95LatencyMs", "API p95 target milliseconds", 1000, 1, 86400000],
    [
      "automationReadinessPercent",
      "Preparation success target percent",
      99,
      90,
      100,
    ],
    [
      "automationP95PreparationMs",
      "Preparation p95 target milliseconds",
      60000,
      1,
      86400000,
    ],
    [
      "automationMaxPendingAgeMs",
      "Pending schedule maximum milliseconds",
      300000,
      1,
      86400000,
    ],
    [
      "deliveryAcceptancePercent",
      "Provider acceptance target percent",
      99,
      90,
      100,
    ],
    [
      "deliveryP95AcceptanceMs",
      "Provider acceptance p95 target milliseconds",
      120000,
      1,
      86400000,
    ],
  ];
  const controls = Object.fromEntries(
    descriptors.map(([name, label, value, min, max]) => {
      const input = field(form, label, name, String(value), "number");
      input.min = String(min);
      input.max = String(max);
      input.step = name.endsWith("Percent") ? "any" : "1";
      return [name, input];
    }),
  );
  const save = node("button", "Save service targets", {
    type: "submit",
    disabled: "",
  });
  form.append(save);
  if (owner) panel.append(form);
  function display(value) {
    policy = value.policy;
    loaded = true;
    summary.textContent = policy
      ? `Targets ${policy.enabled ? "enabled" : "disabled"} · revision ${policy.version} · responsible member ${value.ownerActive === false ? "unavailable" : "active"}`
      : "No service targets configured.";
    enabled.checked = policy?.enabled ?? false;
    responsible.value = policy?.responsibleUid ?? user.uid;
    for (const [name, input] of Object.entries(controls))
      if (policy) input.value = String(policy[name]);
    save.disabled = false;
  }
  load.addEventListener("click", () =>
    run(load, async () => {
      const value = await portalRequest(user, `${root}/operations/slo-policy`);
      if (current()) {
        display(value);
        status.textContent = "Service targets loaded.";
      }
    }),
  );
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!owner || !loaded || !form.reportValidity()) return;
    const body = {
      enabled: enabled.checked,
      responsibleUid: responsible.value,
      ...Object.fromEntries(
        Object.entries(controls).map(([name, input]) => [
          name,
          Number(input.value),
        ]),
      ),
      ...(policy ? { version: policy.version } : {}),
    };
    const signature = JSON.stringify(body);
    if (form.dataset.intentBody !== signature) {
      form.dataset.intentBody = signature;
      form.dataset.intentKey = crypto.randomUUID();
    }
    void run(save, async () => {
      const inputs = [enabled, responsible, ...Object.values(controls), load];
      inputs.forEach((input) => {
        input.disabled = true;
      });
      try {
        const value = await portalRequest(
          user,
          `${root}/operations/slo-policy`,
          "PUT",
          body,
          form.dataset.intentKey,
        );
        if (current()) {
          display(value);
          delete form.dataset.intentBody;
          delete form.dataset.intentKey;
          status.textContent = "Service targets saved and audited.";
          onSaved();
        }
      } finally {
        if (current())
          inputs.forEach((input) => {
            input.disabled = false;
          });
      }
    });
  });
}
