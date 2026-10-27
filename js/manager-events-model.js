// Browser port of the mobile eventsModel.ts; protocol and geometry stay identical.
export const EVENT_DAYS = 7;
export const MINUTES_PER_DAY = 1440;
// Drag and typed times move in this step; the gate refuses anything else.
export const EVENT_MINUTE_STEP = 10;
// The gate's table size when capabilities do not say (limits.maxEvents).
export const DEFAULT_MAX_EVENTS = 50;
// A new block's length when the gap it lands in allows it.
export const NEW_BLOCK_MINUTES = 360;
// A one-time event is at most this many days ahead of the gate's today.
export const ONE_TIME_MAX_DAYS_AHEAD = 90;
const MS_PER_DAY = 86_400_000;
const ACTION_CODE = { OPEN: 0, CLOSE: 1 };
// ---------------------------------------------------------------------------
// The table (same rules as WG_EventSystemSettings)
export function isItemValid([action, start, end]) {
    return (action === 0 || action === 1) &&
        Number.isInteger(start) && Number.isInteger(end) &&
        start >= 0 && start < end && end <= MINUTES_PER_DAY &&
        start % EVENT_MINUTE_STEP === 0 && end % EVENT_MINUTE_STEP === 0;
}
const rowDate = (row) => row.length === 5 ? row[4] : 0;
/** 1970-01-01 was a Thursday: the weekday (0 = Sunday) of an epoch day. */
export function weekdayOfEpochDay(epochDay) {
    return (epochDay + 4) % EVENT_DAYS;
}
function rowLess(a, b) {
    return a[0] !== b[0] ? a[0] - b[0] : a[2] !== b[2] ? a[2] - b[2] : rowDate(a) - rowDate(b);
}
// Both run on some same day and their times overlap, whatever the action.
function rowsConflict(a, b) {
    if (a[0] !== b[0])
        return false;
    if (rowDate(a) && rowDate(b) && rowDate(a) !== rowDate(b))
        return false;
    return a[2] < b[3] && b[2] < a[3];
}
/**
 * ADMIN_SET_EVENTS on the gate, exactly (EventReplaceAll): the table it keeps
 * for these rows, sorted, or why it refuses them - row by row in the order
 * given. A one-time event dated before today is over and left out; today 0
 * (the gate clock is not set) refuses one-time events. On Overlap, the first
 * two rows that overlap.
 */
export function replaceAll(items, today, maxEvents = DEFAULT_MAX_EVENTS) {
    const kept = [];
    for (const row of items) {
        const [day, action, start, end] = row;
        const date = rowDate(row);
        if (!Number.isInteger(day) || day < 0 || day >= EVENT_DAYS || !isItemValid([action, start, end]) ||
            (date && weekdayOfEpochDay(date) !== day))
            return { result: "Invalid" };
        if (date) {
            if (!today || date > today + ONE_TIME_MAX_DAYS_AHEAD)
                return { result: "DateOutOfRange" };
            if (date < today)
                continue;
        }
        if (kept.length >= maxEvents)
            return { result: "Full" };
        kept.push(row);
    }
    const table = kept.sort(rowLess);
    for (let index = 0; index < table.length; index++) {
        const other = table.slice(index + 1).find((candidate) => rowsConflict(table[index], candidate));
        if (other)
            return { result: "Overlap", overlap: [table[index], other] };
    }
    return { result: "Ok", table };
}
/** ADMIN_SET_EVENTS rows: a one-time row carries its days from today. */
export function toWireRows(table, today) {
    return table.map((row) => row.length === 5
        ? [row[0], row[1], row[2], row[3], row[4] - today]
        : [row[0], row[1], row[2], row[3]]);
}
const sameBlock = (a, b) => a.action === b.action && a.start === b.start && a.end === b.end;
/** The blocks of after that before did not have: added, or changed in any way. */
export function addedBlocks(before, after) {
    return after.filter((block) => !before.some((old) => sameBlock(old, block)));
}
/** Of added, those a day does not already hold (an identical event is not copied twice). */
export function blocksToCopy(dayWeekly, added) {
    return added.filter((block) => !dayWeekly.some((existing) => sameBlock(existing, block)));
}
/**
 * The table after one day's edit, before the gate's rules are checked
 * (replaceAll): the day's weekly events and each edited date's one-time
 * events are what the editor holds; every day in copyDays also gets the
 * weekly events added or changed on the edited day, and keeps its own.
 */
