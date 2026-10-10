import { hostText, hostLocale } from "./host-locale.js";
import { calendarSpans } from "./host-calendar-layout.js";
import { portalRequest } from "./api/index.js";
import { readHostPages } from "./host-pages.js";
import { node, field } from "./host-ui.js";
import { renderHostAccessGrants } from "./host-access-grants.js";

const states = ["draft", "confirmed", "changed", "cancelled", "completed"];
let sessionGeneration = 0;
let filterListener;
export function clearHostCalendar() {
  sessionGeneration++;
  filterListener?.abort();
  filterListener = undefined;
}
const dateAt = (value, timezone) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
const localAt = (value, timezone) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .map((item) => [item.type, item.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
const addDays = (date, days) =>
  new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000)
    .toISOString()
    .slice(0, 10);
const errors = {
  RESERVATION_OVERLAP: hostText(
    "This room is already reserved during that window.",
  ),
  VERSION_CONFLICT: hostText(
    "This reservation changed. Close this form and reload it before saving.",
  ),
  INVALID_TRANSITION: hostText(
    "This state change is not allowed. Completed and cancelled reservations are final.",
  ),
  INVALID_LOCAL_TIME: hostText(
    "That local time does not exist because of a clock change. Choose another time.",
  ),
  AMBIGUOUS_LOCAL_TIME: hostText(
    "That local time occurs twice. Choose the earlier or later occurrence.",
  ),
  SYSTEM_UNAVAILABLE: hostText(
    "Choose active access systems mapped to this room or property.",
  ),
  TENANT_ACCESS_DENIED: hostText(
    "Your organization access has changed. Refresh your account.",
  ),
  INVALID_REQUEST: hostText(
    "Check the guest phone, time window and selected systems.",
  ),
  RATE_LIMITED: hostText(
    "Too many requests. Wait a moment and retry with the same form.",
  ),
  SUBSCRIPTION_UNAVAILABLE: hostText(
    "Service is unavailable. An owner can review the subscription in Billing statements.",
  ),
};
export async function renderHostCalendar({
  container,
  user,
  organization,
  properties,
  rooms,
  isCurrent,
  mode = "calendar",
}) {
  clearHostCalendar();
  if (!properties.length) return;
  const epoch = sessionGeneration;
  const current = () => epoch === sessionGeneration && isCurrent();
  const path = (suffix = "") =>
    `/api/v1/organizations/${encodeURIComponent(organization.id)}/reservations${suffix}`;
  const canWrite =
    ["owner", "admin", "staff"].includes(organization.membership.role) &&
    organization.workspace?.service?.available !== false;
  const listMode = mode === "reservations";
  const section = node("section", undefined, {
    "aria-label": listMode ? "Reservations" : "Reservation calendar",
    class: listMode ? "host-reservations-view" : "host-calendar",
  });
  const rangeTitle = node(
    "h2",
    hostText(listMode ? "Reservations" : "Reservation calendar"),
  );
  const controls = node("form", undefined, {
    class: "calendar-controls",
    id: `calendar-filters-${crypto.randomUUID()}`,
  });
  const propertySelect = field(
    controls,
    listMode ? "Reservation property" : "Calendar property",
    "propertyId",
    listMode ? "" : properties[0].id,
    "text",
    [
      ["", hostText("All properties")],
      ...properties.map((item) => [item.id, item.name]),
    ],
  );
  const roomFilter = field(
    controls,
    listMode ? "Reservation room filter" : "Calendar room",
    "roomId",
    "",
    "text",
    [["", hostText("All rooms")]],
  );
  const mapRooms = () => {
    roomFilter.replaceChildren(
      node("option", hostText("All rooms"), { value: "" }),
      ...rooms
        .filter(
          (item) =>
            !propertySelect.value || item.propertyId === propertySelect.value,
        )
        .map((item) => node("option", item.name, { value: item.id })),
    );
  };
  mapRooms();
  const view = field(controls, "Calendar view", "view", "two-week", "text", [
    ["week", hostText("Week")],
    ["two-week", hostText("Two weeks")],
    ["three-week", hostText("Three weeks")],
    ["month", hostText("Month")],
  ]);
  const date = field(
    controls,
    "Start date",
    "date",
    dateAt(Date.now(), properties[0].timezone),
    "date",
  );
  const endDate = listMode
    ? field(
        controls,
        "End date (exclusive)",
        "endDate",
        addDays(date.value, 30),
        "date",
      )
    : undefined;
  const search = field(controls, "Search guest or reference", "q");
  search.required = false;
  const filter = field(controls, "Reservation status", "status", "", "text", [
    ["", hostText("All states")],
    ...states.map((state) => [state, hostText(state)]),
  ]);
  filter.required = false;
  controls.append(
    node(
      "button",
      hostText(listMode ? "Search reservations" : "Update calendar"),
      {
        type: "submit",
      },
    ),
  );
  const navigation = node("div", undefined, { class: "calendar-navigation" });
  const previous = node("button", hostText("Previous"), { type: "button" });
  const today = node("button", hostText("Today"), { type: "button" });
  const next = node("button", hostText("Next"), { type: "button" });
  navigation.append(previous, today, next);
  const add = node("button", hostText("Add Reservation"), {
    type: "button",
    "aria-label": "New reservation",
  });
  const status = node("p", "", { role: "status", "aria-live": "polite" });
  const refreshed = node("p", "", { class: "calendar-refreshed" });
  const editorDialog = node("dialog", undefined, {
      class: "reservation-editor",
      "aria-label": "Reservation details",
    }),
    editor = node("div");
  editorDialog.append(editor);
  let editorEpoch = 0;
  function clearEditor() {
    editorEpoch++;
    editor.replaceChildren();
    if (editorDialog.open) editorDialog.close();
  }
  editorDialog.addEventListener("cancel", () => {
    editorEpoch++;
    editor.replaceChildren();
  });
  editorDialog.addEventListener("close", () => {
    if (editorDialog.open) return;
    editorEpoch++;
    editor.replaceChildren();
  });
  const grid = node("div", undefined, {
    class: "calendar-scroll",
    tabindex: "0",
    "aria-label": "Calendar table",
  });
  const heading = node("div", undefined, { class: "calendar-heading" }),
    headingText = node("div", undefined, { class: "calendar-heading-text" }),
    headingActions = node("div", undefined, {
      class: "calendar-heading-actions",
    });
  headingText.append(rangeTitle, status, refreshed);
  search.placeholder = hostText("Search");
  search.setAttribute("form", controls.id);
  search.parentElement.classList.add("calendar-search");
  headingActions.append(search.parentElement, ...(canWrite ? [add] : []));
  heading.append(headingText, headingActions);
  const ranges = node("div", undefined, {
      class: "calendar-ranges",
      "aria-label": "Calendar range",
    }),
    rangeButtons = [];
  for (const [label, value] of [
    ["1 Week", "week"],
    ["2 Weeks", "two-week"],
    ["3 Weeks", "three-week"],
    ["1 Month", "month"],
  ]) {
    const button = node("button", hostText(label), {
      type: "button",
      "aria-pressed": String(view.value === value),
    });
    button.addEventListener("click", () => {
      view.value = value;
      syncRange();
      void load();
    });
    ranges.append(button);
    rangeButtons.push([button, value]);
  }
  function syncRange() {
    for (const [button, value] of rangeButtons)
      button.setAttribute("aria-pressed", String(view.value === value));
  }
  view.parentElement.hidden = true;
  const toolbar = node("div", undefined, { class: "calendar-toolbar" });
  toolbar.append(navigation, ranges);
  toolbar.hidden = listMode;
  section.append(heading, toolbar, controls, editorDialog, grid);
  container.append(section);
  const systemsPage = await readHostPages(
    user,
    `/api/v1/organizations/${encodeURIComponent(organization.id)}/systems`,
    current,
  );
  if (!current()) return;
  const systems = systemsPage.items ?? [];
  let data = [];
  let cursor;
  let activeRange;
  let loading = 0;
  const collapsedProperties = new Set();
  const property = () =>
    properties.find((item) => item.id === propertySelect.value) ?? {
      name: "All properties",
      timezone: organization.timezone ?? "UTC",
    };
  const duration = () =>
    listMode
      ? (Date.parse(endDate.value) - Date.parse(date.value)) / 86400000
      : view.value === "week"
        ? 7
        : view.value === "two-week"
          ? 14
          : view.value === "three-week"
            ? 21
            : new Date(
                Date.UTC(
                  Number(date.value.slice(0, 4)),
                  Number(date.value.slice(5, 7)),
                  0,
                ),
              ).getUTCDate();
  const resolve = async (
    value,
    disambiguation = "reject",
    propertyId = propertySelect.value,
  ) =>
    (
      await portalRequest(user, path("/time-zone/resolve"), "POST", {
        ...(propertyId ? { propertyId } : {}),
        localTime: value,
        disambiguation,
      })
    ).instant;
  function openEditor(record) {
    clearEditor();
    const editEpoch = editorEpoch;
    const readOnly =
      !canWrite ||
      (record && ["cancelled", "completed"].includes(record.status));
    const heading = node(
      "h3",
      readOnly
        ? hostText("Reservation details")
        : record
          ? hostText("Edit reservation")
          : hostText("Create reservation"),
    );
    const form = node("form", undefined, { class: "reservation-form" });
    const editingPropertyId = record?.propertyId ?? propertySelect.value;
    const zone =
      properties.find((item) => item.id === editingPropertyId)?.timezone ??
      record?.timezone ??
      organization.timezone ??
      "UTC";
    const editorCurrent = () =>
      current() && editEpoch === editorEpoch && editorDialog.open;
    const roomOptions = rooms.filter(
      (item) => item.propertyId === editingPropertyId,
    );
    if (record && !roomOptions.some((item) => item.id === record.roomId))
      roomOptions.push({
        id: record.roomId,
        name: `${record.roomName || record.roomId} (archived)`,
      });
    if (!roomOptions.length) {
      const close = node("button", hostText("Close reservation"), {
        type: "button",
      });
      close.addEventListener("click", clearEditor);
      editor.append(
        node(
          "p",
          hostText(
            "Add a room to this property before creating a reservation.",
          ),
        ),
        close,
      );
      editorDialog.showModal();
      return;
    }
    field(form, "Guest name", "name", record?.guest.name || "");
    field(
      form,
      "Guest phone (E.164)",
      "phone",
      record?.guest.phone || "",
      "tel",
    );
    const email = field(
      form,
      "Guest email (optional)",
      "email",
      record?.guest.email || "",
      "email",
    );
    email.required = false;
    for (const [name, label, max] of [
      ["floor", "Guest floor (optional)", 50],
      ["apartment", "Guest apartment (optional)", 80],
      ["parking", "Guest parking (optional)", 80],
      ["carNumber", "Guest car number (optional)", 50],
      ["comment", "Guest comment (optional)", 100],
    ]) {
      const input = field(form, label, name, record?.guest[name] || "");
      input.required = false;
      input.maxLength = max;
    }
    const room = field(
      form,
      "Reservation room",
      "roomId",
      record?.roomId || roomOptions[0].id,
      "text",
      roomOptions.map((item) => [item.id, item.name]),
    );
    const targets = field(form, "Access systems", "targetIds", "", "text", []);
    targets.multiple = true;
    targets.size = 4;
    targets.required = false;
    function mapTargets() {
      const available = systems.filter(
        (item) =>
          item.propertyId === editingPropertyId &&
          (!item.roomId || item.roomId === room.value),
      );
      targets.replaceChildren(
        ...available.map((item) => {
          const option = node(
            "option",
            `${item.name}${item.status === "active" ? "" : " (disabled)"}`,
            { value: item.id },
          );
          option.selected = record
            ? record.targetIds.includes(item.id)
            : item.status === "active";
          return option;
        }),
      );
    }
    mapTargets();
    room.addEventListener("change", mapTargets);
    field(
      form,
      hostText("Arrival ({zone})", { zone }),
      "startsAt",
      record ? localAt(record.startsAt, zone) : `${date.value}T15:00`,
      "datetime-local",
    );
    field(
      form,
      hostText("Departure ({zone})", { zone }),
      "endsAt",
      record ? localAt(record.endsAt, zone) : `${addDays(date.value, 1)}T10:00`,
      "datetime-local",
    );
    field(form, "Clock change occurrence", "disambiguation", "reject", "text", [
      ["reject", hostText("Ask me if the time occurs twice")],
      ["earlier", hostText("Earlier occurrence")],
      ["later", hostText("Later occurrence")],
    ]);
    const allowedStates = !record
      ? ["draft", "confirmed"]
      : record.status === "draft"
        ? ["draft", "confirmed", "cancelled"]
        : states;
    field(
      form,
      "Booking state",
      "status",
      record?.status || "draft",
      "text",
      allowedStates.map((state) => [state, hostText(state)]),
    );
    const reference = field(
      form,
      "External reference (optional)",
      "externalReference",
      record?.externalReference || "",
    );
    reference.required = false;
    reference.maxLength = 128;
    const note = field(
      form,
      "Reservation note (optional)",
      "note",
      record?.note || "",
    );
    note.required = false;
    note.maxLength = 1000;
    const guestFields = node("fieldset"),
      stayFields = node("fieldset"),
      accessFields = node("fieldset");
    guestFields.append(node("legend", hostText("Guest contact")));
    stayFields.append(node("legend", hostText("Stay and booking status")));
    accessFields.append(
      node("legend", hostText("Access systems")),
      node(
        "p",
        hostText(
          "Selecting a system does not confirm delivery, guest import or a physical gate opening.",
        ),
      ),
    );
    const optionalFields = node("details", undefined, {
      class: "reservation-optional-fields",
    });
    optionalFields.append(
      node("summary", hostText("Optional guest details and notes")),
    );
    for (const name of ["name", "phone"])
      guestFields.append(form.querySelector(`[name="${name}"]`).parentElement);
    for (const name of [
      "roomId",
      "startsAt",
      "endsAt",
      "disambiguation",
      "status",
    ])
      stayFields.append(form.querySelector(`[name="${name}"]`).parentElement);
    accessFields.append(targets.parentElement);
    for (const name of [
      "email",
      "floor",
      "apartment",
      "parking",
      "carNumber",
      "comment",
      "externalReference",
      "note",
    ])
      optionalFields.append(
        form.querySelector(`[name="${name}"]`).parentElement,
      );
    optionalFields.addEventListener(
      "invalid",
      () => {
        optionalFields.open = true;
      },
      true,
    );
    form.append(guestFields, stayFields, accessFields, optionalFields);
    const resultStatus = node("p", "", {
      role: "status",
      "aria-live": "polite",
    });
    const save = node("button", hostText("Save reservation"), {
      type: "submit",
    });
    const close = node("button", hostText("Close reservation"), {
      type: "button",
    });
    close.addEventListener("click", () => clearEditor());
    if (record)
      form.append(
        node(
          "p",
          hostText("Version {version} · {status} · Timezone {zone}", {
            version: record.version,
            status: hostText(record.status),
            zone: record.timezone,
          }),
        ),
      );
    if (readOnly) {
      for (const input of form.querySelectorAll("input,select"))
        input.disabled = true;
      form.append(close);
    } else form.append(save, close);
    form.append(resultStatus);
    editor.append(heading, form);
    if (
      record &&
      ["cancelled", "completed"].includes(record.status) &&
      organization.membership.role === "owner" &&
      !record.guestRedactedAt
    ) {
      const privacy = node("section", undefined, {
        "aria-label": "Guest privacy",
      });
      const approval = node("input", undefined, { type: "checkbox" });
      const label = node(
        "label",
        hostText("Permanently delete this closed reservation's guest details"),
      );
      label.prepend(approval);
      const erase = node("button", hostText("Delete guest details"), {
        type: "button",
      });
      erase.disabled = true;
      const message = node("p", "", { role: "status" });
      privacy.append(
        node(
          "p",
          hostText(
            "This deletes stored guest details and private delivery content. An offline pass already imported remains valid until its effective end.",
          ),
        ),
        label,
        erase,
        message,
      );
      editor.append(privacy);
      let busy = false;
      const key = crypto.randomUUID();
      approval.addEventListener("change", () => {
        erase.disabled = busy || !approval.checked;
      });
      erase.addEventListener("click", async () => {
        if (busy || !approval.checked) return;
        busy = true;
        erase.disabled = approval.disabled = true;
        message.textContent = hostText("Deleting guest details…");
        try {
          await portalRequest(
            user,
            path(`/${encodeURIComponent(record.id)}/privacy/redact`),
            "POST",
            { version: record.version, confirm: "delete_guest_details" },
            key,
          );
          if (!current() || !privacy.isConnected) return;
          clearEditor();
          await load();
        } catch (error) {
          if (!current() || !privacy.isConnected) return;
          message.textContent =
            errors[error.code] ||
            (error.code === "RECENT_AUTH_REQUIRED"
              ? "Sign in again with TOTP before deleting guest details."
              : "Guest details could not be deleted. Refresh before retrying.");
        } finally {
          if (current() && privacy.isConnected) {
            busy = false;
            approval.disabled = false;
            erase.disabled = !approval.checked;
          }
        }
      });
    }
    editorDialog.showModal();
    if (record)
      void renderHostAccessGrants({
        container: editor,
        user,
        organization,
        reservation: record,
        isCurrent: editorCurrent,
      });
    heading.tabIndex = -1;
    heading.focus();
    let attempt;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (readOnly || save.disabled) return;
      save.disabled = true;
      resultStatus.textContent = hostText("Saving reservation…");
      try {
        const values = Object.fromEntries(new FormData(form));
        const [startsAt, endsAt] = await Promise.all([
          record &&
          values.disambiguation === "reject" &&
          values.startsAt === localAt(record.startsAt, zone)
            ? record.startsAt
            : resolve(
                values.startsAt,
                values.disambiguation,
                editingPropertyId,
              ),
          record &&
          values.disambiguation === "reject" &&
          values.endsAt === localAt(record.endsAt, zone)
            ? record.endsAt
            : resolve(values.endsAt, values.disambiguation, editingPropertyId),
        ]);
        if (!editorCurrent()) return;
        const input = {
          propertyId: editingPropertyId,
          roomId: values.roomId,
          targetIds: [...targets.selectedOptions].map((option) => option.value),
          guest: {
            ...(record?.guest ?? {}),
            name: values.name.trim(),
            phone: values.phone.trim(),
            ...(values.email.trim() ? { email: values.email.trim() } : {}),
          },
          startsAt,
          endsAt,
          status: values.status,
          note: values.note.trim(),
          ...(values.externalReference.trim()
            ? { externalReference: values.externalReference.trim() }
            : {}),
          ...(record ? { version: record.version } : {}),
        };
        if (!values.email.trim()) delete input.guest.email;
        for (const name of [
          "floor",
          "apartment",
          "parking",
          "carNumber",
          "comment",
        ]) {
          if (values[name].trim()) input.guest[name] = values[name].trim();
          else delete input.guest[name];
        }
        const signature = JSON.stringify(input);
        if (!attempt || attempt.signature !== signature)
          attempt = { signature, key: crypto.randomUUID() };
        await portalRequest(
          user,
          path(record ? `/${encodeURIComponent(record.id)}` : ""),
          record ? "PUT" : "POST",
          input,
          attempt.key,
        );
        if (!current()) return;
        if (editEpoch !== editorEpoch) {
          await load();
          return;
        }
        clearEditor();
        await load();
      } catch (error) {
        if (editorCurrent())
          resultStatus.textContent =
            errors[error.code] ||
            hostText(
              "The reservation could not be saved. You can retry safely.",
            );
      } finally {
        if (editorCurrent()) save.disabled = false;
      }
    });
  }
  function draw() {
    const days = duration();
    if (listMode) {
      drawReservationList();
      return;
    }
    const table = node("table");
    table.append(
      node(
        "caption",
        `${property().name} · ${property().timezone} · ${view.selectedOptions[0].textContent}`,
      ),
    );
    const header = node("tr");
    header.append(node("th", hostText("Room"), { scope: "col" }));
    for (let index = 0; index < days; index++) {
      const day = addDays(date.value, index),
        cell = node("th", undefined, {
          scope: "col",
          "data-calendar-date": day,
        });
      const instant = new Date(day + "T12:00:00Z");
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
    for (const cell of header.children)
      if (cell.dataset.calendarDate === dateAt(Date.now(), property().timezone))
        cell.classList.add("calendar-today");
    const head = node("thead");
    head.append(header);
    table.append(head);
    const body = node("tbody");
    const visibleRooms = rooms.filter(
      (item) =>
        (!propertySelect.value || item.propertyId === propertySelect.value) &&
        (!roomFilter.value || item.id === roomFilter.value),
    );
    for (const booking of data)
      if (!visibleRooms.some((item) => item.id === booking.roomId))
        visibleRooms.push({
          id: booking.roomId,
          propertyId: booking.propertyId,
          name: `${booking.roomName || booking.roomId} (archived)`,
        });
    visibleRooms.sort(
      (a, b) =>
        (a.propertyId ?? "").localeCompare(b.propertyId ?? "") ||
        a.name.localeCompare(b.name),
    );
    let lastProperty;
    for (const room of visibleRooms) {
      const group = room.propertyId ?? "archived";
      if (group !== lastProperty) {
        lastProperty = group;
        const groupRow = node("tr"),
          groupCell = node("th", undefined, {
            colspan: String(days + 1),
            class: "calendar-property-group",
          });
        const toggle = node(
          "button",
          properties.find((item) => item.id === group)?.name ??
            hostText("Archived property"),
          {
            type: "button",
            "aria-expanded": String(!collapsedProperties.has(group)),
          },
        );
        toggle.setAttribute("aria-label", toggle.textContent);
        toggle.addEventListener("click", () => {
          if (collapsedProperties.has(group)) collapsedProperties.delete(group);
          else collapsedProperties.add(group);
          toggle.setAttribute(
            "aria-expanded",
            String(!collapsedProperties.has(group)),
          );
          for (const item of body.children)
            if (item.dataset.calendarProperty === group)
              item.hidden = collapsedProperties.has(group);
        });
        groupCell.append(toggle);
        groupRow.append(groupCell);
        body.append(groupRow);
      }
      const row = node("tr");
      row.dataset.calendarProperty = group;
      row.hidden = collapsedProperties.has(group);
      row.append(node("th", room.name, { scope: "row" }));
      const cell = node("td", undefined, {
        colspan: String(days),
        class: "calendar-room-timeline",
      });
      const timeline = node("div", undefined, { class: "calendar-timeline" });
      timeline.style.setProperty("--calendar-days", String(days));
      const { spans, lanes } = calendarSpans(
        data.filter((item) => item.roomId === room.id),
        date.value,
        days,
        dateAt,
        property().timezone,
      );
      timeline.style.gridTemplateRows = `repeat(${lanes}, 64px)`;
      for (const { record: reservation, start, end, lane } of spans) {
        const button = node("button", undefined, {
          type: "button",
          class: `reservation-chip reservation-${reservation.status}`,
          "aria-label": `${reservation.guest.name}, ${reservation.status}, ${room.name}, ${reservation.startsAt} to ${reservation.endsAt}`,
        });
        button.style.gridColumn = `${start + 1} / ${end + 1}`;
        button.style.gridRow = String(lane + 1);
        button.append(
          node("strong", reservation.guest.name),
          node(
            "small",
            `${reservation.guest.email || reservation.externalReference || ""} · ${hostText(reservation.status)}`,
          ),
        );
        button.title = `${reservation.guest.name} · ${hostText(reservation.status)} · ${localAt(reservation.startsAt, property().timezone)} — ${localAt(reservation.endsAt, property().timezone)}`;
        button.addEventListener("click", () => openEditor(reservation));
        timeline.append(button);
      }
      if (!spans.length)
        timeline.append(
          node("span", hostText("No reservations"), {
            class: "calendar-empty-room",
          }),
        );
      cell.append(timeline);
      row.append(cell);
      body.append(row);
    }
    const format = new Intl.DateTimeFormat(hostLocale, {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    rangeTitle.textContent = `${format.format(new Date(date.value + "T12:00:00Z"))} – ${format.format(new Date(addDays(date.value, days - 1) + "T12:00:00Z"))}`;
    table.append(body);
    grid.replaceChildren(table);
    const reference = document.querySelector(".calendar-reference");
    if (reference) reference.hidden = true;
    if (cursor) {
      const more = node("button", hostText("Load more reservations"), {
        type: "button",
      });
      more.addEventListener("click", () => void load(true));
      grid.append(more);
    }
  }
  function drawReservationList() {
    const list = node("ul", undefined, { class: "host-resource-list" });
    for (const reservation of data) {
      const zone =
        properties.find((item) => item.id === reservation.propertyId)
          ?.timezone ?? organization.timezone;
      const row = node("li");
      const open = node(
        "button",
        reservation.guest.name || "Guest details removed",
        { type: "button" },
      );
      open.addEventListener("click", () => {
        if (current()) openEditor(reservation);
      });
      row.append(
        open,
        node(
          "p",
          [reservation.guest.email, reservation.guest.phone]
            .filter(Boolean)
            .join(" · "),
        ),
        node(
          "p",
          `${reservation.roomName || reservation.roomId} · ${localAt(reservation.startsAt, zone)} — ${localAt(reservation.endsAt, zone)} · ${zone}`,
        ),
        node("p", `Booking: ${reservation.status}`),
      );
      list.append(row);
    }
    grid.replaceChildren(list);
    if (!data.length)
      grid.append(
        node(
          "p",
          cursor
            ? "No matches on this page. Continue to search later records."
            : "No reservations match these filters.",
        ),
      );
    if (cursor && data.length < 1000) {
      const more = node("button", hostText("Load more reservations"), {
        type: "button",
      });
      more.addEventListener("click", () => {
        more.disabled = true;
        void load(true);
      });
      grid.append(more);
    } else if (cursor)
      grid.append(
        node(
          "p",
          hostText(
            "1,000 records loaded. Narrow the date range or filters to continue.",
          ),
        ),
      );
  }
  async function load(more = false) {
    if (
      listMode &&
      (!Number.isInteger(duration()) || duration() < 1 || duration() > 62)
    ) {
      status.textContent = hostText(
        "Choose a date range between 1 and 62 days.",
      );
      return;
    }
    if (view.value === "month" && !more)
      date.value = `${date.value.slice(0, 7)}-01`;
    const request = ++loading;
    const selection = {
      propertyId: propertySelect.value,
      roomId: roomFilter.value,
      date: date.value,
      days: duration(),
      q: search.value.trim(),
      status: filter.value,
    };
    status.textContent = hostText("Loading reservations…");
    if (!more)
      grid.replaceChildren(node("p", hostText("Loading reservations…")));
    try {
      if (!more) {
        const [from, to] = await Promise.all([
          resolve(`${selection.date}T00:00`, "earlier", selection.propertyId),
          resolve(
            `${addDays(selection.date, selection.days)}T00:00`,
            "later",
            selection.propertyId,
          ),
        ]);
        if (!current() || request !== loading) return;
        if (Date.parse(to) - Date.parse(from) > 62 * 86400000) {
          status.textContent =
            "This range exceeds the 62-day limit across a clock change. Choose an earlier end date.";
          grid.replaceChildren();
          return;
        }
        activeRange = { from, to };
      }
      const query = new URLSearchParams({
        ...activeRange,
        ...(selection.propertyId ? { propertyId: selection.propertyId } : {}),
        ...(selection.roomId ? { roomId: selection.roomId } : {}),
        limit: "100",
        ...(selection.q ? { q: selection.q } : {}),
        ...(selection.status ? { status: selection.status } : {}),
        ...(more && cursor ? { cursor } : {}),
      });
      const response = await portalRequest(user, path(`?${query}`));
      if (!current() || request !== loading) return;
      data = [
        ...new Map(
          (more ? [...data, ...response.items] : response.items).map((item) => [
            item.id,
            item,
          ]),
        ).values(),
      ];
      cursor = response.nextCursor;
      draw();
      status.textContent = hostText(
        data.length === 1 ? "{count} reservation" : "{count} reservations",
        { count: data.length },
      );
      refreshed.textContent =
        hostText("Refreshed {time}", {
          time: new Date().toLocaleTimeString(hostLocale),
        }) +
        (cursor
          ? " · " + hostText("More results available; count is partial")
          : "");
    } catch (error) {
      if (current() && request === loading) {
        status.textContent =
          errors[error.code] ||
          hostText(
            "Reservations could not be loaded. Search or update the calendar to retry.",
          );
        for (const button of grid.querySelectorAll("button"))
          button.disabled = false;
      }
    }
  }
  controls.addEventListener("submit", (event) => {
    event.preventDefault();
    clearEditor();
    void load();
  });
  propertySelect.addEventListener("change", () => {
    clearEditor();
    mapRooms();
    date.value = dateAt(Date.now(), property().timezone);
    if (listMode) endDate.value = addDays(date.value, 30);
    void load();
  });
  roomFilter.addEventListener("change", () => {
    clearEditor();
    void load();
  });
  filterListener = new AbortController();
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
        (saved.propertyId &&
          !properties.some((item) => item.id === saved.propertyId)) ||
        (saved.roomId &&
          !rooms.some(
            (item) =>
              item.id === saved.roomId &&
              (!saved.propertyId || item.propertyId === saved.propertyId),
          )) ||
        (saved.status && !states.includes(saved.status))
      ) {
        status.textContent = hostText(
          "Saved filter resources are unavailable. Refresh the organization.",
        );
        return;
      }
      propertySelect.value = saved.propertyId ?? "";
      mapRooms();
      roomFilter.value = saved.roomId ?? "";
      filter.value = saved.status ?? "";
      clearEditor();
      void load();
    },
    { signal: filterListener.signal },
  );
  view.addEventListener("change", () => {
    syncRange();
    void load();
  });
  const move = (direction) => {
    date.value =
      view.value === "month"
        ? new Date(
            Date.UTC(
              Number(date.value.slice(0, 4)),
              Number(date.value.slice(5, 7)) - 1 + direction,
              1,
            ),
          )
            .toISOString()
            .slice(0, 10)
        : addDays(date.value, direction * duration());
    void load();
  };
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  today.addEventListener("click", () => {
    date.value = dateAt(Date.now(), property().timezone);
    void load();
  });
  add.addEventListener("click", () => {
    if (!propertySelect.value) {
      status.textContent = hostText(
        "Choose a specific property before creating a reservation.",
      );
      return;
    }
    openEditor();
  });
  await load();
}
