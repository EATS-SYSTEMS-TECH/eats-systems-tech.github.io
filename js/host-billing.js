import { portalRequest } from "./api/index.js";
import {
  field,
  node,
  infoTip,
  downloadHostCsv,
  hostDateTime,
} from "./host-ui.js";
import { hostText } from "./host-locale.js";
import { requestWithRecentIdentity } from "./host-recent-identity.js";
import { can } from "./host-permissions.js";

// Plan & statements speaks to the owner in plain words: where the plan
// stands (never its id or revision), what a month used, and an estimate.
// Nothing here charges a payment.
const planStates = {
  "legacy-active": "Active",
  active: "Active",
  trial: "Trial",
  "trial-expired": "Trial ended",
  cancelling: "Ends soon",
  cancelled: "Plan cancelled",
  suspended: "Plan paused",
};
export const planState = (subscription) =>
  hostText(
    planStates[subscription?.effectiveStatus ?? subscription?.status] ??
      "Needs attention",
  );

export async function renderHostBilling({
  container,
  user,
  organization,
  isCurrent,
}) {
  // Plan & statements: the owner (billing:write).
  const owner = can(organization, "billing:write");
  if (!owner) return;
  const root = "/api/v1/organizations/" + encodeURIComponent(organization.id);
  const section = node("section", undefined, {
    "aria-label": "Billing statements",
    "data-workspace-billing": "",
  });
  const status = node("p", "", { role: "status", "aria-live": "polite" });
  section.append(status);
  container.append(section);
  // One part of the tab: a heading whose ⓘ says what it is about (no hint
  // paragraphs), then its form.
  const part = (title, tip, ...content) => {
    const block = node("div", undefined, { class: "settings-block" });
    const heading = node("div", undefined, { class: "view-heading" });
    heading.append(node("h3", hostText(title)), infoTip(hostText(tip)));
    block.append(heading, ...content);
    section.append(block);
    return block;
  };
  const current = () => isCurrent() && section.isConnected;
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
  const attempts = new Map();
  let busy = false;
  const errorMessages = {
    BILLING_HISTORY_INCOMPLETE:
      "There's no full record of this month. Choose a later month.",
    BILLING_MONTH_OPEN: "This month isn't over yet. Choose a month that ended.",
    BILLING_HISTORY_CHANGED: "This month's use changed. Try again.",
    BILLING_STATEMENT_EXPIRED: "This month is too long ago to show.",
    BILLING_CAPACITY_EXCEEDED:
      "WIFIGATE needs to check this month first. Contact support.",
    VERSION_CONFLICT: "Your plan changed. Show its status again, then retry.",
    SUBSCRIPTION_TRANSITION_DENIED:
      "This change isn't possible for your plan right now.",
    RECENT_AUTH_REQUIRED:
      "Sign in again with your authenticator before changing billing settings.",
    RECENT_TOTP_REQUIRED:
      "Sign in again with your authenticator before changing billing settings.",
    TOTP_REQUIRED:
      "Verify your authenticator before changing billing settings.",
  };
  async function run(button, operation) {
    if (busy || !current()) return;
    busy = true;
    status.textContent = hostText("Loading");
    button.disabled = true;
    try {
      await operation();
    } catch (error) {
      if (current())
        status.textContent = hostText(
          errorMessages[error.code] ?? "That didn't work. Try again.",
        );
    } finally {
      busy = false;
      if (current()) button.disabled = false;
    }
  }
  if (owner) {
    const statementForm = node("form", undefined, { class: "settings-form" }),
      today = new Date(),
      previousMonth = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
      )
        .toISOString()
        .slice(0, 7);
    const statementMonth = field(
        statementForm,
        "Statement month",
        "month",
        previousMonth,
        "month",
      ),
      statementButton = node("button", hostText("Create statement"), {
        type: "submit",
      }),
      statementRows = node("div");
    statementForm.append(statementButton);
    const baselineButton = node("button", hostText("Start counting use"), {
      type: "button",
      class: "button-secondary",
    });
    const baselineRow = node("div", undefined, { class: "settings-actions" });
    baselineRow.append(
      baselineButton,
      infoTip(
        hostText(
          "For an organization from before use was counted: counting starts with the next full month. Past months stay as they are.",
        ),
      ),
    );
    part(
      "Monthly statement",
      "A month that ended: how many gates were in use each day. Nothing is charged.",
      statementForm,
      statementRows,
      baselineRow,
    );
    baselineButton.addEventListener("click", () =>
      run(baselineButton, async () => {
        const signature = "billing-history-baseline";
        if (!attempts.has(signature))
          attempts.set(signature, crypto.randomUUID());
        const { history } = await write(
          `${root}/billing/history/baseline`,
          {},
          attempts.get(signature),
        );
        if (current())
          status.textContent = history.existing
            ? hostText("Use is already counted.")
            : hostText("Use is counted from {p0}.", {
                p0: history.firstFullMonth,
              });
      }),
    );
    statementForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!statementForm.reportValidity()) return;
      void run(statementButton, async () => {
        const signature = `billing-statement:${statementMonth.value}`;
        if (!attempts.has(signature))
          attempts.set(signature, crypto.randomUUID());
        const { statement } = await write(
          `${root}/billing/statements`,
          { month: statementMonth.value },
          attempts.get(signature),
        );
        if (!current()) return;
        const exportStatement = node(
          "button",
          hostText("Download the daily breakdown"),
          { type: "button", class: "button-secondary" },
        );
        exportStatement.addEventListener("click", () =>
          downloadHostCsv(
            statement.daily,
            ["date", "activePhysicalSystems", "plan"],
            `wifigate-statement-${statement.month}.csv`,
          ),
        );
        statementRows.replaceChildren(
          node(
            "p",
            hostText("{p0} · USD {p1} · {p2} days of gate use", {
              p0: statement.month,
              p1: (statement.monthlyEstimateCents / 100).toFixed(2),
              p2: statement.physicalSystemDays,
            }),
          ),
          exportStatement,
        );
        status.textContent = "";
      });
    });
  }
  if (owner) {
    const lifecycle = node("form", undefined, { class: "settings-form" }),
      lifecycleStatus = node("p"),
      action = field(lifecycle, "Plan change", "action", "activate", "text", [
        ["start-trial", hostText("Start a trial")],
        ["activate", hostText("Keep the service on")],
        ["cancel", hostText("Cancel (7 more days of service)")],
      ]),
      reason = field(lifecycle, "Reason for the change", "reason");
    reason.minLength = 5;
    reason.maxLength = 200;
    const loadSubscription = node("button", hostText("Show plan status"), {
        type: "button",
        class: "button-secondary",
      }),
      changeSubscription = node("button", hostText("Change plan"), {
        type: "submit",
        disabled: "",
      });
    // Until the plan's status shows, Change plan stays disabled and its ⓘ
    // says why.
    const changeBlocked = infoTip(hostText("Show the plan status first."));
    const allowChange = (allowed) => {
      changeSubscription.disabled = !allowed;
      changeBlocked.hidden = allowed;
    };
    let subscription;
    const showSubscription = () => {
      lifecycleStatus.textContent =
        planState(subscription) +
        (subscription.trialEndsAt
          ? hostText(" · trial ends {p0}", {
              p0: hostDateTime(subscription.trialEndsAt),
            })
          : "") +
        (subscription.graceEndsAt
          ? hostText(" · service ends {p0}", {
              p0: hostDateTime(subscription.graceEndsAt),
            })
          : "");
    };
    const lifecycleActions = node("div", undefined, {
      class: "settings-actions",
    });
    const changeHolder = node("span", undefined, {
      class: "system-action-blocked",
    });
    changeHolder.append(changeSubscription, changeBlocked);
    lifecycleActions.append(loadSubscription, changeHolder);
    lifecycle.append(lifecycleActions, lifecycleStatus);
    part(
      "Your plan",
      "Nothing is charged. After a cancellation the service keeps working for seven days, and guest passes already in the app work until they end.",
      lifecycle,
    );
    loadSubscription.addEventListener("click", () =>
      run(loadSubscription, async () => {
        subscription = undefined;
        allowChange(false);
        lifecycleStatus.textContent = "";
        const response = await portalRequest(
          user,
          `${root}/billing/subscription`,
        );
        if (current()) {
          subscription = response.subscription;
          showSubscription();
          allowChange(true);
          status.textContent = "";
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
        const response = await write(
          `${root}/billing/subscription`,
          body,
          attempts.get(signature),
        );
        if (current()) {
          subscription = response.subscription;
          showSubscription();
          status.textContent = "";
        }
      });
    });
    const form = node("form", undefined, { class: "settings-form" }),
      month = field(
        form,
        "Estimate month",
        "month",
        new Date().toISOString().slice(0, 7),
        "month",
      ),
      preview = node("button", hostText("Show estimate"), {
        type: "submit",
        class: "button-secondary",
      }),
      output = node("p");
    form.append(preview, output);
    part(
      "Price estimate",
      "An estimate only. Nothing is charged and no invoice is sent.",
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
          output.textContent =
            hostText("{p0} gates · about USD {p1}", {
              p0: value.activePhysicalSystems,
              p1: (value.monthlyEstimateCents / 100).toFixed(2),
            }) +
            (value.unverifiedPhysicalSystems
              ? hostText(" · {p0} more not counted yet", {
                  p0: value.unverifiedPhysicalSystems,
                })
              : "");
          status.textContent = "";
        }
      });
    });
  }
}
