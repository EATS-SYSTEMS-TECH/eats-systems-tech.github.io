import { portalRequest } from "./api/index.js";
import { node } from "./host-ui.js";
import { renderServiceTargets } from "./host-slo.js";

const explanations = {
  unconfigured:
    "No service targets configured. An organization owner must approve targets and assign an operations member.",
  disabled: "Scheduled monitoring is disabled in this organization's policy.",
  unowned:
    "The responsible operations member is unavailable. An owner must assign an active, approved member.",
  awaiting:
    "Waiting for the first scheduled observation of the current policy. Check that the SLO worker is enabled and running.",
  stale:
    "Scheduled observations are overdue. Check the SLO worker and its logs before relying on these results.",
  unavailable:
    "The monitor could not read complete telemetry. Review worker logs, capacity, and dependency availability.",
};
const labels = {
  healthy: "Within targets",
  breached: "Target breached",
  unknown: "Insufficient evidence",
  unowned: "Owner unavailable",
};
const reasons = {
  SUCCESS_BELOW_TARGET: "Success rate below target",
  LATENCY_ABOVE_TARGET: "Latency above target",
  PENDING_SCHEDULE_LATE: "Scheduled preparation overdue",
};
const timestamp = (value) =>
  value ? new Date(value).toLocaleString() : "None yet";
const percent = (value) =>
  value === null ? "Unknown" : `${value.toFixed(2)}%`;
const latency = (value) =>
  value === null ? "Unknown" : `${Math.round(value).toLocaleString()} ms`;

export function renderServiceHealth({
  container,
  user,
  organization,
  isCurrent,
}) {
  const role = organization.membership.role;
  if (!["owner", "admin", "staff"].includes(role)) return;
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}`;
  const section = node("section", undefined, {
    "aria-label": "Service health",
    class: "host-service-health",
  });
  const status = node(
    "p",
    "Load scheduled monitoring evidence for this organization.",
    { role: "status", "aria-live": "polite" },
  );
  const refresh = node("button", "Refresh service health", { type: "button" });
  const content = node("div");
  const actions = node("div", undefined, { class: "health-actions" });
  actions.append(refresh);
  if (role === "owner") {
    const verify = node("button", "Verify identity to edit targets", {
      type: "button",
    });
    verify.addEventListener(
      "click",
      () =>
        void run(verify, async () => {
          const [{ reauthenticate }, { requestMfaChallenge }] =
            await Promise.all([
              import("./site-auth.js"),
              import("./host-mfa-challenge.js"),
            ]);
          if (!current()) return;
          await reauthenticate(user, requestMfaChallenge);
          await user.getIdToken(true);
          if (current())
            status.textContent =
              "Identity verified. You can retry saving the reviewed service targets.";
        }),
    );
    actions.append(verify);
  }
  for (const [title, view] of [
    ["Review alerts and deliveries", "Jobs Calendar"],
    ...(role === "owner" ? [["Open support access", "Support"]] : []),
  ]) {
    const button = node("button", title, { type: "button" });
    button.addEventListener("click", () =>
      window.dispatchEvent(
        new CustomEvent("host:workspace-view", { detail: view }),
      ),
    );
    actions.append(button);
  }
  section.append(
    node("h2", "Service health"),
    node(
      "p",
      "Scheduled checks of authenticated invitation API requests, job preparation, and provider message acceptance. Physical gate availability and guest receipt require separate verification.",
    ),
    actions,
    status,
    content,
  );
  container.append(section);
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
          {
            RECENT_REAUTH_REQUIRED:
              "Choose Verify identity to edit targets, complete your authenticator sign-in, then retry saving.",
            VERSION_CONFLICT:
              "Service targets changed. Load the current policy and review it before saving again.",
            SLO_OWNER_UNAVAILABLE:
              "Choose an active approved operations member. Owners and administrators must have an authenticator enrolled.",
          }[error?.code] ??
          "Unable to load or save service health. Refresh and verify your access; contact operations if this continues.";
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  function display(value) {
    const state = value.monitoring.state;
    status.textContent =
      state === "current"
        ? (labels[value.assessment] ?? "Insufficient evidence")
        : (explanations[state] ?? "Monitoring status is unknown.");
    content.replaceChildren(
      node(
        "p",
        `Checked ${timestamp(value.observedAt)} · latest window ends ${timestamp(value.monitoring.latestWindowEnd)}. Observations become overdue after ${value.monitoring.maximumAgeMs / 60000} minutes.`,
      ),
    );
    if (value.policy)
      content.append(
        node(
          "p",
          `Policy revision ${value.policy.version} · responsible member ${value.policy.responsibleUid} · ${value.ownerActive ? "active" : "unavailable"}`,
        ),
      );
    const latest = value.items[0];
    if (latest?.metrics) {
      content.append(
        node(
          "h3",
          state === "current"
            ? "Latest observed window"
            : "Historical results — not current health",
        ),
      );
      const cards = node("div", undefined, { class: "health-metrics" });
      for (const [key, title] of [
        ["api", "Invitation API"],
        ["automation", "Job preparation"],
        ["delivery", "Provider acceptance"],
      ]) {
        const metric = latest.metrics[key];
        const card = node("article", undefined, { "aria-label": title });
        card.append(
          node("h4", title),
          node("p", labels[metric.state]),
          node(
            "p",
            `${percent(metric.successPercent)} success · p95 ${latency(metric.p95LatencyMs)}`,
          ),
          node("p", `${metric.samples} measured samples`),
        );
        for (const reason of metric.reasons)
          card.append(node("p", reasons[reason] ?? "Review service targets"));
        cards.append(card);
      }
      content.append(cards);
    }
    content.append(node("h3", "Recent scheduled observations"));
    if (!value.items.length)
      content.append(
        node(
          "p",
          "No retained observations yet. Refresh after the monitor runs.",
        ),
      );
    else {
      const list = node("ol", undefined, { class: "health-history" });
      for (const item of value.items)
        list.append(
          node(
            "li",
            `${timestamp(item.from)} – ${timestamp(item.to)} · revision ${item.policyVersion} · ${item.telemetryAvailable ? labels[item.state] : "Telemetry unavailable"}`,
          ),
        );
      content.append(
        node(
          "p",
          "Latest 12 windows within the 90-day retention period. Each window covers one hour and may overlap the next; do not add their sample counts together.",
        ),
        list,
      );
    }
  }
  refresh.addEventListener(
    "click",
    () =>
      void run(refresh, async () => {
        content.replaceChildren();
        status.textContent = "Loading service health…";
        const value = await portalRequest(
          user,
          `${root}/operations/service-health?limit=12`,
        );
        if (current()) display(value);
      }),
  );
  renderServiceTargets({
    section,
    user,
    root,
    current,
    run,
    status,
    owner: role === "owner",
    onSaved: () => content.replaceChildren(),
  });
}
