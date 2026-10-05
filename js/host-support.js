import {portalRequest} from "./api/index.js";
import {field, node} from "./host-ui.js";
const messages = {
  RECENT_AUTH_REQUIRED: "Sign out and sign in again with your authenticator before using support access.",
  TOTP_REQUIRED: "Verify your authenticator before using support access.",
  SUPPORT_ACCESS_DENIED: "This support approval is unavailable, expired or revoked.",
  SUPPORT_RECIPIENT_UNAVAILABLE: "The support administrator must have active portal approval and an authenticator.",
  VERSION_CONFLICT: "The support approval changed. Refresh before retrying.",
  SUPPORT_CAPACITY_EXCEEDED: "This organization needs an operator capacity review before loading diagnostics.",
};
export function renderSupportDiagnostics({container, user, identity, isCurrent}) {
  if (identity.role !== "admin") return;
  const section = node("section", undefined, {"aria-label": "Approved support diagnostics"}), form = node("form"), org = field(form, "Support organization ID", "orgId"), grant = field(form, "Support approval ID", "grantId"), load = node("button", "Read approved support diagnostics", {type: "submit"}), output = node("div", undefined, {"aria-live": "polite"});
  org.pattern = grant.pattern = "[A-Za-z0-9_-]{1,100}";
  form.append(load); section.append(node("h2", "Approved support diagnostics"), node("p", "Read anonymous queue-state counts using an owner's temporary approval. This does not add membership or grant access to guest records, keys or system changes."), form, output); container.append(section);
  let busy = false;
  const current = () => isCurrent() && section.isConnected;
  form.addEventListener("submit", event => {event.preventDefault(); if (busy || !current() || !form.reportValidity()) return; busy = true; load.disabled = true; output.replaceChildren();
    void portalRequest(user, `/api/v1/organizations/${encodeURIComponent(org.value)}/support/grants/${encodeURIComponent(grant.value)}/diagnostics`).then(result => {
      if (!current()) return;
      output.append(node("p", `Support approval expires: ${new Date(result.diagnostics.expiresAt).toLocaleString()}`));
      for (const [source, values] of Object.entries(result.diagnostics.sources)) output.append(node("p", `${source} · records ${values.records} · ${Object.entries(values.statuses).map(([status, count]) => `${status}: ${count}`).join(" · ") || "No queued work"}`));
    }).catch(error => {if (current()) output.append(node("p", messages[error.code] || "Support diagnostics could not be loaded."));}).finally(() => {busy = false; if (current()) load.disabled = false;});
  });
}
export async function renderSupportOwner({container, user, organization, isCurrent}) {
  if (organization.membership.role !== "owner") return;
  const section = node("section", undefined, {"aria-label": "Temporary support access"}), status = node("p", undefined, {role: "status", "aria-live": "polite"}), rows = node("div"), form = node("form"), email = field(form, "Support administrator email", "email", "", "email"), duration = field(form, "Support duration", "durationMinutes", "15", "text", [["5", "5 minutes"], ["15", "15 minutes"], ["30", "30 minutes"], ["60", "1 hour"]]), purpose = field(form, "Support purpose", "purpose", "delivery", "text", [["access", "Access"], ["delivery", "Delivery"], ["synchronization", "Synchronization"], ["capacity", "Capacity"]]), create = node("button", "Approve temporary support", {type: "submit"}), refresh = node("button", "Refresh support approvals", {type: "button"});
  form.append(create); section.append(node("h2", "Temporary support access"), node("p", "An approved administrator with an authenticator can view anonymous operational counts for the selected time. The approval expires automatically and can be revoked immediately."), form, refresh, status, rows); container.append(section);
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/support/grants`, keys = new Map();
  const current = () => isCurrent() && section.isConnected;
  let busy = false;
  async function run(button, operation) {if (busy || !current()) return; busy = true; button.disabled = true; try {await operation();} catch (error) {if (current()) status.textContent = messages[error.code] || "Support access could not be changed.";} finally {busy = false; if (current()) button.disabled = false;}}
  const write = (path, body) => {const signature = JSON.stringify([path, body]); if (!keys.has(signature)) keys.set(signature, crypto.randomUUID()); return portalRequest(user, root + path, "POST", body, keys.get(signature));};
  async function load(cursor, append = false) {
    const result = await portalRequest(user, `${root}?${new URLSearchParams({limit: "50", ...(cursor ? {cursor} : {})})}`);
    if (!current()) return; if (!append) rows.replaceChildren();
    for (const item of result.items) {
      const row = node("article"); row.append(node("p", `${item.purpose} · ${item.status} · expires ${new Date(item.endsAt).toLocaleString()}`), node("p", `Support approval ID: ${item.id}`), node("p", `Support organization ID: ${organization.id}`));
      if (item.status === "active") {const revoke = node("button", "Revoke support approval", {type: "button"}); revoke.addEventListener("click", () => run(revoke, async () => {await write(`/${encodeURIComponent(item.id)}/revoke`, {version: item.version}); await load(); if (current()) status.textContent = "Support approval revoked.";})); row.append(revoke);}
      rows.append(row);
    }
    if (!result.items.length) rows.append(node("p", "No support approvals on this page."));
    if (result.nextCursor) {const more = node("button", "Load more support approvals", {type: "button"}); more.addEventListener("click", () => run(more, async () => {await load(result.nextCursor, true); if (current()) more.remove();})); rows.append(more);}
  }
  refresh.addEventListener("click", () => run(refresh, () => load()));
  form.addEventListener("submit", event => {event.preventDefault(); if (!form.reportValidity()) return; void run(create, async () => {const body = {email: email.value.trim(), durationMinutes: Number(duration.value), purpose: purpose.value}; const result = await write("", body); await load(); if (current()) {status.textContent = `Support approval created: ${result.grant.id}`; keys.delete(JSON.stringify(["", body]));}});});
  await run(refresh, () => load());
}
