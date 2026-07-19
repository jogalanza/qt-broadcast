const CACHE_NAME = 'callout-v21';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/mqtt-client.js',
  './js/settings.js',
  './js/sanitizer.js',
  './js/pagination.js',
  './js/wakelock.js',
  './js/install-prompt.js',
  './js/components/SenderView.js',
  './js/components/ReceiverView.js',
  './js/components/SettingsModal.js',
  './js/components/HelpModal.js',
  './js/components/AppMenu.js',
  './js/components/InstallBanner.js',
  './js/components/ConnectionOrb.js',
  './vendor/mqtt.min.js',
  './vendor/vue.global.prod.js',
  './vendor/tailwindcss-browser.global.js',
  './vendor/NoSleep.min.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isShellDoc = request.mode === 'navigate' || url.pathname.endsWith('.html');
  const isAppCode = url.pathname.includes('/js/') || url.pathname.endsWith('manifest.json');

  if (isShellDoc || isAppCode) {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return resp;
        })
    )
  );
});
