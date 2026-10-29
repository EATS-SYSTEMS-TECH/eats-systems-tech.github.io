import {
  workspaceViews,
  workspaceView,
  workspaceLocation,
  settingsTabFor,
} from "./host-workspace-model.js";
import { hostText } from "./host-locale.js";

// Sidebar navigation, the phone tab bar, the join-organization bell and the
// Platform item. A view's item is shown only while the workspace has built
// its panel, so what is visible always follows the server-authorized
// workspace; the URL (?view=, ?tab=) is only a preference.
const nav = document.getElementById("host-section-navigation");
const root = document.getElementById("host-management");
const sidebar = document.getElementById("host-sidebar");
const platformNav = document.getElementById("host-platform-navigation");
const tabbar = document.getElementById("host-tabbar");
const bell = document.getElementById("join-organization");
const scrim = document.querySelector(".host-scrim");
const sharedLayout = document.body.classList.contains("host-manager-workspace");
const icons = {
  grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  building:
    "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16 M15 9h4a1 1 0 0 1 1 1v11 M3 21h18 M8 8h3 M8 12h3 M8 16h3",
  calendar: "M4 6h16v15H4z M8 3v6 M16 3v6 M4 11h16",
  list: "M9 6h11 M9 12h11 M9 18h11 M4 6h.01 M4 12h.01 M4 18h.01",
  bolt: "m13 2-9 12h7l-1 8 10-13h-7z",
  plug: "M9 2v6 M15 2v6 M6 8h12v4a6 6 0 0 1-12 0z M12 18v4",
  settings:
    "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v4 M12 18v4 M2 12h4 M18 12h4 M5 5l3 3 M16 16l3 3 M5 19l3-3 M16 8l3-3",
  bell: "M6 16V11a6 6 0 0 1 12 0v5l2 2H4z M10 20a2 2 0 0 0 4 0",
  shield: "M12 3 5 6v5c0 4.4 2.9 8.3 7 9.6 4.1-1.3 7-5.2 7-9.6V6z M9 12l2 2 4-4",
  more: "M4 7h16 M4 12h16 M4 17h16",
};
const svg = (icon) =>
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' +
  icons[icon] +
  '"/></svg>';
const homeOf = () => root.dataset.homeView || undefined;
let selected = workspaceLocation(new URL(location.href), homeOf());
const buttons = new Map();
const tabs = new Map();

let toggle = document.querySelector(".workspace-menu-toggle");
if (!toggle) {
  toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "workspace-menu-toggle";
  toggle.innerHTML = svg("more");
  // Outside the drawer it opens, so a phone can always reach it.
  (sidebar ?? nav).before(toggle);
}
toggle.setAttribute("aria-label", hostText("Menu"));
toggle.setAttribute("aria-controls", (sidebar ?? nav).id);
toggle.setAttribute("aria-expanded", "false");

const mobile = matchMedia("(max-width: 959px)");
// On a phone the open drawer is modal: everything behind the scrim is inert,
// so Tab and a screen reader stay inside the drawer until it closes.
const behindDrawer = () =>
  [
    ".workspace-skip-link",
    ".host-topbar",
    "#workspace-main",
    "#host-tabbar",
    ".portal-legal",
  ]
    .map((selector) => document.querySelector(selector))
    .filter(Boolean);
function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("workspace-menu-open", open);
  sidebar?.classList.toggle("is-open", open);
  if (scrim) scrim.hidden = !open;
  document.body.classList.toggle("host-menu-open", open);
  tabs.get("more")?.setAttribute("aria-expanded", String(open));
  const modal = !sharedLayout && open && mobile.matches && Boolean(sidebar);
  for (const element of behindDrawer()) element.inert = modal;
}
function toggleMenu() {
  if (sharedLayout) return;
  const open = toggle.getAttribute("aria-expanded") !== "true";
  setMenu(open);
  // The drawer takes focus on a phone, so the keyboard lands inside it.
  if (open && mobile.matches)
    requestAnimationFrame(() =>
      sidebar
        ?.querySelector("button:not([hidden]):not(:disabled)")
        ?.focus({ preventScroll: true }),
    );
}
toggle.addEventListener("click", toggleMenu);
scrim?.addEventListener("click", () => setMenu(false));
window.addEventListener("host:menu-close", () => setMenu(false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    toggle.focus();
  }
});

function viewButton(view, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.disabled = true;
  button.hidden = true;
  button.dataset.view = view.label;
  button.dataset.viewId = view.id;
  button.className = [className, sharedLayout ? "manager-button" : ""].filter(Boolean).join(" ");
  if (!sharedLayout || view.placement === "platform") button.innerHTML = svg(view.icon);
  const label = document.createElement("span");
  label.textContent = hostText(view.label);
  button.append(label);
  if (sharedLayout && view.placement === "platform") {
    button.classList.add("platform-management-entry", "manager-platform-entry", "host-platform-entry");
    label.textContent = hostText("Platform management");
    button.title = label.textContent;
  }
  button.addEventListener("click", () =>
    choose(view.id, { push: true, focus: true }),
  );
  return button;
}

