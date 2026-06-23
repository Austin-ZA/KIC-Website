const CACHE_NAME = 'kic-site-v1';
const ASSETS = [
  'Home.html',
  'style.css',
  'app.js',
  'manifest.json',
  'admin.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
