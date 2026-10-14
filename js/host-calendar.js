import { hostText, hostLocale } from "./host-locale.js";
import { calendarSpans } from "./host-calendar-layout.js";
import { portalRequest } from "./api/index.js";
import { node, infoTip, isolatedText } from "./host-ui.js";
import { iconSrc, emptyState } from "./host-system-cards.js";
import { can, servicePaused } from "./host-permissions.js";
import {
  zoneOf,
  dateAt,
  dayStart,
  todayIn,
  addDays,
  readReservation,
  guestName,
  systemLabel,
  statusLabel,
  statusBadge,
  statuses,
  stayText,
  timeText,
  dayText,
  bookingMessage,
  noSystem,
} from "./host-booking-model.js";

// Calendar: one row per active system of the organization, days across, in
// the organization's time zone. It starts with two weeks when they fit the
// space it has, else one week, and where one week does not fit either (a
// phone) it is an agenda (one list per day). An empty cell from today on
// and "+ Booking" open the booking sheet; a booking opens its details.
let sessionGeneration = 0;
let listeners;
export function clearHostCalendar() {
  sessionGeneration++;
  listeners?.abort();
  listeners = undefined;
}
const ranges = [
  ["week", "Week"],
  ["two-week", "2 weeks"],
  ["month", "Month"],
];
const maxPages = 10;
// The grid's widths (css/host-dashboard.css): the system column, then one
// column of at least 56px (and its border) per day.
const systemColumn = 152;
const dayColumn = 57;
const gridWidth = (days) => systemColumn + days * dayColumn;

// The "+ Booking" button: blocked with an ⓘ while the service is paused.
export function newBookingButton(organization, onClick) {
  const button = node("button", hostText("+ Booking"), {
    type: "button",
    "aria-label": "New booking",
    "data-new-booking": "",
  });
  button.addEventListener("click", () => onClick(button));
  if (!servicePaused(organization)) return button;
  button.disabled = true;
  const holder = node("span", undefined, { class: "system-action-blocked" });
  holder.append(
    button,
    infoTip(
      hostText("Service is unavailable for this organization right now."),
    ),
  );
  return holder;
}

// The empty Calendar and Bookings: one sentence and one way to systems.
export function noSystemsState(organization) {
  const open = node("button", hostText("Organization systems"), {
    type: "button",
    class: "button-secondary",
  });
  open.addEventListener("click", () =>
    window.dispatchEvent(
      new CustomEvent("host:workspace-view", { detail: "systems" }),
    ),
  );
  return emptyState(
    hostText(
      can(organization, "systems:write")
        ? "Add a system from the WIFIGATE app to start taking bookings."
        : "This organization has no systems yet.",
    ),
    { action: open },
  );
}

const select = (label, name, options) => {
  const wrapper = node("label", hostText(label), { class: "calendar-filter" });
  const input = node("select", undefined, { name });
  for (const [value, text] of options)
    input.append(node("option", text, { value }));
  wrapper.append(input);
  return [wrapper, input];
};