export function applyDayEdit(table, day, edits, copyDays) {
    const week = decodeEventWeek(table);
    const weeklyOf = (target) => week[target].filter((block) => !block.date);
    const weeklyEdit = edits.find((edit) => !edit.date);
    const added = weeklyEdit ? addedBlocks(weeklyOf(day), weeklyEdit.blocks) : [];
    const replaced = new Set(edits.map((edit) => `${day}:${edit.date ?? 0}`));
    const rowOf = (target, block, date) => date ? [target, ACTION_CODE[block.action], block.start, block.end, date] : [target, ACTION_CODE[block.action], block.start, block.end];
    return [
        ...table.filter((row) => !replaced.has(`${row[0]}:${rowDate(row)}`)),
        ...edits.flatMap((edit) => edit.blocks.map((block) => rowOf(day, block, edit.date))),
        ...copyDays.filter((target) => target !== day)
            .flatMap((target) => blocksToCopy(weeklyOf(target), added).map((block) => rowOf(target, block))),
    ];
}
/** What the gate holds at a day and minute: NO / NC and the table index, or none. */
export function activeAt(table, swapContacts, day, minute, today = 0) {
    // The slot is the place in the listed table: past one-time rows are not counted.
    const listed = table.filter((row) => !rowDate(row) || rowDate(row) >= today);
    const slot = listed.findIndex((row) => row[0] === day && row[2] <= minute && minute < row[3] && (!rowDate(row) || rowDate(row) === today));
    if (slot < 0)
        return undefined;
    const openContact = (listed[slot][1] === 0) !== swapContacts;
    return { mode: openContact ? "NO" : "NC", slot };
}
/** The list response: a one-time row ends with its days from "today". */
export function absoluteRows(items, today) {
    return items.map((row) => row.length === 5 ? [row[0], row[1], row[2], row[3], today + row[4]] : [...row]);
}
/** Every event per day, weekly and one-time (with its date). */
export function decodeEventWeek(table) {
    const week = Array.from({ length: EVENT_DAYS }, () => []);
    for (const row of table) {
        const [day, action, start, end] = row;
        if (day >= 0 && day < EVENT_DAYS)
            week[day].push({ action: action === 1 ? "CLOSE" : "OPEN", start, end, ...(rowDate(row) ? { date: rowDate(row) } : {}) });
    }
    return week.map(sortBlocks);
}
export function countEvents(week) {
    return week.reduce((total, blocks) => total + blocks.length, 0);
}
/** The dates of one weekday from today to ONE_TIME_MAX_DAYS_AHEAD days on. */
export function upcomingDates(day, today) {
    if (!today)
        return [];
    const first = today + ((day - weekdayOfEpochDay(today) + EVENT_DAYS) % EVENT_DAYS);
    const dates = [];
    for (let date = first; date <= today + ONE_TIME_MAX_DAYS_AHEAD; date += EVENT_DAYS)
        dates.push(date);
    return dates;
}
// ---------------------------------------------------------------------------
// The day editor: the blocks being edited, and the locked blocks of the same
// day they may not overlap (weekly ones while editing a date, one-time ones
// while editing the week).
export function sortBlocks(blocks) {
    return [...blocks].sort((a, b) => a.start - b.start);
}
export function snapMinutes(minutes) {
    const snapped = Math.round(minutes / EVENT_MINUTE_STEP) * EVENT_MINUTE_STEP;
    return Math.min(MINUTES_PER_DAY, Math.max(0, snapped));
}
function others(blocks, index, locked) {
    return [...blocks.filter((_block, position) => position !== index), ...locked];
}
/** The free room around blocks[index]: from the nearest end before it to the nearest start after it. */
export function freeRange(blocks, index, locked = []) {
    const block = blocks[index];
    const rest = others(blocks, index, locked);
    return {
        min: rest.filter((other) => other.end <= block.start).reduce((edge, other) => Math.max(edge, other.end), 0),
        max: rest.filter((other) => other.start >= block.end).reduce((edge, other) => Math.min(edge, other.start), MINUTES_PER_DAY),
    };
}
/** True when [start, end) of blocks[index] would cover another or a locked block. */
export function wouldOverlap(blocks, index, start, end, locked = []) {
    return others(blocks, index, locked).some((other) => start < other.end && other.start < end);
}
function withBlock(blocks, index, block) {
    return blocks.map((current, position) => (position === index ? block : current));
}
/**
 * A new block where the finger landed: NEW_BLOCK_MINUTES long when the gap
 * allows, centred on the touch and kept inside the gap. Otherwise why not:
 * the touch is on a block, on a locked block, or the gap is under one step.
 */
