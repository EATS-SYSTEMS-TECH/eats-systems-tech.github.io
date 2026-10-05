import { portalRequest } from "./api/index.js";
import { renderHostApiKeys } from "./host-api-keys.js";
import { renderHostIntegrations } from "./host-integrations.js";
import { renderHostAutomation } from "./host-automation.js";
import { node, field } from "./host-ui.js";
import { renderHostCalendar, clearHostCalendar } from "./host-calendar.js";

const root = document.querySelector("#host-management");
const attempts = new Map();
let generation = 0;
let currentUser;
let currentIdentity;
let organizations = [];
let selectedId;
let preferredOrganizationId;
let sessionUid;
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const path = (suffix = "") => `/api/v1/organizations/${encodeURIComponent(selectedId)}${suffix}`;
const message = (error) => ({
  TOTP_REQUIRED: "Verify your authenticator to manage this organization.",
  TENANT_ACCESS_DENIED: "Your access to this organization is unavailable. Refresh your account.",
  VERSION_CONFLICT: "This record changed. Refresh before saving again.",
  RESOURCE_IN_USE: "This record is in use. Update its rooms or reservations first.",
  LAST_OWNER_PROTECTED: "At least one active owner must remain.",
  USER_NOT_FOUND: "The approved user must sign in with their verified email first.",
  IDEMPOTENCY_CONFLICT: "This saved attempt has different data. Refresh and try again.",
}[error.code] || "The request could not be completed. You can retry.");
function actionForm(container, title, resourcePath, method, fields, transform = (values) => values, success) {
  const section = node("details");
  section.append(node("summary", title));
  const form = node("form");
  fields(form);
  const submit = node("button", title, { type: "submit" });
  const status = node("p", "", { role: "status", "aria-live": "polite" });
  form.append(submit, status);
  section.append(form);
  container.append(section);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const epoch = generation;
    const input = transform(Object.fromEntries(new FormData(form)));
    submit.disabled = true;
    const fingerprint = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify([resourcePath, method, input]))))].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    if (epoch !== generation) return;
    let key = attempts.get(fingerprint);
    if (!key) { key = crypto.randomUUID(); attempts.set(fingerprint, key); }
    submit.disabled = true;
    status.textContent = "Saving…";
    try {
      const result = await portalRequest(currentUser, resourcePath, method, input, key);
      if (epoch !== generation) return;
      attempts.delete(fingerprint);
      if (success) success(result);
      await loadHostManagement(currentUser, currentIdentity, selectedId);
    } catch (error) { if (epoch === generation) status.textContent = message(error); }
    finally { if (epoch === generation) submit.disabled = false; }
  });
}
export function clearHostManagement({ sessionEnded = false } = {}) {
  clearHostCalendar();
  generation++;
  currentUser = undefined;
  currentIdentity = undefined;
  if (selectedId) preferredOrganizationId = selectedId;
  selectedId = undefined;
  organizations = [];
  if (sessionEnded) { attempts.clear(); sessionTransfer = undefined; sessionUid = undefined; preferredOrganizationId = undefined; }
  root.replaceChildren();
  const reference = document.querySelector(".calendar-reference");
  if (reference) reference.hidden = false;
}
async function renderResources(container, kind, values, canWrite, properties, cursor, epoch) {
  const section = node("section", undefined, { "aria-label": kind });
  section.append(node("h3", kind === "properties" ? "Properties" : kind === "rooms" ? "Rooms" : "Team"));
  const list = node("ul", undefined, { class: "host-resource-list" });
  const inputs = (form, resource = {}) => {
    if (kind === "members") {
      field(form, "Verified email", "email", resource.email || "", "email");
      field(form, "Role", "role", resource.role || "staff", "text", ["owner", "admin", "staff", "viewer"].map((id) => [id, id]));
      field(form, "Access", "status", resource.status || "active", "text", [["active", "Active"], ["blocked", "Blocked"]]);
    } else {
      field(form, "Name", "name", resource.name || "");
      if (kind === "properties") {
        field(form, "IANA timezone", "timezone", resource.timezone || timezone);
        const address = field(form, "Address (optional)", "address", resource.address || ""); address.required = false; address.maxLength = 300;
      } else {
        field(form, "Property", "propertyId", resource.propertyId || properties[0]?.id || "", "text", properties.map((property) => [property.id, property.name]));
        const capacity = field(form, "Capacity", "capacity", resource.capacity || 2, "number"); capacity.min = "1"; capacity.max = "100";
      }
    }
  };
  for (const resource of values) {
    const item = node("li");
    item.append(node("strong", resource.name || resource.email), node("span", ` ${kind === "members" ? `${resource.role} · ${resource.status}` : kind === "properties" ? resource.timezone : `Capacity ${resource.capacity}`}`));
    if (canWrite) {
      const updatePath = path(`/${kind}${kind === "members" ? "" : `/${encodeURIComponent(resource.id)}`}`);
      actionForm(item, "Edit", updatePath, kind === "members" ? "POST" : "PUT", (form) => inputs(form, resource), (data) => kind === "members" ? data : { ...data, ...(kind === "rooms" ? { capacity: Number(data.capacity) } : {}), version: resource.version });
      if (kind !== "members") actionForm(item, "Delete", updatePath, "DELETE", (form) => form.append(node("p", "This removes the record from active use.")), () => ({ version: resource.version }));
    }
    list.append(item);
  }
  section.append(list);
  if (!values.length) section.append(node("p", "No records yet."));
  if (canWrite && (kind !== "rooms" || properties.length)) actionForm(section, `Add ${kind === "properties" ? "property" : kind === "rooms" ? "room" : "team member"}`, path(`/${kind}`), "POST", (form) => inputs(form), (data) => kind === "rooms" ? { ...data, capacity: Number(data.capacity) } : data);
  if (cursor) {
    const more = node("button", "Load more", { type: "button" });
    more.addEventListener("click", async () => {
      more.disabled = true;
      try {
        const result = await portalRequest(currentUser, path(`/${kind}?limit=100&cursor=${encodeURIComponent(cursor)}`));
        if (epoch !== generation) return;
        section.remove();
        await renderResources(container, kind, [...values, ...result.items], canWrite, properties, result.nextCursor, epoch);
      } catch (error) { if (epoch === generation) { more.disabled = false; more.textContent = message(error); } }
    });
    section.append(more);
  }
  container.append(section);
}
async function renderInventory(container, org, properties, rooms, epoch, loadedPage) {
  const section = node("section", undefined, { "aria-label": "WIFIGATE systems" });
  section.append(node("h3", "WIFIGATE systems"));
  container.append(section);
  const manager = ["owner", "admin"].includes(org.membership.role);
  const mappingFields = (form, resource = {}) => {
    const property = field(form, "Property", "propertyId", resource.propertyId || properties[0]?.id || "", "text", properties.map((item) => [item.id, item.name]));
    const room = field(form, "Room (optional)", "roomId", resource.roomId || "", "text", [["", "Property access"], ...rooms.filter((item) => item.propertyId === property.value).map((item) => [item.id, item.name])]);
    room.required = false;
    property.addEventListener("change", () => { room.replaceChildren(node("option", "Property access", { value: "" }), ...rooms.filter((item) => item.propertyId === property.value).map((item) => node("option", item.name, { value: item.id }))); });
  };
  try {
    const [page, catalog] = await Promise.all([loadedPage ? Promise.resolve(loadedPage) : portalRequest(currentUser, path("/systems?limit=100")), portalRequest(currentUser, path("/systems/icons"))]);
    if (epoch !== generation) return;
    const list = node("ul", undefined, { class: "host-resource-list" });
    for (const system of page.items ?? []) {
      const row = node("li");
      row.append(node("img", undefined, { src: `/assets/host-icons/${system.type}-${system.iconId}.svg`, alt: "", width: "48", height: "48" }), node("strong", system.name), node("p", `${system.type} · ${system.status} · ${system.systemIds.length} physical gates`), node("p", `Fingerprint: ${system.fingerprint}`));
      if (manager) {
        actionForm(row, "System settings", path(`/systems/${system.id}`), "PUT", (form) => {
          mappingFields(form, system);
          field(form, "Icon", "iconId", system.iconId, "text", catalog.icons[system.type].map((id) => [id, id.replaceAll("-", " ")]));
          field(form, "Status", "status", system.status, "text", [["active", "Active"], ["disabled", "Disabled"]]);
        }, (data) => ({ ...data, roomId: data.roomId || null, version: system.version }));
        actionForm(row, "Rotate Host key", path(`/systems/${system.id}/rotate`), "POST", (form) => { const secret = field(form, "New Host key", "encryptedKeyValue", "", "password"); secret.maxLength = 12288; secret.autocomplete = "off"; }, (data) => ({ encryptedKeyValue: data.encryptedKeyValue.trim(), version: system.version }));
        if (org.membership.role === "owner" && system.status === "active") actionForm(row, "Approve organization transfer", path(`/systems/${system.id}/transfers`), "POST", (form) => { field(form, "Destination organization ID", "targetOrganizationId"); form.append(node("p", "The destination owner must accept this transfer with the same Host key. Acceptance disables every source target containing these gates.")); }, (data) => ({ ...data, version: system.version }), (value) => {
          // Keep only the non-secret transfer reference for the owner to share.
          sessionTransfer = value.transfer.id;
        });
      }
      list.append(row);
    }
    section.append(list);
    if (org.membership.role === "owner") {
      const transfers = await portalRequest(currentUser, path("/systems/transfers?limit=100"));
      if (epoch !== generation) return;
      const history = node("details"); history.append(node("summary", "Organization transfers"));
      for (const transfer of transfers.items ?? []) {
        const item = node("div");
        item.append(node("p", `Transfer ${transfer.id} · ${transfer.status} · Destination ${transfer.targetOrganizationId} · Expires ${new Date(transfer.expiresAt).toLocaleString()}`));
        if (transfer.status === "pending") actionForm(item, "Cancel transfer", path(`/systems/transfers/${transfer.id}/cancel`), "POST", () => {}, () => ({}));
        history.append(item);
      }
      section.append(history);
    }
    if (!page.items?.length) section.append(node("p", "No connected systems yet."));
    if (page.nextCursor) {
      const more = node("button", "Load more systems", { type: "button" });
      more.addEventListener("click", async () => {
        more.disabled = true;
        try {
          const next = await portalRequest(currentUser, path(`/systems?limit=100&cursor=${encodeURIComponent(page.nextCursor)}`));
          if (epoch !== generation) return;
          section.remove();
          await renderInventory(container, org, properties, rooms, epoch, { items: [...page.items, ...next.items], nextCursor: next.nextCursor });
        } catch (error) { if (epoch === generation) { more.disabled = false; more.textContent = message(error); } }
      });
      section.append(more);
    }
    if (!manager || !properties.length) return;
    const details = node("details");
    details.append(node("summary", "Connect WIFIGATE system"));
    const previewForm = node("form");
    const input = field(previewForm, "WIFIGATE Host key", "encryptedKeyValue", "", "password"); input.maxLength = 12288; input.autocomplete = "off";
    const previewButton = node("button", "Validate key", { type: "submit" });
    const status = node("p", "", { role: "status", "aria-live": "polite" });
    const candidate = node("div");
    previewForm.append(previewButton, status);
    details.append(previewForm, candidate);
    section.append(details);
    previewForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (previewButton.disabled) return;
      previewButton.disabled = true;
      candidate.replaceChildren();
      const encryptedKeyValue = input.value.trim();
      try {
        const response = await portalRequest(currentUser, path("/systems/preview"), "POST", { encryptedKeyValue });
        if (epoch !== generation) return;
        input.value = "";
        const preview = response.preview;
        status.textContent = `${preview.name} · ${preview.type} · ${preview.systemCount} gates · Fingerprint ${preview.fingerprint}`;
        const connect = node("form");
        mappingFields(connect);
        field(connect, "Icon", "iconId", preview.iconId, "text", catalog.icons[preview.type].map((id) => [id, id.replaceAll("-", " ")]));
        if (!preview.available) {
          if (org.membership.role !== "owner") { status.textContent += " · Already claimed. An owner must arrange a transfer."; return; }
          field(connect, "Approved transfer ID", "transferId");
          connect.append(node("p", "This key is already claimed. An approved transfer from its current owner is required."));
        }
        const submit = node("button", preview.available ? "Connect system" : "Accept transfer", { type: "submit" });
        const resultStatus = node("p", "", { role: "status", "aria-live": "polite" });
        connect.append(submit, resultStatus); candidate.append(connect);
        let attempt;
        connect.addEventListener("submit", async (e) => {
          e.preventDefault(); if (submit.disabled) return;
          const fields = Object.fromEntries(new FormData(connect));
          const data = { ...fields, roomId: fields.roomId || null, encryptedKeyValue };
          const signature = JSON.stringify(fields);
          if (!attempt || attempt.signature !== signature) attempt = { signature, key: crypto.randomUUID() };
          submit.disabled = true;
          try {
            await portalRequest(currentUser, path(preview.available ? "/systems" : "/systems/transfers/accept"), "POST", data, attempt.key);
            if (epoch === generation) await loadHostManagement(currentUser, currentIdentity, selectedId);
          } catch (error) { if (epoch === generation) resultStatus.textContent = message(error); }
          finally { if (epoch === generation) submit.disabled = false; }
        });
      } catch (error) { if (epoch === generation) status.textContent = message(error); }
      finally { if (epoch === generation) previewButton.disabled = false; }
    });
  } catch (error) { if (epoch === generation) section.append(node("p", message(error), { role: "status" })); }
}
let sessionTransfer;
export async function loadHostManagement(user, identity, preferredId) {
  if (sessionUid !== user.uid) { attempts.clear(); sessionTransfer = undefined; preferredOrganizationId = undefined; sessionUid = user.uid; }
  const epoch = ++generation;
  currentUser = user;
  currentIdentity = identity;
  root.replaceChildren(node("h2", "Organizations"), node("p", "Loading your organizations…", { role: "status" }));
  try {
    const result = await portalRequest(user, "/api/v1/organizations?limit=100");
    if (epoch !== generation) return;
    organizations = Array.isArray(result.organizations) ? result.organizations : [];
    root.replaceChildren(node("h2", "Organizations"));
    if (identity.role === "admin") actionForm(root, "Create organization", "/api/v1/organizations", "POST", (form) => { field(form, "Organization name", "name"); field(form, "IANA timezone", "timezone", timezone); }, undefined, (value) => { selectedId = value.organization.id; });
    if (!organizations.length) { root.append(node("p", "No active organization memberships. An owner can add your verified email.")); return; }
    const preferred = preferredId ?? preferredOrganizationId;
    selectedId = organizations.some((org) => org.id === preferred) ? preferred : organizations[0].id;
    preferredOrganizationId = selectedId;
    const selection = node("form");
    const select = field(selection, "Organization", "organization", selectedId, "text", organizations.map((org) => [org.id, org.name]));
    root.append(selection);
    select.addEventListener("change", () => void loadHostManagement(user, identity, select.value));
    const org = organizations.find((entry) => entry.id === selectedId);
    const owner = org.membership.role === "owner";
    const manager = owner || org.membership.role === "admin";
    root.append(node("p", `${org.timezone} · Your role: ${org.membership.role}`));
    root.append(node("p", `Organization ID: ${org.id}`));
    if (sessionTransfer) root.append(node("p", `Approved transfer ID: ${sessionTransfer}`));
    if (owner) actionForm(root, "Organization settings", path(), "PUT", (form) => { field(form, "Organization name", "name", org.name); field(form, "IANA timezone", "timezone", org.timezone); }, (data) => ({ ...data, version: org.version }));
    const [properties, rooms, members] = await Promise.all([
      portalRequest(user, path("/properties?limit=100")), portalRequest(user, path("/rooms?limit=100")),
      owner ? portalRequest(user, path("/members?limit=100")) : Promise.resolve({ items: [] }),
    ]);
    if (epoch !== generation) return;
    await renderResources(root, "properties", properties.items, manager, [], properties.nextCursor, epoch);
    await renderResources(root, "rooms", rooms.items, manager, properties.items, rooms.nextCursor, epoch);
    if (owner) await renderResources(root, "members", members.items, owner, [], members.nextCursor, epoch);
    await renderInventory(root, org, properties.items, rooms.items, epoch);
    if (epoch !== generation) return;
    await renderHostCalendar({ container: root, user, organization: org, properties: properties.items, rooms: rooms.items, isCurrent: () => epoch === generation });
    if (epoch !== generation) return;
    await renderHostApiKeys({ container: root, user, organization: org, isCurrent: () => epoch === generation });
    if (epoch !== generation) return;
    await renderHostIntegrations({ container: root, user, organization: org, properties: properties.items, rooms: rooms.items, isCurrent: () => epoch === generation });
    if (epoch !== generation) return;
    await renderHostAutomation({ container: root, user, organization: org, properties: properties.items, isCurrent: () => epoch === generation });
  } catch (error) {
    if (epoch !== generation) return;
    root.replaceChildren(node("h2", "Organizations"), node("p", message(error), { role: "status" }));
    if (error.code === "TOTP_REQUIRED") {
      const verify = node("button", "Verify authenticator", { type: "button" });
      verify.addEventListener("click", () => window.dispatchEvent(new CustomEvent("host:totp-required")));
      root.append(verify);
    }
    const retry = node("button", "Refresh organizations", { type: "button" });
    retry.addEventListener("click", () => void loadHostManagement(user, identity, preferredId));
    root.append(retry);
  }
}
