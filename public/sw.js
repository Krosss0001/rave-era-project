const CACHE_VERSION = "raveera-pwa-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const APP_SHELL_ASSETS = ["/", "/offline.html", "/event-placeholder.svg"];
const STATIC_DESTINATIONS = new Set(["style", "script", "image", "font"]);

function isHttpRequest(request) {
  return request.url.startsWith("http://") || request.url.startsWith("https://");
}

function isSensitiveRequest(requestUrl) {
  const { hostname, pathname } = new URL(requestUrl);

  return (
    hostname.includes("supabase") ||
    hostname.includes("solana") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/check-in") ||
    pathname.includes("supabase") ||
    pathname.includes("solana")
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName.startsWith("raveera-pwa-") && cacheName !== APP_SHELL_CACHE)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET" || !isHttpRequest(request)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match("/offline.html", { cacheName: APP_SHELL_CACHE });
        return fallback || Response.error();
      })
    );
    return;
  }

  if (
    new URL(request.url).origin === self.location.origin &&
    !isSensitiveRequest(request.url) &&
    STATIC_DESTINATIONS.has(request.destination)
  ) {
    event.respondWith(
      caches.open(APP_SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then((response) => {
            if (response.ok && response.type !== "opaque") {
              cache.put(request, response.clone());
            }

            return response;
          })
          .catch(() => cached);

        return cached || networkFetch;
      })
    );
  }
});
