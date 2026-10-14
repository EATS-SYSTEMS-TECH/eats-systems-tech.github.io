import { hostText } from "./host-locale.js";
import { node } from "./host-ui.js";
import { readHostPages } from "./host-pages.js";
import { portalRequest } from "./api/index.js";
import {
  readSystem,
  systemCard,
  systemGrid,
  badge,
  iconSrc,
  action,
  appSteps,
  emptyState,
  systemsToolbar,
  countText,
  openSystemDialog,
  bookingsRefusal,
  changeTracker,
} from "./host-system-cards.js";
import { renderExampleGroup } from "./host-example-cards.js";

// Organization systems: the selected organization's active systems. Owners
// and admins (systems:write) change a system's icon or remove it; staff and
// viewers see the list only. Systems are added from the WIFIGATE app, and
// names change there too. An organization member without a Host plan also
// finds the examples here.
const iconNames = {
  "bed-outline": "Bed",
  "business-outline": "Business",
  "home-outline": "Home",
  "barrier-gate-small": "Barrier gate",
  "cantilever-gate-small": "Sliding gate",
  "door-small": "Door",
  "electromagnetic-lock-small": "Magnetic lock",
  "garage-small": "Garage",
  "light-small": "Light",
  "pump-small": "Pump",
  "roller-shutter-small": "Roller shutter",
  "swing-gate-small": "Swing gate",
  barrier: "Barrier gate",
  entrance: "Entrance",
  family: "Family",
  folder: "Folder",
  garage: "Garage",
  gym: "Gym",
  home: "Home",
  hosting: "Hosting",
  office: "Office",
  residence: "Residence",
  shop: "Shop",
};
const iconName = (id) =>
  hostText(
    iconNames[id] ?? id.replace(/-(small|outline)$/, "").replaceAll("-", " "),
  );

// context: {user, identity, organization, permissions (a Set), plan,
// organizations, isCurrent, onChanged(focusId), openBookings(orgId),
// canOpenBookings(orgId), createLink(system, trigger, systems)}. People who
// book (reservations:write and invitations:write) get "Create guest link",
// which opens the booking sheet with the system chosen.
export async function renderOrganizationSystems(panel, context) {
  const { organization } = context;
  const base = `/api/v1/organizations/${encodeURIComponent(organization.id)}`;
  const section = node("section", undefined, {
    "aria-label": "WIFIGATE systems",
    class: "systems-view organization-systems",
  });
  panel.append(section);
  const { items } = await readHostPages(
    context.user,
    `${base}/systems`,
    context.isCurrent,
  );
  if (!context.isCurrent()) return;
  const systems = items
    .map(readSystem)
    .filter((system) => system && system.status === "active");
  const manager = context.permissions.has("systems:write");
  const booker =
    Boolean(context.createLink) &&
    context.permissions.has("reservations:write") &&
    context.permissions.has("invitations:write");
  // While the organization's service is paused, its systems cannot change:
  // the actions stay visible, disabled, with an ⓘ that says why. Remove stays
  // open: a paused organization can still free its gates.
  const blocked =
    organization.workspace?.service?.available === false
      ? "Service is unavailable for this organization right now."
      : undefined;
  if (!systems.length)
    section.append(
      manager
        ? emptyState(hostText("Add your first system from the WIFIGATE app."), {
            steps: appSteps(organization.name),
          })
        : emptyState(hostText("Ask an owner to add systems.")),
    );
  else {
    const shared = { ...context, base, section, icons: undefined };
    section.append(
      // Owners and admins add more systems only from the app, so the tip
      // above a list that is not empty still says how; others read the
      // rename rule only.
      systemsToolbar(
        countText(systems.length),
        manager
          ? hostText(
              "Add systems from the WIFIGATE app: open your profile → WIFIGATE Host → “Add to {p0}”. Rename them there too.",
              { p0: organization.name },
            )
          : hostText("To rename a system, rename it in the WIFIGATE app."),
      ),
      systemGrid(
        systems.map((system) =>
          systemCard(system, {
            badges: [sourceBadge(system, context.identity)],
            actions: [
              ...(booker
                ? [
                    action(
                      "Create guest link",
                      (button) => context.createLink(system, button, systems),
                      { name: "guest-link", blocked },
                    ),
                  ]
                : []),
              ...(manager
                ? [
                    action(
                      "Change icon",
                      (button) => changeIcon(system, button, shared),
                      { variant: "secondary", name: "icon", blocked },
                    ),
                    action(
                      "Remove",
                      (button) => remove(system, button, shared),
                      { variant: "danger", name: "remove" },
                    ),
                  ]
                : []),
            ],
          }),
        ),
      ),
    );
  }
  if (!context.plan)
    await renderExampleGroup(section, {
      user: context.user,
      organizations: context.organizations,
      isCurrent: context.isCurrent,
    });
}

