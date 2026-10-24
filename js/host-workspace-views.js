import { organizationsEmptyCopy } from "./systems-empty-copy.js";
import { hostText } from "./host-locale.js";
import { node } from "./host-ui.js";
import { renderHostApiKeys } from "./host-api-keys.js";
import { renderHostIntegrations } from "./host-integrations.js";
import { renderAutomationPolicy } from "./host-automation.js";
import { renderHostOperations } from "./host-operations.js";
import {
  renderSupportDiagnostics,
  renderSupportOwner,
} from "./host-support.js";
import { renderMySystems } from "./host-my-systems.js";
import { renderOrganizationSystems } from "./host-org-systems.js";
import { renderExampleGroup } from "./host-example-cards.js";
import { emptyState } from "./host-system-cards.js";
import { renderHostCalendar } from "./host-calendar.js";
import { renderHostBookings } from "./host-bookings.js";
import { openBookingSheet } from "./host-booking-sheet.js";
import { openBookingDetails } from "./host-booking-details.js";
import { renderHostBilling } from "./host-billing.js";
import { renderTeam } from "./host-team.js";
import {
  renderSettings,
  renderOrganizationTab,
  renderAccount,
} from "./host-settings.js";
import {
  allowedSettingsTabs,
  workspaceLocation,
} from "./host-workspace-model.js";

