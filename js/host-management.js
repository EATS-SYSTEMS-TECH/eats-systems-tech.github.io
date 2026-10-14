import { hostText } from "./host-locale.js";
import { renderPendingMembershipInvitations } from "./host-membership-invitations.js";
import { portalRequest } from "./api/index.js";
import { readHostPages } from "./host-pages.js";
import { node } from "./host-ui.js";
import {
  readMySystems,
  renderSidebarSystems as fillSidebarSystems,
} from "./host-my-systems.js";
import { readSystem } from "./host-system-cards.js";
import { clearHostCalendar } from "./host-calendar.js";
import { workspaceLoaders } from "./host-workspace-views.js";
import {
  renderOrganizationSelector,
  clearOrganizationSelector,
} from "./host-org-selector.js";
import { organizationRole, permissionsOf } from "./host-permissions.js";
import {
  allowedWorkspaceViews,
  homeView,
  settingsTab,
  workspaceLocation,
} from "./host-workspace-model.js";

// The Host workspace: the selected organization's views (Organization
// systems, Calendar, Bookings, Activity, Connect, Settings), My systems for
// Host plan holders, and the join-organization inbox. Each view is built
// once it is first opened; what is built follows workspace.permissions.
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
// The system whose upcoming bookings Bookings opens on next (after a
// removal refused for bookings), kept while the organization switches:
// {organizationId, id, type, targetId}.
let bookingsFocus;
const requestedOrganization = () =>
  new URLSearchParams(location.search).get("org");
function rememberOrganization(id) {
  const url = new URL(location.href);
  if (id) url.searchParams.set("org", id);
  else url.searchParams.delete("org");
  if (url.href !== location.href) history.replaceState(null, "", url);
}
const path = (suffix = "") =>
  `/api/v1/organizations/${encodeURIComponent(selectedId)}${suffix}`;
const message = (error) =>
  hostText(
    {
      RESOURCE_CAPACITY_EXCEEDED:
        "This organization needs a capacity review before loading all resources. Contact support.",
      TOTP_REQUIRED: "Verify your authenticator to manage this organization.",
      TENANT_ACCESS_DENIED:
        "Your access to this organization is unavailable. Refresh your account.",
      VERSION_CONFLICT: "This record changed. Refresh before saving again.",
      LAST_OWNER_PROTECTED: "At least one active owner must remain.",
      IDEMPOTENCY_CONFLICT:
        "This saved attempt has different data. Refresh and try again.",
      SUBSCRIPTION_UNAVAILABLE:
        "Service is unavailable for this organization right now.",
      HOST_API_UNAVAILABLE: "Can't reach WIFIGATE right now. Try again.",
    }[error?.code] ?? "The request could not be completed. You can retry.",
  );
const byName = (a, b) => a.name.localeCompare(b.name);

// The Settings tab on screen, or the one the URL asks for while the
// workspace is reloading or could not load.
function selectedSettingsTab() {
  return (
    root.querySelector(
      '[data-workspace-view="settings"] [role="tab"][aria-selected="true"]',
    )?.dataset.settingsTab ?? settingsTab(new URL(location.href))
  );
}

