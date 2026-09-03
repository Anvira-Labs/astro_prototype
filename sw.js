// Zodiac Bee — service worker: caches the app shell so it opens (and, once
// visited, keeps working) without a network connection. Your data itself
// lives in localStorage (see store.js), not here — this only caches code.
const CACHE_NAME = "zodiacbee-shell-v1";
const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/app.css",
  "./scripts/app.js",
  "./scripts/store.js",
  "./scripts/router.js",
  "./scripts/utils.js",
  "./scripts/views/home.js",
  "./scripts/views/chat.js",
  "./scripts/views/wallet.js",
  "./scripts/views/subscription.js",
  "./scripts/views/products.js",
  "./scripts/views/onboarding.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // cross-origin (Google Fonts) — let the browser handle it normally

  // Every route is a hash on index.html, so a navigation request is always
  // "give me the shell" — network-first so you get the latest build while
  // online, falling back to the cached shell the moment you're not.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }

  // Static assets: stale-while-revalidate — serve the cached copy instantly
  // if there is one, and refresh the cache in the background for next time.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
