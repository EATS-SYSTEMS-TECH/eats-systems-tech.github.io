import { portalRequest } from "./api/index.js";
import { field, node, downloadHostCsv } from "./host-ui.js";
import { hostText } from "./host-locale.js";

export async function renderHostBilling({
  container,
  user,
  organization,
  isCurrent,
}) {
  const role = organization.membership.role;
  if (role !== "owner") return;
  const root = "/api/v1/organizations/" + encodeURIComponent(organization.id);
  const section = node("section", undefined, {
    "aria-label": "Billing statements",
    "data-workspace-billing": "",
  });
  const status = node("p", "", { role: "status", "aria-live": "polite" });
  section.append(node("h2", hostText("Billing statements")), status);
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
        status.textContent = hostText(
          "Billing could not be updated. Refresh current data and verify permissions before retrying.",
        );
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  if (role === "owner") {
    const billing = node("section", undefined, {
      "aria-label": "Billing statements",
      "data-workspace-billing": "",
    });
    section.append(billing);
    const statementForm = node("form"),
      today = new Date(),
      previousMonth = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
      )
        .toISOString()
        .slice(0, 7);
    const statementMonth = field(
        statementForm,
        "Monthly statement period",
        "month",
        previousMonth,
        "month",
      ),
      statementButton = node("button", hostText("Generate monthly draft"), {
        type: "submit",
      }),
      statementRows = node("div");
    statementForm.append(statementButton);
    billing.append(
      node("h3", hostText("Monthly billing statements")),
      node(
        "p",
        hostText(
          "Closed-month drafts use recorded physical system days. Pricing remains an internal proposal; generating a draft does not charge a payment.",
        ),
      ),
      statementForm,
      statementRows,
    );
    const baselineButton = node(
      "button",
      hostText("Start verified billing history"),
      { type: "button" },
    );
    billing.append(
      node(
        "p",
        hostText(
          "Older organizations can start a verified history baseline for future full months. Existing history is preserved and past use is never invented.",
        ),
      ),
      baselineButton,
    );
    baselineButton.addEventListener("click", () =>
      run(baselineButton, async () => {
        const signature = "billing-history-baseline";
        if (!attempts.has(signature))
          attempts.set(signature, crypto.randomUUID());
        const { history } = await portalRequest(
          user,
          `${root}/billing/history/baseline`,
          "POST",
          {},
          attempts.get(signature),
        );
        if (current())
          status.textContent = history.existing
            ? hostText("Existing billing history preserved.")
            : hostText(
                "Verified billing history started. First full month: {p0}. No past charges were created.",
                { p0: history.firstFullMonth },
              );
      }),
    );
    statementForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!statementForm.reportValidity()) return;
      void run(statementButton, async () => {
        const signature = `billing-statement:${statementMonth.value}`;
        if (!attempts.has(signature))
          attempts.set(signature, crypto.randomUUID());
        const { statement } = await portalRequest(
          user,
          `${root}/billing/statements`,
          "POST",
          { month: statementMonth.value },
          attempts.get(signature),
        );
        if (!current()) return;
        const exportStatement = node(
          "button",
          hostText("Export statement daily breakdown"),
          { type: "button" },
        );
        exportStatement.addEventListener("click", () =>
          downloadHostCsv(
            statement.daily,
            ["date", "activePhysicalSystems", "activeProperties", "plan"],
            `wifigate-statement-${statement.month}.csv`,
          ),
        );
        statementRows.replaceChildren(
          node(
            "p",
            hostText("Draft {p0} · USD {p1} · {p2} physical system days", {
              p0: statement.month,
              p1: (statement.monthlyEstimateCents / 100).toFixed(2),
              p2: statement.physicalSystemDays,
            }),
          ),
          exportStatement,
        );
        status.textContent = hostText(
          "Canonical monthly draft generated. No payment was charged.",
        );
      });
    });
  }
  if (role === "owner") {
    const lifecycle = node("form"),
      lifecycleStatus = node("p"),
      action = field(
        lifecycle,
        "Subscription action",
        "action",
        "activate",
        "text",
        [
          ["start-trial", hostText("Start trial")],
          ["activate", hostText("Activate / keep service")],
          ["cancel", hostText("Cancel with grace period")],
        ],
      ),
      reason = field(lifecycle, "Subscription change reason", "reason");
    reason.minLength = 5;
    reason.maxLength = 200;
    const loadSubscription = node("button", hostText("Load subscription"), {
        type: "button",
      }),
      changeSubscription = node(
        "button",
        hostText("Apply subscription change"),
        { type: "submit", disabled: "" },
      );
    let subscription;
    lifecycle.append(loadSubscription, changeSubscription, lifecycleStatus);
    section.append(
      node("h3", hostText("Customer lifecycle")),
      node(
        "p",
        hostText(
          "Internal pricing proposal. Subscription actions are audited and do not charge a payment method. Cancellation allows seven days of service; already imported offline passes remain valid until their expiry.",
        ),
      ),
      lifecycle,
    );
    loadSubscription.addEventListener("click", () =>
      run(loadSubscription, async () => {
        const response = await portalRequest(
          user,
          `${root}/billing/subscription`,
        );
        if (current()) {
          subscription = response.subscription;
          lifecycleStatus.textContent = hostText(
            "{p0} · revision {p1}{p2}{p3}",
            {
              p0: subscription.effectiveStatus ?? subscription.status,
              p1: subscription.version,
              p2: subscription.trialEndsAt
                ? hostText(" · trial ends {p0}", {
                    p0: subscription.trialEndsAt,
                  })
                : "",
              p3: subscription.graceEndsAt
                ? hostText(" · grace ends {p0}", {
                    p0: subscription.graceEndsAt,
                  })
                : "",
            },
          );
          changeSubscription.disabled = false;
        }
      }),
    );
    lifecycle.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!subscription || !lifecycle.reportValidity()) return;
      void run(changeSubscription, async () => {
        const body = {
            action: action.value,
            reason: reason.value,
            ...(subscription.version ? { version: subscription.version } : {}),
          },
          signature = `subscription:${JSON.stringify(body)}`;
        if (!attempts.has(signature))
          attempts.set(signature, crypto.randomUUID());
        const response = await portalRequest(
          user,
          `${root}/billing/subscription`,
          "POST",
          body,
          attempts.get(signature),
        );
        if (current()) {
          subscription = response.subscription;
          lifecycleStatus.textContent = hostText("{p0} · revision {p1}", {
            p0: subscription.effectiveStatus ?? subscription.status,
            p1: subscription.version,
          });
          status.textContent = hostText(
            "Subscription change saved and audited.",
          );
        }
      });
    });
    const form = node("form"),
      month = field(
        form,
        "Pricing preview month",
        "month",
        new Date().toISOString().slice(0, 7),
        "month",
      ),
      preview = node("button", hostText("Preview monthly pricing"), {
        type: "submit",
      }),
      output = node("p");
    form.append(preview, output);
    section.append(
      node("h3", hostText("Internal pricing proposal")),
      node(
        "p",
        hostText(
          "This estimate does not issue an invoice or charge a payment method.",
        ),
      ),
      form,
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      void run(preview, async () => {
        const { preview: value } = await portalRequest(
          user,
          `${root}/billing/preview?${new URLSearchParams({ month: month.value })}`,
        );
        if (current()) {
          output.textContent = hostText(
            "{p0} · {p1} verified physical gates · estimated USD {p2} · unverified excluded {p3}",
            {
              p0: value.plan,
              p1: value.activePhysicalSystems,
              p2: (value.monthlyEstimateCents / 100).toFixed(2),
              p3: value.unverifiedPhysicalSystems,
            },
          );
          status.textContent = hostText("Internal monthly estimate loaded.");
        }
      });
    });
  }
}
