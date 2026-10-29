import {
  DEFAULT_MAX_EVENTS, EVENT_MINUTE_STEP, MINUTES_PER_DAY, absoluteRows,
  addedBlocks, applyDayEdit, blocksEqual, decodeEventWeek, formatDuration,
  formatEpochDay, formatMinutes, gateLocalDayMinute, insertBlock, moveBlock,
  replaceAll, resizeBlock, setBlockTimes, toWireRows, upcomingDates,
} from "./manager-events-model.js";

const COPY = {
  he: {
    title: "אירועים מתוזמנים", days: ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"],
    short: ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"], open: "שער פתוח", close: "שער סגור",
    help: "לוח שבועי: בשעות האירוע השער פתוח בירוק או סגור באדום. אירוע חד־פעמי של השבוע הקרוב מסומן במסגרת מקווקוות. בחרו יום לעריכה.",
    editHelp: "בחרו צבע ולחצו על הציר כדי להוסיף אירוע. גררו את האירוע להזזה או את קצותיו לשינוי השעות. כפתורי מינוס ופלוס מדייקים ב־10 דקות.",
    weekly: "כל שבוע", once: "חד־פעמי", edit: "עריכת יום", empty: "אין אירועים", start: "התחלה", end: "סיום",
    save: "שמירה", saving: "שומר אירועים בשער…", saved: "האירועים נשמרו בשער.", cancel: "ביטול", remove: "מחיקת האירוע",
    overlap: "אין אפשרות לחפיפה בין אירועים. שום דבר לא נשמר.", invalid: "בחרו שעות תקינות בצעדים של 10 דקות. שעת הסיום חייבת להיות אחרי שעת ההתחלה.",
    full: "הגעתם למספר האירועים המרבי בשער.", dates: "אפשר לקבוע אירוע חד־פעמי עד 90 יום קדימה.",
    copy: "הוספה לימים נוספים", copyHelp: "בשמירה, האירועים השבועיים שהוספתם או שיניתם יתווספו לימים שבחרתם. האירועים הקיימים בהם נשארים.",
    copyEmpty: "הוסיפו או שנו אירוע שבועי כדי להוסיף אותו לימים נוספים.",
    clear: "מחיקת כל האירועים", clearConfirm: "למחוק את כל האירועים בכל הימים מהשער?", discard: "לבטל את השינויים ביום הזה? השינויים לא יישמרו.",
    swap: "החלפת מגעי NO/NC", swapHelp: "לכל האירועים, לפי החיווט של השער.", loading: "טוען אירועים מהשער…", retry: "ניסיון נוסף",
    failed: "לא ניתן לטעון או לשמור את האירועים.", changed: "האירועים בשער השתנו בינתיים. הלוח רוענן. בדקו את המצב העדכני לפני עריכה נוספת.",
    clock: "תאריכים חד־פעמיים יהיו זמינים לאחר כיוון השעון בשער.", choose: "בחרו אירוע בציר כדי לערוך את השעות שלו.",
    earlier: "10 דקות מוקדם יותר", later: "10 דקות מאוחר יותר", now: "עכשיו", count: "אירועים",
  },
  en: {
    title: "Scheduled events", days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    short: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], open: "Gate open", close: "Gate closed",
    help: "A weekly plan: during an event the gate is open in green or closed in red. A one-time event in the coming week has a dashed outline. Choose a day to edit it.",
    editHelp: "Pick a color and tap the timeline to add an event. Drag the event to move it or an edge to change its hours. Minus and plus fine-tune by 10 minutes.",
    weekly: "Every week", once: "One-time", edit: "Edit", empty: "No events", start: "Start", end: "End",
    save: "Save", saving: "Saving events on the gate…", saved: "Events saved on the gate.", cancel: "Cancel", remove: "Delete event",
    overlap: "Events cannot overlap. Nothing was saved.", invalid: "Choose valid times in 10-minute steps. The end must be after the start.",
    full: "The gate's event limit has been reached.", dates: "A one-time event can be up to 90 days ahead.",
    copy: "Add to other days", copyHelp: "On Save, weekly events added or changed here are also added to the days you choose. Their existing events stay.",
    copyEmpty: "Add or change a weekly event to add it to other days.",
    clear: "Delete all events", clearConfirm: "Delete every event on every day from the gate?", discard: "Discard changes to this day? They will not be saved.",
    swap: "Swap NO/NC contacts", swapHelp: "For every event, to match the gate's wiring.", loading: "Loading events from the gate…", retry: "Try again",
    failed: "Events could not be loaded or saved.", changed: "The gate's events changed meanwhile. The plan was refreshed. Review it before editing again.",
    clock: "One-time dates become available after the gate's clock is set.", choose: "Select an event on the timeline to edit its hours.",
    earlier: "10 minutes earlier", later: "10 minutes later", now: "Now", count: "events",
  },
};

