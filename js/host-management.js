import { portalRequest } from "./api/index.js";

const root = document.querySelector("#host-management");
const attempts = new Map();
let generation = 0;
let currentUser;
let currentIdentity;
let organizations = [];
let selectedId;
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const node = (tag, text, attrs = {}) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  return element;
};
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
function field(form, label, name, value = "", type = "text", options) {
  const wrapper = node("label", label);
  const input = node(options ? "select" : "input", undefined, { name });
  if (options) for (const [id, text] of options) input.append(node("option", text, { value: id }));
  else { input.type = type; input.required = true; input.maxLength = name === "email" ? 254 : 120; }
  input.value = value;
  wrapper.append(input);
  form.append(wrapper);
  return input;
}
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
    const fingerprint = JSON.stringify([resourcePath, method, input]);
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
export function clearHostManagement() {
  generation++;
  currentUser = undefined;
  currentIdentity = undefined;
  selectedId = undefined;
  organizations = [];
  attempts.clear();
  root.replaceChildren();
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
export async function loadHostManagement(user, identity, preferredId) {
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
    selectedId = organizations.some((org) => org.id === preferredId) ? preferredId : organizations[0].id;
    const selection = node("form");
    const select = field(selection, "Organization", "organization", selectedId, "text", organizations.map((org) => [org.id, org.name]));
    root.append(selection);
    select.addEventListener("change", () => void loadHostManagement(user, identity, select.value));
    const org = organizations.find((entry) => entry.id === selectedId);
    const owner = org.membership.role === "owner";
    const manager = owner || org.membership.role === "admin";
    root.append(node("p", `${org.timezone} · Your role: ${org.membership.role}`));
    if (owner) actionForm(root, "Organization settings", path(), "PUT", (form) => { field(form, "Organization name", "name", org.name); field(form, "IANA timezone", "timezone", org.timezone); }, (data) => ({ ...data, version: org.version }));
    const [properties, rooms, members] = await Promise.all([
      portalRequest(user, path("/properties?limit=100")), portalRequest(user, path("/rooms?limit=100")),
      owner ? portalRequest(user, path("/members?limit=100")) : Promise.resolve({ items: [] }),
    ]);
    if (epoch !== generation) return;
    await renderResources(root, "properties", properties.items, manager, [], properties.nextCursor, epoch);
    await renderResources(root, "rooms", rooms.items, manager, properties.items, rooms.nextCursor, epoch);
    if (owner) await renderResources(root, "members", members.items, owner, [], members.nextCursor, epoch);
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
