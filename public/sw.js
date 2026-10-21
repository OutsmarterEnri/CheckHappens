// Shell updates wait for open games to close; no forced activation.
const CACHE = "check-happens-v2-5-0-rooki-worlds";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const root = new URL("./", self.registration.scope);
      const response = await fetch(new URL("index.html", root), {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Shell unavailable");
      const html = await response.text();
      const assets = [
        ...html.matchAll(/(?:src|href)="([^\"]+\.(?:js|css))"/g),
      ].map((m) => new URL(m[1], root).href);
      const cache = await caches.open(CACHE);
      await cache.addAll(
        [
          "./",
          "index.html",
          "manifest.webmanifest",
          "THIRD_PARTY_NOTICES.txt",
          "icon.svg",
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/apple-touch-icon.png",
        ]
          .map((p) => new URL(p, root).href)
          .concat(assets),
      );
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (
          (key.startsWith("scacchi-uno-pocket-") ||
            key.startsWith("check-happens-")) &&
          key !== CACHE
        )
          await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (
    request.method !== "GET" ||
    new URL(request.url).pathname.startsWith("/api/") ||
    new URL(request.url).pathname === "/health" ||
    new URL(request.url).origin !== self.location.origin
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (request.mode === "navigate") {
        try {
          const r = await fetch(request);
          if (r.ok) return r;
        } catch {}
        return (
          (await cache.match(new URL("./", self.registration.scope).href)) ||
          Response.error()
        );
      }
      // Only public same-origin shell assets are precached. Preview/static hosts may
      // add Vary: Origin; module requests include Origin while precache requests do not.
      return (
        (await cache.match(request, { ignoreVary: true })) || fetch(request)
      );
    })(),
  );
});
