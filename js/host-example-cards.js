import { hostText, hostLanguage } from "./host-locale.js";
import { node } from "./host-ui.js";
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

// The "Examples" group uses the same system cards as Manager and real Host
// systems. They cannot be removed. "Open workspace" opens the
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
  const group = node("details", undefined, {
    class: "manager-examples systems-group systems-group--examples dashboard-examples",
    "aria-labelledby": titleId,
    "data-examples": "",
  });
  const heading = node("summary", undefined, {
    id: titleId,
    class: "systems-group__title",
  });
  heading.append(node("span", hostText("Examples")));
  const holder = systemGrid([]);
  holder.classList.add("manager-example-grid");
  group.append(
    heading,
    node("p", hostText("Examples always stay here so you can try things. They never open a gate."), { class: "manager-muted" }),
    holder,
  );
  container.prepend(group);
  let links = await readExampleLinks(user.uid);
  if (!isCurrent?.()) return;
  const known = (link) =>
    link && organizations.find((organization) => organization.id === link.id);

  const render = (focus) => {
    holder.replaceChildren(
      ...exampleSystems.map((example) => {
          const linked = known(links[example.id]);
          const actions = [
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
            onOpenWorkspace(trigger, controls, badges) {
              const dialog = openTryIt(example, { container: group, trigger });
              const menu = node("details", undefined, {
                class: "manager-system-menu host-example-options",
              });
              const summary = node("summary", "⋯", {
                "aria-label": hostLanguage === "he" ? "פעולות מערכת" : "System actions",
              });
              const options = node("div", undefined, {
                class: "manager-system-options",
              });
              options.append(...controls);
              for (const button of options.querySelectorAll("button"))
                button.workspaceTrigger = trigger;
              options.addEventListener("click", (event) => {
                if (event.target.closest("button[data-action]:not(:disabled)"))
                  dialog.close();
              }, true);
              menu.append(summary, options);
              const badgeRow = node("p", undefined, {
                class: "system-card__badges host-example-link",
              });
              // The simulator already identifies itself as an example.
              badgeRow.append(...badges.filter((badge) => !badge.classList.contains("system-badge--example")));
              dialog.querySelector(".try-it__header").insertBefore(menu, dialog.querySelector(".try-it__close"));
              dialog.querySelector(".try-it__note").after(badgeRow);
            },
          });
        }),
    );
    if (focus)
      holder
        .querySelector(
          `[data-system-id="${focus.id}"] [data-action="workspace"]`,
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
