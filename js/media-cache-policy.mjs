// Public, content-addressed scene media only. HTML, app/API/auth and analytics
// requests never enter this cache. Cache.put requires a complete200 response.
export const MEDIA_CACHE_LIMITS = Object.freeze({ bytes: 96_000_000, entries: 48, itemBytes: 12_000_000, ageMs: 30 * 24 * 60 * 60 * 1000 });
const sceneNames = '(?:residential-buildings|roller-shutters|hotels-airbnb|private-homes|electric-gates|entry-doors-magnetic-locks|garage-doors|office-buildings|sports-facilities|storage-lockers|electric-gates-barrier|homepage-montage|auto-open-futuristic)';
const videoPath = new RegExp(`^assets/vid/(?:use-cases|home)/(?:(?:mobile|desktop)/)?${sceneNames}-(?:720p|1080p)\\.mp4$`);
const posterPath = new RegExp(`^assets/(?:wifigate_niche_pages|img)/(?:(?:mobile|desktop)/)?${sceneNames}-scene(?:-hero)?\\.(?:webp|png)$`);

export function eligibleMedia(request, baseUrl) {
  if (request.method !== 'GET' || request.headers.has('authorization')) return null;
  const base = new URL(baseUrl), url = new URL(request.url);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || url.username || url.password) return null;
  const relative = url.pathname.slice(base.pathname.length), version = url.searchParams.get('v');
  if (!/^[a-f0-9]{12}(?:[a-f0-9]{52})?$/.test(version || '') || [...url.searchParams.keys()].length !== 1 || url.hash) return null;
  if (!videoPath.test(relative) && !posterPath.test(relative)) return null;
  return { url: url.href, version, kind: relative.endsWith('.mp4') ? 'video/mp4' : relative.endsWith('.png') ? 'image/png' : 'image/webp' };
}

// Unsupported/malformed/multipart ranges are ignored (full200); valid single
// byte ranges are206, and valid unsatisfiable byte ranges are416.
export function parseMediaRange(value, size) {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if (!match || (!match[1] && !match[2])) return null;
  const first = match[1] ? BigInt(match[1]) : null, last = match[2] ? BigInt(match[2]) : null, length = BigInt(size);
  if (size === 0 || (first === null && last === 0n) || (first !== null && (first >= length || (last !== null && last < first)))) return { unsatisfiable: true };
  return { start: first === null ? Number(last >= length ? 0n : length - last) : Number(first), end: first === null || last === null || last >= length ? size - 1 : Number(last) };
}

function ifRangeMatches(value, headers) {
  if (!value) return true;
  if (value.startsWith('"')) return value === headers.get('etag');
  if (value.startsWith('W/')) return false;
  const requested = Date.parse(value), modified = Date.parse(headers.get('last-modified') || '');
  return Number.isFinite(requested) && Number.isFinite(modified) && modified <= requested;
}

export function mediaResponse(bytes, originalHeaders, request) {
  const headers = new Headers(originalHeaders);
  headers.set('accept-ranges', 'bytes'); headers.set('content-length', String(bytes.byteLength));
  headers.delete('content-range'); headers.delete('content-encoding');
  headers.delete('x-wifigate-stored-at'); headers.delete('x-wifigate-version');
  const range = ifRangeMatches(request.headers.get('if-range'), headers) ? parseMediaRange(request.headers.get('range'), bytes.byteLength) : null;
  if (!range) return new Response(bytes, { status: 200, headers });
  if (range.unsatisfiable) {
    headers.set('content-range', `bytes */${bytes.byteLength}`); headers.set('content-length', '0');
    return new Response(null, { status: 416, headers });
  }
  const part = bytes.slice(range.start, range.end + 1);
  headers.set('content-range', `bytes ${range.start}-${range.end}/${bytes.byteLength}`); headers.set('content-length', String(part.byteLength));
  return new Response(part, { status: 206, headers });
}

