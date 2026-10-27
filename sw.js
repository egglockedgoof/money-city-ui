/* PhantomWay service worker.
 *
 * - HTML / navigations: NETWORK-FIRST (short timeout), falling back to the cached shell when
 *   offline or slow. A stale cached index.html can therefore never pin an installed PWA.
 * - Other app shell files (CSS/JS/icons, same-origin): CACHE-FIRST, so the app opens instantly.
 * - Everything else (same-origin): NETWORK-FIRST, falling back to cache when offline.
 * - Cross-origin requests (the bridge: /api/*, /ws, uploads) are NEVER intercepted or
 *   cached. They carry Authorization headers and can include DM content; they go
 *   straight to the network.
 * - Web Push handlers are kept here because this file replaces the previous sw.js
 *   (highway.js registers 'sw.js' for push). Payload shape matches src/push.ts:
 *   {title, body, url?}.
 *
 * UPDATING: bump CACHE_VERSION on every deploy that changes a shell file. The old
 * cache is deleted on activate. Non-HTML shell files are cache-first, so they will not
 * refresh until this version string changes. Install fetches every shell file with
 * cache:"reload" so a new version never snapshots a stale HTTP-cached copy (GitHub Pages
 * sends max-age=600).
 */
var CACHE_VERSION = "phantomway-shell-v21";
var HTML_TIMEOUT_MS = 4000;
var SHELL = [
  "./",
  "index.html",
  "highway.css",
  "realm.css",
  "realm.js",
  "phantom-profile.js",
  "phantom-physics.js",
  "phantom-aether.js",
  "wallpaper.jpg",
  "highway.js",
  "live.js",
  "haptics.js",
  "sensors.js",
  "ear.js",
  "ear-app.js",
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
        return cache.add(new Request(url, { cache: "reload" })).catch(function () { /* skip */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) {
        return (k.indexOf("highway-shell-") === 0 || k.indexOf("phantomway-shell-") === 0) && k !== CACHE_VERSION;
      }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function isHtmlRequest(req, url) {
  if (req.mode === "navigate") return true;
  if (url.pathname.endsWith("/")) return true;
  return /\.html$/i.test(url.pathname);
}

function isShellRequest(req, url) {
  return SHELL_EXT.test(url.pathname);
}

function cachedShellHtml(req) {
  return caches.match(req, { ignoreSearch: true }).then(function (r) {
    return r || caches.match("index.html").then(function (r2) { return r2 || caches.match("./"); });
  });
}

// HTML: ask the network first (bypassing the HTTP cache), but never leave the person staring
// at a blank screen: after HTML_TIMEOUT_MS fall back to the cached shell while the fetch
// keeps going and refreshes the cache for next time.
function htmlNetworkFirst(req, url) {
  var network = fetch(url.href, { cache: "no-cache", credentials: "same-origin" }).then(function (res) {
    if (res && res.ok) {
      var copy = res.clone();
      caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
    }
    return res;
  });
  var timeout = new Promise(function (resolve) {
    setTimeout(function () { resolve(null); }, HTML_TIMEOUT_MS);
  });
  return Promise.race([network.catch(function () { return null; }), timeout]).then(function (res) {
    if (res) return res;
    return cachedShellHtml(req).then(function (hit) {
      if (hit) return hit;
      return network; // nothing cached at all: wait for the network
    });
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // bridge etc.: untouched

  if (isHtmlRequest(req, url)) {
    event.respondWith(htmlNetworkFirst(req, url));
    return;
  }

  var pathName = url.pathname || "";
  var base = pathName.split("/").pop() || "";
  var critical = /^(index\.html|highway\.js|highway\.css|sw\.js|manifest\.json)$/i.test(base) || pathName.endsWith("/");
  if (isShellRequest(req, url)) {
    if (critical) {
      event.respondWith(
        fetch(req, { cache: "no-cache", credentials: "same-origin" }).then(function (res) {
          if (res && res.ok) {
            var copy = res.clone();
            caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () {
          return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || Response.error(); });
        })
      );
      return;
    }
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
  var data = { title: "PhantomWay", body: "" };
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

self.addEventListener("message", function (event) {
  if (event && event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
