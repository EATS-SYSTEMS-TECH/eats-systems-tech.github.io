import assert from 'node:assert/strict';
import { createHash, webcrypto } from 'node:crypto';
import test from 'node:test';
import { eligibleMedia, parseMediaRange, mediaResponse, createMediaCache } from '../js/media-cache-policy.mjs';
const origin = 'https://example.test/owned/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const bytes = Buffer.from('0123456789abcdefghijklmnopqrstuvwxyz');
const url = (id = 'roller-shutters', body = bytes) => `${origin}assets/vid/use-cases/desktop/${id}-1080p.mp4?v=${hash(body).slice(0, 12)}`;
const request = (headers = {}, target = url()) => new Request(target, { headers });
const text = async response => Buffer.from(await response.arrayBuffer()).toString();
function memoryStorage({ quota = false } = {}) {
  const values = new Map();
  return { values, async open() { return {
    async keys() { return [...values.keys()].map(key => new Request(key)); },
    async match(key) { return values.get(typeof key === 'string' ? key : key.url)?.clone(); },
    async put(key, response) { if (quota) throw new DOMException('Full', 'QuotaExceededError'); assert.equal(response.status, 200, 'partial responses never enter CacheStorage'); values.set(typeof key === 'string' ? key : key.url, response.clone()); },
    async delete(key) { return values.delete(typeof key === 'string' ? key : key.url); },
  }; } };
}
function fixture(options = {}) {
  const storage = options.storage || memoryStorage(), calls = [];
  const handler = createMediaCache({ baseUrl: origin, cacheStorage: storage, crypto: webcrypto, ...options, fetcher: async req => { calls.push(req); if (options.failNetwork) throw new Error('offline'); return options.response ? options.response(req) : new Response(bytes, { headers: { 'content-type': 'video/mp4', 'cache-control': 'public,max-age=31536000,immutable', etag: '"version"', 'last-modified': 'Sun, 18 Oct 2026 10:00:00 GMT' } }); } });
  return { storage, calls, handler };
}

test('only anonymous same-origin SHA-versioned scene assets enter worker handling', () => {
  assert.ok(eligibleMedia(request(), origin));
  for (const target of [url().replace('example.test', 'other.test'), `${origin}host/private.mp4?v=${hash(bytes).slice(0, 12)}`, `${origin}api/roller-shutters.mp4?v=${hash(bytes).slice(0, 12)}`, url() + '&token=private', url().replace('?v=', '?q='), url().replace('/owned/', '/elsewhere/')]) assert.equal(eligibleMedia(request({}, target), origin), null);
  assert.equal(eligibleMedia(request({ authorization: 'Bearer fixture' }), origin), null);
  assert.equal(eligibleMedia(new Request(url(), { method: 'POST' }), origin), null);
  assert.equal(eligibleMedia(request({}, url().replace('roller-shutters-1080p', 'unapproved-1080p')), origin), null);
});

test('full200, inclusive/open/suffix206 and unsatisfiable416 have exact bytes/headers', async () => {
  const headers = { 'content-type': 'video/mp4', etag: '"version"' };
  for (const [range, status, expected, contentRange] of [[undefined, 200, bytes.toString(), null], ['bytes=2-5', 206, '2345', 'bytes 2-5/36'], ['bytes=33-', 206, 'xyz', 'bytes 33-35/36'], ['bytes=-3', 206, 'xyz', 'bytes 33-35/36'], ['bytes=99-', 416, '', 'bytes */36'], ['bytes=-0', 416, '', 'bytes */36'], ['bytes=4-2', 416, '', 'bytes */36'], ['bytes=0-1,4-5', 200, bytes.toString(), null], ['nonsense', 200, bytes.toString(), null]]) {
    const response = mediaResponse(bytes, headers, request(range ? { Range: range } : {}));
    assert.equal(response.status, status); assert.equal(response.headers.get('content-range'), contentRange); assert.equal(response.headers.get('accept-ranges'), 'bytes'); assert.equal(Number(response.headers.get('content-length')), expected.length); assert.equal(await text(response), expected);
  }
  assert.equal(mediaResponse(bytes, headers, request({ range: 'bytes=0-1', 'if-range': '"other"' })).status, 200);
  assert.equal(mediaResponse(bytes, headers, request({ range: 'bytes=0-1', 'if-range': '"version"' })).status, 206);
  assert.deepEqual(parseMediaRange('bytes=-100', 36), { start: 0, end: 35 });
  assert.deepEqual(parseMediaRange('bytes=-99999999999999999999', 36), { start: 0, end: 35 }, 'oversized suffix is the full range');
  assert.deepEqual(parseMediaRange('bytes=2-99999999999999999999', 36), { start: 2, end: 35 }, 'oversized end is clamped without numeric overflow');
});

