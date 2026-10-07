/* CaseCoach service worker — hand-written, no build step.
   - App shell assets (/_next/static, icons): cache-first (they're content-hashed).
   - Exhibit images (/api/exhibits): cache-first.
   - Pages: network-first with a 4s timeout, then the saved copy, then /offline.
   - Next.js client navigations (RSC requests) are never cached; when offline they
     fail fast so Next falls back to a full page load, which the page cache serves.
   Only successful, non-redirected responses are stored, so a sign-in redirect is never cached. */
const V = "v1";
const STATIC = `cc-static-${V}`;
const PAGES = `cc-pages-${V}`;
const IMAGES = `cc-images-${V}`;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(PAGES).then((c) => c.add("/offline")).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("cc-") && !k.endsWith(V)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isRsc(req) {
  return req.headers.get("RSC") === "1" || new URL(req.url).searchParams.has("_rsc");
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok && !res.redirected) cache.put(req, res.clone());
  return res;
}

async function networkFirstPage(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await Promise.race([
      fetch(req),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000)),
    ]);
    if (res.ok && !res.redirected && res.headers.get("content-type")?.includes("text/html")) {
      cache.put(req.url.split("#")[0], res.clone());
    }
    return res;
  } catch {
    const hit = (await cache.match(req.url)) || (await cache.match(req.url, { ignoreSearch: true }));
    return hit || (await cache.match("/offline")) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(cacheFirst(req, STATIC));
    return;
  }
  if (url.pathname.startsWith("/api/exhibits/")) {
    event.respondWith(cacheFirst(req, IMAGES));
    return;
  }
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.pathname === "/login" || url.pathname.startsWith("/_next/")) return;
  if (isRsc(req)) return; // let Next handle; offline failure triggers a full navigation

  const wantsHtml = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (wantsHtml) event.respondWith(networkFirstPage(req));
});
