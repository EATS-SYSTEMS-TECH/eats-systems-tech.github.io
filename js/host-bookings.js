import { hostText, hostLanguage } from "./host-locale.js";
import { portalRequest } from "./api/index.js";
import { node, isolatedText } from "./host-ui.js";
import { can } from "./host-permissions.js";
import { newBookingButton, noSystemsState } from "./host-calendar.js";
import { defaultCountry, phoneSearch } from "./host-phone.js";
import {
  zoneOf,
  todayIn,
  addDays,
  dayStart,
  readReservation,
  guestName,
  systemLabel,
  stayText,
  statusBadge,
  bookingMessage,
} from "./host-booking-model.js";

// Bookings: the organization's bookings as a list, in four tabs (Today,
// Upcoming, Past, Cancelled) with a search over guest names, phones,
// emails and booking references. Today and Upcoming read forward from now,
// soonest first; Past and Cancelled read back from now, newest first. A
// row opens the booking. Opened for one system (after a removal refused for
// its bookings), it shows that system's upcoming bookings, stays on now
// included, until "Show all systems".
// [id, English label, copy key]: the Cancelled tab speaks of bookings
// (Hebrew plural), while the status badge "Cancelled" speaks of one.
const tabs = [
  ["today", "Today"],
  ["upcoming", "Upcoming"],
  ["past", "Past"],
  ["cancelled", "Cancelled", "Cancelled bookings"],
];
const tabLabel = (english, key = english) =>
  hostLanguage === "he" ? hostText(key) : english;

// What a tab reads (the API reads at most 62 days at a time) and which
// bookings it keeps. Today and Upcoming read one span, soonest first, page
// by page. Past and Cancelled walk back from `ceiling` to `floor` in short
// windows, newest first: each window shows the bookings whose `key` falls
// in it, latest first, and "Show more" reads on into older windows.
const day = 86400000;
const pastDays = 60;
function tabFor(tab, zone, { ongoing = false } = {}) {
  const today = todayIn(zone);
  const midnight = (date) => dayStart(date, zone);
  const now = new Date().toISOString();
  const open = (record) => record.status !== "cancelled";
  if (tab === "today")
    return {
      from: midnight(today),
      to: midnight(addDays(today, 1)),
      keep: open,
    };
  if (tab === "upcoming")
    return {
      from: now,
      to: midnight(addDays(today, 61)),
      keep: (record) =>
        open(record) && (ongoing ? record.endsAt > now : record.startsAt > now),
    };
  // Past: by when the guest left. Cancelled: by when the stay was to start,
  // from the next month back.
  if (tab === "past")
    return {
      ceiling: now,
      floor: midnight(addDays(today, -pastDays)),
      key: "endsAt",
      keep: (record) => open(record) && record.endsAt <= now,
    };
  return {
    ceiling: midnight(addDays(today, 31)),
    floor: midnight(addDays(today, -pastDays)),
    key: "startsAt",
    status: "cancelled",
    keep: () => true,
  };
}
// A window's own bookings: those whose key falls in it (endsAt in
// (from, to], startsAt in [from, to)), so each booking shows once, in order.
const inWindow = (key, value, from, to) =>
  key === "endsAt" ? value > from && value <= to : value >= from && value < to;
const windowSteps = [7, 14, 28, 56];
const maxWindowPages = 10;
const screenful = 20;

