import { portalRequest } from "./api/index.js";
import { field, node, downloadHostCsv } from "./host-ui.js";

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
  section.append(node("h2", "Billing statements"), status);
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
          "Billing could not be updated. Refresh current data and verify permissions before retrying.";
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
      statementButton = node("button", "Generate monthly draft", {
        type: "submit",
      }),
      statementRows = node("div");
    statementForm.append(statementButton);
    billing.append(
      node("h3", "Monthly billing statements"),
      node(
        "p",
        "Closed-month drafts use recorded physical system days. Pricing remains an internal proposal; generating a draft does not charge a payment.",
      ),
      statementForm,
      statementRows,
    );
    const baselineButton = node("button", "Start verified billing history", {
      type: "button",
    });
    billing.append(
      node(
        "p",
        "Older organizations can start a verified history baseline for future full months. Existing history is preserved and past use is never invented.",
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
            ? "Existing billing history preserved."
            : `Verified billing history started. First full month: ${history.firstFullMonth}. No past charges were created.`;
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
          "Export statement daily breakdown",
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
            `Draft ${statement.month} · USD ${(statement.monthlyEstimateCents / 100).toFixed(2)} · ${statement.physicalSystemDays} physical system days`,
          ),
          exportStatement,
        );
        status.textContent =
          "Canonical monthly draft generated. No payment was charged.";
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
          ["start-trial", "Start trial"],
          ["activate", "Activate / keep service"],
          ["cancel", "Cancel with grace period"],
        ],
      ),
      reason = field(lifecycle, "Subscription change reason", "reason");
    reason.minLength = 5;
    reason.maxLength = 200;
    const loadSubscription = node("button", "Load subscription", {
        type: "button",
      }),
      changeSubscription = node("button", "Apply subscription change", {
        type: "submit",
        disabled: "",
      });
    let subscription;
    lifecycle.append(loadSubscription, changeSubscription, lifecycleStatus);
    section.append(
      node("h3", "Customer lifecycle"),
      node(
        "p",
        "Internal pricing proposal. Subscription actions are audited and do not charge a payment method. Cancellation allows seven days of service; already imported offline passes remain valid until their expiry.",
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
          lifecycleStatus.textContent = `${subscription.effectiveStatus ?? subscription.status} · revision ${subscription.version}${subscription.trialEndsAt ? ` · trial ends ${subscription.trialEndsAt}` : ""}${subscription.graceEndsAt ? ` · grace ends ${subscription.graceEndsAt}` : ""}`;
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
          lifecycleStatus.textContent = `${subscription.effectiveStatus ?? subscription.status} · revision ${subscription.version}`;
          status.textContent = "Subscription change saved and audited.";
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
      preview = node("button", "Preview monthly pricing", { type: "submit" }),
      output = node("p");
    form.append(preview, output);
    section.append(
      node("h3", "Internal pricing proposal"),
      node(
        "p",
        "This estimate does not issue an invoice or charge a payment method.",
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
          output.textContent = `${value.plan} · ${value.activePhysicalSystems} verified physical gates · estimated USD ${(value.monthlyEstimateCents / 100).toFixed(2)} · unverified excluded ${value.unverifiedPhysicalSystems}`;
          status.textContent = "Internal monthly estimate loaded.";
        }
      });
    });
  }
}