const sameEmail = (a, b) =>
  Boolean(a && b) && a.trim().toLowerCase() === b.trim().toLowerCase();

function sourceBadge(system, identity) {
  if (system.source.kind !== "personal")
    return badge(hostText("Added in the app"), "source");
  const owner = system.source.ownerEmail;
  if (sameEmail(owner, identity?.user?.email))
    return badge(hostText("Linked from your My systems"), "source");
  return badge(
    owner
      ? hostText("Linked by {p0}", { p0: owner })
      : hostText("Linked from My systems"),
    "source",
  );
}

async function iconCatalog(context) {
  context.icons ??= portalRequest(
    context.user,
    `${context.base}/systems/icons`,
  ).catch((error) => {
    context.icons = undefined;
    throw error;
  });
  return context.icons;
}

function changeIcon(system, trigger, context) {
  const tracker = changeTracker(context);
  let choices;
  openSystemDialog({
    container: context.section,
    trigger,
    title: hostText("Change the icon of {p0}", { p0: system.name }),
    submitLabel: hostText("Save icon"),
    build(form) {
      choices = node("fieldset", undefined, {
        class: "choice-list choice-list--icons",
      });
      choices.append(
        node("legend", hostText("Icon")),
        node("p", hostText("Loading…"), { role: "status" }),
      );
      form.append(choices);
      iconCatalog(context).then(
        (catalog) => {
          if (!choices.isConnected) return;
          const ids = Array.isArray(catalog?.icons?.[system.type])
            ? catalog.icons[system.type].filter(
                (id) => typeof id === "string" && /^[a-z0-9-]{1,64}$/.test(id),
              )
            : [];
          choices.replaceChildren(node("legend", hostText("Icon")));
          for (const id of ids) {
            const label = node("label", undefined, {
              class: "choice choice--icon",
            });
            const radio = node("input", undefined, {
              type: "radio",
              name: "iconId",
              value: id,
            });
            radio.checked = id === system.iconId;
            label.append(
              radio,
              node("img", undefined, {
                src: iconSrc({ type: system.type, iconId: id }),
                alt: "",
                width: "40",
                height: "40",
              }),
              node("span", iconName(id), { class: "choice__name" }),
            );
            choices.append(label);
          }
          (
            choices.querySelector("input:checked") ??
            choices.querySelector("input")
          )?.focus();
        },
        () => {
          if (choices.isConnected)
            choices.replaceChildren(
              node("legend", hostText("Icon")),
              node(
                "p",
                hostText(
                  "Icons couldn't load. Close this window and try again.",
                ),
                {
                  role: "status",
                },
              ),
            );
        },
      );
    },
    onClosed: () => tracker.closed(system.id),
    submit({ data, status }) {
      const iconId = data.get("iconId");
      if (!iconId) return false;
      if (iconId === system.iconId) return true;
      const path = `${context.base}/systems/${encodeURIComponent(system.id)}`;
      const body = { version: system.version, iconId };
      return tracker.run({
        path,
        body,
        status,
        send: (key) => portalRequest(context.user, path, "PUT", body, key),
      });
    },
  });
}

function remove(system, trigger, context) {
  const tracker = changeTracker(context);
  const owner = system.source.ownerEmail;
  const returns =
    system.source.kind !== "personal"
      ? hostText(
          "To use it here again, add it from the WIFIGATE app. Guests who already have a link can still enter until their stay ends.",
        )
      : sameEmail(owner, context.identity?.user?.email)
        ? hostText(
            "It goes back to your My systems. Guests who already have a link can still enter until their stay ends.",
          )
        : owner
          ? hostText(
              "It goes back to the My systems of {p0}. Guests who already have a link can still enter until their stay ends.",
              { p0: owner },
            )
          : hostText(
              "It goes back to its owner's My systems. Guests who already have a link can still enter until their stay ends.",
            );
  openSystemDialog({
    container: context.section,
    trigger,
    danger: true,
    title: hostText("Remove {p0} from {p1}?", {
      p0: system.name,
      p1: context.organization.name,
    }),
    text: returns,
    submitLabel: hostText("Remove"),
    onClosed: () => tracker.closed(),
    submit: ({ status, extra, close, settle }) =>
      tracker.run({
        path: `${context.base}/systems/${encodeURIComponent(system.id)}/remove`,
        body: { version: system.version },
        status,
        onRefused: (error) =>
          bookingsRefusal(error, {
            status,
            extra,
            close,
            settle,
            title: hostText("Can't remove {p0} yet", { p0: system.name }),
            system,
            organization: context.organization,
            openBookings: context.openBookings,
            canOpenBookings: context.canOpenBookings,
          }),
      }),
  });
}
