import { portalRequest } from "./api/index.js";
import { field, node, downloadHostCsv } from "./host-ui.js";

export async function renderHostOperations({ container, user, organization, properties, rooms, isCurrent }) {
  const role = organization.membership.role;
  if (!["owner", "admin", "staff"].includes(role)) return;
  const manager = role !== "staff", root = `/api/v1/organizations/${encodeURIComponent(organization.id)}`;
  const section = node("section", undefined, { "aria-label": "Host operations" }), status = node("p", "Loading operations…", { role: "status", "aria-live": "polite" });
  section.append(node("h2", "Operations"), status); container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const attempts = new Map(); let busy = false;
  async function run(button, operation) {
    if (busy || !current()) return; busy = true; button.disabled = true;
    try { await operation(); } catch { if (current()) status.textContent = "Operation failed. Refresh current data and verify permissions before retrying."; }
    finally { busy = false; if (current()) button.disabled = false; }
  }
  function write(path, body) {
    const signature = `${path}:${JSON.stringify(body)}`;
    if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
    return portalRequest(user, `${root}/operations${path}`, "PUT", body, attempts.get(signature));
  }
  const reliability = node("div"), reliabilityButton = node("button", "Measure last hour", { type: "button" });
  section.append(node("h3", "Operational observations"), node("p", "Observed authenticated API requests and jobs created in the selected hour. Service targets and physical gate availability require separate operational verification."), reliabilityButton, reliability);
  reliabilityButton.addEventListener("click", () => run(reliabilityButton, async () => {
    const end = Date.now(), value = await portalRequest(user, `${root}/operations/reliability?${new URLSearchParams({ from: new Date(end - 3600000).toISOString(), to: new Date(end).toISOString() })}`);
    if (!current()) return;
    reliability.replaceChildren(node("p", `${value.api.observedRequests} observed API requests · ${value.api.serverFailures} server failures · availability ${value.api.availabilityPercent === null ? "Unknown (no observations)" : `${value.api.availabilityPercent.toFixed(2)}%`} · p95 ${value.api.p95LatencyMs === null ? "Unknown" : `${value.api.p95LatencyMs} ms`}`), node("p", `${value.automation.observedJobs} observed jobs · ${value.automation.dueJobs} due · oldest due ${Math.round(value.automation.oldestDueMs / 1000)} s · ${value.delivery.acceptedReceipts} persisted accepted delivery receipts`));
    status.textContent = "Operational observations loaded.";
  }));
  if (role === "owner") {
    const statementForm = node("form"), today = new Date(), previousMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
    const statementMonth = field(statementForm, "Monthly statement period", "month", previousMonth, "month"), statementButton = node("button", "Generate monthly draft", { type: "submit" }), statementRows = node("div");
    statementForm.append(statementButton); section.append(node("h3", "Monthly billing statements"), node("p", "Closed-month drafts use recorded physical system days. Pricing remains an internal proposal; generating a draft does not charge a payment."), statementForm, statementRows);
    const baselineButton = node("button", "Start verified billing history", { type: "button" });
    section.append(node("p", "Older organizations can start a verified history baseline for future full months. Existing history is preserved and past use is never invented."), baselineButton);
    baselineButton.addEventListener("click", () => run(baselineButton, async () => {
      const signature = "billing-history-baseline"; if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
      const { history } = await portalRequest(user, `${root}/billing/history/baseline`, "POST", {}, attempts.get(signature));
      if (current()) status.textContent = history.existing ? "Existing billing history preserved." : `Verified billing history started. First full month: ${history.firstFullMonth}. No past charges were created.`;
    }));
    statementForm.addEventListener("submit", event => { event.preventDefault(); if (!statementForm.reportValidity()) return; void run(statementButton, async () => {
      const signature = `billing-statement:${statementMonth.value}`; if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
      const { statement } = await portalRequest(user, `${root}/billing/statements`, "POST", { month: statementMonth.value }, attempts.get(signature));
      if (!current()) return;
      const exportStatement = node("button", "Export statement daily breakdown", { type: "button" });
      exportStatement.addEventListener("click", () => downloadHostCsv(statement.daily, ["date", "activePhysicalSystems", "activeProperties", "plan"], `wifigate-statement-${statement.month}.csv`));
      statementRows.replaceChildren(node("p", `Draft ${statement.month} · USD ${(statement.monthlyEstimateCents / 100).toFixed(2)} · ${statement.physicalSystemDays} physical system days`), exportStatement); status.textContent = "Canonical monthly draft generated. No payment was charged.";
    }); });
  }
  const readinessForm = node("form"), readinessQuery = field(readinessForm, "Search access systems", "q"), readinessButton = node("button", "Check system configuration", { type: "submit" }), readinessRows = node("div");
  readinessQuery.required = false; readinessQuery.maxLength = 120; readinessForm.append(readinessButton);
  section.append(node("h3", "System configuration"), node("p", "These checks cover Host permissions and configuration. Check the gate through BLE in the mobile app before relying on physical availability."), readinessForm, readinessRows);
  async function readReadiness(cursor, append = false) {
    const response = await portalRequest(user, `${root}/operations/readiness?${new URLSearchParams({ limit: "20", ...(readinessQuery.value.trim() ? { q: readinessQuery.value.trim() } : {}), ...(cursor ? { cursor } : {}) })}`);
    if (!current()) return;
    if (!append) readinessRows.replaceChildren();
    for (const item of response.items) readinessRows.append(node("p", `${item.name} · ${item.configured ? "Configured" : item.reasons.join(", ")} · BLE: unknown`));
    if (response.nextCursor) { const more = node("button", "Check more systems", { type: "button" }); more.addEventListener("click", () => run(more, async () => { await readReadiness(response.nextCursor, true); if (current()) more.remove(); })); readinessRows.append(more); }
    if (!response.items.length) readinessRows.append(node("p", response.nextCursor ? "No matches on this page. Continue to check later systems." : "No matching systems."));
    status.textContent = "System configuration checked.";
  }
  readinessForm.addEventListener("submit", event => { event.preventDefault(); if (readinessForm.reportValidity()) void run(readinessButton, () => readReadiness()); });
  const response = await portalRequest(user, `${root}/operations/preferences`);
  if (!current()) return;
  let preferences = response.preferences;
  const settings = node("form"), locale = field(settings, "Operations language", "locale", preferences.locale, "text", [["en", "English"], ["he", "עברית"]]);
  const severity = field(settings, "Minimum alert severity", "minimumSeverity", preferences.alerts.minimumSeverity, "text", [["info", "Information"], ["warning", "Warning"], ["error", "Error"]]);
  const staffTemplate = field(settings, "Staff alert message", "staffTemplateId", "", "text", [["", "Default localized message"]]); staffTemplate.required = false;
  const staffTemplates = new Map();
  const drawStaffTemplates = () => {
    const selected = staffTemplate.value || preferences.alerts.staffTemplateId || "";
    staffTemplate.replaceChildren(node("option", "Default localized message", { value: "" }));
    for (const item of staffTemplates.values()) if (item.locale === locale.value) staffTemplate.append(node("option", item.name, { value: item.id }));
    if (selected && preferences.locale === locale.value && !staffTemplates.has(selected)) staffTemplate.append(node("option", "Current staff alert message", { value: selected }));
    if ([...staffTemplate.options].some(option => option.value === selected)) staffTemplate.value = selected;
  };
  locale.addEventListener("change", drawStaffTemplates);
  const eventTypes = field(settings, "Alert events (empty means all)", "eventTypes", "", "text", ["automation.failed", "automation.retry", "automation.paused", "automation.cancelled", "automation.delivered", "integration.event.dead_letter", "integration.event.retry"].map(value => [value, value])); eventTypes.multiple = true; eventTypes.required = false; eventTypes.size = 4;
  for (const option of eventTypes.options) option.selected = (preferences.alerts.eventTypes ?? []).includes(option.value);
  const channels = {};
  for (const name of ["inApp", "email", "sms"]) {
    const label = node("label", `Alert preference: ${name}`), input = node("input", undefined, { type: "checkbox", name }); input.checked = preferences.alerts[name]; label.prepend(input); settings.append(label); channels[name] = input;
  }
  settings.append(node("p", "Email and SMS preferences require a configured delivery provider. Saving preferences does not confirm delivery."));
  const filterName = field(settings, "Saved filter name", "filterName"); filterName.required = false; filterName.maxLength = 80;
  const property = field(settings, "Saved filter property", "propertyId", "", "text", [["", "All properties"], ...properties.map(p => [p.id, p.name])]);
  const room = field(settings, "Saved filter room", "roomId", "", "text", [["", "All rooms"], ...rooms.map(r => [r.id, r.name])]);
  const filterStatus = field(settings, "Saved filter status", "status", "", "text", [["", "All statuses"], ...["draft", "confirmed", "changed", "cancelled", "completed"].map(s => [s, s])]);
  const filters = node("div"), drawFilters = () => {
    filters.replaceChildren();
    for (const [index, filter] of preferences.savedFilters.entries()) {
      const row = node("p", `${filter.name} · ${filter.propertyId ?? "All properties"} · ${filter.roomId ?? "All rooms"} · ${filter.status ?? "All statuses"}`), remove = node("button", "Remove saved filter", { type: "button" });
      remove.addEventListener("click", () => { preferences.savedFilters.splice(index, 1); drawFilters(); }); row.append(remove); filters.append(row);
      const apply = node("button", "Apply saved filter", { type: "button" }); apply.addEventListener("click", () => { if (current()) window.dispatchEvent(new CustomEvent("host:operations-filter", { detail: { ...filter, orgId: organization.id } })); }); row.append(apply);
    }
  };
  drawFilters(); settings.append(filters);
  const save = node("button", "Save operation preferences", { type: "submit" }); settings.append(save); section.append(settings);
  settings.addEventListener("submit", event => {
    event.preventDefault(); if (!settings.reportValidity()) return;
    void run(save, async () => {
      const savedFilters = [...preferences.savedFilters];
      if (filterName.value.trim()) savedFilters.push({ name: filterName.value.trim(), ...(property.value ? { propertyId: property.value } : {}), ...(room.value ? { roomId: room.value } : {}), ...(filterStatus.value ? { status: filterStatus.value } : {}) });
      const result = await write("/preferences", { savedFilters, alerts: { inApp: channels.inApp.checked, email: channels.email.checked, sms: channels.sms.checked, minimumSeverity: severity.value, ...(staffTemplate.value ? { staffTemplateId: staffTemplate.value } : {}), eventTypes: [...eventTypes.selectedOptions].map(option => option.value) }, locale: locale.value, ...(preferences.version ? { version: preferences.version } : {}) });
      if (current()) { preferences = result.preferences; filterName.value = ""; drawFilters(); status.textContent = "Operation preferences saved."; }
    });
  });
  const alertsButton = node("button", "Refresh operational alerts", { type: "button" }), alertRows = node("div", undefined, { "aria-live": "polite" }); section.append(node("h3", "Operational alerts"), alertsButton, alertRows);
  async function readAlerts(cursor, append = false) {
    const result = await portalRequest(user, `${root}/operations/alerts?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`);
    if (!current()) return;
    if (!append) alertRows.replaceChildren();
    for (const item of result.items) alertRows.append(node("p", `${item.severity} · ${item.title} · ${item.targetId} · ${new Date(item.createdAt).toLocaleString()}`));
    if (!result.enabled) alertRows.append(node("p", "In-app alerts are disabled in your preferences."));
    else if (!result.items.length) alertRows.append(node("p", result.nextCursor ? "No matching alerts on this page. Continue to check earlier events." : "No matching operational alerts."));
    if (result.nextCursor) { const more = node("button", "Load earlier operational alerts", { type: "button" }); more.addEventListener("click", () => run(more, async () => { await readAlerts(result.nextCursor, true); if (current()) more.remove(); })); alertRows.append(more); }
  }
  alertsButton.addEventListener("click", () => run(alertsButton, () => readAlerts()));
  const deliveryButton = node("button", "Refresh staff delivery receipts", { type: "button" }), deliveryRows = node("div", undefined, { "aria-live": "polite" });
  section.append(node("h3", "Staff notification delivery"), deliveryButton, deliveryRows);
  async function readDelivery(cursor, append = false) {
    const result = await portalRequest(user, `${root}/operations/notifications?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`);
    if (!current()) return; if (!append) deliveryRows.replaceChildren();
    const review = (row, suffix, body, caption) => {
      const controls = node("div"), reason = field(controls, "Notification review reason", "reason"); reason.maxLength = 300;
      const button = node("button", caption, { type: "button" }); controls.append(button); row.append(controls);
      const keys = new Map();
      button.addEventListener("click", () => run(button, async () => {
        if (!reason.value.trim() || !row.isConnected) { status.textContent = "Enter a reason before reviewing this notification."; return; }
        const input = { ...body, reason: reason.value.trim() }, signature = JSON.stringify(input);
        if (!keys.has(signature)) keys.set(signature, crypto.randomUUID());
        reason.disabled = true;
        try {
          const response = await portalRequest(user, `${root}/operations${suffix}`, "POST", input, keys.get(signature));
          if (!current()) return;
          await readDelivery();
          if (current()) status.textContent = response.providerAcceptanceMayAlreadyHaveOccurred ? "Future delivery stopped. The provider may already have accepted the current attempt; check its receipt." : "Notification review saved.";
        } finally { if (current()) reason.disabled = false; }
      }));
    };
    for (const item of result.items) {
      const row = node("div", undefined, { "aria-label": "Staff delivery receipt" });
      row.append(node("p", `${item.channel} · ${item.event} · ${item.status} · attempts ${item.attempts}${item.lastErrorCode ? ` · ${item.lastErrorCode}` : ""}${item.acceptedAfterCancellation ? " · Provider accepted after stop" : ""}`));
      if (["queued", "retry", "processing", "failed"].includes(item.status)) review(row, `/notifications/${encodeURIComponent(item.id)}/${item.status === "failed" ? "retry" : "stop"}`, {status: item.status, attempts: item.attempts}, item.status === "failed" ? "Retry staff notification" : "Stop staff notification");
      deliveryRows.append(row);
    }
    for (const item of result.failedEvents ?? []) {
      const row = node("div"); row.append(node("p", `Staff alert needs review · ${item.event} · ${item.lastErrorCode}`));
      if (item.lastErrorCode === "NOTIFICATION_CAPACITY_EXCEEDED") review(row, `/notification-events/${encodeURIComponent(item.id)}/retry`, {}, "Retry staff alert fan-out");
      deliveryRows.append(row);
    }
    if (result.moreFailedEvents) deliveryRows.append(node("p", "Additional staff alerts need operator review."));
    if (!result.items.length) deliveryRows.append(node("p", "No staff notification deliveries on this page."));
    if (result.nextCursor) { const more = node("button", "Load more staff delivery receipts", { type: "button" }); more.addEventListener("click", () => run(more, async () => { await readDelivery(result.nextCursor, true); if (current()) more.remove(); })); deliveryRows.append(more); }
  }
  deliveryButton.addEventListener("click", () => run(deliveryButton, () => readDelivery()));
  const timelineForm = node("form"), target = field(timelineForm, "Timeline target ID", "targetId"); target.required = false;
  const loadTimeline = node("button", "Load activity timeline", { type: "submit" }), timeline = node("div"); timelineForm.append(loadTimeline); section.append(timelineForm, timeline);
  async function readTimeline(cursor, append = false) {
    const result = await portalRequest(user, `${root}/operations/timeline?${new URLSearchParams({ limit: "50", ...(target.value ? { targetId: target.value } : {}), ...(cursor ? { cursor } : {}) })}`);
    if (!current()) return; if (!append) timeline.replaceChildren();
    for (const item of result.items) timeline.append(node("p", `${item.createdAt} · ${item.type} · ${item.targetId ?? ""}`));
    const download = node("button", "Export this audit page", { type: "button" }); download.addEventListener("click", () => downloadHostCsv(result.items, ["id", "type", "targetId", "requestId", "createdAt"], "wifigate-audit-page.csv")); timeline.append(download);
    if (result.nextCursor) { const more = node("button", "Load more timeline entries", { type: "button" }); more.addEventListener("click", () => run(more, async () => { await readTimeline(result.nextCursor, true); if (current()) more.remove(); })); timeline.append(more); }
    status.textContent = result.items.length ? "Activity timeline loaded." : "No matching activity.";
  }
  timelineForm.addEventListener("submit", event => { event.preventDefault(); void run(loadTimeline, () => readTimeline()); });
  const templateList = node("div"); section.append(node("h3", "Message templates"), templateList);
  let selectedTemplate;
  const templateForm = node("form"), templateId = field(templateForm, "Template ID", "id"), name = field(templateForm, "Template name", "name"), language = field(templateForm, "Template language", "locale", "en", "text", [["en", "English"], ["he", "עברית"]]), audience = field(templateForm, "Template audience", "audience", "guest", "text", [["guest", "Guest"], ["staff", "Staff"]]);
  const label = node("label", "Template message"), text = node("textarea", undefined, { name: "text", "aria-label": "Template message", required: "", maxlength: "2000" }); label.append(text); templateForm.append(label, node("p", "Placeholders: {{guestName}}, {{propertyName}}, {{roomName}}, {{startsAt}}, {{endsAt}}, {{inviteUrl}}, {{status}}. Preview uses a placeholder for the private link."));
  const saveTemplate = node("button", "Save message template", { type: "submit" }); templateForm.append(saveTemplate);
  if (manager) section.append(templateForm);
  templateId.addEventListener("input", () => { selectedTemplate = undefined; });
  async function readTemplates(cursor, append = false) {
    const result = await portalRequest(user, `${root}/operations/templates?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`);
    if (!current()) return; if (!append) { templateList.replaceChildren(); staffTemplates.clear(); }
    for (const item of result.items) {
      if (item.audience === "staff") staffTemplates.set(item.id, item);
      const row = node("article"); row.append(node("p", `${item.name} · ${item.locale} · ${item.audience}`));
      if (manager) { const edit = node("button", "Edit message template", { type: "button" }); edit.addEventListener("click", () => { selectedTemplate = item; templateId.value = item.id; name.value = item.name; language.value = item.locale; audience.value = item.audience; text.value = item.text; }); row.append(edit); }
      const preview = node("button", "Preview message template", { type: "button" }), output = node("p"); preview.addEventListener("click", () => run(preview, async () => { const result = await portalRequest(user, `${root}/operations/templates/${encodeURIComponent(item.id)}/preview`, "POST", item.audience === "staff" ? { status: "automation.failed" } : {}); if (current()) { output.textContent = result.preview; output.dir = result.locale === "he" ? "rtl" : "ltr"; } })); row.append(preview, output); templateList.append(row);
    }
    drawStaffTemplates();
    if (result.nextCursor) { const more = node("button", "Load more message templates", { type: "button" }); more.addEventListener("click", () => run(more, async () => { await readTemplates(result.nextCursor, true); if (current()) more.remove(); })); templateList.append(more); }
  }
  templateForm.addEventListener("submit", event => { event.preventDefault(); if (!templateForm.reportValidity()) return; void run(saveTemplate, async () => { const result = await write(`/templates/${encodeURIComponent(templateId.value)}`, { name: name.value, locale: language.value, audience: audience.value, text: text.value, ...(selectedTemplate ? { version: selectedTemplate.version } : {}) }); if (current()) { selectedTemplate = result.template; await readTemplates(); status.textContent = "Message template saved."; } }); });
  await readTemplates();
  if (manager) {
    const usageForm = node("form"), today = new Date().toISOString().slice(0, 10), from = field(usageForm, "Usage from date", "from", today.slice(0, 8) + "01", "date"), to = field(usageForm, "Usage to date", "to", today, "date"), keyId = field(usageForm, "Usage API key ID", "apiKeyId"); keyId.required = false;
    const load = node("button", "Load API usage", { type: "submit" }), rows = node("div"); usageForm.append(load); section.append(node("h3", "API creation usage"), usageForm, rows);
    async function readUsage(cursor, append = false) {
      const result = await portalRequest(user, `${root}/operations/usage?${new URLSearchParams({ from: from.value, to: to.value, limit: "100", ...(keyId.value ? { apiKeyId: keyId.value } : {}), ...(cursor ? { cursor } : {}) })}`);
      if (!current()) return; if (!append) rows.replaceChildren();
      for (const item of result.items) rows.append(node("p", `${item.date} · ${item.apiKeyId} · total ${item.total} · created ${item.created} · replay ${item.replay ?? 0} · errors ${item.error ?? 0} · physical gate invitations ${item.physicalGateInvitations}`));
      const download = node("button", "Export this usage page", { type: "button" });
      download.addEventListener("click", () => {
        downloadHostCsv(result.items, ["date", "apiKeyId", "created", "total", "replay", "error", "physicalGateInvitations"], "wifigate-usage-page.csv");
      }); rows.append(download);
      if (result.nextCursor) { const more = node("button", "Load more usage", { type: "button" }); more.addEventListener("click", () => run(more, async () => { await readUsage(result.nextCursor, true); if (current()) more.remove(); })); rows.append(more); }
      status.textContent = "API usage loaded. Each export contains one bounded page.";
    }
    usageForm.addEventListener("submit", event => { event.preventDefault(); if (usageForm.reportValidity()) void run(load, () => readUsage()); });
  }
  if (role === "owner") {
    const lifecycle = node("form"), lifecycleStatus = node("p"), action = field(lifecycle, "Subscription action", "action", "activate", "text", [["start-trial", "Start trial"], ["activate", "Activate / keep service"], ["cancel", "Cancel with grace period"]]), reason = field(lifecycle, "Subscription change reason", "reason"); reason.minLength = 5; reason.maxLength = 200;
    const loadSubscription = node("button", "Load subscription", { type: "button" }), changeSubscription = node("button", "Apply subscription change", { type: "submit", disabled: "" }); let subscription;
    lifecycle.append(loadSubscription, changeSubscription, lifecycleStatus); section.append(node("h3", "Customer lifecycle"), node("p", "Internal pricing proposal. Subscription actions are audited and do not charge a payment method. Cancellation allows seven days of service; already imported offline passes remain valid until their expiry."), lifecycle);
    loadSubscription.addEventListener("click", () => run(loadSubscription, async () => { const response = await portalRequest(user, `${root}/billing/subscription`); if (current()) { subscription = response.subscription; lifecycleStatus.textContent = `${subscription.effectiveStatus ?? subscription.status} · revision ${subscription.version}${subscription.trialEndsAt ? ` · trial ends ${subscription.trialEndsAt}` : ""}${subscription.graceEndsAt ? ` · grace ends ${subscription.graceEndsAt}` : ""}`; changeSubscription.disabled = false; } }));
    lifecycle.addEventListener("submit", event => { event.preventDefault(); if (!subscription || !lifecycle.reportValidity()) return; void run(changeSubscription, async () => {
      const body = { action: action.value, reason: reason.value, ...(subscription.version ? { version: subscription.version } : {}) }, signature = `subscription:${JSON.stringify(body)}`;
      if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
      const response = await portalRequest(user, `${root}/billing/subscription`, "POST", body, attempts.get(signature)); if (current()) { subscription = response.subscription; lifecycleStatus.textContent = `${subscription.effectiveStatus ?? subscription.status} · revision ${subscription.version}`; status.textContent = "Subscription change saved and audited."; }
    }); });
    const form = node("form"), month = field(form, "Pricing preview month", "month", new Date().toISOString().slice(0, 7), "month"), preview = node("button", "Preview monthly pricing", { type: "submit" }), output = node("p");
    form.append(preview, output); section.append(node("h3", "Internal pricing proposal"), node("p", "This estimate does not issue an invoice or charge a payment method."), form);
    form.addEventListener("submit", event => { event.preventDefault(); if (!form.reportValidity()) return; void run(preview, async () => { const { preview: value } = await portalRequest(user, `${root}/billing/preview?${new URLSearchParams({ month: month.value })}`); if (current()) { output.textContent = `${value.plan} · ${value.activePhysicalSystems} verified physical gates · estimated USD ${(value.monthlyEstimateCents / 100).toFixed(2)} · unverified excluded ${value.unverifiedPhysicalSystems}`; status.textContent = "Internal monthly estimate loaded."; } }); });
  }
  if (current()) status.textContent = "Operations loaded.";
}
