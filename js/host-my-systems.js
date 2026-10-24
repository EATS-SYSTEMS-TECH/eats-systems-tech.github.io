import { systemsEmptyCopy } from "./systems-empty-copy.js";
import { hostText } from "./host-locale.js";
import { node, nameBlock } from "./host-ui.js";
import { readHostPages } from "./host-pages.js";
import {
  readSystem,
  systemMessage,
  systemCard,
  systemGrid,
  organizationBadge,
  notLinkedBadge,
  iconSrc,
  action,
  emptyState,
  systemsToolbar,
  countText,
  openSystemDialog,
  bookingsRefusal,
  changeTracker,
  organizationChoices,
} from "./host-system-cards.js";
import { renderExampleGroup } from "./host-example-cards.js";

// My systems: the Host plan holder's own systems, added from the WIFIGATE
// app. From here a system is linked to an organization where the person is
// an owner or admin, unlinked, or removed (only while not linked). The three
// examples follow the real systems. Organization members without a plan
// never reach this screen or its routes.
const mine = "/api/v1/me/systems";

export async function readMySystems(user, isCurrent) {
  const { items } = await readHostPages(user, mine, isCurrent);
  return items
    .map(readSystem)
    .filter((system) => system && system.status === "active");
}

// Organizations a system can be linked to: active memberships whose
// workspace allows adding systems (owner and admin).
export const linkTargets = (organizations) =>
  organizations.filter((organization) =>
    organization.workspace?.permissions?.includes("systems:write"),
  );

// A target whose service is paused takes no systems for now: it stays in the
// list, disabled, with this reason in its ⓘ.
export const serviceBlocked = (organization) =>
  organization.workspace?.service?.available === false
    ? "Service is unavailable for this organization right now."
    : undefined;

// Why Link is disabled on a card, or undefined when it can be used.
function linkBlocked(organizations) {
  const targets = linkTargets(organizations);
  if (!targets.length)
    return "Only an owner or admin of an organization can link systems to it.";
  if (targets.every(serviceBlocked))
    return "Service is unavailable right now for the organizations you can link to.";
  return undefined;
}

// The compact list in the sidebar: every system with its organization badge
// or "Not linked". A row opens My systems on that card.
export function renderSidebarSystems(systems, onSelect) {
  const list = document.getElementById("host-my-systems-list");
  if (!list) return;
  list.replaceChildren(
    ...systems.map((system) => {
      const row = node("li");
      const button = node("button", undefined, {
        type: "button",
        class: "sidebar-system",
        "data-system-id": system.id,
      });
      const text = node("span", undefined, { class: "sidebar-system__text" });
      text.append(
        nameBlock("span", system.name, { class: "sidebar-system__name" }),
        system.linkedOrganization
          ? organizationBadge(system.linkedOrganization.name)
          : notLinkedBadge(),
      );
      button.append(
        node("img", undefined, {
          src: iconSrc(system),
          alt: "",
          width: "28",
          height: "28",
          class: "sidebar-system__icon",
        }),
        text,
      );
      button.addEventListener("click", () => onSelect(system.id));
      row.append(button);
      return row;
    }),
  );
}

// `context`: {user, isCurrent, organizations, read, retry(), onChanged(focusId),
// openBookings(organizationId), canOpenBookings(organizationId)}. `read`
// returns the systems (cached by the workspace for this load).
export async function renderMySystems(panel, context) {
  const section = node("section", undefined, {
    "aria-label": "My systems",
    class: "systems-view my-systems",
  });
  panel.append(section);
  const examples = () =>
    renderExampleGroup(section, {
      user: context.user,
      organizations: context.organizations,
      isCurrent: context.isCurrent,
    });
  let systems;
  try {
    systems = await context.read();
  } catch (error) {
    if (!context.isCurrent()) return;
    // A read that fails is one sentence and one action here; the examples
    // and Try it stay available below it.
    section.append(readFailure(error, context));
    await examples();
    return;
  }
  if (!context.isCurrent()) return;
  const tip = hostText(
    "Systems you add from the WIFIGATE app. Link one to an organization to use it there.",
  );
  if (!systems.length) {
    const copy = systemsEmptyCopy(document.documentElement.lang);
    const empty = node("section", undefined, { class: "empty-state systems-empty" });
    empty.append(node("h4", copy.title), node("p", copy.description));
    section.append(empty);
  } else
    section.append(
      systemsToolbar(countText(systems.length), tip),
      systemGrid(systems.map((system) => card(section, system, context))),
    );
  await examples();
}

