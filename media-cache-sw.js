import { createMediaCache } from './js/media-cache-policy.mjs';
import { createStaticCache } from './js/static-cache-policy.mjs?v=20261109cache2';

const baseUrl = new URL('./', self.location.href).href;
const media = createMediaCache({ baseUrl });
const files = createStaticCache({ baseUrl });
const isMedia = url => { try { return Boolean(media.eligible(new Request(url))); } catch { return true; } };
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  // Requests outside the public media and static file allowlists retain their
  // normal network behavior, including every document, private app, API and
  // analytics request.
  if (media.eligible(event.request)) event.respondWith(media.respond(event.request));
  else if (files.eligible(event.request)) event.respondWith(files.respond(event.request, promise => event.waitUntil(promise)));
});
self.addEventListener('message', event => {
  // A page lists the files it loaded before this worker took control.
  if (event.data?.type === 'wifigate-warm-static' && Array.isArray(event.data.urls)) event.waitUntil(files.warm(event.data.urls.filter(url => typeof url === 'string' && !isMedia(url))));
});
