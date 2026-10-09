import { hostText, hostLocale } from "./host-locale.js";
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
  SUCCESS_BELOW_TARGET: hostText("Success rate below target"),
  LATENCY_ABOVE_TARGET: hostText("Latency above target"),
  PENDING_SCHEDULE_LATE: hostText("Scheduled preparation overdue"),
};
const timestamp = (value) =>
  value ? new Date(value).toLocaleString(hostLocale) : hostText("None yet");
const percent = (value) =>
  value === null ? hostText("Unknown") : `${value.toFixed(2)}%`;
const latency = (value) =>
  value === null
    ? hostText("Unknown")
    : hostText("{p0} ms", { p0: Math.round(value).toLocaleString(hostLocale) });

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
    hostText("Load scheduled monitoring evidence for this organization."),
    { role: "status", "aria-live": "polite" },
  );
  const refresh = node("button", hostText("Refresh service health"), {
    type: "button",
  });
  const content = node("div");
  const actions = node("div", undefined, { class: "health-actions" });
  actions.append(refresh);
  if (role === "owner") {
    const verify = node("button", hostText("Verify identity to edit targets"), {
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
            status.textContent = hostText(
              "Identity verified. You can retry saving the reviewed service targets.",
            );
        }),
    );
    actions.append(verify);
  }
  for (const [title, view] of [
    ["Review alerts and deliveries", "Jobs Calendar"],
    ...(role === "owner" ? [["Open support access", "Support"]] : []),
  ]) {
    const button = node("button", hostText(title), { type: "button" });
    button.addEventListener("click", () =>
      window.dispatchEvent(
        new CustomEvent("host:workspace-view", { detail: view }),
      ),
    );
    actions.append(button);
  }
  section.append(
    node("h2", hostText("Service health")),
    node(
      "p",
      hostText(
        "Scheduled checks of authenticated invitation API requests, job preparation, and provider message acceptance. Physical gate availability and guest receipt require separate verification.",
      ),
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
            RECENT_REAUTH_REQUIRED: hostText(
              "Choose Verify identity to edit targets, complete your authenticator sign-in, then retry saving.",
            ),
            VERSION_CONFLICT: hostText(
              "Service targets changed. Load the current policy and review it before saving again.",
            ),
            SLO_OWNER_UNAVAILABLE: hostText(
              "Choose an active approved operations member. Owners and administrators must have an authenticator enrolled.",
            ),
          }[error?.code] ??
          hostText(
            "Unable to load or save service health. Refresh and verify your access; contact operations if this continues.",
          );
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  function display(value) {
    const state = value.monitoring.state;
    status.textContent = hostText(
      state === "current"
        ? (labels[value.assessment] ?? "Insufficient evidence")
        : (explanations[state] ?? "Monitoring status is unknown."),
    );
    content.replaceChildren(
      node(
        "p",
        hostText(
          "Checked {p0} · latest window ends {p1}. Observations become overdue after {p2} minutes.",
          {
            p0: timestamp(value.observedAt),
            p1: timestamp(value.monitoring.latestWindowEnd),
            p2: value.monitoring.maximumAgeMs / 60000,
          },
        ),
      ),
    );
    if (value.policy)
      content.append(
        node(
          "p",
          hostText("Policy revision {p0} · responsible member {p1} · {p2}", {
            p0: value.policy.version,
            p1: value.policy.responsibleUid,
            p2: value.ownerActive
              ? hostText("active")
              : hostText("unavailable"),
          }),
        ),
      );
    const latest = value.items[0];
    if (latest?.metrics) {
      content.append(
        node(
          "h3",
          state === "current"
            ? hostText("Latest observed window")
            : hostText("Historical results — not current health"),
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
          node("h4", hostText(title)),
          node("p", hostText(labels[metric.state])),
          node(
            "p",
            hostText("{p0} success · p95 {p1}", {
              p0: percent(metric.successPercent),
              p1: latency(metric.p95LatencyMs),
            }),
          ),
          node("p", hostText("{p0} measured samples", { p0: metric.samples })),
        );
        for (const reason of metric.reasons)
          card.append(
            node("p", reasons[reason] ?? hostText("Review service targets")),
          );
        cards.append(card);
      }
      content.append(cards);
    }
    content.append(node("h3", hostText("Recent scheduled observations")));
    if (!value.items.length)
      content.append(
        node(
          "p",
          hostText(
            "No retained observations yet. Refresh after the monitor runs.",
          ),
        ),
      );
    else {
      const list = node("ol", undefined, { class: "health-history" });
      for (const item of value.items)
        list.append(
          node(
            "li",
            hostText("{p0} – {p1} · revision {p2} · {p3}", {
              p0: timestamp(item.from),
              p1: timestamp(item.to),
              p2: item.policyVersion,
              p3: item.telemetryAvailable
                ? labels[item.state]
                : hostText("Telemetry unavailable"),
            }),
          ),
        );
      content.append(
        node(
          "p",
          hostText(
            "Latest 12 windows within the 90-day retention period. Each window covers one hour and may overlap the next; do not add their sample counts together.",
          ),
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
        status.textContent = hostText("Loading service health…");
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
