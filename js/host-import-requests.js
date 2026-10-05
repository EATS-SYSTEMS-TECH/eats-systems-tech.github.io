import { portalRequest } from "./api/index.js";
import { field, node } from "./host-ui.js";
export async function renderHostImportRequests({ container, user, organization, isCurrent }) {
  if (!["owner", "admin"].includes(organization.membership.role)) return;
  const root = `/api/v1/organizations/${encodeURIComponent(organization.id)}/systems/import-requests`, section = node("section", undefined, { "aria-label": "System import approvals" }), status = node("p", "Loading system import requests…", { role: "status", "aria-live": "polite" }), rows = node("div");
  section.append(node("h2", "System import approvals"), node("p", "Review the requester's property mapping and gate ownership before approving. Every gate requires a verified local administrator proof; approval rechecks live membership and ownership."), status, rows); container.append(section);
  const current = () => isCurrent() && section.isConnected;
  const attempts = new Map(); let busy = false;
  async function load(cursor, append = false) {
    const result = await portalRequest(user, `${root}?${new URLSearchParams({ limit: "50", ...(cursor ? { cursor } : {}) })}`);
    if (!current()) return; if (!append) rows.replaceChildren();
    for (const item of result.items) {
      const row = node("article"); row.append(node("p", `${item.id} · requester ${item.requesterUid} · ${item.gateCount} physical gates · ${item.status} · expires ${item.expiresAt}`), node("p", `Target ${item.targetType} / ${item.targetId} · property ${item.propertyId} · room ${item.roomId ?? "Whole property"}`));
      if (item.status === "pending" && Date.parse(item.expiresAt) > Date.now()) {
        const form = node("form"), reason = field(form, "Import review reason", "reason"); reason.minLength = 5; reason.maxLength = 200;
        for (const action of ["approve", "reject"]) {
          const button = node("button", action === "approve" ? "Approve system import" : "Reject system import", { type: "button" }); form.append(button);
          button.addEventListener("click", async () => {
            if (busy || !current() || !form.reportValidity()) return;
            busy = true; button.disabled = true;
            const body = { version: item.version, reason: reason.value }, signature = `${item.id}:${action}:${JSON.stringify(body)}`;
            if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
            try { await portalRequest(user, `${root}/${encodeURIComponent(item.id)}/${action}`, "POST", body, attempts.get(signature)); if (current()) { await load(); status.textContent = action === "approve" ? "System import approved and connected atomically." : "System import rejected. No gate ownership was changed."; } }
            catch { if (current()) status.textContent = "Import review failed. Refresh and verify membership, ownership, expiry and TOTP before retrying."; }
            finally { busy = false; if (current()) button.disabled = false; }
          });
        }
        form.addEventListener("submit", event => event.preventDefault()); row.append(form);
      }
      rows.append(row);
    }
    if (result.nextCursor) { const more = node("button", "Load more system import requests", { type: "button" }); more.addEventListener("click", async () => { if (busy) return; busy = true; more.disabled = true; try { await load(result.nextCursor, true); if (current()) more.remove(); } catch { if (current()) status.textContent = "Unable to load more requests."; } finally { busy = false; if (current()) more.disabled = false; } }); rows.append(more); }
    status.textContent = result.items.length ? "System import requests loaded." : "No system import requests.";
  }
  const refresh = node("button", "Refresh system import requests", { type: "button" }); refresh.addEventListener("click", async () => { if (busy) return; busy = true; refresh.disabled = true; try { await load(); } catch { if (current()) status.textContent = "Unable to refresh requests."; } finally { busy = false; if (current()) refresh.disabled = false; } }); section.append(refresh);
  await load();
}