export function insertBlock(blocks, action, atMinute, locked = [], date) {
    const sorted = sortBlocks(blocks);
    if (sorted.some((block) => block.start <= atMinute && atMinute < block.end))
        return "onBlock";
    if (locked.some((block) => block.start <= atMinute && atMinute < block.end))
        return "onLocked";
    const all = [...sorted, ...locked];
    const gapStart = all.filter((block) => block.end <= atMinute).reduce((edge, block) => Math.max(edge, block.end), 0);
    const gapEnd = all.filter((block) => block.start > atMinute).reduce((edge, block) => Math.min(edge, block.start), MINUTES_PER_DAY);
    const length = Math.min(NEW_BLOCK_MINUTES, gapEnd - gapStart);
    if (length < EVENT_MINUTE_STEP)
        return "noRoom";
    const start = Math.min(gapEnd - length, Math.max(gapStart, snapMinutes(atMinute - length / 2)));
    const block = { action, start, end: start + length, ...(date ? { date } : {}) };
    const next = sortBlocks([...sorted, block]);
    return { blocks: next, index: next.indexOf(block) };
}
/** Stretches one edge to a minute, snapped, kept off the others and at least one step long. */
export function resizeBlock(blocks, index, edge, minutes, locked = []) {
    const block = blocks[index];
    const { min, max } = freeRange(blocks, index, locked);
    const snapped = snapMinutes(minutes);
    if (edge === "start")
        return withBlock(blocks, index, { ...block, start: Math.min(block.end - EVENT_MINUTE_STEP, Math.max(min, snapped)) });
    return withBlock(blocks, index, { ...block, end: Math.max(block.start + EVENT_MINUTE_STEP, Math.min(max, snapped)) });
}
/** Moves a block to start at a minute, keeping its length, inside its free room. */
export function moveBlock(blocks, index, startMinutes, locked = []) {
    const block = blocks[index];
    const length = block.end - block.start;
    const { min, max } = freeRange(blocks, index, locked);
    const start = Math.min(max - length, Math.max(min, snapMinutes(startMinutes)));
    return withBlock(blocks, index, { ...block, start, end: start + length });
}
/** Typed times for one block: the blocks, or why not ("invalid": off the grid / empty / past the day). */
export function setBlockTimes(blocks, index, start, end, locked = []) {
    if (!isItemValid([0, start, end]))
        return "invalid";
    if (wouldOverlap(blocks, index, start, end, locked))
        return "overlap";
    return withBlock(blocks, index, { ...blocks[index], start, end });
}
export function setBlockAction(blocks, index, action) {
    return withBlock(blocks, index, { ...blocks[index], action });
}
export function removeBlock(blocks, index) {
    return blocks.filter((_block, position) => position !== index);
}
export function blocksEqual(a, b) {
    return a.length === b.length && a.every((block, index) => block.action === b[index].action && block.start === b[index].start && block.end === b[index].end);
}
// ---------------------------------------------------------------------------
// Time
/** "HH:MM"; the end of the day reads "24:00". */
export function formatMinutes(minutes) {
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
export function formatDuration(minutes, language) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (language === "he")
        return [hours ? `${hours} ש׳` : "", rest ? `${rest} ד׳` : ""].filter(Boolean).join(" ");
    return [hours ? `${hours}h` : "", rest ? `${rest}m` : ""].filter(Boolean).join(" ");
}
/** "8.10" for an epoch day. */
export function formatEpochDay(epochDay) {
    const date = new Date(epochDay * MS_PER_DAY);
    return `${date.getUTCDate()}.${date.getUTCMonth() + 1}`;
}
/** The gate's local day (0 = Sunday) and minute, from UTC now and the gate offset. */
export function gateLocalDayMinute(nowMs, tzMinutes) {
    const local = new Date(nowMs + tzMinutes * 60_000);
    return { day: local.getUTCDay(), minute: local.getUTCHours() * 60 + local.getUTCMinutes() };
}