// A change made from Settings (one Idempotency-Key per intent, kept until it
// succeeds). Its controls lock while it runs. Afterwards the workspace
// reloads so every screen shows it; when the person has left that tab, the
// reload waits until they come back. No line says that it worked.
async function submitChange({
  form,
  status,
  method,
  path: target,
  body,
  tabId,
}) {
  const epoch = generation;
  const orgId = selectedId;
  const onScreen = () =>
    workspaceLocation(new URL(location.href), root.dataset.homeView) ===
      "settings" &&
    (!tabId || selectedSettingsTab() === tabId);
  const active = () => epoch === generation && form.isConnected && onScreen();
  const controls = Array.from(form.elements, (element) => [
    element,
    element.disabled,
  ]);
  const signature = JSON.stringify([target, method, body]);
  if (!attempts.has(signature)) attempts.set(signature, crypto.randomUUID());
  for (const [control] of controls) control.disabled = true;
  status.textContent = hostText("Working…");
  try {
    await portalRequest(
      currentUser,
      target,
      method,
      body,
      attempts.get(signature),
    );
    if (epoch !== generation) return;
    attempts.delete(signature);
    status.textContent = "";
    if (!active()) {
      managementRefreshPending = true;
      return;
    }
    await loadHostManagement(currentUser, currentIdentity, orgId);
    if (root.dataset.workspaceReadFailed === "true")
      root.prepend(
        node(
          "p",
          hostText(
            "Couldn't load the latest details. Refresh to see your change.",
          ),
          { role: "status", "data-management-feedback": "true" },
        ),
      );
  } catch (error) {
    if (epoch === generation) status.textContent = message(error);
  } finally {
    if (epoch === generation)
      for (const [control, disabled] of controls) control.disabled = disabled;
  }
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
    bookingsFocus = undefined;
    attempts.clear();
    sessionUid = undefined;
    preferredOrganizationId = undefined;
    rememberOrganization(undefined);
  }
  root.replaceChildren();
  clearOrganizationSelector();
  delete root.dataset.organizationId;
  renderSidebarSystems(false);
}
window.addEventListener("host:workspace-navigate", (event) => {
  for (const notice of root.querySelectorAll("[data-management-feedback]"))
    notice.remove();
  void navigateWorkspace?.(event.detail);
});
// A saved filter from Activity opens the Calendar with it.
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
    new CustomEvent("host:workspace-view", { detail: "calendar" }),
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

// The compact My systems list in the sidebar, for Host plan holders. The rows
// (each with its organization badge or "Not linked") come with My systems.
function renderSidebarSystems(plan) {
  const holder = document.getElementById("host-my-systems");
  if (!holder) return;
  holder.hidden = !plan;
  const list = document.getElementById("host-my-systems-list");
  if (list && !plan) list.replaceChildren();
}

