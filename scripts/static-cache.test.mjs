import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createStaticCache, eligibleStatic, STATIC_CACHE_LIMITS } from "../js/static-cache-policy.mjs";

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

test("a stored file answers at once and is refreshed in the background", async () => {
  const caches = fakeCaches();
  let calls = 0, body = "v1";
  const fetcher = async (request) => { calls += 1; assert.equal(request.credentials, "omit"); return basic(body, "text/css"); };
  const background = [];
  const files = createStaticCache({ baseUrl: base, cacheStorage: caches, fetcher, now: () => 1000 });
  const first = await files.respond(get("css/styles.css?v=1"), (promise) => background.push(promise));
  assert.equal(await first.text(), "v1");
  assert.equal(background.length, 0, "a miss waits for the network itself");
  await new Promise((resolve) => setTimeout(resolve, 10));
  body = "v1-fixed";
  const second = await files.respond(get("css/styles.css?v=1"), (promise) => background.push(promise));
  assert.equal(second.headers.get("x-wifigate-static-cache"), "hit");
  assert.equal(await second.text(), "v1", "the stored copy answers without waiting");
  await Promise.all(background);
  assert.equal(calls, 2);
  const third = await files.respond(get("css/styles.css?v=1"), (promise) => background.push(promise));
  assert.equal(await third.text(), "v1-fixed", "an unbumped version heals on the next visit");
});

test("a new version replaces the old one and errors or wrong types are never stored", async () => {
  const caches = fakeCaches();
  const responses = { "css/a.css?v=1": () => basic("one", "text/css"), "css/a.css?v=2": () => basic("two", "text/css"),
    "js/x.js?v=1": () => basic("<html>", "text/html"), "assets/img/missing.webp": () => { const r = new Response("no", { status: 404, headers: { "content-type": "image/webp" } }); Object.defineProperty(r, "type", { value: "basic" }); return r; },
    "assets/img/private.webp": () => basic("p", "image/webp", { "cache-control": "private" }) };
  const fetcher = async (request) => responses[request.url.slice(base.length)]();
  const files = createStaticCache({ baseUrl: base, cacheStorage: caches, fetcher, now: () => 5 });
  for (const path of Object.keys(responses)) await (await files.respond(get(path))).text();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.deepEqual([...caches.stores.get(files.cacheName).keys()], [base + "css/a.css?v=2"]);
});

test("a failed network answer passes through and the entry limit evicts the oldest", async () => {
  const caches = fakeCaches();
  let clock = 0;
  const fetcher = async (request) => { if (request.url.includes("down")) throw new TypeError("offline"); return basic(request.url, "image/webp"); };
  const files = createStaticCache({ baseUrl: base, cacheStorage: caches, fetcher: async (request) => fetcher(request), now: () => clock, limits: { ...STATIC_CACHE_LIMITS, entries: 2 } });
  await assert.rejects(files.respond(get("assets/img/down.webp")), TypeError, "the browser sees the same network failure");
  for (const name of ["a", "b", "c"]) { clock += 1; await (await files.respond(get(`assets/img/${name}.webp`))).text(); await new Promise((resolve) => setTimeout(resolve, 5)); }
  assert.deepEqual([...caches.stores.get(files.cacheName).keys()].sort(), [base + "assets/img/b.webp", base + "assets/img/c.webp"]);
});

test("every public page registers the same worker that caches scene media", async () => {
  const worker = await readFile(new URL("../media-cache-sw.js", import.meta.url), "utf8");
  assert.match(worker, /createStaticCache/);
  assert.match(worker, /createMediaCache/);
  const register = await readFile(new URL("../js/site-cache.js", import.meta.url), "utf8");
  assert.match(register, /media-cache-sw\.js/);
  for (const page of ["index.html", "he/index.html", "he/shop/index.html", "he/login/index.html", "he/electric-gates/index.html", "he/privacy-policy/index.html", "404.html"]) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), "utf8");
    assert.equal((html.match(/js\/site-cache\.js\?v=/g) || []).length, 1, page);
  }
});