for (const view of workspaceViews) {
  if (view.placement === "bell") {
    // The bell in the top bar; without one (a reduced page) it is a nav item.
    const button = bell ?? viewButton(view);
    if (bell) {
      if (sharedLayout) {
        button.className = "manager-button";
        const label = document.createElement("span");
        label.textContent = hostText(view.label);
        button.replaceChildren(label);
        nav.append(button);
      }
      button.dataset.view = view.label;
      button.dataset.viewId = view.id;
      button.setAttribute("aria-label", hostText(view.label));
      button.addEventListener("click", () =>
        choose(view.id, { push: true, focus: true }),
      );
    } else nav.append(button);
    if (!button.querySelector("[data-invitation-count]")) {
      const badge = document.createElement("span");
      badge.dataset.invitationCount = "true";
      badge.setAttribute("aria-hidden", "true");
      button.append(badge);
    }
    buttons.set(view.id, button);
    continue;
  }
  const button = viewButton(view);
  buttons.set(view.id, button);
  if (view.placement !== "platform") nav.append(button);
}

if (tabbar) {
  for (const id of ["slot-1", "slot-2", "slot-3", "more"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.hidden = id !== "more";
    if (id === "more") {
      button.dataset.tab = "more";
      button.innerHTML = svg("more");
      const label = document.createElement("span");
      label.textContent = hostText("More");
      button.append(label);
      button.setAttribute("aria-controls", (sidebar ?? nav).id);
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", toggleMenu);
    } else
      button.addEventListener("click", () => {
        if (button.dataset.tabView)
          choose(button.dataset.tabView, { push: true, focus: true });
      });
    tabs.set(id, button);
    tabbar.append(button);
  }
}

function targets(id) {
  const view = workspaceView(id);
  if (!view) return [];
  const panel = root.querySelector('[data-workspace-view="' + view.id + '"]');
  if (panel) return [panel];
  const selectors =
    view.selector +
    ", " +
    view.selector.replaceAll("aria-label=", "data-host-section=");
  return [...document.querySelectorAll(selectors)].filter(
    (element) => !element.hidden,
  );
}

function choose(
  value,
  { push = false, focus = false, closeMenu = push || focus } = {},
) {
  const view = workspaceView(value);
  if (!view) return;
  const authorizedDuringReload =
    root.dataset.loading === "true" && !buttons.get(view.id).disabled;
  if (!targets(view.id).length && !authorizedDuringReload) return;
  const previous = selected;
  selected = view.id;
  for (const dialog of root.querySelectorAll("dialog[open]")) dialog.close();
  const url = new URL(location.href);
  url.pathname =
    selected === "overview" ? "/dashboard/host/overview/" : "/dashboard/host/";
  if (selected === "overview" || selected === homeOf())
    url.searchParams.delete("view");
  else url.searchParams.set("view", selected);
  const tab = settingsTabFor(value);
  if (selected === "settings") {
    if (tab) url.searchParams.set("tab", tab);
    else if (previous !== "settings") url.searchParams.delete("tab");
  } else if (selected !== "overview") url.searchParams.delete("tab");
  if (selected !== "activity") url.searchParams.delete("section");
  if (value === "Jobs Calendar") url.searchParams.set("section", "jobs");
  if (value === "Service health") url.searchParams.set("section", "health");
  if (url.href !== location.href)
    history[push ? "pushState" : "replaceState"](null, "", url);
  if (closeMenu) setMenu(false);
  refresh();
  window.dispatchEvent(
    new CustomEvent("host:workspace-navigate", { detail: selected }),
  );
  if (focus) {
    const target = targets(selected)[0];
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
    if (previous !== selected) window.scrollTo({ top: 0, behavior: "instant" });
  }
}

function available(id) {
  const button = buttons.get(id);
  return (
    targets(id).length > 0 ||
    (root.dataset.loading === "true" && Boolean(button) && !button.disabled)
  );
}

function refresh() {
  const home = homeOf();
  const waitingForOverview =
    selected === "overview" &&
    root.dataset.platformRole === "admin" &&
    document.getElementById("admin-overview")?.hidden;
  if (
    root.dataset.loading === "false" &&
    root.dataset.workspaceReadFailed !== "true" &&
    home &&
    selected !== home &&
    !targets(selected).length &&
    !waitingForOverview
  ) {
    selected = home;
    const url = new URL(location.href);
    url.pathname = "/dashboard/host/";
    url.searchParams.delete("view");
    url.searchParams.delete("section");
    url.searchParams.delete("tab");
    if (url.href !== location.href) history.replaceState(null, "", url);
    window.dispatchEvent(
      new CustomEvent("host:workspace-navigate", { detail: selected }),
    );
  }
  const view = workspaceView(selected);
  document.body.dataset.hostView = view?.label ?? "";
  document.body.dataset.hostViewId = view?.id ?? "";
  const currentView = document.getElementById("workspace-current-view");
  if (currentView) {
    currentView.textContent = view ? hostText(view.label) : "WIFIGATE Host";
    document.title = view
      ? `${currentView.textContent} | WIFIGATE Host`
      : "WIFIGATE Host";
  }
  const selectedTargets = targets(selected);
  const inbox = root.querySelector('[data-workspace-view="invitations"]');
  const count =
    inbox?.querySelectorAll("article[data-invitation-id]").length ?? 0;
  const badge = buttons
    .get("invitations")
    ?.querySelector("[data-invitation-count]");
  if (badge && badge.textContent !== (count ? String(count) : ""))
    badge.textContent = count ? String(count) : "";
  if (bell)
    bell.setAttribute(
      "aria-label",
      count
        ? hostText("Join an organization ({p0} waiting)", { p0: count })
        : hostText("Join an organization"),
    );
  for (const [id, button] of buttons) {
    const open = available(id);
    button.hidden = !open;
    button.disabled = !open;
    if (id === selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  if (tabbar) {
    // Phone tab bar: home, Calendar and Bookings when they exist, then More.
    const order = [home, "calendar", "bookings", "systems", "my-systems"];
    const ids = [...new Set(order.filter((id) => id && available(id)))]
      .filter((id) => id !== "invitations" || home === "invitations")
      .slice(0, 3);
    ["slot-1", "slot-2", "slot-3"].forEach((slot, index) => {
      const button = tabs.get(slot);
      const id = ids[index];
      const target = workspaceView(id);
      button.hidden = !target;
      if (!target) {
        delete button.dataset.tabView;
        button.removeAttribute("aria-current");
        return;
      }
      if (button.dataset.tabView !== id) {
        button.dataset.tabView = id;
        button.innerHTML = svg(target.icon);
        const label = document.createElement("span");
        label.textContent = hostText(target.short ?? target.label);
        button.append(label);
      }
      if (id === selected) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    tabbar.hidden =
      sharedLayout || !ids.length || Boolean(document.getElementById("host-sidebar")?.hidden);
  }
  // With nothing to navigate to (a pending account sees only the
  // join-organization view) the sidebar, menu button and tab bar go away.
  if (root.dataset.loading === "false") {
    const empty = ![...buttons].some(
      ([id, button]) => id !== "invitations" && !button.hidden,
    );
    document.body.classList.toggle("host-menu-empty", empty);
    if (empty && tabbar) tabbar.hidden = true;
  }
  for (const child of root.children) {
    const show =
      selectedTargets.some(
        (target) => child === target || child.contains(target),
      ) ||
      (child.dataset.workspaceNotice === "true" &&
        !["overview", "settings", "my-systems", "invitations"].includes(
          selected,
        )) ||
      (!selectedTargets.length && ["P", "BUTTON"].includes(child.tagName)) ||
      (root.dataset.loading === "true" && child.tagName === "P");
    child.classList.toggle("workspace-hidden", !show);
  }
}

new MutationObserver(refresh).observe(root, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-loading", "data-home-view"],
});
for (const id of ["admin-overview", "host-sidebar"]) {
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
  const requested = workspaceLocation(new URL(location.href), homeOf());
  if (
    requested === "overview" &&
    root.dataset.platformRole === "admin" &&
    !targets(requested).length
  ) {
    selected = requested;
    refresh();
    return;
  }
  const home = homeOf();
  choose(
    requested && targets(requested).length
      ? new URL(location.href).searchParams.get("view") ?? requested
      : home,
  );
  refresh();
});
window.addEventListener("host:workspace-reset", (event) => {
  selected =
    event.detail?.sessionEnded === false
      ? workspaceLocation(new URL(location.href), homeOf())
      : undefined;
  if (event.detail?.sessionEnded !== false) {
    setMenu(false);
    for (const button of buttons.values()) button.disabled = true;
    delete root.dataset.homeView;
    const url = new URL(location.href);
    url.pathname = "/dashboard/host/";
    url.searchParams.delete("view");
    url.searchParams.delete("section");
    url.searchParams.delete("tab");
    if (url.href !== location.href) history.replaceState(null, "", url);
  }
  refresh();
});
window.addEventListener("popstate", () => {
  const requested = workspaceLocation(new URL(location.href), homeOf());
  selected = requested;
  if (root.dataset.loading === "true") refresh();
  else
    choose(targets(requested).length ? requested : homeOf(), {
      closeMenu: true,
    });
});
mobile.addEventListener?.("change", (event) => {
  if (!event.matches) setMenu(false);
});
refresh();

if (workspaceLocation(new URL(location.href), "home") === "overview") {
 const query = new URLSearchParams({ product: "host" });
 if (new URLSearchParams(location.search).get("lang") === "he") query.set("lang", "he");
 location.replace("/dashboard/platform/?" + query);
}
