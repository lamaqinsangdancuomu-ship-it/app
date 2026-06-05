const CACHE_NAME = "fawang-notebook-v47";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./assets/cover-home-final.png",
  "./assets/icon-bear.png",
  "./assets/favicon-64.png",
  "./assets/apple-touch-icon.png",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./assets/app-icon-maskable-512.png",
  "./assets/buli-gold-title.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("./index.html")));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.includes("/assets/")) {
    event.respondWith(cacheAssetOnDemand(request));
    return;
  }

  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});

function cacheAssetOnDemand(request) {
  return caches.open(CACHE_NAME).then((cache) =>
    cache.match(request).then((cached) => {
      const fetched = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || fetched;
    })
  );
}
