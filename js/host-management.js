import { hostText, hostLocale } from "./host-locale.js";
import { roleBadge, accessBadge } from "./host-role-badge.js";
import { renderEmptyHostCalendar } from "./host-empty-calendar.js";
import {
  renderPendingMembershipInvitations,
  renderOwnerMembershipInvitations,
} from "./host-membership-invitations.js";
import { portalRequest } from "./api/index.js";
import { readHostPages } from "./host-pages.js";
import { renderHostApiKeys } from "./host-api-keys.js";
import { renderHostIntegrations } from "./host-integrations.js";
import { renderHostAutomation } from "./host-automation.js";
import { renderHostOperations } from "./host-operations.js";
import { renderHostImportRequests } from "./host-import-requests.js";
import {
  renderSupportDiagnostics,
  renderSupportOwner,
} from "./host-support.js";
import { node, field, hostDateTime } from "./host-ui.js";
import { renderHostCalendar, clearHostCalendar } from "./host-calendar.js";
import {
  allowedWorkspaceViews,
  workspaceLocation,
} from "./host-workspace-model.js";
import { renderHostBilling } from "./host-billing.js";

const root = document.querySelector("#host-management");
const attempts = new Map();
let generation = 0;
let currentUser;
let currentIdentity;
let organizations = [];
let selectedId;
let preferredOrganizationId;
let sessionUid;
let navigateWorkspace;
let managementRefreshPending = false;
const requestedOrganization = () =>
  new URLSearchParams(location.search).get("org");
function rememberOrganization(id) {
  const url = new URL(location.href);
  if (id) url.searchParams.set("org", id);
  else url.searchParams.delete("org");
  if (url.href !== location.href) history.replaceState(null, "", url);
}
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const path = (suffix = "") =>
  `/api/v1/organizations/${encodeURIComponent(selectedId)}${suffix}`;
const message = (error) =>
  ({
    RESOURCE_CAPACITY_EXCEEDED: hostText(
      "This organization needs a capacity review before loading all resources. Contact support.",
    ),
    TOTP_REQUIRED: hostText(
      "Verify your authenticator to manage this organization.",
    ),
    TENANT_ACCESS_DENIED: hostText(
      "Your access to this organization is unavailable. Refresh your account.",
    ),
    VERSION_CONFLICT: hostText(
      "This record changed. Refresh before saving again.",
    ),
    RESOURCE_IN_USE: hostText(
      "This record is in use. Update its rooms or reservations first.",
    ),
    LAST_OWNER_PROTECTED: hostText("At least one active owner must remain."),
    USER_NOT_FOUND: hostText(
      "The approved user must sign in with their verified email first.",
    ),
    IDEMPOTENCY_CONFLICT: hostText(
      "This saved attempt has different data. Refresh and try again.",
    ),
    SUBSCRIPTION_UNAVAILABLE: hostText(
      "Service is unavailable. An owner can review the subscription in Billing statements.",
    ),
  })[error.code] ||
  hostText("The request could not be completed. You can retry.");
