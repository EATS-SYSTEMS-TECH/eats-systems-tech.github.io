import { createMediaCache } from './js/media-cache-policy.mjs';

const media = createMediaCache({ baseUrl: new URL('./', self.location.href).href });
self.addEventListener('install', event => { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => { event.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', event => {
  // Requests outside the public media allowlist retain their normal network
  // behavior, including every document,private app,API and analytics request.
  if (media.eligible(event.request)) event.respondWith(media.respond(event.request));
});
