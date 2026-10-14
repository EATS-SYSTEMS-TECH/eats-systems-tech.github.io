import { hostText, hostLanguage, hostLocale } from "./host-locale.js";
import { node, labelTip } from "./host-ui.js";
import { roleBadge } from "./host-role-badge.js";
import { can, organizationRole, servicePaused } from "./host-permissions.js";
import { settingsTab, workspaceLocation } from "./host-workspace-model.js";
import { initial } from "./host-org-selector.js";
import { zoneOf } from "./host-booking-model.js";

// Settings: one view with tabs (Organization, Team, Plan & statements,
// Support access, Account & security). Each tab loads when it is first
// opened; ?tab= keeps the choice across reloads and history.
// options: {tabs, loaders, message(error), refreshPending(), refresh()}.
export async function renderSettings(panel, viewCurrent, options) {
  const { tabs, loaders } = options;
  const bar = node("div", undefined, {
    class: "workspace-tabs settings-tabs",
    role: "tablist",
    "aria-label": "Settings",
  });
  const body = node("div", undefined, { class: "settings-body" });
  panel.append(bar, body);
  const entries = new Map();
  for (const tab of tabs) {
    const button = node("button", hostText(tab.label), {
      type: "button",
      role: "tab",
      id: `settings-tab-${tab.id}`,
      "aria-selected": "false",
      "aria-controls": `settings-panel-${tab.id}`,
      "data-settings-tab": tab.id,
    });
    const content = node("div", undefined, {
      id: `settings-panel-${tab.id}`,
      role: "tabpanel",
      "aria-labelledby": button.id,
      "data-settings-panel": tab.id,
      hidden: "",
    });
    button.addEventListener("click", () => void select(tab.id, true));
    bar.append(button);
    body.append(content);
    entries.set(tab.id, { button, content, loading: undefined });
  }
  bar.addEventListener("keydown", (event) => {
    const order = [...entries.keys()];
    const index = order.indexOf(
      event.target.closest("[data-settings-tab]")?.dataset.settingsTab,
    );
    if (index < 0) return;
    const step =
      { ArrowRight: 1, ArrowLeft: -1 }[event.key] *
      (document.documentElement.dir === "rtl" ? -1 : 1);
    if (!step) return;
    event.preventDefault();
    const next = order[(index + step + order.length) % order.length];
    void select(next, true);
    entries.get(next).button.focus();
  });
  async function select(id, record = false) {
    if (!viewCurrent()) return;
    const chosen = entries.has(id) ? id : entries.keys().next().value;
    if (!chosen) return;
    if (record) {
      const url = new URL(location.href);
      url.pathname = "/dashboard/host/";
      url.searchParams.set("view", "settings");
      url.searchParams.set("tab", chosen);
      if (url.href !== location.href) history.pushState(null, "", url);
      // A change finished on another tab: reload so this tab shows it.
      if (options.refreshPending()) {
        await options.refresh();
        return;
      }
    }
    for (const [key, entry] of entries) {
      entry.button.setAttribute("aria-selected", String(key === chosen));
      entry.button.tabIndex = key === chosen ? 0 : -1;
      entry.content.hidden = key !== chosen;
    }
    const entry = entries.get(chosen);
    if (entry.content.dataset.loaded === "true") return;
    entry.loading ??= (async () => {
      entry.content.replaceChildren();
      try {
        await loaders[chosen](entry.content);
        if (viewCurrent()) entry.content.dataset.loaded = "true";
      } catch (error) {
        if (!viewCurrent()) return;
        const retry = node("button", hostText("Try again"), { type: "button" });
        retry.addEventListener("click", () => void select(chosen));
        entry.content.replaceChildren(
          node("p", options.message(error), { role: "status" }),
          retry,
        );
      } finally {
        entry.loading = undefined;
      }
    })();
    return entry.loading;
  }
  const follow = () => {
    if (!viewCurrent() || !panel.isConnected) {
      listeners.abort();
      return;
    }
    if (workspaceLocation(new URL(location.href)) === "settings")
      void select(settingsTab(new URL(location.href)));
  };
  const listeners = new AbortController();
  window.addEventListener("host:workspace-navigate", follow, {
    signal: listeners.signal,
  });
  window.addEventListener("popstate", follow, { signal: listeners.signal });
  window.addEventListener("host:workspace-dispose", () => listeners.abort(), {
    once: true,
    signal: listeners.signal,
  });
  await select(settingsTab(new URL(location.href)));
}