function actionForm(
  container,
  title,
  resourcePath,
  method,
  fields,
  transform = (values) => values,
  success,
  { submitLabel = title } = {},
) {
  const section = node("details");
  section.append(node("summary", hostText(title)));
  const form = node("form");
  fields(form);
  const submit = node("button", hostText(submitLabel), { type: "submit" });
  const status = node("p", "", { role: "status", "aria-live": "polite" });
  form.append(submit, status);
  section.append(form);
  container.append(section);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    const epoch = generation;
    const view = container.closest("[data-workspace-view]");
    const viewId = view?.dataset.workspaceView;
    const orgId = selectedId;
    const active = () =>
      epoch === generation &&
      section.isConnected &&
      (!viewId || workspaceLocation(new URL(location.href)) === viewId);
    const controls = Array.from(form.elements, (element) => [
      element,
      element.disabled,
    ]);
    try {
      const input = transform(Object.fromEntries(new FormData(form)));
      for (const [control] of controls) control.disabled = true;
      for (const notice of root.querySelectorAll("[data-management-feedback]"))
        notice.remove();
      status.textContent = hostText("Saving…");
      const fingerprint = [
        ...new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(
              JSON.stringify([resourcePath, method, input]),
            ),
          ),
        ),
      ]
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
      if (!active()) return;
      let key = attempts.get(fingerprint);
      if (!key) {
        key = crypto.randomUUID();
        attempts.set(fingerprint, key);
      }
      const result = await portalRequest(
        currentUser,
        resourcePath,
        method,
        input,
        key,
      );
      if (epoch !== generation) return;
      attempts.delete(fingerprint);
      if (success) success(result);
      if (!active()) {
        managementRefreshPending = true;
        return;
      }
      const refresh = loadHostManagement(currentUser, currentIdentity, orgId);
      const refreshEpoch = generation;
      await refresh;
      if (
        refreshEpoch !== generation ||
        (viewId && workspaceLocation(new URL(location.href)) !== viewId)
      )
        return;
      const refreshedView = viewId
        ? root.querySelector(`[data-workspace-view="${viewId}"]`)
        : root;
      if (refreshedView?.dataset.loaded === "true" || refreshedView === root)
        refreshedView.prepend(
          node("p", hostText("Changes saved."), {
            role: "status",
            "aria-live": "polite",
            "data-management-feedback": "true",
          }),
        );
      else
        root.prepend(
          node(
            "p",
            hostText(
              "Changes saved. Refresh the screen to load the updated data.",
            ),
            {
              role: "status",
              "aria-live": "polite",
              "data-management-feedback": "true",
            },
          ),
        );
    } catch (error) {
      if (epoch === generation) status.textContent = message(error);
    } finally {
      if (epoch === generation)
        for (const [control, disabled] of controls) control.disabled = disabled;
    }
  });
}
export function clearHostManagement({ sessionEnded = false } = {}) {
  window.dispatchEvent(new CustomEvent("host:workspace-dispose"));
  clearHostCalendar();
  navigateWorkspace = undefined;
  managementRefreshPending = false;
  root.dataset.workspaceReadFailed = "false";
  generation++;
  root.dataset.requestGeneration = String(generation);
  currentUser = undefined;
  currentIdentity = undefined;
  if (selectedId) preferredOrganizationId = selectedId;
  selectedId = undefined;
  organizations = [];
  if (sessionEnded) {
    attempts.clear();
    sessionTransfer = undefined;
    sessionUid = undefined;
    preferredOrganizationId = undefined;
    rememberOrganization(undefined);
  }
  root.replaceChildren();
  clearOrganizationSelector();
  const reference = document.querySelector(".calendar-reference");
  if (reference) reference.hidden = false;
}
window.addEventListener("host:workspace-navigate", (event) => {
  for (const notice of root.querySelectorAll("[data-management-feedback]"))
    notice.remove();
  void navigateWorkspace?.(event.detail);
});
window.addEventListener("host:operations-filter", async (event) => {
  const filter = event.detail;
  if (
    filter?.workspaceApplied ||
    filter?.orgId !== selectedId ||
    !navigateWorkspace
  )
    return;
  const epoch = generation;
  window.dispatchEvent(
    new CustomEvent("host:workspace-view", { detail: "Calendar" }),
  );
  await navigateWorkspace("calendar");
  if (
    epoch !== generation ||
    root.querySelector('[data-workspace-view="calendar"]')?.dataset.loaded !==
      "true"
  )
    return;
  window.dispatchEvent(
    new CustomEvent("host:operations-filter", {
      detail: { ...filter, workspaceApplied: true },
    }),
  );
});
async function renderResources(
  container,
  kind,
  values,
  canWrite,
  properties,
  cursor,
  epoch,
) {
  const section = node("section", undefined, { "aria-label": kind });
  section.append(
    node(
      "h3",
      kind === "properties"
        ? hostText("Properties")
        : kind === "rooms"
          ? hostText("Rooms")
          : hostText("Team"),
    ),
  );
  const list = node("ul", undefined, { class: "host-resource-list" });
  const inputs = (form, resource = {}) => {
    if (kind === "members") {
      field(form, "Verified email", "email", resource.email || "", "email");
      field(
        form,
        "Role",
        "role",
        resource.role || "staff",
        "text",
        ["owner", "admin", "staff", "viewer"].map((id) => [id, hostText(id)]),
      );
      field(form, "Access", "status", resource.status || "active", "text", [
        ["active", hostText("Active")],
        ["blocked", hostText("Blocked")],
      ]);
    } else {
      field(form, "Name", "name", resource.name || "");
      if (kind === "properties") {
        field(form, "IANA timezone", "timezone", resource.timezone || timezone);
        const address = field(
          form,
          "Address (optional)",
          "address",
          resource.address || "",
        );
        address.required = false;
        address.maxLength = 300;
      } else {
        field(
          form,
          "Property",
          "propertyId",
          resource.propertyId || properties[0]?.id || "",
          "text",
          properties.map((property) => [property.id, property.name]),
        );
        const capacity = field(
          form,
          "Capacity",
          "capacity",
          resource.capacity || 2,
          "number",
        );
        capacity.min = "1";
        capacity.max = "100";
      }
    }
  };
  for (const resource of values) {
    const item = node("li");
    if (kind === "rooms") {
      item.dataset.propertyId = resource.propertyId;
      item.append(
        node(
          "p",
          properties.find((property) => property.id === resource.propertyId)
            ?.name ?? "Archived property",
        ),
      );
    }
    item.append(
      node("strong", resource.name || resource.email),
      node(
        "span",
        ` ${kind === "members" ? `${resource.role} · ${resource.status}` : kind === "properties" ? resource.timezone : `Capacity ${resource.capacity}`}`,
      ),
    );
    if (kind === "members") {
      item
        .querySelector("span")
        .replaceChildren(
          roleBadge(resource.role),
          accessBadge(resource.status),
        );
    }
    if (canWrite) {
      const updatePath = path(
        `/${kind}${kind === "members" ? "" : `/${encodeURIComponent(resource.id)}`}`,
      );
      actionForm(
        item,
        hostText("Edit"),
        updatePath,
        kind === "members" ? "POST" : "PUT",
        (form) => inputs(form, resource),
        (data) =>
          kind === "members"
            ? data
            : {
                ...data,
                ...(kind === "rooms"
                  ? { capacity: Number(data.capacity) }
                  : {}),
                version: resource.version,
              },
      );
      if (kind !== "members")
        actionForm(
          item,
          hostText("Delete"),
          updatePath,
          "DELETE",
          (form) =>
            form.append(
              node("p", hostText("This removes the record from active use.")),
            ),
          () => ({ version: resource.version }),
        );
    }
    list.append(item);
  }
  section.append(list);
  if (kind === "rooms" && properties.length) {
    const filterForm = node("form");
    const selectedProperty = field(
      filterForm,
      "Rooms in property",
      "propertyFilter",
      "",
      "text",
      [
        ["", "All properties"],
        ...properties.map((property) => [property.id, property.name]),
      ],
    );
    filterForm.addEventListener("submit", (event) => event.preventDefault());
    selectedProperty.addEventListener("change", () => {
      for (const item of list.children)
        item.hidden =
          Boolean(selectedProperty.value) &&
          item.dataset.propertyId !== selectedProperty.value;
    });
    section.insertBefore(filterForm, list);
  }
  if (!values.length) section.append(node("p", hostText("No records yet.")));
  if (canWrite && (kind !== "rooms" || properties.length))
    actionForm(
      section,
      `Add ${kind === "properties" ? "property" : kind === "rooms" ? "room" : "team member"}`,
      path(`/${kind}`),
      "POST",
      (form) => inputs(form),
      (data) =>
        kind === "rooms" ? { ...data, capacity: Number(data.capacity) } : data,
    );
  if (cursor) {
    const more = node("button", hostText("Load more"), { type: "button" });
    more.addEventListener("click", async () => {
      more.disabled = true;
      try {
        const result = await portalRequest(
          currentUser,
          path(`/${kind}?limit=100&cursor=${encodeURIComponent(cursor)}`),
        );
        if (epoch !== generation) return;
        section.remove();
        await renderResources(
          container,
          kind,
          [...values, ...result.items],
          canWrite,
          properties,
          result.nextCursor,
          epoch,
        );
      } catch (error) {
        if (epoch === generation) {
          more.disabled = false;
          more.textContent = message(error);
        }
      }
    });
    section.append(more);
  }
  container.append(section);
}
async function renderInventory(
  container,
  org,
  properties,
  rooms,
  epoch,
  loadedPage,
) {
  const section = node("section", undefined, {
    "aria-label": "WIFIGATE systems",
  });
  section.append(node("h3", hostText("WIFIGATE systems")));
  container.append(section);
  const manager = ["owner", "admin"].includes(org.membership.role);
  const mappingFields = (form, resource = {}) => {
    const property = field(
      form,
      "Property",
      "propertyId",
      resource.propertyId || properties[0]?.id || "",
      "text",
      properties.map((item) => [item.id, item.name]),
    );
    const room = field(
      form,
      "Room (optional)",
      "roomId",
      resource.roomId || "",
      "text",
      [
        ["", hostText("Property access")],
        ...rooms
          .filter((item) => item.propertyId === property.value)
          .map((item) => [item.id, item.name]),
      ],
    );
    room.required = false;
    property.addEventListener("change", () => {
      room.replaceChildren(
        node("option", hostText("Property access"), { value: "" }),
        ...rooms
          .filter((item) => item.propertyId === property.value)
          .map((item) => node("option", item.name, { value: item.id })),
      );
    });
  };
  try {
    const [page, catalog] = await Promise.all([
      loadedPage
        ? Promise.resolve(loadedPage)
        : portalRequest(currentUser, path("/systems?limit=100")),
      portalRequest(currentUser, path("/systems/icons")),
    ]);
    if (epoch !== generation) return;
    const list = node("ul", undefined, { class: "host-resource-list" });
    for (const system of page.items ?? []) {
      const row = node("li");
      row.append(
        node("img", undefined, {
          src: `/assets/host-icons/${system.type}-${system.iconId}.svg`,
          alt: "",
          width: "48",
          height: "48",
        }),
        node("strong", system.name),
        node(
          "p",
          hostText("{p0} · {p1} · {p2} physical gates", {
            p0: system.type,
            p1: hostText(system.status),
            p2: system.systemIds.length,
          }),
        ),
        node("p", hostText("Fingerprint: {p0}", { p0: system.fingerprint })),
      );
      if (manager) {
        actionForm(
          row,
          hostText("System settings"),
          path(`/systems/${system.id}`),
          "PUT",
          (form) => {
            mappingFields(form, system);
            field(
              form,
              "Icon",
              "iconId",
              system.iconId,
              "text",
              catalog.icons[system.type].map((id) => [
                id,
                id.replaceAll("-", " "),
              ]),
            );
            field(form, "Status", "status", system.status, "text", [
              ["active", hostText("Active")],
              ["disabled", hostText("Disabled")],
            ]);
          },
          (data) => ({
            ...data,
            roomId: data.roomId || null,
            version: system.version,
          }),
        );
        actionForm(
          row,
          hostText("Rotate Host key"),
          path(`/systems/${system.id}/rotate`),
          "POST",
          (form) => {
            const secret = field(
              form,
              "New Host key",
              "encryptedKeyValue",
              "",
              "password",
            );
            secret.maxLength = 12288;
            secret.autocomplete = "off";
          },
          (data) => ({
            encryptedKeyValue: data.encryptedKeyValue.trim(),
            version: system.version,
          }),
        );
        if (org.membership.role === "owner" && system.status === "active")
          actionForm(
            row,
            hostText("Approve organization transfer"),
            path(`/systems/${system.id}/transfers`),
            "POST",
            (form) => {
              field(
                form,
                "Destination organization ID",
                "targetOrganizationId",
              );
              form.append(
                node(
                  "p",
                  hostText(
                    "The destination owner must accept this transfer with the same Host key. Acceptance disables every source target containing these gates.",
                  ),
                ),
              );
            },
            (data) => ({ ...data, version: system.version }),
            (value) => {
              // Keep only the non-secret transfer reference for the owner to share.
              sessionTransfer = value.transfer.id;
            },
          );
      }
      list.append(row);
    }
    section.append(list);
    if (org.membership.role === "owner") {
      const transfers = await portalRequest(
        currentUser,
        path("/systems/transfers?limit=100"),
      );
      if (epoch !== generation) return;
      const history = node("details");
      history.append(node("summary", hostText("Organization transfers")));
      for (const transfer of transfers.items ?? []) {
        const item = node("div");
        item.append(
          node(
            "p",
            hostText("Transfer {p0} · {p1} · Destination {p2} · Expires {p3}", {
              p0: transfer.id,
              p1: hostText(transfer.status),
              p2: transfer.targetOrganizationId,
              p3: hostDateTime(transfer.expiresAt),
            }),
          ),
        );
        if (transfer.status === "pending")
          actionForm(
            item,
            hostText("Cancel transfer"),
            path(`/systems/transfers/${transfer.id}/cancel`),
            "POST",
            () => {},
            () => ({}),
          );
        history.append(item);
      }
      section.append(history);
    }
    if (!page.items?.length)
      section.append(node("p", hostText("No connected systems yet.")));
    if (page.nextCursor) {
      const more = node("button", hostText("Load more systems"), {
        type: "button",
      });
      more.addEventListener("click", async () => {
        more.disabled = true;
        try {
          const next = await portalRequest(
            currentUser,
            path(
              `/systems?limit=100&cursor=${encodeURIComponent(page.nextCursor)}`,
            ),
          );
          if (epoch !== generation) return;
          section.remove();
          await renderInventory(container, org, properties, rooms, epoch, {
            items: [...page.items, ...next.items],
            nextCursor: next.nextCursor,
          });
        } catch (error) {
          if (epoch === generation) {
            more.disabled = false;
            more.textContent = message(error);
          }
        }
      });
      section.append(more);
    }
    if (!manager || !properties.length) return;
    const details = node("details");
    details.append(node("summary", hostText("Connect WIFIGATE system")));
    const previewForm = node("form");
    const input = field(
      previewForm,
      "WIFIGATE Host key",
      "encryptedKeyValue",
      "",
      "password",
    );
    input.maxLength = 12288;
    input.autocomplete = "off";
    const previewButton = node("button", hostText("Validate key"), {
      type: "submit",
    });
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
        const response = await portalRequest(
          currentUser,
          path("/systems/preview"),
          "POST",
          { encryptedKeyValue },
        );
        if (epoch !== generation) return;
        input.value = "";
        const preview = response.preview;
        status.textContent = hostText(
          "{p0} · {p1} · {p2} gates · Fingerprint {p3}",
          {
            p0: preview.name,
            p1: preview.type,
            p2: preview.systemCount,
            p3: preview.fingerprint,
          },
        );
        const connect = node("form");
        mappingFields(connect);
        field(
          connect,
          "Icon",
          "iconId",
          preview.iconId,
          "text",
          catalog.icons[preview.type].map((id) => [
            id,
            id.replaceAll("-", " "),
          ]),
        );
        if (!preview.available) {
          if (org.membership.role !== "owner") {
            status.textContent +=
              " · Already claimed. An owner must arrange a transfer.";
            return;
          }
          field(connect, "Approved transfer ID", "transferId");
          connect.append(
            node(
              "p",
              hostText(
                "This key is already claimed. An approved transfer from its current owner is required.",
              ),
            ),
          );
        }
        const submit = node(
          "button",
          preview.available
            ? hostText("Connect system")
            : hostText("Accept transfer"),
          { type: "submit" },
        );
        const resultStatus = node("p", "", {
          role: "status",
          "aria-live": "polite",
        });
        connect.append(submit, resultStatus);
        candidate.append(connect);
        let attempt;
        connect.addEventListener("submit", async (e) => {
          e.preventDefault();
          if (submit.disabled) return;
          const fields = Object.fromEntries(new FormData(connect));
          const data = {
            ...fields,
            roomId: fields.roomId || null,
            encryptedKeyValue,
          };
          const signature = JSON.stringify(fields);
          if (!attempt || attempt.signature !== signature)
            attempt = { signature, key: crypto.randomUUID() };
          submit.disabled = true;
          try {
            await portalRequest(
              currentUser,
              path(
                preview.available ? "/systems" : "/systems/transfers/accept",
              ),
              "POST",
              data,
              attempt.key,
            );
            if (epoch === generation)
              await loadHostManagement(
                currentUser,
                currentIdentity,
                selectedId,
              );
          } catch (error) {
            if (epoch === generation) resultStatus.textContent = message(error);
          } finally {
            if (epoch === generation) submit.disabled = false;
          }
        });
      } catch (error) {
        if (epoch === generation) status.textContent = message(error);
      } finally {
        if (epoch === generation) previewButton.disabled = false;
      }
    });
  } catch (error) {
    if (epoch === generation)
      section.append(node("p", message(error), { role: "status" }));
  }
}
function clearOrganizationSelector() {
  const holder = document.getElementById("workspace-org-switcher");
  if (holder) {
    const label = node("label", hostText("Organization")),
      select = node("select", undefined, {
        "aria-label": "Organization",
        disabled: "",
      });
    select.append(node("option", hostText("No organization selected")));
    label.append(select);
    holder.replaceChildren(label);
  }
  delete root.dataset.organizationId;
}
let sessionTransfer;
export async function loadHostManagement(user, identity, preferredId) {
  window.dispatchEvent(new CustomEvent("host:workspace-dispose"));
  if (sessionUid !== user.uid) {
    attempts.clear();
    sessionTransfer = undefined;
    preferredOrganizationId = undefined;
    sessionUid = user.uid;
  }
  clearHostCalendar();
  navigateWorkspace = undefined;
  const epoch = ++generation;
  const current = () => epoch === generation;
  root.dataset.requestGeneration = String(epoch);
  clearOrganizationSelector();
  root.dataset.loading = "true";
  managementRefreshPending = false;
  root.dataset.workspaceReadFailed = "false";
  currentUser = user;
  currentIdentity = identity;
  root.dataset.platformRole = identity.role;
  root.replaceChildren(
    node("p", hostText("Loading your organizations…"), { role: "status" }),
  );
  try {
    const result = await readHostPages(
      user,
      "/api/v1/organizations",
      current,
      "organizations",
    );
    if (!current()) return;
    organizations = result.items;
    root.replaceChildren();
    const inbox = node("div", undefined, {
      "data-workspace-view": "invitations",
    });
    root.append(inbox);
    await renderPendingMembershipInvitations({
      container: inbox,
      user,
      isCurrent: current,
      onAccepted: (id) =>
        current() ? loadHostManagement(user, identity, id) : undefined,
    });
    if (!current()) return;
    if (!organizations.length) {
      rememberOrganization(undefined);
      const empty = node("div", undefined, {
        "data-workspace-view": "calendar",
      });
      root.append(empty);
      renderEmptyHostCalendar(empty);
      if (identity.role === "admin") {
        const support = node("div", undefined, {
          "data-workspace-view": "support",
        });
        root.append(support);
        renderSupportDiagnostics({
          container: support,
          user,
          identity,
          isCurrent: current,
        });
      }
      window.dispatchEvent(new CustomEvent("host:workspace-ready"));
      return;
    }
    // A URL is only a preference: the current server-authorized memberships
    // decide which organization can load, including after a role is revoked.
    const preferred =
      preferredId ?? requestedOrganization() ?? preferredOrganizationId;
    selectedId = organizations.some((org) => org.id === preferred)
      ? preferred
      : organizations[0].id;
    preferredOrganizationId = selectedId;
    root.dataset.organizationId = selectedId;
    const org = organizations.find((entry) => entry.id === selectedId);
    const role = org.workspace?.role ?? org.membership.role;
    const owner = role === "owner";
    const manager = owner || role === "admin";
    root.dataset.membershipRole = role;
    rememberOrganization(selectedId);
    const selection = node("form");
    const select = field(
      selection,
      "Organization",
      "organization",
      selectedId,
      "text",
      organizations.map((entry) => [entry.id, entry.name]),
    );
    (document.getElementById("workspace-org-switcher") ?? root).replaceChildren(
      selection,
    );
    select.addEventListener("change", () => {
      const url = new URL(location.href);
      url.pathname = "/dashboard/host/";
      url.searchParams.set("org", select.value);
      url.searchParams.delete("view");
      url.searchParams.delete("tab");
      history.pushState(null, "", url);
      window.dispatchEvent(
        new CustomEvent("host:workspace-view", { detail: "Calendar" }),
      );
      void loadHostManagement(user, identity, select.value);
    });
    if (org.workspace?.service?.available === false) {
      root.append(
        node(
          "p",
          hostText(
            "Service is unavailable. Existing records remain readable. An owner can review the subscription in Billing statements.",
          ),
          {
            role: "status",
            "data-workspace-notice": "true",
          },
        ),
      );
    }
    const panels = new Map();
    for (const view of allowedWorkspaceViews(role)) {
      const panel = node("div", undefined, {
        "data-workspace-view": view.id,
        class: "workspace-view-panel",
      });
      panel.append(
        node("p", hostText("Select this screen to load its data."), {
          role: "status",
        }),
      );
      panels.set(view.id, panel);
      root.append(panel);
    }
    if (identity.role === "admin" && !panels.has("support")) {
      const support = node("div", undefined, {
        "data-workspace-view": "support",
        class: "workspace-view-panel",
      });
      panels.set("support", support);
      root.append(support);
    }
    let references;
    const readReferences = () => {
      references ??= Promise.all([
        readHostPages(user, path("/properties"), current),
        readHostPages(user, path("/rooms"), current),
      ])
        .then(([properties, rooms]) => ({ properties, rooms }))
        .catch((error) => {
          references = undefined;
          throw error;
        });
      return references;
    };
    const options = (container) => ({
      container,
      user,
      organization: org,
      isCurrent: current,
    });
    const loaders = {
      calendar: async (panel, viewCurrent) => {
        const { properties, rooms } = await readReferences();
        if (!viewCurrent()) return;
        if (!properties.items.length)
          renderEmptyHostCalendar(panel, {
            organization: org,
            reason: "properties",
          });
        else
          await renderHostCalendar({
            ...options(panel),
            isCurrent: viewCurrent,
            properties: properties.items,
            rooms: rooms.items,
          });
      },
      reservations: async (panel, viewCurrent) => {
        const { properties, rooms } = await readReferences();
        if (!viewCurrent()) return;
        if (!properties.items.length)
          panel.append(
            node(
              "p",
              hostText("Add a property and room before creating reservations."),
            ),
          );
        else
          await renderHostCalendar({
            ...options(panel),
            isCurrent: viewCurrent,
            properties: properties.items,
            rooms: rooms.items,
            mode: "reservations",
          });
      },
      properties: async (panel) => {
        const { properties, rooms } = await readReferences();
        if (!current()) return;
        await renderResources(
          panel,
          "properties",
          properties.items,
          manager,
          [],
          properties.nextCursor,
          epoch,
        );
        await renderResources(
          panel,
          "rooms",
          rooms.items,
          manager,
          properties.items,
          rooms.nextCursor,
          epoch,
        );
      },
      systems: async (panel) => {
        const { properties, rooms } = await readReferences();
        if (!current()) return;
        await renderInventory(panel, org, properties.items, rooms.items, epoch);
        await renderHostImportRequests({
          ...options(panel),
          onConnected: () =>
            current() ? loadHostManagement(user, identity, org.id) : undefined,
        });
      },
      team: async (panel) => {
        const members = await portalRequest(user, path("/members?limit=100"));
        if (!current()) return;
        await renderResources(
          panel,
          "members",
          members.items,
          owner,
          [],
          members.nextCursor,
          epoch,
        );
        await renderOwnerMembershipInvitations(options(panel));
      },
      automation: async (panel) => {
        const { properties } = await readReferences();
        if (current())
          await renderHostAutomation({
            ...options(panel),
            properties: properties.items,
            includeJobs: false,
          });
      },
      operations: async (panel) => {
        const { properties, rooms } = await readReferences();
        if (!current()) return;
        await renderHostOperations({
          ...options(panel),
          properties: properties.items,
          rooms: rooms.items,
        });
      },
      integrations: async (panel) => {
        const { properties, rooms } = await readReferences();
        if (!current()) return;
        await renderHostApiKeys(options(panel));
        await renderHostIntegrations({
          ...options(panel),
          properties: properties.items,
          rooms: rooms.items,
          includeEvents: false,
        });
      },
      billing: (panel) => renderHostBilling(options(panel)),
      support: async (panel) => {
        await renderSupportOwner(options(panel));
        renderSupportDiagnostics({
          container: panel,
          user,
          identity,
          isCurrent: current,
        });
      },
      organization: async (panel) => {
        panel.append(
          node("h2", hostText("Organization settings")),
          node("p", org.name),
          node("p", hostText("Timezone: {p0}", { p0: org.timezone })),
          node(
            "p",
            hostText("Your organization role: {p0}", { p0: hostText(role) }),
          ),
        );
        if (org.workspace?.service)
          panel.append(
            node(
              "p",
              hostText("Service state: {p0}", {
                p0: hostText(org.workspace.service.state),
              }),
            ),
          );
        if (sessionTransfer)
          panel.append(node("p", "Approved transfer ID: " + sessionTransfer));
        if (owner)
          actionForm(
            panel,
            "Organization settings",
            path(),
            "PUT",
            (form) => {
              field(form, "Organization name", "name", org.name);
              field(form, "IANA timezone", "timezone", org.timezone);
            },
            (data) => ({ ...data, version: org.version }),
            undefined,
            { submitLabel: "Save organization details" },
          );
      },
    };
    let bookingView;
    const loads = new Map();
    navigateWorkspace = async (id) => {
      const panel = panels.get(id);
      if (!panel || !current()) return;
      if (managementRefreshPending) {
        managementRefreshPending = false;
        await loadHostManagement(currentUser, currentIdentity, selectedId);
        return;
      }
      if (["calendar", "reservations"].includes(id) && bookingView !== id) {
        clearHostCalendar();
        for (const previous of ["calendar", "reservations"]) {
          const bookingPanel = panels.get(previous);
          if (bookingPanel) {
            for (const dialog of bookingPanel.querySelectorAll("dialog[open]"))
              dialog.close();
            bookingPanel.replaceChildren();
            bookingPanel.dataset.loaded = "false";
            bookingPanel.dataset.renderGeneration = String(
              Number(bookingPanel.dataset.renderGeneration ?? 0) + 1,
            );
            loads.delete(previous);
          }
        }
        bookingView = id;
      }
      if (panel.dataset.loaded === "true") return;
      if (loads.has(id)) return loads.get(id);
      const renderGeneration = panel.dataset.renderGeneration;
      const viewCurrent = () =>
        current() && panel.dataset.renderGeneration === renderGeneration;
      const load = async () => {
        panel.replaceChildren(
          node("p", hostText("Loading this screen…"), { role: "status" }),
        );
        try {
          panel.replaceChildren();
          await loaders[id](panel, viewCurrent);
          if (viewCurrent() && panel.isConnected) panel.dataset.loaded = "true";
        } catch (error) {
          if (!viewCurrent()) return;
          panel.replaceChildren(node("p", message(error), { role: "status" }));
          if (error.code === "TOTP_REQUIRED") {
            const verify = node("button", hostText("Verify authenticator"), {
              type: "button",
            });
            verify.addEventListener("click", () =>
              window.dispatchEvent(new CustomEvent("host:totp-required")),
            );
            panel.append(verify);
          }
          const retry = node("button", hostText("Retry this screen"), {
            type: "button",
          });
          retry.addEventListener("click", () => void navigateWorkspace?.(id));
          panel.append(retry);
        } finally {
          if (viewCurrent()) loads.delete(id);
        }
      };
      const promise = load();
      loads.set(id, promise);
      return promise;
    };
    window.dispatchEvent(new CustomEvent("host:workspace-ready"));
    const requested = workspaceLocation(new URL(location.href));
    if (!["account", "overview", "invitations"].includes(requested)) {
      await navigateWorkspace(panels.has(requested) ? requested : "calendar");
    }
  } catch (error) {
    if (!current()) return;
    root.dataset.workspaceReadFailed = "true";
    root.replaceChildren(node("p", message(error), { role: "status" }));
    if (error.code === "TOTP_REQUIRED") {
      const verify = node("button", hostText("Verify authenticator"), {
        type: "button",
      });
      verify.addEventListener("click", () =>
        window.dispatchEvent(new CustomEvent("host:totp-required")),
      );
      root.append(verify);
    }
    const retry = node("button", hostText("Refresh organizations"), {
      type: "button",
    });
    retry.addEventListener(
      "click",
      () => void loadHostManagement(user, identity, preferredId),
    );
    root.append(retry);
  } finally {
    if (current()) root.dataset.loading = "false";
  }
}
window.addEventListener("popstate", () => {
  if (currentUser && currentIdentity && requestedOrganization() !== selectedId)
    void loadHostManagement(currentUser, currentIdentity);
});
