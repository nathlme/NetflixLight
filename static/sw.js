const CACHE_NAME = "netflixlight-v4";
const CORE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/static/css/output.css",
  "/static/img/icon-192.svg",
  "/static/img/icon-512.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const isSpaFragmentRequest = request.headers.get("x-spa-request") === "true";
  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isApiRequest = isSameOrigin && url.pathname.startsWith("/api/");
  const isDynamicFrontendAsset =
    isSameOrigin &&
    (url.pathname.startsWith("/js/") ||
      url.pathname.startsWith("/static/css/") ||
      url.pathname.startsWith("/static/javaScript/"));

  if (request.method !== "GET") {
    return;
  }

  // Never cache APIs to avoid stale auth/list/history sync.
  if (isApiRequest) {
    event.respondWith(fetch(request));
    return;
  }

  // Leave third-party requests to the browser network stack.
  if (!isSameOrigin) {
    event.respondWith(fetch(request));
    return;
  }

  // SPA fragment requests must bypass cache to avoid serving full layout HTML.
  if (isSpaFragmentRequest) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(request);
          if (cachedPage) return cachedPage;
          return caches.match("/");
        })
    );
    return;
  }

  // Keep frontend scripts/styles fresh while still allowing offline fallback.
  if (isDynamicFrontendAsset) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match("/"));
    })
  );
});
