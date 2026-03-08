const CACHE_NAME = 'giftcard-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first strategy: always try network, fall back to cache
self.addEventListener('fetch', (e) => {
  // Skip API calls
  if (e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  if (!e.data) return;

  const data = e.data.json();
  const options = {
    body: data.body,
    icon: '/apple-touch-icon.png',
    badge: '/apple-touch-icon.png',
    tag: data.tag || 'default',
    data: data.data || {},
    dir: 'rtl',
    lang: 'he',
    vibrate: [200, 100, 200],
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  const data = e.notification.data || {};
  let url = '/';

  if (data.type === 'appointment') {
    url = '/appointments';
  } else if (data.type === 'birthday' && data.id) {
    url = `/clients/${data.id}`;
  }

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
