import { portalRequest } from "./api/index.js";
import { node, field } from "./host-ui.js";
import { renderHostAccessGrants } from "./host-access-grants.js";

const states = ["draft", "confirmed", "changed", "cancelled", "completed"];
let sessionGeneration = 0;
let filterListener;
export function clearHostCalendar() { sessionGeneration++; filterListener?.abort(); filterListener = undefined; }
const dateAt = (value, timezone) => new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
const localAt = (value, timezone) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value)).map((item) => [item.type, item.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
const addDays = (date, days) => new Date(Date.parse(`${date}T12:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
const errors = {
  RESERVATION_OVERLAP: "This room is already reserved during that window.",
  VERSION_CONFLICT: "This reservation changed. Close this form and reload it before saving.",
  INVALID_TRANSITION: "This state change is not allowed. Completed and cancelled reservations are final.",
  INVALID_LOCAL_TIME: "That local time does not exist because of a clock change. Choose another time.",
  AMBIGUOUS_LOCAL_TIME: "That local time occurs twice. Choose the earlier or later occurrence.",
  SYSTEM_UNAVAILABLE: "Choose active access systems mapped to this room or property.",
  TENANT_ACCESS_DENIED: "Your organization access has changed. Refresh your account.",
  INVALID_REQUEST: "Check the guest phone, time window and selected systems.",
  RATE_LIMITED: "Too many requests. Wait a moment and retry with the same form.",
};
export async function renderHostCalendar({ container, user, organization, properties, rooms, isCurrent }) {
  clearHostCalendar();
  if (!properties.length) return;
  const epoch = sessionGeneration;
  const current = () => epoch === sessionGeneration && isCurrent();
  const path = (suffix = "") => `/api/v1/organizations/${encodeURIComponent(organization.id)}/reservations${suffix}`;
  const canWrite = ["owner", "admin", "staff"].includes(organization.membership.role);
  const section = node("section", undefined, { "aria-label": "Reservation calendar", class: "host-calendar" });
  section.append(node("h2", "Reservation calendar"));
  const controls = node("form", undefined, { class: "calendar-controls" });
  const propertySelect = field(controls, "Calendar property", "propertyId", properties[0].id, "text", [["", "All properties"], ...properties.map((item) => [item.id, item.name])]);
  const roomFilter = field(controls, "Calendar room", "roomId", "", "text", [["", "All rooms"]]);
  const mapRooms = () => { roomFilter.replaceChildren(node("option", "All rooms", { value: "" }), ...rooms.filter(item => !propertySelect.value || item.propertyId === propertySelect.value).map(item => node("option", item.name, { value: item.id }))); }; mapRooms();
  const view = field(controls, "Calendar view", "view", "week", "text", [["week", "Week"], ["two-week", "Two weeks"], ["month", "Month"]]);
  const date = field(controls, "Start date", "date", dateAt(Date.now(), properties[0].timezone), "date");
  const search = field(controls, "Search guest or reference", "q"); search.required = false;
  const filter = field(controls, "Reservation status", "status", "", "text", [["", "All states"], ...states.map((state) => [state, state])]); filter.required = false;
  controls.append(node("button", "Update calendar", { type: "submit" }));
  const navigation = node("div", undefined, { class: "form-actions" });
  const previous = node("button", "Previous", { type: "button" });
  const today = node("button", "Today", { type: "button" });
  const next = node("button", "Next", { type: "button" });
  navigation.append(previous, today, next);
  const add = node("button", "New reservation", { type: "button" });
  const status = node("p", "", { role: "status", "aria-live": "polite" });
  const editor = node("div");
  const grid = node("div", undefined, { class: "calendar-scroll", tabindex: "0", "aria-label": "Calendar table" });
  section.append(controls, navigation, ...(canWrite ? [add] : []), status, editor, grid);
  container.append(section);
  const systemsPage = await portalRequest(user, `/api/v1/organizations/${encodeURIComponent(organization.id)}/systems?limit=100`);
  if (!current()) return;
  const systems = systemsPage.items ?? [];
  let data = [];
  let cursor;
  let activeRange;
  let loading = 0;
  const property = () => properties.find((item) => item.id === propertySelect.value) ?? { name: "All properties", timezone: organization.timezone ?? "UTC" };
  const duration = () => view.value === "week" ? 7 : view.value === "two-week" ? 14 : new Date(Date.UTC(Number(date.value.slice(0, 4)), Number(date.value.slice(5, 7)), 0)).getUTCDate();
  const resolve = async (value, disambiguation = "reject", propertyId = propertySelect.value) => (await portalRequest(user, path("/time-zone/resolve"), "POST", { ...(propertyId ? { propertyId } : {}), localTime: value, disambiguation })).instant;
  function openEditor(record) {
    editor.replaceChildren();
    const readOnly = !canWrite || (record && ["cancelled", "completed"].includes(record.status));
    const heading = node("h3", record ? "Edit reservation" : "Create reservation");
    const form = node("form", undefined, { class: "reservation-form" });
    const editingPropertyId = record?.propertyId ?? propertySelect.value;
    const zone = properties.find((item) => item.id === editingPropertyId).timezone;
    const roomOptions = rooms.filter((item) => item.propertyId === editingPropertyId);
    if (record && !roomOptions.some((item) => item.id === record.roomId)) roomOptions.push({ id: record.roomId, name: `${record.roomName || record.roomId} (archived)` });
    if (!roomOptions.length) { editor.append(node("p", "Add a room to this property before creating a reservation.")); return; }
    field(form, "Guest name", "name", record?.guest.name || "");
    field(form, "Guest phone (E.164)", "phone", record?.guest.phone || "", "tel");
    const email = field(form, "Guest email (optional)", "email", record?.guest.email || "", "email"); email.required = false;
    for (const [name, label, max] of [["floor", "Guest floor (optional)", 50], ["apartment", "Guest apartment (optional)", 80], ["parking", "Guest parking (optional)", 80], ["carNumber", "Guest car number (optional)", 50], ["comment", "Guest comment (optional)", 100]]) { const input = field(form, label, name, record?.guest[name] || ""); input.required = false; input.maxLength = max; }
    const room = field(form, "Reservation room", "roomId", record?.roomId || roomOptions[0].id, "text", roomOptions.map((item) => [item.id, item.name]));
    const targets = field(form, "Access systems", "targetIds", "", "text", []); targets.multiple = true; targets.size = 4; targets.required = false;
    function mapTargets() {
      const available = systems.filter((item) => item.propertyId === editingPropertyId && (!item.roomId || item.roomId === room.value));
      targets.replaceChildren(...available.map((item) => {
        const option = node("option", `${item.name}${item.status === "active" ? "" : " (disabled)"}`, { value: item.id });
        option.selected = record ? record.targetIds.includes(item.id) : item.status === "active";
        return option;
      }));
    }
    mapTargets(); room.addEventListener("change", mapTargets);
    field(form, `Arrival (${zone})`, "startsAt", record ? localAt(record.startsAt, zone) : `${date.value}T15:00`, "datetime-local");
    field(form, `Departure (${zone})`, "endsAt", record ? localAt(record.endsAt, zone) : `${addDays(date.value, 1)}T10:00`, "datetime-local");
    field(form, "Clock change occurrence", "disambiguation", "reject", "text", [["reject", "Ask me if the time occurs twice"], ["earlier", "Earlier occurrence"], ["later", "Later occurrence"]]);
    const allowedStates = !record ? ["draft", "confirmed"] : record.status === "draft" ? ["draft", "confirmed", "cancelled"] : states;
    field(form, "Booking state", "status", record?.status || "draft", "text", allowedStates.map((state) => [state, state]));
    const reference = field(form, "External reference (optional)", "externalReference", record?.externalReference || ""); reference.required = false; reference.maxLength = 128;
    const note = field(form, "Reservation note (optional)", "note", record?.note || ""); note.required = false; note.maxLength = 1000;
    const resultStatus = node("p", "", { role: "status", "aria-live": "polite" });
    const save = node("button", "Save reservation", { type: "submit" });
    const close = node("button", "Close reservation", { type: "button" });
    close.addEventListener("click", () => editor.replaceChildren());
    if (record) form.append(node("p", `Version ${record.version} · ${record.status} · Timezone ${record.timezone}`));
    if (readOnly) {
      for (const input of form.querySelectorAll("input,select")) input.disabled = true;
      form.append(close);
    } else form.append(save, close);
    form.append(resultStatus); editor.append(heading, form);
    if (record) void renderHostAccessGrants({ container: editor, user, organization, reservation: record, isCurrent: current });
    heading.tabIndex = -1; heading.focus();
    let attempt;
    form.addEventListener("submit", async (event) => {
      event.preventDefault(); if (readOnly || save.disabled) return;
      save.disabled = true; resultStatus.textContent = "Saving reservation…";
      try {
        const values = Object.fromEntries(new FormData(form));
        const [startsAt, endsAt] = await Promise.all([
          record && values.disambiguation === "reject" && values.startsAt === localAt(record.startsAt, zone) ? record.startsAt : resolve(values.startsAt, values.disambiguation, editingPropertyId),
          record && values.disambiguation === "reject" && values.endsAt === localAt(record.endsAt, zone) ? record.endsAt : resolve(values.endsAt, values.disambiguation, editingPropertyId),
        ]);
        if (!current()) return;
        const input = { propertyId: editingPropertyId, roomId: values.roomId, targetIds: [...targets.selectedOptions].map((option) => option.value), guest: { ...(record?.guest ?? {}), name: values.name.trim(), phone: values.phone.trim(), ...(values.email.trim() ? { email: values.email.trim() } : {}) }, startsAt, endsAt, status: values.status, note: values.note.trim(), ...(values.externalReference.trim() ? { externalReference: values.externalReference.trim() } : {}), ...(record ? { version: record.version } : {}) };
        if (!values.email.trim()) delete input.guest.email;
        for (const name of ["floor", "apartment", "parking", "carNumber", "comment"]) { if (values[name].trim()) input.guest[name] = values[name].trim(); else delete input.guest[name]; }
        const signature = JSON.stringify(input);
        if (!attempt || attempt.signature !== signature) attempt = { signature, key: crypto.randomUUID() };
        await portalRequest(user, path(record ? `/${encodeURIComponent(record.id)}` : ""), record ? "PUT" : "POST", input, attempt.key);
        if (!current()) return;
        editor.replaceChildren(); await load();
      } catch (error) { if (current()) resultStatus.textContent = errors[error.code] || "The reservation could not be saved. You can retry safely."; }
      finally { if (current()) save.disabled = false; }
    });
  }
  function draw() {
    const days = duration();
    const table = node("table");
    table.append(node("caption", `${property().name} · ${property().timezone} · ${view.selectedOptions[0].textContent}`));
    const header = node("tr"); header.append(node("th", "Room", { scope: "col" }));
    for (let index = 0; index < days; index++) header.append(node("th", addDays(date.value, index), { scope: "col" }));
    const head = node("thead"); head.append(header); table.append(head);
    const body = node("tbody");
    const visibleRooms = rooms.filter((item) => (!propertySelect.value || item.propertyId === propertySelect.value) && (!roomFilter.value || item.id === roomFilter.value));
    for (const booking of data) if (!visibleRooms.some((item) => item.id === booking.roomId)) visibleRooms.push({ id: booking.roomId, name: `${booking.roomName || booking.roomId} (archived)` });
    for (const room of visibleRooms) {
      const row = node("tr"); row.append(node("th", room.name, { scope: "row" }));
      for (let index = 0; index < days; index++) {
        const day = addDays(date.value, index);
        const cell = node("td");
        const matches = data.filter((item) => item.roomId === room.id && dateAt(item.startsAt, property().timezone) <= day && dateAt(new Date(Date.parse(item.endsAt) - 1), property().timezone) >= day);
        for (const reservation of matches) {
          const button = node("button", `${reservation.guest.name} · ${reservation.status}`, { type: "button", class: `reservation-chip reservation-${reservation.status}`, "aria-label": `${reservation.guest.name}, ${reservation.status}, ${room.name}, ${day}` });
          button.addEventListener("click", () => openEditor(reservation)); cell.append(button);
        }
        if (!matches.length) cell.append(node("span", "—"));
        row.append(cell);
      }
      body.append(row);
    }
    table.append(body); grid.replaceChildren(table);
    const reference = document.querySelector(".calendar-reference");
    if (reference) reference.hidden = true;
    if (cursor) {
      const more = node("button", "Load more reservations", { type: "button" });
      more.addEventListener("click", () => void load(true)); grid.append(more);
    }
  }
  async function load(more = false) {
    if (view.value === "month" && !more) date.value = `${date.value.slice(0, 7)}-01`;
    const request = ++loading;
    const selection = { propertyId: propertySelect.value, roomId: roomFilter.value, date: date.value, days: duration(), q: search.value.trim(), status: filter.value };
    status.textContent = "Loading reservations…";
    if (!more) grid.replaceChildren(node("p", "Loading calendar…"));
    try {
      if (!more) {
        const [from, to] = await Promise.all([resolve(`${selection.date}T00:00`, "earlier", selection.propertyId), resolve(`${addDays(selection.date, selection.days)}T00:00`, "later", selection.propertyId)]);
        if (!current() || request !== loading) return;
        activeRange = { from, to };
      }
      const query = new URLSearchParams({ ...activeRange, ...(selection.propertyId ? { propertyId: selection.propertyId } : {}), ...(selection.roomId ? { roomId: selection.roomId } : {}), limit: "100", ...(selection.q ? { q: selection.q } : {}), ...(selection.status ? { status: selection.status } : {}), ...(more && cursor ? { cursor } : {}) });
      const response = await portalRequest(user, path(`?${query}`));
      if (!current() || request !== loading) return;
      data = more ? [...data, ...response.items] : response.items;
      cursor = response.nextCursor;
      draw(); status.textContent = `${data.length} reservation${data.length === 1 ? "" : "s"}`;
    } catch (error) { if (current() && request === loading) status.textContent = errors[error.code] || "The calendar could not be loaded. Update it to retry."; }
  }
  controls.addEventListener("submit", (event) => { event.preventDefault(); editor.replaceChildren(); void load(); });
  propertySelect.addEventListener("change", () => { editor.replaceChildren(); mapRooms(); date.value = dateAt(Date.now(), property().timezone); void load(); });
  roomFilter.addEventListener("change", () => { editor.replaceChildren(); void load(); });
  filterListener = new AbortController();
  window.addEventListener("host:operations-filter", event => {
    const saved = event.detail;
    if (!current() || saved?.orgId !== organization.id) return;
    if ((saved.propertyId && !properties.some(item => item.id === saved.propertyId)) || (saved.roomId && !rooms.some(item => item.id === saved.roomId && (!saved.propertyId || item.propertyId === saved.propertyId))) || (saved.status && !states.includes(saved.status))) { status.textContent = "Saved filter resources are unavailable. Refresh the organization."; return; }
    propertySelect.value = saved.propertyId ?? ""; mapRooms(); roomFilter.value = saved.roomId ?? ""; filter.value = saved.status ?? ""; editor.replaceChildren(); void load();
  }, { signal: filterListener.signal });
  view.addEventListener("change", () => void load());
  const move = (direction) => { date.value = view.value === "month" ? new Date(Date.UTC(Number(date.value.slice(0, 4)), Number(date.value.slice(5, 7)) - 1 + direction, 1)).toISOString().slice(0, 10) : addDays(date.value, direction * duration()); void load(); };
  previous.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  today.addEventListener("click", () => { date.value = dateAt(Date.now(), property().timezone); void load(); });
  add.addEventListener("click", () => { if (!propertySelect.value) { status.textContent = "Choose a specific property before creating a reservation."; return; } openEditor(); });
  await load();
}
