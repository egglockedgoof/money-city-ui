// Highway Chat service worker — push notifications
const CACHE = 'highway-v1';

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
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