export async function loadHostManagement(user, identity, preferredId) {
  window.dispatchEvent(new CustomEvent("host:workspace-dispose"));
  if (sessionUid !== user.uid) {
    attempts.clear();
    preferredOrganizationId = undefined;
    sessionUid = user.uid;
  }
  clearHostCalendar();
  navigateWorkspace = undefined;
  const epoch = ++generation;
  const current = () => epoch === generation;
  root.dataset.requestGeneration = String(epoch);
  clearOrganizationSelector();
  delete root.dataset.organizationId;
  root.dataset.loading = "true";
  managementRefreshPending = false;
  root.dataset.workspaceReadFailed = "false";
  currentUser = user;
  currentIdentity = identity;
  // My systems belongs to Host plan holders only; an organization member
  // without a plan (role null) never sees it. A pending account gets only
  // the join-organization view.
  const plan = identity.role === "admin" || identity.role === "user";
  const pending = identity.access?.state === "pending";
  root.dataset.platformRole = identity.role ?? "member";
  root.dataset.homeView = homeView({ plan, pending });
  renderSidebarSystems(plan && !pending);
  root.replaceChildren(node("p", hostText("Loading…"), { role: "status" }));
  try {
    const result = pending
      ? { items: [] }
      : await readHostPages(
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
      class: "workspace-view-panel",
    });
    root.append(inbox);
    await renderPendingMembershipInvitations({
      container: inbox,
      user,
      isCurrent: current,
      onAccepted: (id) => {
        if (!current()) return;
        // Joining makes Host active: read the access again so the whole
        // dashboard (not only this list) follows the new membership.
        if (pending) window.dispatchEvent(new CustomEvent("platform:refresh"));
        else return loadHostManagement(user, identity, id);
      },
    });
    if (!current()) return;
    inbox.dataset.loaded = "true";
    // A URL is only a preference: the current server-authorized memberships
    // decide which organization can load, including after a role is revoked.
    let org;
    if (organizations.length) {
      const preferred =
        preferredId ?? requestedOrganization() ?? preferredOrganizationId;
      selectedId = organizations.some((entry) => entry.id === preferred)
        ? preferred
        : organizations[0].id;
      preferredOrganizationId = selectedId;
      root.dataset.organizationId = selectedId;
      org = organizations.find((entry) => entry.id === selectedId);
      rememberOrganization(selectedId);
    } else {
      delete root.dataset.organizationId;
      rememberOrganization(undefined);
    }
    const permissions = org ? [...permissionsOf(org)] : undefined;
    if (org) {
      root.dataset.membershipRole = organizationRole(org);
      renderOrganizationSelector(org, organizations, (id) => {
        window.dispatchEvent(new CustomEvent("host:menu-close"));
        const url = new URL(location.href);
        url.pathname = "/dashboard/host/";
        url.searchParams.set("org", id);
        history.pushState(null, "", url);
        void loadHostManagement(user, identity, id);
      });
      if (org.workspace?.service?.available === false)
        root.append(
          node(
            "p",
            hostText(
              "Service is unavailable for this organization right now. Everything stays readable; the owner can renew the plan.",
            ),
            { role: "status", "data-workspace-notice": "true" },
          ),
        );
    } else delete root.dataset.membershipRole;
    const panels = new Map([["invitations", inbox]]);
    for (const view of allowedWorkspaceViews({ plan, pending, permissions })) {
      if (panels.has(view.id)) continue;
      const panel = node("div", undefined, {
        "data-workspace-view": view.id,
        class: "workspace-view-panel",
      });
      panels.set(view.id, panel);
      root.append(panel);
    }
    // The organization's active systems, read once per load and shared by
    // the Calendar, Bookings, Activity and Connect.
    let orgSystems;
    const readOrgSystems = () =>
      (orgSystems ??= readHostPages(user, path("/systems"), current)
        .then(({ items }) =>
          items
            .map(readSystem)
            .filter((system) => system && system.status === "active")
            .sort(byName),
        )
        .catch((error) => {
          orgSystems = undefined;
          throw error;
        }));
    // My systems are read once per load and shared by the view and the
    // sidebar list.
    let mySystems;
    const readMine = () =>
      (mySystems ??= readMySystems(user, current).catch((error) => {
        mySystems = undefined;
        throw error;
      }));
    // A system card to focus once its view has (re)loaded.
    let pendingFocus;
    const focusIn = (panel, systemId) => {
      const target =
        (systemId &&
          panel.querySelector(
            `[data-system-id="${CSS.escape(systemId)}"] .system-card__name`,
          )) ||
        panel.querySelector(".systems-view");
      if (!target) return;
      if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: "nearest" });
    };
    const openMySystem = (systemId) => {
      window.dispatchEvent(new CustomEvent("host:menu-close"));
      window.dispatchEvent(
        new CustomEvent("host:workspace-view", { detail: "my-systems" }),
      );
      const panel = panels.get("my-systems");
      if (panel?.dataset.loaded === "true")
        requestAnimationFrame(() => focusIn(panel, systemId));
      else pendingFocus = { view: "my-systems", id: systemId };
    };
    const showSidebarSystems = () => {
      if (!plan || pending) return;
      readMine().then(
        (systems) => {
          if (current()) fillSidebarSystems(systems, openMySystem);
        },
        (error) => {
          if (current() && error?.code === "HOST_PLAN_REQUIRED")
            renderSidebarSystems(false);
        },
      );
    };
    // A booking refused a removal: its organization's Bookings with that
    // system's upcoming bookings, switching organization first when needed.
    // Only an organization the person still belongs to can open; for any
    // other the refusal says who moves them.
    const canOpenBookings = (organizationId) =>
      organizations.some((entry) => entry.id === organizationId);
    const openBookings = (organizationId, system) => {
      if (!current()) return;
      bookingsFocus = system
        ? {
            organizationId,
            id: system.id,
            type: system.type,
            targetId: system.targetId,
          }
        : undefined;
      if (organizationId === selectedId) {
        // Bookings rebuilds for that system even when it is already built.
        const panel = panels.get("bookings");
        if (panel && (panel.dataset.loaded === "true" || loads.has("bookings")))
          resetPanel("bookings", panel);
        window.dispatchEvent(
          new CustomEvent("host:workspace-view", { detail: "bookings" }),
        );
        return;
      }
      if (!canOpenBookings(organizationId)) {
        bookingsFocus = undefined;
        return;
      }
      const url = new URL(location.href);
      url.pathname = "/dashboard/host/";
      url.searchParams.set("org", organizationId);
      url.searchParams.set("view", "bookings");
      url.searchParams.delete("tab");
      url.searchParams.delete("section");
      history.pushState(null, "", url);
      void loadHostManagement(user, identity, organizationId);
    };
    // Bookings takes the refused system once, in its own organization.
    const takeBookingsFocus = () => {
      const focus = bookingsFocus;
      bookingsFocus = undefined;
      return focus?.organizationId === selectedId ? focus : undefined;
    };
    let bookingView;
    const loads = new Map();
    // Calendar and Bookings controllers ({reload}) while they are built.
    const controllers = new Map();
    const resetPanel = (id, panel) => {
      for (const dialog of panel.querySelectorAll("dialog[open]"))
        dialog.close();
      panel.replaceChildren();
      panel.dataset.loaded = "false";
      panel.dataset.renderGeneration = String(
        Number(panel.dataset.renderGeneration ?? 0) + 1,
      );
      loads.delete(id);
      controllers.delete(id);
      if (bookingView === id) {
        clearHostCalendar();
        bookingView = undefined;
      }
    };
    // A system was linked, unlinked, removed or changed: every screen built
    // from systems reloads when it is next opened, the sidebar list follows,
    // and the screen that made the change reloads now.
    const systemsChanged = async (view, systemId) => {
      if (!current()) return;
      mySystems = undefined;
      orgSystems = undefined;
      for (const [id, panel] of panels)
        if (id !== "invitations" && id !== "settings") resetPanel(id, panel);
      showSidebarSystems();
      pendingFocus = { view, id: systemId };
      await navigateWorkspace?.(view);
    };
    // My systems could not be read: Try again reads them afresh (the view
    // and the sidebar list).
    const retryMySystems = async () => {
      const panel = panels.get("my-systems");
      if (!current() || !panel) return;
      mySystems = undefined;
      resetPanel("my-systems", panel);
      showSidebarSystems();
      await navigateWorkspace?.("my-systems");
    };
    const loaders = workspaceLoaders({
      root,
      user,
      identity,
      organization: org,
      organizations,
      plan,
      permissions,
      isCurrent: current,
      panels,
      controllers,
      resetPanel,
      readOrgSystems,
      readMine,
      retryMySystems,
      systemsChanged,
      openBookings,
      canOpenBookings,
      takeBookingsFocus,
      saveOrganization: ({ form, status, body }) =>
        submitChange({
          form,
          status,
          method: "PUT",
          path: path(),
          body,
          tabId: "organization",
        }),
      reloadWorkspace: () => loadHostManagement(user, identity, selectedId),
      message,
      refreshPending: () => managementRefreshPending,
      refresh: () => navigateWorkspace?.("settings"),
    });
    navigateWorkspace = async (id) => {
      const panel = panels.get(id);
      if (!panel || !current()) return;
      if (managementRefreshPending) {
        managementRefreshPending = false;
        await loadHostManagement(currentUser, currentIdentity, selectedId);
        return;
      }
      // Calendar and Bookings share the booking listeners: opening one
      // rebuilds it and clears the other.
      if (["calendar", "bookings"].includes(id) && bookingView !== id) {
        clearHostCalendar();
        for (const previous of ["calendar", "bookings"]) {
          const bookingPanel = panels.get(previous);
          if (bookingPanel) resetPanel(previous, bookingPanel);
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
          node("p", hostText("Loading…"), { role: "status" }),
        );
        try {
          panel.replaceChildren();
          await loaders[id](panel, viewCurrent);
          if (viewCurrent() && panel.isConnected) {
            panel.dataset.loaded = "true";
            if (pendingFocus?.view === id) {
              const { id: systemId } = pendingFocus;
              pendingFocus = undefined;
              focusIn(panel, systemId);
            }
          }
        } catch (error) {
          if (!viewCurrent()) return;
          panel.replaceChildren(node("p", message(error), { role: "status" }));
          if (error?.code === "TOTP_REQUIRED") {
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
    showSidebarSystems();
    window.dispatchEvent(new CustomEvent("host:workspace-ready"));
    const requested = workspaceLocation(
      new URL(location.href),
      root.dataset.homeView,
    );
    if (requested !== "overview")
      await navigateWorkspace(
        panels.has(requested) ? requested : root.dataset.homeView,
      );
  } catch (error) {
    if (!current()) return;
    root.dataset.workspaceReadFailed = "true";
    root.replaceChildren(node("p", message(error), { role: "status" }));
    if (error?.code === "TOTP_REQUIRED") {
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
  const requested = requestedOrganization();
  if (currentUser && currentIdentity && requested && requested !== selectedId)
    void loadHostManagement(currentUser, currentIdentity);
});
