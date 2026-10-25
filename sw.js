/* Highway service worker.
 *
 * - App shell (HTML/CSS/JS/icons, same-origin): CACHE-FIRST, so the app opens instantly.
 * - Everything else (same-origin): NETWORK-FIRST, falling back to cache when offline.
 * - Cross-origin requests (the bridge: /api/*, /ws, uploads) are NEVER intercepted or
 *   cached. They carry Authorization headers and can include DM content; they go
 *   straight to the network.
 * - Web Push handlers are kept here because this file replaces the previous sw.js
 *   (highway.js registers 'sw.js' for push). Payload shape matches src/push.ts:
 *   {title, body, url?}.
 *
 * UPDATING: bump CACHE_VERSION on every deploy that changes a shell file. The old
 * cache is deleted on activate. Cache-first means a shell file will not refresh
 * until this version string changes.
 */
var CACHE_VERSION = "highway-shell-v7";
var SHELL = [
  "./",
  "index.html",
  "highway.js",
  "live.js",
  "haptics.js",
  "sensors.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-512-maskable.png",
  "icons/apple-touch-icon.png"
];
var SHELL_EXT = /\.(?:html|css|js|json|png|svg|ico|woff2?)$/i;

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      // Tolerate a missing file (e.g. index.html lives in money-city-ui, not this repo):
      // one 404 must not fail the whole install.
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () { /* skip */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return k.indexOf("highway-shell-") === 0 && k !== CACHE_VERSION;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isShellRequest(req, url) {
  if (req.mode === "navigate") return true;
  if (url.pathname.endsWith("/") ) return true;
  return SHELL_EXT.test(url.pathname);
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // bridge etc.: untouched

  if (isShellRequest(req, url)) {
    // cache-first
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () {
          if (req.mode === "navigate") return caches.match("index.html").then(function (r) { return r || caches.match("./"); });
          return Response.error();
        });
      })
    );
    return;
  }

  // network-first
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || Response.error(); });
    })
  );
});

/* ---- Web Push (carried over so installing this worker does not drop notifications) ---- */
self.addEventListener("push", function (event) {
  var data = { title: "Highway", body: "" };
  try { if (event.data) data = Object.assign(data, event.data.json()); }
  catch (e) { try { data.body = event.data.text(); } catch (_) { /* ignore */ } }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    data: { url: data.url || "./" }
  }));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) || "./";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (wins) {
      for (var i = 0; i < wins.length; i++) {
        if ("focus" in wins[i]) return wins[i].focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
