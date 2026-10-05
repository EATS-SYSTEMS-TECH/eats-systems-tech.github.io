import { portalRequest } from "./api/index.js";
export async function readHostPages(user, path, isCurrent, field = "items") {
  const items = [], seen = new Set(), cursors = new Set();
  let cursor;
  for (let page = 0; page < 20; page++) {
    if (!isCurrent()) throw new Error("session-changed");
    const query = new URLSearchParams({ limit: "100", ...(cursor ? { cursor } : {}) });
    const result = await portalRequest(user, `${path}?${query}`);
    if (!isCurrent()) throw new Error("session-changed");
    if (!Array.isArray(result[field])) throw new Error("invalid-page");
    for (const item of result[field]) {
      if (!seen.has(item.id)) { seen.add(item.id); items.push(item); }
    }
    if (items.length > 1000) throw Object.assign(new Error("Capacity review required"), { code: "RESOURCE_CAPACITY_EXCEEDED" });
    cursor = result.nextCursor;
    if (!cursor) return { items, nextCursor: null };
    if (cursors.has(cursor)) throw new Error("repeated-cursor");
    cursors.add(cursor);
  }
  throw Object.assign(new Error("Capacity review required"), { code: "RESOURCE_CAPACITY_EXCEEDED" });
}
