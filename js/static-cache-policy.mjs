// Public static files (styles, scripts, fonts, images) are answered from the
// browser cache at once and refreshed in the background, so repeat visits load
// without waiting for the network. Documents, app data, API, auth, analytics
// and video requests never enter this cache. Scripts and styles qualify only
// with a ?v= version, so one page load never mixes old and new code; a
// version that was not bumped still self-heals on the next visit.
export const STATIC_CACHE_LIMITS = Object.freeze({ entries: 400, itemBytes: 4_000_000, ageMs: 30 * 24 * 60 * 60 * 1000 });
const codePath = /^(?:css|js)\/[\w./-]+\.(?:css|js|mjs)$/;
const filePath = /^(?:(?:assets|css|fonts)\/[\w./%-]+|[\w-]+)\.(?:woff2?|ttf|otf|webp|avif|png|jpe?g|gif|svg|ico)$/;
const excluded = /^(?:api|__|dashboard|manager|pay|reservations|work)\//;
const codeTypes = /^(?:text\/css|text\/javascript|application\/javascript|application\/x-javascript)$/;
const fileTypes = /^(?:font\/|image\/|application\/font|application\/x-font|application\/vnd\.ms-fontobject)/;

export function eligibleStatic(request, baseUrl) {
  if (request.method !== "GET" || request.headers.has("authorization") || request.headers.has("range")) return null;
  const base = new URL(baseUrl), url = new URL(request.url);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.username || url.password) return null;
  let relative;
  try { relative = decodeURIComponent(url.pathname.slice(base.pathname.length)); } catch { return null; }
  if (relative.includes("..") || excluded.test(relative)) return null;
  const keys = [...url.searchParams.keys()];
  if (keys.some((key) => key !== "v") || keys.length > 1) return null;
  if (codePath.test(relative)) return url.searchParams.get("v") ? { url: url.href, kind: "code" } : null;
  if (filePath.test(relative)) return { url: url.href, kind: "file" };
  return null;
}

export function createStaticCache({ baseUrl, cacheStorage = globalThis.caches, fetcher = globalThis.fetch.bind(globalThis), now = Date.now, limits = STATIC_CACHE_LIMITS }) {
  const base = new URL(baseUrl);
  const cacheName = "wifigate-static-v1-" + encodeURIComponent(base.pathname);
  const refreshing = new Map();
  let writes = Promise.resolve();

  // Only a complete, same-origin 200 of the expected type is stored. Older
  // versions of the same path are replaced, and the oldest entries leave
  // first once the entry limit is reached.
  function store(url, kind, response) {
    const type = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const length = Number(response.headers.get("content-length"));
    if (response.status !== 200 || response.type !== "basic" || response.redirected) return;
    if (!(kind === "code" ? codeTypes : fileTypes).test(type) || length > limits.itemBytes) return;
    if (/no-store|private/i.test(response.headers.get("cache-control") || "") || (response.headers.get("vary") || "").includes("*")) return;
    const copy = response.clone();
    const action = writes.catch(() => {}).then(async () => {
      const bytes = await copy.arrayBuffer();
      if (bytes.byteLength > limits.itemBytes) return;
      const headers = new Headers();
      for (const name of ["content-type", "etag", "last-modified"]) if (copy.headers.has(name)) headers.set(name, copy.headers.get(name));
      headers.set("content-length", String(bytes.byteLength));
      headers.set("x-wifigate-stored-at", String(now()));
      const cache = await cacheStorage.open(cacheName);
      const path = new URL(url).pathname, records = [];
      for (const key of await cache.keys()) {
        if (key.url !== url && new URL(key.url).pathname === path) { await cache.delete(key); continue; }
        const stored = Number((await cache.match(key))?.headers.get("x-wifigate-stored-at"));
        if (!stored || now() - stored > limits.ageMs) await cache.delete(key);
        else if (key.url !== url) records.push({ key, stored });
      }
      records.sort((a, b) => a.stored - b.stored);
      while (records.length >= limits.entries) await cache.delete(records.shift().key);
      await cache.put(url, new Response(bytes, { status: 200, headers }));
    });
    writes = action;
    return action.catch(() => { /* Quota or disabled storage only loses the speed-up. */ });
  }

  // One anonymous network request per file at a time, without cookies.
  function refresh(url, kind) {
    let current = refreshing.get(url);
    if (!current) {
      current = fetcher(new Request(url, { credentials: "omit", mode: "same-origin", redirect: "error" }))
        .then(async (response) => { await store(url, kind, response); return response; })
        .finally(() => refreshing.delete(url));
      refreshing.set(url, current);
    }
    return current;
  }

  return {
    cacheName,
    eligible: (request) => eligibleStatic(request, baseUrl),
    // Stores files a page already loaded before the worker controlled it, so
    // the very next visit is fast. The browser's own cache usually answers.
    async warm(urls) {
      const cache = await cacheStorage.open(cacheName);
      const files = [...new Set(urls)].slice(0, 200).map((url) => { try { return eligibleStatic(new Request(url), baseUrl); } catch { return null; } }).filter(Boolean);
      for (const file of files) {
        if (await cache.match(file.url)) continue;
        await refresh(file.url, file.kind).catch(() => {});
      }
    },
    // waitUntil keeps the worker alive for the background refresh.
    async respond(request, waitUntil = () => {}) {
      const file = eligibleStatic(request, baseUrl);
      if (!file) return fetcher(request);
      try {
        const cache = await cacheStorage.open(cacheName);
        const cached = await cache.match(file.url);
        const stored = Number(cached?.headers.get("x-wifigate-stored-at"));
        if (cached && stored && now() - stored <= limits.ageMs) {
          // Answer now; bring the stored copy up to date for the next visit.
          waitUntil(refresh(file.url, file.kind).catch(() => {}));
          const headers = new Headers(cached.headers);
          headers.delete("x-wifigate-stored-at");
          headers.set("x-wifigate-static-cache", "hit");
          return new Response(cached.body, { status: 200, headers });
        }
        return (await refresh(file.url, file.kind)).clone();
      } catch {
        return fetcher(request);
      }
    },
  };
}