function readFailure(error, context) {
  // The plan ended since the page opened: a local refusal, the rest of Host
  // stays open, and Check again reads the access afresh.
  if (error?.code === "HOST_PLAN_REQUIRED") {
    const check = node("button", hostText("Check again"), { type: "button" });
    check.addEventListener("click", () =>
      window.dispatchEvent(new CustomEvent("platform:refresh")),
    );
    return emptyState(hostText("My systems needs an active Host plan."), {
      action: check,
    });
  }
  const verify = error?.code === "TOTP_REQUIRED";
  const button = node(
    "button",
    hostText(verify ? "Verify authenticator" : "Try again"),
    { type: "button" },
  );
  button.addEventListener("click", () =>
    verify
      ? window.dispatchEvent(new CustomEvent("host:totp-required"))
      : context.retry(),
  );
  return emptyState(systemMessage(error), { action: button });
}

function card(section, system, context) {
  const linked = system.linkedOrganization;
  const actions = linked
    ? [
        action("Unlink", (button) => unlink(section, system, button, context), {
          variant: "danger",
          name: "unlink",
        }),
      ]
    : [
        action(
          "Link to organization",
          (button) => link(section, system, button, context),
          { name: "link", blocked: linkBlocked(context.organizations) },
        ),
        action("Remove", (button) => remove(section, system, button, context), {
          variant: "danger",
          name: "remove",
        }),
      ];
  return systemCard(system, {
    badges: [linked ? organizationBadge(linked.name) : notLinkedBadge()],
    actions,
  });
}

function link(section, system, trigger, context) {
  const tracker = changeTracker(context);
  openSystemDialog({
    container: section,
    trigger,
    title: hostText("Link {p0} to an organization", { p0: system.name }),
    text: hostText(
      "Its bookings and guest links then belong to the organization you choose.",
    ),
    submitLabel: hostText("Link"),
    build: (form) =>
      organizationChoices(form, linkTargets(context.organizations), {
        blocked: serviceBlocked,
      }),
    onClosed: () => tracker.closed(system.id),
    submit({ data, status }) {
      const organizationId = data.get("organizationId");
      if (!organizationId) return false;
      return tracker.run({
        path: `${mine}/${encodeURIComponent(system.id)}/link`,
        body: { version: system.version, organizationId },
        status,
      });
    },
  });
}

function unlink(section, system, trigger, context) {
  const organization = system.linkedOrganization;
  const tracker = changeTracker(context);
  openSystemDialog({
    container: section,
    trigger,
    danger: true,
    title: hostText("Unlink {p0} from {p1}?", {
      p0: system.name,
      p1: organization.name,
    }),
    text: hostText(
      "It leaves the organization's systems. Guests who already have a link can still enter until their stay ends.",
    ),
    submitLabel: hostText("Unlink"),
    onClosed: () => tracker.closed(system.id),
    submit: ({ status, extra, close, settle }) =>
      tracker.run({
        path: `${mine}/${encodeURIComponent(system.id)}/unlink`,
        body: { version: system.version },
        status,
        onRefused: (error) =>
          bookingsRefusal(error, {
            status,
            extra,
            close,
            settle,
            title: hostText("Can't unlink {p0} yet", { p0: system.name }),
            system,
            organization,
            openBookings: context.openBookings,
            canOpenBookings: context.canOpenBookings,
          }),
      }),
  });
}

function remove(section, system, trigger, context) {
  const tracker = changeTracker(context);
  openSystemDialog({
    container: section,
    trigger,
    danger: true,
    title: hostText("Remove {p0} from My systems?", { p0: system.name }),
    text: hostText("You can add it again from the WIFIGATE app."),
    submitLabel: hostText("Remove"),
    onClosed: () => tracker.closed(),
    submit: ({ status }) =>
      tracker.run({
        path: `${mine}/${encodeURIComponent(system.id)}/remove`,
        body: { version: system.version },
        status,
      }),
  });
}
