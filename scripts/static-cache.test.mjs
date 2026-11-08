import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createStaticCache, eligibleStatic, isPrivatePage, STATIC_CACHE_LIMITS } from "../js/static-cache-policy.mjs";

const base = "https://wifigate.io/";
const get = (path, init) => new Request(base + path, init);

// A Cache Storage stand-in keyed by URL.
function fakeCaches() {
  const stores = new Map();
  return {
    stores,
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async match(key) { const hit = entries.get(typeof key === "string" ? key : key.url); return hit?.clone(); },
        async put(key, response) { entries.set(typeof key === "string" ? key : key.url, response); },
        async delete(key) { return entries.delete(typeof key === "string" ? key : key.url); },
        async keys() { return [...entries.keys()].map((url) => new Request(url)); },
      };
    },
  };
}

function basic(body, type, extra = {}) {
  const response = new Response(body, { status: 200, headers: { "content-type": type, ...extra } });
  Object.defineProperty(response, "type", { value: "basic" });
  return response;
}

test("only public static files qualify; code needs a version", () => {
  for (const path of ["css/styles.css?v=1", "js/shop-page.js?v=20261109b", "js/shop-3d.bundle.js?v=2", "fonts/inter.woff2", "assets/img/logo.webp", "assets/img/shop/3d/roller-front.webp?v=3", "favicon-32x32.png", "logo-1024.png"]) {
    assert.ok(eligibleStatic(get(path), base), path);
  }
  for (const [path, init] of [
    ["he/", undefined], ["index.html", undefined], ["css/styles.css", undefined], ["js/host-login.js", undefined],
    ["js/data.json?v=1", undefined], ["api/auth/login?v=1", undefined], ["dashboard/app.js?v=1", undefined],
    ["assets/vid/home/homepage-montage-720p.mp4?v=1", undefined], ["assets/img/a.webp?v=1&utm=x", undefined],
    ["assets/img/a.webp", { method: "POST", body: "x" }], ["assets/img/a.webp", { headers: { authorization: "Bearer x" } }],
    ["assets/img/a.webp", { headers: { range: "bytes=0-1" } }], ["assets/%E0%A4%A.webp", undefined],
  ]) assert.equal(eligibleStatic(get(path, init), base), null, path);
  assert.equal(eligibleStatic(new Request("https://cdn.example.com/css/a.css?v=1"), base), null, "other origins");
});

const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
const MIN = 60 * 1000;

test("a stored file answers at once and is re-checked with its ETag only after ten minutes", async () => {
  const caches = fakeCaches();
  const clock = { now: 1_000_000 }, seen = [];
  let body = "v1", etag = '"a"';
  const fetcher = async (request) => {
    seen.push(request.headers.get("if-none-match"));
    assert.equal(request.credentials, "omit");
    if (request.headers.get("if-none-match") === etag) { const r = new Response(null, { status: 304 }); Object.defineProperty(r, "type", { value: "basic" }); return r; }
    return basic(body, "text/css", { etag });
  };
  const background = [];
  const files = createStaticCache({ baseUrl: base, cacheStorage: caches, fetcher, now: () => clock.now });
  const keep = (promise) => background.push(promise);
  assert.equal(await (await files.respond(get("css/styles.css?v=1"), keep)).text(), "v1");
  await Promise.all(background);
  clock.now += 5 * MIN;
  const early = await files.respond(get("css/styles.css?v=1"), keep);
  assert.equal(early.headers.get("x-wifigate-static-cache"), "hit");
  assert.equal(seen.length, 1, "no network request within ten minutes");
  clock.now += 6 * MIN;
  assert.equal(await (await files.respond(get("css/styles.css?v=1"), keep)).text(), "v1");
  await Promise.all(background);
  assert.deepEqual(seen, [null, '"a"'], "the re-check is conditional and an unchanged file is not rewritten");
  body = "v1-fixed"; etag = '"b"';
  clock.now += 11 * MIN;
  assert.equal(await (await files.respond(get("css/styles.css?v=1"), keep)).text(), "v1", "the stored copy still answers at once");
  await Promise.all(background);
  assert.equal(await (await files.respond(get("css/styles.css?v=1"), keep)).text(), "v1-fixed", "an unbumped version heals on the next visit");
});

test("scripts and styles are reused for at most a day, images and fonts for a month", async () => {
  const caches = fakeCaches();
  const clock = { now: 0 };
  let calls = 0;
  const fetcher = async (request) => { calls += 1; return basic(`${request.url}#${calls}`, request.url.endsWith(".js?v=1") ? "text/javascript" : "image/webp"); };
  const files = createStaticCache({ baseUrl: base, cacheStorage: caches, fetcher, now: () => clock.now });
  for (const path of ["js/a.js?v=1", "assets/img/a.webp"]) await (await files.respond(get(path))).text();
  await tick();
  clock.now += 25 * 60 * MIN;
  const code = await files.respond(get("js/a.js?v=1"));
  assert.equal(code.headers.get("x-wifigate-static-cache"), null, "day-old code comes from the network");
  const image = await files.respond(get("assets/img/a.webp"));
  assert.equal(image.headers.get("x-wifigate-static-cache"), "hit");
});

