const CACHE_VERSION = 'srz-v' + Date.now();

// On install — skip waiting so new SW activates immediately
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

// On activate — claim clients and clear old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, never serve stale HTML
self.addEventListener('fetch', function(event) {
  // Always fetch fresh from network, no caching
  event.respondWith(fetch(event.request));
});

// Push notifications
self.addEventListener('push', function(event) {
  let data = { title: 'Summerrockz GL', body: 'Nieuwe melding' };
  try { data = event.data.json(); } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: 'https://i.ibb.co/h1nY2LXH/SR-LOGO-CIRLCE-FULL-WHITE-RED-BG.png',
      badge: 'https://i.ibb.co/h1nY2LXH/SR-LOGO-CIRLCE-FULL-WHITE-RED-BG.png',
      vibrate: [200, 100, 200],
      tag: 'srz-notification',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://guestlist-kappa.vercel.app')
  );
});