// A time zone as people know it: "Jerusalem · Israel Time". Hebrew names
// the place in Hebrew ("שעון צרפת · שעון מרכז אירופה"), so a Hebrew screen
// never shows the Latin city from the zone's id.
export function zoneLabel(zone, language = hostLanguage) {
  const city = zone.split("/").pop().replaceAll("_", " ");
  const locale = language === "he" ? "he-IL" : hostLocale;
  const name = (style) => {
    try {
      return new Intl.DateTimeFormat(locale, {
        timeZone: zone,
        timeZoneName: style,
      })
        .formatToParts(new Date())
        .find((part) => part.type === "timeZoneName")?.value;
    } catch {
      return undefined;
    }
  };
  const generic = name("longGeneric");
  if (language === "he") {
    const place = name("shortGeneric");
    if (!place || /GMT|UTC/.test(place)) return city;
    return generic && generic !== place && !/GMT|UTC/.test(generic)
      ? `${place} · ${generic}`
      : place;
  }
  return generic && generic !== city ? `${city} · ${generic}` : city;
}
function zoneChoices(current) {
  let zones = [];
  try {
    zones = Intl.supportedValuesOf("timeZone");
  } catch {
    zones = [];
  }
  if (!zones.includes("UTC")) zones = ["UTC", ...zones];
  if (!zones.includes(current)) zones = [current, ...zones];
  return zones.map((zone) => [zone, zoneLabel(zone)]);
}

// Settings → Organization: its name and time zone. The owner changes them
// (organization:write); everyone else reads them.
// context: {organization, save({form, status, body})}.
export function renderOrganizationTab(panel, context) {
  const { organization } = context;
  const zone = zoneOf(organization);
  panel.append(node("h2", hostText("Organization settings")));
  if (servicePaused(organization))
    panel.append(
      node(
        "p",
        hostText("Service is unavailable for this organization right now."),
        { class: "settings-notice", role: "status" },
      ),
    );
  if (!can(organization, "organization:write")) {
    const facts = node("dl", undefined, { class: "settings-facts" });
    const role = node("dd");
    role.append(roleBadge(organizationRole(organization)));
    const name = node("dd");
    name.append(node("bdi", organization.name));
    facts.append(
      node("dt", hostText("Name")),
      name,
      node("dt", hostText("Time zone")),
      node("dd", zoneLabel(zone)),
      node("dt", hostText("Your role")),
      role,
    );
    panel.append(facts);
    return;
  }
  const form = node("form", undefined, { class: "settings-form" });
  const nameLabel = node("label", hostText("Organization name"));
  const name = node("input", undefined, {
    name: "name",
    "aria-label": "Organization name",
    required: "",
    maxlength: "120",
    autocomplete: "off",
    dir: "auto",
  });
  name.value = organization.name;
  nameLabel.append(name);
  const zoneWrapper = node("label", hostText("Time zone"));
  const zoneSelect = node("select", undefined, {
    name: "timezone",
    "aria-label": "Time zone",
  });
  for (const [value, text] of zoneChoices(zone))
    zoneSelect.append(node("option", text, { value }));
  zoneSelect.value = zone;
  zoneWrapper.append(zoneSelect);
  // The ⓘ sits beside the label, not beside the field.
  labelTip(
    zoneSelect,
    hostText("Bookings and the calendar use this time zone."),
  );
  const status = node("p", "", {
    class: "settings-status",
    role: "status",
    "aria-live": "polite",
  });
  const save = node("button", hostText("Save organization details"), {
    type: "submit",
  });
  form.append(nameLabel, zoneWrapper, status, save);
  panel.append(form);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (save.disabled || !form.reportValidity()) return;
    void context.save({
      form,
      status,
      body: {
        name: name.value.trim(),
        timezone: zoneSelect.value,
        version: organization.version,
      },
    });
  });
}

// Settings → Account & security: who is signed in, and one way to the
// sign-in and security page (authenticator, account deletion) shared by
// every product.
export function renderAccount(panel, identity) {
  const user = identity.user ?? {};
  const name = user.displayName || user.email || "WIFIGATE";
  const card = node("div", undefined, { class: "account-card" });
  const who = node("div", undefined, { class: "account-card__who" });
  who.append(
    node("strong", name, { dir: "auto" }),
    ...(user.displayName && user.email
      ? [node("span", user.email, { dir: "ltr" })]
      : []),
  );
  card.append(
    node("span", initial(name), {
      class: "account-card__avatar",
      "aria-hidden": "true",
    }),
    who,
  );
  if (identity.role === "admin" || identity.role === "user")
    card.append(roleBadge(identity.role, true, { own: true }));
  const security = node("p", undefined, { class: "account-card__security" });
  security.append(
    node(
      "span",
      hostText(
        identity.mfa?.enrolled
          ? "Authenticator is on."
          : "Authenticator is off.",
      ),
    ),
  );
  const manage = node("a", hostText("Manage sign-in and security"), {
    class: "button-link",
    href: hostLanguage === "he" ? "/dashboard/?lang=he" : "/dashboard/",
  });
  panel.append(card, security, manage);
}