test("a miss never waits for the cache write", async () => {
  const caches = fakeCaches();
  const original = caches.open.bind(caches);
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  caches.open = async (name) => { const cache = await original(name); return { ...cache, async put(...args) { await blocked; return cache.put(...args); } }; };
  const files = createStaticCache({ baseUrl: base, cacheStorage: caches, fetcher: async () => basic("x", "image/webp") });
  const saving = [];
  const first = await Promise.race([files.respond(get("assets/img/a.webp"), (promise) => saving.push(promise)), new Promise((resolve) => setTimeout(() => resolve("stuck"), 500))]);
  assert.notEqual(first, "stuck");
  const second = await Promise.race([files.respond(get("assets/img/b.webp"), (promise) => saving.push(promise)), new Promise((resolve) => setTimeout(() => resolve("stuck"), 500))]);
  assert.notEqual(second, "stuck", "a second miss is not queued behind the first write");
  release();
  await Promise.all(saving);
});

test("versions live side by side; errors, wrong types and private files are never stored", async () => {
  const caches = fakeCaches();
  const responses = { "css/a.css?v=1": () => basic("one", "text/css"), "css/a.css?v=2": () => basic("two", "text/css"),
    "js/x.js?v=1": () => basic("<html>", "text/html"), "assets/img/missing.webp": () => { const r = new Response("no", { status: 404, headers: { "content-type": "image/webp" } }); Object.defineProperty(r, "type", { value: "basic" }); return r; },
    "assets/img/private.webp": () => basic("p", "image/webp", { "cache-control": "private" }) };
  const fetcher = async (request) => responses[request.url.slice(base.length)]();
  const files = createStaticCache({ baseUrl: base, cacheStorage: caches, fetcher, now: () => 5 });
  const saving = [];
  for (const path of Object.keys(responses)) await (await files.respond(get(path), (promise) => saving.push(promise))).text();
  await Promise.all(saving);
  assert.deepEqual([...caches.stores.get(files.cacheName).keys()].sort(), [base + "css/a.css?v=1", base + "css/a.css?v=2"]);
});

test("a failed network answer passes through and the entry limit evicts the oldest", async () => {
  const caches = fakeCaches();
  let clock = 0;
  const fetcher = async (request) => { if (request.url.includes("down")) throw new TypeError("offline"); return basic(request.url, "image/webp"); };
  const files = createStaticCache({ baseUrl: base, cacheStorage: caches, fetcher, now: () => clock, limits: { ...STATIC_CACHE_LIMITS, entries: 2, pruneEvery: 1 } });
  await assert.rejects(files.respond(get("assets/img/down.webp")), TypeError, "the browser sees the same network failure");
  for (const name of ["a", "b", "c"]) { clock += 1; const saving = []; await (await files.respond(get(`assets/img/${name}.webp`), (promise) => saving.push(promise))).text(); await Promise.all(saving); }
  assert.deepEqual([...caches.stores.get(files.cacheName).keys()].sort(), [base + "assets/img/b.webp", base + "assets/img/c.webp"]);
});

test("sign-in and private app pages are recognised in every locale folder", () => {
  for (const page of ["login/", "he/login/", "zh-hans/login/", "dashboard/", "manager/", "pay/", "reservations/", "work/", "he/dashboard/?x=1"]) assert.equal(isPrivatePage(base + page, base), true, page);
  for (const page of ["", "he/", "wifigate-manager/", "he/wifigate-host/", "shop/", "he/shop/wifigate/", "payments-info/", "https://example.com/login/", ""]) assert.equal(isPrivatePage(page.startsWith("http") ? page : base + page, base), false, page);
  assert.equal(isPrivatePage("", base), false);
});

test("every public page registers the same worker that caches scene media", async () => {
  const worker = await readFile(new URL("../media-cache-sw.js", import.meta.url), "utf8");
  assert.match(worker, /createStaticCache/);
  assert.match(worker, /createMediaCache/);
  assert.match(worker, /isPrivatePage/, "files for sign-in and private apps stay on the network");
  const register = await readFile(new URL("../js/site-cache.js", import.meta.url), "utf8");
  assert.match(register, /media-cache-sw\.js/);
  for (const page of ["index.html", "he/index.html", "he/shop/index.html", "he/login/index.html", "he/electric-gates/index.html", "he/privacy-policy/index.html", "404.html"]) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), "utf8");
    assert.equal((html.match(/js\/site-cache\.js\?v=/g) || []).length, 1, page);
  }
});
