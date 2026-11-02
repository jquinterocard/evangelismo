/* Service worker de "Un Encuentro con Jesús".
 * - Recursos estáticos con hash (_next/static, íconos, fuentes): caché primero.
 * - Páginas HTML: red primero, con respaldo en caché si no hay conexión.
 * - Nunca intercepta peticiones a otros orígenes (p. ej. Supabase).
 */
const VERSION = "v1";
const STATIC_CACHE = `uecj-static-${VERSION}`;
const PAGE_CACHE = `uecj-pages-${VERSION}`;
const SCOPE = new URL(self.registration.scope).pathname; // incluye la ruta base

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      .then((c) => c.addAll([SCOPE, `${SCOPE}ensenanza/`, `${SCOPE}conociendo-a-jesus/`]).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("uecj-") && ![STATIC_CACHE, PAGE_CACHE].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  const isStatic = url.pathname.includes("/_next/static/") || url.pathname.includes("/icons/") || /\.(woff2?|png|svg|ico)$/.test(url.pathname);
  if (isStatic) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            // Se guarda sin la query (?qr=...) para servir la misma página sin conexión.
            caches.open(PAGE_CACHE).then((c) => c.put(url.origin + url.pathname, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(url.origin + url.pathname).then((hit) => hit || caches.match(SCOPE)).then((hit) => hit || Response.error()),
        ),
    );
  }
});
