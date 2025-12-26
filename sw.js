const CACHE_NAME = 'gymbook-v1.7';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './piani.html',
  './routine.html',
  './routine-dettaglio.html',
  './esercizi.html',
  './allenamento.html',
  './impostazioni.html',
  './css/global.css',
  './css/components.css',
  './css/pages/home.css',
  './css/pages/workout.css',
  './js/main.js',
  './js/utils.js',
  './js/pages/home.js',
  './js/pages/plans.js',
  './js/pages/routine.js',
  './js/pages/exercises.js',
  './js/pages/workout.js',
  './js/pages/settings.js',
  './notification.mp3'
];

// Installazione: scarica e salva i file nella cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Attivazione: pulisce le vecchie cache quando il nuovo SW prende il controllo
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Rimozione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Attivazione e recupero: serve i file dalla cache se offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true })
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});