test('first range fetches only complete chosen source once; reload/offline ranges reuse verified bytes', async () => {
  const f = fixture();
  const [a, b] = await Promise.all([f.handler.respond(request({ range: 'bytes=0-3' })), f.handler.respond(request({ range: 'bytes=4-7' }))]);
  assert.equal(await text(a), '0123'); assert.equal(await text(b), '4567'); assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].headers.get('range'), null); assert.equal(f.calls[0].credentials, 'omit'); assert.equal(f.storage.values.size, 1);
  const restarted = fixture({ storage: f.storage, failNetwork: true });
  const offline = await restarted.handler.respond(request({ range: 'bytes=-3' }));
  assert.equal(offline.headers.get('x-wifigate-media-cache'), 'hit');
  assert.equal(await text(offline), 'xyz');
  assert.equal(await text(await restarted.handler.respond(request())), bytes.toString()); assert.equal(restarted.calls.length, 0);
});

test('wrong version, private/no-store and partial responses are never persisted', async () => {
  for (const cacheControl of ['private', 'no-store']) {
    const f = fixture({ response: () => new Response(bytes, { headers: { 'content-type': 'video/mp4', 'cache-control': cacheControl } }) });
    assert.equal((await f.handler.respond(request({ range: 'bytes=0-3' }))).status, 206); assert.equal(f.storage.values.size, 0);
  }
  for (const vary of ['*', ' * ', 'Accept-Encoding, *']) {
    const f = fixture({ response: () => new Response(bytes, { headers: { 'content-type': 'video/mp4', vary } }) });
    assert.equal(await text(await f.handler.respond(request())), bytes.toString());
    assert.equal(f.storage.values.size, 0, 'Vary star responses are never persisted');
  }
  const wrong = fixture({ response: () => new Response('wrong bytes', { headers: { 'content-type': 'video/mp4' } }) });
  assert.equal((await wrong.handler.respond(request())).status, 502); assert.equal(wrong.storage.values.size, 0);
  const partial = fixture({ response: () => new Response('part', { status: 206 }) });
  assert.equal((await partial.handler.respond(request({ range: 'bytes=0-3' }))).status, 206); assert.equal(partial.storage.values.size, 0);
});

test('quota failure preserves playback; expiry and bounded eviction release only own entries', async () => {
  const quota = fixture({ storage: memoryStorage({ quota: true }) });
  assert.equal(await text(await quota.handler.respond(request({ range: 'bytes=0-3' }))), '0123'); assert.equal(quota.storage.values.size, 0);
  let clock = 1000;
  const f = fixture({ now: () => clock, limits: { bytes: 80, entries: 2, itemBytes: 50, ageMs: 100 } });
  await f.handler.respond(request({}, url('roller-shutters'))); clock++;
  await f.handler.respond(request({}, url('private-homes'))); clock++;
  await f.handler.respond(request({}, url('office-buildings')));
  assert.equal(f.storage.values.size, 2); assert.equal(f.storage.values.has(url('roller-shutters')), false);
  clock += 101; await f.handler.respond(request({}, url('hotels-airbnb'))); assert.equal(f.storage.values.size, 1);
});

test('new SHA versions replace stale same-path entries and corrupt cached bytes are refetched', async () => {
  const f = fixture(); await f.handler.respond(request());
  const replacement = Buffer.from('replacement bytes');
  const target = url('roller-shutters', replacement);
  const revised = fixture({ storage: f.storage, response: () => new Response(replacement, { headers: { 'content-type': 'video/mp4', 'cache-control': 'public' } }) });
  assert.equal(await text(await revised.handler.respond(request({}, target))), replacement.toString());
  assert.equal(f.storage.values.size, 1); assert.equal(f.storage.values.has(url()), false, 'old hash at the same path is pruned');
  const stored = f.storage.values.get(target);
  f.storage.values.set(target, new Response('corrupt', { headers: stored.headers }));
  assert.equal(await text(await revised.handler.respond(request({}, target))), replacement.toString());
  assert.equal(revised.calls.length, 2, 'corrupt entry is rejected and fetched again');
});
