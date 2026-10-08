// Highway Chat service worker — push notifications
const CACHE = 'highway-v2';

// Take over immediately so new deploys are never stuck behind an old worker
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Highway Chat', body: 'New message', url: './highway-chat-widget.html' };
  try { if (event.data) data = Object.assign(data, event.data.json()); } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'highway-icons/icon-192.png',
      badge: 'highway-icons/icon-192.png',
      tag: 'highway-msg',
      renotify: true,
      data: { url: data.url }
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './highway-chat-widget.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return clients.openWindow(url);
    })
  );
});

// Minimal fetch: network-first, no offline caching of the live page
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Pages sends max-age=600; revalidate pages so a deploy shows up right away
  const isPage = event.request.mode === 'navigate' || event.request.destination === 'document';
  const net = isPage
    ? fetch(event.request.url, { cache: 'no-cache', credentials: 'same-origin' })
    : fetch(event.request);
  event.respondWith(net.catch(() => caches.match(event.request)));
});
