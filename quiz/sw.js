const CACHE_NAME = 'quiz-app-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/game.html',
  '/highscores.html',
  '/end.html',
  '/css/app.css',
  '/js/main.js',
  '/js/game.js',
  '/js/end.js',
  '/js/highscores.js',
  '/js/services/api.js',
  '/js/services/storage.js',
  '/assets/favicon.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});