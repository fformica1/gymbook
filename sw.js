const CACHE_NAME = 'gymbook-v1.13';
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
  './css/pages/routine-dettaglio.css',
  './js/main.js',
  './js/utils.js',
  './js/pages/home.js',
  './js/pages/plans.js',
  './js/pages/routine.js',
  './js/pages/exercises.js',
  './js/pages/workout.js',
  './js/pages/settings.js',
  './manifest.json',
  './icon.png',
  './icon-browser.png',
  './notification.mp3'
];

// Installazione: scarica e salva i file nella cache
self.addEventListener('install', (event) => {
  // Forza l'attivazione immediata del nuovo SW (Aggiornamento Automatico)
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Gestione click sulla notifica
self.addEventListener('notificationclick', (event) => {
  event.notification.close(); // Chiude la notifica

  // Recupera l'URL passato nei dati della notifica o usa la home come fallback
  const targetUrl = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : './index.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Cerca se c'è già una finestra aperta dell'app
      for (const client of clientList) {
        // Se la trova, la porta in primo piano e naviga alla pagina corretta
        if ('focus' in client) {
            return client.focus().then(focusedClient => focusedClient.navigate(targetUrl));
        }
      }
      // Se non c'è nessuna finestra aperta, ne apre una nuova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
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
  // Prende il controllo immediato delle pagine attive
  return self.clients.claim();
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