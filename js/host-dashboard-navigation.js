import {
  workspaceViews,
  workspaceView,
  workspaceLocation,
} from "./host-workspace-model.js";

const nav = document.getElementById("host-section-navigation");
const root = document.getElementById("host-management");
const hebrew = new URL(location.href).searchParams.get("lang") === "he";
const icons = {
  calendar: "M4 6h16v15H4z M8 3v6 M16 3v6 M4 11h16",
  home: "M3 11 12 3l9 8 M6 10v11h12V10 M10 21v-7h4v7",
  key: "M14 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12 M10 13l-7 7v2h4v-3h3v-3",
  users:
    "M16 8a4 4 0 1 0-8 0 4 4 0 0 0 8 0 M4 21v-2a8 8 0 0 1 16 0v2 M19 4a3 3 0 0 1 0 6",
  bolt: "m13 2-9 12h7l-1 8 10-13h-7z",
  file: "M6 3h8l4 4v15H6z M14 3v5h4 M9 12h6 M9 16h6",
  chat: "M3 4h18v13H9l-6 4z M7 10h1 M11 10h1 M15 10h1",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v4 M12 18v4 M2 12h4 M18 12h4 M5 5l3 3 M16 16l3 3 M5 19l3-3 M16 8l3-3",
};
let selected = workspaceLocation(new URL(location.href));
const buttons = new Map();
const groups = new Map();
const toggle = document.createElement("button");
toggle.type = "button";
toggle.className = "workspace-menu-toggle";
toggle.textContent = hebrew ? "תפריט" : "Menu";
toggle.setAttribute("aria-controls", nav.id);
toggle.setAttribute("aria-expanded", "false");
nav.before(toggle);
toggle.addEventListener("click", () => {
  const expanded = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", String(expanded));
  nav.classList.toggle("workspace-menu-open", expanded);
});

for (const group of ["", "Management", "Advanced", "Account", "Platform"]) {
  const heading = document.createElement("p");
  heading.className = "sidebar-group";
  heading.textContent = hebrew
    ? ({
        Management: "ניהול",
        Advanced: "מתקדם",
        Account: "חשבון",
        Platform: "פלטפורמה",
      }[group] ?? "")
    : group;
  if (group) nav.append(heading);
  groups.set(group, heading);
  for (const view of workspaceViews.filter((item) => item.group === group)) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.view = view.label;
    button.dataset.viewId = view.id;
    button.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' +
      icons[view.icon] +
      '"/></svg>';
    const label = document.createElement("span");
    label.textContent = hebrew ? view.he : view.label;
    button.append(label);
    button.addEventListener("click", () =>
      choose(view.id, { push: true, focus: true }),
    );
    buttons.set(view.id, button);
    if (view.id === "invitations") {
      button.className = "workspace-inbox-button";
      button.setAttribute("aria-label", hebrew ? view.he : view.label);
      const badge = document.createElement("span");
      badge.dataset.invitationCount = "true";
      badge.setAttribute("aria-hidden", "true");
      button.append(badge);
      const switcher = document.getElementById("workspace-org-switcher");
      if (switcher) switcher.after(button);
      else nav.after(button);
    } else nav.append(button);
  }
}

function targets(id) {
  const view = workspaceView(id);
  if (!view) return [];
  const panel = root.querySelector('[data-workspace-view="' + view.id + '"]');
  if (panel) return [panel];
  return [...document.querySelectorAll(view.selector)].filter(
    (element) => !element.hidden,
  );
}

function choose(value, { push = false, focus = false } = {}) {
  const view = workspaceView(value);
  if (!view || !targets(view.id).length) return;
  selected = view.id;
  for (const dialog of root.querySelectorAll("dialog[open]")) dialog.close();
  const url = new URL(location.href);
  url.pathname =
    selected === "overview" ? "/dashboard/host/overview/" : "/dashboard/host/";
  if (selected === "overview" || selected === "calendar")
    url.searchParams.delete("view");
  else url.searchParams.set("view", selected);
  if (selected !== "overview") url.searchParams.delete("tab");
  if (selected !== "operations") url.searchParams.delete("section");
  if (value === "Jobs Calendar") url.searchParams.set("section", "jobs");
  if (value === "Service health") url.searchParams.set("section", "health");
  if (push && url.href !== location.href) history.pushState(null, "", url);
  else if (!push) history.replaceState(null, "", url);
  toggle.setAttribute("aria-expanded", "false");
  nav.classList.remove("workspace-menu-open");
  refresh();
  window.dispatchEvent(
    new CustomEvent("host:workspace-navigate", { detail: selected }),
  );
  if (selected === "account")
    document.getElementById("account-details").open = true;
  if (focus) {
    const target = targets(selected)[0];
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function refresh() {
  document.body.dataset.hostView = workspaceView(selected)?.label ?? "Calendar";
  const selectedTargets = targets(selected);
  const badge = buttons
    .get("invitations")
    .querySelector("[data-invitation-count]");
  const inbox = root.querySelector('[data-workspace-view="invitations"]');
  const count =
    inbox?.querySelectorAll("article[data-invitation-id]").length ?? 0;
  const countLabel = String(count);
  if (badge.textContent !== countLabel) badge.textContent = countLabel;
  for (const [id, button] of buttons) {
    const available = targets(id).length > 0;
    button.hidden = !available && id !== "calendar";
    button.disabled = !available;
    if (id === selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  for (const [group, heading] of groups) {
    heading.hidden = !workspaceViews.some(
      (view) => view.group === group && !buttons.get(view.id).hidden,
    );
  }
  for (const child of root.children) {
    const show =
      selectedTargets.some(
        (target) => child === target || child.contains(target),
      ) ||
      (child.dataset.workspaceNotice === "true" &&
        !["overview", "account"].includes(selected)) ||
      (!selectedTargets.length && ["P", "BUTTON"].includes(child.tagName));
    child.classList.toggle("workspace-hidden", !show);
  }
}

new MutationObserver(refresh).observe(root, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-loading"],
});
for (const id of ["admin-overview", "account-details"]) {
  const element = document.getElementById(id);
  if (element)
    new MutationObserver(refresh).observe(element, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
}
window.addEventListener("host:workspace-view", (event) =>
  choose(event.detail, { push: true, focus: true }),
);
window.addEventListener("host:workspace-ready", () => {
  const requested = workspaceLocation(new URL(location.href));
  if (
    requested === "overview" &&
    root.dataset.platformRole === "admin" &&
    !targets(requested).length
  ) {
    selected = requested;
    refresh();
    return;
  }
  choose(targets(requested).length ? requested : "calendar");
  refresh();
});
window.addEventListener("host:workspace-reset", () => {
  selected = "calendar";
  refresh();
});
window.addEventListener("popstate", () => {
  const requested = workspaceLocation(new URL(location.href));
  choose(targets(requested).length ? requested : "calendar");
});
document
  .getElementById("sidebar-profile")
  ?.addEventListener("click", () =>
    choose("account", { push: true, focus: true }),
  );
refresh();
