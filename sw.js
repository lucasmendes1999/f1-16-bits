// Increment this version whenever the local game files change.
const CACHE_PREFIX = 'f1-16-bits-';
const CACHE_NAME = `${CACHE_PREFIX}v9`;
const APP_FILES = [
  './', './index.html', './style.css', './game.js', './pwa.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png',
  './icons/icon-maskable-512.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache =>
    cache.addAll(APP_FILES.map(path => new Request(path, { cache: 'reload' })))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (!APP_FILES.some(path => new URL(path, self.registration.scope).pathname === url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Serve each installed version consistently, including while offline.
    const cached = await cache.match(event.request, { ignoreSearch: true });
    return cached || fetch(event.request);
  })());
});
