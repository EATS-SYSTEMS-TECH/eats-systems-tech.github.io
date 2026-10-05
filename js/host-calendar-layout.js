// Allocate visual date spans without interpreting a stay's end as inclusive.
export function calendarSpans(records, start, days, dateAt, timezone) {
  const dayIndex = value => Math.round((Date.parse(`${value}T12:00:00Z`) - Date.parse(`${start}T12:00:00Z`)) / 86400000);
  const spans = records.map(record => ({record, start: Math.max(0, dayIndex(dateAt(record.startsAt, timezone))), end: Math.min(days, dayIndex(dateAt(new Date(Date.parse(record.endsAt) - 1), timezone)) + 1)})).filter(span => span.end > span.start).sort((a,b) => a.start-b.start || a.end-b.end || a.record.id.localeCompare(b.record.id));
  const lanes = [];
  for (const span of spans) {
    let lane = lanes.findIndex(end => end <= span.start);
    if (lane < 0) lane = lanes.length;
    lanes[lane] = span.end; span.lane = lane;
  }
  return {spans, lanes: Math.max(1, lanes.length)};
}