function el(tag, text, className) {
  const result = document.createElement(tag);
  if (text !== undefined) result.textContent = text;
  if (className) result.className = className;
  return result;
}
function action(text, handler, className = "") {
  const result = el("button", text, `manager-event-button ${className}`.trim());
  result.type = "button";
  result.addEventListener("click", handler);
  return result;
}
const pct = (minutes) => `${minutes / MINUTES_PER_DAY * 100}%`;

/**
 * One renderer for physical encrypted ManagerConnection and the local example
 * transport. The caller guards command/session identity and disposes this view
 * on navigation. ADMIN_SET_EVENTS is atomic and always carries the table revision.
 */
export function createManagerEvents({
  root, language = "en", table: initialTable, command,
  maxEvents = DEFAULT_MAX_EVENTS, clock, confirm = async (message) => window.confirm(message),
  onTableChanged = () => {}, isCurrent = () => true, errorText,
}) {
  const lang = language === "he" ? "he" : "en", copy = COPY[lang];
  const limit = Number.isInteger(maxEvents) && maxEvents > 0 ? maxEvents : DEFAULT_MAX_EVENTS;
  const countLabel = (count) => `\u2066${count} / ${limit}\u2069 ${copy.count}`;
  let table = initialTable, busy = false, disposed = false, notice = "", noticeDanger = false;
  let dialog, editor, returnFocus, pendingFocus, timer;
  const alive = () => !disposed && isCurrent();
  const section = el("section", undefined, "manager-events");
  section.dir = lang === "he" ? "rtl" : "ltr";
  root.append(section);

  function rows() { return absoluteRows(table.items, table.today); }
  function validTable(candidate) {
    return candidate && Array.isArray(candidate.items) && Number.isInteger(candidate.today) && candidate.today >= 0 && Number.isInteger(candidate.revision);
  }
  function accept(candidate) {
    if (!alive()) return;
    if (!validTable(candidate)) throw new Error("INVALID_EVENT_TABLE");
    table = candidate;
    onTableChanged(candidate);
  }
  const now = () => clock?.set && Number.isInteger(clock.tz) ? gateLocalDayMinute(Date.now(), clock.tz) : undefined;
  const describe = (block) => `${block.action === "OPEN" ? copy.open : copy.close} ${formatMinutes(block.start)}–${formatMinutes(block.end)}${block.date ? ` (${formatEpochDay(block.date)})` : ""}`;
  const feedback = (text, danger = true) => {
    notice = text; noticeDanger = danger;
    if (editor) renderEditor(); else renderWeek();
  };
  function explanation(error) {
    const code = error?.code ?? error?.message;
    if (code === "STORAGE_FULL") return copy.full;
    if (code === "INVALID_EVENT" || code === "EVENTS_OVERLAP" || error?.key === "EVENTS_OVERLAP") return copy.overlap;
    if (code === "EVENT_DATE_OUT_OF_RANGE" || error?.key === "EVENT_DATE_OUT_OF_RANGE") return copy.dates;
    return errorText?.(error) || copy.failed;
  }
  async function readTable() {
    const response = await command("ADMIN_LIST_EVENTS", {});
    if (alive()) accept(response.data);
  }
  async function mutate(name, payload) {
    if (busy || !alive()) return false;
    busy = true; notice = "";
    if (editor) renderEditor(); else renderWeek();
    try {
      const response = await command(name, { ...payload, expectedRevision: table.revision });
      if (!alive()) return false;
      if (validTable(response.data)) accept(response.data);
      else await readTable();
      if (!alive()) return false;
      closeEditor();
      notice = copy.saved; noticeDanger = false;
      return true;
    } catch (error) {
      if (!alive()) return false;
      if ((error.code ?? error.message) === "CONFLICT") {
        try { await readTable(); } catch (readError) {
          notice = explanation(readError); noticeDanger = true;
          return false;
        }
        closeEditor();
        notice = copy.changed;
      } else notice = explanation(error);
      noticeDanger = true;
      return false;
    } finally {
      busy = false;
      if (alive()) { if (editor) renderEditor(); else renderWeek(); }
    }
  }
  function timeline(blocks, { editable = false, locked = [], selected, day } = {}) {
    const track = el("div", undefined, `manager-event-track${editable ? " is-editor" : ""}`);
    track.dir = "ltr";
    const paint = () => {
      track.replaceChildren();
      for (let hour = 3; hour < 24; hour += 3) {
        const grid = el("span", undefined, "manager-event-grid");
        grid.style.left = pct(hour * 60); track.append(grid);
      }
      const draw = (block, index, isLocked) => {
        const bit = el("span", undefined, `manager-event-block is-${block.action.toLowerCase()}${block.date ? " is-once" : ""}${isLocked ? " is-locked" : ""}${selected === index && !isLocked ? " is-selected" : ""}`);
        bit.style.left = pct(block.start); bit.style.width = pct(block.end - block.start);
        bit.title = describe(block);
        bit.dataset.eventIndex = String(index);
        if (editable && !isLocked) {
          bit.tabIndex = busy ? -1 : 0; bit.setAttribute("role", "button");
          bit.dataset.eventFocus = `block-${index}`;
          bit.setAttribute("aria-label", describe(block));
          bit.setAttribute("aria-pressed", String(selected === index));
          bit.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault(); editor.selected = index; renderEditor();
            }
          });
        }
        track.append(bit);
      };
      locked.forEach((block, index) => draw(block, index, true));
      blocks.forEach((block, index) => draw(block, index, false));
      const current = now();
      if (current?.day === day && (!editor?.mode || editor.mode === table.today)) {
        const mark = el("span", undefined, "manager-event-now");
        mark.style.left = pct(current.minute); mark.title = copy.now; track.append(mark);
      }
    };
    paint();
    if (!editable) return track;
    track.dataset.eventTimeline = "editor";
    let drag;
    track.addEventListener("pointerdown", (event) => {
      if (busy || event.button !== 0) return;
      const bounds = track.getBoundingClientRect();
      const minute = Math.max(0, Math.min(1439, (event.clientX - bounds.left) / bounds.width * 1440));
      const index = blocks.findIndex((block) => block.start <= minute && minute < block.end);
      if (index < 0) {
        if (!editor.color) return;
        const result = insertBlock(blocks, editor.color, minute, locked, editor.mode || undefined);
        if (typeof result === "string") { feedback(copy.overlap); return; }
        const candidate = candidateRows(result.blocks);
        if (replaceAll(candidate, table.today, limit).result === "Full") { feedback(copy.full); return; }
        setDraft(result.blocks); editor.selected = result.index; editor.color = undefined;
        notice = ""; renderEditor(); return;
      }
      event.preventDefault(); editor.selected = index;
      const block = blocks[index];
      const startX = bounds.left + block.start / 1440 * bounds.width;
      const endX = bounds.left + block.end / 1440 * bounds.width;
      const edge = Math.abs(event.clientX - startX) <= 10 ? "start" : Math.abs(event.clientX - endX) <= 10 ? "end" : "move";
      drag = { id: event.pointerId, x: event.clientX, minute, initial: blocks.map((item) => ({ ...item })), index, edge, moved: false };
      track.setPointerCapture(event.pointerId);
      selected = index; paint(); renderSelected();
    });
    track.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId || busy) return;
      const width = track.getBoundingClientRect().width;
      const delta = (event.clientX - drag.x) / width * 1440;
      if (Math.abs(event.clientX - drag.x) > 3) drag.moved = true;
      const original = drag.initial[drag.index];
      blocks = drag.edge === "move"
        ? moveBlock(drag.initial, drag.index, original.start + delta, locked)
        : resizeBlock(drag.initial, drag.index, drag.edge, original[drag.edge] + delta, locked);
      setDraft(blocks); notice = ""; paint(); renderSelected(); updateSave();
    });
    const finish = (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
      drag = undefined; renderEditor();
    };
    track.addEventListener("pointerup", finish);
    track.addEventListener("pointercancel", finish);
    return track;
  }
  function axis(hours = [0, 4, 8, 12, 16, 20, 24]) {
    const line = el("div", undefined, "manager-event-axis"); line.dir = "ltr";
    for (const hour of hours) {
      const label = el("span", String(hour).padStart(2, "0"));
      label.style.left = `${hour / 24 * 100}%`; line.append(label);
    }
    return line;
  }
  function renderNotice(target) {
    if (!notice && !busy) return;
    const status = el("p", busy ? copy.saving : notice, `manager-event-notice${noticeDanger && !busy ? " is-error" : ""}`);
    status.setAttribute("role", noticeDanger && !busy ? "alert" : "status");
    target.append(status);
  }
  function renderWeek() {
    if (!alive()) return;
    const focus = pendingFocus || (section.contains(document.activeElement) ? document.activeElement.dataset.eventFocus : undefined);
    pendingFocus = undefined;
    section.replaceChildren(); section.setAttribute("aria-busy", String(busy));
    if (!validTable(table)) {
      section.append(el("h3", copy.title), el("p", copy.failed, "manager-event-notice is-error"), action(copy.retry, refresh)); return;
    }
    const card = el("div", undefined, "manager-event-card");
    const head = el("div", undefined, "manager-event-header");
    const heading = el("div", undefined, "manager-event-heading");
    heading.append(el("span", lang === "he" ? "תכנון שבועי" : "Weekly planner", "manager-event-eyebrow"), el("h3", copy.title));
    const capacity = el("div", undefined, "manager-event-capacity");
    const meter = el("meter"); meter.min = 0; meter.max = limit; meter.value = table.items.length;
    meter.setAttribute("aria-label", countLabel(table.items.length));
    capacity.append(el("span", countLabel(table.items.length), "manager-event-count"), meter);
    head.append(heading, capacity);
    card.append(head, el("p", copy.help, "manager-event-help"));
    const legend = el("div", undefined, "manager-event-legend");
    for (const [type, label] of [["open", copy.open], ["close", copy.close]]) legend.append(el("span", label, `is-${type}`));
    const once = el("span", copy.once, "is-once"); legend.append(once);
    card.append(legend);
    const week = decodeEventWeek(rows().filter((row) => row.length < 5 || row[4] < table.today + 7));
    const chart = el("div", undefined, "manager-event-week");
    const axisRow = el("div", undefined, "manager-event-day"); axisRow.append(el("span"), axis(), el("span")); chart.append(axisRow);
    week.forEach((blocks, day) => {
      const row = el("div", undefined, "manager-event-day");
      const dayLabel = el("span", undefined, "manager-event-day-label");
      dayLabel.append(el("span", copy.short[day], "manager-event-day-short"), el("span", copy.days[day], "manager-event-day-full"));
      const open = action("", () => openEditor(day), "manager-event-day-track");
      open.dataset.eventFocus = `day-track-${day}`;
      open.setAttribute("aria-label", `${copy.edit} ${copy.days[day]}${blocks.length ? ": " + blocks.map(describe).join(", ") : ". " + copy.empty}`);
      open.append(timeline(blocks, { day })); open.disabled = busy;
      const edit = action("", () => openEditor(day), "manager-event-edit");
      const pencil = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      pencil.setAttribute("viewBox", "0 0 24 24"); pencil.setAttribute("width", "18"); pencil.setAttribute("height", "18");
      pencil.setAttribute("fill", "none"); pencil.setAttribute("stroke", "currentColor"); pencil.setAttribute("stroke-width", "1.7"); pencil.setAttribute("aria-hidden", "true");
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); path.setAttribute("d", "m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15z"); pencil.append(path); edit.append(pencil);
      edit.dataset.eventFocus = `day-edit-${day}`;
      edit.setAttribute("aria-label", `${copy.edit} ${copy.days[day]}`); edit.disabled = busy;
      row.append(dayLabel, open, edit); chart.append(row);
    });
    card.append(chart); section.append(card);
    const controls = el("div", undefined, "manager-event-global-actions");
    controls.append(el("h4", lang === "he" ? "הגדרות לכל האירועים" : "All-event settings"));
    if (typeof table.swapContacts === "boolean") {
      const options = el("label", undefined, "manager-event-options");
      const text = el("span"); text.append(el("strong", copy.swap), el("small", copy.swapHelp));
      const toggle = el("input"); toggle.type = "checkbox"; toggle.checked = table.swapContacts;
      toggle.dataset.eventFocus = "options";
      toggle.disabled = busy; toggle.addEventListener("change", () => void mutate("ADMIN_SET_EVENT_OPTIONS", { swapContacts: toggle.checked }));
      options.append(text, toggle); controls.append(options);
    }
    const clear = action(copy.clear, async () => {
      if (!busy && await confirm(copy.clearConfirm) && alive()) await mutate("ADMIN_CLEAR_EVENTS", {});
    }, "is-danger");
    clear.disabled = busy || table.items.length === 0;
    clear.dataset.eventFocus = "clear";
    const danger = el("div", undefined, "manager-event-clear-row");
    danger.append(el("p", lang === "he" ? "מחיקה מסירה את כל האירועים השמורים. נבקש אישור לפני ביצוע." : "Remove every saved event. Confirmation is required before deletion.", "manager-event-help"), clear);
    controls.append(danger); section.append(controls); renderNotice(section);
    if (focus) section.querySelector(`[data-event-focus='${focus}']`)?.focus();
  }

  function initialFor(mode) { return editor.initial.filter((block) => (block.date || 0) === mode); }
  function draftFor(mode) { return editor.drafts.get(mode) ?? initialFor(mode); }
  function setDraft(next) { editor.drafts.set(editor.mode, next); }
  function edits() {
    return [...editor.drafts.entries()].filter(([mode, blocks]) => !blocksEqual(blocks, initialFor(mode)))
      .map(([mode, blocks]) => ({ ...(mode ? { date: mode } : {}), blocks }));
  }
  function candidateRows(override) {
    const changes = edits();
    if (override) {
      const entry = { ...(editor.mode ? { date: editor.mode } : {}), blocks: override };
      const index = changes.findIndex((change) => (change.date || 0) === editor.mode);
      if (index >= 0) changes[index] = entry; else changes.push(entry);
    }
    return applyDayEdit(rows(), editor.day, changes, [...editor.copyDays]);
  }
  function dirty() { return edits().length > 0; }
  function lockedBlocks() {
    if (editor.mode) return draftFor(0);
    const keys = new Set([...editor.initial.map((block) => block.date).filter(Boolean), ...editor.drafts.keys()]);
    return [...keys].filter(Boolean).flatMap(draftFor);
  }
  function closeEditor() {
    if (editor) pendingFocus = returnFocus?.dataset.eventFocus;
    editor = undefined;
    if (dialog) { dialog.close(); dialog.remove(); dialog = undefined; }
    if (returnFocus?.isConnected) returnFocus.focus();
  }
  async function cancelEditor() {
    if (busy || !editor) return;
    if (!dirty() || await confirm(copy.discard)) { closeEditor(); renderWeek(); }
  }
  function openEditor(day) {
    if (busy || !alive()) return;
    notice = ""; returnFocus = document.activeElement;
    editor = { day, mode: 0, initial: decodeEventWeek(rows())[day], drafts: new Map(), selected: undefined, color: undefined, copyDays: new Set() };
    dialog = el("dialog", undefined, "manager-events-dialog");
    dialog.dir = section.dir; dialog.setAttribute("aria-labelledby", "manager-event-editor-title");
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); void cancelEditor(); });
    document.body.append(dialog); renderEditor(); dialog.showModal();
    dialog.querySelector("[data-event-mode='0']")?.focus();
  }
  function updateSave() {
    if (!dialog || !editor) return;
    const check = replaceAll(candidateRows(), table.today, limit);
    const save = dialog.querySelector("[data-event-save]");
    if (save) save.disabled = busy || !dirty() || check.result === "Full";
    const count = dialog.querySelector("[data-event-count]");
    if (count) count.textContent = countLabel(candidateRows().length);
  }
  function renderSelected() {
    const panel = dialog?.querySelector("[data-event-selected]");
    if (!panel || !editor) return;
    panel.replaceChildren();
    const blocks = draftFor(editor.mode), block = blocks[editor.selected];
    if (!block) { panel.append(el("p", copy.choose, "manager-event-help")); return; }
    panel.className = `manager-event-selected is-${block.action.toLowerCase()}`;
    const head = el("div", undefined, "manager-event-header");
    head.append(el("strong", `${block.action === "OPEN" ? copy.open : copy.close} · ${formatDuration(block.end - block.start, lang)}`));
    const remove = action("", () => { setDraft(blocks.filter((_, index) => index !== editor.selected)); editor.selected = undefined; renderEditor(); }, "is-danger manager-event-trash");
    const trash = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    trash.setAttribute("viewBox", "0 0 24 24"); trash.setAttribute("width", "19"); trash.setAttribute("height", "19");
    trash.setAttribute("aria-hidden", "true"); trash.setAttribute("fill", "none"); trash.setAttribute("stroke", "currentColor");
    trash.setAttribute("stroke-width", "1.8"); trash.setAttribute("stroke-linecap", "round"); trash.setAttribute("stroke-linejoin", "round");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"); trash.append(path); remove.append(trash);
    remove.setAttribute("aria-label", copy.remove); remove.disabled = busy; head.append(remove); panel.append(head);
    for (const edge of ["start", "end"]) {
      const label = edge === "start" ? copy.start : copy.end;
      const line = el("div", undefined, "manager-event-stepper"); line.append(el("span", label));
      const group = el("div", undefined, "manager-event-stepper-controls"); group.dir = "ltr";
      for (const delta of [-EVENT_MINUTE_STEP, EVENT_MINUTE_STEP]) {
        if (delta > 0) {
          const time = el("output", formatMinutes(block[edge])); time.setAttribute("aria-label", label); group.append(time);
        }
        const next = setBlockTimes(blocks, editor.selected, edge === "start" ? block.start + delta : block.start, edge === "end" ? block.end + delta : block.end, lockedBlocks());
        const step = action(delta < 0 ? "−" : "+", () => {
          if (next === "overlap") { feedback(copy.overlap); return; }
          if (next !== "invalid") { setDraft(next); notice = ""; renderEditor(); }
        });
        step.dataset.eventFocus = `${edge}-${delta}`;
        step.setAttribute("aria-label", `${label}: ${delta < 0 ? copy.earlier : copy.later}`);
        step.disabled = busy || next === "invalid"; group.append(step);
      }
      line.append(group); panel.append(line);
    }
  }
  function renderEditor() {
    if (!editor || !dialog || !alive()) return;
    const focus = dialog.contains(document.activeElement) ? document.activeElement?.dataset.eventFocus : undefined;
    dialog.replaceChildren(); dialog.setAttribute("aria-busy", String(busy));
    const body = el("div", undefined, "manager-event-editor");
    const head = el("div", undefined, "manager-event-header");
    const title = el("h3", `${copy.edit} ${copy.days[editor.day]}`); title.id = "manager-event-editor-title";
    const count = el("span", "", "manager-event-count"); count.dataset.eventCount = "true";
    head.append(title, count); body.append(head, el("p", copy.editHelp, "manager-event-help"));
    const modes = el("div", undefined, "manager-event-modes"); modes.setAttribute("role", "group"); modes.setAttribute("aria-label", `${copy.weekly} / ${copy.once}`);
    for (const mode of [0, ...upcomingDates(editor.day, table.today)]) {
      const label = mode ? `${copy.once} ${formatEpochDay(mode)}` : copy.weekly;
      const chip = action(label, () => { editor.mode = mode; editor.selected = undefined; notice = ""; renderEditor(); });
      chip.dataset.eventFocus = `mode-${mode}`;
      chip.dataset.eventMode = String(mode); chip.setAttribute("aria-pressed", String(editor.mode === mode));
      chip.disabled = busy; modes.append(chip);
    }
    body.append(modes);
    if (!table.today) body.append(el("p", copy.clock, "manager-event-help"));
    const palette = el("div", undefined, "manager-event-palette");
    for (const type of ["OPEN", "CLOSE"]) {
      const pick = action(type === "OPEN" ? copy.open : copy.close, () => {
        editor.color = editor.color === type ? undefined : type;
        const blocks = draftFor(editor.mode);
        if (editor.selected !== undefined && blocks[editor.selected]) {
          setDraft(blocks.map((block, index) => index === editor.selected ? { ...block, action: type } : block));
        }
        renderEditor();
      }, `is-${type.toLowerCase()}`);
      pick.dataset.eventPalette = type; pick.setAttribute("aria-pressed", String(editor.color === type)); pick.disabled = busy; palette.append(pick);
      pick.dataset.eventFocus = `palette-${type}`;
    }
    body.append(palette);
    body.append(timeline(draftFor(editor.mode), { editable: true, locked: lockedBlocks(), selected: editor.selected, day: editor.day }), axis([0, 3, 6, 9, 12, 15, 18, 21, 24]));
    const selected = el("div", undefined, "manager-event-selected"); selected.dataset.eventSelected = "true"; body.append(selected);
    if (!editor.mode) {
      const copyCard = el("fieldset", undefined, "manager-event-copy"); copyCard.append(el("legend", copy.copy), el("p", copy.copyHelp, "manager-event-help"));
      const changed = addedBlocks(initialFor(0), draftFor(0)).length > 0;
      const choices = el("div", undefined, "manager-event-copy-days");
      copy.days.forEach((name, day) => {
        if (day === editor.day) return;
        const label = el("label"), input = el("input"); input.type = "checkbox"; input.value = String(day);
        input.dataset.eventCopyDay = String(day); input.checked = editor.copyDays.has(day); input.disabled = busy || !changed;
        input.dataset.eventFocus = `copy-${day}`;
        input.addEventListener("change", () => { if (input.checked) editor.copyDays.add(day); else editor.copyDays.delete(day); renderEditor(); });
        label.append(input, el("span", name)); choices.append(label);
      });
      copyCard.append(choices);
      if (!changed) copyCard.append(el("p", copy.copyEmpty, "manager-event-help"));
      body.append(copyCard);
    }
    renderNotice(body);
    const footer = el("div", undefined, "manager-event-footer");
    const save = action(busy ? copy.saving : copy.save, async () => {
      const check = replaceAll(candidateRows(), table.today, limit);
      if (check.result !== "Ok") { feedback(check.result === "Overlap" ? copy.overlap : check.result === "Full" ? copy.full : check.result === "DateOutOfRange" ? copy.dates : copy.invalid); return; }
      await mutate("ADMIN_SET_EVENTS", { today: table.today, items: toWireRows(check.table, table.today) });
    }, "is-primary");
    save.dataset.eventSave = "true";
    save.dataset.eventFocus = "save";
    const cancel = action(copy.cancel, cancelEditor); cancel.disabled = busy;
    cancel.dataset.eventFocus = "cancel";
    footer.append(save, cancel); body.append(footer); dialog.append(body);
    renderSelected(); updateSave();
    if (focus) dialog.querySelector(`[data-event-focus='${focus}']`)?.focus();
  }
  async function refresh() {
    if (busy || !alive()) return;
    busy = true; notice = copy.loading; noticeDanger = false;
    renderWeek();
    try { await readTable(); notice = ""; } catch (error) { notice = explanation(error); noticeDanger = true; }
    finally { busy = false; if (alive()) renderWeek(); }
  }
  renderWeek();
  timer = setInterval(() => { if (alive() && !editor && !busy) renderWeek(); }, 60_000);
  return {
    refresh,
    dispose() { if (disposed) return; disposed = true; clearInterval(timer); closeEditor(); section.remove(); },
  };
}
