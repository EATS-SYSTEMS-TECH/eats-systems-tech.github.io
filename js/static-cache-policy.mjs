// Public static files (styles, scripts, fonts, images) are answered from the
// browser cache at once, so repeat visits load without waiting for the network.
// Documents, API, auth, analytics and video requests never enter this cache,
// and neither does anything the sign-in page or a private app page requests.
// Scripts and styles qualify only with a ?v= version and are reused for at
// most a day after they were last confirmed; a version that was not bumped
// therefore heals within one visit. Copies older than ten minutes (GitHub
// Pages' own max-age) are re-checked in the background with their ETag.
export const STATIC_CACHE_LIMITS = Object.freeze({
  entries: 400, itemBytes: 4_000_000, fileAgeMs: 30 * 24 * 60 * 60 * 1000, codeAgeMs: 24 * 60 * 60 * 1000, recheckMs: 10 * 60 * 1000, pruneEvery: 25,
});
const codePath = /^(?:css|js)\/[\w./-]+\.(?:css|js|mjs)$/;
const filePath = /^(?:(?:assets|css|fonts)\/[\w./%-]+|[\w-]+)\.(?:woff2?|ttf|otf|webp|avif|png|jpe?g|gif|svg|ico)$/;
const excluded = /^(?:api|__|dashboard|manager|pay|reservations|work)\//;
// Sign-in and the private apps, in any locale folder (/login/, /he/login/).
const privatePages = /^(?:[a-z]{2,3}(?:-[a-z]+)?\/)?(?:login|dashboard|manager|pay|reservations|work)(?:\/|$)/;
const codeTypes = /^(?:text\/css|text\/javascript|application\/javascript|application\/x-javascript)$/;
const fileTypes = /^(?:font\/|image\/|application\/font|application\/x-font|application\/vnd\.ms-fontobject)/;

function relativePath(url, base) {
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
  try { return decodeURIComponent(url.pathname.slice(base.pathname.length)); } catch { return null; }
}

// True for a page whose files must always come from the network.
export function isPrivatePage(pageUrl, baseUrl) {
  try {
    const relative = relativePath(new URL(pageUrl), new URL(baseUrl));
    return relative !== null && privatePages.test(relative);
  } catch { return false; }
}

export function eligibleStatic(request, baseUrl) {
  if (request.method !== "GET" || request.headers.has("authorization") || request.headers.has("range")) return null;
  const base = new URL(baseUrl), url = new URL(request.url);
  if (url.username || url.password) return null;
  const relative = relativePath(url, base);
  if (relative === null || relative.includes("..") || excluded.test(relative)) return null;
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
  let writes = Promise.resolve(), sincePrune = limits.pruneEvery;

  // Expired entries leave, then the oldest until the entry limit holds. This
  // walks the whole cache, so it runs only every few writes.
  async function prune(cache) {
    const records = [];
    for (const key of await cache.keys()) {
      const stored = Number((await cache.match(key))?.headers.get("x-wifigate-stored-at"));
      if (!stored || now() - stored > limits.fileAgeMs) await cache.delete(key);
      else records.push({ key, stored });
    }
    records.sort((a, b) => a.stored - b.stored);
    while (records.length > limits.entries) await cache.delete(records.shift().key);
  }

  // Only a complete, same-origin 200 of the expected type is stored, in the
  // background: no response waits for a write.
  function store(url, kind, response) {
    const type = (response.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const length = Number(response.headers.get("content-length"));
    if (response.status !== 200 || response.type !== "basic" || response.redirected) return Promise.resolve();
    if (!(kind === "code" ? codeTypes : fileTypes).test(type) || length > limits.itemBytes) return Promise.resolve();
    if (/no-store|private/i.test(response.headers.get("cache-control") || "") || (response.headers.get("vary") || "").includes("*")) return Promise.resolve();
    const copy = response.clone();
    const action = writes.catch(() => {}).then(async () => {
      const bytes = await copy.arrayBuffer();
      if (bytes.byteLength > limits.itemBytes) return;
      const headers = new Headers();
      for (const name of ["content-type", "etag", "last-modified"]) if (copy.headers.has(name)) headers.set(name, copy.headers.get(name));
      headers.set("content-length", String(bytes.byteLength));
      headers.set("x-wifigate-stored-at", String(now()));
      const cache = await cacheStorage.open(cacheName);
      await cache.put(url, new Response(bytes, { status: 200, headers }));
      if (++sincePrune >= limits.pruneEvery) { sincePrune = 0; await prune(cache); }
    });
    writes = action;
    return action.catch(() => { /* Quota or disabled storage only loses the speed-up. */ });
  }

  // One network request per file at a time, without cookies. With a stored
  // ETag the request is conditional; an unchanged file costs no write.
  function refresh(url, kind, etag) {
    // A conditional re-check never answers a page that needs the full file.
    const slot = (etag ? "if-none-match " : "") + url;
    let current = refreshing.get(slot);
    if (!current) {
      const headers = etag ? { "if-none-match": etag } : {};
      current = fetcher(new Request(url, { credentials: "omit", mode: "same-origin", redirect: "error", headers }))
        .then((response) => ({ response, saving: response.status === 304 ? Promise.resolve() : store(url, kind, response) }))
        .finally(() => refreshing.delete(slot));
      refreshing.set(slot, current);
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
        try { await (await refresh(file.url, file.kind)).saving; } catch { /* Next visit tries again. */ }
      }
    },
    // waitUntil keeps the worker alive for background writes and re-checks.
    async respond(request, waitUntil = () => {}) {
      const file = eligibleStatic(request, baseUrl);
      if (!file) return fetcher(request);
      try {
        const cache = await cacheStorage.open(cacheName);
        const cached = await cache.match(file.url);
        const age = now() - Number(cached?.headers.get("x-wifigate-stored-at"));
        if (cached && age >= 0 && age <= (file.kind === "code" ? limits.codeAgeMs : limits.fileAgeMs)) {
          if (age > limits.recheckMs) waitUntil(refresh(file.url, file.kind, cached.headers.get("etag")).then(({ saving }) => saving).catch(() => {}));
          const headers = new Headers(cached.headers);
          headers.delete("x-wifigate-stored-at");
          headers.set("x-wifigate-static-cache", "hit");
          return new Response(cached.body, { status: 200, headers });
        }
        const { response, saving } = await refresh(file.url, file.kind);
        waitUntil(saving);
        return response.clone();
      } catch {
        return fetcher(request);
      }
    },
  };
}
