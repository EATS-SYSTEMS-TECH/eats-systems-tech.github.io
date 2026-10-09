// Views reuse server-authorized components; no image or sample reservations are rendered.
const nav = document.getElementById("host-section-navigation"),
  root = document.getElementById("host-management");
const entries = [
  [
    "Team invitations",
    'section[aria-label="Team invitations"]',
    "users",
    "Management",
  ],
  ["Overview", "#admin-overview", "users", ""],
  ["Calendar", ".host-calendar", "calendar", ""],
  [
    "Properties",
    'section[aria-label="properties"], section[aria-label="rooms"]',
    "home",
    "",
  ],
  ["Reservations", 'section[aria-label="Reservations"]', "key", ""],
  ["Guests", 'section[aria-label="Guests"]', "users", "Management"],
  [
    "Staff",
    'section[aria-label="members"], section[aria-label="Invite team members"]',
    "users",
    "Management",
  ],
  [
    "Access Keys",
    'section[aria-label="WIFIGATE systems"]',
    "key",
    "Management",
  ],
  [
    "Automation",
    'section[aria-label="Automatic guest access"]',
    "bolt",
    "Management",
  ],
  [
    "Jobs Calendar",
    'section[aria-label="Host operations"]',
    "calendar",
    "Management",
  ],
  ["Invoices", "[data-workspace-billing]", "file", "Billing"],
  [
    "Service health",
    'section[aria-label="Service health"]',
    "bolt",
    "Management",
  ],
  [
    "API integrations",
    'section[aria-label="API integrations"], section[aria-label="Reservation integrations"]',
    "key",
    "Management",
  ],
  [
    "System Import",
    'section[aria-label="System import approvals"]',
    "home",
    "Management",
  ],
  [
    "Support",
    'section[aria-label="Temporary support access"], section[aria-label="Approved support diagnostics"]',
    "chat",
    "Management",
  ],
  ["Settings", "#account-details, #admin-approval", "settings", "Settings"],
  ["Organizations", "#host-management", "home", "Settings"],
];
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
const viewSlug = (label) => label.toLowerCase().replaceAll(" ", "-");
function locationView() {
  if (location.pathname === "/dashboard/host/overview/") return "Overview";
  const view = new URLSearchParams(location.search).get("view");
  return entries.find(([label]) => viewSlug(label) === view)?.[0] ?? "Calendar";
}
let selected = locationView();
const buttons = new Map();
for (const group of ["", "Management", "Billing", "Settings"]) {
  const items = entries.filter((item) => item[3] === group);
  if (!items.length) continue;
  if (group) {
    const title = document.createElement("p");
    title.className = "sidebar-group";
    title.textContent = group;
    nav.append(title);
  }
  for (const [label, selector, icon] of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.view = label;
    button.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[icon]}"/></svg>`;
    const text = document.createElement("span");
    text.textContent = label;
    button.append(text);
    button.addEventListener("click", () => choose(label, true));
    buttons.set(label, button);
    nav.append(button);
  }
}
function targets(label) {
  const entry = entries.find((item) => item[0] === label);
  return entry
    ? [...document.querySelectorAll(entry[1])].filter(
        (element) => !element.hidden,
      )
    : [];
}
function updateLocation(label, push = false) {
  const url = new URL(location.href);
  url.pathname = label === "Overview" ? "/dashboard/host/overview/" : "/dashboard/host/";
  if (label === "Overview" || label === "Calendar") url.searchParams.delete("view");
  else url.searchParams.set("view", viewSlug(label));
  if (label !== "Overview") url.searchParams.delete("tab");
  if (url.href !== location.href) history[push ? "pushState" : "replaceState"](null, "", url);
}
function choose(label, focus = false, push = focus) {
  if (!buttons.has(label) || !targets(label).length) return;
  selected = label;
  updateLocation(label, push);
  refresh();
  if (label === "Settings") {
    const details = document.getElementById("account-details");
    if (details) details.open = true;
  }
  if (focus) {
    const target = targets(label)[0];
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}
function refresh() {
  if (root.dataset.loading === "false" && selected !== "Calendar" && !targets(selected).length) {
    selected = "Calendar";
    updateLocation(selected);
  }
  if (selected === "Settings") {
    const details = document.getElementById("account-details");
    if (details && !details.hidden) details.open = true;
  }
  document.body.dataset.hostView = selected;
  const selectedTargets = targets(selected);
  for (const [label, button] of buttons) {
    const available = targets(label).length > 0;
    button.disabled = !available;
    if (label === "Overview") button.hidden = !available;
    button.title = available
      ? ""
      : root.dataset.organizationId
        ? "Unavailable for your current role"
        : "Choose an authorized organization first";
    if (label === selected) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  for (const child of root.children) {
    let show =
      selected === "Organizations" ||
      selectedTargets.some(
        (target) => child === target || child.contains(target),
      );
    if (
      root.dataset.loading === "true" &&
      child.tagName === "P"
    )
      show = true;
    if (
      selected === "Calendar" &&
      root.dataset.loading !== "true" &&
      !selectedTargets.length &&
      ["P", "BUTTON"].includes(child.tagName)
    )
      show = true;
    if (
      selected === "Organizations" &&
      child.classList.contains("host-empty-calendar")
    )
      show = false;
    child.classList.toggle("workspace-hidden", !show);
  }
  // Billing is a real draft-statement view within the operations component.
  const operations = root.querySelector(
    'section[aria-label="Host operations"]',
  );
  if (operations)
    for (const child of operations.children)
      child.classList.toggle(
        "workspace-billing-hidden",
        selected === "Invoices" && !child.matches("[data-workspace-billing]"),
      );
}
new MutationObserver(refresh).observe(root, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ["data-loading"],
});
const overview = document.getElementById("admin-overview");
if (overview)
  new MutationObserver(refresh).observe(overview, {
    attributes: true,
    attributeFilter: ["hidden"],
  });
new MutationObserver(refresh).observe(
  document.getElementById("account-details"),
  { attributes: true, attributeFilter: ["hidden"] },
);
window.addEventListener("host:workspace-view", (event) =>
  choose(event.detail, true),
);
window.addEventListener("host:workspace-reset", (event) => {
  selected = event.detail?.sessionEnded === false ? locationView() : "Calendar";
  if (event.detail?.sessionEnded !== false) updateLocation(selected);
  refresh();
});
window.addEventListener("popstate", () => {
  selected = locationView();
  refresh();
});
document
  .getElementById("sidebar-profile")
  ?.addEventListener("click", () => choose("Settings", true));
refresh();