// context: {container, user, organization, systems (active, sorted),
// isCurrent, openBooking(record, trigger), newBooking({systemId, date,
// trigger})}. Returns {reload}.
export async function renderHostCalendar(context) {
  clearHostCalendar();
  const { container, user, organization, systems } = context;
  const epoch = sessionGeneration;
  listeners = new AbortController();
  const signal = listeners.signal;
  const section = node("section", undefined, {
    "aria-label": "Calendar",
    class: "host-calendar",
  });
  container.append(section);
  const current = () =>
    epoch === sessionGeneration && context.isCurrent() && section.isConnected;
  // No active systems: the one sentence and its action. Bookings of removed
  // systems still show below it when the dates hold any.
  if (!systems.length) {
    section.classList.add("host-calendar--empty");
    section.append(noSystemsState(organization));
  }
  const zone = zoneOf(organization);
  const base = `/api/v1/organizations/${encodeURIComponent(organization.id)}`;
  const canBook =
    can(organization, "reservations:write") && !servicePaused(organization);
  const systemsById = new Map(systems.map((item) => [item.id, item]));

  const heading = node("div", undefined, { class: "calendar-heading" });
  const title = node("h2", "", { class: "calendar-heading__title" });
  const status = node("p", "", {
    class: "calendar-heading__status",
    role: "status",
    "aria-live": "polite",
  });
  const headingText = node("div", undefined, {
    class: "calendar-heading-text",
  });
  headingText.append(title, status);
  heading.append(headingText);
  if (can(organization, "reservations:write") && systems.length)
    heading.append(
      newBookingButton(organization, (button) => {
        // Today, or the first day shown when the dates shown are later
        // (a new booking never starts on a day already gone).
        const day = todayIn(zone);
        context.newBooking({
          systemId: systemFilter.value || undefined,
          date: start > day ? start : day,
          trigger: button,
        });
      }),
    );

  const toolbar = node("div", undefined, { class: "calendar-toolbar" });
  const moves = node("div", undefined, { class: "calendar-navigation" });
  const previous = node("button", hostText("Previous"), { type: "button" });
  const today = node("button", hostText("Today"), { type: "button" });
  const next = node("button", hostText("Next"), { type: "button" });
  moves.append(previous, today, next);
  const rangeGroup = node("div", undefined, {
    class: "calendar-ranges",
    role: "group",
    "aria-label": "Calendar range",
  });
  // Until the person picks a range, it follows the space (fittingRange).
  let range = "two-week";
  let picked = false;
  const rangeButtons = ranges.map(([value, label]) => {
    const button = node("button", hostText(label), {
      type: "button",
      "data-range": value,
      "aria-pressed": String(value === range),
    });
    button.addEventListener("click", () => {
      picked = true;
      setRange(value);
      void load();
    });
    rangeGroup.append(button);
    return button;
  });
  const filters = node("div", undefined, { class: "calendar-filters" });
  const [systemLabelElement, systemFilter] = select("System", "systemId", [
    ["", hostText("All systems")],
    ...systems.map((item) => [item.id, item.name]),
  ]);
  const [statusLabelElement, statusFilter] = select("Status", "status", [
    ["", hostText("All bookings")],
    ...statuses.map((value) => [value, statusLabel(value)]),
  ]);
  filters.append(systemLabelElement, statusLabelElement);
  toolbar.append(moves, rangeGroup, filters);
  const grid = node("div", undefined, {
    class: "calendar-scroll",
    tabindex: "0",
    role: "region",
    "aria-label": "Calendar table",
  });
  section.append(heading, toolbar, grid);
  function setRange(value) {
    range = value;
    if (range === "month") start = `${start.slice(0, 7)}-01`;
    for (const item of rangeButtons)
      item.setAttribute("aria-pressed", String(item.dataset.range === range));
  }
  // The space the calendar has: two weeks when they fit, else one week; an
  // agenda where one week does not fit either. Going back up takes a little
  // more room, so a scroll bar coming and going never flips it to and fro.
  const room = 24;
  let width = 0;
  let agendaShown = false;
  const space = () => grid.clientWidth || innerWidth;
  const agenda = () => space() < gridWidth(7) + (agendaShown ? room : 0);
  const fittingRange = () =>
    space() >= gridWidth(14) + (range === "two-week" ? 0 : room)
      ? "two-week"
      : "week";

  let start = todayIn(zone);
  let data = [];
  let truncated = false;
  let loading = 0;
  let loaded = 0;
  const duration = () =>
    range === "week"
      ? 7
      : range === "two-week"
        ? 14
        : new Date(
            Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)), 0),
          ).getUTCDate();
  const titleFormat = new Intl.DateTimeFormat(hostLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const label = (record) =>
    hostText("{p0} · {p1} · {p2} · {p3}", {
      p0: guestName(record),
      p1: statusLabel(record.status),
      p2: systemLabel(record, systemsById),
      p3: stayText(record, zone),
    });
  // The row a booking sits in: its system, or the one active system an
  // older booking opens; "" for the rest ("—").
  const rowOf = (record) =>
    record.systemId ??
    (systemsById.has(record.changeSystemId) ? record.changeSystemId : "");
  // A name in the page's direction: a Latin name on a Hebrew page still
  // starts at the start, isolated from the words around it.
  const nameLine = (record) => {
    const name = node("strong");
    name.append(node("bdi", guestName(record)));
    return name;
  };
  function chip(record, className) {
    const button = node("button", undefined, {
      type: "button",
      class: `${className} reservation-${record.status}`,
      "aria-label": label(record),
      title: label(record),
      "data-booking-id": record.id,
    });
    button.addEventListener("click", () => context.openBooking(record, button));
    return button;
  }

  function drawGrid(days) {
    const table = node("table", undefined, { class: "calendar-grid" });
    const head = node("thead");
    const header = node("tr");
    header.append(node("th", hostText("System"), { scope: "col" }));
    const todayDate = todayIn(zone);
    for (let index = 0; index < days; index++) {
      const day = addDays(start, index);
      const instant = new Date(`${day}T12:00:00Z`);
      const cell = node("th", undefined, {
        scope: "col",
        "data-calendar-date": day,
        ...(day === todayDate ? { class: "calendar-today" } : {}),
      });
      cell.append(
        node(
          "small",
          new Intl.DateTimeFormat(hostLocale, {
            weekday: "short",
            timeZone: "UTC",
          }).format(instant),
        ),
        node("span", String(instant.getUTCDate())),
      );
      header.append(cell);
    }
    head.append(header);
    // Rows: the active systems (or the one filtered), then any booking of a
    // system that is no longer active, then older bookings without one.
    // A filtered calendar shows that system's row only.
    const filter = systemFilter.value;
    const rows = (
      filter ? systems.filter((item) => item.id === filter) : systems
    ).map((item) => ({ id: item.id, name: item.name, system: item }));
    for (const record of data) {
      const id = rowOf(record);
      if (filter && id !== filter) continue;
      if (!rows.some((row) => row.id === id))
        rows.push({
          id,
          name: id ? (record.systemName ?? noSystem) : noSystem,
        });
    }
    const body = node("tbody");
    for (const row of rows) {
      const tr = node("tr", undefined, { "data-calendar-system": row.id });
      const name = node("th", undefined, { scope: "row" });
      const nameBox = node("span", undefined, { class: "calendar-system" });
      if (row.system)
        nameBox.append(
          node("img", undefined, {
            src: iconSrc(row.system),
            alt: "",
            width: "24",
            height: "24",
          }),
        );
      nameBox.append(node("bdi", row.name));
      name.append(nameBox);
      const cell = node("td", undefined, {
        colspan: String(days),
        class: "calendar-system-timeline",
      });
      const timeline = node("div", undefined, { class: "calendar-timeline" });
      timeline.style.setProperty("--calendar-days", String(days));
      const { spans, lanes } = calendarSpans(
        data.filter((record) => rowOf(record) === row.id),
        start,
        days,
        dateAt,
        zone,
      );
      timeline.style.gridTemplateRows = `repeat(${lanes}, minmax(56px, auto))`;
      // An empty day of a system, from today on, opens a new booking there
      // (the "+ Booking" button is the keyboard way to the same sheet).
      if (canBook && row.system)
        for (let index = 0; index < days; index++) {
          const day = addDays(start, index);
          if (day < todayDate) continue;
          const add = node("button", undefined, {
            type: "button",
            class: "calendar-cell",
            tabindex: "-1",
            "aria-label": hostText("New booking: {p0}, {p1}", {
              p0: row.name,
              p1: dayText(day),
            }),
            "data-calendar-cell": day,
          });
          add.style.gridColumn = String(index + 1);
          add.style.gridRow = "1 / -1";
          add.addEventListener("click", () =>
            context.newBooking({ systemId: row.id, date: day, trigger: add }),
          );
          timeline.append(add);
        }
      for (const { record, start: from, end, lane } of spans) {
        const button = chip(record, "reservation-chip");
        button.style.gridColumn = `${from + 1} / ${end + 1}`;
        button.style.gridRow = String(lane + 1);
        button.append(
          nameLine(record),
          node("small", statusLabel(record.status)),
        );
        timeline.append(button);
      }
      cell.append(timeline);
      tr.append(name, cell);
      body.append(tr);
    }
    table.append(head, body);
    grid.replaceChildren(table);
  }

  function drawAgenda(days) {
    const agenda = node("div", undefined, { class: "calendar-agenda" });
    for (let index = 0; index < days; index++) {
      const day = addDays(start, index);
      // A cancelled stay is nobody's arrival, stay or departure: it shows
      // once, on the first of its days on screen, as Cancelled only.
      const bookings = data.filter(
        (record) =>
          (!systemFilter.value || rowOf(record) === systemFilter.value) &&
          dateAt(record.startsAt, zone) <= day &&
          dateAt(Date.parse(record.endsAt) - 1, zone) >= day &&
          (record.status !== "cancelled" ||
            day === [dateAt(record.startsAt, zone), start].sort().at(-1)),
      );
      if (!bookings.length) continue;
      const group = node("section", undefined, {
        class: "calendar-agenda__day",
        "data-calendar-date": day,
      });
      group.append(node("h3", dayText(day)));
      const list = node("ul");
      for (const record of bookings) {
        const item = node("li");
        const button = chip(record, "agenda-item");
        // What happens that day: arrival, departure, both, or a stay.
        const arrives = dateAt(record.startsAt, zone) === day;
        const leaves = dateAt(Date.parse(record.endsAt) - 1, zone) === day;
        const times = node("span", undefined, { class: "agenda-item__time" });
        if (arrives && leaves)
          times.append(
            node(
              "bdi",
              `${timeText(record.startsAt, zone)} – ${timeText(record.endsAt, zone)}`,
            ),
          );
        else if (arrives)
          times.append(
            isolatedText("Arrives {p0}", {
              p0: timeText(record.startsAt, zone),
            }),
          );
        else if (leaves)
          times.append(
            isolatedText("Leaves {p0}", { p0: timeText(record.endsAt, zone) }),
          );
        else times.textContent = hostText("Staying");
        const where = node("span", undefined, { class: "agenda-item__system" });
        where.append(node("bdi", systemLabel(record, systemsById)));
        button.append(
          nameLine(record),
          where,
          ...(record.status === "cancelled" ? [] : [times]),
        );
        // Not only a colour: a booking that is not simply confirmed says
        // what it is (Cancelled, Draft…).
        if (record.status !== "confirmed")
          button.append(statusBadge(record.status));
        item.append(button);
        list.append(item);
      }
      group.append(list);
      agenda.append(group);
    }
    if (!agenda.childElementCount && systems.length)
      agenda.append(
        node("p", hostText("No bookings on these dates."), {
          class: "calendar-agenda__empty",
        }),
      );
    grid.replaceChildren(agenda);
  }

  function draw() {
    const days = duration();
    // Each end of the range stays whole on a narrow screen ("14 Oct 2026"
    // never leaves its year alone on the next line).
    const edge = (date) =>
      node("span", titleFormat.format(new Date(`${date}T12:00:00Z`)), {
        class: "calendar-heading__date",
      });
    title.replaceChildren(edge(start), " – ", edge(addDays(start, days - 1)));
    // Without systems, the calendar shows only when it holds bookings.
    section.classList.toggle(
      "host-calendar--empty",
      !systems.length && !data.length,
    );
    width = space();
    agendaShown = agenda();
    if (agendaShown) drawAgenda(days);
    else drawGrid(days);
    // A long system name widens the first column: when the range chosen
    // for the space no longer fits, it steps down to one week (and to the
    // agenda when a week does not fit either).
    if (
      grid.scrollWidth > grid.clientWidth + 1 &&
      grid.querySelector("table")
    ) {
      if (!picked && range === "two-week") {
        setRange("week");
        void load();
        return;
      }
      if (range === "week") {
        agendaShown = true;
        drawAgenda(days);
      }
    }
    if (truncated)
      grid.append(
        node(
          "p",
          hostText(
            "Showing the first 1,000 bookings. Choose fewer days or one system.",
          ),
          { class: "calendar-truncated" },
        ),
      );
  }

  async function load() {
    const request = ++loading;
    const days = duration();
    const shown = start;
    status.textContent = hostText("Loading…");
    try {
      // The range's edges in the organization's time zone, worked out here:
      // a midnight the clocks skip still has a first minute.
      const from = dayStart(shown, zone);
      const to = dayStart(addDays(shown, days), zone);
      const items = new Map();
      let cursor;
      let pages = 0;
      do {
        const query = new URLSearchParams({
          from,
          to,
          limit: "100",
          ...(systemFilter.value ? { systemId: systemFilter.value } : {}),
          ...(statusFilter.value ? { status: statusFilter.value } : {}),
          ...(cursor ? { cursor } : {}),
        });
        const result = await portalRequest(
          user,
          `${base}/reservations?${query}`,
        );
        if (!current() || request !== loading) return;
        for (const raw of Array.isArray(result?.items) ? result.items : []) {
          const record = readReservation(raw);
          if (record) items.set(record.id, record);
        }
        cursor = result?.nextCursor;
        pages++;
      } while (cursor && pages < maxPages);
      data = [...items.values()];
      truncated = Boolean(cursor);
      status.textContent = "";
      loaded = request;
      draw();
    } catch (error) {
      if (!current() || request !== loading) return;
      loaded = request;
      section.classList.remove("host-calendar--empty");
      status.textContent = bookingMessage(error);
      const retry = node("button", hostText("Try again"), { type: "button" });
      retry.addEventListener("click", () => void load());
      grid.replaceChildren(retry);
    }
  }

  const move = (direction) => {
    start =
      range === "month"
        ? new Date(
            Date.UTC(
              Number(start.slice(0, 4)),
              Number(start.slice(5, 7)) - 1 + direction,
              1,
            ),
          )
            .toISOString()
            .slice(0, 10)
        : addDays(start, direction * duration());
    void load();
  };
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  today.addEventListener("click", () => {
    start = todayIn(zone);
    if (range === "month") start = `${start.slice(0, 7)}-01`;
    void load();
  });
  systemFilter.addEventListener("change", () => void load());
  statusFilter.addEventListener("change", () => void load());
  // A phone turned sideways, a window resized or the sidebar opened: the
  // range follows the space (until the person picks one) and the same
  // bookings redraw as a grid or an agenda.
  const resized = new ResizeObserver(() => {
    if (!current()) return resized.disconnect();
    if (!grid.clientWidth || grid.clientWidth === width || loading > loaded)
      return;
    width = grid.clientWidth;
    if (!picked && fittingRange() !== range) {
      setRange(fittingRange());
      void load();
    } else draw();
  });
  resized.observe(grid);
  signal.addEventListener("abort", () => resized.disconnect());
  // A saved filter from Activity: its system and state.
  window.addEventListener(
    "host:operations-filter",
    (event) => {
      const saved = event.detail;
      if (
        !current() ||
        !saved?.workspaceApplied ||
        saved.orgId !== organization.id
      )
        return;
      if (
        (saved.systemId && !systemsById.has(saved.systemId)) ||
        (saved.status && !statuses.includes(saved.status))
      ) {
        status.textContent = hostText(
          "This saved filter's system is no longer here.",
        );
        return;
      }
      systemFilter.value = saved.systemId ?? "";
      statusFilter.value = saved.status ?? "";
      void load();
    },
    { signal },
  );
  window.addEventListener("host:workspace-dispose", () => listeners?.abort(), {
    once: true,
    signal,
  });
  setRange(fittingRange());
  await load();
  return { reload: () => load() };
}
