self.addEventListener('push', function(event) {
  let data = { title: 'Summerrockz GL', body: 'Nieuwe melding' };
  try {
    data = event.data.json();
  } catch(e) {}

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