// What each workspace view builds once it is opened (host-management.js owns
// loading, navigation and resets). context: {root, user, identity,
// organization, organizations, plan, permissions (array or undefined),
// isCurrent, panels, controllers, resetPanel(id, panel), readOrgSystems(),
// readMine(), retryMySystems(), systemsChanged(view, systemId),
// openBookings(orgId, system), canOpenBookings(orgId), takeBookingsFocus(),
// saveOrganization({form, status, body}), reloadWorkspace(), message(error),
// refreshPending(), refresh()}.
export function workspaceLoaders(context) {
  const {
    user,
    identity,
    organization: org,
    plan,
    isCurrent: current,
  } = context;
  const granted = new Set(context.permissions ?? []);
  const options = (container) => ({
    container,
    user,
    organization: org,
    isCurrent: current,
  });

  // A booking changed in a sheet. Once the last sheet closes, the booking
  // screen on view reloads in place and the other one rebuilds when it is
  // next opened.
  let bookingsChanged = false;
  const bookingContext = (container, systems) => ({
    container,
    user,
    organization: org,
    systems,
    isCurrent: current,
    onChanged: () => {
      bookingsChanged = true;
    },
    onClosed: () => {
      if (
        !current() ||
        !bookingsChanged ||
        context.root.querySelector("dialog.booking-sheet[open]")
      )
        return;
      bookingsChanged = false;
      const on = workspaceLocation(
        new URL(location.href),
        context.root.dataset.homeView,
      );
      for (const id of ["calendar", "bookings"]) {
        const panel = context.panels.get(id);
        if (!panel) continue;
        if (id === on && context.controllers.has(id))
          void context.controllers.get(id).reload();
        else if (panel.dataset.loaded === "true") context.resetPanel(id, panel);
      }
    },
  });
  const bookingActions = (panel, systems) => ({
    openBooking: (record, trigger) =>
      openBookingDetails({
        ...bookingContext(panel, systems),
        record,
        trigger,
      }),
    newBooking: ({ systemId, date, trigger } = {}) =>
      openBookingSheet({
        ...bookingContext(panel, systems),
        systemId,
        date,
        trigger,
      }),
  });

  const tabLoaders = {
    organization: async (panel) =>
      renderOrganizationTab(panel, {
        organization: org,
        save: context.saveOrganization,
      }),
    team: (panel) =>
      renderTeam(panel, {
        user,
        email: identity.user?.email,
        organization: org,
        isCurrent: current,
        onChanged: () => {
          if (current()) void context.reloadWorkspace();
        },
      }),
    billing: (panel) => renderHostBilling(options(panel)),
    support: async (panel) => {
      if (org && granted.has("organization:write"))
        await renderSupportOwner(options(panel));
      renderSupportDiagnostics({
        container: panel,
        user,
        identity,
        isCurrent: current,
      });
    },
    account: async (panel) => renderAccount(panel, identity),
  };

  const bookingView = (render, id) => async (panel, viewCurrent) => {
    // Bookings opened from a refused removal shows that system's upcoming
    // bookings.
    const focusSystem =
      id === "bookings" ? context.takeBookingsFocus?.() : undefined;
    const systems = await context.readOrgSystems();
    if (!viewCurrent()) return;
    context.controllers.set(
      id,
      await render({
        ...options(panel),
        isCurrent: viewCurrent,
        systems,
        focusSystem,
        ...bookingActions(panel, systems),
      }),
    );
  };

  return {
    "my-systems": (panel, viewCurrent) =>
      renderMySystems(panel, {
        user,
        isCurrent: viewCurrent,
        organizations: context.organizations,
        read: context.readMine,
        retry: context.retryMySystems,
        onChanged: (systemId) => context.systemsChanged("my-systems", systemId),
        openBookings: context.openBookings,
        canOpenBookings: context.canOpenBookings,
      }),
    systems: (panel, viewCurrent) =>
      org
        ? renderOrganizationSystems(panel, {
            user,
            identity,
            organization: org,
            permissions: granted,
            plan,
            organizations: context.organizations,
            isCurrent: viewCurrent,
            onChanged: (systemId) =>
              context.systemsChanged("systems", systemId),
            openBookings: context.openBookings,
            canOpenBookings: context.canOpenBookings,
            createLink: (system, trigger, systems) =>
              openBookingSheet({
                ...bookingContext(panel, systems),
                systemId: system.id,
                trigger,
              }),
          })
        : renderNoOrganization(panel, { user, plan, isCurrent: viewCurrent }),
    calendar: bookingView(renderHostCalendar, "calendar"),
    bookings: bookingView(renderHostBookings, "bookings"),
    activity: async (panel) => {
      const systems = await context.readOrgSystems();
      if (!current()) return;
      await renderHostOperations({ ...options(panel), systems });
    },
    connect: async (panel) => {
      const systems = await context.readOrgSystems();
      if (!current()) return;
      await renderAutomationPolicy(options(panel));
      if (!current()) return;
      await renderHostIntegrations({ ...options(panel), systems });
      if (!current()) return;
      await renderHostApiKeys(options(panel));
    },
    settings: (panel, viewCurrent) =>
      renderSettings(panel, viewCurrent, {
        tabs: allowedSettingsTabs({
          permissions: context.permissions,
          platformAdmin: identity.role === "admin",
        }).filter((tab) => org || ["account", "support"].includes(tab.id)),
        loaders: tabLoaders,
        message: context.message,
        refreshPending: context.refreshPending,
        refresh: context.refresh,
      }),
  };
}

// Organization systems for a member who is not in any organization yet. A
// member without a Host plan finds the examples here too.
async function renderNoOrganization(panel, { user, plan, isCurrent }) {
  const section = node("section", undefined, {
    "aria-label": "WIFIGATE systems",
    class: "systems-view",
  });
  const join = node("button", hostText("Join an organization"), {
    type: "button",
  });
  join.addEventListener("click", () =>
    window.dispatchEvent(
      new CustomEvent("host:workspace-view", { detail: "invitations" }),
    ),
  );
  const copy = organizationsEmptyCopy(document.documentElement.lang);
  const empty = node("section", undefined, { class: "empty-state systems-empty" });
  empty.append(node("h4", copy.title), node("p", copy.description), join);
  section.append(empty);
  panel.append(section);
  if (!plan)
    await renderExampleGroup(section, { user, organizations: [], isCurrent });
}