// context: {container, user, organization, systems, isCurrent, focusSystem?
// ({id, type, targetId}: one system's bookings), openBooking(record,
// trigger), newBooking({trigger})}. Returns {reload}.
export async function renderHostBookings(context) {
  const { container, user, organization, systems } = context;
  const section = node("section", undefined, {
    "aria-label": "Bookings",
    class: "host-bookings",
  });
  container.append(section);
  const current = () => context.isCurrent() && section.isConnected;
  const zone = zoneOf(organization);
  const base = `/api/v1/organizations/${encodeURIComponent(organization.id)}`;
  const systemsById = new Map(systems.map((item) => [item.id, item]));
  // The one system shown, if any: the same id, or the same gate set (My
  // systems and the organization name one system with different ids).
  const wanted = context.focusSystem;
  let only = wanted
    ? (systemsById.get(wanted.id) ??
      systems.find(
        (item) =>
          wanted.targetId &&
          item.type === wanted.type &&
          item.targetId === wanted.targetId,
      ))
    : undefined;

  const header = node("div", undefined, { class: "bookings-header" });
  const tabBar = node("div", undefined, {
    class: "workspace-tabs bookings-tabs",
    role: "group",
    "aria-label": "Bookings",
  });
  let tab = only ? "upcoming" : "today";
  const tabButtons = tabs.map(([id, label, key]) => {
    const button = node("button", tabLabel(label, key), {
      type: "button",
      "data-bookings-tab": id,
      "aria-pressed": String(id === tab),
    });
    button.addEventListener("click", () => {
      tab = id;
      for (const item of tabButtons)
        item.setAttribute(
          "aria-pressed",
          String(item.dataset.bookingsTab === tab),
        );
      void load();
    });
    tabBar.append(button);
    return button;
  });
  const search = node("form", undefined, {
    class: "bookings-search",
    role: "search",
  });
  const query = node("input", undefined, {
    type: "search",
    name: "q",
    maxlength: "120",
    autocomplete: "off",
    "aria-label": "Search bookings",
    placeholder: hostText("Search by guest, phone or reference"),
  });
  search.append(query);
  const actions = node("div", undefined, { class: "bookings-actions" });
  actions.append(search);
  if (can(organization, "reservations:write") && systems.length)
    actions.append(
      newBookingButton(organization, (button) =>
        context.newBooking({ trigger: button }),
      ),
    );
  header.append(tabBar, actions);
  const filter = node("div", undefined, { class: "bookings-filter" });
  const clear = node("button", hostText("Show all systems"), {
    type: "button",
    class: "button-secondary",
    "data-bookings-all": "",
  });
  const showFilter = () => {
    filter.hidden = !only;
    if (!only) return filter.replaceChildren();
    const label = node("p", undefined, { class: "bookings-filter__text" });
    label.append(isolatedText("Only {p0}", { p0: only.name }));
    filter.replaceChildren(label, clear);
  };
  clear.addEventListener("click", () => {
    only = undefined;
    showFilter();
    tabButtons.find((item) => item.dataset.bookingsTab === tab)?.focus();
    void load();
  });
  showFilter();
  const status = node("p", "", {
    class: "bookings-status",
    role: "status",
    "aria-live": "polite",
  });
  const list = node("ul", undefined, { class: "booking-list" });
  const more = node("button", hostText("Show more"), {
    type: "button",
    class: "button-secondary",
    hidden: "",
  });
  // No systems: the one sentence and its action, above the tabs' lists.
  section.append(header, filter);
  if (!systems.length) section.append(noSystemsState(organization));
  section.append(status, list, more);

  let loading = 0;
  // Today and Upcoming: the API's cursor. Past and Cancelled: the next
  // older window's end (and how many windows in a row came back empty).
  let cursor;
  let older;
  let shown = [];
  function row(record) {
    const item = node("li");
    const button = node("button", undefined, {
      type: "button",
      class: "booking-row",
      "data-booking-id": record.id,
    });
    const who = node("span", undefined, { class: "booking-row__who" });
    // The name keeps the page's direction, isolated in its <bdi>.
    const name = node("strong");
    name.append(node("bdi", guestName(record)));
    who.append(name);
    const where = node("span", undefined, { class: "booking-row__system" });
    where.append(node("bdi", systemLabel(record, systemsById)));
    who.append(where);
    button.append(
      who,
      node("span", stayText(record, zone), { class: "booking-row__stay" }),
      statusBadge(record.status),
    );
    button.addEventListener("click", () => context.openBooking(record, button));
    item.append(button);
    return item;
  }
  const searched = () => phoneSearch(defaultCountry(zone), query.value);
  const hasMore = () => Boolean(cursor || older);
  function draw() {
    list.replaceChildren(...shown.map(row));
    more.hidden = !hasMore();
    if (!shown.length)
      status.textContent = hasMore()
        ? hostText("Nothing here yet. Show more to look further.")
        : query.value.trim()
          ? hostText("No bookings match your search.")
          : systems.length
            ? hostText("No bookings here.")
            : "";
    else status.textContent = "";
  }
  const page = async (from, to, selected, after) => {
    const params = new URLSearchParams({
      from,
      to,
      limit: "100",
      ...(selected.status ? { status: selected.status } : {}),
      ...(only ? { systemId: only.id } : {}),
      ...(searched() ? { q: searched() } : {}),
      ...(after ? { cursor: after } : {}),
    });
    return portalRequest(user, `${base}/reservations?${params}`);
  };
  const records = (result, selected) =>
    (Array.isArray(result?.items) ? result.items : [])
      .map(readReservation)
      .filter(
        (record) =>
          record &&
          selected.keep(record) &&
          (!only || record.changeSystemId === only.id),
      );
  // Today and Upcoming: one more page of the span.
  async function forward(selected, append) {
    const result = await page(
      selected.from,
      selected.to,
      selected,
      append ? cursor : undefined,
    );
    return {
      found: records(result, selected),
      next: () => {
        cursor = result?.nextCursor ?? undefined;
      },
    };
  }
  // Past and Cancelled: older windows, read whole and sorted newest first,
  // until a screenful is found or the tab's dates end. An empty window
  // widens the next one.
  async function backward(selected, append, request) {
    let to = append ? older.to : selected.ceiling;
    let step = append ? older.step : 0;
    const seen = new Set(append ? shown.map((record) => record.id) : []);
    const found = [];
    while (to > selected.floor && found.length < screenful) {
      const span = windowSteps[Math.min(step, windowSteps.length - 1)];
      const from = new Date(
        Math.max(Date.parse(to) - span * day, Date.parse(selected.floor)),
      ).toISOString();
      const own = new Map();
      let after;
      let pages = 0;
      do {
        const result = await page(from, to, selected, after);
        if (!current() || request !== loading) return null;
        for (const record of records(result, selected))
          if (
            !seen.has(record.id) &&
            inWindow(selected.key, record[selected.key], from, to)
          )
            own.set(record.id, record);
        after = result?.nextCursor;
      } while (after && ++pages < maxWindowPages);
      found.push(
        ...[...own.values()].sort(
          (a, b) =>
            b[selected.key].localeCompare(a[selected.key]) ||
            b.id.localeCompare(a.id),
        ),
      );
      step = own.size ? 0 : step + 1;
      to = from;
    }
    return {
      found,
      next: () => {
        older = to > selected.floor ? { to, step } : null;
      },
    };
  }
  async function read(append) {
    const request = ++loading;
    const selected = tabFor(tab, zone, { ongoing: Boolean(only) });
    if (!append) {
      status.textContent = hostText("Loading…");
      list.replaceChildren();
      more.hidden = true;
    }
    try {
      const result = selected.ceiling
        ? await backward(selected, append, request)
        : await forward(selected, append);
      if (!result || !current() || request !== loading) return;
      const byId = new Map(
        [...(append ? shown : []), ...result.found].map((record) => [
          record.id,
          record,
        ]),
      );
      shown = [...byId.values()];
      result.next();
      draw();
    } catch (error) {
      if (!current() || request !== loading) return;
      status.textContent = bookingMessage(error);
      more.hidden = !append;
    }
  }
  const load = () => {
    cursor = undefined;
    older = undefined;
    return read(false);
  };
  more.addEventListener("click", async () => {
    more.disabled = true;
    try {
      await read(true);
    } finally {
      more.disabled = false;
    }
  });
  let typing;
  search.addEventListener("submit", (event) => {
    event.preventDefault();
    clearTimeout(typing);
    void load();
  });
  query.addEventListener("input", () => {
    clearTimeout(typing);
    typing = setTimeout(() => {
      if (current()) void load();
    }, 350);
  });
  await load();
  return { reload: () => load() };
}