export function createMediaCache({ baseUrl, cacheStorage = globalThis.caches, fetcher = globalThis.fetch.bind(globalThis), crypto = globalThis.crypto, now = Date.now, limits = MEDIA_CACHE_LIMITS }) {
  const base = new URL(baseUrl);
  const cacheName = 'wifigate-public-media-v1-' + encodeURIComponent(base.pathname);
  const pending = new Map(); let writes = Promise.resolve();
  const digest = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
  async function store(url, bytes, headers) {
    if (bytes.byteLength > limits.bytes || limits.entries < 1) return;
    const action = writes.catch(() => {}).then(async () => {
      const cache = await cacheStorage.open(cacheName), keys = await cache.keys(), records = [];
      for (const key of keys) {
        const response = await cache.match(key), stored = Number(response?.headers.get('x-wifigate-stored-at')), length = Number(response?.headers.get('content-length'));
        if (!response || !stored || !length || now() - stored > limits.ageMs || (new URL(key.url).pathname === new URL(url).pathname && key.url !== url)) await cache.delete(key);
        else records.push({ key, stored, length });
      }
      records.sort((a, b) => a.stored - b.stored);
      let size = records.reduce((total, item) => total + item.length, 0), count = records.length;
      for (const item of records) {
        if (size + bytes.byteLength <= limits.bytes && count + 1 <= limits.entries) break;
        await cache.delete(item.key); size -= item.length; count--;
      }
      const storedHeaders = new Headers(headers); storedHeaders.set('x-wifigate-stored-at', String(now())); storedHeaders.set('x-wifigate-version', new URL(url).searchParams.get('v'));
      await cache.put(url, new Response(bytes, { status: 200, headers: storedHeaders }));
    });
    writes = action;
    try { await action; } catch { /* Quota/disabled storage must not break playback. */ }
  }
  async function full(artifact) {
    const cache = await cacheStorage.open(cacheName);
    const cached = await cache.match(artifact.url);
    if (cached) {
      const stored = Number(cached.headers.get('x-wifigate-stored-at'));
      if (cached.status === 200 && stored && now() - stored <= limits.ageMs) {
        const bytes = new Uint8Array(await cached.arrayBuffer());
        if (bytes.byteLength <= limits.itemBytes && (await digest(bytes)).startsWith(artifact.version)) return { bytes, headers: cached.headers, cached: true };
      }
      await cache.delete(artifact.url);
    }
    // Drop Range/conditional/cookie/auth headers: one full anonymous fetch of
    // only the selected artifact supplies cacheable bytes and all later ranges.
    const response = await fetcher(new Request(artifact.url, { credentials: 'omit', mode: 'same-origin', cache: 'no-cache', redirect: 'error', signal: AbortSignal.timeout(45000) }));
    if (response.status !== 200 || response.type === 'opaque') return { passthrough: response };
    const declared = Number(response.headers.get('content-length'));
    if (declared > limits.itemBytes || response.headers.get('content-type')?.split(';')[0].trim() !== artifact.kind) return { passthrough: response };
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > limits.itemBytes) return { bytes, headers: response.headers };
    if (!(await digest(bytes)).startsWith(artifact.version)) return { passthrough: new Response('Media version mismatch', { status: 502 }) };
    const headers = new Headers();
    for (const name of ['content-type', 'etag', 'last-modified', 'cache-control']) if (response.headers.has(name)) headers.set(name, response.headers.get(name));
    headers.set('content-length', String(bytes.byteLength)); headers.set('accept-ranges', 'bytes');
    const variesOnEverything = (response.headers.get('vary') || '').split(',').some(token => token.trim() === '*');
    if (!/private|no-store/i.test(headers.get('cache-control') || '') && !variesOnEverything) await store(artifact.url, bytes, headers);
    return { bytes, headers };
  }
  return {
    cacheName,
    eligible: request => eligibleMedia(request, baseUrl),
    async respond(request) {
      const artifact = eligibleMedia(request, baseUrl);
      if (!artifact) return fetcher(request);
      try {
        let current = pending.get(artifact.url);
        if (!current) {
          current = full(artifact).finally(() => pending.delete(artifact.url));
          pending.set(artifact.url, current);
        }
        const result = await current;
        if (result.passthrough) {
          if (result.passthrough.status === 206) return fetcher(request);
          return result.passthrough.clone();
        }
        const headers = new Headers(result.headers);
        headers.set('x-wifigate-media-cache', result.cached ? 'hit' : 'miss');
        return mediaResponse(result.bytes, headers, request);
      } catch { return fetcher(request); }
    },
  };
}
