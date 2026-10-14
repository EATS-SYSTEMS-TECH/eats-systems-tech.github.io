import { hostText } from "./host-locale.js";
import { node, infoTip } from "./host-ui.js";
import {
  exampleSystems,
  readExampleLinks,
  setExampleLink,
} from "./host-example-systems.js";
import {
  systemCard,
  systemGrid,
  organizationBadge,
  notLinkedBadge,
  examplePill,
  action,
  openSystemDialog,
  organizationChoices,
} from "./host-system-cards.js";
import { openTryIt } from "./host-try-it.js";

// The "Examples" group: the three example systems with a dashed violet
// border and an Example pill. They cannot be removed. "Try it" opens the
// simulator. For everyone who reaches it, with or without a Host plan,
// each example carries its link badge ("Not linked" or an organization) and
// "Link to organization" / "Unlink", which only change that badge in this
// browser (any organization the person belongs to). Nothing about it ever
// reaches the server, a calendar or a booking.
let groups = 0;
export async function renderExampleGroup(
  container,
  { user, organizations = [], isCurrent },
) {
  const titleId = `examples-title-${++groups}`;
  const group = node("section", undefined, {
    class: "systems-group systems-group--examples",
    "aria-labelledby": titleId,
    "data-examples": "",
  });
  const heading = node("h3", undefined, {
    id: titleId,
    class: "systems-group__title",
  });
  heading.append(
    node("span", hostText("Examples")),
    infoTip(
      hostText(
        "Examples always stay here so you can try things. They never open a gate.",
      ),
    ),
  );
  const holder = node("div");
  group.append(heading, holder);
  container.append(group);
  let links = await readExampleLinks(user.uid);
  if (!isCurrent?.()) return;
  const known = (link) =>
    link && organizations.find((organization) => organization.id === link.id);

  const render = (focus) => {
    holder.replaceChildren(
      systemGrid(
        exampleSystems.map((example) => {
          const linked = known(links[example.id]);
          const tryIt = action(
            "Try it",
            (button) =>
              openTryIt(example, { container: group, trigger: button }),
            { name: "try" },
          );
          const actions = [
            tryIt,
            linked
              ? action(
                  "Unlink",
                  async () => {
                    links = await setExampleLink(user.uid, example.id, null);
                    render({ id: example.id, action: "link" });
                  },
                  { variant: "secondary", name: "unlink" },
                )
              : action(
                  "Link to organization",
                  (button) => link(example, button),
                  {
                    variant: "secondary",
                    name: "link",
                    blocked: organizations.length
                      ? undefined
                      : "Join an organization to try this.",
                  },
                ),
          ];
          return systemCard(example, {
            badges: [
              examplePill(),
              linked ? organizationBadge(linked.name) : notLinkedBadge(),
            ],
            actions,
          });
        }),
      ),
    );
    if (focus)
      holder
        .querySelector(
          `[data-system-id="${focus.id}"] [data-action="${focus.action}"]`,
        )
        ?.focus();
  };

  function link(example, trigger) {
    openSystemDialog({
      container: group,
      trigger,
      title: hostText("Link {p0} to an organization", { p0: example.name }),
      text: hostText(
        "Only you see this, and only its badge changes. A real system is linked to an organization where you're an owner or admin.",
      ),
      submitLabel: hostText("Link"),
      build: (form) => organizationChoices(form, organizations),
      async submit({ data }) {
        const id = data.get("organizationId");
        const organization = organizations.find((entry) => entry.id === id);
        if (!organization) return false;
        links = await setExampleLink(user.uid, example.id, organization);
        return true;
      },
      onClosed: () => {
        if (group.isConnected)
          render({
            id: example.id,
            action: known(links[example.id]) ? "unlink" : "link",
          });
      },
    });
  }

  render();
}
